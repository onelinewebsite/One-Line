import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'

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

async function uploadOrderImage(db:any,customerId:string,value:any,label:string){
  const decoded=decodeDataUrl(String(value||''));if(!decoded)return '';
  const clean=String(label||'design').replace(/[^a-z0-9_-]+/gi,'-').slice(0,48)||'design';
  const path=`orders/${customerId}/${crypto.randomUUID()}-${clean}.${decoded.ext}`;
  const up=await db.storage.from('product-images').upload(path,decoded.bytes,{contentType:decoded.type,cacheControl:'31536000',upsert:false});if(up.error)throw up.error;
  return db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
async function persistTeamDesignAssets(db:any,customerId:string,raw:any){
  const design=structuredClone(raw||{}),sides=design?.design||design;
  for(const sideName of ['front','back']){
    const side=sides?.[sideName];if(!side)continue;
    if(side.backgroundDataUrl){side.backgroundUrl=await uploadOrderImage(db,customerId,side.backgroundDataUrl,sideName+'-original');delete side.backgroundDataUrl;}
    if(side.compositeDataUrl){side.compositeUrl=await uploadOrderImage(db,customerId,side.compositeDataUrl,sideName+'-final');delete side.compositeDataUrl;}
    if(Array.isArray(side.layers))for(let i=0;i<side.layers.length;i++){
      const layer=side.layers[i];if(!layer||layer.type!=='image')continue;
      if(layer.originalDataUrl){layer.originalImageUrl=await uploadOrderImage(db,customerId,layer.originalDataUrl,sideName+'-logo-original-'+(i+1));delete layer.originalDataUrl;}
      if(layer.imageDataUrl){layer.imageUrl=await uploadOrderImage(db,customerId,layer.imageDataUrl,sideName+'-logo-preview-'+(i+1));delete layer.imageDataUrl;}
      if(!layer.originalImageUrl&&layer.imageUrl)layer.originalImageUrl=layer.imageUrl;
    }
  }
  return design;
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
    const directOrder=body.directOrder===true;
    const browserItems=Array.isArray(body.items)?body.items:[];
    const sourceItems=directOrder?browserItems:(serverCart.length?serverCart:browserItems);
    const items=sourceItems.map(normalizeOrderItem);

    for(const item of items){
      if(item?.itemType==='team_design')item.design=await persistTeamDesignAssets(db,s.customer_id,item.design||{});
      else if(item?.design?.artworkDataUrl){const decoded=decodeDataUrl(String(item.design.artworkDataUrl));if(decoded){const path=`orders/${s.customer_id}/${crypto.randomUUID()}.${decoded.ext}`;const up=await db.storage.from('product-images').upload(path,decoded.bytes,{contentType:decoded.type,cacheControl:'31536000',upsert:false});if(up.error)throw up.error;item.design.artworkUrl=db.storage.from('product-images').getPublicUrl(path).data.publicUrl;delete item.design.artworkDataUrl;}}
    }
    const customerName=String(details.customerName||details.name||customer.name||'').trim().slice(0,120);
    const business=String(details.business||customer.business_name||'').trim().slice(0,160);
    const q=await db.rpc('place_bulk_order',{p_customer_id:s.customer_id,p_customer_name:customerName,p_phone:String(customer.phone||details.phone||''),p_address:String(details.address||''),p_business:business,p_delivery:String(body.delivery||''),p_payment:String(body.payment||''),p_items:items});if(q.error)throw q.error;
    await db.from('customers').update({name:customerName||customer.name||'',business_name:business||customer.business_name||'',updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id);
    if(!directOrder){const cleared=await db.rpc('customer_cart_mutate',{p_customer_id:s.customer_id,p_operation:'clear',p_item_key:null,p_item:null});if(cleared.error)console.error('Order placed but cart clear failed:',cleared.error.message);}
    const verify=await db.from('order_items').select('id,item_type,design_json').eq('order_id',q.data.id);if(verify.error)throw verify.error;
    const teamItems=(verify.data||[]).filter((x:any)=>x.item_type==='team_design');
    for(const saved of teamItems){const d=saved.design_json||{},front=d?.design?.front||d?.front||{},back=d?.design?.back||d?.back||{};if(!front.compositeUrl||!back.compositeUrl||!Array.isArray(d.roster))throw new Error('Team enquiry was not fully saved. Please try again.');for(const side of [front,back])for(const layer of side.layers||[]){if(layer?.type==='image'&&(!layer.imageUrl||!layer.originalImageUrl))throw new Error('One of the uploaded logo files was not fully saved. Please try again.');}}
    await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'order_placed',payload:{order:q.data,directOrder}});
    for(const item of items.filter((x:any)=>x.itemType==='team_design')){const a=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'team_design_enquiry',payload:{...item.design,orderId:q.data.id,orderCode:q.data.orderCode}});if(a.error)console.error('Team enquiry activity log failed:',a.error.message);}
    return json({ok:true,order:q.data,verified:true});
  }catch(e){return json({error:e instanceof Error?e.message:'Order could not be placed.'},400)}
})
