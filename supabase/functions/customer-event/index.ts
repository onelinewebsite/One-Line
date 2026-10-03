import { createClient } from "npm:@supabase/supabase-js@2"

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function resolveCustomerSession(token:string){if(!token)return null;const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}
const trim=(v:unknown,max=240)=>String(v??'').trim().slice(0,max)
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0}

const stockOf=(row:any)=>Math.max(0,Math.floor(num(row?.stock)))
const cleanImages=(value:any)=>Array.isArray(value)?value.map((x:any)=>trim(x,2000)).filter(Boolean):[]
function normalizeUniformVariant(raw:any,id:string,name:string){
  const row=raw&&typeof raw==='object'?raw:{}
  const images=cleanImages(row.images?.length?row.images:(row.image?[row.image]:[]))
  const oldSizes=Array.isArray(row.sizes)?row.sizes:[]
  const stock=oldSizes.length?oldSizes.reduce((n:number,x:any)=>n+Math.max(0,Math.floor(num(x?.stock))),0):stockOf(row)
  const hasOld=!!(images.length||stock||oldSizes.some((x:any)=>trim(x?.size,80)))
  return {id,name,enabled:row.enabled===true||(row.enabled===undefined&&hasOld),images,stock}
}
function normalizeUniformConfig(item:any){
  const raw=item?.fabric_options?.uniform_config
  const find=(rows:any[],ids:string[])=>rows.find((v:any)=>ids.includes(String(v?.id||'')))||null
  const topRows=Array.isArray(raw?.top)?raw.top:[],bottomRows=Array.isArray(raw?.bottom)?raw.bottom:[],items=Array.isArray(raw?.items)?raw.items:[]
  const top=[
    normalizeUniformVariant(find(topRows,['top-tshirt','tshirt','top-shirt'])||find(items,['tshirt']),'top-tshirt','T-Shirt'),
    normalizeUniformVariant(find(topRows,['top-woven','woven']),'top-woven','Woven')
  ]
  const bottom=[
    normalizeUniformVariant(find(bottomRows,['bottom-shorts','shorts','bottom-tshirt-set','bottom-woven'])||find(items,['shorts']),'bottom-shorts','Shorts'),
    normalizeUniformVariant(find(bottomRows,['bottom-skirt','skirt'])||find(items,['skirt']),'bottom-skirt','Skirt'),
    normalizeUniformVariant(find(bottomRows,['bottom-track-pant','track-pant'])||find(items,['track-pant']),'bottom-track-pant','Track Pant')
  ]
  const legacySizes=[...topRows,...bottomRows,...items].flatMap((v:any)=>Array.isArray(v?.sizes)?v.sizes:[]).map((v:any)=>trim(typeof v==='string'?v:v?.size,80)).filter(Boolean)
  const sourceSizes=Array.isArray(raw?.sizes)?raw.sizes:legacySizes
  const sizes=[...new Set(sourceSizes.map((v:any)=>trim(typeof v==='string'?v:v?.size,80)).filter(Boolean))]
  const descriptionBlocks=(Array.isArray(raw?.description_blocks)?raw.description_blocks:[]).map((b:any)=>({heading:trim(b?.heading,200),points:trim(b?.points,3000)})).filter((b:any)=>b.heading||b.points)
  return {top,bottom,sizes,descriptionBlocks}
}
async function authoritativeCatalogPayload(db:any,payload:any){
  const itemId=trim(payload?.itemId,180)
  if(!itemId)return payload
  const itemQ=await db.from('custom_catalog_items').select('*').eq('id',itemId).maybeSingle()
  if(itemQ.error)throw itemQ.error
  if(!itemQ.data)throw new Error('Custom Catalogue item is no longer available.')
  const item=itemQ.data
  let category:any=null
  if(item.category_id){const c=await db.from('custom_catalog_categories').select('id,name').eq('id',item.category_id).maybeSingle();if(c.error)throw c.error;category=c.data}
  const out={...payload,itemId:item.id,itemTitle:trim(item.title,240)||trim(payload?.itemTitle,240),itemDescription:trim(item.description,5000),categoryId:item.category_id||payload?.categoryId||'',categoryName:trim(category?.name||payload?.categoryName,200),image:cleanImages(item.images)[0]||trim(payload?.image,2000)}
  if(!String(category?.name||payload?.categoryName||'').toLowerCase().includes('uniform'))return out

  const cfg=normalizeUniformConfig(item),client=payload?.uniformSelection&&typeof payload.uniformSelection==='object'?payload.uniformSelection:{},topOptions=cfg.top.filter((v:any)=>v.enabled),bottomOptions=cfg.bottom.filter((v:any)=>v.enabled)
  const topId=trim(client?.top?.id,100),bottomId=trim(client?.bottom?.id,100),size=trim(client?.size,80)
  const top=topOptions.find((v:any)=>v.id===topId)||null,bottom=bottomOptions.find((v:any)=>v.id===bottomId)||null
  if(topOptions.length&&!top)throw new Error('Selected Top option is no longer available. Please choose again.')
  if(bottomOptions.length&&!bottom)throw new Error('Selected Bottom option is no longer available. Please choose again.')
  if(top&&stockOf(top)<=0)throw new Error(top.name+' is out of stock. Please choose another Top option.')
  if(bottom&&stockOf(bottom)<=0)throw new Error(bottom.name+' is out of stock. Please choose another Bottom option.')
  if(cfg.sizes.length&&!cfg.sizes.includes(size))throw new Error('Selected uniform size is no longer available. Please choose again.')
  const selectedStocks=[top&&stockOf(top),bottom&&stockOf(bottom)].filter((v:any)=>typeof v==='number') as number[]
  const completeSetStock=selectedStocks.length?Math.min(...selectedStocks):0
  const pack=(v:any)=>v?{id:v.id,name:v.name,availableStock:stockOf(v),images:cleanImages(v.images)}:null
  const verifiedAt=new Date().toISOString(),selection={size,top:pack(top),bottom:pack(bottom),completeSetStock,stockVerifiedAt:verifiedAt}
  const allImages=[...cleanImages(item.images),...cleanImages(top?.images),...cleanImages(bottom?.images)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,20)
  return {...out,images:allImages,uniformSelection:selection,uniformDescriptionBlocks:cfg.descriptionBlocks,uniformFeatures:[`Top: ${topOptions.map((v:any)=>v.name).join(' / ')}`,`Bottom: ${bottomOptions.map((v:any)=>v.name).join(' / ')}`,`Sizes: ${cfg.sizes.join(' / ')}`].filter((v:string)=>!v.endsWith(': ')),uniformStockVerifiedAt:verifiedAt}
}

async function saveCatalogEnquiry(db:any,s:any,payload:any){
  const customer=(s as any).customers||{},savedPayload=await authoritativeCatalogPayload(db,payload)
  const itemId=trim(savedPayload?.itemId,180),itemTitle=trim(savedPayload?.itemTitle||savedPayload?.title,240)
  if(!itemId&&!itemTitle)throw new Error('Custom Catalogue item is required.')
  const size=new TextEncoder().encode(JSON.stringify(savedPayload||{})).byteLength
  if(size>1_000_000)throw new Error('This Custom Catalogue enquiry is too large. Please try again.')

  const random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase()
  const stamp=new Date().toISOString().replace(/\D/g,'').slice(2,14)
  const orderCode='ENQ-'+stamp+'-'+random
  const rate=Math.max(0,num(savedPayload?.itemRate??savedPayload?.fabricRate))
  const metadata={custom_catalog_enquiry:true,enquiry_payload:savedPayload,source:'customization_catalogue',submitted_at:new Date().toISOString()}

  const orderQ=await db.from('orders').insert({
    order_code:orderCode,
    customer_id:s.customer_id,
    customer_name:trim(customer.name,120),
    phone:trim(customer.phone,40),
    address:'',
    business:trim(customer.business_name,160),
    delivery:'Custom Catalogue enquiry',
    payment:'Quote pending',
    status:'Enquiry',
    total:rate,
    metadata
  }).select('*').single()
  if(orderQ.error)throw orderQ.error

  const lineQ=await db.from('order_items').insert({
    order_id:orderQ.data.id,
    product_id:null,
    item_type:'custom_catalog_enquiry',
    item_name:itemTitle||'Custom Catalogue enquiry',
    item_code:'',color:[savedPayload?.uniformSelection?.top?.name,savedPayload?.uniformSelection?.bottom?.name].filter(Boolean).join(' + '),size:trim(savedPayload?.uniformSelection?.size,80),qty:1,unit_price:rate,
    design_json:savedPayload,
    group_key:'custom_catalog:'+itemId
  }).select('id').single()
  if(lineQ.error){await db.from('orders').delete().eq('id',orderQ.data.id);throw lineQ.error}

  // Keep the customer enquiry history and older admin builds compatible.
  const activityPayload={...savedPayload,orderId:orderQ.data.id,orderCode:orderQ.data.order_code}
  const activityQ=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'custom_catalog_enquiry',payload:activityPayload})
  if(activityQ.error)console.error('Enquiry activity mirror failed:',activityQ.error.message)
  await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
  return {order:orderQ.data,activityPayload}
}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors})
  try{
    const body=await req.json(),token=String(body?.token||''),type=String(body?.event_type||'activity').slice(0,80),payload=body?.payload&&typeof body.payload==='object'&&!Array.isArray(body.payload)?body.payload:{}
    const s=await resolveCustomerSession(token)
    if(!s)return json({error:'Session expired. Verify your number again.'},401)
    const db=admin()

    if(type==='customer_name'&&trim((payload as any)?.name,120)){
      const name=trim((payload as any).name,120)
      const q=await db.from('customers').update({name,updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
      if(q.error)throw q.error
    }
    if(type==='cart_sync')return json({ok:true,ignored:true,reason:'server_cart_v41'})

    if(type==='custom_catalog_enquiry'){
      const saved=await saveCatalogEnquiry(db,s,payload)
      return json({ok:true,enquiry:{id:saved.order.id,orderCode:saved.order.order_code,createdAt:saved.order.created_at},order:saved.order})
    }

    const q=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:type,payload})
    if(q.error)throw q.error
    await db.from('customers').update({last_seen_at:new Date().toISOString()}).eq('id',s.customer_id)
    return json({ok:true})
  }catch(e){return json({error:e instanceof Error?e.message:'Could not save activity.'},500)}
})
