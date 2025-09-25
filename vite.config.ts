import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel에서는 base를 '/'로 설정 (루트 경로)
  base: '/',
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
