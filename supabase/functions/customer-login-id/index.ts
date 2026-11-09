// One-Line v221: login with an admin-issued cryptographically random Login ID.
// Public endpoint deliberately requires its own rate-limited, high-entropy bearer secret.
import { createClient } from 'npm:@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return String(obj.default);const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const sha=async(value:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(x=>x.toString(16).padStart(2,'0')).join('')
const failure=()=>json({error:'Invalid or disabled Login ID. Contact One-Line support for a replacement.'},401)
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  if(req.method!=='POST')return json({error:'Method not allowed.'},405)
  try{
    const db=admin()
    const rawIp=req.headers.get('cf-connecting-ip')||req.headers.get('x-real-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'
    const hashedIp=await sha(rawIp)
    const limit=await db.rpc('one_line_allow_login_id_attempt',{p_ip_hash:hashedIp})
    if(limit.error)return json({error:'Login unavailable. Please contact support.'},503)
    if(!limit.data)return json({error:'Too many login attempts from this network. Try again in 15 minutes.'},429)
    const body=await req.json()
    const loginId=String(body?.loginId||'').trim()
    if(!(/^[0-9]{6}$/.test(loginId)||/^OL-[A-Za-z0-9_-]{43}$/.test(loginId)))return failure()
    const key=await db.from('customer_login_keys').select('id,customer_id,active,customers(id,phone,name,business_name,job_title)').eq('token_hash',await sha(loginId)).eq('active',true).maybeSingle()
    if(key.error)return json({error:'Login is temporarily unavailable.'},503)
    if(!key.data?.customers)return failure()
    const customer:any=key.data.customers
    const bytes=crypto.getRandomValues(new Uint8Array(32))
    const sessionToken=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('')
    const expires=new Date(Date.now()+30*24*3600*1000).toISOString()
    const newSession=await db.from('customer_sessions').insert({customer_id:key.data.customer_id,token_hash:await sha(sessionToken),expires_at:expires,login_key_id:key.data.id})
    if(newSession.error)return json({error:'Could not create a session. Try again.'},503)
    await Promise.allSettled([
      db.from('customer_login_keys').update({last_used_at:new Date().toISOString()}).eq('id',key.data.id),
      db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',customer.id)
    ])
    return json({ok:true,session:{token:sessionToken,customerId:customer.id,phone:customer.phone,name:customer.name,businessName:customer.business_name||'',jobTitle:customer.job_title||'',expiresAt:expires}})
  }catch(_){return json({error:'Could not sign in. Please try again.'},500)}
})
