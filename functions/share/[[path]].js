// One-Line share previews. The same route serves crawlers and the actual SPA.
// No service-role secret, new SQL table, or Cloudflare Image Transformations required.
const ORIGIN='https://onelinesmart.com';
const SUPABASE='https://eiozlrnrvlfyflddemla.supabase.co';
const PUBLIC_KEY='sb_publishable_4HZYrBsMHgwYufbl9f4DRw_468UKnb_';
const TYPES={
  item:{table:'custom_catalog_items',field:'id',title:'title'},
  category:{table:'custom_catalog_categories',field:'id',title:'name'},
  product:{table:'products',field:'id',title:'name'},
  'retail-category':{table:'categories',field:'name',title:'name'},
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=v=>typeof v==='string'&&v.length>0&&v.length<180&&!/[\/\\<>\x00-\x1f]/.test(v);
// Images uploaded across older versions can be strings, objects, arrays or
// Supabase public-storage paths. Resolve them without creating any new files.
const asset=(v)=>{
  if(typeof v==='string')return v.trim();
  if(v&&typeof v==='object')return v.url||v.src||v.image_url||v.card_image_url||v.publicUrl||v.public_url||v.path||v.image||'';
  return '';
};
function safeUrl(value){
  const raw=asset(value);
  if(!raw)return '';
  try{
    let url=raw;
    if(!/^https?:\/\//i.test(raw)){
      if(raw.startsWith('data:')||raw.startsWith('blob:'))return '';
      if(raw.startsWith('storage/v1/'))url=SUPABASE+'/'+raw;
      else if(raw.startsWith('/storage/v1/'))url=SUPABASE+raw;
      else if(raw.startsWith('product-images/'))url=SUPABASE+'/storage/v1/object/public/'+raw;
      else url=new URL(raw,ORIGIN+'/').href;
    }
    const u=new URL(url);
    if(u.protocol==='http:'&&u.hostname!=='localhost')u.protocol='https:';
    if(u.protocol!=='https:'||u.username||u.password)return '';
    if(/^(?:localhost|[^.]+\.localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(u.hostname))return '';
    const p=u.hostname.split('.').map(Number);
    if(p.length===4&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)){
      if(p[0]===0||p[0]===10||p[0]===127||p[0]>=224||(p[0]===172&&p[1]>=16&&p[1]<=31)||(p[0]===192&&p[1]===168)||(p[0]===169&&p[1]===254))return '';
    }
    return u.toString();
  }catch{return '';}
}
function photos(value){
  if(!value)return [];
  if(typeof value==='string'){
    try{const obj=JSON.parse(value);if(Array.isArray(obj))return photos(obj);}catch(_){}
    const u=safeUrl(value);return u?[u]:[];
  }
  if(Array.isArray(value))return value.flatMap(photos);
  const u=safeUrl(value);return u?[u]:[];
}
function uniq(urls){return [...new Set(urls.filter(Boolean))];}
function itemVariantPhotos(row){
  let raw=row?.fabric_options;
  if(typeof raw==='string'){try{raw=JSON.parse(raw);}catch(_){raw={};}}
  const cfg=raw?.uniform_config||{};
  const variants=[...(cfg.top||[]),...(cfg.bottom||[]),...(cfg.items||[]),...(cfg.variants||[])];
  return variants.flatMap(v=>[
    ...photos(v.images),...photos(v.image_url),...photos(v.image),...photos(v.card_image_url)
  ]);
}
function imageCandidates(type,row){
  if(!row)return [];
  if(type==='item')return uniq([...photos(row.card_image_url),...photos(row.images),...photos(row.image_url),...itemVariantPhotos(row)]);
  if(type==='product')return uniq([...photos(row.card_image_url),...photos(row.images),...photos(row.image_url),...photos(row.image)]);
  return uniq([...photos(row.image_url),...photos(row.image),...photos(row.card_image_url),...photos(row.images)]);
}
function sourceImage(type,row){return imageCandidates(type,row)[0]||ORIGIN+'/share-logo-white-v166.png';}
const hash=v=>{let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
async function readPublicRows(table,filters,select,env,limit=1){
  const base=String(env.SUPABASE_URL||SUPABASE).replace(/\/$/,'');
  const key=env.SUPABASE_PUBLISHABLE_KEY||PUBLIC_KEY;
  const url=new URL(base+'/rest/v1/'+table);
  url.searchParams.set('select',select||'*');
  for(const [field,value] of Object.entries(filters))url.searchParams.set(field,value);
  url.searchParams.set('limit',String(Math.min(8,Math.max(1,limit))));
  const headers={'apikey':key,'Authorization':'Bearer '+key,'Accept':'application/json'};
  let response=await fetch(url.toString(),{headers,cf:{cacheEverything:true,cacheTtl:120}});
  // Some older Supabase gateways accept the API key alone, not as a bearer token.
  if(response.status===401||response.status===403){
    response=await fetch(url.toString(),{headers:{apikey:key,Accept:'application/json'},cf:{cacheEverything:true,cacheTtl:120}});
  }
  if(!response.ok)return [];
  const data=await response.json();return Array.isArray(data)?data:[];
}
async function getRow(type,id,env){
  const cfg=TYPES[type];if(!cfg||!valid(id))return null;
  const rows=await readPublicRows(cfg.table,{[cfg.field]:'eq.'+id},'*',env,1);
  const row=rows[0];if(!row)return null;
  if(type==='item'&&row.active===false)return null;
  if(type==='category'&&row.active===false&&row.shareable!==true)return null;
  if(type==='product'&&(row.active===false||row.customer_visible===false))return null;
  if(type==='retail-category'&&row.active===false)return null;
  return row;
}
// Only query related data if an item/category has no usable image itself.
// These are read-only lookups against existing data; no preview uploads.
async function relatedImageCandidates(type,row,id,env){
  try{
    if(type==='product'){
      const rows=await readPublicRows('product_variants',{product_id:'eq.'+id,active:'eq.true'},'image_url',env,8);
      return uniq(rows.flatMap(r=>photos(r.image_url)));
    }
    if(type==='item'){
      if(!row.category_id)return [];
      const cats=await readPublicRows('custom_catalog_categories',{id:'eq.'+row.category_id},'image_url',env,1);
      return uniq(cats.flatMap(r=>photos(r.image_url)));
    }
    if(type==='category'){
      const rows=await readPublicRows('custom_catalog_items',{category_id:'eq.'+id,active:'eq.true'},'card_image_url,images,fabric_options',env,6);
      return uniq(rows.flatMap(r=>imageCandidates('item',r)));
    }
    if(type==='retail-category'&&row.id){
      const rows=await readPublicRows('products',{category_id:'eq.'+row.id,active:'eq.true'},'card_image_url,images',env,6);
      return uniq(rows.flatMap(r=>imageCandidates('product',r)));
    }
  }catch(_){}
  return [];
}
function canonical(type,id,row){
  const p=new URL('/',ORIGIN);
  if(type==='item'){p.searchParams.set('customItem',id);p.searchParams.set('customCategory',row.category_id||'');p.hash='customItem';}
  if(type==='category'){p.searchParams.set('customCategory',id);p.hash='customCategory';}
  if(type==='product'){p.searchParams.set('product',id);p.hash='product';}
  if(type==='retail-category'){p.searchParams.set('category',row.name||id);p.hash='catalog';}
  return p.toString();
}
function pageMeta(type,id,row,requestUrl){
  const title=String(row[TYPES[type].title]||'One-Line').slice(0,130);
  const description=String(row.description||row.subtitle||'View and order at One-Line Touch Shopping.').slice(0,180);
  const primary=sourceImage(type,row);
  const image=ORIGIN+'/share/image/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+'?social=1&v='+hash(primary+'|'+String(row.updated_at||row.created_at||''));
  return '<meta property="og:type" content="product"><meta property="og:site_name" content="One-Line Touch Shopping">'+
    '<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'">'+
    '<meta property="og:image" content="'+esc(image)+'"><meta property="og:image:secure_url" content="'+esc(image)+'">'+
    '<meta property="og:image:alt" content="'+esc(title)+'">'+
    '<meta name="twitter:image:alt" content="'+esc(title)+'">'+
    '<meta property="og:url" content="'+esc(requestUrl)+'">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'">'+
    '<meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(image)+'">'+
    '<link rel="canonical" href="'+esc(requestUrl)+'">';
}
async function servePage(request,type,id,row,env){
  const res=await env.ASSETS.fetch(new Request(new URL('/index.html',request.url),{headers:{accept:'text/html'}}));
  if(!res.ok)return new Response('Website is unavailable',{status:503});
  let html=await res.text();
  const meta=pageMeta(type,id,row,request.url);
  html=html.replace(/<meta property="og:type"[\s\S]*?(?=<meta name="theme-color")/i,meta+'\n  ');
  html=html.replace(/<title>[^<]*<\/title>/i,'<title>'+esc(row[TYPES[type].title]||'One-Line')+' | One-Line</title>');
  // The app reads /share/item/... directly and renders it without a redirect document.
  return new Response(html,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public,max-age=0,s-maxage=120','X-Robots-Tag':'noindex,follow','X-Content-Type-Options':'nosniff'}});
}
function contentType(bytes,header){
  const b=new Uint8Array(bytes);
  if(b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return 'image/jpeg';
  if(b.length>=8&&b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
  if(b.length>=12&&b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50)return 'image/webp';
  if(b.length>=4&&b[0]===0x47&&b[1]===0x49&&b[2]===0x46&&b[3]===0x38)return 'image/gif';
  if(b.length>=12&&String.fromCharCode(...b.slice(4,12)).includes('ftypavif'))return 'image/avif';
  return '';
}
async function tryPhoto(url,request){
  try{
    const source=safeUrl(url);if(!source)return null;
    const response=await fetch(source,{
      redirect:'follow',headers:{'Accept':'image/jpeg,image/png,image/webp,image/avif,image/*'},
      cf:{cacheTtl:3600,cacheEverything:true}
    });
    if(!response.ok)return null;
    const length=Number(response.headers.get('content-length')||0);
    // This limit is only a safe bound for a social preview response, not an upload restriction.
    if(length>16*1024*1024)return null;
    const bytes=await response.arrayBuffer();
    if(!bytes.byteLength||bytes.byteLength>16*1024*1024)return null;
    const mime=contentType(bytes,response.headers.get('content-type'));
    if(!mime)return null;
    // A deterministic, crawler-safe preview: WebP is excellent for the
    // storefront but not reliably supported in WhatsApp/Instagram cards.
    // social=1 prefers existing JPG/PNG; WebP is still better than the logo when it is the only product photo.
    // The plain image URL is unchanged for on-device JPEG sharing. This
    // separate URL also avoids CDN cache mixing between crawlers and users.
    return new Response(request.method==='HEAD'?null:bytes,{status:200,headers:{
      'Content-Type':mime,'Cache-Control':'public,max-age=600,s-maxage=3600',
      'Content-Length':String(bytes.byteLength),'X-Content-Type-Options':'nosniff',
      'Access-Control-Allow-Origin':'*'
    }});
  }catch(_){return null;}
}
async function proxyImage(request,type,id,row,env){
  const own=imageCandidates(type,row);
  // Primary card/category picture first; try existing fallback photos on broken URLs.
  const social=new URL(request.url).searchParams.get('social')==='1';
  const ordered=social?[...own.filter(u=>/\.(?:jpe?g|png)(?:[?#]|$)/i.test(new URL(u).pathname)),...own.filter(u=>!/\.(?:jpe?g|png)(?:[?#]|$)/i.test(new URL(u).pathname))]:own;
  for(const url of ordered.slice(0,6)){
    const result=await tryPhoto(url,request);if(result)return result;
  }
  // Only fetch other existing item photos if no main/gallery/variant photo worked.
  const related=await relatedImageCandidates(type,row,id,env);
  for(const url of related.filter(url=>!own.includes(url)).slice(0,6)){
    const result=await tryPhoto(url,request);if(result)return result;
  }
  return serveLogo(request,env);
}
async function serveLogo(request,env){
  try{
    const fallback=await env.ASSETS.fetch(new Request(new URL('/share-logo-white-v166.png',request.url)));
    if(!fallback.ok)throw new Error('Logo unavailable');
    const h=new Headers(fallback.headers);h.set('Cache-Control','public,max-age=300,s-maxage=300');h.set('Content-Type','image/png');
    h.set('X-Content-Type-Options','nosniff');
    return new Response(request.method==='HEAD'?null:fallback.body,{status:200,headers:h});
  }catch(_){return new Response('Image unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function onRequestGet({request,params,env}){
  const seg=(Array.isArray(params.path)?params.path:String(params.path||'').split('/')).filter(Boolean);
  const img=seg[0]==='image';const [type,id]=img?seg.slice(1):seg;
  if(!img&&type==='design'&&seg.length===2&&valid(id))return Response.redirect(ORIGIN+'/#customize',302);
  if(seg.length!==(img?3:2)||!TYPES[type]||!valid(id))return new Response('Not found',{status:404});
  try{
    const row=await getRow(type,id,env||{});
    if(!row){
      if(img)return serveLogo(request,env||{});
      // A missing/private/deleted record still gets a valid site-logo preview
      // rather than a broken card. The storefront handles the missing item.
      const fallback={id,[TYPES[type].title]:'One-Line Touch Shopping',description:'Discover custom apparel at One-Line Touch Shopping.'};
      return servePage(request,type,id,fallback,env||{});
    }
    if(img)return proxyImage(request,type,id,row,env||{});
    return servePage(request,type,id,row,env||{});
  }catch(e){
    if(img)return serveLogo(request,env||{});
    return new Response('Unable to load shared item',{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
export async function onRequestHead(context){return onRequestGet(context);}
