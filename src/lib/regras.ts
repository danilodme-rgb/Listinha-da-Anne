import type { Estado, Perfil, TarefaDoDia } from './types'

// ---------------------------------------------------------------- papai na cidade

/**
 * Id fixo do aviso "o papai esta na cidade".
 * Fixo de proposito: os dois celulares podem gerar o aviso do mesmo dia, e o id
 * repetido faz o segundo virar no-op em vez de duplicar o recado.
 */
export function idAvisoPapai(data: string, para: Perfil): string {
  return `av_papai_${para}_${data}`
}

/**
 * Avisa as duas quando o Alexandre esta na cidade -- ou seja, quando a escala
 * marca folga nesse dia. Dia de trabalho (ou dia sem escala lida) nao avisa.
 */
export function deveAvisarPapai(e: Estado, data: string): boolean {
  if (e.escala[data]?.status !== 'folga') return false
  return !e.avisos.some((a) => a.id === idAvisoPapai(data, 'anne') || a.id === idAvisoPapai(data, 'kelly'))
}

// ---------------------------------------------------------------- tarefas com perguntinhas

/** Perguntinhas ainda nao respondidas (ex.: o banho da Anne). */
export function passosFaltando(t: TarefaDoDia): number {
  return (t.passos ?? []).filter((p) => !p.feito).length
}

/** So' vale como feita quando todas as perguntinhas estiverem marcadas. */
export function podeConcluir(t: TarefaDoDia): boolean {
  return !t.feita && passosFaltando(t) === 0
}
