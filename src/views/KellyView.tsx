import { useMemo, useState } from 'react'
import type { Afazer, Estado } from '../lib/types'
import { brl, chave, curta, horaCurta, hoje, porExtenso, somaDias } from '../lib/dates'
import {
  RECADOS_SUGERIDOS, adicionarTarefa, alternarAfazerNaLista, avisosDe, carteira, comPapai,
  conferirTarefa, conferirTudo, definirRecado, enviarLista, listaDe, marcarAvisosLidos, novoId,
  pendentesDeConferencia, registrarPagamento, removerAfazer, removerTarefa, replicarLista,
  salvarAfazer, type ModoReplica,
} from '../lib/store'
import { Calendario } from '../components/Calendario'
import { Modal } from '../components/Modal'

interface Props {
  estado: Estado
  ano: number
  mes: number
  aoMudarMes: (ano: number, mes: number) => void
  dia: string
  aoMudarDia: (data: string) => void
}

export function KellyView({ estado, ano, mes, aoMudarMes, dia, aoMudarDia }: Props) {
  const [modal, setModal] = useState<null | 'catalogo' | 'replicar' | 'nova' | 'pagar'>(null)
  const lista = listaDe(estado, dia)
  const c = carteira(estado)
  const pendentes = pendentesDeConferencia(estado)
  const avisos = avisosDe(estado, 'kelly')
  const total = lista.tarefas.reduce((s, t) => s + t.valor, 0)
  const foraDeCasa = comPapai(estado, dia)

  const naLista = useMemo(
    () => new Set(lista.tarefas.map((t) => t.titulo)),
    [lista.tarefas],
  )

  return (
    <>
      {pendentes.length > 0 && (
        <div className="cartao" style={{ borderTop: '4px solid var(--ok)' }}>
          <h2>🔔 Para conferir ({pendentes.length})</h2>
          <p className="ajuda">A Anne marcou como feitas. Confira e o valor entra no cofrinho dela.</p>
          <div className="pilha">
            {pendentes.slice(0, 8).map(({ data, tarefa }) => (
              <div className="tarefa" key={tarefa.id}>
                <span className="emoji">{tarefa.emoji}</span>
                <div className="txt">
                  <div className="titulo">{tarefa.titulo}</div>
                  <div className="obs">
                    {curta(data)}{tarefa.feitaEm ? ` às ${horaCurta(tarefa.feitaEm)}` : ''} • {brl(tarefa.valor)}
                    {!!tarefa.passos?.length && ` • ✓ ${tarefa.passos.length} perguntinhas`}
                  </div>
                </div>
                <button className="btn ok pequeno" onClick={() => conferirTarefa(data, tarefa.id)}>
                  ✓ Conferido
                </button>
              </div>
            ))}
          </div>
          {pendentes.length > 1 && (
            <button
              className="btn ok grande"
              style={{ marginTop: 10 }}
              onClick={() => {
                const datas = [...new Set(pendentes.map((p) => p.data))]
                let n = 0
                for (const d of datas) n += conferirTudo(d)
                alert(`${n} ${n === 1 ? 'tarefa conferida' : 'tarefas conferidas'}! 💜`)
              }}
            >
              Conferir todas ({brl(pendentes.reduce((s, p) => s + p.tarefa.valor, 0))})
            </button>
          )}
        </div>
      )}

      <div className="cartao">
        <h2>Escolha o dia</h2>
        <p className="ajuda">A bolinha rosa marca os dias que já têm listinha. Verde = tudo feito.</p>
        <Calendario
          estado={estado}
          ano={ano}
          mes={mes}
          aoMudarMes={aoMudarMes}
          selecionado={dia}
          aoClicar={aoMudarDia}
          mostrarListas
          legenda={false}
        />
      </div>

      <div className="cartao">
        <div className="linha">
          <h2 style={{ flex: 1 }}>Listinha de {porExtenso(dia)}</h2>
          {lista.enviadaEm && (
            <span className={`carimbo ${lista.vistaEm ? 'ok' : 'info'}`}>
              {lista.vistaEm ? `Vista ${horaCurta(lista.vistaEm)}` : 'Enviada'}
            </span>
          )}
        </div>

        {foraDeCasa && (
          <div className="alerta-leitura" style={{ marginTop: 8 }}>
            👨 Nesse dia a Anne está com o papai — normalmente não tem tarefa em casa.
          </div>
        )}

        <h3 style={{ marginTop: 14 }}>Afazeres do dia</h3>
        <div className="pilha">
          {estado.afazeres.map((a) => {
            const escolhido = naLista.has(a.titulo)
            return (
              <button
                key={a.id}
                className={`tarefa${escolhido ? ' escolhida' : ''}`}
                onClick={() => alternarAfazerNaLista(dia, a)}
                aria-pressed={escolhido}
              >
                <span className="emoji">{a.emoji}</span>
                <div className="txt">
                  <div className="titulo">{a.titulo}</div>
                  {!!a.passos?.length && <div className="obs">❓ {a.passos.length} perguntinhas</div>}
                </div>
                <span className="valor">{brl(a.valor)}</span>
                <span style={{ fontSize: 20, color: escolhido ? 'var(--roxo)' : 'var(--linha)' }}>
                  {escolhido ? '✓' : '+'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="linha" style={{ gap: 8, marginTop: 10 }}>
          <button className="btn pequeno" style={{ flex: 1 }} onClick={() => setModal('nova')}>
            ✏️ Tarefa avulsa
          </button>
          <button className="btn pequeno contorno" style={{ flex: 1 }} onClick={() => setModal('catalogo')}>
            ⚙️ Editar afazeres
          </button>
        </div>

        {lista.tarefas.length > 0 && (
          <>
            <h3 style={{ marginTop: 16 }}>Na lista ({lista.tarefas.length})</h3>
            <div className="pilha">
              {lista.tarefas.map((t) => (
                <div className={`tarefa${t.feita ? ' feita' : ''}`} key={t.id}>
                  <span className="emoji">{t.emoji}</span>
                  <div className="txt">
                    <div className="titulo">{t.titulo}</div>
                    {t.feita && (
                      <div className="obs">
                        {t.conferida ? '✓ conferida' : 'feita — aguardando conferência'}
                      </div>
                    )}
                    {!t.feita && !!t.passos?.length && (
                      <div className="obs">❓ {t.passos.length} perguntinhas antes de marcar</div>
                    )}
                  </div>
                  <span className="valor">{brl(t.valor)}</span>
                  {!t.feita && (
                    <button
                      className="btn pequeno contorno"
                      onClick={() => removerTarefa(dia, t.id)}
                      aria-label={`Remover ${t.titulo}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="total" style={{ marginTop: 12 }}>
              <div>
                <div className="rot">Se ela fizer tudo</div>
                <div className="num">{brl(total)}</div>
              </div>
              <span style={{ fontSize: 34 }}>💰</span>
            </div>
          </>
        )}

        <h3 style={{ marginTop: 16 }}>Recado da mamãe</h3>
        <textarea
          className="campo"
          placeholder="Escreva um carinho para a Anne ler quando abrir a listinha…"
          value={lista.recado}
          onChange={(e) => definirRecado(dia, e.target.value)}
        />
        <div className="legenda" style={{ marginTop: 8 }}>
          {RECADOS_SUGERIDOS.map((r) => (
            <button key={r} className="btn pequeno contorno" onClick={() => definirRecado(dia, r)}>
              {r.slice(0, 22)}…
            </button>
          ))}
        </div>

        <div className="pilha" style={{ marginTop: 14 }}>
          <button
            className="btn primario grande"
            disabled={lista.tarefas.length === 0}
            onClick={() => { enviarLista(dia); alert('Listinha enviada! A Anne vai ver o aviso na aba dela. 💌') }}
          >
            {lista.enviadaEm ? '🔁 Enviar de novo para a Anne' : '💌 Enviar para a Anne'}
          </button>
          <button
            className="btn grande"
            disabled={lista.tarefas.length === 0}
            onClick={() => setModal('replicar')}
          >
            🔂 Replicar essa lista para outros dias
          </button>
        </div>
      </div>

      <div className="cartao">
        <h2>Cofrinho da Anne</h2>
        <div className="cofre">
          <div><div className="rot">A pagar</div><div className="num" style={{ color: 'var(--ok)' }}>{brl(c.saldo)}</div></div>
          <div><div className="rot">Aguardando conferência</div><div className="num" style={{ color: 'var(--papai)' }}>{brl(c.aguardando)}</div></div>
          <div><div className="rot">Já conferido</div><div className="num">{brl(c.conferido)}</div></div>
          <div><div className="rot">Já pago</div><div className="num">{brl(c.pago)}</div></div>
        </div>
        <button className="btn grande" style={{ marginTop: 12 }} disabled={c.saldo <= 0} onClick={() => setModal('pagar')}>
          💵 Registrar pagamento da mesada
        </button>
        {estado.pagamentos.length > 0 && (
          <div className="pilha" style={{ marginTop: 12 }}>
            {estado.pagamentos.slice(0, 5).map((p) => (
              <div className="linha" key={p.id} style={{ fontSize: 13 }}>
                <span style={{ flex: 1, color: 'var(--tinta-fraca)' }}>
                  {curta(chave(new Date(p.em)))} • {p.descricao}
                </span>
                <b>{brl(p.valor)}</b>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cartao">
        <div className="linha">
          <h2 style={{ flex: 1 }}>Avisos</h2>
          {avisos.some((a) => !a.lido) && (
            <button className="btn pequeno contorno" onClick={() => marcarAvisosLidos('kelly')}>Marcar lidos</button>
          )}
        </div>
        {avisos.length === 0 ? (
          <div className="vazio-msg">Nada por aqui ainda. Quando a Anne concluir uma tarefa, o aviso aparece aqui. 💜</div>
        ) : (
          <div className="pilha">
            {avisos.slice(0, 12).map((a) => (
              <div className={`aviso-caixa${a.lido ? '' : ' novo'}`} key={a.id}>
                <div className="t">{a.titulo}</div>
                <div className="d">{a.texto} • {horaCurta(a.em)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal === 'catalogo' && <EditorCatalogo estado={estado} aoFechar={() => setModal(null)} />}
      {modal === 'nova' && <NovaTarefa dia={dia} aoFechar={() => setModal(null)} />}
      {modal === 'replicar' && <Replicar dia={dia} aoFechar={() => setModal(null)} />}
      {modal === 'pagar' && <Pagar saldo={c.saldo} aoFechar={() => setModal(null)} />}
    </>
  )
}

function NovaTarefa({ dia, aoFechar }: { dia: string; aoFechar: () => void }) {
  const [titulo, setTitulo] = useState('')
  const [emoji, setEmoji] = useState('⭐')
  const [valor, setValor] = useState('1,00')

  const salvar = () => {
    const v = Number(valor.replace(',', '.'))
    if (!titulo.trim() || Number.isNaN(v)) return
    adicionarTarefa(dia, { titulo: titulo.trim(), emoji, valor: v })
    aoFechar()
  }

  return (
    <Modal titulo="Tarefa avulsa" aoFechar={aoFechar}>
      <div className="pilha">
        <div>
          <label className="rotulo" htmlFor="nt-emoji">Figurinha</label>
          <input id="nt-emoji" className="campo" value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 4))} />
        </div>
        <div>
          <label className="rotulo" htmlFor="nt-titulo">O que a Anne deve fazer</label>
          <input id="nt-titulo" className="campo" value={titulo} autoFocus
            onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Organizar a estante" />
        </div>
        <div>
          <label className="rotulo" htmlFor="nt-valor">Quanto vale (R$)</label>
          <input id="nt-valor" className="campo" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <button className="btn primario grande" onClick={salvar}>Adicionar à listinha</button>
      </div>
    </Modal>
  )
}

function EditorCatalogo({ estado, aoFechar }: { estado: Estado; aoFechar: () => void }) {
  const [rascunho, setRascunho] = useState<Afazer>({ id: '', emoji: '⭐', titulo: '', valor: 1 })
  const [abertoPassos, setAbertoPassos] = useState<string | null>(null)

  return (
    <Modal titulo="Afazeres que a Anne pode fazer" aoFechar={aoFechar}>
      <p className="ajuda">Este é o catálogo reutilizável. Mude os valores como preferir.</p>
      <div className="pilha">
        {estado.afazeres.map((a) => (
          <div key={a.id}>
            <div className="tarefa">
              <input
                className="campo"
                style={{ width: 56, textAlign: 'center', padding: 6 }}
                value={a.emoji}
                onChange={(e) => salvarAfazer({ ...a, emoji: e.target.value.slice(0, 4) })}
                aria-label={`Figurinha de ${a.titulo}`}
              />
              <input
                className="campo"
                style={{ flex: 1, padding: 6 }}
                value={a.titulo}
                onChange={(e) => salvarAfazer({ ...a, titulo: e.target.value })}
                aria-label="Nome do afazer"
              />
              <input
                className="campo"
                style={{ width: 74, padding: 6 }}
                inputMode="decimal"
                value={String(a.valor).replace('.', ',')}
                onChange={(e) => {
                  const v = Number(e.target.value.replace(',', '.'))
                  if (!Number.isNaN(v)) salvarAfazer({ ...a, valor: v })
                }}
                aria-label="Valor"
              />
              <button
                className={`btn pequeno${abertoPassos === a.id ? '' : ' contorno'}`}
                onClick={() => setAbertoPassos(abertoPassos === a.id ? null : a.id)}
                aria-label={`Perguntinhas de ${a.titulo}`}
              >
                ❓{a.passos?.length ? ` ${a.passos.length}` : ''}
              </button>
              <button className="btn pequeno perigo" onClick={() => removerAfazer(a.id)} aria-label={`Apagar ${a.titulo}`}>✕</button>
            </div>
            {abertoPassos === a.id && <EditorPassos afazer={a} />}
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 16 }}>Novo afazer</h3>
      <div className="linha" style={{ gap: 6 }}>
        <input className="campo" style={{ width: 56, textAlign: 'center' }} value={rascunho.emoji}
          onChange={(e) => setRascunho({ ...rascunho, emoji: e.target.value.slice(0, 4) })} aria-label="Figurinha" />
        <input className="campo" style={{ flex: 1 }} placeholder="Nome" value={rascunho.titulo}
          onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })} aria-label="Nome" />
        <input className="campo" style={{ width: 74 }} inputMode="decimal" value={String(rascunho.valor).replace('.', ',')}
          onChange={(e) => {
            const v = Number(e.target.value.replace(',', '.'))
            setRascunho({ ...rascunho, valor: Number.isNaN(v) ? 0 : v })
          }} aria-label="Valor" />
      </div>
      <button
        className="btn primario grande"
        style={{ marginTop: 10 }}
        disabled={!rascunho.titulo.trim()}
        onClick={() => {
          salvarAfazer({ ...rascunho, id: novoId('af'), titulo: rascunho.titulo.trim() })
          setRascunho({ id: '', emoji: '⭐', titulo: '', valor: 1 })
        }}
      >
        Adicionar ao catálogo
      </button>
    </Modal>
  )
}

/**
 * Perguntinhas de um afazer, uma por linha. E' o que faz o "Banho" virar checklist:
 * a Anne so' marca a tarefa depois de responder todas.
 */
function EditorPassos({ afazer }: { afazer: Afazer }) {
  const [texto, setTexto] = useState((afazer.passos ?? []).join('\n'))

  const salvar = () => {
    const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
    salvarAfazer({ ...afazer, passos: linhas.length ? linhas : undefined })
  }

  return (
    <div style={{ padding: '8px 4px 4px' }}>
      <label className="rotulo" htmlFor={`passos-${afazer.id}`}>Perguntinhas (uma por linha)</label>
      <textarea
        id={`passos-${afazer.id}`}
        className="campo"
        style={{ minHeight: 84, fontSize: 13 }}
        placeholder={'Recolheu a toalha?\nOrganizou suas coisas?\nApagou as luzes?'}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={salvar}
      />
      <div className="linha" style={{ gap: 8, marginTop: 6 }}>
        <p className="ajuda" style={{ flex: 1, margin: 0 }}>
          A Anne responde todas antes de a tarefa contar como feita.
        </p>
        <button className="btn pequeno" onClick={salvar}>Salvar</button>
      </div>
    </div>
  )
}

function Replicar({ dia, aoFechar }: { dia: string; aoFechar: () => void }) {
  const [ate, setAte] = useState(somaDias(dia, 7))
  const [modo, setModo] = useState<ModoReplica>('em-casa')
  const [enviar, setEnviar] = useState(true)

  const opcoes: Array<{ v: ModoReplica; r: string; d: string }> = [
    { v: 'em-casa', r: '🏠 Só quando a Anne estiver em casa', d: 'Pula os dias com o papai' },
    { v: 'uteis', r: '📚 Só de segunda a sexta', d: 'Pula sábado e domingo' },
    { v: 'todos', r: '📅 Todos os dias', d: 'Sem exceção' },
  ]

  return (
    <Modal titulo="Replicar a listinha" aoFechar={aoFechar}>
      <p className="ajuda">
        A mesma lista (e o mesmo recado) é copiada para os próximos dias, até a data escolhida.
        Dias que já tinham lista são substituídos.
      </p>
      <label className="rotulo" htmlFor="rep-ate">Replicar até</label>
      <input id="rep-ate" className="campo" type="date" value={ate} min={somaDias(dia, 1)}
        onChange={(e) => setAte(e.target.value)} />

      <div className="pilha" style={{ marginTop: 14 }}>
        {opcoes.map((o) => (
          <button key={o.v} className={`tarefa${modo === o.v ? ' escolhida' : ''}`} onClick={() => setModo(o.v)}>
            <div className="txt"><div className="titulo">{o.r}</div><div className="obs">{o.d}</div></div>
            <span style={{ fontSize: 20 }}>{modo === o.v ? '✓' : ''}</span>
          </button>
        ))}
        <button className={`tarefa${enviar ? ' escolhida' : ''}`} onClick={() => setEnviar(!enviar)}>
          <div className="txt">
            <div className="titulo">💌 Já enviar para a Anne</div>
            <div className="obs">Ela vê o aviso quando chegar o dia</div>
          </div>
          <span style={{ fontSize: 20 }}>{enviar ? '✓' : ''}</span>
        </button>
      </div>

      <button
        className="btn primario grande"
        style={{ marginTop: 14 }}
        disabled={ate <= dia}
        onClick={() => {
          const n = replicarLista(dia, ate, modo, enviar)
          alert(n > 0 ? `Listinha copiada para ${n} ${n === 1 ? 'dia' : 'dias'}! 💜` : 'Nenhum dia se encaixou nessa regra.')
          aoFechar()
        }}
      >
        Replicar até {curta(ate)}
      </button>
    </Modal>
  )
}

function Pagar({ saldo, aoFechar }: { saldo: number; aoFechar: () => void }) {
  const [valor, setValor] = useState(saldo.toFixed(2).replace('.', ','))
  const [descricao, setDescricao] = useState(`Mesada de ${curta(hoje())}`)

  return (
    <Modal titulo="Registrar pagamento" aoFechar={aoFechar}>
      <p className="ajuda">
        Isso só registra que você já entregou o dinheiro (ou depositou no cofrinho real).
        O valor sai do “a pagar” e vira histórico.
      </p>
      <label className="rotulo" htmlFor="pg-valor">Valor pago (R$)</label>
      <input id="pg-valor" className="campo" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
      <label className="rotulo" htmlFor="pg-desc" style={{ marginTop: 10 }}>Descrição</label>
      <input id="pg-desc" className="campo" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <button
        className="btn primario grande"
        style={{ marginTop: 14 }}
        onClick={() => {
          const v = Number(valor.replace(',', '.'))
          if (Number.isNaN(v) || v <= 0) return
          registrarPagamento(v, descricao.trim() || 'Mesada')
          aoFechar()
        }}
      >
        Confirmar pagamento
      </button>
    </Modal>
  )
}
