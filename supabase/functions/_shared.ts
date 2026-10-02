import { createClient } from 'npm:@supabase/supabase-js@2'
export const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
export const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
export const secretKey=()=>{
  const packed=Deno.env.get('SUPABASE_SECRET_KEYS');
  if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''
}
export const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
export const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
export const cleanPhone=(v:unknown)=>{let n=String(v||'').replace(/\D/g,'');if(n.length===10)n='91'+n;return n}
export async function resolveCustomerSession(token:string){const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}
export async function requirePortalUser(req:Request,roles:string[]){const auth=req.headers.get('Authorization')||'';const db=admin();const jwt=auth.replace(/^Bearer\s+/i,'');if(!jwt)return null;const {data:{user}}=await db.auth.getUser(jwt);if(!user)return null;const {data}=await db.from('profiles').select('*').eq('id',user.id).maybeSingle();if(!data?.active||!roles.includes(data.role))return null;return {user,profile:data}}
