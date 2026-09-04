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

// Teto de itens guardados. As chaves saem na ordem em que entraram, entao o
// que e' descartado primeiro e' o das versoes mais antigas. Sem teto, cada
// publicacao empilha um conjunto novo de arquivos e um dia a cota estoura.
const MAX_ITENS = 120

self.addEventListener('install', (evento) => {
  self.skipWaiting()
  evento.waitUntil(caches.open(CACHE))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const chaves = await caches.keys()
    await Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    await podar()
    await self.clients.claim()
  })())
})

async function podar() {
  try {
    const cache = await caches.open(CACHE)
    const chaves = await cache.keys()
    if (chaves.length <= MAX_ITENS) return
    await Promise.all(chaves.slice(0, chaves.length - MAX_ITENS).map((k) => cache.delete(k)))
  } catch { /* sem espaco ou sem permissao: segue sem podar */ }
}

/**
 * So' guarda resposta boa. `fetch` nao rejeita em 404 -- e um 404 guardado no
 * lugar de um `.js` que a publicacao nova apagou envenena aquela URL para
 * sempre, porque nunca mais vai existir um 200 para sobrescrever.
 */
async function guardar(req, resposta) {
  if (!resposta || !resposta.ok || resposta.type === 'opaque') return
  try {
    const cache = await caches.open(CACHE)
    await cache.put(req, resposta)
  } catch { /* cota estourada: o app segue funcionando, so' sem cache novo */ }
}

self.addEventListener('message', (evento) => {
  const dado = evento.data
  if (dado === 'versao') {
    evento.source?.postMessage({ tipo: 'versao', versao: VERSAO })
    return
  }
  // A pagina manda o que acabou de carregar. Na primeira visita nada passa
  // pelo service worker (ele so' e' registrado depois), e sem isso quem
  // instalasse o app e ficasse sem internet nao conseguiria abrir.
  if (dado && dado.tipo === 'guardar' && Array.isArray(dado.urls)) {
    evento.waitUntil((async () => {
      const cache = await caches.open(CACHE)
      for (const url of dado.urls.slice(0, 60)) {
        try {
          if (await cache.match(url)) continue
          const r = await fetch(url, { cache: 'no-cache' })
          if (r.ok) await cache.put(url, r)
        } catch { /* uma url que falhou nao pode parar as outras */ }
      }
    })())
  }
})

// Tocar no aviso abre (ou traz para a frente) o app deste escopo -- /anne/ ou
// /kelly/, nunca o do outro perfil. Sem isso o aviso aparece e nao leva a lugar
// nenhum, e no Android ele nem sequer some da barra ao ser tocado.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  evento.waitUntil((async () => {
    const alvo = new URL(self.registration.scope).href
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const janela of janelas) {
      if (janela.url.startsWith(alvo) && 'focus' in janela) return janela.focus()
    }
    return self.clients.openWindow(alvo)
  })())
})

// Network-first: sempre tenta a rede e guarda uma copia para quando faltar internet.
self.addEventListener('fetch', (evento) => {
  const req = evento.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  const navegacao = req.mode === 'navigate'

  // Abertura de pagina vai direto ao servidor, ignorando o cache HTTP: o GitHub
  // Pages guarda o HTML por 10 minutos, e HTML velho aponta para arquivos .js
  // que a publicacao nova ja' apagou (tela branca).
  const daRede = navegacao
    ? fetch(req.url, { cache: 'reload', credentials: 'same-origin' })
    : fetch(req)

  evento.respondWith(
    daRede
      .then((resposta) => {
        void guardar(req, resposta.clone())
        // navegacao nao aceita resposta marcada como vinda de redirecionamento
        if (navegacao && resposta.redirected) {
          return new Response(resposta.body, {
            status: resposta.status,
            statusText: resposta.statusText,
            headers: resposta.headers,
          })
        }
        return resposta
      })
      .catch(async () => {
        const guardada = await caches.match(req)
        if (guardada) return guardada
        // Sem internet e sem copia: para `.js` e `.css` e' melhor falhar do que
        // devolver HTML, que o navegador recusaria por tipo errado e daria tela
        // branca. So' navegacao cai para a pagina de entrada -- a do proprio
        // endereco aberto (/anne/, /kelly/ ou a raiz), nunca a de outro perfil.
        if (!navegacao) return Response.error()
        const entrada = await caches.match(new URL('./', req.url).href)
        return entrada ?? (await caches.match(self.registration.scope)) ?? Response.error()
      }),
  )
})
