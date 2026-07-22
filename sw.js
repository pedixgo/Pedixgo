// Service Worker — Pedix Go
// v1.0.0 — 2026-07-21
//
// Propósito: satisfazer o critério de instalabilidade PWA do Chrome
// (precisa existir um Service Worker registrado com handler de fetch).
// DE PROPÓSITO não guarda nada em cache agressivo — o Pedix Go depende
// de dados sempre atualizados em tempo real (pedidos disponíveis,
// status de entrega), e cache de conteúdo velho já causou bugs sérios
// nos outros apps desta mesma plataforma ("fotos sumindo", app preso em
// versão antiga do código). Estratégia: network-first, sem fallback de
// cache — se não tem internet, o app já lida com isso via a
// persistência offline do Firestore (initializeFirestore +
// persistentLocalCache), não precisa de mais uma camada de cache aqui.

const SW_VERSION = 'pedixgo-v1';

self.addEventListener('install', (event) => {
  // Ativa a versão nova imediatamente, sem esperar todas as abas antigas fecharem
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume controle de todas as abas abertas imediatamente
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network-first, sem cache: só repassa a requisição pra rede normal.
  // Esse handler precisa existir (mesmo vazio na prática) pro Chrome
  // considerar o app instalável — sem ele, beforeinstallprompt nunca
  // dispara, mesmo com manifest.json correto.
  event.respondWith(fetch(event.request));
});
