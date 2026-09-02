import { useState } from 'react'
import type { Estado, TarefaDoDia } from '../lib/types'
import { brl, curta, ehHoje, horaCurta, porExtenso } from '../lib/dates'
import {
  alternarPassoTarefa, avisosDe, carteira, comPapai, concluirTarefa, confirmarRecebimento,
  desfazerTarefa, listaDe, marcarAvisosLidos, marcarListaVista,
} from '../lib/store'
import { passosFaltando } from '../lib/regras'
import { Festa } from '../components/Festa'
import { BannerFotos, GaleriaFotos } from '../components/Fotos'
import { Modal } from '../components/Modal'

interface Props {
  estado: Estado
  /** Sempre o dia de hoje: a tela da Anne nao navega no calendario. */
  dia: string
}

const ELOGIOS = [
  'Isso, Anne! 🌟', 'Arrasou! 💜', 'Que capricho! ✨', 'Você é demais! 🎉',
  'Mandou bem! 🚀', 'Orgulho da mamãe! 🥰', 'Uhuul! 🏆',
]

export function AnneView({ estado, dia }: Props) {
  const [festa, setFesta] = useState<{ titulo: string; detalhe: string } | null>(null)
  const [trocandoFotos, setTrocandoFotos] = useState(false)
  const [perguntando, setPerguntando] = useState<string | null>(null)

  const lista = listaDe(estado, dia)
  const c = carteira(estado)
  const avisos = avisosDe(estado, 'anne')
  const foraDeCasa = comPapai(estado, dia)

  const total = lista.tarefas.reduce((s, t) => s + t.valor, 0)
  const ganho = lista.tarefas.filter((t) => t.feita).reduce((s, t) => s + t.valor, 0)
  const faltam = lista.tarefas.filter((t) => !t.feita).length
  const temNovidade = Boolean(lista.enviadaEm && !lista.vistaEm)

  const abrirListinha = () => {
    marcarListaVista(dia)
    marcarAvisosLidos('anne')
  }

  const concluir = (t: TarefaDoDia) => {
    concluirTarefa(dia, t.id)
    setFesta({
      titulo: ELOGIOS[Math.floor(Math.random() * ELOGIOS.length)],
      detalhe: `${brl(t.valor)} entrou no seu cofrinho!`,
    })
  }

  /** Tarefa com perguntinhas (o banho) abre a listinha de conferencia antes. */
  const tocarNaTarefa = (t: TarefaDoDia) => {
    if (t.feita) { if (!t.conferida) desfazerTarefa(dia, t.id); return }
    if (t.passos?.length) { setPerguntando(t.id); return }
    concluir(t)
  }

  const receber = () => {
    if (!confirm(`A mamãe já te deu ${brl(c.saldo)}?`)) return
    const valor = confirmarRecebimento()
    if (valor > 0) setFesta({ titulo: 'Dinheiro recebido! 💰', detalhe: `${brl(valor)} são seus. A mamãe já sabe!` })
  }

  const tarefaPerguntando = lista.tarefas.find((t) => t.id === perguntando) ?? null

  return (
    <>
      {festa && <Festa titulo={festa.titulo} detalhe={festa.detalhe} aoFechar={() => setFesta(null)} />}

      <BannerFotos />

      {temNovidade && (
        <div className="convite">
          <div className="env">💌</div>
          <h2>A mamãe montou uma listinha para você!</h2>
          <p>Toque no botão para ver o que tem hoje.</p>
          <button onClick={abrirListinha}>Abrir a listinha ✨</button>
        </div>
      )}

      {!temNovidade && (
        <>
          <div className="cartao">
            <div className="linha">
              <h2 style={{ flex: 1 }}>
                {ehHoje(dia) ? 'Hoje' : porExtenso(dia)} {ehHoje(dia) && <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--tinta-fraca)' }}>· {curta(dia)}</span>}
              </h2>
              {lista.tarefas.length > 0 && faltam === 0 && <span className="carimbo ok">Tudo feito! 🏆</span>}
            </div>

            {lista.recado && (
              <div className="recado" style={{ marginTop: 10 }}>
                <div className="de">Recado da mamãe 💜</div>
                {lista.recado}
              </div>
            )}

            {foraDeCasa && lista.tarefas.length === 0 && (
              <div className="cartao" style={{ background: 'var(--papai-bg)', boxShadow: 'none', marginTop: 12 }}>
                <div style={{ fontSize: 40, textAlign: 'center' }}>👨‍✈️</div>
                <div style={{ textAlign: 'center', fontWeight: 900, marginTop: 6 }}>Hoje é dia de papai!</div>
                <div style={{ textAlign: 'center', fontSize: 13.5, color: '#92400e', marginTop: 4 }}>
                  Aproveita bastante. Sem tarefas hoje. 🥰
                </div>
              </div>
            )}

            {lista.tarefas.length === 0 && !foraDeCasa && (
              <div className="vazio-msg">
                <div style={{ fontSize: 40 }}>🌤️</div>
                Ainda não há listinha para este dia.<br />Depois volte aqui para ver!
              </div>
            )}

            {lista.tarefas.length > 0 && (
              <>
                <h3 style={{ marginTop: 14 }}>
                  {faltam > 0 ? `Faltam ${faltam} ${faltam === 1 ? 'tarefinha' : 'tarefinhas'}` : 'Você fez tudo!'}
                </h3>
                <div className="pilha">
                  {lista.tarefas.map((t) => (
                    <button
                      key={t.id}
                      className={`tarefa anne-tarefa${t.feita ? ' feita' : ''}`}
                      onClick={() => tocarNaTarefa(t)}
                      aria-pressed={t.feita}
                    >
                      <span className="emoji">{t.emoji}</span>
                      <div className="txt">
                        <div className="titulo">{t.titulo}</div>
                        {t.feita && (
                          <div className="obs">
                            {t.conferida ? '✓ A mamãe conferiu!' : 'Feito! Esperando a mamãe conferir.'}
                          </div>
                        )}
                        {!t.feita && !!t.passos?.length && (
                          <div className="obs">
                            {t.passos.length - passosFaltando(t)} de {t.passos.length} perguntinhas
                          </div>
                        )}
                      </div>
                      <span className="valor">{brl(t.valor)}</span>
                      <span style={{ fontSize: 26 }}>{t.feita ? '✅' : '⬜'}</span>
                    </button>
                  ))}
                </div>

                <div className="total" style={{ marginTop: 14 }}>
                  <div>
                    <div className="rot">{faltam > 0 ? 'Se você fizer tudo hoje' : 'Você conquistou hoje'}</div>
                    <div className="num">{brl(faltam > 0 ? total : ganho)}</div>
                    {faltam > 0 && ganho > 0 && (
                      <div className="rot" style={{ marginTop: 4 }}>Já conquistou {brl(ganho)} ⭐</div>
                    )}
                  </div>
                  <span style={{ fontSize: 36 }}>{faltam > 0 ? '💰' : '🏆'}</span>
                </div>
              </>
            )}
          </div>

          <div className="cartao">
            <h2>🐷 Meu cofrinho</h2>
            <div className="cofre">
              <div>
                <div className="rot">Posso receber</div>
                <div className="num" style={{ color: 'var(--ok)' }}>{brl(c.saldo)}</div>
              </div>
              <div>
                <div className="rot">Esperando a mamãe</div>
                <div className="num" style={{ color: 'var(--papai)' }}>{brl(c.aguardando)}</div>
              </div>
            </div>
            <button className="btn ok grande" style={{ marginTop: 12 }} disabled={c.saldo <= 0} onClick={receber}>
              💰 Já recebi meu dinheiro!
            </button>
            <p className="ajuda" style={{ margin: '8px 0 0' }}>
              {c.saldo > 0
                ? 'Aperte só depois que a mamãe te entregar o dinheiro. O cofrinho volta para zero e ela recebe o aviso.'
                : 'Seu cofrinho está zerado. Faça as tarefinhas para encher de novo! ⭐'}
            </p>
            {c.pago > 0 && (
              <p className="ajuda" style={{ margin: '10px 0 0' }}>
                Você já recebeu {brl(c.pago)} até hoje. Que economia! 🌟
              </p>
            )}
          </div>

          <div className="cartao">
            <h2>📸 Minhas fotos</h2>
            <p className="ajuda" style={{ margin: '0 0 10px' }}>
              Escolha fotos bonitas para aparecerem lá em cima. Elas ficam só no seu celular.
            </p>
            <button className="btn grande" onClick={() => setTrocandoFotos(true)}>
              Trocar minhas fotos
            </button>
          </div>

          {tarefaPerguntando && (
            <Modal
              titulo={`${tarefaPerguntando.emoji} ${tarefaPerguntando.titulo}`}
              aoFechar={() => setPerguntando(null)}
            >
              <p className="ajuda">Antes de marcar, responda para mim:</p>
              <div className="pilha">
                {(tarefaPerguntando.passos ?? []).map((p, i) => (
                  <button
                    key={p.titulo}
                    className={`tarefa anne-tarefa${p.feito ? ' feita' : ''}`}
                    onClick={() => alternarPassoTarefa(dia, tarefaPerguntando.id, i)}
                    aria-pressed={p.feito}
                  >
                    <span className="emoji">{p.feito ? '✅' : '⬜'}</span>
                    <div className="txt"><div className="titulo">{p.titulo}</div></div>
                  </button>
                ))}
              </div>
              <button
                className="btn primario grande"
                style={{ marginTop: 14 }}
                disabled={passosFaltando(tarefaPerguntando) > 0}
                onClick={() => { concluir(tarefaPerguntando); setPerguntando(null) }}
              >
                {passosFaltando(tarefaPerguntando) > 0
                  ? `Faltam ${passosFaltando(tarefaPerguntando)} 👆`
                  : `Terminei! ${brl(tarefaPerguntando.valor)} 💰`}
              </button>
            </Modal>
          )}

          {trocandoFotos && (
            <Modal titulo="Minhas fotos" aoFechar={() => setTrocandoFotos(false)}>
              <GaleriaFotos />
            </Modal>
          )}

          {avisos.length > 0 && (
            <div className="cartao">
              <h2>💜 Recadinhos</h2>
              <div className="pilha">
                {avisos.slice(0, 8).map((a) => (
                  <div className={`aviso-caixa${a.lido ? '' : ' novo'}`} key={a.id}>
                    <div className="t">{a.titulo}</div>
                    <div className="d">{a.texto} • {horaCurta(a.em)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cartao">
            <h2>🔔 Avisos no celular</h2>
            <p className="ajuda">
              Ligue para o celular te avisar quando a mamãe mandar listinha nova
              e quando ela conferir as suas tarefas.
            </p>
            <button
              className="btn grande"
              onClick={() => {
                if (!('Notification' in window)) { alert('Esse celular não faz avisos.'); return }
                void Notification.requestPermission().then((p) => {
                  alert(p === 'granted' ? 'Prontinho! Agora eu te aviso. 🔔' : 'Os avisos não foram permitidos.')
                })
              }}
            >
              Quero receber avisos
            </button>
          </div>
        </>
      )}
    </>
  )
}
