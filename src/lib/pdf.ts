/**
 * Gerador de PDF minimo, escrito a mao.
 *
 * O app e' offline-first e sem back-end: nao da' para depender de servico nem
 * de biblioteca pesada so' para um relatorio de uma pagina. Aqui sai um PDF
 * de texto (Helvetica), que e' o suficiente para mandar no WhatsApp.
 */

/** Uma linha do documento. */
export interface LinhaPdf {
  texto: string
  /** Corpo = 11. Titulo costuma ser 18. */
  tamanho?: number
  negrito?: boolean
  /** Espaco extra acima da linha, em pontos. */
  espacoAntes?: number
  /** Cinza claro para legendas; padrao e' quase preto. */
  cinza?: boolean
}

const LARGURA = 595 // A4 em pontos
const ALTURA = 842
const MARGEM = 56
const ENTRELINHA = 1.45

/**
 * Caracteres fora do WinAnsi (emoji, principalmente) nao existem na Helvetica:
 * sairiam como lixo. Os que tem equivalente viram texto; o resto cai fora.
 */
const TROCAS: Record<string, string> = {
  '—': '-', '–': '-', '“': '"', '”': '"', '‘': "'", '’': "'", '…': '...',
  '•': '-', '·': '-', '→': '->', '✈': '', '🏠': '', '👨': '', '🐱': '', '📝': '',
  ' ': ' ',
}

/** Texto pronto para a Helvetica: sem emoji e sem caractere fora do WinAnsi. */
export function paraWinAnsi(texto: string): string {
  let saida = ''
  for (const c of texto) {
    const troca = TROCAS[c]
    if (troca !== undefined) { saida += troca; continue }
    const cod = c.codePointAt(0) ?? 0
    if (cod === 10 || cod === 13) { saida += ' '; continue }
    if (cod >= 32 && cod <= 255) saida += c
    // fora disso (emoji, setas, etc.) o caractere e' descartado
  }
  return saida.replace(/ {2,}/g, ' ').trim()
}

/** Escapa o que quebraria a string literal do PDF. */
export function escaparPdf(texto: string): string {
  return texto.replace(/([\\()])/g, '\\$1')
}

/**
 * Quebra o texto na largura util da pagina. A Helvetica tem largura variavel;
 * 0,5 do corpo por caractere e' uma media segura -- erra para o lado de
 * quebrar cedo, que e' o erro inofensivo.
 */
export function quebrarTexto(texto: string, tamanho: number, larguraUtil = LARGURA - 2 * MARGEM): string[] {
  const maximo = Math.max(8, Math.floor(larguraUtil / (tamanho * 0.5)))
  const palavras = texto.split(/\s+/).filter(Boolean)
  if (palavras.length === 0) return ['']
  const linhas: string[] = []
  let atual = ''
  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (tentativa.length <= maximo) { atual = tentativa; continue }
    if (atual) linhas.push(atual)
    // palavra maior que a linha inteira: corta no braco
    let resto = palavra
    while (resto.length > maximo) { linhas.push(resto.slice(0, maximo)); resto = resto.slice(maximo) }
    atual = resto
  }
  if (atual) linhas.push(atual)
  return linhas
}

interface LinhaPosta { texto: string; tamanho: number; negrito: boolean; cinza: boolean; y: number }

/** Distribui as linhas em paginas, respeitando a margem de baixo. */
function paginar(linhas: LinhaPdf[]): LinhaPosta[][] {
  const paginas: LinhaPosta[][] = []
  let pagina: LinhaPosta[] = []
  let y = ALTURA - MARGEM
  for (const linha of linhas) {
    const tamanho = linha.tamanho ?? 11
    const partes = quebrarTexto(paraWinAnsi(linha.texto), tamanho)
    y -= linha.espacoAntes ?? 0
    for (const parte of partes) {
      y -= tamanho * ENTRELINHA
      if (y < MARGEM) { paginas.push(pagina); pagina = []; y = ALTURA - MARGEM - tamanho * ENTRELINHA }
      pagina.push({ texto: parte, tamanho, negrito: !!linha.negrito, cinza: !!linha.cinza, y })
    }
  }
  paginas.push(pagina)
  return paginas
}

function fluxoDaPagina(linhas: LinhaPosta[]): string {
  const partes: string[] = []
  for (const l of linhas) {
    const cor = l.cinza ? '0.42 0.39 0.51' : '0.17 0.14 0.25'
    partes.push(`${cor} rg`)
    partes.push(`BT /${l.negrito ? 'F2' : 'F1'} ${l.tamanho} Tf ${MARGEM} ${l.y.toFixed(2)} Td (${escaparPdf(l.texto)}) Tj ET`)
  }
  return partes.join('\n')
}

/** Monta o arquivo PDF inteiro. Devolve os bytes. */
export function montarPdf(titulo: string, linhas: LinhaPdf[]): Uint8Array {
  const paginas = paginar(linhas)
  const objetos: string[] = []
  // 1 catalogo, 2 lista de paginas, 3 e 4 fontes, 5 info -- as paginas comecam no 6.
  // Errar essa conta faz o arquivo abrir vazio: o leitor procura a pagina e acha o Info.
  const idPagina = (i: number) => 6 + i * 2
  const kids = paginas.map((_, i) => `${idPagina(i)} 0 R`).join(' ')

  objetos.push('<< /Type /Catalog /Pages 2 0 R >>')
  objetos.push(`<< /Type /Pages /Kids [${kids}] /Count ${paginas.length} >>`)
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
  objetos.push(`<< /Type /Info /Title (${escaparPdf(paraWinAnsi(titulo))}) /Producer (Listinha da Anne) >>`)

  paginas.forEach((linhasDaPagina, i) => {
    const fluxo = fluxoDaPagina(linhasDaPagina)
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${LARGURA} ${ALTURA}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${idPagina(i) + 1} 0 R >>`,
    )
    objetos.push(`<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`)
  })

  let arquivo = '%PDF-1.4\n'
  const posicoes: number[] = []
  objetos.forEach((corpo, i) => {
    posicoes.push(arquivo.length)
    arquivo += `${i + 1} 0 obj\n${corpo}\nendobj\n`
  })
  const inicioXref = arquivo.length
  arquivo += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  for (const p of posicoes) arquivo += `${String(p).padStart(10, '0')} 00000 n \n`
  arquivo += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`

  const bytes = new Uint8Array(arquivo.length)
  for (let i = 0; i < arquivo.length; i++) bytes[i] = arquivo.charCodeAt(i) & 0xff
  return bytes
}

/**
 * Manda o PDF para onde o celular souber mandar (WhatsApp aparece na lista de
 * compartilhar). Sem suporte a compartilhar arquivo, baixa o arquivo.
 */
export async function compartilharPdf(nome: string, bytes: Uint8Array): Promise<'compartilhado' | 'baixado'> {
  const arquivo = new File([bytes as BlobPart], nome, { type: 'application/pdf' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare?.({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: nome })
      return 'compartilhado'
    } catch (e) {
      // usuario fechou a folha de compartilhar: nao vira erro nem download
      if ((e as DOMException)?.name === 'AbortError') return 'compartilhado'
    }
  }
  const url = URL.createObjectURL(arquivo)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'baixado'
}
