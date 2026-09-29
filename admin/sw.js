const CACHE='anza-admin-v2';
const SHELL=['/','/index.html','/style.css','/icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest','/src/app.mjs','/src/domain.mjs','/src/repository.mjs','/src/pdf.mjs','/src/backup.mjs'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  try{const response=await fetch(request);if(response.ok&&SHELL.includes(new URL(request.url).pathname)){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}return response}
  catch{const cached=await caches.match(request);if(cached)return cached;if(request.mode==='navigate')return caches.match('/index.html');return Response.error()}
 })());
});
