export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Data local -> 'AAAA-MM-DD' (sem passar por UTC, que muda o dia). */
export function chave(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function paraData(k: string): Date {
  const [a, m, d] = k.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function hoje(): string {
  return chave(new Date())
}

export function chaveDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${pad(mes + 1)}-${pad(dia)}`
}

export function somaDias(k: string, n: number): string {
  const d = paraData(k)
  d.setDate(d.getDate() + n)
  return chave(d)
}

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate()
}

/** Semanas do mes, cada uma com 7 posicoes (null = fora do mes). */
export function gradeDoMes(ano: number, mes: number): (string | null)[][] {
  const total = diasNoMes(ano, mes)
  const inicio = new Date(ano, mes, 1).getDay()
  const celulas: (string | null)[] = Array(inicio).fill(null)
  for (let d = 1; d <= total; d++) celulas.push(chaveDe(ano, mes, d))
  while (celulas.length % 7 !== 0) celulas.push(null)
  const semanas: (string | null)[][] = []
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7))
  return semanas
}

export function porExtenso(k: string): string {
  const d = paraData(k)
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`
}

export function curta(k: string): string {
  const d = paraData(k)
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

export function ehHoje(k: string): boolean {
  return k === hoje()
}

export function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function horaCurta(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Quando o aviso chegou. Aviso de hoje mostra so' a hora; de outro dia leva a
 * data junto, senao um recado de dias atras se disfarca de recado de agora.
 */
export function quandoCurto(ts: number): string {
  const dia = chave(new Date(ts))
  if (dia === hoje()) return horaCurta(ts)
  if (dia === somaDias(hoje(), -1)) return `ontem ${horaCurta(ts)}`
  return `${curta(dia)} ${horaCurta(ts)}`
}
