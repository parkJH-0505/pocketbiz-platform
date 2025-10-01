import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 브라우저 호환성 검사 (모든 환경)
import('./services/browserCompatibility').then(() => {
  console.log('🌐 브라우저 호환성 검사 완료');
});

// 성능 모니터링 및 에러 추적 비활성화 (너무 많은 로그 출력 방지)
// if (import.meta.env.DEV) {
//   import('./services/performanceMonitor').then(({ performanceMonitor }) => {
//     performanceMonitor.startMonitoring();
//     console.log('🚀 Project MOMENTUM 성능 모니터링 시작');
//   });

//   import('./services/errorMonitor').then(({ errorMonitor }) => {
//     errorMonitor.startMonitoring();
//     console.log('🛡️ Project MOMENTUM 에러 모니터링 시작');
//   });
// }

createRoot(document.getElementById('root')!).render(
  <App />
)
