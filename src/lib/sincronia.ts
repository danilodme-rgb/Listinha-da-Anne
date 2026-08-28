/**
 * Decide se o estado que chegou da nuvem substitui o que está neste aparelho.
 *
 * `sincronizadoEm` é a hora do último estado que este aparelho e a nuvem tinham em comum.
 * Enquanto ninguém mexer em nada aqui, o aparelho **segue a nuvem** sem comparar relógios —
 * um celular com a hora adiantada não pode fazer o aparelho ignorar o que a mamãe mudou.
 * Depois de uma mudança local que ainda não foi publicada, vale o mais novo.
 */
export function aceitaDaNuvem(remotoEm: number, localEm: number, sincronizadoEm: number): boolean {
  if (remotoEm === localEm) return false
  if (localEm <= sincronizadoEm) return true
  return remotoEm > localEm
}
