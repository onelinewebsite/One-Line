import { cors,json,admin,resolveCustomerSession } from '../_shared.ts'
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const {token,event_type,payload}=await req.json();const s=await resolveCustomerSession(String(token||''));if(!s)return json({error:'Session expired.'},401);const db=admin(),type=String(event_type||'activity').slice(0,80),safePayload=payload||{};
    if(type==='customer_name'&&String(safePayload?.name||'').trim()){
      const name=String(safePayload.name).trim().slice(0,120);const q=await db.from('customers').update({name,last_seen_at:new Date().toISOString()}).eq('id',s.customer_id);if(q.error)throw q.error;
    }
    const q=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:type,payload:safePayload});if(q.error)throw q.error;return json({ok:true});
  }catch(e){return json({error:e instanceof Error?e.message:'Could not save activity.'},500)}
})
