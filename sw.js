// Pedix Go — Service Worker v1.0.2
// FIX (relato Falcao — 404 ao instalar o app): manifest.json e este arquivo
// referenciavam './pedix-go.html', mas o arquivo deployado no Netlify é
// index.html — o ícone instalado tentava abrir uma URL inexistente. CACHE_NAME
// também foi incrementado para forçar os dispositivos que já instalaram (com
// o cache antigo/quebrado) a buscar os assets corretos na próxima abertura.
const CACHE_NAME = 'pedix-go-v3';
const ASSETS = [
  './',
  './index.html',
  './icon_192x192.png',
  './icon_512x512.png',
  './manifest.json'
];

// ── Instalação — pré-cache dos assets principais ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── Ativação — limpa caches antigos ──────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, fallback cache ────────────────────────────────
// Firebase e APIs sempre vão pela rede — nunca cacheados
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Firebase, APIs externas — sempre rede
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com')
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Assets locais — Network first, fallback cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Atualiza cache com versão mais recente
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── Push Notifications (futuro) ──────────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  self.registration.showNotification(data.title || 'Pedix Go', {
    body: data.body || 'Nova entrega disponível!',
    icon: './icon_192x192.png',
    badge: './icon_192x192.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || './' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data.url || './')
  );
});
