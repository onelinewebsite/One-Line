// One-Line public catalogue cache for Cloudflare Pages Functions (Free plan).
// The public/publishable key has ONLY the same anonymous RLS permissions as
// the storefront; never place a service-role or secret key in this function.
const SUPABASE_URL = 'https://eiozlrnrvlfyflddemla.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4HZYrBsMHgwYufbl9f4DRw_468UKnb_';
const PAGE_SIZE = 350;
const ALLOWED_TABLES = new Set([
  'categories', 'subcategories', 'products', 'product_variants',
  'print_types', 'delivery_methods', 'custom_catalog_categories',
  'custom_catalog_items', 'custom_catalog_fabrics',
  'custom_sportswear_fabrics', 'custom_sportswear_types',
  'custom_print_types', 'catalogue_internal_details'
]);

export async function onRequestGet({request, context}) {
  const url = new URL(request.url);
  const table = String(url.searchParams.get('table') || '');
  const pageText = String(url.searchParams.get('page') || '');
  const page = Number(pageText);
  if (!ALLOWED_TABLES.has(table) || !/^\d{1,2}$/.test(pageText) || !Number.isInteger(page) || page > 79) {
    return new Response('Invalid public catalogue request', {status:400, headers:{'Cache-Control':'no-store'}});
  }
  const cacheUrl = new URL('/api/public-catalogue', url.origin);
  cacheUrl.search = new URLSearchParams({table,page:String(page)}).toString();
  const cacheKey = new Request(cacheUrl.toString(), {method:'GET'});
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;
  const upstream = new URL(SUPABASE_URL + '/rest/v1/' + table);
  upstream.searchParams.set('select',table==='catalogue_internal_details'?'item_id,detail_1,detail_2':'*');
  upstream.searchParams.set('order',(table==='catalogue_internal_details'?'item_id':'id')+'.asc');
  upstream.searchParams.set('limit',String(PAGE_SIZE));
  upstream.searchParams.set('offset',String(page*PAGE_SIZE));
  let response;
  try {
    response = await fetch(upstream.toString(), {
      headers:{'apikey':SUPABASE_PUBLISHABLE_KEY,'accept':'application/json'},
    });
  } catch (_) {
    return new Response('Catalogue origin is temporarily unavailable', {status:503, headers:{'Cache-Control':'no-store'}});
  }
  if (!response.ok) return new Response('Catalogue temporarily unavailable', {status:response.status,headers:{'Cache-Control':'no-store'}});
  // Only cache publicly RLS-readable rows. Private user/cart/order data never traverses this route.
  const result = new Response(response.body, {
    status:200,
    headers:{
      'Content-Type':'application/json; charset=utf-8',
      'Cache-Control':'public, max-age=30, s-maxage=120',
      'X-Content-Type-Options':'nosniff'
    }
  });
  context.waitUntil(cache.put(cacheKey,result.clone()));
  return result;
}
