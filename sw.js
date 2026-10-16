/* Service worker: keeps the app working offline.
   Serves from the on-device cache instantly, then refreshes the cache in the background,
   so a new version appears the next time the app is opened.
   If you add a new file to the app, add it to FILES and bump VERSION. */
const VERSION='sonoform-v2';
const FILES=[
  './','index.html','manifest.webmanifest','css/app.css',
  'js/app.js','js/engine.js','js/schema.js','js/docx.js','js/util.js','js/ink.js',
  'fonts/instrument-sans.woff2','fonts/source-serif-4.woff2','fonts/source-serif-4-italic.woff2',
  'icons/favicon.svg','icons/icon-32.png','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache=>{
    const hit=await cache.match(req,{ignoreSearch:true})||(req.mode==='navigate'?await cache.match('index.html'):undefined);
    const fresh=fetch(req).then(res=>{if(res.ok&&res.type==='basic')cache.put(req,res.clone());return res}).catch(()=>hit||Response.error());
    if(hit){e.waitUntil(fresh);return hit}
    return fresh;
  }));
});
