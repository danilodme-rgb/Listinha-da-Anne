import type { DiaEscala } from './types'
import { paraData } from './dates'

/**
 * Quanto tempo o Alexandre passou em casa.
 *
 * O denominador e' sempre "dias com escala lida", nunca o mes inteiro: dia sem
 * escala nao conta nem a favor nem contra, senao um mes lido pela metade
 * apareceria como se ele tivesse sumido.
 */
export interface Fatia {
  /** Dias com escala lida (folga + trabalho). */
  lidos: number
  /** Dias de folga. */
  emCasa: number
  /** Dias de trabalho. */
  fora: number
  /** 0 a 100, ja arredondado. */
  percentual: number
}

export interface FatiaDoMes extends Fatia {
  ano: number
  mes: number
}

function fatia(emCasa: number, fora: number): Fatia {
  const lidos = emCasa + fora
  return { lidos, emCasa, fora, percentual: lidos === 0 ? 0 : Math.round((emCasa / lidos) * 100) }
}

type Escala = Record<string, DiaEscala>

/** Um mes especifico. */
export function emCasaNoMes(escala: Escala, ano: number, mes: number): FatiaDoMes {
  let dentro = 0
  let fora = 0
  for (const [k, dia] of Object.entries(escala)) {
    const d = paraData(k)
    if (d.getFullYear() !== ano || d.getMonth() !== mes) continue
    if (dia.status === 'folga') dentro++
    else fora++
  }
  return { ano, mes, ...fatia(dentro, fora) }
}

/** Todos os meses com escala lida, do mais recente para o mais antigo. */
export function emCasaPorMes(escala: Escala): FatiaDoMes[] {
  const contas = new Map<string, { ano: number; mes: number; emCasa: number; fora: number }>()
  for (const [k, dia] of Object.entries(escala)) {
    const d = paraData(k)
    const chaveMes = `${d.getFullYear()}-${d.getMonth()}`
    const conta = contas.get(chaveMes) ?? { ano: d.getFullYear(), mes: d.getMonth(), emCasa: 0, fora: 0 }
    if (dia.status === 'folga') conta.emCasa++
    else conta.fora++
    contas.set(chaveMes, conta)
  }
  return [...contas.values()]
    .map((c) => ({ ano: c.ano, mes: c.mes, ...fatia(c.emCasa, c.fora) }))
    .sort((a, b) => (b.ano - a.ano) || (b.mes - a.mes))
}

/** Tudo que ja foi lido, somado. */
export function emCasaTotal(escala: Escala): Fatia {
  let dentro = 0
  let fora = 0
  for (const dia of Object.values(escala)) {
    if (dia.status === 'folga') dentro++
    else fora++
  }
  return fatia(dentro, fora)
}
