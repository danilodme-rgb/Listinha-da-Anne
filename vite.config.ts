import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: publicado em https://<user>.github.io/Listinha-da-Anne/
export default defineConfig({
  plugins: [react()],
  base: process.env.APP_BASE ?? '/Listinha-da-Anne/',
})
