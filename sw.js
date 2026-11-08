// Guarda en el celular lo que ya se descargó (modelos .glb, three.js, fuentes) para abrir más rápido.
// Si subes una versión nueva y no la ves, cambia el número de VERSION.
const VERSION = 'ar-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.pathname.endsWith('.mp4')) return;          // el video va directo, sin guardar

  // La página: primero la red (así ves los cambios), y si no hay internet, la guardada
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copia = res.clone();
          caches.open(VERSION).then((c) => c.put(url.origin + url.pathname, copia));
        }
        return res;
      }).catch(() => caches.match(url.origin + url.pathname).then((r) => r || Response.error()))
    );
    return;
  }

  // Lo demás: responde al instante con lo guardado y se actualiza por detrás
  e.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req).then((guardado) => {
        const red = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone());
          return res;
        }).catch(() => guardado);
        return guardado || red;
      })
    )
  );
});
