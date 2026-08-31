import { useMemo, useState } from 'react'
import type { Estado, Perfil, StatusDia } from '../lib/types'
import { MESES, chaveDe, curta, diasNoMes, hoje, porExtenso, somaDias } from '../lib/dates'
import { lerEscala } from '../lib/parser'
import { alternarComPapai, aplicarLeitura, comPapai, definirDia, limparMes } from '../lib/store'
import { Calendario } from '../components/Calendario'
import { Modal } from '../components/Modal'

interface Props {
  estado: Estado
  perfil: Perfil
  ano: number
  mes: number
  aoMudarMes: (ano: number, mes: number) => void
}

const EXEMPLO = `Setembro/2025
01 - FOLGA
02 - VOO CGH-SDU
03 a 05 trabalho
06 folga`

export function EscalaView({ estado, perfil, ano, mes, aoMudarMes }: Props) {
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [colando, setColando] = useState(false)
  const podeEditar = perfil === 'kelly'

  const resumo = useMemo(() => {
    let voando = 0
    let folga = 0
    let comPai = 0
    for (let d = 1; d <= diasNoMes(ano, mes); d++) {
      const k = chaveDe(ano, mes, d)
      const s = estado.escala[k]?.status
      if (s === 'trabalho') voando++
      if (s === 'folga') folga++
      if (comPapai(estado, k)) comPai++
    }
    return { voando, folga, comPai }
  }, [estado, ano, mes])

  const proximoComPapai = useMemo(() => {
    let k = hoje()
    for (let i = 0; i < 120; i++) {
      if (comPapai(estado, k)) return k
      k = somaDias(k, 1)
    }
    return null
  }, [estado])

  return (
    <>
      <div className="cartao">
        <Calendario
          estado={estado}
          ano={ano}
          mes={mes}
          aoMudarMes={aoMudarMes}
          selecionado={selecionado}
          aoClicar={(d) => setSelecionado(d === selecionado ? null : d)}
        />
      </div>

      {proximoComPapai && (
        <div className="cartao" style={{ background: 'var(--papai-bg)' }}>
          <div className="linha">
            <span style={{ fontSize: 30 }}>👨‍✈️</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>
                {proximoComPapai === hoje() ? 'Hoje é dia de papai!' : `Próximo dia com o papai: ${curta(proximoComPapai)}`}
              </div>
              <div style={{ fontSize: 13, color: '#92400e', marginTop: 2 }}>
                {porExtenso(proximoComPapai)}
              </div>
            </div>
          </div>
        </div>
      )}

      {selecionado && (
        <div className="cartao">
          <h2>{porExtenso(selecionado)}</h2>
          <p className="ajuda" style={{ marginBottom: 10 }}>
            {estado.escala[selecionado]?.status === 'trabalho' && '✈️ O papai está trabalhando.'}
            {estado.escala[selecionado]?.status === 'folga' && '🏠 O papai está de folga.'}
            {!estado.escala[selecionado] && 'Ainda sem escala para esse dia.'}
            {estado.escala[selecionado]?.nota && ` (${estado.escala[selecionado]!.nota})`}
            {comPapai(estado, selecionado) && ' A Anne passa o dia com ele.'}
          </p>

          {podeEditar && (
            <div className="pilha">
              <div className="linha" style={{ gap: 6 }}>
                {(['trabalho', 'folga'] as StatusDia[]).map((s) => (
                  <button
                    key={s}
                    className={`btn pequeno${estado.escala[selecionado]?.status === s ? ' primario' : ''}`}
                    style={{ flex: 1 }}
                    onClick={() => definirDia(selecionado, estado.escala[selecionado]?.status === s ? null : s)}
                  >
                    {s === 'trabalho' ? '✈️ Trabalho' : '🏠 Folga'}
                  </button>
                ))}
                <button className="btn pequeno contorno" onClick={() => definirDia(selecionado, null)}>Limpar</button>
              </div>
              <button
                className={`btn pequeno${comPapai(estado, selecionado) ? ' primario' : ' contorno'}`}
                onClick={() => alternarComPapai(selecionado)}
              >
                👨 Anne {comPapai(estado, selecionado) ? 'está' : 'não está'} com o papai nesse dia
              </button>
            </div>
          )}
        </div>
      )}

      <div className="cartao">
        <h3>{MESES[mes]} em números</h3>
        <div className="cofre" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div><div className="rot">Voando</div><div className="num" style={{ color: 'var(--voo)' }}>{resumo.voando}</div></div>
          <div><div className="rot">Folga</div><div className="num" style={{ color: 'var(--folga)' }}>{resumo.folga}</div></div>
          <div><div className="rot">Com o papai</div><div className="num" style={{ color: 'var(--papai)' }}>{resumo.comPai}</div></div>
        </div>
      </div>

      {podeEditar && (
        <div className="cartao">
          <h3>Escala do Alexandre</h3>
          <p className="ajuda">
            Copie a mensagem que ele mandar e cole aqui: o app preenche o mês sozinho.
            Serve tanto para um recadinho (“01 folga, 02 voo”) quanto para a tabela
            <b> Minha Escala</b> copiada do sistema dele.
            Os dias que não der para entender ficam em branco e aparecem na lista de avisos.
          </p>
          <div className="linha" style={{ gap: 8 }}>
            <button className="btn primario" style={{ flex: 1 }} onClick={() => setColando(true)}>
              📋 Colar escala
            </button>
            <button
              className="btn perigo pequeno"
              onClick={() => { if (confirm(`Apagar toda a escala de ${MESES[mes]}?`)) limparMes(ano, mes) }}
            >
              Limpar mês
            </button>
          </div>
        </div>
      )}

      {colando && (
        <ColarEscala
          anoPadrao={ano}
          mesPadrao={mes}
          aoFechar={() => setColando(false)}
          aoAplicar={(a, m) => { aoMudarMes(a, m); setColando(false) }}
        />
      )}
    </>
  )
}

function ColarEscala({
  anoPadrao, mesPadrao, aoFechar, aoAplicar,
}: {
  anoPadrao: number
  mesPadrao: number
  aoFechar: () => void
  aoAplicar: (ano: number, mes: number) => void
}) {
  const [texto, setTexto] = useState('')
  const leitura = useMemo(
    () => (texto.trim() ? lerEscala(texto, mesPadrao, anoPadrao) : null),
    [texto, mesPadrao, anoPadrao],
  )
  const total = leitura ? Object.keys(leitura.dias).length : 0

  return (
    <Modal titulo="Colar a escala do papai" aoFechar={aoFechar}>
      <p className="ajuda">
        Cole o texto exatamente como ele mandou. Entende formatos como
        <b> “folga dia 1, trabalho dia 2”</b>, <b>“01 - FOLGA”</b> (um por linha),
        <b> “FOLGA: 1,2,3”</b>, intervalos (<b>“3 a 7 trabalho”</b>) e datas (<b>05/09</b>).
      </p>
      <p className="ajuda">
        ✈️ Também entende a tabela <b>Minha Escala</b> do sistema dele, com as linhas
        <b> FR</b>, <b>Layover</b> e os voos: <b>FR vira folga</b> e todo o resto vira
        trabalho. Precisa ser o <b>texto</b> da tabela (selecionar e copiar) — foto e
        print não dão para ler.
      </p>

      <textarea
        className="campo"
        style={{ minHeight: 150 }}
        placeholder={EXEMPLO}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />

      <div style={{ marginTop: 8 }}>
        <button className="btn pequeno contorno" onClick={() => setTexto(EXEMPLO)}>Ver um exemplo</button>
      </div>

      {leitura && (
        <div className="pilha" style={{ marginTop: 14 }}>
          <div className={`alerta-leitura${leitura.naoReconhecidos.length === 0 && total > 0 ? ' bom' : ''}`}>
            {total > 0 ? (
              <>
                <b>Entendi {total} {total === 1 ? 'dia' : 'dias'}</b> de {MESES[leitura.mes].toLowerCase()} de {leitura.ano}
                {!leitura.mesDetectado && ' (mês assumido pelo calendário aberto)'}.
              </>
            ) : (
              <>Não consegui reconhecer nenhum dia nesse texto.</>
            )}

            {leitura.naoReconhecidos.length > 0 && (
              <div style={{ marginTop: 8 }}>
                ⚠️ <b>Ficaram em branco:</b> {leitura.naoReconhecidos.map((d) => `dia ${d}`).join(', ')}.
                {leitura.conflitos.length > 0 && (
                  <> Desses, {leitura.conflitos.map((d) => `o dia ${d}`).join(', ')} apareceu com duas informações diferentes.</>
                )}
                <br />Você pode preencher esses dias tocando neles no calendário.
              </div>
            )}

            {leitura.trechosIgnorados.length > 0 && (
              <div style={{ marginTop: 8 }}>
                📝 <b>Trechos que não entendi:</b>
                <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {leitura.trechosIgnorados.map((t) => <li key={t}>“{t}”</li>)}
                </ul>
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="legenda" style={{ gap: 4 }}>
              {Object.entries(leitura.dias)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([d, s]) => (
                  <span
                    key={d}
                    className="carimbo"
                    style={s === 'trabalho'
                      ? { background: 'var(--voo-bg)', color: 'var(--voo)' }
                      : { background: 'var(--folga-bg)', color: 'var(--folga)' }}
                  >
                    {d} {s === 'trabalho' ? '✈️' : '🏠'}
                  </span>
                ))}
            </div>
          )}

          <button
            className="btn primario grande"
            disabled={total === 0}
            onClick={() => {
              aplicarLeitura(leitura.ano, leitura.mes, leitura.dias, leitura.notas, leitura.naoReconhecidos)
              aoAplicar(leitura.ano, leitura.mes)
            }}
          >
            Aplicar no calendário
          </button>
        </div>
      )}
    </Modal>
  )
}
