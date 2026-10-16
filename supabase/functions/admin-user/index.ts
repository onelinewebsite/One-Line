import { createClient } from "npm:@supabase/supabase-js@2"

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const cleanUsername=(username:string)=>String(username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'')
const emailFor=(username:string)=>cleanUsername(username)+'@staff.oneline.local'
const allowedRoles=['admin','management','staff']

async function requireAdmin(req:Request){
  const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
  if(!jwt)return null
  const db=admin();const {data:{user}}=await db.auth.getUser(jwt)
  if(!user)return null
  const {data}=await db.from('profiles').select('*').eq('id',user.id).maybeSingle()
  if(!data?.active||data.role!=='admin')return null
  return {user,profile:data}
}

// Account creation is intentionally explicit. Never recreate/reset default users.
// The server checks permission independently of the Admin UI.
const strongPassword=(value:unknown,username:string)=>{
  const password=String(value||'');
  return password.length>=12&&password.length<=128&&/[A-Za-z]/.test(password)&&/\d/.test(password)
    &&(!username||!password.toLowerCase().includes(username.toLowerCase()));
};
const validUsername=(value:unknown)=>{
  const raw=String(value||'').trim().toLowerCase();
  return raw.length>=3&&raw.length<=50&&/^[a-z0-9][a-z0-9._-]*$/.test(raw)?raw:'';
};
const validUUID=(value:unknown)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));

async function adminFeed(db:any,syncToken=''){
  // Compare compact change records before transferring potentially large design JSON.
  const [oh,eh]=await Promise.all([
    db.from('orders').select('id,updated_at,status,total').order('created_at',{ascending:false}).limit(1000),
    db.from('customer_activity').select('id,created_at').in('event_type',['custom_catalog_enquiry','team_design_enquiry']).order('created_at',{ascending:false}).limit(1000)
  ]);
  if(oh.error)throw oh.error;if(eh.error)throw eh.error;
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([oh.data,eh.data])));
  const token=Array.from(new Uint8Array(bytes)).map(v=>v.toString(16).padStart(2,'0')).join('');
  if(syncToken===token)return {unchanged:true,syncToken:token};
  const [ordersQ,enquiriesQ]=await Promise.all([
    db.from('orders').select('*').order('created_at',{ascending:false}).limit(1000),
    db.from('customer_activity').select('*,customers(id,name,phone,business_name,job_title,created_at,last_seen_at)').in('event_type',['custom_catalog_enquiry','team_design_enquiry']).order('created_at',{ascending:false}).limit(1000)
  ])
  if(ordersQ.error)throw ordersQ.error
  if(enquiriesQ.error)throw enquiriesQ.error
  // Hide any old production-unit transfer records that may already exist in the live database.
  const orders=(ordersQ.data||[]).filter((o:any)=>o.metadata?.unit_transfer!==true)
  const ids=orders.map((o:any)=>o.id),orderItems:any[]=[]
  for(let start=0;start<ids.length;start+=100){
    const batch=ids.slice(start,start+100)
    for(let offset=0;;offset+=500){
      const page=await db.from('order_items').select('*').in('order_id',batch).order('created_at',{ascending:true}).order('id').range(offset,offset+499)
      if(page.error)throw page.error
      orderItems.push(...(page.data||[]))
      if((page.data||[]).length<500)break
    }
  }
  return {orders,orderItems,enquiries:enquiriesQ.data||[],syncToken:token}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const portal=await requireAdmin(req)
    if(!portal)return json({error:'Admin authorization required.'},403)
    if(req.method!=='POST')return json({error:'Method not allowed.'},405)
    const body=await req.json(),action=String(body.action||''),db=admin()

    if(action==='admin_feed')return json({ok:true,...await adminFeed(db,String(body.syncToken||''))})

    if(action==='create'){
      const username=validUsername(body.username),password=String(body.password||''),name=String(body.name||'').trim(),role=String(body.role||'staff')
      if(!username||!name||name.length>120||!allowedRoles.includes(role))return json({error:'Enter a valid name, username and role.'},400)
      if(!strongPassword(password,username))return json({error:'Use a unique 12–128 character password with letters and numbers, excluding the username.'},400)
      const created=await db.auth.admin.createUser({email:emailFor(username),password,email_confirm:true,user_metadata:{username,name,role}})
      if(created.error)throw created.error
      const q=await db.from('profiles').insert({id:created.data.user.id,username,name,role,active:true}).select().single()
      if(q.error){await db.auth.admin.deleteUser(created.data.user.id);throw q.error}
      return json({ok:true,profile:q.data})
    }

    if(action==='update'){
      const id=String(body.id||'')
      if(!validUUID(id))return json({error:'Invalid account ID.'},400)
      const existingQ=await db.from('profiles').select('id,name,username,role,active').eq('id',id).maybeSingle()
      if(existingQ.error)throw existingQ.error
      const existing=existingQ.data
      if(!existing)return json({error:'Account not found.'},404)
      const patch:any={updated_at:new Date().toISOString()}
      if(body.name!==undefined){
        const name=String(body.name||'').trim()
        if(!name||name.length>120)return json({error:'Enter a valid account name.'},400)
        patch.name=name
      }
      if(body.role!==undefined){
        const role=String(body.role)
        if(!allowedRoles.includes(role))return json({error:'Invalid role.'},400)
        patch.role=role
      }
      if(body.active!==undefined){
        if(typeof body.active!=='boolean')return json({error:'Invalid account status.'},400)
        patch.active=body.active
      }
      if(body.username!==undefined){
        const username=validUsername(body.username)
        if(!username)return json({error:'Invalid username. Use 3–50 lowercase letters, numbers, dots, hyphens or underscores.'},400)
        patch.username=username
      }
      const password=body.password===undefined?'':String(body.password||'')
      if(password&&!strongPassword(password,patch.username||existing.username))return json({error:'Use a unique 12–128 character password with letters and numbers, excluding the username.'},400)
      // Do not lock out the last administrator or allow self-demotion.
      if(existing.role==='admin'&&existing.active&&((patch.role&&patch.role!=='admin')||patch.active===false)){
        if(id===portal.user.id)return json({error:'You cannot disable or demote your own administrator account.'},400)
        const countQ=await db.from('profiles').select('id',{count:'exact',head:true}).eq('role','admin').eq('active',true)
        if(countQ.error)throw countQ.error
        if((countQ.count||0)<=1)return json({error:'Keep at least one active administrator.'},400)
      }
      // Only send changed credentials to Auth. Validate all inputs before updating anything.
      const authPatch:any={}
      if(patch.username&&patch.username!==existing.username){authPatch.email=emailFor(patch.username);authPatch.email_confirm=true;authPatch.user_metadata={username:patch.username}}
      if(password)authPatch.password=password
      if(Object.keys(authPatch).length){const u=await db.auth.admin.updateUserById(id,authPatch);if(u.error)throw u.error}
      const q=await db.from('profiles').update(patch).eq('id',id).select().single()
      if(q.error)throw q.error
      return json({ok:true,profile:q.data})
    }
    return json({error:'Unsupported action.'},400)
  }catch(e){return json({error:e instanceof Error?e.message:'Account action failed.'},400)}
})
