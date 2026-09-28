import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'

const text=(v:unknown,max=120)=>String(v||'').trim().slice(0,max)

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const body=await req.json(),token=String(body?.token||''),action=String(body?.action||'get')
    const s=await resolveCustomerSession(token)
    if(!s)return json({error:'Session expired. Verify your number again.'},401)
    const db=admin(),customerId=s.customer_id

    if(action==='update'){
      const patch={
        name:text(body?.profile?.name,120),
        business_name:text(body?.profile?.businessName,160),
        job_title:text(body?.profile?.jobTitle,120),
        updated_at:new Date().toISOString(),
        last_seen_at:new Date().toISOString()
      }
      if(patch.name.length<2)return json({error:'Enter your name.'},400)
      const q=await db.from('customers').update(patch).eq('id',customerId).select('*').single()
      if(q.error)throw q.error
      await db.from('customer_activity').insert({customer_id:customerId,event_type:'profile_updated',payload:{businessName:patch.business_name,jobTitle:patch.job_title}})
      return json({ok:true,customer:{id:q.data.id,phone:q.data.phone,name:q.data.name,businessName:q.data.business_name||'',jobTitle:q.data.job_title||'',createdAt:q.data.created_at,lastSeenAt:q.data.last_seen_at}})
    }

    const [customerQ,cartQ,ordersQ]=await Promise.all([
      db.from('customers').select('*').eq('id',customerId).single(),
      db.from('customer_carts').select('*').eq('customer_id',customerId).maybeSingle(),
      db.from('orders').select('*,order_items(*)').eq('customer_id',customerId).order('created_at',{ascending:false}).limit(100)
    ])
    if(customerQ.error)throw customerQ.error
    if(cartQ.error)throw cartQ.error
    if(ordersQ.error)throw ordersQ.error
    await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',customerId)
    const c=customerQ.data
    return json({
      ok:true,
      customer:{id:c.id,phone:c.phone,name:c.name,businessName:c.business_name||'',jobTitle:c.job_title||'',createdAt:c.created_at,lastSeenAt:c.last_seen_at},
      cart:cartQ.data?{items:Array.isArray(cartQ.data.items)?cartQ.data.items:[],pieceCount:Number(cartQ.data.piece_count||0),total:Number(cartQ.data.total||0),updatedAt:cartQ.data.updated_at}:null,
      orders:ordersQ.data||[]
    })
  }catch(e){return json({error:e instanceof Error?e.message:'Could not load customer account.'},500)}
})
