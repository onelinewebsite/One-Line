// OneLine v198: a small offline shell and versioned static asset caching.
// Never cache Supabase/Auth/API responses or other origins in this service worker.
const CACHE='one-line-catalogue-v198';
const CORE=['./index.html','./css/site.css?v=198','./js/config.js?v=198',
  './js/data.js?v=198','./js/msg91-widget.js?v=198',
  './js/order-pdf.js?v=198','./js/order-documents.js?v=198',
  './js/backend.js?v=198','./js/designer.js?v=198','./js/app.js?v=198',
  './one-line-logo.webp','./assets/product-placeholder.svg','./favicon.png'];
self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(CORE.map(async url=>{
      try{const request=new Request(url,{cache:'reload'});const response=await fetch(request);
        if(response?.ok)await cache.put(request,response.clone());}catch(_){}
    }));
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('one-line-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // Navigations are always checked with the server so deployed pages update.
  if(request.mode==='navigate'||url.pathname.endsWith('.html')){
    event.respondWith((async()=>{
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response?.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}
        return response;
      }catch(_){return (await caches.match(request,{ignoreSearch:true}))||
        (await caches.match('./index.html'))||Response.error();}
    })());
    return;
  }
  // Versioned scripts and CSS plus local images: reuse network bytes across visits.
  if(/\.(?:js|css|svg|png|jpg|jpeg|webp|webmanifest|ico)$/i.test(url.pathname)){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),cached=await cache.match(request);
      if(cached)return cached;
      try{
        const response=await fetch(request);
        if(response?.ok)await cache.put(request,response.clone());
        return response;
      }catch(_){return Response.error();}
    })());
  }
});
