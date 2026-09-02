import { useSyncExternalStore } from 'react'
import type { Afazer, Aviso, Estado, ListaDoDia, Perfil, StatusDia, TarefaDoDia } from './types'
import { brl, chave, curta, hoje, somaDias, paraData } from './dates'
import { decidirNuvem } from './sincronia'
import { deveAvisarPapai, idAvisoPapai, passosFaltando } from './regras'
import {
  iniciarNuvem, lerConfigNuvem, lerDaNuvemAgora, nuvemAtiva, publicarNaNuvem,
  type StatusNuvem,
} from './nuvem'

const CHAVE_LS = 'listinha-da-anne/estado'
const CHAVE_SINC = 'listinha-da-anne/sincronizado-em'
const VERSAO = 3

/**
 * O banho deixa tudo espalhado, entao ele vem com perguntinhas: a Anne so' marca
 * como feito depois de responder as tres.
 */
export const AFAZER_BANHO: Afazer = {
  id: 'a11',
  emoji: '🛁',
  titulo: 'Banho',
  valor: 1.5,
  passos: ['Recolheu a toalha?', 'Organizou suas coisas?', 'Apagou as luzes?'],
}

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
  AFAZER_BANHO,
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
    observacoes: {},
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
  const afazeres = e.afazeres?.length ? [...e.afazeres] : base.afazeres
  // quem ja usava o app (versao 1) tinha um banho sem perguntinhas no catalogo:
  // esse vira o banho novo, em vez de virar um segundo item parecido.
  if ((e.versao ?? 1) < 2 && !afazeres.some((a) => a.passos?.length)) {
    const antigo = afazeres.findIndex((a) => /banho/i.test(a.titulo))
    if (antigo >= 0) afazeres[antigo] = { ...afazeres[antigo], ...AFAZER_BANHO, id: afazeres[antigo].id }
    else afazeres.push(AFAZER_BANHO)
  }
  return {
    ...base,
    ...e,
    escala: e.escala ?? {},
    observacoes: e.observacoes ?? {},
    comPapai: e.comPapai ?? {},
    // aparelho com versao antiga nao manda o campo: sem isso, folga deixava
    // de virar dia do papai sozinha
    comPapaiAutomatico: e.comPapaiAutomatico ?? true,
    afazeres,
    // O Firebase nao guarda array nem objeto vazio: uma lista sem tarefas volta
    // de la' SEM a chave `tarefas`, e qualquer `for` nela quebrava a tela -- e
    // o estado quebrado ainda ia parar no localStorage.
    listas: Object.fromEntries(
      Object.entries(e.listas ?? {}).map(([data, lista]) => [
        data, { ...lista, tarefas: lista?.tarefas ?? [] },
      ]),
    ),
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

const eraAparelhoNovo = localStorage.getItem(CHAVE_LS) === null
let estado: Estado = carregar()

/**
 * Ate' que horas o estado daqui e o da nuvem eram o mesmo.
 * Enquanto este aparelho nao mexer em nada, ele segue a nuvem sem discutir horario --
 * relogio de celular adiantado nao pode fazer o aparelho ignorar o que a Kelly mudou.
 */
let sincronizadoEm = (() => {
  const salvo = Number(localStorage.getItem(CHAVE_SINC) ?? 0)
  if (salvo > 0) return salvo
  return eraAparelhoNovo ? estado.atualizadoEm : 0
})()

function marcarSincronizado(quando: number) {
  sincronizadoEm = quando
  try { localStorage.setItem(CHAVE_SINC, String(quando)) } catch { /* cheio: segue em memoria */ }
}

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
  // A tela e' avisada antes de publicar: a mudanca local ja' vale, e falha de
  // nuvem nao pode impedir a tela de mostrar o que a Kelly acabou de fazer.
  avisarTodos()
  try {
    publicarNaNuvem(estado)
  } catch { /* a nuvem avisa o erro pelo status; o dado local ja' esta salvo */ }
}

/**
 * Estado vindo da nuvem. Entra quando este aparelho nao tem mudanca propria
 * pendente (o caso comum) ou quando o de la' e' mais novo.
 */
function receberDaNuvem(remoto: Estado) {
  const decisao = decidirNuvem(remoto.atualizadoEm, estado.atualizadoEm, sincronizadoEm)
  if (decisao === 'igual') { marcarSincronizado(remoto.atualizadoEm); return }
  if (decisao === 'publicar') {
    // Este aparelho tem coisa mais nova que a nuvem: em vez de so' ignorar o que
    // chegou, publica o que ele tem. E' o que faz uma escala colada enquanto a
    // publicacao estava quebrada finalmente subir, sem a Kelly ter que colar de novo.
    publicarNaNuvem(estado)
    return
  }
  estado = migrar(remoto)
  marcarSincronizado(estado.atualizadoEm)
  persistir()
  avisarTodos()
}

/** Rele' a nuvem agora. E' o que o puxar-para-atualizar chama. */
export async function atualizarDaNuvem(): Promise<void> {
  if (!lerConfigNuvem()) return
  if (!nuvemAtiva()) { conectarNuvem(); return }
  const remoto = await lerDaNuvemAgora()
  if (remoto) receberDaNuvem(remoto)
}

export function conectarNuvem(): void {
  const config = lerConfigNuvem()
  if (!config) return
  void iniciarNuvem(config, {
    aoReceber: receberDaNuvem,
    // Primeira conexao com o banco ainda vazio: sem isso, o que ja' existe neste
    // aparelho ficaria esperando uma proxima edicao para subir.
    aoNuvemVazia: () => publicarNaNuvem(estado),
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
    else {
      const anotacao = nota ?? e.escala[data]?.nota
      // sem `nota: undefined`: alem de sujeira, o Firebase recusa o estado inteiro
      e.escala[data] = anotacao ? { status, nota: anotacao } : { status }
    }
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
      e.escala[k] = notas[dia] ? { status, nota: notas[dia] } : { status }
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

/**
 * Escolha explicita da Kelly: 'papai', 'mamae' ou null para voltar ao
 * automatico (folga do Alexandre = dia do papai).
 *
 * O botao antigo alternava e ao mesmo tempo descrevia o estado -- um toque
 * curioso virava "a Anne nao esta com o papai" num dia de folga, sem caminho
 * de volta. Agora sao duas opcoes lado a lado, e da' para voltar ao automatico.
 */
export function definirDonoDoDia(data: string, dono: 'papai' | 'mamae' | null): void {
  alterar((e) => {
    if (dono === null) { delete e.comPapai[data]; return }
    const automatico = e.comPapaiAutomatico && e.escala[data]?.status === 'folga'
    const querPapai = dono === 'papai'
    if (querPapai === automatico) delete e.comPapai[data]
    else e.comPapai[data] = querPapai
  })
}

/** A escolha veio da Kelly (true) ou do automatico da escala (false)? */
export function donoEscolhidoAMao(e: Estado, data: string): boolean {
  return e.comPapai[data] !== undefined
}

// ---------------------------------------------------------------- observacoes do dia

/** Observacao da Kelly no dia. Fica fora de `escala` de proposito: colar a
 *  escala de novo reescreve `escala`, e o recado dela nao pode sumir junto. */
export function observacaoDe(e: Estado, data: string): string {
  return e.observacoes[data] ?? ''
}

export function definirObservacao(data: string, texto: string): void {
  alterar((e) => {
    const limpo = texto.trim()
    if (limpo) e.observacoes[data] = limpo
    else delete e.observacoes[data]
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
      passos: passosNovos(afazer.passos),
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
    delete lista.vistaEm
    e.avisos.unshift({
      id: novoId('av'), para: 'anne', em: Date.now(),
      titulo: 'A mamãe montou uma listinha para você! 💌',
      texto: lista.recado ? `Tem recado: “${lista.recado}”` : 'Corra ver o que tem para hoje!',
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
            passos: passosNovos(t.passos?.map((p) => p.titulo)),
          })),
          ...(enviar ? { enviadaEm: Date.now() } : {}),
        }
        copiados += 1
      }
      d = somaDias(d, 1)
    }
  })
  return copiados
}

// ---------------------------------------------------------------- execucao e carteira

/** Copia as perguntinhas de um afazer para um dia novo, todas por responder. */
function passosNovos(titulos: string[] | undefined) {
  return titulos?.length ? titulos.map((titulo) => ({ titulo, feito: false })) : undefined
}

/** Marca/desmarca uma perguntinha (ex.: "Recolheu a toalha?"). */
export function alternarPassoTarefa(data: string, id: string, indice: number): void {
  alterar((e) => {
    const passo = e.listas[data]?.tarefas.find((x) => x.id === id)?.passos?.[indice]
    if (passo) passo.feito = !passo.feito
  })
}

export function concluirTarefa(data: string, id: string): void {
  alterar((e) => {
    const t = e.listas[data]?.tarefas.find((x) => x.id === id)
    if (!t || t.feita) return
    if (passosFaltando(t) > 0) return
    t.feita = true
    t.feitaEm = Date.now()
    e.avisos.unshift({
      id: novoId('av'), para: 'kelly', em: Date.now(),
      titulo: `Anne fez: ${t.emoji} ${t.titulo}`,
      texto: `A pagar: ${brl(t.valor)} • aguardando sua conferência`,
      lido: false,
    })
  })
}

export function desfazerTarefa(data: string, id: string): void {
  alterar((e) => {
    const t = e.listas[data]?.tarefas.find((x) => x.id === id)
    if (!t || t.conferida) return
    t.feita = false
    delete t.feitaEm
    for (const p of t.passos ?? []) p.feito = false
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
      titulo: 'A mamãe conferiu! 🎉',
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
        titulo: 'A mamãe conferiu tudo! 🎉',
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
      texto: `${brl(valor)} — ${descricao}`,
      lido: false,
    })
  })
}

/**
 * A propria Anne confirma que o dinheiro chegou na mao dela: o cofrinho zera
 * e a Kelly recebe o aviso do valor.
 */
export function confirmarRecebimento(): number {
  const valor = carteira(estado).saldo
  if (valor <= 0) return 0
  alterar((e) => {
    e.pagamentos.unshift({
      id: novoId('pg'), em: Date.now(), valor, porAnne: true,
      descricao: `Anne recebeu em ${curta(chave(new Date()))}`,
    })
    e.avisos.unshift({
      id: novoId('av'), para: 'kelly', em: Date.now(),
      titulo: 'A Anne confirmou que recebeu! 💰',
      texto: `${brl(valor)} — o cofrinho dela voltou a zero.`,
      lido: false,
    })
  })
  return valor
}

// ---------------------------------------------------------------- papai na cidade

/**
 * Avisa as duas quando a escala marca folga hoje (Alexandre na cidade).
 * O id do aviso e' fixo por dia, entao rodar de novo -- ou o outro celular
 * rodar tambem -- nao duplica nada.
 */
export function avisarPapaiNaCidade(): void {
  const data = hoje()
  if (!deveAvisarPapai(estado, data)) return
  alterar((e) => {
    e.avisos.unshift({
      id: idAvisoPapai(data, 'anne'), para: 'anne', em: Date.now(),
      titulo: 'O papai está na cidade hoje! 👨‍✈️',
      texto: 'É dia de folga dele. Aproveite bastante! 💜',
      lido: false,
    })
    e.avisos.unshift({
      id: idAvisoPapai(data, 'kelly'), para: 'kelly', em: Date.now(),
      titulo: 'Alexandre está na cidade hoje 👨‍✈️',
      texto: 'A escala marca folga — a Anne pode ficar com o papai.',
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
