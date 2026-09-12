import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/rota-aprovacao-fisica/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
