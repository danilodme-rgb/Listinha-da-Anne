import { lerEscala } from '../src/lib/parser'
import { aceitaDaNuvem } from '../src/lib/sincronia'
import { deveAvisarPapai, idAvisoPapai, passosFaltando, podeConcluir } from '../src/lib/regras'
import { emCasaNoMes, emCasaPorMes, emCasaTotal } from '../src/lib/relatorio'
import { deveRecarregar, podeProcurar } from '../src/lib/atualizacao'
import { escaparPdf, montarPdf, paraWinAnsi, quebrarTexto } from '../src/lib/pdf'
import { linhasDoRelatorio } from '../src/lib/relatorio'
import type { Estado, TarefaDoDia } from '../src/lib/types'

let falhas = 0
const eq = (nome: string, obtido: unknown, esperado: unknown) => {
  const a = JSON.stringify(obtido)
  const b = JSON.stringify(esperado)
  if (a !== b) { falhas++; console.log(`✗ ${nome}\n   obtido:   ${a}\n   esperado: ${b}`) }
  else console.log(`✓ ${nome}`)
}

const ler = (t: string) => lerEscala(t, 8, 2025) // setembro/2025 como padrao

eq('exemplo do enunciado',
  ler('folga dia 1, trabalho dia 2, folga dia 3').dias,
  { '1': 'folga', '2': 'trabalho', '3': 'folga' })

eq('dia antes da palavra',
  ler('dia 1 folga, dia 2 trabalho, dia 3 folga').dias,
  { '1': 'folga', '2': 'trabalho', '3': 'folga' })

eq('uma linha por dia',
  ler('01 - FOLGA\n02 - VOO\n03 - VOO').dias,
  { '1': 'folga', '2': 'trabalho', '3': 'trabalho' })

eq('agrupado por cabecalho',
  ler('FOLGA: 1, 2, 3\nTRABALHO: 4, 5').dias,
  { '1': 'folga', '2': 'folga', '3': 'folga', '4': 'trabalho', '5': 'trabalho' })

eq('cabecalho em linha separada',
  ler('FOLGAS\n1, 2, 3\nVOOS\n4, 5').dias,
  { '1': 'folga', '2': 'folga', '3': 'folga', '4': 'trabalho', '5': 'trabalho' })

eq('intervalos',
  ler('dias 5 a 9 trabalho\ndias 10 ao 12 folga').dias,
  { '5': 'trabalho', '6': 'trabalho', '7': 'trabalho', '8': 'trabalho', '9': 'trabalho',
    '10': 'folga', '11': 'folga', '12': 'folga' })

eq('datas dd/mm', ler('05/09 folga\n06/09 trabalho').dias, { '5': 'folga', '6': 'trabalho' })

const m = ler('Escala OUTUBRO/2025\n01 folga\n02 voo\n03 voo')
eq('mes detectado no cabecalho', [m.mes, m.ano, m.mesDetectado], [9, 2025, true])

const buraco = ler('01 folga\n02 trabalho\n03 xpto\n04 folga')
eq('dia ilegivel fica em branco', buraco.dias, { '1': 'folga', '2': 'trabalho', '4': 'folga' })
eq('dia ilegivel e reportado', buraco.naoReconhecidos, [3])

const conflito = ler('01 folga\n01 trabalho\n02 folga')
eq('conflito zera o dia', conflito.dias, { '2': 'folga' })
eq('conflito reportado', conflito.conflitos, [1])

eq('ignora horarios e numero de voo',
  ler('02 voo AD4051 saida 14:30').dias, { '2': 'trabalho' })

eq('anotacao do voo', ler('02 - VOO CGH-SDU').notas, { '2': 'CGH SDU' })

const mesInteiro = ler(
  'SETEMBRO\n' +
  Array.from({ length: 30 }, (_, i) => `${String(i + 1).padStart(2, '0')} ${i % 3 === 0 ? 'folga' : 'voo'}`).join('\n'),
)
eq('mes inteiro sem buracos', mesInteiro.naoReconhecidos, [])
eq('mes inteiro conta 30 dias', Object.keys(mesInteiro.dias).length, 30)

const parcial = ler('SETEMBRO\n01 folga\n02 voo\n29 folga\n30 folga')
eq('cobertura do mes acusa buracos', parcial.naoReconhecidos.length, 26)

eq('sinonimos de trabalho',
  ler('1 reserva\n2 sobreaviso\n3 pernoite\n4 viagem').dias,
  { '1': 'trabalho', '2': 'trabalho', '3': 'trabalho', '4': 'trabalho' })

eq('sinonimos de folga',
  ler('1 off\n2 livre\n3 em casa\n4 ferias').dias,
  { '1': 'folga', '2': 'folga', '3': 'folga', '4': 'folga' })

eq('letras soltas T e F', ler('1 F\n2 T\n3 T').dias, { '1': 'folga', '2': 'trabalho', '3': 'trabalho' })

eq('texto sem nada legivel', ler('bom dia amor, segue a escala').dias, {})

// --- tabela "Minha Escala" da companhia -------------------------------------

const ESCALA_DE_VOO = [
  'Activty\tCheckin\tStart\tEnd\tCheckout\tDep\tArr\tAcVer\tDD/CAT\tCrews',
  'FR\t\t31 AGO. 2026 00:00\t01 SET. 2026 00:00\t\tGRU\tGRU',
  'FR\t\t01 SET. 2026 00:00\t02 SET. 2026 00:00\t\tGRU\tGRU',
  'RHC05\t02 SET. 2026 05:00\t02 SET. 2026 05:00\t02 SET. 2026 11:00\t02 SET. 2026 11:00\tCGH\tCGH',
  'AD4269\t03 SET. 2026 11:30\t03 SET. 2026 12:20\t03 SET. 2026 15:25\t\tCGH\tREC\t32N\tCA\tSCHREDER CA LAZZAROTTO FO',
  'FR\t\t04 SET. 2026 05:35\t05 SET. 2026 05:35\t\tGRU\tGRU',
  'AD4232\t05 SET. 2026 04:10\t05 SET. 2026 05:00\t05 SET. 2026 08:00\t\tGRU\tREC\t32Q\tCA\tSCHREDER CA',
  'Layover\t\t05 SET. 2026 08:00\t06 SET. 2026 19:00\t\tREC\tREC',
  'AD4451\t\t06 SET. 2026 23:00\t07 SET. 2026 02:45\t07 SET. 2026 03:15\tREC\tMAO\t32Q\tCA\tSCHREDER CA',
  'ZZ99\t09 SET. 2026 08:00\t09 SET. 2026 08:00\t09 SET. 2026 12:00\t\tGRU\tGRU',
].join('\n')

const voo = lerEscala(ESCALA_DE_VOO, 0, 2020)

eq('escala de voo: mes vem do proprio texto', [voo.mes, voo.ano, voo.mesDetectado], [8, 2026, true])

eq('escala de voo: FR e folga, atividade e trabalho',
  voo.dias,
  { '1': 'folga', '2': 'trabalho', '3': 'trabalho', '4': 'folga',
    '5': 'trabalho', '6': 'trabalho', '7': 'trabalho', '9': 'trabalho' })

eq('escala de voo: dia sem atividade fica em branco', voo.naoReconhecidos, [8])

eq('escala de voo: codigo desconhecido vira trabalho e e reportado',
  voo.trechosIgnorados.length, 1)

eq('escala de voo: anotacao com a rota do dia', voo.notas['3'], 'CGH-REC')

eq('escala de voo: layover no meio do caminho entra na rota', voo.notas['6'], 'REC-MAO')

// A folga das 05:35 de um dia as 05:35 do outro nao pode transformar em folga
// um dia que ja tem voo (dia 5 sai as 05:00 e e' trabalho).
eq('escala de voo: trabalho ganha da folga que vaza para o dia seguinte',
  voo.dias['5'], 'trabalho')

// Atividade que termina exatamente a meia-noite nao ocupa o dia seguinte.
eq('escala de voo: fim a meia-noite nao pinta o dia seguinte',
  lerEscala([
    'FR\t\t01 SET. 2026 00:00\t02 SET. 2026 00:00\t\tGRU\tGRU',
    'AD1111\t03 SET. 2026 08:00\t03 SET. 2026 09:00\t03 SET. 2026 10:00\t\tGRU\tREC',
  ].join('\n'), 8, 2026).dias,
  { '1': 'folga', '3': 'trabalho' })


// ---------------------------------------------------------------- sincronizacao

// (remoto, local, sincronizado) -> aceita o que veio da nuvem?
eq('nuvem mais nova, aparelho parado', aceitaDaNuvem(200, 100, 100), true)
eq('nuvem mais velha, aparelho parado: ainda assim manda',
  aceitaDaNuvem(100, 200, 200), true)
eq('mudanca local pendente e nuvem mais velha: fica a local',
  aceitaDaNuvem(100, 300, 200), false)
eq('mudanca local pendente e nuvem mais nova: entra a da nuvem',
  aceitaDaNuvem(400, 300, 200), true)
eq('mesma hora dos dois lados: nao mexe', aceitaDaNuvem(300, 300, 100), false)
eq('aparelho novo (nunca publicou) adota a nuvem', aceitaDaNuvem(50, 999, 999), true)

// ---------------------------------------------------------------- papai na cidade

const estadoCom = (escala: Estado['escala'], avisos: Estado['avisos'] = []): Estado => ({
  versao: 2, atualizadoEm: 0, escala, comPapai: {}, comPapaiAutomatico: true,
  afazeres: [], listas: {}, pagamentos: [], avisos,
  config: { pinKelly: null, somConquista: true },
})

const aviso = (id: string): Estado['avisos'][number] => ({
  id, para: 'anne', em: 0, titulo: '', texto: '', lido: false,
})

eq('folga na escala avisa as duas',
  deveAvisarPapai(estadoCom({ '2025-09-10': { status: 'folga' } }), '2025-09-10'), true)
eq('dia de voo nao avisa',
  deveAvisarPapai(estadoCom({ '2025-09-10': { status: 'trabalho' } }), '2025-09-10'), false)
eq('dia sem escala lida nao avisa', deveAvisarPapai(estadoCom({}), '2025-09-10'), false)
eq('aviso do dia ja existe: nao repete',
  deveAvisarPapai(
    estadoCom({ '2025-09-10': { status: 'folga' } }, [aviso(idAvisoPapai('2025-09-10', 'anne'))]),
    '2025-09-10',
  ), false)
eq('aviso de outro dia nao bloqueia',
  deveAvisarPapai(
    estadoCom({ '2025-09-11': { status: 'folga' } }, [aviso(idAvisoPapai('2025-09-10', 'anne'))]),
    '2025-09-11',
  ), true)

// ---------------------------------------------------------------- perguntinhas do banho

const banho = (respostas: boolean[]): TarefaDoDia => ({
  id: 't1', emoji: '🛁', titulo: 'Banho', valor: 1.5, feita: false, conferida: false,
  passos: ['Recolheu a toalha?', 'Organizou suas coisas?', 'Apagou as luzes?']
    .map((titulo, i) => ({ titulo, feito: respostas[i] })),
})

eq('banho sem responder nada', passosFaltando(banho([false, false, false])), 3)
eq('banho pela metade nao pode concluir', podeConcluir(banho([true, true, false])), false)
eq('banho respondido pode concluir', podeConcluir(banho([true, true, true])), true)
eq('tarefa sem perguntinhas pode concluir',
  podeConcluir({ id: 't2', emoji: '🛏️', titulo: 'Cama', valor: 1, feita: false, conferida: false }), true)
eq('tarefa ja feita nao conclui de novo',
  podeConcluir({ id: 't2', emoji: '🛏️', titulo: 'Cama', valor: 1, feita: true, conferida: false }), false)

// --- relatorio "papai em casa" ---------------------------------------------

const escalaRelatorio = {
  // setembro/2026: 3 folgas, 1 voo -> 75%
  '2026-09-01': { status: 'folga' as const },
  '2026-09-02': { status: 'folga' as const },
  '2026-09-03': { status: 'trabalho' as const },
  '2026-09-04': { status: 'folga' as const },
  // outubro/2026: 1 folga, 3 voos -> 25%
  '2026-10-01': { status: 'trabalho' as const },
  '2026-10-02': { status: 'trabalho' as const },
  '2026-10-03': { status: 'trabalho' as const },
  '2026-10-04': { status: 'folga' as const },
}

eq('relatorio: percentual do mes',
  emCasaNoMes(escalaRelatorio, 2026, 8),
  { ano: 2026, mes: 8, lidos: 4, emCasa: 3, fora: 1, percentual: 75 })

eq('relatorio: mes sem escala lida nao vira divisao por zero',
  emCasaNoMes(escalaRelatorio, 2026, 0),
  { ano: 2026, mes: 0, lidos: 0, emCasa: 0, fora: 0, percentual: 0 })

eq('relatorio: mes a mes, do mais recente para o mais antigo',
  emCasaPorMes(escalaRelatorio).map((f) => [f.mes, f.percentual]),
  [[9, 25], [8, 75]])

eq('relatorio: total somado',
  emCasaTotal(escalaRelatorio),
  { lidos: 8, emCasa: 4, fora: 4, percentual: 50 })

eq('relatorio: escala vazia', emCasaTotal({}), { lidos: 0, emCasa: 0, fora: 0, percentual: 0 })

eq('atualizacao: versao nova recarrega a tela',
  deveRecarregar({ ehTroca: true, jaRecarregando: false }), true)

eq('atualizacao: primeira instalacao nao recarrega',
  deveRecarregar({ ehTroca: false, jaRecarregando: false }), false)

eq('atualizacao: nao recarrega duas vezes',
  deveRecarregar({ ehTroca: true, jaRecarregando: true }), false)

eq('atualizacao: procura de novo depois de um minuto',
  [podeProcurar(60_000, 0), podeProcurar(59_999, 0)], [true, false])


// ---------------------------------------------------------------- relatorio em PDF

eq('pdf: emoji e travessao viram texto que a Helvetica tem',
  paraWinAnsi('🏠 Folga — “dia do papai”'),
  'Folga - "dia do papai"')

eq('pdf: acento continua valendo', paraWinAnsi('observação às 13h'), 'observação às 13h')

eq('pdf: parenteses e barra escapados',
  escaparPdf('folga (13h) \\ trabalho'),
  'folga \\(13h\\) \\\\ trabalho')

// 100pt de largura com corpo 11 dao ~18 caracteres por linha
eq('pdf: quebra por largura',
  quebrarTexto('um dois tres quatro cinco seis', 11, 100),
  ['um dois tres', 'quatro cinco seis'])

eq('pdf: palavra maior que a linha e cortada',
  quebrarTexto('a'.repeat(24), 11, 100),
  ['a'.repeat(18), 'a'.repeat(6)])

const bytesPdf = montarPdf('Teste', [{ texto: 'Olá (mundo)', tamanho: 12 }])
const textoPdf = Array.from(bytesPdf, (b) => String.fromCharCode(b)).join('')
eq('pdf: comeca com o cabecalho do formato', textoPdf.slice(0, 8), '%PDF-1.4')
eq('pdf: termina fechando o arquivo', textoPdf.trim().endsWith('%%EOF'), true)
{
  const inicio = Number(textoPdf.match(/startxref\n(\d+)/)![1])
  eq('pdf: startxref aponta mesmo para a tabela xref', textoPdf.slice(inicio, inicio + 4), 'xref')
}
{
  // O leitor segue /Kids para achar as paginas. Apontar para o objeto errado
  // (foi o que aconteceu: as paginas comecam no 6, nao no 5) abre um PDF vazio.
  const kids = textoPdf.match(/\/Kids \[([^\]]+)\]/)![1].trim().split(/\s+0 R\s*/).filter(Boolean)
  const tipoDoObjeto = (id: string) => {
    const corpo = textoPdf.slice(textoPdf.indexOf(`\n${id} 0 obj\n`))
    return corpo.slice(0, corpo.indexOf('endobj')).includes('/Type /Page') ? 'pagina' : 'outra coisa'
  }
  eq('pdf: cada /Kids aponta mesmo para uma pagina', kids.map(tipoDoObjeto), ['pagina'])
}

const estadoRelatorio = {
  escala: {
    '2026-09-01': { status: 'folga' as const },
    '2026-09-02': { status: 'trabalho' as const },
    '2026-09-03': { status: 'folga' as const },
  },
  observacoes: { '2026-09-01': 'chega 13h, sai 20h' },
  comPapai: { '2026-09-03': false },
  comPapaiAutomatico: true,
}

{
  const texto = linhasDoRelatorio(estadoRelatorio, 2026, 8, '01/09').map((l) => l.texto)
  eq('relatorio: folga do dia 1 e dia do papai, com a observacao junto',
    texto.some((t) => t.startsWith('01/09') && t.includes('dia do papai') && t.includes('chega 13h, sai 20h')),
    true)
  eq('relatorio: folga que a Kelly desmarcou vira dia da mamae',
    texto.some((t) => t.startsWith('03/09') && t.includes('dia da mamãe')),
    true)
  eq('relatorio: dia de trabalho tambem e dia da mamae',
    texto.some((t) => t.startsWith('02/09') && t.includes('dia da mamãe')),
    true)
  eq('relatorio: resumo do mes conta os dias lidos',
    texto.some((t) => t === '2 dias de folga · 1 dia de trabalho'),
    true)
}

console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
