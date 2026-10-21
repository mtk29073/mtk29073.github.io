// Service Worker：讓主畫面 App 可以離線開啟。版本號由 build.py 依網頁內容自動產生，網頁一更新就換新快取。
const VERSION = '81055cddafc6';
const CACHE = 'hexlab-' + VERSION;
const SHELL = ['./', 'index.html', 'config.js', 'owner_info.txt', 'manifest.webmanifest', 'pwa/icon-192.png', 'pwa/icon-512.png', 'pwa/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hexlab-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // 行情、同步等外部連線一律直接走網路，不快取
  const fresh = req.mode === 'navigate' || /\.(html|js|txt|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (fresh) {
    // 網頁本身：有網路就拿最新版（並更新快取），沒網路才用快取
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  } else {
    // 圖片等靜態檔：先用快取，背景再更新
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
