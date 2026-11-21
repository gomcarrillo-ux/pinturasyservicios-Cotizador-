/* Service worker: la app abre sin internet y se actualiza sola cuando hay conexión */
const CACHE = 'cotizador-v1';
const BASE = ['./', 'index.html', 'css/cotizador.css', 'js/cotizador.js', 'js/logo-data.js',
              'static/logo.png', 'static/fondo.jpg', 'static/icon.png', 'manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function guardar(req, res) {
  if (res && (res.ok || res.type === 'opaque')) {
    const copia = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copia));
  }
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    // Primero internet (siempre la versión más nueva); si no hay, lo guardado
    e.respondWith(
      fetch(req).then((res) => guardar(req, res))
        .catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
  } else if (url.hostname === 'cdnjs.cloudflare.com') {
    // Librería del PDF: se guarda la primera vez y luego funciona sin internet
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => guardar(req, res))));
  }
});
