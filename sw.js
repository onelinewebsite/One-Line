const CACHE='one-line-v32-profile-ui-20260927';
const CORE=[
  './index.html','./admin.html','./staff.html','./management.html','./receiver.html','./b2b.html',
  './css/styles-1.css','./css/styles-2.css','./css/styles-3.css','./css/v32.css','./css/admin.css',
  './js/config.js','./js/data.js','./js/msg91-widget.js','./js/backend.js','./js/designer.js','./js/app.js','./js/admin.js',
  './one-line-logo.webp','./favicon.png','./icon-192.png','./icon-512.png','./manifest.webmanifest',
  './assets/product-placeholder.svg','./assets/category-placeholder.svg','./assets/crew-tee.webp','./assets/crew-tee-back.webp','./assets/polo-shirt.webp',
  './assets/polo-shirt-back.webp','./assets/sports-jersey.webp','./assets/sports-jersey-back.webp','./assets/sleeve-side-neutral.webp','./assets/contact-support.webp',
  './assets/fast-uniform/shirt-preview.webp','./assets/fast-uniform/shirt-mask.png'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  const isCode=event.request.mode==='navigate'||/\.(?:js|css|html|webmanifest)$/.test(url.pathname);
  if(isCode){event.respondWith((async()=>{try{const response=await fetch(event.request,{cache:'no-cache'});if(response&&response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone());}return response;}catch(_){return(await caches.match(event.request))||(event.request.mode==='navigate'?await caches.match('./index.html'):Response.error());}})());return;}
  event.respondWith((async()=>{const cached=await caches.match(event.request);if(cached)return cached;const response=await fetch(event.request);if(response&&response.ok){const cache=await caches.open(CACHE);cache.put(event.request,response.clone());}return response;})());
});
