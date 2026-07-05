// sw.js — Service Worker（Cache-first 戦略）
// Requirements: 8.1, 8.2, 8.3, 8.4

const CACHE_NAME = 'quad-attr-v2';

const ASSETS = [
  './',
  './index.html',
  './css/base.css',
  './css/board.css',
  './css/piece.css',
  './css/overlays.css',
  './js/constants.js',
  './js/logic.js',
  './js/render.js',
  './js/main.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ─── install: 全アセットをプリキャッシュ ───────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ─── activate: 古いキャッシュを削除 ───────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── fetch: Cache-first ストラテジー ──────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request))
  );
});
