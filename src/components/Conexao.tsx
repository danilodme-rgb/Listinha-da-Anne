import { useState } from 'react'
import type { Perfil } from '../lib/types'
import { atualizarDaNuvem, useSincronizacao, type ResultadoAtualizar } from '../lib/store'
import { resumoConexao, type TomConexao } from '../lib/conexao'

const CORES: Record<TomConexao, { fundo: string; tinta: string }> = {
  ok: { fundo: '#dcfce7', tinta: '#14532d' },
  esperando: { fundo: '#e0e7ff', tinta: '#3730a3' },
  atencao: { fundo: '#fef3c7', tinta: '#92400e' },
  erro: { fundo: '#fee2e2', tinta: '#991b1b' },
}

const RESPOSTA: Record<ResultadoAtualizar, string> = {
  novidade: 'Chegou novidade! 💜',
  'em-dia': 'Já estava tudo em dia ✅',
  conectando: 'Conectando agora…',
  'nao-configurada': 'Este celular ainda não está ligado no da mamãe.',
  erro: 'Não consegui agora. Confira a internet e tente de novo.',
}

/**
 * Cartao que diz, em portugues, como esta a conversa com o outro celular.
 *
 * Existe porque o modo de falhar mais comum era **silencioso**: sem
 * configuracao, o app nao conectava e nao dizia nada -- a listinha da mamae
 * simplesmente nunca chegava, e a tela da Anne ficava igualzinha a de um dia
 * sem tarefa. Aqui todo estado tem nome e um proximo passo.
 */
export function CartaoConexao({ perfil }: { perfil: Perfil }) {
  const sinc = useSincronizacao()
  const [rodando, setRodando] = useState(false)
  const [resposta, setResposta] = useState<string | null>(null)
  const resumo = resumoConexao({ ...sinc, agora: Date.now() }, perfil)
  const cor = CORES[resumo.tom]

  const procurar = () => {
    setRodando(true)
    setResposta(null)
    void atualizarDaNuvem()
      .then((r) => setResposta(RESPOSTA[r]))
      .catch(() => setResposta(RESPOSTA.erro))
      .finally(() => setRodando(false))
  }

  return (
    <div className="cartao">
      <h2>{resumo.titulo}</h2>
      <div className="alerta-leitura" style={{ background: cor.fundo, color: cor.tinta }}>
        {resumo.texto}
      </div>
      {resumo.acao === 'procurar' && (
        <button className="btn grande" style={{ marginTop: 10 }} disabled={rodando} onClick={procurar}>
          {rodando ? 'Procurando…' : '🔄 Procurar novidades'}
        </button>
      )}
      {resposta && <p className="ajuda" style={{ margin: '8px 0 0', fontWeight: 700 }}>{resposta}</p>}
    </div>
  )
}
