import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, forward /api calls to our local Express proxy server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})