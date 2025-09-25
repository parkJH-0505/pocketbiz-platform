import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel은 '/', GitHub Pages는 '/pocketbiz-platform/' 사용
  base: process.env.VERCEL ? '/' : '/pocketbiz-platform/',
  assetsInclude: ['**/*.csv'],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'recharts', 'react-chartjs-2'],
          motion: ['framer-motion'],
          ui: ['react-dnd', 'react-dnd-html5-backend'],
          utils: ['date-fns', 'dompurify', 'papaparse', 'jszip'],
          pdf: ['jspdf', 'html2canvas'],
          icons: ['lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env']
  },
  server: {
    hmr: {
      overlay: false
    }
  }
})
