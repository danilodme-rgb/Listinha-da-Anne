import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Carimbo desta publicacao. Muda a cada build -- e' o que permite ao celular
// perceber que existe versao nova e se atualizar sozinho.
const VERSAO =
  process.env.GITHUB_SHA?.slice(0, 7) ??
  new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')

// O service worker mora em scripts/sw.js (fora de public/) porque precisa
// passar por aqui para receber o carimbo antes de ir para o dist.
function serviceWorkerCarimbado(): Plugin {
  return {
    name: 'sw-carimbado',
    generateBundle() {
      const fonte = readFileSync(resolve(__dirname, 'scripts/sw.js'), 'utf8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: fonte.replace('__VERSAO__', VERSAO),
      })
    },
  }
}

// Tres entradas: o endereco completo e um app dedicado para cada perfil.
//   /            -> tudo, com o botao de troca de perfil
//   /anne/       -> so' a Anne
//   /kelly/      -> so' a Kelly
export default defineConfig({
  plugins: [react(), serviceWorkerCarimbado()],
  base: process.env.APP_BASE ?? '/Listinha-da-Anne/',
  define: {
    __VERSAO_APP__: JSON.stringify(VERSAO),
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        anne: resolve(__dirname, 'anne/index.html'),
        kelly: resolve(__dirname, 'kelly/index.html'),
      },
    },
  },
})
