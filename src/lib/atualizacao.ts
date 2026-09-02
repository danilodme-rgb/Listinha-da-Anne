/**
 * Atualizacao automatica dos tres apps (/, /anne/ e /kelly/).
 *
 * Publicar no GitHub Pages nao basta: o celular tem o app instalado e o
 * service worker guarda uma copia, entao ele continuaria abrindo a versao
 * antiga ate' alguem fechar o app de vez. Aqui o app procura versao nova
 * (ao abrir, ao voltar para a frente, ao reconectar e de meia em meia hora);
 * quando o service worker novo assume, a tela recarrega sozinha.
 *
 * Recarregar e' seguro: toda mudanca ja' foi gravada no localStorage na hora
 * em que aconteceu (`alterar` em store.ts). Perde-se no maximo um texto
 * digitado pela metade.
 */

/** Espaco minimo entre duas procuras, para nao martelar o servidor. */
const MIN_ENTRE_PROCURAS = 60_000
/** Procura de rotina, para o app que fica dias aberto no celular. */
const INTERVALO = 30 * 60_000

/** Carimbo desta versao (trocado no build). */
export function versaoDoApp(): string {
  return typeof __VERSAO_APP__ === 'string' ? __VERSAO_APP__ : 'dev'
}

/**
 * So' recarrega quando um service worker novo substituiu um que ja' existia.
 * Na primeira visita o service worker tambem assume o controle da pagina --
 * recarregar ali seria um susto sem motivo nenhum.
 */
export function deveRecarregar(e: { ehTroca: boolean; jaRecarregando: boolean }): boolean {
  return e.ehTroca && !e.jaRecarregando
}

/** Evita uma enxurrada de procuras quando a tela pisca de frente para tras. */
export function podeProcurar(agora: number, ultima: number): boolean {
  return agora - ultima >= MIN_ENTRE_PROCURAS
}

let registro: ServiceWorkerRegistration | null = null

/** Registra o service worker e passa a vigiar se saiu versao nova. */
export function vigiarAtualizacoes(caminhoDoSw: string): void {
  if (!('serviceWorker' in navigator)) return

  // Vira true quando aparece um service worker novo tendo um antigo no lugar --
  // e' o que separa "saiu versao nova" de "acabou de instalar pela primeira vez".
  let ehTroca = false
  let jaRecarregando = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!deveRecarregar({ ehTroca, jaRecarregando })) return
    jaRecarregando = true
    avisarERecarregar()
  })

  void navigator.serviceWorker
    .register(caminhoDoSw, { updateViaCache: 'none' })
    .then((reg) => {
      registro = reg
      // `installing` tambem conta: com skipWaiting o service worker novo quase
      // nunca fica em `waiting`, e o navegador ja' pode te-lo comecado antes
      // deste registro -- nesse caso o `updatefound` abaixo nunca chega.
      if (reg.active && (reg.waiting || reg.installing)) ehTroca = true
      reg.addEventListener('updatefound', () => { if (reg.active) ehTroca = true })
      let ultima = Date.now()
      const procurar = () => {
        const agora = Date.now()
        if (!podeProcurar(agora, ultima)) return
        ultima = agora
        void reg.update().catch(() => { /* sem internet: fica para a proxima */ })
      }
      guardarOQueJaCarregou()
      setInterval(procurar, INTERVALO)
      window.addEventListener('focus', procurar)
      window.addEventListener('online', procurar)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') procurar()
      })
    })
    .catch(() => { /* sem service worker o app funciona igual, so' nao se atualiza sozinho */ })
}

/**
 * Procura agora (botao em Ajustes). `nova` = achou versao nova e a tela vai
 * recarregar sozinha em seguida; `indisponivel` = este endereco nao tem
 * service worker (o caso do `npm run dev`).
 */
export async function procurarAtualizacao(): Promise<'nova' | 'atual' | 'indisponivel'> {
  if (!('serviceWorker' in navigator)) return 'indisponivel'
  const reg = registro ?? (await navigator.serviceWorker.getRegistration()) ?? null
  if (!reg) return 'indisponivel'
  await reg.update()
  return reg.installing || reg.waiting ? 'nova' : 'atual'
}

/**
 * Manda o service worker guardar o que esta pagina acabou de carregar.
 *
 * Na primeira visita nada passa por ele (so' e' registrado depois do `load`):
 * quem instalasse o app e ficasse sem internet antes de abrir de novo nao
 * conseguiria abrir.
 */
function guardarOQueJaCarregou(): void {
  void navigator.serviceWorker.ready.then((reg) => {
    const urls = [
      location.href,
      ...performance.getEntriesByType('resource').map((r) => r.name),
    ].filter((u) => u.startsWith(location.origin))
    reg.active?.postMessage({ tipo: 'guardar', urls })
  }).catch(() => { /* sem service worker: o app funciona igual, so' nao guarda */ })
}

function avisarERecarregar(): void {
  // App em segundo plano: troca na surdina, sem ninguem ver.
  if (document.visibilityState !== 'visible') { location.reload(); return }
  const aviso = document.createElement('div')
  aviso.className = 'atualizando'
  aviso.textContent = '✨ Novidade chegando...'
  document.body.appendChild(aviso)
  setTimeout(() => location.reload(), 1200)
}
