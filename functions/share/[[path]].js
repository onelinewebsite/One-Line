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
const safeUrl=value=>{if(typeof value!=='string'||!value.trim())return '';
  try{const u=new URL(value.trim(),ORIGIN+'/');return u.protocol==='https:'&&!/(^|\.)localhost$/.test(u.hostname)?u.toString():'';}catch{return '';}
};
const pic=value=>typeof value==='string'?value:(value&&typeof value==='object'?(value.url||value.src||value.image_url||value.publicUrl||''):'');
function firstPhoto(images){
  if(typeof images==='string'){try{images=JSON.parse(images);}catch{return safeUrl(images);}}
  if(Array.isArray(images))return images.map(v=>safeUrl(pic(v))).find(Boolean)||'';
  return '';
}
function sourceImage(type,row){
  const candidates=type==='item'||type==='product'
    ?[row.card_image_url,firstPhoto(row.images),row.image_url]
    :[row.image_url,row.image,firstPhoto(row.images)];
  if(type==='item'&&!candidates.some(Boolean)){
    const opts=row.fabric_options?.uniform_config||{},variants=[...(opts.top||[]),...(opts.bottom||[])];
    candidates.push(...variants.map(v=>firstPhoto(v.images)));
  }
  return candidates.map(safeUrl).find(Boolean)||ORIGIN+'/share-logo-white-v166.png';
}
const hash=v=>{let h=2166136261;for(const c of String(v)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
async function getRow(type,id,env){
  const cfg=TYPES[type];if(!cfg||!valid(id))return null;
  const base=(env.SUPABASE_URL||SUPABASE).replace(/\/$/,'');
  const u=new URL(base+'/rest/v1/'+cfg.table);
  u.searchParams.set('select','*');u.searchParams.set(cfg.field,'eq.'+id);u.searchParams.set('limit','1');
  const r=await fetch(u.toString(),{headers:{'apikey':env.SUPABASE_PUBLISHABLE_KEY||PUBLIC_KEY,'Accept':'application/json'},cf:{cacheEverything:true,cacheTtl:120}});
  if(!r.ok)return null;
  const rows=await r.json(),row=Array.isArray(rows)?rows[0]:null;
  if(!row)return null;
  if(type==='item'&&row.active===false)return null;
  if(type==='category'&&row.active===false&&row.shareable!==true)return null;
  if(type==='product'&&(row.active===false||row.customer_visible===false))return null;
  if(type==='retail-category'&&row.active===false)return null;
  return row;
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
  const image=ORIGIN+'/share/image/'+encodeURIComponent(type)+'/'+encodeURIComponent(id)+'?v='+hash(sourceImage(type,row)+'|'+String(row.updated_at||''));
  return '<meta property="og:type" content="product"><meta property="og:site_name" content="One-Line Touch Shopping">'+
    '<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'">'+
    '<meta property="og:image" content="'+esc(image)+'"><meta property="og:image:secure_url" content="'+esc(image)+'">'+
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'+
    '<meta property="og:image:alt" content="'+esc(title)+'">'+
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
  if(b[0]===0xff&&b[1]===0xd8)return 'image/jpeg';
  if(b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47)return 'image/png';
  if(b[0]===0x52&&b[1]===0x49&&b[2]===0x46&&b[3]===0x46&&b[8]===0x57&&b[9]===0x45&&b[10]===0x42&&b[11]===0x50)return 'image/webp';
  if(b[0]===0x47&&b[1]===0x49&&b[2]===0x46)return 'image/gif';
  return String(header||'').startsWith('image/')?String(header).split(';')[0]:'';
}
async function proxyImage(request,type,id,row,env){
  const source=sourceImage(type,row);
  // Use the original public item/category image; no JPEG duplicate, no storage upload.
  // Cloudflare caches this route so repeat social previews avoid repeated Storage reads.
  try {
    const u=new URL(source);
    if (u.protocol==='https:' && !/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/.test(u.hostname)) {
      const response=await fetch(u.toString(),{
        redirect:'follow',headers:{'Accept':'image/jpeg,image/png,image/webp,image/*'},
        cf:{cacheTtl:3600,cacheEverything:true}
      });
      if(response.ok){
        const length=Number(response.headers.get('content-length')||0);
        if(!length||length<=8*1024*1024){
          const bytes=await response.arrayBuffer();
          if(bytes.byteLength<=8*1024*1024){
            const detected=contentType(bytes,response.headers.get('content-type'));
            if(detected)return new Response(request.method==='HEAD'?null:bytes,{status:200,headers:{
              'Content-Type':detected,'Cache-Control':'public,max-age=3600,s-maxage=3600',
              'Content-Length':String(bytes.byteLength),'X-Content-Type-Options':'nosniff'
            }});
          }
        }
      }
    }
  } catch(_) {}
  const fallback=await env.ASSETS.fetch(new URL('/share-logo-white-v166.png',request.url));
  if(!fallback.ok)return new Response('No image',{status:404});
  const h=new Headers(fallback.headers);h.set('Cache-Control','public,max-age=300');h.set('Content-Type','image/png');
  return new Response(request.method==='HEAD'?null:fallback.body,{status:200,headers:h});
}
export async function onRequestGet({request,params,env}){
  const seg=(Array.isArray(params.path)?params.path:String(params.path||'').split('/')).filter(Boolean);
  const img=seg[0]==='image';const [type,id]=img?seg.slice(1):seg;
  if(!img&&type==='design'&&seg.length===2&&valid(id))return Response.redirect(ORIGIN+'/#customize',302);
  if(seg.length!==(img?3:2)||!TYPES[type]||!valid(id))return new Response('Not found',{status:404});
  try{
    const row=await getRow(type,id,env||{});
    if(!row)return new Response('Shared item not found',{status:404,headers:{'Cache-Control':'no-store'}});
    if(img)return proxyImage(request,type,id,row,env||{});
    return servePage(request,type,id,row,env||{});
  }catch(e){return new Response('Unable to load shared item',{status:503,headers:{'Cache-Control':'no-store'}});}
}
export async function onRequestHead(context){return onRequestGet(context);}
