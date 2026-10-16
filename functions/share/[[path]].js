// Cloudflare Pages Function: item/category/designer-specific social previews.
const ORIGIN='https://onelinesmart.com';
const SUPABASE='https://eiozlrnrvlfyflddemla.supabase.co';
// Browser publishable key: safe for read-only RLS-protected public catalogue rows.
const PUBLIC_KEY='sb_publishable_4HZYrBsMHgwYufbl9f4DRw_468UKnb_';
const TYPES={
  item:{table:'custom_catalog_items',select:'id,title,description,card_image_url,images,category_id,active',id:'id',title:'title',image:'card_image_url'},
  category:{table:'custom_catalog_categories',select:'id,name,description,image_url,active,shareable',id:'id',title:'name',image:'image_url'},
  product:{table:'products',select:'id,name,description,card_image_url,images,active,customer_visible',id:'id',title:'name',image:'card_image_url'},
  'retail-category':{table:'categories',select:'id,name,subtitle,image_url,active',id:'name',title:'name',image:'image_url'},
};
const safe=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const valid=v=>typeof v==='string' && v.length>0 && v.length<=160 && !/[\/\\<>]/.test(v);
function imageUrl(value){
  if(!value)return ORIGIN+'/share-logo-white-v166.png';
  try {const u=new URL(value,ORIGIN+'/');if(u.protocol!=='https:')return ORIGIN+'/share-logo-white-v166.png';return u.toString();}
  catch(_){return ORIGIN+'/share-logo-white-v166.png';}
}
async function getRow(type,id,env){
  const cfg=TYPES[type];if(!cfg||!valid(id))return null;
  const key=env.SUPABASE_PUBLISHABLE_KEY||PUBLIC_KEY;
  const url=(env.SUPABASE_URL||SUPABASE).replace(/\/$/,'')+'/rest/v1/'+cfg.table+'?select='+encodeURIComponent(cfg.select)+'&'+cfg.id+'=eq.'+encodeURIComponent(id)+'&limit=1';
  const res=await fetch(url,{headers:{'apikey':key,'Accept':'application/json'},cf:{cacheTtl:90,cacheEverything:true}});
  if(!res.ok)return null;
  const rows=await res.json();const row=Array.isArray(rows)?rows[0]:null;
  if(!row)return null;
  if(type==='item'&&row.active===false)return null;
  if(type==='category'&&row.active===false&&row.shareable!==true)return null;
  if(type==='product'&&(row.active===false||row.customer_visible===false))return null;
  if(type==='retail-category'&&row.active===false)return null;
  return row;
}
function sourceImage(type,row){
  const key=TYPES[type].image;
  return imageUrl(row?.[key]||(row?.images||[])[0]);
}
function destination(type,id,row){
  const p=new URL('/',ORIGIN);
  if(type==='item'){p.searchParams.set('customItem',id);p.hash='customItem';}
  if(type==='category'){p.searchParams.set('customCategory',id);p.hash='customCategory';}
  if(type==='product'){p.searchParams.set('product',id);p.hash='product';}
  if(type==='retail-category'){p.searchParams.set('category',row.name||id);p.hash='catalog';}
  return p.toString();
}
function htmlPreview(type,id,row,url){
  const title=row[TYPES[type].title]||'One-Line';
  const description=String(row.description||row.subtitle||'View and order at One-Line Touch Shopping.').slice(0,200);
  // Use the item's or category's actual image, with no watermark or transformation.
  const ogImage=sourceImage(type,row);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+safe(title)+' | One-Line</title><meta name="description" content="'+safe(description)+'">'+
    '<meta property="og:type" content="product"><meta property="og:site_name" content="One-Line Touch Shopping">'+
    '<meta property="og:title" content="'+safe(title)+'"><meta property="og:description" content="'+safe(description)+'">'+
    '<meta property="og:image" content="'+safe(ogImage)+'"><meta property="og:image:secure_url" content="'+safe(ogImage)+'">'+
    '<meta property="og:url" content="'+safe(url)+'"><meta name="twitter:card" content="summary_large_image">'+
    '<meta name="twitter:title" content="'+safe(title)+'"><meta name="twitter:description" content="'+safe(description)+'">'+
    '<meta name="twitter:image" content="'+safe(ogImage)+'"><link rel="canonical" href="'+safe(url)+'">'+
    '</head><body><a href="'+safe(destination(type,id,row))+'">Open '+safe(title)+' in One-Line</a>'+ 
    '<script>location.replace('+JSON.stringify(destination(type,id,row)).replace(/</g,'\\u003c')+')</script></body></html>';
}
// Compatibility for previously shared /share/image/... URLs; return the unmarked original.
function imageResponse(type,row){
  return Response.redirect(sourceImage(type,row),302);
}
export async function onRequestGet({request,params,env}){
  const segments=(Array.isArray(params.path)?params.path:String(params.path||'').split('/')).filter(Boolean);
  const img=segments[0]==='image';const [type,id]=img?segments.slice(1):segments;
  if(!img && type==='design' && segments.length===2 && valid(id))return Response.redirect(ORIGIN+'/#customize',302);
  if(segments.length!==(img?3:2)||!TYPES[type]||!valid(id))return new Response('Not found',{status:404});
  try{
    const row=await getRow(type,id,env||{});
    if(!row)return new Response('Share not found',{status:404,headers:{'Cache-Control':'no-store'}});
    if(img)return imageResponse(type,row);
    return new Response(htmlPreview(type,id,row,request.url),{status:200,headers:{'Content-Type':'text/html;charset=UTF-8','Cache-Control':'public, max-age=60, s-maxage=120','X-Robots-Tag':'noindex'}});
  }catch(_){return new Response('Unable to load shared item',{status:503,headers:{'Cache-Control':'no-store'}});}
}
