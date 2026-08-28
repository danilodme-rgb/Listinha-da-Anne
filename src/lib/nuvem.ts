import type { Estado } from './types'

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
  const e = import.meta.env
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
    familia: familia.trim() || 'familia',
  }
}

interface Ganchos {
  aoReceber: (estado: Estado) => void
  aoMudarStatus: (s: StatusNuvem, detalhe?: string) => void
}

let publicarReal: ((e: Estado) => void) | null = null
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
      },
      (erro) => ganchos.aoMudarStatus('erro', erro.message),
    )

    publicarReal = (estado) => { void bd.set(caminho, estado) }
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
