// YKS Dilay Takip - uygulama dosyalarini telefona kaydeder (internetsiz de acilsin)
const SURUM = 'dilay-takip-v3';
// aksam bildirimi
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { metin: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.baslik || 'YKS Dilay Takip', { body: d.metin || '', icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './index.html#plan' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(L => L.length ? L[0].focus() : self.clients.openWindow(e.notification.data.url)));
});
const DOSYALAR = ['./', './index.html', './config.js', './bulut.js', './kaynak-veri.js', './deneme-veri.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;   // veritabani istekleri her zaman canli
  // once internetten guncelini dene, olmazsa kayitli kopya
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(SURUM).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
