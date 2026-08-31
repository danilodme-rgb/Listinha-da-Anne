// Service worker minimo: deixa o app instalavel e disponivel offline.
//
// O carimbo abaixo e' trocado a cada build (ver o plugin em vite.config.ts).
// E' ele que faz o navegador enxergar que o arquivo mudou -- sem isso o
// service worker sai identico em toda publicacao e o celular continuaria
// abrindo a versao antiga por dias.
const VERSAO = '__VERSAO__'

// Nome fixo de proposito: o cache do build anterior continua valendo enquanto
// o novo nao baixa. Trocar o nome a cada versao deixaria o app sem nada para
// mostrar se a internet caisse logo depois de atualizar.
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

// Quem quiser saber qual versao esta' instalada neste aparelho.
self.addEventListener('message', (evento) => {
  if (evento.data === 'versao') evento.source?.postMessage({ tipo: 'versao', versao: VERSAO })
})

// Network-first: sempre tenta a rede e guarda uma copia para quando faltar internet.
self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // Abertura de pagina vai direto ao servidor, ignorando o cache HTTP: o GitHub
  // Pages guarda o HTML por 10 minutos, e HTML velho aponta para arquivos .js
  // que a publicacao nova ja' apagou (tela branca).
  const daRede = req.mode === 'navigate'
    ? fetch(req.url, { cache: 'reload', credentials: 'same-origin' })
    : fetch(req)
  evento.respondWith(
    daRede
      .then((resposta) => {
        const copia = resposta.clone()
        void caches.open(CACHE).then((c) => c.put(req, copia))
        return resposta
      })
      .catch(() => caches.match(req).then((r) => r ?? caches.match('./'))),
  )
})
