// sw.js — Service Worker（Stale-While-Revalidate + 強制更新）
// Requirements: 8.1, 8.2, 8.3, 8.4

// ★ バージョンを変更するだけで全キャッシュが入れ替わる
const CACHE_VERSION = 4;
const CACHE_NAME = `quad-attr-v${CACHE_VERSION}`;

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

// ─── install: 全アセットをプリキャッシュし、即座にアクティベート ────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // 待機中の新しい SW を即座にアクティブにする
  self.skipWaiting();
});

// ─── activate: 古いキャッシュを削除し、全クライアントを即座に制御 ──────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => {
      // 全クライアント（タブ）に更新を通知
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        });
      });
    })
  );
  // 新しい SW が即座に全ページを制御する
  self.clients.claim();
});

// ─── fetch: Stale-While-Revalidate ストラテジー ───────────────────────────────
// キャッシュがあれば即座に返しつつ、バックグラウンドで最新版を取得してキャッシュを更新

self.addEventListener('fetch', (event) => {
  // ナビゲーションリクエスト以外の外部リクエストはそのままフェッチ
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cached) => {
        // バックグラウンドでネットワークから最新を取得しキャッシュを更新
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // オフライン時はキャッシュのみ
          return cached;
        });

        // キャッシュがあれば即座に返す（次回アクセス時に最新が使われる）
        return cached || fetchPromise;
      });
    })
  );
});

// ─── message: クライアントからの強制更新リクエストに対応 ──────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
