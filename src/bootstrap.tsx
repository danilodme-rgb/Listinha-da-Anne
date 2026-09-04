import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import type { Perfil } from './lib/types'
import { aplicarLinkDeSincronizacao, vigiarLinkDeSincronizacao } from './lib/nuvem'
import { vigiarAtualizacoes } from './lib/atualizacao'
import './styles.css'

/** Sobe o app. Sem perfil = endereço completo, com o botão de troca. */
export function iniciar(perfilFixo?: Perfil): void {
  // um link com #sync= liga a sincronizacao antes do app subir
  aplicarLinkDeSincronizacao()
  // e tambem quando o link e' colado com o app ja aberto (trocar o # nao recarrega)
  vigiarLinkDeSincronizacao()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App perfilFixo={perfilFixo} />
    </StrictMode>,
  )

  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      vigiarAtualizacoes(`${import.meta.env.BASE_URL}sw.js`)
    })
  }
}
