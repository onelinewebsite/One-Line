import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'
function decodeDataUrl(value:string){
  const m=value.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)return null;const bin=atob(m[2]),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{type:m[1],bytes,ext:m[1].split('/')[1].replace('jpeg','jpg')};
}
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const body=await req.json(),s=await resolveCustomerSession(String(body.token||''));if(!s)return json({error:'Session expired. Verify your number again.'},401);const db=admin();
    const customer=(s as any).customers||{},details=body.details||body,items=Array.isArray(body.items)?structuredClone(body.items):[];
    for(const item of items){
      if(item?.itemType==='team_design'&&item?.design?.artworkDataUrl){const decoded=decodeDataUrl(String(item.design.artworkDataUrl));if(decoded){const path=`orders/${s.customer_id}/${crypto.randomUUID()}.${decoded.ext}`;const up=await db.storage.from('product-images').upload(path,decoded.bytes,{contentType:decoded.type,cacheControl:'31536000',upsert:false});if(up.error)throw up.error;item.design.artworkUrl=db.storage.from('product-images').getPublicUrl(path).data.publicUrl;delete item.design.artworkDataUrl;}}
    }
    const q=await db.rpc('place_bulk_order',{p_customer_id:s.customer_id,p_customer_name:String(details.customerName||details.name||customer.name||''),p_phone:String(customer.phone||details.phone||''),p_address:String(details.address||''),p_business:String(details.business||''),p_delivery:String(body.delivery||''),p_payment:String(body.payment||''),p_items:items});if(q.error)throw q.error;
    await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'order_placed',payload:{order:q.data}});
    return json({ok:true,order:q.data});
  }catch(e){return json({error:e instanceof Error?e.message:'Order could not be placed.'},400)}
})
