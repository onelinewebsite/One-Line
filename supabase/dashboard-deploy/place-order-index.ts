import { createClient } from 'npm:@supabase/supabase-js@2'
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function resolveCustomerSession(token:string){const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}

function decodeDataUrl(value:string){
  const m=value.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)return null;const bin=atob(m[2]),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{type:m[1],bytes,ext:m[1].split('/')[1].replace('jpeg','jpg')};
}
function normalizeOrderItem(item:any){
  const type=String(item?.itemType||'product')
  if(type==='team_design'||type==='custom_design'){
    return {itemType:type,name:item?.name||'Custom design',code:item?.code||'CUSTOM',qty:Number(item?.qty||1),unitPrice:Number(item?.price||0),design:item?.design||item?.customDesign||{},groupKey:item?.key||''}
  }
  if(item?.lines)return item // transition compatibility with v40 request shape
  return {itemType:'product',productId:item?.productId,name:item?.name||'',code:item?.code||'',lines:Array.isArray(item?.bulkLines)?item.bulkLines:[],subitems:Array.isArray(item?.subitems)?item.subitems:[],groupKey:item?.key||''}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const body=await req.json(),s=await resolveCustomerSession(String(body.token||''));if(!s)return json({error:'Session expired. Verify your number again.'},401);const db=admin();
    const customer=(s as any).customers||{},details=body.details||body;

    // v41: the server cart is canonical. The browser request is only a legacy fallback
    // while an older cached tab is being upgraded.
    const cartQ=await db.from('customer_carts').select('items').eq('customer_id',s.customer_id).maybeSingle();if(cartQ.error)throw cartQ.error;
    const serverCart=Array.isArray(cartQ.data?.items)?cartQ.data.items:[];
    const sourceItems=serverCart.length?serverCart:(Array.isArray(body.items)?body.items:[]);
    const items=sourceItems.map(normalizeOrderItem);

    for(const item of items){
      if(item?.itemType==='team_design'&&item?.design?.artworkDataUrl){const decoded=decodeDataUrl(String(item.design.artworkDataUrl));if(decoded){const path=`orders/${s.customer_id}/${crypto.randomUUID()}.${decoded.ext}`;const up=await db.storage.from('product-images').upload(path,decoded.bytes,{contentType:decoded.type,cacheControl:'31536000',upsert:false});if(up.error)throw up.error;item.design.artworkUrl=db.storage.from('product-images').getPublicUrl(path).data.publicUrl;delete item.design.artworkDataUrl;}}
    }
    const customerName=String(details.customerName||details.name||customer.name||'').trim().slice(0,120);
    const business=String(details.business||customer.business_name||'').trim().slice(0,160);
    const q=await db.rpc('place_bulk_order',{p_customer_id:s.customer_id,p_customer_name:customerName,p_phone:String(customer.phone||details.phone||''),p_address:String(details.address||''),p_business:business,p_delivery:String(body.delivery||''),p_payment:String(body.payment||''),p_items:items});if(q.error)throw q.error;
    await db.from('customers').update({name:customerName||customer.name||'',business_name:business||customer.business_name||'',updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id);
    const cleared=await db.rpc('customer_cart_mutate',{p_customer_id:s.customer_id,p_operation:'clear',p_item_key:null,p_item:null});
    if(cleared.error)console.error('Order placed but cart clear failed:',cleared.error.message);
    await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'order_placed',payload:{order:q.data}});
    return json({ok:true,order:q.data});
  }catch(e){return json({error:e instanceof Error?e.message:'Order could not be placed.'},400)}
})
