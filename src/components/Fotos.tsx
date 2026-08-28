import { useRef, useState } from 'react'
import { MAX_FOTOS, adicionarFotos, apagarFoto, useFotos } from '../lib/fotos'

/** Escolher e apagar as fotos guardadas neste aparelho. */
export function GaleriaFotos({ compacta = false }: { compacta?: boolean }) {
  const fotos = useFotos()
  const [recado, setRecado] = useState('')
  const entrada = useRef<HTMLInputElement>(null)

  const escolher = async (lista: FileList | null) => {
    if (!lista?.length) return
    setRecado('Guardando…')
    const { salvas, erro } = await adicionarFotos(lista)
    setRecado(erro ?? (salvas > 0 ? `${salvas} ${salvas === 1 ? 'foto guardada' : 'fotos guardadas'}! 💜` : ''))
    if (entrada.current) entrada.current.value = ''
  }

  return (
    <>
      {!compacta && (
        <p className="ajuda">
          As fotos ficam <b>só neste celular</b> — não vão para a internet nem para o outro
          aparelho. Elas aparecem no topo do app da Anne, e ela troca tocando na imagem.
        </p>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => void escolher(e.target.files)}
      />

      <button
        className="btn primario grande"
        onClick={() => entrada.current?.click()}
        disabled={fotos.length >= MAX_FOTOS}
      >
        📸 Escolher fotos do celular
      </button>

      {recado && <div className="alerta-leitura bom" style={{ marginTop: 10 }}>{recado}</div>}

      {fotos.length > 0 && (
        <>
          <div className="tiras" style={{ marginTop: 12 }}>
            {fotos.map((f) => (
              <div className="tira" key={f.id}>
                <img src={f.imagem} alt="" />
                <button onClick={() => void apagarFoto(f.id)} aria-label="Apagar foto">✕</button>
              </div>
            ))}
          </div>
          <p className="ajuda" style={{ margin: '8px 0 0' }}>
            {fotos.length} de {MAX_FOTOS} fotos.
          </p>
        </>
      )}
    </>
  )
}

/** Faixa de destaque no topo do app da Anne. Tocar troca a foto. */
export function BannerFotos() {
  const fotos = useFotos()
  const [atual, setAtual] = useState(0)
  if (fotos.length === 0) return null

  const indice = atual % fotos.length
  return (
    <button
      className="banner-fotos"
      onClick={() => setAtual((a) => a + 1)}
      aria-label={`Foto ${indice + 1} de ${fotos.length}. Tocar para ver a próxima.`}
    >
      <img src={fotos[indice].imagem} alt="" />
      {fotos.length > 1 && (
        <span className="pontinhos">
          {fotos.map((f, i) => <i key={f.id} className={i === indice ? 'ativo' : ''} />)}
        </span>
      )}
    </button>
  )
}
