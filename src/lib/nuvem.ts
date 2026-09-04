import type { Estado } from './types'
import { semUndefined } from './sincronia'

export interface ConfigNuvem {
  apiKey: string
  authDomain: string
  databaseURL: string
  projectId: string
  appId: string
  /** Codigo da familia: separa os dados dentro do banco. */
  familia: string
}

export type StatusNuvem = 'desligado' | 'conectando' | 'ligado' | 'erro'

const CHAVE = 'listinha-da-anne/nuvem'

const doAmbiente = (): ConfigNuvem | null => {
  // `import.meta.env` some fora do Vite (o bundle dos testes, por exemplo).
  // Ler a configuracao nunca pode lancar: quem chama e' `alterar`, e uma
  // excecao ali derruba a gravacao de tudo.
  const e = (import.meta.env ?? {}) as Record<string, string | undefined>
  if (!e.VITE_FB_API_KEY || !e.VITE_FB_DATABASE_URL) return null
  return {
    apiKey: e.VITE_FB_API_KEY,
    authDomain: e.VITE_FB_AUTH_DOMAIN ?? '',
    databaseURL: e.VITE_FB_DATABASE_URL,
    projectId: e.VITE_FB_PROJECT_ID ?? '',
    appId: e.VITE_FB_APP_ID ?? '',
    familia: e.VITE_FB_FAMILIA ?? 'familia',
  }
}

export function lerConfigNuvem(): ConfigNuvem | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    if (bruto) return JSON.parse(bruto) as ConfigNuvem
  } catch { /* configuracao invalida: cai para o ambiente */ }
  return doAmbiente()
}

/**
 * O codigo da familia vira **pedaco do caminho no banco** (`familias/<codigo>/estado`),
 * e o Realtime Database recusa caminho com `.`, `#`, `$`, `[`, `]` ou `/` -- recusa
 * **lancando** dentro de `ref()`, o que aparecia como um "erro ao conectar" sem nenhuma
 * pista de que o problema era o que a pessoa digitou. Entao o codigo e' saneado na
 * entrada: o que sai daqui sempre serve como chave.
 */
export function normalizarFamilia(bruto: string): string {
  const limpo = bruto
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // tira acento
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')                      // espaco, ponto, barra, emoji…
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return limpo || 'familia'
}

/** O que a pessoa digitou vai ser mudado? Serve para avisar antes de salvar. */
export function familiaMudou(bruto: string): boolean {
  return bruto.trim() !== '' && normalizarFamilia(bruto) !== bruto.trim()
}

export function salvarConfigNuvem(c: ConfigNuvem | null): void {
  if (c) localStorage.setItem(CHAVE, JSON.stringify(c))
  else localStorage.removeItem(CHAVE)
}

/** Aceita o JSON que o console do Firebase entrega, com ou sem "const firebaseConfig =". */
export function interpretarConfig(texto: string, familia: string): ConfigNuvem | null {
  const pega = (campo: string) => {
    const m = new RegExp(`["']?${campo}["']?\\s*:\\s*["']([^"']+)["']`).exec(texto)
    return m ? m[1] : ''
  }
  const apiKey = pega('apiKey')
  let databaseURL = pega('databaseURL')
  const projectId = pega('projectId')
  if (!databaseURL && projectId) databaseURL = `https://${projectId}-default-rtdb.firebaseio.com`
  if (!apiKey || !databaseURL) return null
  return {
    apiKey,
    authDomain: pega('authDomain') || `${projectId}.firebaseapp.com`,
    databaseURL,
    projectId,
    appId: pega('appId'),
    familia: normalizarFamilia(familia),
  }
}

// ------------------------------------------------------------ link de sincronizacao

function paraBase64(texto: string): string {
  let bin = ''
  for (const b of new TextEncoder().encode(texto)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function deBase64(texto: string): string {
  const t = texto.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

/** Endereco que ja carrega a configuracao: abrir no outro celular liga a sincronizacao. */
export function linkDeSincronizacao(c: ConfigNuvem, base: string): string {
  return `${base}#sync=${paraBase64(JSON.stringify(c))}`
}

let veioDeLink = false

/**
 * Le o `#sync=` do endereco, guarda a configuracao e limpa a barra.
 * E' como o celular da Anne liga a sincronizacao: o app dela nao tem Ajustes.
 */
export function aplicarLinkDeSincronizacao(): void {
  const marca = '#sync='
  if (!location.hash.startsWith(marca)) return
  try {
    const c = JSON.parse(deBase64(location.hash.slice(marca.length))) as ConfigNuvem
    if (!c.apiKey || !c.databaseURL || !c.familia) return
    salvarConfigNuvem(c)
    veioDeLink = true
  } catch { /* link estragado: segue sem sincronizar */ }
  history.replaceState(null, '', location.pathname + location.search)
}

export function ligadaPeloLink(): boolean {
  return veioDeLink
}

/**
 * O link `#sync=` tambem tem de valer com o app **ja aberto**.
 *
 * Trocar so' o `#` de um endereco que ja' esta na tela **nao recarrega a pagina** -- e
 * `aplicarLinkDeSincronizacao` so' roda ao subir o app. Resultado: colar o link no
 * celular da Anne com o app aberto nao ligava nada, e a tela seguia dizendo "ainda nao
 * estou ligada", como se o link estivesse errado.
 */
export function vigiarLinkDeSincronizacao(): void {
  window.addEventListener('hashchange', () => {
    if (!location.hash.startsWith('#sync=')) return
    const antes = JSON.stringify(lerConfigNuvem())
    aplicarLinkDeSincronizacao()
    // recarrega so' quando a configuracao mudou de verdade: conectar exige subir
    // o app com ela, e recarregar a' toa e' susto sem motivo.
    if (JSON.stringify(lerConfigNuvem()) !== antes) location.reload()
  })
}

// ------------------------------------------------------------ conexao

interface Ganchos {
  aoReceber: (estado: Estado) => void
  aoMudarStatus: (s: StatusNuvem, detalhe?: string) => void
  /** Banco ainda sem nada: quem chama decide se publica o estado local. */
  aoNuvemVazia: () => void
}

let publicarReal: ((e: Estado) => void) | null = null
let lerAgora: (() => Promise<Estado | null>) | null = null
let pendente: Estado | null = null

/** Conecta ao Firebase Realtime Database (carregado sob demanda). */
export async function iniciarNuvem(config: ConfigNuvem, ganchos: Ganchos): Promise<void> {
  ganchos.aoMudarStatus('conectando')
  try {
    const [{ initializeApp }, { getAuth, signInAnonymously }, bd] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/database'),
    ])
    const app = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      databaseURL: config.databaseURL,
      projectId: config.projectId,
      appId: config.appId,
    })
    await signInAnonymously(getAuth(app))
    const caminho = bd.ref(bd.getDatabase(app), `familias/${config.familia}/estado`)

    bd.onValue(
      caminho,
      (snap) => {
        ganchos.aoMudarStatus('ligado')
        const valor = snap.val() as Estado | null
        if (valor && typeof valor.atualizadoEm === 'number') ganchos.aoReceber(valor)
        else ganchos.aoNuvemVazia()
      },
      (erro) => ganchos.aoMudarStatus('erro', erro.message),
    )

    // semUndefined: o RTDB recusa gravar undefined e lanca na hora. try/catch e
    // catch da promessa porque publicacao que falha nao pode derrubar o app --
    // tem que virar aviso de erro na tela de Ajustes.
    publicarReal = (estado) => {
      try {
        void bd.set(caminho, semUndefined(estado)).catch((erro: unknown) => {
          ganchos.aoMudarStatus('erro', erro instanceof Error ? erro.message : String(erro))
        })
      } catch (erro) {
        ganchos.aoMudarStatus('erro', erro instanceof Error ? erro.message : String(erro))
      }
    }
    lerAgora = async () => {
      const snap = await bd.get(caminho)
      const valor = snap.val() as Estado | null
      return valor && typeof valor.atualizadoEm === 'number' ? valor : null
    }
    if (pendente) { publicarReal(pendente); pendente = null }
  } catch (erro) {
    ganchos.aoMudarStatus('erro', erro instanceof Error ? erro.message : String(erro))
  }
}

export function publicarNaNuvem(estado: Estado): void {
  if (publicarReal) publicarReal(estado)
  else pendente = estado
}

export function nuvemAtiva(): boolean {
  return publicarReal !== null
}

/** Le o estado da nuvem uma vez, sob demanda (puxar-para-atualizar). */
export async function lerDaNuvemAgora(): Promise<Estado | null> {
  return lerAgora ? lerAgora() : null
}
