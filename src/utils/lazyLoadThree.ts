/**
 * Three.js Lazy Loading Utilities
 * Three.js 및 관련 라이브러리를 동적으로 로드하여 초기 번들 사이즈 감소
 */

// Three.js 관련 라이브러리를 동적으로 로드하는 함수
export const loadThreeJS = async () => {
  const [
    { Canvas, useThree, useFrame },
    { OrbitControls, PerspectiveCamera, Environment },
    THREE
  ] = await Promise.all([
    import('@react-three/fiber'),
    import('@react-three/drei'),
    import('three')
  ]);

  return {
    Canvas,
    useThree,
    useFrame,
    OrbitControls,
    PerspectiveCamera,
    Environment,
    THREE
  };
};

// 캐싱을 위한 변수
let threeModules: any = null;

// 캐싱된 Three.js 모듈 반환
export const getThreeModules = async () => {
  if (!threeModules) {
    threeModules = await loadThreeJS();
  }
  return threeModules;
};

// Three.js 사용 가능 여부 체크
export const isThreeAvailable = () => {
  return threeModules !== null;
};

// WebGL 지원 확인
export const checkWebGLSupport = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!(gl && gl instanceof WebGLRenderingContext);
  } catch (e) {
    return false;
  }
};

// Three.js 프리로드 (선택적)
export const preloadThree = () => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // 브라우저가 유휴 상태일 때 Three.js 로드
    window.requestIdleCallback(() => {
      getThreeModules();
    });
  } else {
    // requestIdleCallback이 없으면 setTimeout 사용
    setTimeout(() => {
      getThreeModules();
    }, 1000);
  }
};