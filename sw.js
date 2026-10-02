const CACHE = "ledger-v3";
const FILES = ["./", "index.html", "manifest.json", "icon.svg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// 網路優先，失敗時用快取（離線可用）。
// 只處理自己網站的檔案：對 Apps Script 等其他網域的請求（雲端同步）一律不攔截，
// 否則同步回應（含網址上的 TOKEN）會被存進快取，網路不穩時還可能回傳過期資料。
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: "no-store" }).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then(r => r || Response.error()))
  );
});
