/* Financeiro Pro — service worker
   Objetivo: tornar o app instalável e abrir a "casca" offline.
   Os DADOS financeiros NÃO passam por aqui: Firebase/Firestore são de outros domínios
   e este worker só trata requisições do próprio site. */
const VERSAO = 'fp-v1';
const CASCA  = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(CASCA)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // Firebase, CDNs etc.: direto na rede

  // Rede primeiro (sempre a versão mais nova do app); cache só como reserva offline
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }).catch(() =>
      caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./') : Response.error()))
    )
  );
});
