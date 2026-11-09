// One-Line v222: Private categories/items accessible only to their assigned signed-in customers.
import { createClient } from 'npm:@supabase/supabase-js@2'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,x-client-info,apikey,content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'content-type':'application/json'}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return String(obj.default);const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const sha=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('')
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
 if(req.method!=='POST')return json({error:'Method not allowed'},405)
 try{
  const data=await req.json(),token=String(data?.token||'').trim()
  if(!token || token.length>256)return json({error:'Login required'},401)
  const db=admin()
  const session=await db.from('customer_sessions').select('customer_id,expires_at,login_key_id').eq('token_hash',await sha(token)).gt('expires_at',new Date().toISOString()).maybeSingle()
  if(session.error || !session.data)return json({error:'Session expired'},401)
  if(session.data.login_key_id){const key=await db.from('customer_login_keys').select('active').eq('id',session.data.login_key_id).maybeSingle();if(key.error||!key.data?.active)return json({error:'Login revoked'},401)}
  const grants=await db.from('customer_category_access').select('category_id').eq('customer_id',session.data.customer_id)
  if(grants.error)throw grants.error
  const ids=(grants.data||[]).map(x=>x.category_id)
  if(!ids.length)return json({ok:true,categories:[],items:[]})
  const cats=await db.from('custom_catalog_categories').select('*').in('id',ids).eq('access_restricted',true).eq('active',true)
  if(cats.error)throw cats.error
  const visible=(cats.data||[]).map(c=>c.id)
  if(!visible.length)return json({ok:true,categories:[],items:[]})
  const items=await db.from('custom_catalog_items').select('*').in('category_id',visible).eq('active',true).limit(3000)
  if(items.error)throw items.error
  return json({ok:true,categories:cats.data||[],items:items.data||[]})
 }catch(_){return json({error:'Could not load assigned categories'},503)}
})
