import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    lightningcss: {
      errorRecovery: true,
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://madebymaa.online',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'https://madebymaa.online',
        changeOrigin: true,
      },
      '/storage': {
        target: process.env.VITE_API_URL || 'https://madebymaa.online',
        changeOrigin: true,
      },
      '/public': {
        target: process.env.VITE_API_URL || 'https://madebymaa.online',
        changeOrigin: true,
      },
    },
  },
})
