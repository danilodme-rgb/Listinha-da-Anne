import type { DiaEscala, Estado } from './types'
import { MESES, chaveDe, diasNoMes, paraData } from './dates'
import type { LinhaPdf } from './pdf'

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

// ---------------------------------------------------------------- relatorio em PDF

/**
 * Monta o texto do relatorio de frequencia (folga x trabalho) para virar PDF.
 * Funcao pura de proposito: da' para testar o conteudo sem abrir navegador.
 */
export function linhasDoRelatorio(
  estado: Pick<Estado, 'escala' | 'observacoes' | 'comPapai' | 'comPapaiAutomatico'>,
  ano: number,
  mes: number,
  geradoEm: string,
): LinhaPdf[] {
  const doMes = emCasaNoMes(estado.escala, ano, mes)
  const total = emCasaTotal(estado.escala)
  const porMes = emCasaPorMes(estado.escala)
  const linhas: LinhaPdf[] = [
    { texto: 'Escala do Alexandre', tamanho: 19, negrito: true },
    { texto: `Frequência de folga e trabalho · gerado em ${geradoEm}`, tamanho: 10, cinza: true },
    { texto: `${MESES[mes]} de ${ano}`, tamanho: 15, negrito: true, espacoAntes: 20 },
  ]

  if (doMes.lidos === 0) {
    linhas.push({ texto: 'Nenhum dia deste mês foi lido ainda.', espacoAntes: 6 })
  } else {
    linhas.push({ texto: `${plural(doMes.emCasa, 'dia', 'dias')} de folga · ${plural(doMes.fora, 'dia', 'dias')} de trabalho`, espacoAntes: 6 })
    linhas.push({ texto: `De cada 100 dias com escala lida, ${doMes.percentual} foram de folga.`, cinza: true })
    linhas.push({ texto: 'Dia a dia', tamanho: 13, negrito: true, espacoAntes: 16 })
    for (let d = 1; d <= diasNoMes(ano, mes); d++) {
      const k = chaveDe(ano, mes, d)
      const status = estado.escala[k]?.status
      if (!status) continue
      const partes = [
        `${String(d).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}`,
        status === 'folga' ? 'folga' : 'trabalho',
        comPapaiNoDia(estado, k) ? 'dia do papai' : 'dia da mamãe',
      ]
      const obs = estado.observacoes[k]
      if (obs) partes.push(obs)
      linhas.push({ texto: partes.join(' — '), tamanho: 10.5 })
    }
  }

  if (porMes.length > 1) {
    linhas.push({ texto: 'Mês a mês', tamanho: 15, negrito: true, espacoAntes: 22 })
    for (const f of porMes) {
      linhas.push({
        texto: `${MESES[f.mes]}/${f.ano} — ${f.emCasa} de folga, ${f.fora} de trabalho (${f.percentual}% de folga)`,
        tamanho: 10.5,
      })
    }
  }

  linhas.push({ texto: 'No total', tamanho: 15, negrito: true, espacoAntes: 22 })
  linhas.push({
    texto: total.lidos === 0
      ? 'Nenhuma escala lida ainda.'
      : `${plural(total.emCasa, 'dia', 'dias')} de folga e ${total.fora} de trabalho, em ${plural(total.lidos, 'dia lido', 'dias lidos')} (${total.percentual}% de folga).`,
    espacoAntes: 6,
  })
  linhas.push({ texto: 'Feito no app Listinha da Anne.', tamanho: 9.5, cinza: true, espacoAntes: 18 })
  return linhas
}

/** "1 dia" e "2 dias" -- o relatorio vai para gente ler, nao pode sair torto. */
function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`
}

/** Mesma regra do app: escolha da Kelly vence; senao, folga = dia do papai. */
function comPapaiNoDia(
  e: Pick<Estado, 'escala' | 'comPapai' | 'comPapaiAutomatico'>,
  data: string,
): boolean {
  const manual = e.comPapai[data]
  if (manual !== undefined) return manual
  return e.comPapaiAutomatico && e.escala[data]?.status === 'folga'
}
