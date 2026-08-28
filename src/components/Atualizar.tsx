import { useEffect, useRef, useState } from 'react'

/** Quanto e' preciso puxar (em pixels de tela) para valer como pedido de atualizar. */
const GATILHO = 68

/**
 * Puxar a tela para baixo no topo — ou chegar ao fim da rolagem — relê os dados da nuvem,
 * como nas redes sociais. Sem nuvem ligada não faz nada visível.
 */
export function useAtualizarPuxando(atualizar: () => Promise<unknown>) {
  const [puxa, setPuxa] = useState(0)
  const [rodando, setRodando] = useState(false)
  const acao = useRef(atualizar)
  const distancia = useRef(0)
  const ocupado = useRef(false)
  const ultimaVez = useRef(0)

  useEffect(() => { acao.current = atualizar })

  useEffect(() => {
    const rodar = () => {
      const agora = Date.now()
      if (ocupado.current || agora - ultimaVez.current < 1500) return
      ultimaVez.current = agora
      ocupado.current = true
      setRodando(true)
      void Promise.resolve(acao.current()).finally(() => {
        // segura o aviso meio segundo: piscar rápido demais parece que nada aconteceu
        window.setTimeout(() => { ocupado.current = false; setRodando(false) }, 500)
      })
    }

    let inicioY = 0
    let noTopo = false

    const comecou = (ev: TouchEvent) => {
      noTopo = window.scrollY <= 0
      inicioY = ev.touches[0].clientY
    }
    const moveu = (ev: TouchEvent) => {
      if (!noTopo) return
      if (window.scrollY > 0) { noTopo = false; distancia.current = 0; setPuxa(0); return }
      const d = (ev.touches[0].clientY - inicioY) * 0.5
      distancia.current = d > 0 ? Math.min(d, GATILHO + 28) : 0
      setPuxa(distancia.current)
    }
    const soltou = () => {
      if (distancia.current >= GATILHO) rodar()
      distancia.current = 0
      noTopo = false
      setPuxa(0)
    }
    const rolou = () => {
      const fim = window.innerHeight + window.scrollY
      if (fim >= document.documentElement.scrollHeight - 24) rodar()
    }

    window.addEventListener('touchstart', comecou, { passive: true })
    window.addEventListener('touchmove', moveu, { passive: true })
    window.addEventListener('touchend', soltou)
    window.addEventListener('touchcancel', soltou)
    window.addEventListener('scroll', rolou, { passive: true })
    return () => {
      window.removeEventListener('touchstart', comecou)
      window.removeEventListener('touchmove', moveu)
      window.removeEventListener('touchend', soltou)
      window.removeEventListener('touchcancel', soltou)
      window.removeEventListener('scroll', rolou)
    }
  }, [])

  return { puxa, rodando }
}

export function FaixaAtualizar({ puxa, rodando }: { puxa: number; rodando: boolean }) {
  if (!rodando && puxa <= 0) return null
  const pronto = puxa >= GATILHO
  return (
    <div className="puxar" style={{ height: rodando ? 42 : puxa }} aria-live="polite">
      <span className={rodando ? 'rodinha' : ''}>{rodando || pronto ? '🔄' : '⬇️'}</span>
      {rodando ? 'Atualizando…' : pronto ? 'Solte para atualizar' : 'Puxe para atualizar'}
    </div>
  )
}
