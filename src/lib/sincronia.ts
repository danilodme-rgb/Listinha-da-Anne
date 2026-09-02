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

/**
 * O que fazer com o estado que chegou da nuvem.
 *
 * `publicar` e' o caso que faltava: quando este aparelho tem coisa mais nova,
 * ignorar o que chegou nao basta -- se a publicacao anterior falhou, ninguem
 * nunca mais tentaria de novo e a mudanca ficaria presa aqui para sempre.
 */
export function decidirNuvem(
  remotoEm: number,
  localEm: number,
  sincronizadoEm: number,
): 'igual' | 'aceitar' | 'publicar' {
  if (remotoEm === localEm) return 'igual'
  return aceitaDaNuvem(remotoEm, localEm, sincronizadoEm) ? 'aceitar' : 'publicar'
}

/**
 * Copia sem nenhuma propriedade `undefined`.
 *
 * O Firebase Realtime Database **recusa** gravar um valor que contenha
 * `undefined` em qualquer lugar -- e recusa lancando na hora, derrubando o
 * resto da operacao. Era o que impedia a escala de subir: dia lido sem
 * anotacao virava `{ status, nota: undefined }`, e a gravacao inteira morria.
 */
export function semUndefined<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.filter((v) => v !== undefined).map((v) => semUndefined(v)) as unknown as T
  }
  if (valor && typeof valor === 'object') {
    const saida: Record<string, unknown> = {}
    for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
      if (v === undefined) continue
      saida[chave] = semUndefined(v)
    }
    return saida as T
  }
  return valor
}
