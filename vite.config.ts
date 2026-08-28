import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tres entradas: o endereco completo e um app dedicado para cada perfil.
//   /            -> tudo, com o botao de troca de perfil
//   /anne/       -> so' a Anne
//   /kelly/      -> so' a Kelly
export default defineConfig({
  plugins: [react()],
  base: process.env.APP_BASE ?? '/Listinha-da-Anne/',
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
