import { useState } from 'react'
import type { Perfil } from '../lib/types'
import {
  mostrarNoCelular, permissaoDeAviso, textoDaPermissao, type PermissaoAviso,
} from '../lib/avisos-do-celular'

/**
 * Cartao dos avisos do sistema: mostra o estado atual (ligado, bloqueado, ainda
 * nao pedido) e deixa **testar de verdade**.
 *
 * O teste nao e' luxo: o jeito antigo de mostrar aviso (`new Notification`) e'
 * proibido no Chrome do Android e falhava dentro de um `catch` vazio -- app
 * aberto, permissao concedida, nenhum aviso nunca. Sem um botao que prova o
 * caminho inteiro no proprio aparelho, ninguem descobre isso.
 */
export function CartaoAvisosDoCelular({ perfil }: { perfil: Perfil }) {
  const [permissao, setPermissao] = useState<PermissaoAviso>(() => permissaoDeAviso())
  const [resposta, setResposta] = useState<string | null>(null)
  const t = textoDaPermissao(permissao, perfil)
  const anne = perfil === 'anne'

  const pedir = () => {
    if (typeof Notification === 'undefined') { setPermissao('sem-suporte'); return }
    void Notification.requestPermission().then((p) => {
      setPermissao(permissaoDeAviso())
      setResposta(p === 'granted'
        ? (anne ? 'Prontinho! Agora eu te aviso. 🔔' : 'Avisos ligados! 🔔')
        : (anne ? 'Os avisos não foram permitidos.' : 'Permissão não concedida.'))
    })
  }

  const testar = () => {
    setResposta(anne ? 'Mandando…' : 'Enviando…')
    void mostrarNoCelular({
      id: 'teste-aviso',
      titulo: anne ? 'Teste de aviso 🔔' : 'Teste de aviso 🔔',
      texto: anne ? 'Se você está lendo isso, os avisos funcionam!' : 'Funcionou: os avisos aparecem neste aparelho.',
    }).then((r) => {
      setResposta(
        r === 'mostrado'
          ? (anne ? 'Mandei! Olhe a barra de avisos do celular. 👀' : 'Enviado. Confira a barra de notificações.')
          : r === 'sem-permissao'
            ? 'Os avisos ainda não estão permitidos neste aparelho.'
            : 'Este navegador não conseguiu mostrar o aviso.',
      )
    })
  }

  return (
    <div className="cartao">
      <h2>🔔 {t.titulo}</h2>
      <p className="ajuda">{t.ajuda}</p>
      {permissao !== 'ligado' && (
        <p className="ajuda" style={{ marginTop: 0 }}>
          {anne
            ? 'Os avisos só chegam com o app aberto no celular.'
            : 'Os avisos só chegam com o app aberto ou em segundo plano — o app fechado não recebe nada.'}
        </p>
      )}
      <div className="linha" style={{ gap: 8 }}>
        {t.botao && (
          <button className="btn grande" style={{ flex: 1 }} onClick={pedir}>{t.botao}</button>
        )}
        {permissao === 'ligado' && (
          <button className="btn grande" style={{ flex: 1 }} onClick={testar}>Testar aviso agora</button>
        )}
      </div>
      {resposta && <p className="ajuda" style={{ margin: '8px 0 0', fontWeight: 700 }}>{resposta}</p>}
    </div>
  )
}
