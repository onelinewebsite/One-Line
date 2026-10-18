import { createClient } from 'npm:@supabase/supabase-js@2'

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type, x-one-line-public","Access-Control-Allow-Methods":"POST, OPTIONS"}
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"content-type":"application/json"}})
const secretKey=()=>{const packed=Deno.env.get('SUPABASE_SECRET_KEYS');if(packed){try{const obj=JSON.parse(packed);if(obj.default)return obj.default;const first=Object.values(obj)[0];if(first)return String(first)}catch{}}return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}
const admin=()=>createClient(Deno.env.get('SUPABASE_URL')!,secretKey(),{auth:{persistSession:false,autoRefreshToken:false}})
const hashToken=async(token:string)=>{const bytes=new TextEncoder().encode(token);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function resolveCustomerSession(token:string){const db=admin(),hash=await hashToken(token);const {data,error}=await db.from('customer_sessions').select('customer_id,expires_at,customers(id,phone,name,business_name,job_title)').eq('token_hash',hash).gt('expires_at',new Date().toISOString()).maybeSingle();if(error||!data)return null;return data}

function decodeDataUrl(value:string){
  const m=value.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);if(!m)return null;const bin=atob(m[2]),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return{type:m[1],bytes,ext:m[1].split('/')[1].replace('jpeg','jpg')};
}
function normalizeOrderItem(item:any){
  const type=String(item?.itemType||'product')
  if(type==='team_design'||type==='custom_design'||type==='uniform_order'||type==='printable_order'||type==='jersey_order'){
    return {itemType:type,name:item?.name||(type==='uniform_order'?'Uniform':type==='printable_order'?'Printable item':'Custom design'),code:item?.code||(type==='uniform_order'?'UNIFORM':type==='printable_order'?'PRINT':'CUSTOM'),qty:Number(item?.qty||1),unitPrice:Number(item?.price||item?.unitPrice||0),design:item?.design||item?.customDesign||item?.uniformOrder||{},groupKey:item?.key||''}
  }
  if(item?.lines)return item
  return {itemType:'product',productId:item?.productId,name:item?.name||'',code:item?.code||'',lines:Array.isArray(item?.bulkLines)?item.bulkLines:[],groupKey:item?.key||''}
}
function uniformStock(value:any){return Math.max(0,Math.floor(Number(value||0)))}
function uniformSizeRows(rows:any){return (Array.isArray(rows)?rows:[]).map((r:any,i:number)=>({id:String(r?.id||('size-'+i)),size:String(r?.size||'').trim(),stock:uniformStock(r?.stock),unlimited:r?.unlimited===true,rate:r?.rate!==undefined&&r?.rate!==null&&r?.rate!==''?Math.max(0,Number(r.rate)):null})).filter((r:any)=>r.size)}
function uniformLegacySizes(v:any,common:any){const own=uniformSizeRows(v?.sizes);if(own.length)return own;const rows=uniformSizeRows(common),limit=uniformStock(v?.stock);if(!rows.length)return[];if(limit<=0)return rows.map((r:any)=>({...r,stock:0}));let left=limit;return rows.map((r:any)=>{const stock=Math.min(r.stock,left);left=Math.max(0,left-stock);return{...r,stock}})}
function uniformConfig(raw:any){const src=raw?.fabric_options?.uniform_config&&typeof raw.fabric_options.uniform_config==='object'?raw.fabric_options.uniform_config:{top:[],bottom:[]},common=Array.isArray(src.sizes)?src.sizes:[];if(Array.isArray(src.top)||Array.isArray(src.bottom)){return{...src,top:(src.top||[]).map((v:any)=>({...v,sizes:uniformLegacySizes(v,common)})),bottom:(src.bottom||[]).map((v:any)=>({...v,sizes:uniformLegacySizes(v,common)}))}}if(Array.isArray(src.items)){const top=src.items.filter((v:any)=>['tshirt','woven'].includes(String(v?.id||''))).map((v:any)=>({...v,id:String(v.id)==='tshirt'?'top-tshirt':'top-woven',sizes:uniformLegacySizes(v,common)})),bottom=src.items.filter((v:any)=>['shorts','skirt','track-pant'].includes(String(v?.id||''))).map((v:any)=>({...v,id:String(v.id)==='shorts'?'bottom-shorts':String(v.id)==='skirt'?'bottom-skirt':'bottom-track-pant',sizes:uniformLegacySizes(v,common)}));return{...src,top,bottom}}return{top:[],bottom:[]}}
function uniformVariantTotal(v:any){return (Array.isArray(v?.sizes)?v.sizes:[]).reduce((n:number,x:any)=>n+uniformStock(x?.stock),0)}
function uniformRate(v:any,row:any,itemRate:any=null){const sr=row?.rate!==undefined&&row?.rate!==null&&row?.rate!==''?Number(row.rate):null,vr=v?.rate!==undefined&&v?.rate!==null&&v?.rate!==''?Number(v.rate):null,ir=itemRate!==undefined&&itemRate!==null&&itemRate!==''?Number(itemRate):null;return Number.isFinite(sr)?Math.max(0,sr):(Number.isFinite(vr)?Math.max(0,vr):(Number.isFinite(ir)?Math.max(0,ir):0))}
async function validateUniformOrder(db:any,item:any){
  const design=structuredClone(item?.design||{}),itemId=String(design.itemId||'');if(!itemId)throw new Error('Uniform item is missing. Add it to cart again.');
  const q=await db.from('custom_catalog_items').select('*').eq('id',itemId).maybeSingle();if(q.error)throw q.error;if(!q.data||q.data.active===false)throw new Error('This uniform item is no longer available.');
  const categoryResult=await db.from('custom_catalog_categories').select('catalogue_section').eq('id',q.data.category_id).single();if(categoryResult.error)throw categoryResult.error;design.catalogueSection=categoryResult.data?.catalogue_section==='ready'?'ready':'custom';
  const cfg=uniformConfig(q.data),available=[...(Array.isArray(cfg.top)?cfg.top:[]),...(Array.isArray(cfg.bottom)?cfg.bottom:[])].filter((v:any)=>v?.enabled===true&&(uniformVariantTotal(v)>0||(v.sizes||[]).some((r:any)=>r.unlimited))),availableMap=new Map(available.map((v:any)=>[String(v.id),v]));
  const requestedRaw=Array.isArray(design.selectedItems)?design.selectedItems:[],requestedIds:string[]=[...new Set<string>(requestedRaw.map((v:any)=>String(v?.id||'')).filter(Boolean))],selected=requestedIds.map((id:string)=>availableMap.get(id)).filter(Boolean) as any[];
  if(!selected.length||selected.length!==requestedIds.length)throw new Error('One of the selected uniform items is no longer available.');
  let totalPieces=0,totalAmount=0;const selectedItems=[] as any[];
  for(const v of selected){const request=requestedRaw.find((x:any)=>String(x?.id||'')===String(v.id))||{},sizeRows=Array.isArray(v.sizes)?v.sizes:[],sizeMap=new Map(sizeRows.map((r:any)=>[String(r?.size||'').trim(),r])),cleanQty:any={};for(const [size,value] of Object.entries(request.sizeQuantities||design.itemQuantities?.[String(v.id)]||design.sizeQuantities||{})){const qty=Math.max(0,Math.floor(Number(value||0)));if(!qty)continue;const row=sizeMap.get(String(size).trim()) as any;if(!row)throw new Error(`${v.name||'Uniform item'} size ${size} is no longer available.`);const stock=uniformStock(row.stock);if(!row.unlimited&&qty>stock)throw new Error(`${v.name||'Uniform item'} ${size} has only ${stock} in stock now.`);const rate=uniformRate(v,row,q.data.rate);cleanQty[String(size).trim()]=qty;totalPieces+=qty;totalAmount+=qty*rate;}const orderedQty=Object.values(cleanQty).reduce((n:number,q:any)=>n+Number(q||0),0);if(!orderedQty)continue;const sizeRates:any={};for(const r of sizeRows)sizeRates[String(r.size||'').trim()]=uniformRate(v,r,q.data.rate);const lineTotal=Object.entries(cleanQty).reduce((n:number,[size,q]:any)=>n+Number(q||0)*Number(sizeRates[size]||0),0);selectedItems.push({id:String(v.id),name:String(v.name||''),mrp:v?.mrp??cfg?.default_mrp??null,rate:v?.rate??null,availableStock:uniformVariantTotal(v),images:Array.isArray(v.images)?v.images.filter(Boolean):[],sizeQuantities:cleanQty,sizeRates,sizeStocks:sizeRows.map((r:any)=>({size:String(r?.size||'').trim(),stock:uniformStock(r?.stock),unlimited:r?.unlimited===true,rate:uniformRate(v,r,q.data.rate)})).filter((r:any)=>r.size),orderedQty,lineTotal});}
  if(!totalPieces||!selectedItems.length)throw new Error('Choose a size quantity before ordering.');
  const aggregate:any={};for(const v of selectedItems)for(const [size,qty] of Object.entries(v.sizeQuantities||{}))aggregate[size]=(aggregate[size]||0)+Number(qty||0);
  const cardImage=(q.data.images||[])[0]||'',images=[cardImage,...selectedItems.flatMap((v:any)=>v.images)].filter((v:string,i:number,a:string[])=>v&&a.indexOf(v)===i);
  design.itemId=q.data.id;design.itemTitle=q.data.title||item.name||'Uniform';design.cardImage=cardImage;design.images=images;design.selectedItems=selectedItems;design.itemQuantities=Object.fromEntries(selectedItems.map((v:any)=>[v.id,v.sizeQuantities]));design.sizeQuantities=aggregate;design.totalUnits=totalPieces;design.totalPieces=totalPieces;design.totalAmount=totalAmount;design.validatedAt=new Date().toISOString();
  return {...item,name:q.data.title||item.name||'Uniform',code:item.code||'UNIFORM',qty:totalPieces,unitPrice:totalPieces?totalAmount/totalPieces:0,lineTotal:totalAmount,design};
}
// Corporate Tee Shirt uses the same Admin-managed multi-print price schedule
// as Ready Stock Printable. Reprice every selection on the server at checkout.
async function validateCorporatePrintExtras(db:any,incoming:any){
  const includePrinting=incoming.includePrinting===true;
  if(!includePrinting){
    if((Array.isArray(incoming.selectedPrintTypeIds)&&incoming.selectedPrintTypeIds.length)||(Array.isArray(incoming.selectedPrints)&&incoming.selectedPrints.length))throw new Error('Remove selected prints before turning printing off.');
    return {includePrinting:false,selectedPrintTypeIds:[],selectedPrints:[],printsPerGarment:0};
  }
  const pq=await db.from('custom_print_types').select('*').eq('active',true);
  if(pq.error)throw pq.error;
  const printMap=new Map<string,any>((pq.data||[]).map((row:any)=>[String(row.id),row]));
  const rawIds=Array.isArray(incoming.selectedPrintTypeIds)?incoming.selectedPrintTypeIds:[];
  const selectedPrintTypeIds=[...new Set<string>(rawIds.map((id:any)=>String(id||'').trim()).filter(Boolean))];
  if(!selectedPrintTypeIds.length||selectedPrintTypeIds.length>printMap.size)throw new Error('Choose at least one valid print type.');
  const sizeMaps=new Map<string,Map<string,any>>();
  for(const id of selectedPrintTypeIds){
    const type=printMap.get(id);
    if(!type)throw new Error('A selected print type is no longer available.');
    const sizes=new Map<string,any>((Array.isArray(type.sizes)?type.sizes:[]).filter((r:any)=>r?.active!==false&&String(r.name||'').trim()).map((r:any)=>[String(r.id),r]));
    if(!sizes.size)throw new Error('A selected print type no longer has any available sizes.');
    sizeMaps.set(id,sizes);
  }
  let printsTotal=0,printsCount=0;const selectedPrints=[] as any[],seen=new Set<string>();
  for(const row of Array.isArray(incoming.selectedPrints)?incoming.selectedPrints:[]){
    const id=String(row?.id||''),size=String(row?.size||''),key=id+'::'+size;
    const current=sizeMaps.get(id)?.get(size),qty=Number(row?.qty);
    if(!current||seen.has(key)||!Number.isInteger(qty)||qty<1||qty>10000)throw new Error('Invalid print size or quantity.');
    seen.add(key);const rate=Number(current.rate);
    if(!Number.isFinite(rate)||rate<0)throw new Error('Invalid Admin print rate.');
    const total=qty*rate;printsCount+=qty;printsTotal+=total;
    selectedPrints.push({id,name:String(printMap.get(id)?.name||''),size,sizeLabel:String(current.name),qty,rate,total});
  }
  if(printsCount>10000)throw new Error('Too many print units selected.');
  if(selectedPrintTypeIds.some(id=>!selectedPrints.some(v=>v.id===id)))throw new Error('Choose print-size quantities for each selected print type or turn printing off.');
  return {includePrinting,selectedPrintTypeIds,selectedPrints,printsPerGarment:printsTotal};
}
async function validateJerseyOrder(db:any,item:any){
  const request=item?.design||{},itemId=String(request.itemId||'');
  if(!itemId)throw new Error('Jersey item is missing. Add it again.');
  const iq=await db.from('custom_catalog_items').select('*').eq('id',itemId).maybeSingle();
  if(iq.error)throw iq.error;
  const saved=iq.data;if(!saved||saved.active===false)throw new Error('Jersey is unavailable.');
  const cq=await db.from('custom_catalog_categories').select('name,item_editor_type,active').eq('id',saved.category_id).maybeSingle();
  if(cq.error)throw cq.error;
  const isJersey=String(cq.data?.name||'').trim().toLowerCase()==='full sublimation jerseys'||String(cq.data?.item_editor_type||'')==='jersey';
  if(!isJersey||cq.data?.active===false)throw new Error('Invalid Jersey category.');
  const [tq,fq]=await Promise.all([
    db.from('custom_sportswear_types').select('*').eq('id',String(request.garmentTypeId||'')).maybeSingle(),
    db.from('custom_sportswear_fabrics').select('*').eq('id',String(request.fabricId||'')).maybeSingle()
  ]);
  if(tq.error)throw tq.error;if(fq.error)throw fq.error;
  const type=tq.data,fabric=fq.data,quality=String(request.quality||'');
  if(!type||type.active===false||!fabric||fabric.active===false||!['Budget','Standard','Premium'].includes(quality))throw new Error('Jersey selection is unavailable.');
  const opts=saved.fabric_options||{},restricted=opts.selection_mode==='custom';
  if(restricted){if(!Array.isArray(opts.types)||!opts.types.map(String).includes(String(type.id))||!Array.isArray(opts.fabrics?.[String(fabric.id)])||!opts.fabrics[String(fabric.id)].includes(quality))throw new Error('Jersey fabric or style is no longer offered.');}
  const raw=fabric[quality.toLowerCase()+'_rate'];
  if(raw===null||raw===undefined||raw==='')throw new Error('Selected Jersey quality is unavailable.');
  const base=Math.max(0,Number(raw)+Number(type.price_adjustment||0));
  if(!Number.isFinite(base))throw new Error('Invalid Jersey price.');
  const savedSizes=Array.isArray(opts.sportswear_sizes)?opts.sportswear_sizes:['XS','S','M','L','XL','XXL'].map(size=>({size}));
  const sizeMap=new Map(savedSizes.map((r:any)=>[String(typeof r==='string'?r:r?.size||'').trim(),r]));
  const requested=Array.isArray(request.jerseySizes)?request.jerseySizes:[];
  const found=new Set<string>();let totalPieces=0,totalAmount=0;const jerseySizes=[] as any[];
  for(const line of requested){
    const size=String(line?.size||'').trim(),qty=Number(line?.qty);
    if(!size||found.has(size)||!sizeMap.has(size)||!Number.isInteger(qty)||qty<1||qty>10000)throw new Error('Invalid Jersey size or quantity.');
    found.add(size);const current=sizeMap.get(size) as any;
    const override=current?.rate!==null&&current?.rate!==undefined&&current?.rate!==''?Number(current.rate):null;
    const rate=override===null?base:Math.max(0,override);
    if(!Number.isFinite(rate))throw new Error('Invalid Jersey size rate.');
    totalPieces+=qty;totalAmount+=qty*rate;
    jerseySizes.push({size,qty,rate,length_cm:current?.length_cm??null,width_cm:current?.width_cm??null,separateRate:override!==null});
  }
  if(!totalPieces||totalPieces>10000)throw new Error('Select at least one Jersey size.');
  const corporate=String(cq.data?.name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()==='corporate tee shirt';
  const extra=corporate?await validateCorporatePrintExtras(db,request):{includePrinting:false,selectedPrintTypeIds:[] as string[],selectedPrints:[] as any[],printsPerGarment:0};
  const garmentTotal=totalAmount,printsPerGarment=extra.printsPerGarment,printsTotal=printsPerGarment*totalPieces;totalAmount+=printsTotal;
  const design={kind:'jersey_order',itemId:saved.id,itemTitle:saved.title,fabricId:fabric?.id||'',fabricName:fabric?.name||'',quality,baseRate:base,cardImage:saved.card_image_url||saved.images?.[0]||'',images:(saved.images||[]).slice(0,20),jerseySizes,totalPieces,garmentTotal,...extra,printsTotal,totalAmount,validatedAt:new Date().toISOString()};
  return {...item,itemType:'jersey_order',name:saved.title||'Jersey',code:saved.display_id||item.code||'JERSEY',qty:totalPieces,unitPrice:totalAmount/totalPieces,lineTotal:totalAmount,design};
}
async function validatePrintableOrder(db:any,item:any){
  const incoming=item?.design||{},itemId=String(incoming.itemId||'');
  if(!itemId)throw new Error('Printable item is missing. Select it again.');
  const iq=await db.from('custom_catalog_items').select('*').eq('id',itemId).maybeSingle();
  if(iq.error)throw iq.error;
  const saved=iq.data;if(!saved||saved.active===false)throw new Error('This printable item is no longer available.');
  const cq=await db.from('custom_catalog_categories').select('name,active').eq('id',saved.category_id).maybeSingle();
  if(cq.error)throw cq.error;
  if(!cq.data?.active||!['ready stock printable items','corporate tee shirt'].includes(String(cq.data.name||'').toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ').trim()))throw new Error('This is not a supported printable item.');
  const categoryName=String(cq.data.name||'').toLowerCase().trim();
  const isReadyStock=categoryName==='ready stock printable items';
  const [fq,pq]=await Promise.all([
    isReadyStock?Promise.resolve({data:null,error:null}):db.from('custom_catalog_fabrics').select('*').eq('id',String(incoming.fabricId||'')).maybeSingle(),
    incoming.includePrinting===false?Promise.resolve({data:[],error:null}):db.from('custom_print_types').select('*').eq('active',true)
  ]);
  if(fq.error)throw fq.error;if(pq.error)throw pq.error;
  const fabric=fq.data,quality=isReadyStock?'':String(incoming.quality||'');
  const qualityCol=quality==='Premium'?'premium_rate':quality==='Standard'?'standard_rate':quality==='Budget'?'budget_rate':'';
  const opts=saved.fabric_options||{};
  if(!isReadyStock){
    if(!fabric?.active||!qualityCol||fabric[qualityCol]===null||fabric[qualityCol]===undefined)throw new Error('Fabric or quality changed. Reconfigure item.');
    if(opts.selection_mode==='custom'&&(!Array.isArray(opts[String(fabric.id)])||!opts[String(fabric.id)].includes(quality)))throw new Error('Selected fabric is not offered on this item.');
  }
  const base=isReadyStock?Number(saved.rate):Number(fabric[qualityCol]);
  if((isReadyStock&&(saved.rate===null||saved.rate===undefined))||!Number.isFinite(base)||base<0)throw new Error('Garment price is not configured.');
  const raw=Array.isArray(opts.sportswear_sizes)?opts.sportswear_sizes:['XS','S','M','L','XL','XXL'].map(size=>({size}));
  const sizes=new Map(raw.map((r:any)=>[String((typeof r==='string'?r:r?.size)||'').trim(),typeof r==='string'?{size:r}:r]));
  let garmentTotal=0,totalPieces=0;const printableSizes=[] as any[];
  const requests=incoming.sizeQuantities||{};
  for(const [size,rawQty] of Object.entries(requests)){
    const qty=Number(rawQty);if(!Number.isInteger(qty)||qty<0||qty>10000)throw new Error('Invalid size quantity.');
    if(!qty)continue;
    const savedSize=sizes.get(size) as any;
    if(!savedSize)throw new Error('Size '+size+' is no longer available.');
    const rate=savedSize.rate===null||savedSize.rate===undefined||savedSize.rate===''?base:Number(savedSize.rate);
    if(!Number.isFinite(rate)||rate<0)throw new Error('Invalid Admin size price.');
    totalPieces+=qty;garmentTotal+=qty*rate;
    printableSizes.push({size,qty,rate,length_cm:savedSize.length_cm??null,width_cm:savedSize.width_cm??null,separateRate:savedSize.rate!==null&&savedSize.rate!==undefined&&savedSize.rate!==''});
  }
  if(!totalPieces||totalPieces>10000)throw new Error('Select a valid size quantity.');
  // An explicit no-print order is valid. Legacy orders without the flag still
  // require the original print-type selection and rate verification.
  const includePrinting=incoming.includePrinting!==false;
  let selectedPrintTypeId='',selectedPrintTypeName='',printsTotal=0,printsCount=0;
  const selectedPrints=[] as any[],selectedPrintTypeIds=[] as string[];
  if(!includePrinting){
    if(String(incoming.selectedPrintTypeId||'')||(Array.isArray(incoming.selectedPrintTypeIds)&&incoming.selectedPrintTypeIds.length)||(Array.isArray(incoming.selectedPrints)&&incoming.selectedPrints.length))
      throw new Error('Remove print choices to order without printing.');
  }else{
    const printMap=new Map((pq.data||[]).map((row:any)=>[String(row.id),row]));
    const rawIds=Array.isArray(incoming.selectedPrintTypeIds)&&incoming.selectedPrintTypeIds.length
      ?incoming.selectedPrintTypeIds
      :[incoming.selectedPrintTypeId||((incoming.selectedPrints||[])[0]?.id||'')];
    const typeIds=[...new Set(rawIds.map((v:any)=>String(v||'').trim()))].filter(Boolean);
    if(!typeIds.length||typeIds.length>printMap.size)throw new Error('Select one or more valid print types.');
    const sizeMaps=new Map<string,Map<string,any>>();
    for(const id of typeIds){
      const type=printMap.get(id) as any;
      if(!type)throw new Error('A selected print type is no longer available. Please choose again.');
      const availableSizes=new Map<string,any>((Array.isArray(type.sizes)?type.sizes:[])
        .filter((row:any)=>row?.active!==false&&String(row?.name||'').trim())
        .map((row:any)=>[String(row.id),row]));
      if(!availableSizes.size)throw new Error('A selected print type has no available print sizes.');
      sizeMaps.set(id,availableSizes);
      selectedPrintTypeIds.push(id);
    }
    selectedPrintTypeId=typeIds[0];
    selectedPrintTypeName=typeIds.map(id=>String((printMap.get(id) as any)?.name||'')).join(', ');
    const found=new Set<string>();
    for(const request of Array.isArray(incoming.selectedPrints)?incoming.selectedPrints:[]){
      const id=String(request?.id||''),size=String(request?.size||''),key=id+'::'+size;
      if(!sizeMaps.has(id))throw new Error('A print size belongs to an unselected print type.');
      if(found.has(key))throw new Error('Duplicate print size.');found.add(key);
      const current=sizeMaps.get(id)?.get(size) as any,qty=Number(request?.qty);
      if(!current||!Number.isInteger(qty)||qty<1||qty>10000)throw new Error('Selected print size is no longer available.');
      const rate=Number(current.rate);
      if(!Number.isFinite(rate)||rate<0)throw new Error('Invalid Admin print price.');
      printsCount+=qty;printsTotal+=qty*rate;
      selectedPrints.push({id,name:String((printMap.get(id) as any).name||''),size,sizeLabel:String(current.name),qty,rate,total:qty*rate});
    }
    if(printsCount>10000)throw new Error('Too many prints selected.');
    if(selectedPrintTypeIds.some(id=>!selectedPrints.some(v=>v.id===id)))throw new Error('Choose print-size quantities for each selected print type or turn printing off.');
  }
  const printsPerGarment=printsTotal;printsTotal=printsPerGarment*totalPieces;
  const totalAmount=garmentTotal+printsTotal;
  const design={kind:'printable_order',itemId:saved.id,itemTitle:saved.title||'',categoryName:cq.data.name,fabricId:fabric?.id||'',fabricName:fabric?.name||'',quality,baseRate:base,cardImage:saved.card_image_url||saved.images?.[0]||'',images:(saved.images||[]).slice(0,20),printableSizes,sizeQuantities:Object.fromEntries(printableSizes.map(r=>[r.size,r.qty])),sizeRates:Object.fromEntries(printableSizes.map(r=>[r.size,r.rate])),includePrinting,selectedPrintTypeId,selectedPrintTypeName,selectedPrintTypeIds,selectedPrints,totalPieces,garmentTotal,printsPerGarment,printsTotal,totalAmount,validatedAt:new Date().toISOString()};
  return {...item,itemType:'printable_order',name:saved.title||'Printable item',code:saved.display_id||item.code||'',qty:totalPieces,unitPrice:totalAmount/totalPieces,lineTotal:totalAmount,design};
}
async function uploadOrderImage(db:any,customerId:string,value:any,label:string){
  const decoded=decodeDataUrl(String(value||''));if(!decoded)return '';const clean=String(label||'design').replace(/[^a-z0-9_-]+/gi,'-').slice(0,48)||'design';const path=`orders/${customerId}/${crypto.randomUUID()}-${clean}.${decoded.ext}`;const up=await db.storage.from('product-images').upload(path,decoded.bytes,{contentType:decoded.type,cacheControl:'31536000',upsert:false});if(up.error)throw up.error;return db.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
async function persistCustomDesignAssets(db:any,customerId:string,raw:any){
  const design=structuredClone(raw||{}),surfaces=design?.surfaceDesigns||{};for(const [surfaceName,surface] of Object.entries(surfaces)){if(!surface||typeof surface!=='object')continue;const layers=Array.isArray((surface as any).layers)?(surface as any).layers:[];for(let i=0;i<layers.length;i++){const layer=layers[i];if(!layer||layer.type!=='image')continue;const original=layer.originalDataUrl||layer.src||layer.imageDataUrl||'',preview=layer.src||layer.imageDataUrl||original;if(String(original).startsWith('data:'))layer.originalImageUrl=await uploadOrderImage(db,customerId,original,`${surfaceName}-artwork-${i+1}`);else if(original)layer.originalImageUrl=String(original);if(String(preview).startsWith('data:'))layer.imageUrl=await uploadOrderImage(db,customerId,preview,`${surfaceName}-artwork-preview-${i+1}`);else if(preview)layer.imageUrl=String(preview);if(!layer.originalImageUrl&&layer.imageUrl)layer.originalImageUrl=layer.imageUrl;layer.src=layer.imageUrl||layer.originalImageUrl||'';delete layer.originalDataUrl;delete layer.imageDataUrl;}}
  if(design.frontCompositeDataUrl){design.frontCompositeUrl=await uploadOrderImage(db,customerId,design.frontCompositeDataUrl,'front-final');delete design.frontCompositeDataUrl;}if(design.backCompositeDataUrl){design.backCompositeUrl=await uploadOrderImage(db,customerId,design.backCompositeDataUrl,'back-final');delete design.backCompositeDataUrl;}if(design.uploadedImage&&String(design.uploadedImage).startsWith('data:')){design.uploadedImageUrl=await uploadOrderImage(db,customerId,design.uploadedImage,'front-artwork');design.uploadedImage=design.uploadedImageUrl;}return design;
}
async function persistTeamDesignAssets(db:any,customerId:string,raw:any){
  const design=structuredClone(raw||{}),sides=design?.design||design;for(const sideName of ['front','back']){const side=sides?.[sideName];if(!side)continue;if(side.backgroundDataUrl){side.backgroundUrl=await uploadOrderImage(db,customerId,side.backgroundDataUrl,sideName+'-original');delete side.backgroundDataUrl;}if(side.compositeDataUrl){side.compositeUrl=await uploadOrderImage(db,customerId,side.compositeDataUrl,sideName+'-final');delete side.compositeDataUrl;}if(Array.isArray(side.layers))for(let i=0;i<side.layers.length;i++){const layer=side.layers[i];if(!layer||layer.type!=='image')continue;if(layer.originalDataUrl){layer.originalImageUrl=await uploadOrderImage(db,customerId,layer.originalDataUrl,sideName+'-logo-original-'+(i+1));delete layer.originalDataUrl;}if(layer.imageDataUrl){layer.imageUrl=await uploadOrderImage(db,customerId,layer.imageDataUrl,sideName+'-logo-preview-'+(i+1));delete layer.imageDataUrl;}if(!layer.originalImageUrl&&layer.imageUrl)layer.originalImageUrl=layer.imageUrl;}}return design;
}
function makeOrderCode(){const d=new Date(),stamp=String(d.getUTCFullYear()).slice(-2)+String(d.getUTCMonth()+1).padStart(2,'0')+String(d.getUTCDate()).padStart(2,'0'),random=crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase();return`OL-${stamp}-${random}`}

Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  try{
    const body=await req.json(),s=await resolveCustomerSession(String(body.token||''));if(!s)return json({error:'Session expired. Verify your number again.'},401);const db=admin(),customer=(s as any).customers||{},details=body.details||body;
    if(body.action==='validate_redeem'){const code=String(body.redeemCode||'').trim().toUpperCase(),gross=Number(body.subtotal||0);if(!/^[A-Z0-9_-]{3,32}$/.test(code)||!Number.isFinite(gross)||gross<=0)return json({error:'Enter a valid code and select items first.'},400);const q=await db.from('redeem_codes').select('*').eq('code',code).maybeSingle();if(q.error)throw q.error;const v=q.data;if(!v||!v.active||v.expires_at&&new Date(v.expires_at).getTime()<=Date.now()||v.max_uses!==null&&v.used_count>=v.max_uses||gross<Number(v.min_order_total||0))return json({error:'Code is invalid, expired, or not eligible for this order.'},400);const uq=await db.from('redeem_redemptions').select('id',{count:'exact',head:true}).eq('customer_id',s.customer_id).eq('redeem_code_id',v.id);if(uq.error)throw uq.error;if(Number(uq.count||0)>=Number(v.per_customer_limit||1))return json({error:'This code has already been used on your account.'},400);return json({ok:true,code:v.code,discount:Math.min(gross,Number(v.amount||0)),preview:true});}
    const cartQ=await db.from('customer_carts').select('items').eq('customer_id',s.customer_id).maybeSingle();if(cartQ.error)throw cartQ.error;const serverCart=Array.isArray(cartQ.data?.items)?cartQ.data.items:[],directOrder=body.directOrder===true,browserItems=Array.isArray(body.items)?body.items:[],sourceItems=directOrder?browserItems:(serverCart.length?serverCart:browserItems);let items=sourceItems.map(normalizeOrderItem);
    if(!directOrder&&browserItems.length){const prepared=browserItems.map(normalizeOrderItem);for(let i=0;i<items.length;i++){const item=items[i];if(item?.itemType==='custom_design'||item?.itemType==='uniform_order'||item?.itemType==='printable_order'||item?.itemType==='jersey_order'){const match=prepared.find((x:any)=>x?.itemType===item.itemType&&String(x.groupKey||'')&&String(x.groupKey)===String(item.groupKey||''))||prepared.filter((x:any)=>x?.itemType===item.itemType)[i];if(match?.design)item.design=match.design;}}}
    const checked=[] as any[];for(const item of items){if(item?.itemType==='uniform_order')checked.push(await validateUniformOrder(db,item));else if(item?.itemType==='printable_order')checked.push(await validatePrintableOrder(db,item));else if(item?.itemType==='jersey_order')checked.push(await validateJerseyOrder(db,item));else checked.push(item);}items=checked;
    for(const item of items){if(item?.itemType==='team_design')item.design=await persistTeamDesignAssets(db,s.customer_id,item.design||{});else if(item?.itemType==='custom_design')item.design=await persistCustomDesignAssets(db,s.customer_id,item.design||{});}
    // Re-resolve saved address by ownership; never trust a client-supplied delivery recipient.
    let deliveryRecord:any=null
    if(body.deliveryAddressId){
      const aq=await db.from('customer_addresses').select('*').eq('customer_id',s.customer_id).eq('id',String(body.deliveryAddressId)).maybeSingle()
      if(aq.error)throw aq.error
      if(!aq.data)throw new Error('Selected delivery address is unavailable. Choose another address.')
      deliveryRecord=aq.data
    }
    const formattedDelivery=deliveryRecord?[deliveryRecord.business_name,deliveryRecord.line1,deliveryRecord.line2,deliveryRecord.landmark,deliveryRecord.city,deliveryRecord.district,deliveryRecord.state,deliveryRecord.postal_code].filter(Boolean).join(', '):String(details.address||'')
    // The existing stock-safe SQL ordering function validates Ready Made product lines too.
    const recipient=deliveryRecord?{name:deliveryRecord.recipient_name,phone:deliveryRecord.phone||customer.phone,label:deliveryRecord.label,businessName:deliveryRecord.business_name||'',address:formattedDelivery}: {name:String(details.recipientName||details.name||customer.name||''),phone:String(customer.phone||''),address:formattedDelivery}
    const remarks=String(body.remarks||'').trim();if(remarks.length>5000||remarks.split(/\s+/).filter(Boolean).length>300)throw new Error('Remarks are too long.');const customerName=String(customer.name||details.customerName||details.name||'').trim().slice(0,120),business=String(details.business||customer.business_name||'').trim().slice(0,160);
    // Every line, including Ready Made / Uniform sizes, is validated, deducted
    // and inserted atomically in one database transaction. This is the final
    // availability check immediately before confirming the whole order.
    const redeemCode=String(body.redeemCode||'').trim().toUpperCase();
    const placed=redeemCode?await db.rpc('place_bulk_order_redeem',{p_customer_id:s.customer_id,p_customer_name:customerName,p_phone:String(customer.phone||details.phone||''),p_address:formattedDelivery,p_business:business,p_delivery:String(body.delivery||''),p_payment:String(body.payment||''),p_items:items,p_redeem_code:redeemCode}):await db.rpc('place_bulk_order',{p_customer_id:s.customer_id,p_customer_name:customerName,p_phone:String(customer.phone||details.phone||''),p_address:formattedDelivery,p_business:business,p_delivery:String(body.delivery||''),p_payment:String(body.payment||''),p_items:items});
    if(placed.error)throw placed.error;const order:any=placed.data;
    // Save images seen at the time of purchase for Ready Made lines as well.
    const placedLines=await db.from('order_items').select('id,product_id,color,size,design_json').eq('order_id',order.id).eq('item_type','product')
    if(placedLines.error)throw placedLines.error
    for(const line of (placedLines.data||[])){
      if(!line.product_id)continue
      const prod=await db.from('products').select('images').eq('id',line.product_id).maybeSingle()
      if(prod.error)throw prod.error
      const variant=await db.from('product_variants').select('image_url').eq('product_id',line.product_id).eq('color',line.color||'').eq('size',line.size||'').maybeSingle()
      // Variant photo takes precedence; otherwise use the ordered product's catalogue image.
      const shot=variant.data?.image_url||prod.data?.images?.[0]||''
      if(shot){const q=await db.from('order_items').update({design_json:{...(line.design_json||{}),images:[shot],cardImage:shot}}).eq('id',line.id);if(q.error)throw q.error}
    }
    const snapshot=await db.from('orders').select('metadata').eq('id',order.id).single()
    if(snapshot.error)throw snapshot.error
    const detailsSaved=await db.from('orders').update({metadata:{...(snapshot.data?.metadata||{}),account:{id:s.customer_id,name:customer.name||customerName,phone:customer.phone||'',businessName:customer.business_name||''},deliveryRecipient:recipient,remarks}}).eq('id',order.id)
    if(detailsSaved.error)throw detailsSaved.error
    await db.from('customers').update({name:customerName||customer.name||'',business_name:business||customer.business_name||'',updated_at:new Date().toISOString(),last_seen_at:new Date().toISOString()}).eq('id',s.customer_id);
    if(!directOrder){const cleared=await db.rpc('customer_cart_mutate',{p_customer_id:s.customer_id,p_operation:'clear',p_item_key:null,p_item:null});if(cleared.error)console.error('Order placed but cart clear failed:',cleared.error.message);}
    const verify=await db.from('order_items').select('id,item_type,design_json').eq('order_id',order.id);if(verify.error)throw verify.error;const teamItems=(verify.data||[]).filter((x:any)=>x.item_type==='team_design');for(const saved of teamItems){const d=saved.design_json||{},front=d?.design?.front||d?.front||{},back=d?.design?.back||d?.back||{};if(!front.compositeUrl||!back.compositeUrl||!Array.isArray(d.roster))throw new Error('Team enquiry was not fully saved. Please try again.');}
    const customItems=(verify.data||[]).filter((x:any)=>x.item_type==='custom_design');for(const saved of customItems){const d=saved.design_json||{};if(!d.frontCompositeUrl||!d.backCompositeUrl)throw new Error('The final front/back design images were not fully saved. Please try again.');}
    await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'order_placed',payload:{orderId:order.id,orderCode:order.orderCode,itemCount:items.length,directOrder}});for(const item of items.filter((x:any)=>x.itemType==='team_design')){const a=await db.from('customer_activity').insert({customer_id:s.customer_id,event_type:'team_design_enquiry',payload:{...item.design,orderId:order.id,orderCode:order.orderCode}});if(a.error)console.error('Team enquiry activity log failed:',a.error.message);}
    return json({ok:true,order,verified:true});
  }catch(e){return json({error:e instanceof Error?e.message:'Order could not be placed.'},400)}
})
