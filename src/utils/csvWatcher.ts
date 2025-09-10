// CSV 파일 변경 감지 및 자동 리로드
import { clearKPICache } from '../data/kpiLoader';

// 파일 변경을 감지하고 캐시를 클리어하는 함수
export function setupCSVWatcher() {
  if (import.meta.hot) {
    // Vite HMR을 사용한 CSV 파일 감시
    import.meta.hot.accept(['../data/csvData.ts'], () => {
      console.log('CSV files changed, clearing cache...');
      clearKPICache();
      
      // 페이지 리로드 또는 컴포넌트 재렌더링 트리거
      window.dispatchEvent(new CustomEvent('csv-updated'));
    });
  }
}

// CSV 업데이트 이벤트 리스너 훅
export function useCSVUpdateListener(callback: () => void) {
  if (typeof window !== 'undefined') {
    window.addEventListener('csv-updated', callback);
    
    return () => {
      window.removeEventListener('csv-updated', callback);
    };
  }
}