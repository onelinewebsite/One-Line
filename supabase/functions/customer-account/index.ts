import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'

const text=(v:unknown,max=120)=>String(v||'').trim().slice(0,max)
const nowIso=()=>new Date().toISOString()

function customerJson(c:any){
  return {
    id:c?.id||'',phone:c?.phone||'',name:c?.name||'',
    businessName:c?.business_name||'',jobTitle:c?.job_title||'',
    createdAt:c?.created_at||'',updatedAt:c?.updated_at||'',lastSeenAt:c?.last_seen_at||''
  }
}
function cartJson(c:any){
  return c?{
    items:Array.isArray(c.items)?c.items:[],pieceCount:Number(c.piece_count||0),
    total:Number(c.total||0),version:Number(c.version||0),updatedAt:c.updated_at||''
  }:{items:[],pieceCount:0,total:0,version:0,updatedAt:''}
}
async function ordersMeta(db:any,customerId:string){
  const q=await db.from('orders').select('updated_at',{count:'exact'}).eq('customer_id',customerId).order('updated_at',{ascending:false}).limit(1)
  if(q.error)throw q.error
  return {count:Number(q.count||0),updatedAt:q.data?.[0]?.updated_at||''}
}
async function enquiriesMeta(db:any,customerId:string){
  const q=await db.from('customer_activity').select('created_at',{count:'exact'}).eq('customer_id',customerId).eq('event_type','custom_catalog_enquiry').order('created_at',{ascending:false}).limit(1)
  if(q.error)throw q.error
  return {count:Number(q.count||0),updatedAt:q.data?.[0]?.created_at||''}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const body=await req.json(),token=String(body?.token||''),action=String(body?.action||'get')
    const s=await resolveCustomerSession(token)
    if(!s)return json({error:'Session expired. Verify your number again.'},401)
    const db=admin(),customerId=String(s.customer_id)

    if(action==='update'){
      const patch={
        name:text(body?.profile?.name,120),
        business_name:text(body?.profile?.businessName,160),
        job_title:text(body?.profile?.jobTitle,120),
        updated_at:nowIso(),last_seen_at:nowIso()
      }
      if(patch.name.length<2)return json({error:'Enter your name.'},400)
      const q=await db.from('customers').update(patch).eq('id',customerId).select('*').single()
      if(q.error)throw q.error
      await db.from('customer_activity').insert({customer_id:customerId,event_type:'profile_updated',payload:{businessName:patch.business_name,jobTitle:patch.job_title}})
      return json({ok:true,customer:customerJson(q.data)})
    }

    if(action==='custom_catalog_enquiry'){
      const safePayload=body?.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload:{}
      const itemId=text((safePayload as any)?.itemId,180)
      const itemTitle=text((safePayload as any)?.itemTitle,240)
      if(!itemId&&!itemTitle)return json({error:'Custom Catalogue item is required.'},400)
      const payloadSize=new TextEncoder().encode(JSON.stringify(safePayload)).byteLength
      if(payloadSize>1_000_000)return json({error:'This Custom Catalogue enquiry is too large. Please try again.'},413)
      const q=await db.from('customer_activity').insert({
        customer_id:customerId,
        event_type:'custom_catalog_enquiry',
        payload:safePayload
      }).select('id,created_at').single()
      if(q.error)throw q.error
      await db.from('customers').update({last_seen_at:nowIso()}).eq('id',customerId)
      return json({ok:true,enquiry:{id:q.data.id,createdAt:q.data.created_at}})
    }

    if(action==='cart_mutate'){
      const operation=String(body?.operation||'').toLowerCase()
      if(!['upsert','remove','clear'].includes(operation))return json({error:'Invalid cart operation.'},400)
      const item=body?.item&&typeof body.item==='object'?body.item:null
      const itemKey=text(body?.itemKey||item?.key,180)
      if(operation!=='clear'&&!itemKey)return json({error:'Cart item key is required.'},400)
      if(operation==='upsert'){
        if(!item)return json({error:'Cart item is required.'},400)
        ;(item as any).key=itemKey
        const size=new TextEncoder().encode(JSON.stringify(item)).byteLength
        if(size>8_000_000)return json({error:'This cart item is too large to sync. Reduce the uploaded artwork size and try again.'},413)
      }
      const q=await db.rpc('customer_cart_mutate',{p_customer_id:customerId,p_operation:operation,p_item_key:itemKey||null,p_item:item})
      if(q.error)throw q.error
      const row=Array.isArray(q.data)?q.data[0]:q.data
      await db.from('customers').update({last_seen_at:nowIso()}).eq('id',customerId)
      return json({ok:true,cart:cartJson(row)})
    }

    if(action==='sync'){
      const [customerQ,cartQ,meta,enquiryMeta]=await Promise.all([
        db.from('customers').select('*').eq('id',customerId).single(),
        db.from('customer_carts').select('piece_count,total,version,updated_at').eq('customer_id',customerId).maybeSingle(),
        ordersMeta(db,customerId),
        enquiriesMeta(db,customerId)
      ])
      if(customerQ.error)throw customerQ.error
      if(cartQ.error)throw cartQ.error
      const c=customerQ.data
      if(Date.now()-new Date(c.last_seen_at||0).getTime()>60000){
        await db.from('customers').update({last_seen_at:nowIso()}).eq('id',customerId)
      }
      const cart=cartQ.data?{pieceCount:Number(cartQ.data.piece_count||0),total:Number(cartQ.data.total||0),version:Number(cartQ.data.version||0),updatedAt:cartQ.data.updated_at||''}:{pieceCount:0,total:0,version:0,updatedAt:''}
      return json({ok:true,customer:customerJson(c),cart,ordersMeta:meta,enquiriesMeta:enquiryMeta})
    }

    const [customerQ,cartQ,ordersQ,enquiriesQ]=await Promise.all([
      db.from('customers').select('*').eq('id',customerId).single(),
      db.from('customer_carts').select('*').eq('customer_id',customerId).maybeSingle(),
      db.from('orders').select('*,order_items(*)').eq('customer_id',customerId).order('created_at',{ascending:false}).limit(100),
      db.from('customer_activity').select('id,event_type,payload,created_at').eq('customer_id',customerId).eq('event_type','custom_catalog_enquiry').order('created_at',{ascending:false}).limit(100)
    ])
    if(customerQ.error)throw customerQ.error
    if(cartQ.error)throw cartQ.error
    if(ordersQ.error)throw ordersQ.error
    if(enquiriesQ.error)throw enquiriesQ.error
    const latest=(ordersQ.data||[]).reduce((m:any,o:any)=>String(o.updated_at||'')>m?String(o.updated_at||''):m,'')
    const latestEnquiry=(enquiriesQ.data||[]).reduce((m:any,e:any)=>String(e.created_at||'')>m?String(e.created_at||''):m,'')
    await db.from('customers').update({last_seen_at:nowIso()}).eq('id',customerId)
    return json({
      ok:true,customer:customerJson(customerQ.data),cart:cartJson(cartQ.data),
      orders:ordersQ.data||[],ordersMeta:{count:(ordersQ.data||[]).length,updatedAt:latest},
      enquiries:enquiriesQ.data||[],enquiriesMeta:{count:(enquiriesQ.data||[]).length,updatedAt:latestEnquiry}
    })
  }catch(e){return json({error:e instanceof Error?e.message:'Could not load customer account.'},500)}
})
