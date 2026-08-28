import { useState } from 'react'
import type { Estado, TarefaDoDia } from '../lib/types'
import { brl, curta, ehHoje, horaCurta, hoje, porExtenso, somaDias } from '../lib/dates'
import {
  avisosDe, carteira, comPapai, concluirTarefa, desfazerTarefa, listaDe,
  marcarAvisosLidos, marcarListaVista,
} from '../lib/store'
import { Calendario } from '../components/Calendario'
import { Festa } from '../components/Festa'

interface Props {
  estado: Estado
  ano: number
  mes: number
  aoMudarMes: (ano: number, mes: number) => void
  dia: string
  aoMudarDia: (data: string) => void
}

const ELOGIOS = [
  'Isso, Anne! 🌟', 'Arrasou! 💜', 'Que capricho! ✨', 'Você é demais! 🎉',
  'Mandou bem! 🚀', 'Orgulho da mamãe! 🥰', 'Uhuul! 🏆',
]

export function AnneView({ estado, ano, mes, aoMudarMes, dia, aoMudarDia }: Props) {
  const [festa, setFesta] = useState<{ titulo: string; detalhe: string } | null>(null)

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

  return (
    <>
      {festa && <Festa titulo={festa.titulo} detalhe={festa.detalhe} aoFechar={() => setFesta(null)} />}

      {temNovidade && (
        <div className="convite">
          <div className="env">💌</div>
          <h2>A mamãe montou uma listinha pra você!</h2>
          <p>Toca no botão pra ver o que tem hoje.</p>
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
                Ainda não tem listinha para esse dia.<br />Depois volta aqui pra ver!
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
                      onClick={() => (t.feita ? (t.conferida ? undefined : desfazerTarefa(dia, t.id)) : concluir(t))}
                      aria-pressed={t.feita}
                    >
                      <span className="emoji">{t.emoji}</span>
                      <div className="txt">
                        <div className="titulo">{t.titulo}</div>
                        {t.feita && (
                          <div className="obs">
                            {t.conferida ? '✓ a mamãe conferiu!' : 'feito! esperando a mamãe conferir'}
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
            {c.pago > 0 && (
              <p className="ajuda" style={{ margin: '10px 0 0' }}>
                Você já recebeu {brl(c.pago)} até hoje. Que economia! 🌟
              </p>
            )}
          </div>

          <div className="cartao">
            <h2>✈️ Onde está o papai</h2>
            <p className="ajuda">
              Azul é dia de voo. Verde é dia de folga. O 👨 mostra os dias que você fica com ele.
            </p>
            <Calendario
              estado={estado}
              ano={ano}
              mes={mes}
              aoMudarMes={aoMudarMes}
              selecionado={dia}
              aoClicar={aoMudarDia}
              mostrarListas
            />
            <div className="linha" style={{ gap: 8, marginTop: 12 }}>
              <button className="btn pequeno contorno" style={{ flex: 1 }} onClick={() => aoMudarDia(somaDias(dia, -1))}>‹ Dia anterior</button>
              <button className="btn pequeno" style={{ flex: 1 }} onClick={() => aoMudarDia(hoje())}>Hoje</button>
              <button className="btn pequeno contorno" style={{ flex: 1 }} onClick={() => aoMudarDia(somaDias(dia, 1))}>Próximo dia ›</button>
            </div>
          </div>

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
        </>
      )}
    </>
  )
}
