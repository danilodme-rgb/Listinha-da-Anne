import { lerEscala } from '../src/lib/parser'
import { aceitaDaNuvem } from '../src/lib/sincronia'
import { deveAvisarPapai, idAvisoPapai, passosFaltando, podeConcluir } from '../src/lib/regras'
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

console.log(falhas === 0 ? '\nTodos os testes passaram.' : `\n${falhas} teste(s) falharam.`)
process.exit(falhas === 0 ? 0 : 1)
