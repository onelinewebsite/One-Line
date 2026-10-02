import { createClient } from "npm:@supabase/supabase-js@2"

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function resolveCustomerSession(token:string){if(!token)return null;const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}
const trim=(v:unknown,max=240)=>String(v??'').trim().slice(0,max)
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0}

async function saveCatalogEnquiry(db:any,s:any,payload:any){
  const customer=(s as any).customers||{}
  const itemId=trim(payload?.itemId,180),itemTitle=trim(payload?.itemTitle||payload?.title,240)
  if(!itemId&&!itemTitle)throw new Error('Custom Catalogue item is required.')
  const size=new TextEncoder().encode(JSON.stringify(payload||{})).byteLength
  if(size>1_000_000)throw new Error('This Custom Catalogue enquiry is too large. Please try again.')

  const random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase()
  const stamp=new Date().toISOString().replace(/\D/g,'').slice(2,14)
  const orderCode='ENQ-'+stamp+'-'+random
  const rate=Math.max(0,num(payload?.itemRate??payload?.fabricRate))
  const metadata={custom_catalog_enquiry:true,enquiry_payload:payload,source:'customization_catalogue',submitted_at:new Date().toISOString()}

  const orderQ=await db.from('orders').insert({
    order_code:orderCode,
    customer_id:s.customer_id,
    customer_name:trim(customer.name,120),
    phone:trim(customer.phone,40),
    address:'',
    business:trim(customer.business_name,160),
    delivery:'Custom Catalogue enquiry',
    payment:'Quote pending',
    status:'Enquiry',
    total:rate,
    metadata
  }).select('*').single()
  if(orderQ.error)throw orderQ.error

  const lineQ=await db.from('order_items').insert({
    order_id:orderQ.data.id,
    product_id:null,
    item_type:'custom_catalog_enquiry',
    item_name:itemTitle||'Custom Catalogue enquiry',
    item_code:'',color:'',size:'',qty:1,unit_price:rate,
    design_json:payload,
    group_key:'custom_catalog:'+itemId
  }).select('id').single()
  if(lineQ.error){await db.from('orders').delete().eq('id',orderQ.data.id);throw lineQ.error}

  // Keep the customer enquiry history and older admin builds compatible.
  const activityPayload={...payload,orderId:orderQ.data.id,orderCode:orderQ.data.order_code}
  const activityQ=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'custom_catalog_enquiry',payload:activityPayload})
  if(activityQ.error)console.error('Enquiry activity mirror failed:',activityQ.error.message)
  await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
  return {order:orderQ.data,activityPayload}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const body=await req.json(),token=String(body?.token||''),type=String(body?.event_type||'activity').slice(0,80),payload=body?.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload:{}
    const s=await resolveCustomerSession(token)
    if(!s)return json({error:'Session expired. Verify your number again.'},401)
    const db=admin()

    if(type==='customer_name'&&trim((payload as any)?.name,120)){
      const name=trim((payload as any).name,120)
      const q=await db.from('customers').update({name,updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
      if(q.error)throw q.error
    }
    if(type==='cart_sync')return json({ok:true,ignored:true,reason:'server_cart_v41'})

    if(type==='custom_catalog_enquiry'){
      const saved=await saveCatalogEnquiry(db,s,payload)
      return json({ok:true,enquiry:{id:saved.order.id,orderCode:saved.order.order_code,createdAt:saved.order.created_at},order:saved.order})
    }

    const q=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:type,payload})
    if(q.error)throw q.error
    await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
    return json({ok:true})
  }catch(e){return json({error:e instanceof Error?e.message:'Could not save activity.'},500)}
})
