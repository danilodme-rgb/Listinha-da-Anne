import { useMemo, useRef, useState } from 'react'
import type { Estado, Perfil, StatusDia } from '../lib/types'
import { MESES, chaveDe, curta, diasNoMes, hoje, porExtenso, somaDias } from '../lib/dates'
import { lerEscala } from '../lib/parser'
import { emCasaNoMes, emCasaPorMes, emCasaTotal } from '../lib/relatorio'
import {
  aplicarLeitura, comPapai, definirDia, definirDonoDoDia, definirObservacao,
  donoEscolhidoAMao, limparMes, observacaoDe,
} from '../lib/store'
import { linhasDoRelatorio } from '../lib/relatorio'
import { compartilharPdf, montarPdf } from '../lib/pdf'
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
    let comMae = 0
    for (let d = 1; d <= diasNoMes(ano, mes); d++) {
      const k = chaveDe(ano, mes, d)
      const s = estado.escala[k]?.status
      if (s === 'trabalho') voando++
      if (s === 'folga') folga++
      if (comPapai(estado, k)) comPai++
      else comMae++
    }
    return { voando, folga, comPai, comMae }
  }, [estado, ano, mes])

  const emCasa = useMemo(() => ({
    doMes: emCasaNoMes(estado.escala, ano, mes),
    porMes: emCasaPorMes(estado.escala),
    total: emCasaTotal(estado.escala),
  }), [estado.escala, ano, mes])
  const variosAnos = new Set(emCasa.porMes.map((f) => f.ano)).size > 1

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
        <DiaSelecionado
          estado={estado}
          data={selecionado}
          podeEditar={podeEditar}
        />
      )}

      <div className="cartao">
        <h3>{MESES[mes]} em números</h3>
        {/* 2x2: quatro colunas nao cabem em tela de celular */}
        <div className="cofre">
          <div><div className="rot">✈️ Voando</div><div className="num" style={{ color: 'var(--voo)' }}>{resumo.voando}</div></div>
          <div><div className="rot">🏠 Folga</div><div className="num" style={{ color: 'var(--folga)' }}>{resumo.folga}</div></div>
          <div><div className="rot">👨 Papai</div><div className="num" style={{ color: 'var(--papai)' }}>{resumo.comPai}</div></div>
          <div><div className="rot">🐱 Mamãe</div><div className="num" style={{ color: 'var(--roxo)' }}>{resumo.comMae}</div></div>
        </div>
      </div>

      {/* So' no modo mamae: a Anne nao precisa de contabilidade da ausencia do pai. */}
      {podeEditar && (
        <div className="cartao">
          <h3>🏠 Papai em casa</h3>
          <p className="ajuda">
            De cada 100 dias com escala lida, quantos ele passou de folga.
            Só o modo mamãe vê este quadro.
          </p>

          {emCasa.doMes.lidos === 0 ? (
            <p className="ajuda" style={{ margin: 0 }}>
              {MESES[mes]} ainda não tem escala lida — é só colar a escala aqui embaixo.
            </p>
          ) : (
            <>
              <div className="linha" style={{ alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--folga)', letterSpacing: -1 }}>
                  {emCasa.doMes.percentual}%
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tinta-fraca)' }}>
                  em {MESES[mes].toLowerCase()}
                </span>
              </div>
              <Barra percentual={emCasa.doMes.percentual} />
              <div style={{ fontSize: 13, color: 'var(--tinta-fraca)', marginTop: 6 }}>
                🏠 {emCasa.doMes.emCasa} em casa · ✈️ {emCasa.doMes.fora} voando
                {' '}(de {emCasa.doMes.lidos} {emCasa.doMes.lidos === 1 ? 'dia lido' : 'dias lidos'})
              </div>
            </>
          )}

          <BotaoRelatorio estado={estado} ano={ano} mes={mes} />

          {emCasa.porMes.length > 1 && (
            <div style={{ marginTop: 16 }}>
              <div style={{
                fontSize: 11.5, fontWeight: 800, color: 'var(--tinta-fraca)',
                textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8,
              }}>
                Mês a mês
              </div>
              <div className="pilha" style={{ gap: 9 }}>
                {emCasa.porMes.map((f) => (
                  <div key={`${f.ano}-${f.mes}`}>
                    <div className="linha" style={{ justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 3 }}>
                      <span>{MESES[f.mes]}{variosAnos ? `/${f.ano}` : ''}</span>
                      <span style={{ color: 'var(--folga)' }}>{f.percentual}%</span>
                    </div>
                    <Barra percentual={f.percentual} />
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, marginTop: 12 }}>
                No total, <b>{emCasa.total.percentual}%</b> dos {emCasa.total.lidos} dias já lidos —
                {' '}{emCasa.total.emCasa} em casa e {emCasa.total.fora} voando.
              </div>
            </div>
          )}
        </div>
      )}

      {podeEditar && (
        <div className="cartao">
          <h3>Escala do Alexandre</h3>
          <p className="ajuda">
            Copie a mensagem que ele mandar e cole aqui: o app preenche o mês sozinho.
            Serve tanto para um recadinho (“01 folga, 02 voo”) quanto para a tabela
            <b> Minha Escala</b> copiada do sistema dele.
            Os dias que o app não entender ficam em branco e aparecem na lista de avisos.
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


/**
 * Cartao do dia clicado: o que acontece nele, a observacao da mamae e com quem
 * a Anne fica. As duas opcoes ficam lado a lado de proposito -- o botao antigo
 * dizia "a Anne nao esta com o papai" e alterava no mesmo toque, o que fazia um
 * dia de folga aparecer errado depois de um toque curioso.
 */
function DiaSelecionado({ estado, data, podeEditar }: { estado: Estado; data: string; podeEditar: boolean }) {
  const dia = estado.escala[data]
  const papai = comPapai(estado, data)
  const obs = observacaoDe(estado, data)
  const aMao = donoEscolhidoAMao(estado, data)
  const campo = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="cartao">
      <h2>{porExtenso(data)}</h2>
      <p className="ajuda" style={{ marginBottom: 10 }}>
        {dia?.status === 'trabalho' && '✈️ O papai está trabalhando.'}
        {dia?.status === 'folga' && '🏠 O papai está de folga.'}
        {!dia && 'Ainda não há escala para este dia.'}
        {dia?.nota && ` (${dia.nota})`}
        {papai
          ? ' 👨 É dia do papai: a Anne passa o dia com ele.'
          : ' 🐱 É dia da mamãe: a Anne fica em casa com a mamãe.'}
      </p>

      {obs && !podeEditar && <div className="obs-dia">📝 {obs}</div>}

      {podeEditar && (
        <div className="pilha">
          <div>
            <label className="rotulo" htmlFor="obs-dia">📝 Observações deste dia</label>
            <textarea
              id="obs-dia"
              key={data}
              ref={campo}
              className="campo"
              style={{ minHeight: 64, marginTop: 6 }}
              defaultValue={obs}
              placeholder="Ex.: o papai chega às 13h e vai embora às 20h"
              onBlur={(ev) => definirObservacao(data, ev.target.value)}
            />
            <button
              className="btn pequeno"
              style={{ marginTop: 6 }}
              onClick={() => definirObservacao(data, campo.current?.value ?? '')}
            >
              Salvar observação
            </button>
          </div>

          <div>
            <div className="rotulo" style={{ marginBottom: 6 }}>A escala do papai neste dia</div>
            <div className="linha" style={{ gap: 6 }}>
              {(['trabalho', 'folga'] as StatusDia[]).map((op) => (
                <button
                  key={op}
                  className={`btn pequeno${dia?.status === op ? ' primario' : ''}`}
                  style={{ flex: 1 }}
                  aria-pressed={dia?.status === op}
                  onClick={() => definirDia(data, dia?.status === op ? null : op)}
                >
                  {op === 'trabalho' ? '✈️ Trabalho' : '🏠 Folga'}
                </button>
              ))}
              <button className="btn pequeno contorno" onClick={() => definirDia(data, null)}>Limpar</button>
            </div>
          </div>

          <div>
            <div className="rotulo" style={{ marginBottom: 6 }}>Com quem a Anne fica</div>
            <div className="linha" style={{ gap: 6 }}>
              <button
                className={`btn pequeno${papai ? ' primario' : ' contorno'}`}
                style={{ flex: 1 }}
                aria-pressed={papai}
                onClick={() => definirDonoDoDia(data, 'papai')}
              >
                👨 Dia do papai
              </button>
              <button
                className={`btn pequeno${papai ? ' contorno' : ' primario'}`}
                style={{ flex: 1 }}
                aria-pressed={!papai}
                onClick={() => definirDonoDoDia(data, 'mamae')}
              >
                🐱 Dia da mamãe
              </button>
            </div>
            {aMao && (
              <button
                className="btn pequeno contorno"
                style={{ marginTop: 6, width: '100%' }}
                onClick={() => definirDonoDoDia(data, null)}
              >
                Voltar ao automático (folga do papai = dia do papai)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Gera o relatorio de frequencia em PDF e manda para o WhatsApp (ou baixa). */
function BotaoRelatorio({ estado, ano, mes }: { estado: Estado; ano: number; mes: number }) {
  const [ocupado, setOcupado] = useState(false)

  const gerar = async () => {
    setOcupado(true)
    try {
      const linhas = linhasDoRelatorio(estado, ano, mes, curta(hoje()))
      const bytes = montarPdf(`Escala do Alexandre — ${MESES[mes]} de ${ano}`, linhas)
      const nome = `escala-${ano}-${String(mes + 1).padStart(2, '0')}.pdf`
      const fim = await compartilharPdf(nome, bytes)
      if (fim === 'baixado') alert(`Relatório salvo como ${nome}. É só anexar no WhatsApp. 💜`)
    } catch {
      alert('Não consegui gerar o relatório agora. Tente de novo.')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <button className="btn grande" style={{ marginTop: 14 }} disabled={ocupado} onClick={() => void gerar()}>
      {ocupado ? 'Gerando…' : '📄 Relatório em PDF para o WhatsApp'}
    </button>
  )
}

/** Fatia verde (em casa) sobre o fundo azul (voando). */
function Barra({ percentual }: { percentual: number }) {
  return (
    <div
      role="img"
      aria-label={`${percentual}% em casa`}
      style={{ height: 10, borderRadius: 999, background: 'var(--voo-bg)', overflow: 'hidden' }}
    >
      <div style={{ width: `${percentual}%`, height: '100%', background: 'var(--folga)', borderRadius: 999 }} />
    </div>
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
              <>Não consegui reconhecer nenhum dia neste texto.</>
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
