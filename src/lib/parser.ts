import type { ResultadoLeitura, StatusDia } from './types'
import { MESES, diasNoMes } from './dates'

/** Remove acentos e coloca em minusculas, preservando o tamanho da string. */
function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const SINONIMOS: Array<{ re: RegExp; status: StatusDia }> = [
  {
    status: 'trabalho',
    re: /\b(?:trabalh\w*|voo|voos|voando|voa|viagem|viajando|viaja|viajar|servico|escalado|reserva|sobreaviso|stand\s?by|prontidao|plantao|deslocamento|pernoite|work|trip|t)\b/g,
  },
  {
    status: 'folga',
    re: /\b(?:folga\w*|folgando|off|livre|descanso|descansando|casa|ferias|feriado|f)\b/g,
  },
]

const ABREV_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

interface Marca { inicio: number; fim: number }
interface MarcaChave extends Marca { status: StatusDia }
interface MarcaDia extends Marca { dias: number[] }

/** Descobre mes/ano citados no cabecalho do texto (ex.: "Escala Setembro/2025"). */
function detectarMes(txt: string): { mes: number; ano: number } | null {
  for (let i = 0; i < 12; i++) {
    const re = new RegExp(`\\b(?:${normalizar(MESES[i])}|${ABREV_MESES[i]})\\b`)
    const m = re.exec(txt)
    if (m) {
      const ano = /\b(20\d{2})\b/.exec(txt)
      return { mes: i, ano: ano ? Number(ano[1]) : new Date().getFullYear() }
    }
  }
  const numerico = /\b(0?[1-9]|1[0-2])\s*[\/.]\s*(20\d{2})\b/.exec(txt)
  if (numerico) return { mes: Number(numerico[1]) - 1, ano: Number(numerico[2]) }
  return null
}

/** Apaga (trocando por espacos, para nao mexer nas posicoes) anos e horarios. */
function limparRuido(linha: string): string {
  return linha
    .replace(/\b(?:19|20)\d{2}\b/g, (m) => ' '.repeat(m.length))
    .replace(/\b\d{1,2}\s*[:h]\s*\d{2}\b/g, (m) => ' '.repeat(m.length))
}

function acharChaves(linha: string): MarcaChave[] {
  const marcas: MarcaChave[] = []
  for (const { re, status } of SINONIMOS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(linha))) marcas.push({ inicio: m.index, fim: m.index + m[0].length, status })
  }
  return marcas.sort((a, b) => a.inicio - b.inicio)
}

function acharDias(linha: string, mesAlvo: number): { marcas: MarcaDia[]; mesEstranho: boolean } {
  const marcas: MarcaDia[] = []
  let mesEstranho = false
  const usado = new Array(linha.length).fill(false)
  const registrar = (inicio: number, fim: number, dias: number[]) => {
    for (let i = inicio; i < fim; i++) usado[i] = true
    marcas.push({ inicio, fim, dias })
  }

  // 1) datas no formato dd/mm
  const reData = /\b(\d{1,2})\s*[\/.]\s*(\d{1,2})\b/g
  let m: RegExpExecArray | null
  while ((m = reData.exec(linha))) {
    const dia = Number(m[1])
    const mes = Number(m[2]) - 1
    if (dia < 1 || dia > 31 || mes < 0 || mes > 11) continue
    if (mes !== mesAlvo) { mesEstranho = true; continue }
    registrar(m.index, m.index + m[0].length, [dia])
  }

  // 2) intervalos "3 a 7", "3-7", "3 ate 7"
  const reIntervalo = /\b(\d{1,2})\s*(?:a|ao|ate|-|–|—)\s*(\d{1,2})\b/g
  while ((m = reIntervalo.exec(linha))) {
    if (usado[m.index]) continue
    const de = Number(m[1]); const ate = Number(m[2])
    if (de < 1 || ate > 31 || ate < de || ate - de > 40) continue
    const dias: number[] = []
    for (let d = de; d <= ate; d++) dias.push(d)
    registrar(m.index, m.index + m[0].length, dias)
  }

  // 3) numeros soltos
  const reNum = /\b(\d{1,2})\b/g
  while ((m = reNum.exec(linha))) {
    if (usado[m.index]) continue
    const d = Number(m[1])
    if (d < 1 || d > 31) continue
    registrar(m.index, m.index + m[0].length, [d])
  }

  return { marcas: marcas.sort((a, b) => a.inicio - b.inicio), mesEstranho }
}

const RE_LIGACAO = /^[\s\-–—:=.,;/|()[\]]*(?:(?:dia|dias|no|nos|de|do|em|e|os|as)[\s\-–—:=.,;]*)*$/

/** O trecho entre um dia e uma palavra-chave e' so' pontuacao/ligacao? */
function colados(linha: string, a: number, b: number): boolean {
  if (b - a > 24) return false
  return RE_LIGACAO.test(linha.slice(a, b))
}

/**
 * Le uma escala colada como texto livre.
 * Aceita "folga dia 1, trabalho dia 2", "01 - FOLGA" por linha,
 * "FOLGA: 1,2,3  VOO: 4,5", intervalos ("3 a 7") e datas ("05/09").
 */
export function lerEscala(texto: string, mesPadrao: number, anoPadrao: number): ResultadoLeitura {
  const bruto = normalizar(texto)
  const cabecalho = detectarMes(bruto)
  const mes = cabecalho ? cabecalho.mes : mesPadrao
  const ano = cabecalho ? cabecalho.ano : anoPadrao

  const dias: Record<string, StatusDia> = {}
  const notas: Record<string, string> = {}
  const primeiro: Record<number, StatusDia> = {}
  const conflitos = new Set<number>()
  const citados = new Set<number>()
  const semStatus = new Set<number>()
  const trechosIgnorados: string[] = []

  const atribuir = (dia: number, status: StatusDia) => {
    citados.add(dia)
    if (dia < 1 || dia > diasNoMes(ano, mes)) return
    const anterior = primeiro[dia]
    if (anterior && anterior !== status) { conflitos.add(dia); return }
    primeiro[dia] = status
  }

  const linhas = texto.split(/[\n\r;]+/)
  let chaveHerdada: StatusDia | null = null

  for (const original of linhas) {
    const linha = limparRuido(normalizar(original))
    if (!linha.trim()) continue

    const chaves = acharChaves(linha)
    const { marcas, mesEstranho } = acharDias(linha, mes)

    if (marcas.length === 0) {
      // linha so' com palavra-chave ("FOLGA:") vira cabecalho para as proximas
      if (chaves.length === 1) chaveHerdada = chaves[0].status
      else if (mesEstranho) trechosIgnorados.push(original.trim())
      continue
    }

    if (chaves.length === 0) {
      if (chaveHerdada) {
        for (const marca of marcas) for (const d of marca.dias) atribuir(d, chaveHerdada)
      } else {
        for (const marca of marcas) for (const d of marca.dias) { citados.add(d); semStatus.add(d) }
        trechosIgnorados.push(original.trim())
      }
      continue
    }

    // Descobre a orientacao da linha: a palavra vem antes ou depois dos dias?
    let antes = 0
    let depois = 0
    for (const c of chaves) {
      const seguinte = marcas.find((d) => d.inicio >= c.fim)
      if (seguinte && colados(linha, c.fim, seguinte.inicio)) antes++
      const anterior = [...marcas].reverse().find((d) => d.fim <= c.inicio)
      if (anterior && colados(linha, anterior.fim, c.inicio)) depois++
    }
    const chaveVemAntes = antes >= depois

    for (const marca of marcas) {
      let escolhida: MarcaChave | undefined
      if (chaveVemAntes) {
        escolhida = [...chaves].reverse().find((c) => c.fim <= marca.inicio) ?? chaves[0]
      } else {
        escolhida = chaves.find((c) => c.inicio >= marca.fim) ?? chaves[chaves.length - 1]
      }
      for (const d of marca.dias) atribuir(d, escolhida.status)
    }
    chaveHerdada = null

    // anotacao: sobra da linha quando ela descreve um unico dia
    const totalDias = marcas.reduce((s, m2) => s + m2.dias.length, 0)
    if (totalDias === 1) {
      const dia = marcas[0].dias[0]
      let sobra = original
      for (const pedaco of [...chaves, ...marcas].sort((a, b) => b.inicio - a.inicio)) {
        sobra = sobra.slice(0, pedaco.inicio) + ' '.repeat(pedaco.fim - pedaco.inicio) + sobra.slice(pedaco.fim)
      }
      sobra = sobra.replace(/[\-–—:=.,;/|()[\]]+/g, ' ').replace(/\s+/g, ' ').trim()
      if (sobra.length >= 3) notas[String(dia)] = sobra
    }

    if (mesEstranho) trechosIgnorados.push(original.trim())
  }

  for (const [dia, status] of Object.entries(primeiro)) {
    if (conflitos.has(Number(dia))) continue
    dias[dia] = status
  }

  // Dias mencionados que ficaram sem status + buracos dentro do intervalo lido
  const naoReconhecidos = new Set<number>([...semStatus, ...conflitos])
  const lidos = Object.keys(dias).map(Number)
  const universo = [...citados]
  if (universo.length > 0) {
    const min = Math.min(...universo)
    const max = Math.max(...universo)
    // Se o texto parece cobrir o mes inteiro, cobramos o mes inteiro.
    const cobreMes = min <= 3 && max >= diasNoMes(ano, mes) - 5
    const de = cobreMes ? 1 : min
    const ate = cobreMes ? diasNoMes(ano, mes) : max
    for (let d = de; d <= ate; d++) if (!lidos.includes(d)) naoReconhecidos.add(d)
  }
  for (const d of naoReconhecidos) delete dias[String(d)]

  return {
    dias,
    notas,
    naoReconhecidos: [...naoReconhecidos].sort((a, b) => a - b),
    trechosIgnorados: [...new Set(trechosIgnorados)].slice(0, 8),
    conflitos: [...conflitos].sort((a, b) => a - b),
    mes,
    ano,
    mesDetectado: cabecalho !== null,
  }
}
