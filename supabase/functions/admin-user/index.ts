import { createClient } from "npm:@supabase/supabase-js@2"

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const cleanUsername=(username:string)=>String(username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'')
const emailFor=(username:string)=>cleanUsername(username)+'@staff.oneline.local'
const allowedRoles=['admin','management','staff','receiver']

async function requirePortalUser(req:Request,roles:string[]){
  const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'')
  if(!jwt)return null
  const db=admin();const {data:{user}}=await db.auth.getUser(jwt)
  if(!user)return null
  const {data}=await db.from('profiles').select('*').eq('id',user.id).maybeSingle()
  if(!data?.active||!roles.includes(data.role))return null
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

const transferSummary=(row:any)=>({
  order_id:row.id,
  order_code:row.order_code,
  created_at:row.created_at,
  source_key:String(row.metadata?.source_key||''),
  source_type:String(row.metadata?.source_type||''),
  source_id:String(row.metadata?.source_id||''),
  source_label:String(row.metadata?.source_label||''),
})

async function listUnitTransfers(db:any){
  const q=await db.from('orders').select('id,order_code,metadata,created_at').contains('metadata',{unit_transfer:true}).order('created_at',{ascending:false}).limit(1000)
  if(q.error)throw q.error
  return (q.data||[]).map(transferSummary)
}

async function adminFeed(db:any){
  const [ordersQ,enquiriesQ]=await Promise.all([
    db.from('orders').select('*').order('created_at',{ascending:false}).limit(1000),
    db.from('customer_activity').select('*,customers(id,name,phone,business_name,job_title,created_at,last_seen_at)').in('event_type',['custom_catalog_enquiry','team_design_enquiry']).order('created_at',{ascending:false}).limit(1000)
  ])
  if(ordersQ.error)throw ordersQ.error
  if(enquiriesQ.error)throw enquiriesQ.error
  const orders=(ordersQ.data||[]).filter((o:any)=>o.metadata?.unit_transfer!==true)
  const ids=orders.map((o:any)=>o.id)
  const orderItems:any[]=[]
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

async function createUnitTransfer(db:any,portal:any,body:any){
  const sourceType=String(body.source_type||'').trim(),sourceId=String(body.source_id||'').trim()
  if(!['ready_made','custom_catalog','order','order_item','enquiry'].includes(sourceType)||!sourceId)return json({error:'Invalid Unit Transfer item.'},400)
  const sourceKey=sourceType+':'+sourceId
  const existing=await db.from('orders').select('id,order_code,metadata,created_at').contains('metadata',{unit_transfer:true,source_key:sourceKey}).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(existing.error)throw existing.error
  if(existing.data)return json({ok:true,already:true,transfer:transferSummary(existing.data)})

  if(sourceType==='order'){
    const sourceOrder=await db.from('orders').select('*').eq('id',sourceId).maybeSingle()
    if(sourceOrder.error)throw sourceOrder.error
    if(!sourceOrder.data)return json({error:'Customer order not found.'},404)
    if(sourceOrder.data.metadata?.unit_transfer===true)return json({error:'A Unit Transfer cannot be transferred again.'},400)
    const sourceLines=await db.from('order_items').select('*').eq('order_id',sourceId).order('created_at',{ascending:true}).order('id')
    if(sourceLines.error)throw sourceLines.error
    if(!(sourceLines.data||[]).length)return json({error:'This order has no items to transfer.'},400)

    const random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase(),stamp=new Date().toISOString().replace(/\D/g,'').slice(2,14)
    const orderCode='UNIT-'+stamp+'-'+random
    const metadata={unit_transfer:true,source_type:'order',source_id:sourceId,source_key:sourceKey,source_label:'Customer Order',source_order_code:sourceOrder.data.order_code||'',transferred_by:portal.profile.id,transferred_by_name:portal.profile.name||portal.profile.username||'',transferred_at:new Date().toISOString()}
    const inserted=await db.from('orders').insert({order_code:orderCode,customer_name:'Production Unit',phone:'',address:'',business:'',delivery:'Unit transfer',payment:'Internal',status:'Transferred',total:Number(sourceOrder.data.total||0),metadata}).select().single()
    if(inserted.error)throw inserted.error

    const copied:any[]=[]
    for(const line of sourceLines.data||[]){
      const original=(line.design_json&&typeof line.design_json==='object')?line.design_json:{}
      let productSnapshot:any={}
      if(line.product_id){
        const product=await db.from('products').select('id,name,description,images,product_type,option_title').eq('id',line.product_id).maybeSingle()
        if(!product.error&&product.data)productSnapshot={images:product.data.images||[],description:product.data.description||'',product_type:product.data.product_type||'',option_title:product.data.option_title||''}
      }else if(line.subitem_id){
        const subitem=await db.from('subitems').select('id,name,images,option_title').eq('id',line.subitem_id).maybeSingle()
        if(!subitem.error&&subitem.data)productSnapshot={images:subitem.data.images||[],option_title:subitem.data.option_title||''}
      }
      copied.push({
        order_id:inserted.data.id,product_id:line.product_id||null,subitem_id:line.subitem_id||null,item_type:line.item_type||'product',item_name:line.item_name||'Order item',item_code:line.item_code||'',color:line.color||'',size:line.size||'',qty:Math.max(1,Number(line.qty||1)),unit_price:Number(line.unit_price||0),
        design_json:{...original,unit_snapshot:{...(original.unit_snapshot||{}),...productSnapshot,source_type:'order',source_order_id:sourceOrder.data.id,source_order_code:sourceOrder.data.order_code||'',customer_name:sourceOrder.data.customer_name||sourceOrder.data.business||'',phone:sourceOrder.data.phone||'',address:sourceOrder.data.address||'',delivery:sourceOrder.data.delivery||'',payment:sourceOrder.data.payment||'',color:line.color||'',size:line.size||''}},
        group_key:sourceKey+':'+String(line.id||'')
      })
    }
    const copiedInsert=await db.from('order_items').insert(copied)
    if(copiedInsert.error){await db.from('orders').delete().eq('id',inserted.data.id);throw copiedInsert.error}
    return json({ok:true,transfer:transferSummary(inserted.data)})
  }

  let itemName='',itemCode='',qty=1,unitPrice=0,itemType='product',productId=null as string|null,subitemId=null as string|null,lineColor='',lineSize='',design:any={}
  let sourceLabel=''

  if(sourceType==='ready_made'){
    const p=await db.from('products').select('*').eq('id',sourceId).maybeSingle();if(p.error)throw p.error;if(!p.data)return json({error:'Ready Made item not found.'},404)
    const [variants,category,subcat]=await Promise.all([
      db.from('product_variants').select('*').eq('product_id',sourceId),
      p.data.category_id?db.from('categories').select('id,name').eq('id',p.data.category_id).maybeSingle():Promise.resolve({data:null,error:null}),
      p.data.subcategory_id?db.from('subcategories').select('id,name').eq('id',p.data.subcategory_id).maybeSingle():Promise.resolve({data:null,error:null}),
    ])
    if(variants.error)throw variants.error;if(category.error)throw category.error;if(subcat.error)throw subcat.error
    itemName=String(p.data.name||'Ready Made');itemCode=String(p.data.code||'');unitPrice=Number(p.data.price||0);productId=p.data.id;itemType='product';sourceLabel='Ready Made'
    design={unit_snapshot:{source_type:sourceType,images:p.data.images||[],description:p.data.description||'',category:category.data?.name||'',subcategory:subcat.data?.name||'',product_type:p.data.product_type||'',option_title:p.data.option_title||'',stock:Number(p.data.stock||0),variants:variants.data||[]}}
  }else if(sourceType==='custom_catalog'){
    const i=await db.from('custom_catalog_items').select('*').eq('id',sourceId).maybeSingle();if(i.error)throw i.error;if(!i.data)return json({error:'Custom Catalogue item not found.'},404)
    const category=i.data.category_id?await db.from('custom_catalog_categories').select('id,name,description').eq('id',i.data.category_id).maybeSingle():{data:null,error:null};if(category.error)throw category.error
    const categoryName=String(category.data?.name||''),categoryKey=categoryName.toLowerCase(),fabricOptions=i.data.fabric_options||{},selectedOptions:any[]=[]
    if(fabricOptions?.uniform_features){const top=String(fabricOptions.uniform_features.top||'').trim(),bottom=String(fabricOptions.uniform_features.bottom||'').trim();if(top)selectedOptions.push({label:'Top',value:top});if(bottom)selectedOptions.push({label:'Bottom',value:bottom})}
    else if(categoryKey.includes('sports')){
      const [types,fabrics]=await Promise.all([db.from('custom_sportswear_types').select('*'),db.from('custom_sportswear_fabrics').select('*')])
      if(!types.error)for(const id of (fabricOptions.types||[])){const row=(types.data||[]).find((x:any)=>String(x.id)===String(id));if(row)selectedOptions.push({label:'Type',value:row.name,adjustment:Number(row.price_adjustment||0)})}
      if(!fabrics.error)for(const [id,qualities] of Object.entries(fabricOptions.fabrics||{})){const row=(fabrics.data||[]).find((x:any)=>String(x.id)===String(id));if(row)selectedOptions.push({label:'Fabric',value:row.name,qualities:Array.isArray(qualities)?qualities:[]})}
    }else{
      const fabrics=await db.from('custom_catalog_fabrics').select('*')
      if(!fabrics.error)for(const [id,qualities] of Object.entries(fabricOptions||{})){const row=(fabrics.data||[]).find((x:any)=>String(x.id)===String(id));if(row)selectedOptions.push({label:'Fabric',value:row.name,qualities:Array.isArray(qualities)?qualities:[]})}
    }
    itemName=String(i.data.title||'Custom Catalogue');itemCode='';unitPrice=Number(i.data.rate||0);itemType='custom_catalog';sourceLabel='Custom Catalogue'
    design={unit_snapshot:{source_type:sourceType,images:i.data.images||[],description:i.data.description||'',category:categoryName,rate:i.data.rate,fabric_options:fabricOptions,selected_options:selectedOptions,sort_order:i.data.sort_order||0}}
  }else if(sourceType==='enquiry'){
    const e=await db.from('customer_activity').select('*').eq('id',sourceId).maybeSingle();if(e.error)throw e.error;if(!e.data)return json({error:'Customer enquiry not found.'},404)
    if(!['custom_catalog_enquiry','team_design_enquiry'].includes(String(e.data.event_type||'')))return json({error:'This activity is not a transferable enquiry.'},400)
    const customer=e.data.customer_id?await db.from('customers').select('id,name,phone,business_name,job_title').eq('id',e.data.customer_id).maybeSingle():{data:null,error:null};if(customer.error)throw customer.error
    const p=e.data.payload&&typeof e.data.payload==='object'?e.data.payload:{},team=e.data.event_type==='team_design_enquiry'
    itemName=String(team?(p.title||'Team creative design'):(p.itemTitle||p.title||'Custom Catalogue enquiry'))
    itemCode=team?'TEAM':'ENQUIRY';qty=team?Math.max(1,Number(p.rowCount||(Array.isArray(p.roster)?p.roster.length:1))):Math.max(1,Number(p.qty||1));unitPrice=Number(p.itemRate||p.rate||0);itemType=team?'team_design':'custom_catalog_enquiry';sourceLabel=team?'Team Enquiry':'Custom Catalogue Enquiry'
    const snapshot={source_type:sourceType,source_enquiry_id:e.data.id,customer_name:customer.data?.name||'',phone:customer.data?.phone||'',business:customer.data?.business_name||'',job_title:customer.data?.job_title||'',images:Array.isArray(p.images)?p.images:(p.image?[p.image]:[]),description:p.itemDescription||p.description||'',category:p.categoryName||'',selected_options:[p.garmentTypeName?{label:'Type',value:p.garmentTypeName}:null,p.fabricName?{label:'Fabric',value:p.fabricName}:null,p.fabricQuality?{label:'Quality',value:p.fabricQuality}:null].filter(Boolean),enquiry_payload:p}
    design=team?{...p,unit_snapshot:snapshot}:{unit_snapshot:snapshot,enquiry_payload:p}
  }else{
    const line=await db.from('order_items').select('*').eq('id',sourceId).maybeSingle();if(line.error)throw line.error;if(!line.data)return json({error:'Order item not found.'},404)
    const order=await db.from('orders').select('*').eq('id',line.data.order_id).maybeSingle();if(order.error)throw order.error;if(!order.data)return json({error:'Source customer order not found.'},404)
    if(order.data.metadata?.unit_transfer===true)return json({error:'A Unit Transfer cannot be transferred again.'},400)
    itemName=String(line.data.item_name||'Order item');itemCode=String(line.data.item_code||'');qty=Math.max(1,Number(line.data.qty||1));unitPrice=Number(line.data.unit_price||0);itemType=String(line.data.item_type||'product');productId=line.data.product_id||null;subitemId=line.data.subitem_id||null;lineColor=String(line.data.color||'');lineSize=String(line.data.size||'');sourceLabel='Customer Order Item'
    const original=(line.data.design_json&&typeof line.data.design_json==='object')?line.data.design_json:{}
    let productSnapshot:any={}
    if(line.data.product_id){const p=await db.from('products').select('id,name,description,images,product_type,option_title').eq('id',line.data.product_id).maybeSingle();if(!p.error&&p.data)productSnapshot={images:p.data.images||[],description:p.data.description||'',product_type:p.data.product_type||'',option_title:p.data.option_title||''}}else if(line.data.subitem_id){const si=await db.from('subitems').select('id,name,images,option_title').eq('id',line.data.subitem_id).maybeSingle();if(!si.error&&si.data)productSnapshot={images:si.data.images||[],option_title:si.data.option_title||''}}
    design={...original,unit_snapshot:{...(original.unit_snapshot||{}),...productSnapshot,source_type:sourceType,source_order_id:order.data.id,source_order_code:order.data.order_code,customer_name:order.data.customer_name||order.data.business||'',phone:order.data.phone||'',address:order.data.address||'',delivery:order.data.delivery||'',payment:order.data.payment||'',color:line.data.color||'',size:line.data.size||''}}
  }

  const random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase(),stamp=new Date().toISOString().replace(/\D/g,'').slice(2,14)
  const orderCode='UNIT-'+stamp+'-'+random
  const metadata={unit_transfer:true,source_type:sourceType,source_id:sourceId,source_key:sourceKey,source_label:sourceLabel,transferred_by:portal.profile.id,transferred_by_name:portal.profile.name||portal.profile.username||'',transferred_at:new Date().toISOString()}
  const inserted=await db.from('orders').insert({order_code:orderCode,customer_name:'Production Unit',phone:'',address:'',business:'',delivery:'Unit transfer',payment:'Internal',status:'Transferred',total:unitPrice*qty,metadata}).select().single()
  if(inserted.error)throw inserted.error
  const lineInsert=await db.from('order_items').insert({order_id:inserted.data.id,product_id:productId,subitem_id:subitemId,item_type:itemType,item_name:itemName,item_code:itemCode,color:lineColor,size:lineSize,qty,unit_price:unitPrice,design_json:design,group_key:sourceKey})
  if(lineInsert.error){await db.from('orders').delete().eq('id',inserted.data.id);throw lineInsert.error}
  return json({ok:true,transfer:transferSummary(inserted.data)})
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const body=await req.json(),action=String(body.action||'')
    const transferAction=action==='unit_transfer'||action==='unit_transfer_list'
    const portal=await requirePortalUser(req,transferAction?['admin','management']:['admin'])
    if(!portal)return json({error:transferAction?'Admin or Management authorization required.':'Admin authorization required.'},403)
    const db=admin()

    if(action==='admin_feed')return json({ok:true,...await adminFeed(db)})
    if(action==='unit_transfer_list')return json({ok:true,transfers:await listUnitTransfers(db)})
    if(action==='unit_transfer')return await createUnitTransfer(db,portal,body)

    if(action==='bootstrap_defaults'){
      const defaults=[
        {name:'Admin',username:'adminhere',password:'admin22',role:'admin'},
        {name:'Management',username:'managementhere',password:'manage22',role:'management'},
        {name:'Staff',username:'staffhere',password:'staff220',role:'staff'},
        {name:'Order Receiving',username:'receiverhere',password:'receiver22',role:'receiver'},
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
