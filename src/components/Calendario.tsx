import type { Estado } from '../lib/types'
import { DIAS_SEMANA, MESES, ehHoje, gradeDoMes, paraData } from '../lib/dates'
import { comPapai, listaDe, observacaoDe } from '../lib/store'

interface Props {
  estado: Estado
  ano: number
  mes: number
  aoMudarMes: (ano: number, mes: number) => void
  selecionado?: string | null
  aoClicar?: (data: string) => void
  /** Mostra bolinhas nos dias que tem listinha montada. */
  mostrarListas?: boolean
  legenda?: boolean
}

export function Calendario({
  estado, ano, mes, aoMudarMes, selecionado, aoClicar, mostrarListas = false, legenda = true,
}: Props) {
  const semanas = gradeDoMes(ano, mes)
  const anterior = () => (mes === 0 ? aoMudarMes(ano - 1, 11) : aoMudarMes(ano, mes - 1))
  const proximo = () => (mes === 11 ? aoMudarMes(ano + 1, 0) : aoMudarMes(ano, mes + 1))

  return (
    <div>
      <div className="cal-topo">
        <button className="cal-nav" onClick={anterior} aria-label="Mês anterior">‹</button>
        <div className="mes">{MESES[mes]} <span style={{ opacity: 0.5 }}>{ano}</span></div>
        <button className="cal-nav" onClick={proximo} aria-label="Próximo mês">›</button>
      </div>

      <div className="cal-semana" aria-hidden="true">
        {DIAS_SEMANA.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="cal-grade" role="grid">
        {semanas.flat().map((data, i) => {
          if (!data) return <div key={`v${i}`} className="cal-dia vazio" />
          const dia = paraData(data).getDate()
          const status = estado.escala[data]?.status
          const papai = comPapai(estado, data)
          const obs = observacaoDe(estado, data)
          const lista = mostrarListas ? listaDe(estado, data) : null
          const temTarefas = (lista?.tarefas.length ?? 0) > 0
          const tudoFeito = temTarefas && lista!.tarefas.every((t) => t.feita)
          const classes = [
            'cal-dia',
            status ?? '',
            ehHoje(data) ? 'hoje' : '',
            selecionado === data ? 'selecionado' : '',
          ].filter(Boolean).join(' ')

          const descricao = [
            `Dia ${dia}`,
            status === 'trabalho' ? 'papai voando' : status === 'folga' ? 'papai de folga' : 'sem escala',
            papai ? 'dia do papai' : 'dia da mamãe',
            obs ? `observação: ${obs}` : '',
            temTarefas ? `${lista!.tarefas.length} tarefas` : '',
          ].filter(Boolean).join(', ')

          return (
            <button
              key={data}
              className={classes}
              onClick={aoClicar ? () => aoClicar(data) : undefined}
              disabled={!aoClicar}
              aria-label={descricao}
              aria-current={ehHoje(data) ? 'date' : undefined}
            >
              <span>{dia}</span>
              <span className="marca">
                {status === 'trabalho' ? '✈️' : status === 'folga' ? '🏠' : '·'}
                {papai ? '👨' : '🐱'}
              </span>
              {(temTarefas || obs) && (
                <span className="pontos">
                  {obs && <span className="ponto obs" />}
                  {temTarefas && <span className={`ponto${tudoFeito ? ' feito' : ''}`} />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {legenda && (
        <div className="legenda">
          <span><i style={{ background: 'var(--voo-bg)' }} />✈️ Papai trabalhando</span>
          <span><i style={{ background: 'var(--folga-bg)' }} />🏠 Papai de folga</span>
          <span><i style={{ background: '#f4f2fa' }} />Sem escala</span>
          <span>👨 Dia do papai</span>
          <span>🐱 Dia da mamãe</span>
          <span><i className="ponto obs" style={{ borderRadius: 999 }} />Tem observação</span>
        </div>
      )}
    </div>
  )
}
