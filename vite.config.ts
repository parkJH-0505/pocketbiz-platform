import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 로컬에서는 '/pocketbiz-platform/', Vercel에서는 '/'
  base: process.env.NODE_ENV === 'production' ? '/' : '/pocketbiz-platform/',
  assetsInclude: ['**/*.csv'],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          // 핵심 vendor 라이브러리
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // 차트 관련 라이브러리
          charts: ['chart.js', 'recharts', 'react-chartjs-2'],
          // 애니메이션 라이브러리
          motion: ['framer-motion'],
          // UI 인터랙션 라이브러리
          ui: ['react-dnd', 'react-dnd-html5-backend'],
          // 유틸리티 라이브러리
          utils: ['date-fns', 'dompurify', 'papaparse', 'jszip'],
          // PDF 생성 라이브러리
          pdf: ['jspdf', 'html2canvas'],
          // 아이콘 라이브러리
          icons: ['lucide-react'],
          // Three.js 관련 - 별도 청크로 분리 (V2 Dashboard 전용)
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          // 상태 관리 라이브러리
          state: ['zustand']
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
