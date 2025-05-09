import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0'
  },
  define: {
    'process.env.VITE_MAGIE_PUZZLE_API': JSON.stringify(process.env.VITE_MAGIE_PUZZLE_API)
  }
})
