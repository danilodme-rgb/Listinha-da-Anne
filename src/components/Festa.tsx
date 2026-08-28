import { useEffect, useMemo } from 'react'

const CORES = ['#6d4aff', '#ec4899', '#fbbf24', '#10b981', '#3b82f6', '#f472b6']

interface Props {
  titulo: string
  detalhe?: string
  emoji?: string
  aoFechar: () => void
}

/** Chuva de confete + balão de parabéns quando a Anne conclui uma tarefa. */
export function Festa({ titulo, detalhe, emoji = '🎉', aoFechar }: Props) {
  const papeis = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      id: i,
      esquerda: Math.random() * 100,
      atraso: Math.random() * 0.5,
      duracao: 1.6 + Math.random() * 1.2,
      cor: CORES[i % CORES.length],
    })),
    [],
  )

  useEffect(() => {
    const t = setTimeout(aoFechar, 2600)
    return () => clearTimeout(t)
  }, [aoFechar])

  return (
    <>
      <div className="festa" aria-hidden="true">
        {papeis.map((p) => (
          <i
            key={p.id}
            style={{
              left: `${p.esquerda}%`,
              background: p.cor,
              animationDelay: `${p.atraso}s`,
              animationDuration: `${p.duracao}s`,
            }}
          />
        ))}
      </div>
      <div className="parabens" role="status" onClick={aoFechar}>
        <div className="em">{emoji}</div>
        <div className="t">{titulo}</div>
        {detalhe && <div className="v">{detalhe}</div>}
      </div>
    </>
  )
}
