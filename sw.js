const C='c25-v1',F=['./','index.html','css/style.css','js/main.js','js/data.js','manifest.webmanifest','public/icon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
