import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_USE_LIGHT_THEME': JSON.stringify(env.VITE_USE_LIGHT_THEME || 'false'),
      'import.meta.env.VITE_DEBUG': JSON.stringify(env.DEBUG || env.VITE_DEBUG || 'false'),
      'import.meta.env.VITE_ENABLE_BREAK_ONLY_OVERLAY': JSON.stringify(env.VITE_ENABLE_BREAK_ONLY_OVERLAY || 'false'),
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})