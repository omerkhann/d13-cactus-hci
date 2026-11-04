/* Stores the page and trip data on the phone so it opens with no connection (R2).
   Network first, so a fresh copy is used whenever there is a connection; the stored copy is the fallback. */
var CACHE = "rsp-v1";
var FILES = ["./","index.html","setup.html","trip.html","alerts.html","other.html","app.css","app.js","data.json"];
self.addEventListener("install", function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); })); self.clients.claim(); });
self.addEventListener("fetch", function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(fetch(e.request).then(function(res){
    var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); return res;
  }).catch(function(){ return caches.match(e.request, { ignoreSearch:true }); }));
});
