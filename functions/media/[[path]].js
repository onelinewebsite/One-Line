// Public One-Line product images: Cloudflare read-through cache in front of
// the existing Supabase Storage bucket. No image writes, no private buckets.
const ORIGIN = 'https://eiozlrnrvlfyflddemla.supabase.co/storage/v1/object/public/product-images/';
export async function onRequestGet({request, params, context}) {
  const pieces = Array.isArray(params.path) ? params.path : [params.path];
  // Allow only safe public image paths; never act as a general-purpose proxy.
  if (!pieces.length || pieces.length>8 || pieces.some(p=>!/^[\w. -]{1,120}$/.test(p)||p==='.'||p==='..'))return new Response('Not found',{status:404});
  if (!/\.(?:jpe?g|png|webp|avif|gif)$/i.test(pieces.at(-1)))return new Response('Not found',{status:404});
  const source=ORIGIN+pieces.map(encodeURIComponent).join('/');
  const cacheKey=new Request(new URL(request.url).origin+'/media/'+pieces.map(encodeURIComponent).join('/'));
  const cache=caches.default;
  const cached=await cache.match(cacheKey);
  if(cached)return cached;
  let upstream;
  try{upstream=await fetch(source,{headers:{accept:'image/avif,image/webp,image/*,*/*;q=0.8'}});}catch(_){return new Response('Image unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
  if(!upstream.ok)return new Response('Image unavailable',{status:upstream.status,headers:{'Cache-Control':'no-store'}});
  const type=upstream.headers.get('content-type')||'';
  if(!/^image\/(?:jpeg|png|webp|avif|gif)(?:;|$)/i.test(type))return new Response('Invalid image',{status:502});
  const result=new Response(upstream.body,{status:200,headers:{'Content-Type':type,'Cache-Control':'public, max-age=86400, s-maxage=604800','X-Content-Type-Options':'nosniff'}});
  context.waitUntil(cache.put(cacheKey,result.clone()));
  return result;
}
