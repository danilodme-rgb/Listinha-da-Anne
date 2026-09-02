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

const PREFIXO_PAPAI = 'av_papai_'

/** Data ('AAAA-MM-DD') do aviso do papai; null quando o aviso e' de outro tipo. */
export function dataDoAvisoPapai(id: string): string | null {
  if (!id.startsWith(PREFIXO_PAPAI)) return null
  const data = id.slice(PREFIXO_PAPAI.length).replace(/^(anne|kelly)_/, '')
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : null
}

/**
 * Avisos "o papai esta na cidade" que nao valem mais: os de dias que ja'
 * passaram e os do dia de hoje quando a escala passou a marcar trabalho (a
 * Kelly colou outra escala ou corrigiu o dia na mao). Sem isso o recado de um
 * dia de folga antigo continua no fim da tela dizendo "hoje" enquanto o
 * Alexandre esta' voando.
 *
 * Dia de hoje SEM escala lida nao entra: pode ser so' um aparelho que ainda nao
 * baixou a escala da nuvem, e apagar por causa disso publicaria a copia velha
 * dele por cima da boa.
 */
export function avisosPapaiVencidos(e: Estado, hoje: string): string[] {
  const vencidos: string[] = []
  for (const a of e.avisos) {
    const data = dataDoAvisoPapai(a.id)
    if (data === null) continue
    if (data !== hoje || e.escala[data]?.status === 'trabalho') vencidos.push(a.id)
  }
  return vencidos
}
