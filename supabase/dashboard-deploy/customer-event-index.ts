import { createClient } from 'npm:@supabase/supabase-js@2'
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function resolveCustomerSession(token:string){const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}

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
      // v41 carts are mutated atomically through customer-account. Ignore old
      // whole-cart snapshots so a stale v40 tab cannot overwrite another device.
      return json({ok:true,ignored:true,reason:'server_cart_v41'})
    }

    const q=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:type,payload:safePayload})
    if(q.error)throw q.error
    await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
    return json({ok:true})
  }catch(e){return json({error:e instanceof Error?e.message:'Could not save activity.'},500)}
})
