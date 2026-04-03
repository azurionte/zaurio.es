const CACHE_NAME = "velocichef-shell-v6";
const APP_URL = "/velocichef/";
const ASSETS = [
  APP_URL,
  `${APP_URL}index.html`,
  `${APP_URL}app.css`,
  `${APP_URL}app.js`,
  `${APP_URL}manifest.webmanifest`,
  `${APP_URL}assets/logo.png`,
  `${APP_URL}assets/mini_logo.png`,
  `${APP_URL}assets/store_icon.png`,
  "/shared/css/zaurio-ui.css",
  "/shared/js/zaurio-nav.js",
];
const NETWORK_FIRST_PATHS = new Set([
  APP_URL,
  `${APP_URL}index.html`,
  `${APP_URL}app.css`,
  `${APP_URL}app.js`,
  `${APP_URL}manifest.webmanifest`,
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => null),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const shouldCache =
    url.pathname.startsWith("/velocichef/") ||
    url.pathname.startsWith("/shared/");

  if (!shouldCache) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      const requestPath = url.pathname;
      const updateFromNetwork = () =>
        fetch(request)
          .then((response) => {
            if (response && response.ok) {
              cache.put(request, response.clone()).catch(() => null);
            }
            return response;
          });

      if (NETWORK_FIRST_PATHS.has(requestPath)) {
        return updateFromNetwork().catch(() => caches.match(request));
      }

      return caches.match(request).then((cached) => cached || updateFromNetwork().catch(() => cached));
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || APP_URL;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const matching = clients.find((client) => client.url.includes(APP_URL));
      if (matching) {
        matching.focus();
        matching.postMessage({ type: "open-url", url });
        return null;
      }
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("push", (event) => {
  const payload = (() => {
    if (!event.data) {
      return {
        title: "VelociChef",
        body: "Tienes un recordatorio pendiente en tu cocina semanal.",
        url: APP_URL,
      };
    }
    try {
      return event.data.json();
    } catch (_error) {
      return {
        title: "VelociChef",
        body: event.data.text(),
        url: APP_URL,
      };
    }
  })();

  event.waitUntil(
    self.registration.showNotification(payload.title || "VelociChef", {
      body: payload.body || "Abre la app para ver el detalle.",
      icon: payload.icon || `${APP_URL}assets/store_icon.png`,
      badge: payload.badge || `${APP_URL}assets/store_icon.png`,
      data: { url: payload.url || APP_URL },
      tag: payload.tag || `velocichef-${Date.now()}`,
    }),
  );
});
