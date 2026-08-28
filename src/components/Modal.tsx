import { useEffect, type ReactNode } from 'react'

interface Props {
  titulo: string
  aoFechar: () => void
  children: ReactNode
}

export function Modal({ titulo, aoFechar, children }: Props) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar() }
    document.addEventListener('keydown', tecla)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tecla)
      document.body.style.overflow = ''
    }
  }, [aoFechar])

  return (
    <div className="fundo-modal" onClick={aoFechar} role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="linha" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, flex: 1 }}>{titulo}</h2>
          <button className="btn pequeno contorno" onClick={aoFechar}>Fechar</button>
        </div>
        {children}
      </div>
    </div>
  )
}
