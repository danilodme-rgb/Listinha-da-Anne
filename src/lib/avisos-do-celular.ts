import type { Aviso, Perfil } from './types'

/**
 * Aviso do sistema (a notificacao que aparece na barra do celular).
 *
 * **Armadilha que fazia a Anne nunca receber nada:** o app usava
 * `new Notification(...)`. No Chrome do Android esse construtor e' **ilegal**
 * -- ele lanca `TypeError: Illegal constructor. Use
 * ServiceWorkerRegistration.showNotification() instead.` --, e o erro caia num
 * `catch` vazio. Resultado: permissao concedida, app aberto, e mesmo assim
 * nenhum aviso aparecia, sem nenhum sinal de que algo tinha falhado.
 * Por isso aqui o caminho principal e' o service worker, e o construtor e' so'
 * o plano B (navegador de computador sem service worker registrado).
 */

export type PermissaoAviso = 'sem-suporte' | 'padrao' | 'ligado' | 'negado'

export function permissaoDeAviso(): PermissaoAviso {
  if (typeof Notification === 'undefined') return 'sem-suporte'
  if (Notification.permission === 'granted') return 'ligado'
  if (Notification.permission === 'denied') return 'negado'
  return 'padrao'
}

/**
 * Quais avisos viram notificacao agora.
 *
 * A conta e' por **id conhecido**, nunca por horario: o `em` do aviso foi
 * carimbado pelo relogio do **outro** celular, e um relogio atrasado fazia o
 * aviso recem-chegado parecer velho e nao notificar. Aviso ja' lido tambem nao
 * volta a tocar, e o teto evita cinco notificacoes de uma vez quando a
 * sincronizacao traz um lote.
 */
export function avisosANotificar(
  avisos: Aviso[], conhecidos: ReadonlySet<string>, teto = 3,
): Aviso[] {
  const novos = avisos.filter((a) => !conhecidos.has(a.id) && !a.lido)
  // `avisos` vem do mais novo para o mais velho; notificar na ordem em que
  // aconteceram deixa o mais recente por ultimo, que e' o que fica visivel.
  return novos.slice(0, teto).reverse()
}

/** Texto do cartao de avisos, para cada perfil e cada permissao. */
export function textoDaPermissao(p: PermissaoAviso, perfil: Perfil): { titulo: string; ajuda: string; botao: string | null } {
  const anne = perfil === 'anne'
  if (p === 'sem-suporte') {
    return {
      titulo: anne ? 'Este celular não faz avisos' : 'Este aparelho não suporta avisos',
      ajuda: anne
        ? 'Sem problema: é só abrir o app para ver o que a mamãe mandou.'
        : 'Abra o app para ver as novidades — este navegador não mostra avisos do sistema.',
      botao: null,
    }
  }
  if (p === 'ligado') {
    return {
      titulo: anne ? 'Avisos ligados ✅' : 'Avisos ligados ✅',
      ajuda: anne
        ? 'Com o app aberto, o celular te avisa quando a mamãe mandar listinha nova ou conferir suas tarefas.'
        : 'Com o app aberto ou em segundo plano, o celular avisa quando a Anne concluir uma tarefa.',
      botao: null,
    }
  }
  if (p === 'negado') {
    return {
      titulo: anne ? 'Os avisos estão bloqueados' : 'Avisos bloqueados neste aparelho',
      ajuda: 'Peça para alguém liberar: toque no cadeado ao lado do endereço (ou em Ajustes do celular → Notificações) e permita as notificações deste app.',
      botao: null,
    }
  }
  return {
    titulo: anne ? 'Avisos no celular' : 'Avisos do celular',
    ajuda: anne
      ? 'Ligue para o celular te avisar quando a mamãe mandar listinha nova e quando ela conferir suas tarefas.'
      : 'Ligue para o celular avisar quando a Anne concluir uma tarefa.',
    botao: anne ? 'Quero receber avisos' : 'Permitir avisos',
  }
}

/**
 * Mostra a notificacao. Devolve o que aconteceu de verdade -- quem chama
 * precisa saber que **nao** apareceu nada, senao a falha some (era exatamente
 * o que acontecia antes).
 */
export async function mostrarNoCelular(
  aviso: { id: string; titulo: string; texto: string },
): Promise<'mostrado' | 'sem-permissao' | 'falhou'> {
  if (permissaoDeAviso() !== 'ligado') return 'sem-permissao'
  const opcoes: NotificationOptions = {
    body: aviso.texto,
    tag: aviso.id,
    icon: './icon-192.png',
    badge: './icon-192.png',
    lang: 'pt-BR',
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration?.()
    if (reg?.showNotification) {
      await reg.showNotification(aviso.titulo, opcoes)
      return 'mostrado'
    }
  } catch { /* cai para o construtor abaixo */ }
  try {
    // Plano B: navegador de computador que nao registrou service worker.
    new Notification(aviso.titulo, opcoes)
    return 'mostrado'
  } catch {
    return 'falhou'
  }
}
