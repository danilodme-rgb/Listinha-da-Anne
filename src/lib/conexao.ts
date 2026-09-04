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

/**
 * Erro do Firebase traduzido para o que a pessoa tem de fazer.
 *
 * O SDK devolve coisas como `auth/configuration-not-found` e `PERMISSION_DENIED`, que
 * nao dizem nada para quem so' quer a listinha funcionando -- e cada uma tem um conserto
 * diferente, em telas diferentes do console do Firebase. Mensagem que nao aponta o
 * conserto vira "deu erro" e para por ai.
 */
export function traduzirErroNuvem(bruto: string): string {
  const m = bruto.toLowerCase()
  if (m.includes('configuration-not-found') || m.includes('operation-not-allowed')) {
    return 'O login anônimo não está ativado no Firebase. Console → Authentication → Sign-in method → Anônimo → Ativar.'
  }
  if (m.includes('api-key-not-valid') || m.includes('invalid-api-key')) {
    return 'A apiKey não vale para esse projeto. Copie o bloco de configuração de novo em Configurações do projeto → Seus apps.'
  }
  if (m.includes('permission_denied') || m.includes('permission denied')) {
    return 'As regras do banco estão barrando a gravação. Console → Realtime Database → Regras: cole as regras do COMO-USAR e publique.'
  }
  if (m.includes('invalid firebase database path') || m.includes("can't contain")) {
    return 'O código da família tem caractere que o banco não aceita. Use só letras, números e hífen (ex.: anne-kelly-2026).'
  }
  if (m.includes('determine firebase database url') || m.includes('databaseurl') || m.includes('database url')) {
    return 'Falta o endereço do banco (databaseURL). Crie o Realtime Database no console e copie o bloco de configuração de novo.'
  }
  if (m.includes('network') || m.includes('unavailable') || m.includes('offline')) {
    return 'Sem conexão com o banco agora. Confira a internet deste aparelho e tente de novo.'
  }
  if (m.includes('project') && m.includes('not') && m.includes('found')) {
    return 'O projeto do Firebase não foi encontrado. Confira se o projeto ainda existe e copie a configuração de novo.'
  }
  return bruto
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
        : e.detalhe ? traduzirErroNuvem(e.detalhe) : 'Confira a internet e os dados em Ajustes.',
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
