// Service worker minimo: deixa o app instalavel e disponivel offline.
const CACHE = 'listinha-v2'

self.addEventListener('install', (evento) => {
  self.skipWaiting()
  evento.waitUntil(caches.open(CACHE))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
    ).then(() => self.clients.claim()),
  )
})

// Network-first: sempre tenta a rede e guarda uma copia para quando faltar internet.
self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  evento.respondWith(
    fetch(req)
      .then((resposta) => {
        const copia = resposta.clone()
        void caches.open(CACHE).then((c) => c.put(req, copia))
        return resposta
      })
      .catch(() => caches.match(req).then((r) => r ?? caches.match('./'))),
  )
})
