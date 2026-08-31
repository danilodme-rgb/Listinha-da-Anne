import type { ResultadoLeitura, StatusDia } from './types'
import { MESES, chave, chaveDe, diasNoMes } from './dates'

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

// ---------------------------------------------------------------------------
// Escala de voo (tabela "Minha Escala" do sistema da companhia)
//
// Cada linha e' uma atividade com ate' quatro horarios (Checkin, Start, End,
// Checkout) no formato "03 SET. 2026 11:30". O codigo da atividade diz o que
// ela e': FR e' folga, o resto (voo AD####, RHC##, REX, Layover) e' trabalho.
// ---------------------------------------------------------------------------

const RE_DATA_HORA = /\b(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[a-z]*\.?\s+(\d{4})\s+(\d{1,2}):(\d{2})\b/g

/** Codigo de atividade: "AD4269", "RHC05", "FR", "REX", "Layover". */
const RE_ATIVIDADE = /\b(?:[a-z]{2,4}\d{2,5}|fr|rex|layover|folga|ferias|feriado)\b/g

/** Codigos que eu sei ler; o resto vira trabalho, mas e' relatado para a Kelly. */
const RE_CODIGO_CONHECIDO = /^(?:ad\d+|rhc\d+|fr|rex|layover|folga|ferias|feriado)$/

const CODIGOS_DE_FOLGA = /^(?:fr|folga|ferias|feriado)$/

interface Atividade {
  codigo: string
  status: StatusDia
  inicio: Date
  fim: Date
  /** Aeroportos da linha (Dep e Arr), quando aparecem. */
  aeroportos: string[]
}

/** Dias cobertos por [inicio, fim). Terminar 00:00 nao ocupa o dia seguinte. */
function diasCobertos(inicio: Date, fim: Date): Date[] {
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  const ultimo = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate())
  if (fim.getHours() === 0 && fim.getMinutes() === 0 && ultimo > cursor) ultimo.setDate(ultimo.getDate() - 1)
  const dias: Date[] = []
  while (cursor <= ultimo && dias.length < 45) {
    dias.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dias
}

/** Le a tabela de escala de voo. Devolve null quando o texto nao e' desse formato. */
function lerEscalaDeVoo(texto: string): ResultadoLeitura | null {
  const norm = normalizar(texto)

  const datas: Array<{ inicio: number; fim: number; quando: Date }> = []
  RE_DATA_HORA.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = RE_DATA_HORA.exec(norm))) {
    const mes = ABREV_MESES.indexOf(m[2])
    if (mes < 0) continue
    datas.push({
      inicio: m.index,
      fim: m.index + m[0].length,
      quando: new Date(Number(m[3]), mes, Number(m[1]), Number(m[4]), Number(m[5])),
    })
  }
  if (datas.length < 3) return null

  const marcos: Array<{ pos: number; codigo: string }> = []
  RE_ATIVIDADE.lastIndex = 0
  while ((m = RE_ATIVIDADE.exec(norm))) marcos.push({ pos: m.index, codigo: m[0] })
  if (marcos.length < 2) return null

  const atividades: Atividade[] = []
  const desconhecidos = new Set<string>()

  for (let i = 0; i < marcos.length; i++) {
    const de = marcos[i].pos
    const ate = i + 1 < marcos.length ? marcos[i + 1].pos : norm.length
    const dentro = datas.filter((d) => d.inicio >= de && d.inicio < ate)
    if (dentro.length === 0) continue

    const codigo = marcos[i].codigo
    if (!RE_CODIGO_CONHECIDO.test(codigo)) desconhecidos.add(codigo.toUpperCase())

    const instantes = dentro.map((d) => d.quando.getTime())
    const ultimaData = dentro[dentro.length - 1]
    // Dep e Arr vem logo depois dos horarios, como siglas de tres letras.
    const sobra = texto.slice(ultimaData.fim, ate)
    const aeroportos = (sobra.match(/\b[A-Z]{3}\b/g) ?? []).slice(0, 2)

    atividades.push({
      codigo,
      status: CODIGOS_DE_FOLGA.test(codigo) ? 'folga' : 'trabalho',
      inicio: new Date(Math.min(...instantes)),
      fim: new Date(Math.max(...instantes)),
      aeroportos,
    })
  }
  if (atividades.length === 0) return null

  // Um dia com qualquer atividade de trabalho e' dia de trabalho: a folga que
  // "vaza" para a manha seguinte (FR das 05:00 as 05:00) nao vale como folga.
  interface Dia { trabalho: boolean; folga: boolean; aeroportos: string[] }
  const porDia = new Map<string, Dia>()
  const contagemMes = new Map<string, number>()

  for (const a of atividades) {
    for (const d of diasCobertos(a.inicio, a.fim)) {
      const k = chave(d)
      const dia = porDia.get(k) ?? { trabalho: false, folga: false, aeroportos: [] }
      if (a.status === 'trabalho') {
        dia.trabalho = true
        for (const sigla of a.aeroportos) {
          if (dia.aeroportos[dia.aeroportos.length - 1] !== sigla) dia.aeroportos.push(sigla)
        }
      } else dia.folga = true
      porDia.set(k, dia)
      const mesAno = `${d.getFullYear()}-${d.getMonth()}`
      contagemMes.set(mesAno, (contagemMes.get(mesAno) ?? 0) + 1)
    }
  }

  // A tabela costuma pegar a ponta do mes anterior e a do seguinte; fica o mes
  // com mais dias cobertos.
  let alvo = ''
  let melhor = -1
  for (const [mesAno, quantos] of contagemMes) {
    if (quantos > melhor) { melhor = quantos; alvo = mesAno }
  }
  const [ano, mes] = alvo.split('-').map(Number)

  const dias: Record<string, StatusDia> = {}
  const notas: Record<string, string> = {}
  const citados: number[] = []
  for (let d = 1; d <= diasNoMes(ano, mes); d++) {
    const dia = porDia.get(chaveDe(ano, mes, d))
    if (!dia) continue
    citados.push(d)
    dias[String(d)] = dia.trabalho ? 'trabalho' : 'folga'
    if (dia.trabalho && dia.aeroportos.length > 0) notas[String(d)] = dia.aeroportos.slice(0, 5).join('-')
  }

  const naoReconhecidos: number[] = []
  if (citados.length > 0) {
    const min = Math.min(...citados)
    const max = Math.max(...citados)
    const cobreMes = min <= 3 && max >= diasNoMes(ano, mes) - 5
    const de = cobreMes ? 1 : min
    const ate = cobreMes ? diasNoMes(ano, mes) : max
    for (let d = de; d <= ate; d++) if (!citados.includes(d)) naoReconhecidos.push(d)
  }

  return {
    dias,
    notas,
    naoReconhecidos,
    trechosIgnorados: [...desconhecidos].slice(0, 8).map((c) => `${c} (não conheço esse código; marquei como trabalho)`),
    conflitos: [],
    mes,
    ano,
    mesDetectado: true,
  }
}

const RE_LIGACAO = /^[\s\-–—:=.,;/|()[\]]*(?:(?:dia|dias|no|nos|de|do|em|e|os|as)[\s\-–—:=.,;]*)*$/

/** O trecho entre um dia e uma palavra-chave e' so' pontuacao/ligacao? */
function colados(linha: string, a: number, b: number): boolean {
  if (b - a > 24) return false
  return RE_LIGACAO.test(linha.slice(a, b))
}

/**
 * Le uma escala colada.
 * Primeiro tenta a tabela "Minha Escala" da companhia (FR = folga, voo =
 * trabalho); se nao for esse formato, cai no texto livre: "folga dia 1,
 * trabalho dia 2", "01 - FOLGA" por linha, "FOLGA: 1,2,3  VOO: 4,5",
 * intervalos ("3 a 7") e datas ("05/09").
 */
export function lerEscala(texto: string, mesPadrao: number, anoPadrao: number): ResultadoLeitura {
  const daCompanhia = lerEscalaDeVoo(texto)
  if (daCompanhia) return daCompanhia

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
