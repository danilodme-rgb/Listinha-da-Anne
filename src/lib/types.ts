export type Perfil = 'kelly' | 'anne'

/** Status de um dia na escala do Alexandre. */
export type StatusDia = 'trabalho' | 'folga'

export interface DiaEscala {
  status: StatusDia
  /** Anotacao livre (ex.: "CGH-VCP-REC"). */
  nota?: string
}

/** Tarefa do catalogo reutilizavel montado pela Kelly. */
export interface Afazer {
  id: string
  emoji: string
  titulo: string
  valor: number
}

export interface TarefaDoDia {
  id: string
  emoji: string
  titulo: string
  valor: number
  feita: boolean
  feitaEm?: number
  conferida: boolean
  conferidaEm?: number
}

export interface ListaDoDia {
  data: string
  recado: string
  tarefas: TarefaDoDia[]
  /** Quando a Kelly enviou a lista para a Anne. */
  enviadaEm?: number
  /** Quando a Anne abriu a lista enviada. */
  vistaEm?: number
}

export interface Pagamento {
  id: string
  em: number
  valor: number
  descricao: string
}

export interface Aviso {
  id: string
  para: Perfil
  em: number
  titulo: string
  texto: string
  lido: boolean
}

export interface Estado {
  versao: number
  atualizadoEm: number
  /** chave 'AAAA-MM-DD' -> dia da escala */
  escala: Record<string, DiaEscala>
  /**
   * chave 'AAAA-MM-DD' -> true/false quando a Kelly marca manualmente.
   * Sem marcacao manual vale a regra automatica (folga do pai = Anne com o papai).
   */
  comPapai: Record<string, boolean>
  /** Se true, dias de folga do Alexandre viram automaticamente "Anne com o papai". */
  comPapaiAutomatico: boolean
  afazeres: Afazer[]
  listas: Record<string, ListaDoDia>
  pagamentos: Pagamento[]
  avisos: Aviso[]
  config: {
    pinKelly: string | null
    somConquista: boolean
  }
}

export interface ResultadoLeitura {
  /** dia do mes -> status reconhecido */
  dias: Record<string, StatusDia>
  /** dia do mes -> anotacao extraida da linha (ex.: "CGH-SDU") */
  notas: Record<string, string>
  /** Dias dentro do intervalo lido que ficaram sem status. */
  naoReconhecidos: number[]
  /** Trechos do texto que nao deram para interpretar. */
  trechosIgnorados: string[]
  /** Dias citados mais de uma vez com status diferentes. */
  conflitos: number[]
  mes: number
  ano: number
  /** true quando o mes/ano vieram do proprio texto. */
  mesDetectado: boolean
}
