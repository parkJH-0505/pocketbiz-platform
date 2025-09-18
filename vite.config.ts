import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/pocketbiz-platform/' : '/',
  assetsInclude: ['**/*.csv'],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['recharts', 'react-dnd', 'react-dnd-html5-backend'],
          utils: ['date-fns', 'dompurify']
        }
      }
    }
  }
})
