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

async function upsertPortalAccount(db:any,spec:{name:string;username:string;password:string;role:string}){
  const username=cleanUsername(spec.username),email=emailFor(username)
  let {data:profile,error:profileError}=await db.from('profiles').select('*').eq('username',username).maybeSingle()
  if(profileError)throw profileError
  if(profile?.id){
    const u=await db.auth.admin.updateUserById(profile.id,{email,password:spec.password,email_confirm:true,user_metadata:{username,name:spec.name,role:spec.role}})
    if(u.error)throw u.error
    const q=await db.from('profiles').update({name:spec.name,role:spec.role,active:true,updated_at:new Date().toISOString()}).eq('id',profile.id).select().single()
    if(q.error)throw q.error
    return q.data
  }
  const listed=await db.auth.admin.listUsers({page:1,perPage:1000})
  if(listed.error)throw listed.error
  const existing=(listed.data?.users||[]).find((u:any)=>String(u.email||'').toLowerCase()===email)
  let userId=''
  if(existing){
    userId=existing.id
    const u=await db.auth.admin.updateUserById(existing.id,{password:spec.password,email_confirm:true,user_metadata:{username,name:spec.name,role:spec.role}})
    if(u.error)throw u.error
  }else{
    const created=await db.auth.admin.createUser({email,password:spec.password,email_confirm:true,user_metadata:{username,name:spec.name,role:spec.role}})
    if(created.error)throw created.error
    userId=created.data.user.id
  }
  const q=await db.from('profiles').upsert({id:userId,username,name:spec.name,role:spec.role,active:true,updated_at:new Date().toISOString()}).select().single()
  if(q.error)throw q.error
  return q.data
}

async function adminFeed(db:any){
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
  return {orders,orderItems,enquiries:enquiriesQ.data||[]}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const portal=await requireAdmin(req)
    if(!portal)return json({error:'Admin authorization required.'},403)
    const body=await req.json(),action=String(body.action||''),db=admin()

    if(action==='admin_feed')return json({ok:true,...await adminFeed(db)})

    if(action==='bootstrap_defaults'){
      const defaults=[
        {name:'Admin',username:'adminhere',password:'admin22',role:'admin'},
        {name:'Management',username:'managementhere',password:'manage22',role:'management'},
        {name:'Staff',username:'staffhere',password:'staff220',role:'staff'},
      ]
      const profiles=[]
      for(const spec of defaults)profiles.push(await upsertPortalAccount(db,spec))
      return json({ok:true,profiles})
    }

    if(action==='create'){
      const username=cleanUsername(body.username),password=String(body.password||''),name=String(body.name||'').trim(),role=String(body.role||'staff')
      if(!username||password.length<6||!name||!allowedRoles.includes(role))return json({error:'Name, username, role and a 6+ character password are required.'},400)
      const created=await db.auth.admin.createUser({email:emailFor(username),password,email_confirm:true,user_metadata:{username,name,role}})
      if(created.error)throw created.error
      const q=await db.from('profiles').insert({id:created.data.user.id,username,name,role,active:true}).select().single()
      if(q.error){await db.auth.admin.deleteUser(created.data.user.id);throw q.error}
      return json({ok:true,profile:q.data})
    }

    if(action==='update'){
      const id=String(body.id||''),patch:any={}
      for(const k of ['name','role','active'])if(body[k]!==undefined)patch[k]=body[k]
      if(body.username!==undefined){
        const username=cleanUsername(body.username)
        if(!username)return json({error:'Invalid username.'},400)
        patch.username=username
        const u=await db.auth.admin.updateUserById(id,{email:emailFor(username),email_confirm:true,user_metadata:{username}})
        if(u.error)throw u.error
      }
      patch.updated_at=new Date().toISOString()
      if(patch.role&&!allowedRoles.includes(patch.role))return json({error:'Invalid role.'},400)
      const q=await db.from('profiles').update(patch).eq('id',id).select().single()
      if(q.error)throw q.error
      if(body.password){
        if(String(body.password).length<6)return json({error:'Password must be at least 6 characters.'},400)
        const u=await db.auth.admin.updateUserById(id,{password:String(body.password)})
        if(u.error)throw u.error
      }
      return json({ok:true,profile:q.data})
    }
    return json({error:'Unsupported action.'},400)
  }catch(e){return json({error:e instanceof Error?e.message:'Account action failed.'},400)}
})
