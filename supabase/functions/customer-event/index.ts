import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const {token,event_type,payload}=await req.json()
    const s=await resolveCustomerSession(String(token||''))
    if(!s)return json({error:'Session expired.'},401)
    const db=admin(),type=String(event_type||'activity').slice(0,80),safePayload=payload&&typeof payload==='object'?payload:{}

    if(type==='customer_name'&&String((safePayload as any)?.name||'').trim()){
      const name=String((safePayload as any).name).trim().slice(0,120)
      const q=await db.from('customers').update({name,updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
      if(q.error)throw q.error
    }

    if(type==='cart_sync'){
      const items=Array.isArray((safePayload as any)?.items)?(safePayload as any).items.slice(0,100):[]
      const pieceCount=Math.max(0,Math.min(100000,Number((safePayload as any)?.pieceCount||0)))
      const total=Math.max(0,Number((safePayload as any)?.total||0))
      const q=await db.from('customer_carts').upsert({customer_id:s.customer_id,items,piece_count:pieceCount,total,updated_at:new Date().toISOString()},{onConflict:'customer_id'})
      if(q.error)throw q.error
      await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
      return json({ok:true})
    }

    const q=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:type,payload:safePayload})
    if(q.error)throw q.error
    await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
    return json({ok:true})
  }catch(e){return json({error:e instanceof Error?e.message:'Could not save activity.'},500)}
})
