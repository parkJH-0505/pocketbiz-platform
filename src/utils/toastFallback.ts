/**
 * toastFallback.ts
 *
 * ToastContext가 사용 불가능한 경우를 위한 fallback 메커니즘
 * 콘솔 로깅과 개발 환경에서의 시각적 표시 제공
 */

interface ToastFallback {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showDebug: (message: string, details?: any, duration?: number) => void;
}

/**
 * 콘솔 기반 fallback 토스트 생성
 */
export const createToastFallback = (): ToastFallback => {
  return {
    showSuccess: (message: string, duration?: number) => {
      console.log(`✅ SUCCESS: ${message}`);

      // 개발 환경에서 시각적 피드백 제공
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        // 임시 DOM 요소 생성 (3초 후 자동 제거)
        const toast = document.createElement('div');
        toast.className = 'toast-fallback toast-success';
        toast.textContent = `✅ ${message}`;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: #10b981;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, duration || 3000);
      }
    },

    showError: (message: string, duration?: number) => {
      console.error(`❌ ERROR: ${message}`);

      if (import.meta.env.DEV && typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'toast-fallback toast-error';
        toast.textContent = `❌ ${message}`;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: #ef4444;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, duration || 5000);
      }
    },

    showWarning: (message: string, duration?: number) => {
      console.warn(`⚠️ WARNING: ${message}`);

      if (import.meta.env.DEV && typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'toast-fallback toast-warning';
        toast.textContent = `⚠️ ${message}`;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: #f59e0b;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, duration || 4000);
      }
    },

    showInfo: (message: string, duration?: number) => {
      console.info(`ℹ️ INFO: ${message}`);

      if (import.meta.env.DEV && typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'toast-fallback toast-info';
        toast.textContent = `ℹ️ ${message}`;
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 9999;
          animation: slideIn 0.3s ease-out;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => document.body.removeChild(toast), 300);
        }, duration || 3000);
      }
    },

    showDebug: (message: string, details?: any, duration?: number) => {
      if (import.meta.env.DEV) {
        console.log(`🔧 DEBUG: ${message}`, details);

        if (typeof window !== 'undefined') {
          const toast = document.createElement('div');
          toast.className = 'toast-fallback toast-debug';
          toast.textContent = `🔧 ${message}`;
          toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: #6b7280;
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
          `;

          document.body.appendChild(toast);
          setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => document.body.removeChild(toast), 300);
          }, duration || 2000);
        }
      }
    }
  };
};

/**
 * CSS 애니메이션 추가 (한 번만 추가)
 */
if (typeof window !== 'undefined' && !document.querySelector('#toast-fallback-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-fallback-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

/**
 * 싱글톤 인스턴스
 */
export const toastFallback = createToastFallback();