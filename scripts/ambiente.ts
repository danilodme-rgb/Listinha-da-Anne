/**
 * localStorage de mentira, para o teste poder usar o `store` de verdade.
 * Precisa ser importado ANTES do store: o modulo dele le o localStorage na
 * primeira linha que roda.
 */
const dados = new Map<string, string>()
;(globalThis as unknown as { localStorage: Storage }).localStorage = {
  get length() { return dados.size },
  key: (i: number) => [...dados.keys()][i] ?? null,
  getItem: (k: string) => dados.get(k) ?? null,
  setItem: (k: string, v: string) => { dados.set(k, String(v)) },
  removeItem: (k: string) => { dados.delete(k) },
  clear: () => dados.clear(),
}
