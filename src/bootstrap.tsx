import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import type { Perfil } from './lib/types'
import './styles.css'

/** Sobe o app. Sem perfil = endereço completo, com o botão de troca. */
export function iniciar(perfilFixo?: Perfil): void {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App perfilFixo={perfilFixo} />
    </StrictMode>,
  )

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
    })
  }
}
