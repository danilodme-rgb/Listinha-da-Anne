import type { Perfil } from './types'
import type { StatusNuvem } from './nuvem'
import { horaCurta } from './dates'

/**
 * Resumo legivel do estado da sincronizacao.
 *
 * Existe porque a falha era **calada**: sem configuracao, `conectarNuvem`
 * voltava sem fazer nada e a tela nao dizia coisa nenhuma. No app da Anne, que
 * nao tem Ajustes, isso virava "a mamae mandou a listinha e nao chegou nada",
 * sem nenhuma pista de onde estava o problema. Agora todo estado tem nome e
 * cada nome tem o que fazer em seguida.
 */

export type TomConexao = 'ok' | 'esperando' | 'atencao' | 'erro'
export type AcaoConexao = 'nenhuma' | 'procurar' | 'pedir-link' | 'abrir-ajustes'

export interface ResumoConexao {
  tom: TomConexao
  titulo: string
  texto: string
  acao: AcaoConexao
}

export interface EstadoConexao {
  /** Ha' configuracao de nuvem guardada neste aparelho? */
  configurada: boolean
  status: StatusNuvem
  detalhe: string
  /** Ultima vez que a nuvem respondeu (relogio deste aparelho). */
  respondeuEm: number | null
  /** Desde quando ha' mudanca local esperando para subir. */
  pendenteDesde: number | null
  agora: number
}

/** Mudanca local demora milissegundos para subir: so' vira aviso se emperrar. */
const PENDENCIA_LENTA = 60_000

export function resumoConexao(e: EstadoConexao, perfil: Perfil): ResumoConexao {
  const anne = perfil === 'anne'
  if (!e.configurada) {
    return {
      tom: 'atencao',
      titulo: anne ? '🔌 Ainda não estou ligada no celular da mamãe' : '🔌 Sincronização desligada',
      texto: anne
        ? 'Por isso a listinha dela não chega aqui. Peça para a mamãe abrir o app dela em Ajustes e te mandar o link de sincronização.'
        : 'Este aparelho guarda tudo só aqui. Ligue a sincronização em Ajustes para conversar com o celular da Anne.',
      acao: anne ? 'pedir-link' : 'abrir-ajustes',
    }
  }
  if (e.status === 'erro') {
    return {
      tom: 'erro',
      titulo: anne ? '⚠️ Não estou conseguindo falar com o celular da mamãe' : '⚠️ Erro na sincronização',
      texto: anne
        ? 'Confira a internet e toque em "Procurar novidades". Se continuar assim, avise a mamãe.'
        : `Confira a internet e os dados em Ajustes.${e.detalhe ? ` Detalhe: ${e.detalhe}` : ''}`,
      acao: 'procurar',
    }
  }
  if (e.status !== 'ligado' || e.respondeuEm === null) {
    return {
      tom: 'esperando',
      titulo: anne ? '⏳ Procurando o celular da mamãe…' : '⏳ Conectando…',
      texto: anne
        ? 'Só um pouquinho. Se demorar, confira se o celular está na internet.'
        : 'Aguardando a resposta do banco. Se demorar, confira a internet.',
      acao: 'procurar',
    }
  }
  const emperrou = e.pendenteDesde !== null && e.agora - e.pendenteDesde > PENDENCIA_LENTA
  if (emperrou) {
    return {
      tom: 'atencao',
      titulo: anne ? '📤 Tem coisa daqui esperando para chegar na mamãe' : '📤 Mudança daqui ainda não subiu',
      texto: anne
        ? 'O que você marcou está guardado neste celular. Assim que a internet voltar, ele manda sozinho.'
        : 'Está tudo salvo aqui. Assim que a conexão voltar, o app publica sozinho.',
      acao: 'procurar',
    }
  }
  return {
    tom: 'ok',
    titulo: anne ? '💜 Ligada no celular da mamãe' : '☁️ Sincronização em dia',
    texto: anne
      ? `Tudo que ela mandar aparece aqui. Última conversa às ${horaCurta(e.respondeuEm)}.`
      : `Última troca às ${horaCurta(e.respondeuEm)}.`,
    acao: 'procurar',
  }
}
