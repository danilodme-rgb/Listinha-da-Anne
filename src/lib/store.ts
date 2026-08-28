import { useSyncExternalStore } from 'react'
import type { Afazer, Aviso, Estado, ListaDoDia, Perfil, StatusDia, TarefaDoDia } from './types'
import { chave, somaDias, paraData } from './dates'
import { iniciarNuvem, lerConfigNuvem, publicarNaNuvem, type StatusNuvem } from './nuvem'

const CHAVE_LS = 'listinha-da-anne/estado'
const VERSAO = 1

export const AFAZERES_PADRAO: Afazer[] = [
  { id: 'a1', emoji: '🛏️', titulo: 'Arrumar a cama', valor: 1 },
  { id: 'a2', emoji: '🦷', titulo: 'Escovar os dentes', valor: 0.5 },
  { id: 'a3', emoji: '🧸', titulo: 'Guardar os brinquedos', valor: 1.5 },
  { id: 'a4', emoji: '📚', titulo: 'Fazer a lição de casa', valor: 2 },
  { id: 'a5', emoji: '🍽️', titulo: 'Ajudar a pôr a mesa', valor: 1 },
  { id: 'a6', emoji: '👕', titulo: 'Roupa suja no cesto', valor: 1 },
  { id: 'a7', emoji: '🎒', titulo: 'Arrumar a mochila', valor: 1.5 },
  { id: 'a8', emoji: '🌱', titulo: 'Regar as plantinhas', valor: 1 },
  { id: 'a9', emoji: '🐶', titulo: 'Cuidar do pet', valor: 1 },
  { id: 'a10', emoji: '🚿', titulo: 'Tomar banho na hora certa', valor: 1 },
]

export const RECADOS_SUGERIDOS = [
  'Bom dia, princesa! A mamãe te ama muito. 💜',
  'Você é capaz de tudo, meu amor! Capricha hoje. ⭐',
  'Que orgulho da minha menina! Vamos lá? 🌸',
  'Hoje o dia é seu! Faça com carinho. 🌈',
  'Mamãe está pertinho, mesmo trabalhando. Beijo! 😘',
]

export function estadoNovo(): Estado {
  return {
    versao: VERSAO,
    atualizadoEm: Date.now(),
    escala: {},
    comPapai: {},
    comPapaiAutomatico: true,
    afazeres: AFAZERES_PADRAO,
    listas: {},
    pagamentos: [],
    avisos: [],
    config: { pinKelly: null, somConquista: true },
  }
}

function migrar(bruto: unknown): Estado {
  const base = estadoNovo()
  if (!bruto || typeof bruto !== 'object') return base
  const e = bruto as Partial<Estado>
  return {
    ...base,
    ...e,
    escala: e.escala ?? {},
    comPapai: e.comPapai ?? {},
    afazeres: e.afazeres?.length ? e.afazeres : base.afazeres,
    listas: e.listas ?? {},
    pagamentos: e.pagamentos ?? [],
    avisos: e.avisos ?? [],
    config: { ...base.config, ...(e.config ?? {}) },
    versao: VERSAO,
  }
}

function carregar(): Estado {
  try {
    const bruto = localStorage.getItem(CHAVE_LS)
    if (bruto) return migrar(JSON.parse(bruto))
  } catch { /* dados corrompidos: comeca do zero */ }
  return estadoNovo()
}

let estado: Estado = carregar()
const ouvintes = new Set<() => void>()
let instantaneoNuvem: { status: StatusNuvem; detalhe: string } = { status: 'desligado', detalhe: '' }
const ouvintesNuvem = new Set<() => void>()

function avisarTodos() {
  for (const o of ouvintes) o()
}

function persistir() {
  try {
    localStorage.setItem(CHAVE_LS, JSON.stringify(estado))
  } catch { /* armazenamento cheio: segue em memoria */ }
}

/** Aplica uma mudanca local: carimba a hora, salva e publica na nuvem. */
export function alterar(fn: (rascunho: Estado) => void): void {
  const rascunho: Estado = structuredClone(estado)
  fn(rascunho)
  rascunho.atualizadoEm = Date.now()
  estado = rascunho
  persistir()
  publicarNaNuvem(estado)
  avisarTodos()
}

/** Estado vindo da nuvem: so' entra se for mais novo que o local. */
function receberDaNuvem(remoto: Estado) {
  if (remoto.atualizadoEm <= estado.atualizadoEm) return
  estado = migrar(remoto)
  persistir()
  avisarTodos()
}

export function conectarNuvem(): void {
  const config = lerConfigNuvem()
  if (!config) return
  void iniciarNuvem(config, {
    aoReceber: receberDaNuvem,
    aoMudarStatus: (s, d) => {
      instantaneoNuvem = { status: s, detalhe: d ?? '' }
      for (const o of ouvintesNuvem) o()
    },
  })
}

export function useEstado(): Estado {
  return useSyncExternalStore(
    (cb) => { ouvintes.add(cb); return () => ouvintes.delete(cb) },
    () => estado,
  )
}

export function useStatusNuvem(): { status: StatusNuvem; detalhe: string } {
  return useSyncExternalStore(
    (cb) => { ouvintesNuvem.add(cb); return () => ouvintesNuvem.delete(cb) },
    () => instantaneoNuvem,
  )
}

export function exportarEstado(): Estado {
  return estado
}

export function importarEstado(bruto: unknown): void {
  alterar((e) => {
    Object.assign(e, migrar(bruto))
  })
}

// ---------------------------------------------------------------- identificadores

let contador = 0
export function novoId(prefixo = 'id'): string {
  contador += 1
  return `${prefixo}_${Date.now().toString(36)}_${contador.toString(36)}`
}

// ---------------------------------------------------------------- avisos

export function marcarAvisosLidos(para: Perfil): void {
  alterar((e) => {
    for (const a of e.avisos) if (a.para === para) a.lido = true
  })
}

export function avisosDe(e: Estado, para: Perfil): Aviso[] {
  return e.avisos.filter((a) => a.para === para)
}

export function naoLidos(e: Estado, para: Perfil): number {
  return e.avisos.filter((a) => a.para === para && !a.lido).length
}

// ---------------------------------------------------------------- escala

export function definirDia(data: string, status: StatusDia | null, nota?: string): void {
  alterar((e) => {
    if (status === null) delete e.escala[data]
    else e.escala[data] = { status, nota: nota ?? e.escala[data]?.nota }
  })
}

export function aplicarLeitura(
  ano: number,
  mes: number,
  dias: Record<string, StatusDia>,
  notas: Record<string, string>,
  limparNaoReconhecidos: number[],
): void {
  alterar((e) => {
    for (const [dia, status] of Object.entries(dias)) {
      const k = chave(new Date(ano, mes, Number(dia)))
      e.escala[k] = { status, nota: notas[dia] }
    }
    for (const dia of limparNaoReconhecidos) {
      const k = chave(new Date(ano, mes, dia))
      delete e.escala[k]
    }
  })
}

export function limparMes(ano: number, mes: number): void {
  alterar((e) => {
    for (const k of Object.keys(e.escala)) {
      const d = paraData(k)
      if (d.getFullYear() === ano && d.getMonth() === mes) delete e.escala[k]
    }
  })
}

/** A Anne esta na casa do pai? Folga do Alexandre = ele na cidade. */
export function comPapai(e: Estado, data: string): boolean {
  const manual = e.comPapai[data]
  if (manual !== undefined) return manual
  return e.comPapaiAutomatico && e.escala[data]?.status === 'folga'
}

export function alternarComPapai(data: string): void {
  alterar((e) => {
    const automatico = e.comPapaiAutomatico && e.escala[data]?.status === 'folga'
    const novo = !(e.comPapai[data] ?? automatico)
    // volta ao automatico quando o valor manual coincide com a regra
    if (novo === automatico) delete e.comPapai[data]
    else e.comPapai[data] = novo
  })
}

// ---------------------------------------------------------------- catalogo de afazeres

export function salvarAfazer(a: Afazer): void {
  alterar((e) => {
    const i = e.afazeres.findIndex((x) => x.id === a.id)
    if (i >= 0) e.afazeres[i] = a
    else e.afazeres.push(a)
  })
}

export function removerAfazer(id: string): void {
  alterar((e) => { e.afazeres = e.afazeres.filter((a) => a.id !== id) })
}

// ---------------------------------------------------------------- listas do dia

export function listaDe(e: Estado, data: string): ListaDoDia {
  return e.listas[data] ?? { data, recado: '', tarefas: [] }
}

function garantirLista(e: Estado, data: string): ListaDoDia {
  if (!e.listas[data]) e.listas[data] = { data, recado: '', tarefas: [] }
  return e.listas[data]
}

export function alternarAfazerNaLista(data: string, afazer: Afazer): void {
  alterar((e) => {
    const lista = garantirLista(e, data)
    const i = lista.tarefas.findIndex((t) => t.titulo === afazer.titulo && !t.feita)
    if (i >= 0) lista.tarefas.splice(i, 1)
    else lista.tarefas.push({
      id: novoId('t'), emoji: afazer.emoji, titulo: afazer.titulo,
      valor: afazer.valor, feita: false, conferida: false,
    })
  })
}

export function adicionarTarefa(data: string, tarefa: Omit<TarefaDoDia, 'id' | 'feita' | 'conferida'>): void {
  alterar((e) => {
    garantirLista(e, data).tarefas.push({ ...tarefa, id: novoId('t'), feita: false, conferida: false })
  })
}

export function removerTarefa(data: string, id: string): void {
  alterar((e) => {
    const lista = e.listas[data]
    if (lista) lista.tarefas = lista.tarefas.filter((t) => t.id !== id)
  })
}

export function definirRecado(data: string, recado: string): void {
  alterar((e) => { garantirLista(e, data).recado = recado })
}

export function enviarLista(data: string): void {
  alterar((e) => {
    const lista = garantirLista(e, data)
    lista.enviadaEm = Date.now()
    lista.vistaEm = undefined
    e.avisos.unshift({
      id: novoId('av'), para: 'anne', em: Date.now(),
      titulo: 'A mamãe montou uma listinha pra você! 💌',
      texto: lista.recado ? `Tem recado: “${lista.recado}”` : 'Corre ver o que tem pra hoje!',
      lido: false,
    })
  })
}

export function marcarListaVista(data: string): void {
  alterar((e) => {
    const lista = e.listas[data]
    if (lista && lista.enviadaEm && !lista.vistaEm) lista.vistaEm = Date.now()
  })
}

export type ModoReplica = 'todos' | 'uteis' | 'em-casa'

/** Copia a lista de um dia para os dias seguintes ate' a data limite. */
export function replicarLista(origem: string, ate: string, modo: ModoReplica, enviar: boolean): number {
  let copiados = 0
  alterar((e) => {
    const base = e.listas[origem]
    if (!base) return
    let d = somaDias(origem, 1)
    let guarda = 0
    while (d <= ate && guarda < 400) {
      guarda += 1
      const dia = paraData(d).getDay()
      const foraDeCasa = e.comPapai[d] !== undefined
        ? e.comPapai[d]
        : e.comPapaiAutomatico && e.escala[d]?.status === 'folga'
      const pula =
        (modo === 'uteis' && (dia === 0 || dia === 6)) ||
        (modo === 'em-casa' && foraDeCasa)
      if (!pula) {
        e.listas[d] = {
          data: d,
          recado: base.recado,
          tarefas: base.tarefas.map((t) => ({
            id: novoId('t'), emoji: t.emoji, titulo: t.titulo, valor: t.valor,
            feita: false, conferida: false,
          })),
          enviadaEm: enviar ? Date.now() : undefined,
        }
        copiados += 1
      }
      d = somaDias(d, 1)
    }
  })
  return copiados
}

// ---------------------------------------------------------------- execucao e carteira

export function concluirTarefa(data: string, id: string): void {
  alterar((e) => {
    const t = e.listas[data]?.tarefas.find((x) => x.id === id)
    if (!t || t.feita) return
    t.feita = true
    t.feitaEm = Date.now()
    e.avisos.unshift({
      id: novoId('av'), para: 'kelly', em: Date.now(),
      titulo: `Anne concluiu: ${t.emoji} ${t.titulo}`,
      texto: `Aguardando sua conferência • ${t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
      lido: false,
    })
  })
}

export function desfazerTarefa(data: string, id: string): void {
  alterar((e) => {
    const t = e.listas[data]?.tarefas.find((x) => x.id === id)
    if (!t || t.conferida) return
    t.feita = false
    t.feitaEm = undefined
  })
}

export function conferirTarefa(data: string, id: string): void {
  alterar((e) => {
    const t = e.listas[data]?.tarefas.find((x) => x.id === id)
    if (!t || !t.feita || t.conferida) return
    t.conferida = true
    t.conferidaEm = Date.now()
    e.avisos.unshift({
      id: novoId('av'), para: 'anne', em: Date.now(),
      titulo: 'Mamãe conferiu! 🎉',
      texto: `${t.emoji} ${t.titulo} — o dinheiro já está no seu cofrinho.`,
      lido: false,
    })
  })
}

export function conferirTudo(data: string): number {
  let n = 0
  alterar((e) => {
    const lista = e.listas[data]
    if (!lista) return
    for (const t of lista.tarefas) {
      if (t.feita && !t.conferida) { t.conferida = true; t.conferidaEm = Date.now(); n += 1 }
    }
    if (n > 0) {
      e.avisos.unshift({
        id: novoId('av'), para: 'anne', em: Date.now(),
        titulo: 'Mamãe conferiu tudo! 🎉',
        texto: `${n} ${n === 1 ? 'tarefa conferida' : 'tarefas conferidas'} — dinheiro no cofrinho!`,
        lido: false,
      })
    }
  })
  return n
}

export function registrarPagamento(valor: number, descricao: string): void {
  alterar((e) => {
    e.pagamentos.unshift({ id: novoId('pg'), em: Date.now(), valor, descricao })
    e.avisos.unshift({
      id: novoId('av'), para: 'anne', em: Date.now(),
      titulo: 'Você recebeu a mesada! 💰',
      texto: `${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} — ${descricao}`,
      lido: false,
    })
  })
}

export interface Carteira {
  conferido: number
  aguardando: number
  pago: number
  saldo: number
}

export function carteira(e: Estado): Carteira {
  let conferido = 0
  let aguardando = 0
  for (const lista of Object.values(e.listas)) {
    for (const t of lista.tarefas) {
      if (t.conferida) conferido += t.valor
      else if (t.feita) aguardando += t.valor
    }
  }
  const pago = e.pagamentos.reduce((s, p) => s + p.valor, 0)
  return { conferido, aguardando, pago, saldo: conferido - pago }
}

/** Tarefas concluidas esperando o botao "Conferido". */
export function pendentesDeConferencia(e: Estado): Array<{ data: string; tarefa: TarefaDoDia }> {
  const fora: Array<{ data: string; tarefa: TarefaDoDia }> = []
  for (const lista of Object.values(e.listas)) {
    for (const t of lista.tarefas) if (t.feita && !t.conferida) fora.push({ data: lista.data, tarefa: t })
  }
  return fora.sort((a, b) => (b.tarefa.feitaEm ?? 0) - (a.tarefa.feitaEm ?? 0))
}
