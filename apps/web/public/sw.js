const CACHE_VERSION = "v1";
const CACHE_NAME = `yomikiri-manga-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll([OFFLINE_URL]);
      } catch (error) {
        console.error("[sw] precache failed", error);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // ナビゲーション（HTML ページ遷移）以外は素通しする。
  // 投票 API（POST）や ISR/CDN キャッシュ対象の静的アセットとキャッシュ戦略を
  // 重複・競合させないため、SW はここでは一切介入しない。
  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(OFFLINE_URL);
        return cached ?? Response.error();
      }
    })(),
  );
});
