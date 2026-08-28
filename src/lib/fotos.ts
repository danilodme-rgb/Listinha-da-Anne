import { useSyncExternalStore } from 'react'

/**
 * Fotos que a Anne escolhe para enfeitar o app dela.
 *
 * Ficam no IndexedDB DESTE aparelho — de proposito fora do estado que
 * sincroniza. Assim elas nunca sobem para o Firebase nem para o repositorio:
 * sao uma copia pessoal, no celular de quem escolheu.
 */

const BANCO = 'listinha-fotos'
const LOJA = 'fotos'
export const MAX_FOTOS = 12

export interface Foto {
  id: string
  /** JPEG ja' reduzido, embutido como data URL. */
  imagem: string
  criadaEm: number
}

const VAZIO: Foto[] = []
let cache: Foto[] | null = null
const ouvintes = new Set<() => void>()

function avisar() {
  for (const o of ouvintes) o()
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const req = indexedDB.open(BANCO, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(LOJA)) req.result.createObjectStore(LOJA, { keyPath: 'id' })
    }
    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error ?? new Error('não consegui abrir o banco de fotos'))
  })
}

async function transacao<T>(modo: IDBTransactionMode, fn: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const bd = await abrir()
  try {
    return await new Promise<T>((ok, erro) => {
      const req = fn(bd.transaction(LOJA, modo).objectStore(LOJA))
      req.onsuccess = () => ok(req.result)
      req.onerror = () => erro(req.error ?? new Error('falha ao acessar as fotos'))
    })
  } finally {
    bd.close()
  }
}

/** Reduz a foto antes de guardar: celular tira em 4 MB, aqui basta ~1000px. */
async function reduzir(arquivo: File, maiorLado = 1000, qualidade = 0.82): Promise<string> {
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise<HTMLImageElement>((ok, erro) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => erro(new Error('arquivo não é uma imagem'))
      i.src = url
    })
    const escala = Math.min(1, maiorLado / Math.max(img.width, img.height))
    const largura = Math.max(1, Math.round(img.width * escala))
    const altura = Math.max(1, Math.round(img.height * escala))
    const tela = document.createElement('canvas')
    tela.width = largura
    tela.height = altura
    const ctx = tela.getContext('2d')
    if (!ctx) throw new Error('navegador não permitiu processar a imagem')
    ctx.drawImage(img, 0, 0, largura, altura)
    return tela.toDataURL('image/jpeg', qualidade)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function carregarFotos(): Promise<void> {
  if (cache) return
  try {
    const todas = await transacao<Foto[]>('readonly', (l) => l.getAll() as IDBRequest<Foto[]>)
    cache = todas.sort((a, b) => a.criadaEm - b.criadaEm)
  } catch {
    cache = []
  }
  avisar()
}

export async function adicionarFotos(arquivos: FileList | File[]): Promise<{ salvas: number; erro?: string }> {
  await carregarFotos()
  const espaco = MAX_FOTOS - (cache?.length ?? 0)
  if (espaco <= 0) return { salvas: 0, erro: `Cabem no máximo ${MAX_FOTOS} fotos. Apague alguma antes.` }

  let salvas = 0
  let erro: string | undefined
  for (const arquivo of Array.from(arquivos).slice(0, espaco)) {
    try {
      const foto: Foto = {
        id: `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        imagem: await reduzir(arquivo),
        criadaEm: Date.now(),
      }
      await transacao('readwrite', (l) => l.put(foto))
      cache = [...(cache ?? []), foto]
      salvas += 1
    } catch (e) {
      erro = e instanceof Error ? e.message : 'não consegui guardar essa foto'
    }
  }
  avisar()
  return { salvas, erro }
}

export async function apagarFoto(id: string): Promise<void> {
  await transacao('readwrite', (l) => l.delete(id))
  cache = (cache ?? []).filter((f) => f.id !== id)
  avisar()
}

export function useFotos(): Foto[] {
  return useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb)
      void carregarFotos()
      return () => ouvintes.delete(cb)
    },
    () => cache ?? VAZIO,
  )
}
