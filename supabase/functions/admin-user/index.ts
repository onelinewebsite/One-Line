import { cors,json,admin,requirePortalUser } from '../_shared.ts'

const cleanUsername=(username:string)=>String(username||'').trim().toLowerCase().replace(/[^a-z0-9._-]/g,'')
const emailFor=(username:string)=>cleanUsername(username)+'@staff.oneline.local'
const allowedRoles=['admin','management','staff','receiver']

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

async function createUnitTransfer(db:any,portal:any,body:any){
  const sourceType=String(body.source_type||'').trim(),sourceId=String(body.source_id||'').trim()
  if(!['ready_made','custom_catalog','order_item'].includes(sourceType)||!sourceId)return json({error:'Invalid Unit Transfer item.'},400)
  const sourceKey=sourceType+':'+sourceId
  const existing=await db.from('orders').select('id,order_code,metadata,created_at').contains('metadata',{unit_transfer:true,source_key:sourceKey}).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(existing.error)throw existing.error
  if(existing.data)return json({ok:true,already:true,transfer:transferSummary(existing.data)})

  let itemName='',itemCode='',qty=1,unitPrice=0,itemType='product',productId=null as string|null,design:any={}
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
  }else{
    const line=await db.from('order_items').select('*').eq('id',sourceId).maybeSingle();if(line.error)throw line.error;if(!line.data)return json({error:'Customize order item not found.'},404)
    const order=await db.from('orders').select('*').eq('id',line.data.order_id).maybeSingle();if(order.error)throw order.error;if(!order.data)return json({error:'Source customer order not found.'},404)
    if(order.data.metadata?.unit_transfer===true)return json({error:'A Unit Transfer cannot be transferred again.'},400)
    itemName=String(line.data.item_name||'Customize item');itemCode=String(line.data.item_code||'');qty=Math.max(1,Number(line.data.qty||1));unitPrice=Number(line.data.unit_price||0);itemType=String(line.data.item_type||'custom_design');productId=line.data.product_id||null;sourceLabel='Customize Order Item'
    const original=(line.data.design_json&&typeof line.data.design_json==='object')?line.data.design_json:{}
    design={...original,unit_snapshot:{...(original.unit_snapshot||{}),source_type:sourceType,source_order_id:order.data.id,source_order_code:order.data.order_code,customer_name:order.data.customer_name||order.data.business||'',phone:order.data.phone||'',address:order.data.address||'',delivery:order.data.delivery||'',payment:order.data.payment||''}}
  }

  const random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase(),stamp=new Date().toISOString().replace(/\D/g,'').slice(2,14)
  const orderCode='UNIT-'+stamp+'-'+random
  const metadata={unit_transfer:true,source_type:sourceType,source_id:sourceId,source_key:sourceKey,source_label:sourceLabel,transferred_by:portal.profile.id,transferred_by_name:portal.profile.name||portal.profile.username||'',transferred_at:new Date().toISOString()}
  const inserted=await db.from('orders').insert({order_code:orderCode,customer_name:'Production Unit',phone:'',address:'',business:'',delivery:'Unit transfer',payment:'Internal',status:'Transferred',total:unitPrice*qty,metadata}).select().single()
  if(inserted.error)throw inserted.error
  const lineInsert=await db.from('order_items').insert({order_id:inserted.data.id,product_id:productId,item_type:itemType,item_name:itemName,item_code:itemCode,qty,unit_price:unitPrice,design_json:design,group_key:sourceKey})
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
