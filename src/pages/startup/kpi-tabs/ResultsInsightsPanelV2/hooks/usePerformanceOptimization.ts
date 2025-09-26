/**
 * usePerformanceOptimization Hook
 * 3D 성능 최적화 관리
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';

interface PerformanceConfig {
  targetFPS: number;
  qualityLevels: {
    high: {
      particleCount: number;
      shadowQuality: number;
      antialias: boolean;
    };
    medium: {
      particleCount: number;
      shadowQuality: number;
      antialias: boolean;
    };
    low: {
      particleCount: number;
      shadowQuality: number;
      antialias: boolean;
    };
  };
}

export const usePerformanceOptimization = () => {
  const { gl } = useThree();
  const frameTimeRef = useRef<number[]>([]);
  const lastFrameTime = useRef(performance.now());
  const currentQuality = useRef<'high' | 'medium' | 'low'>('high');

  const config: PerformanceConfig = useMemo(() => ({
    targetFPS: 45, // 모바일 고려
    qualityLevels: {
      high: {
        particleCount: 150,
        shadowQuality: 1024,
        antialias: true
      },
      medium: {
        particleCount: 75,
        shadowQuality: 512,
        antialias: true
      },
      low: {
        particleCount: 30,
        shadowQuality: 256,
        antialias: false
      }
    }
  }), []);

  // FPS 모니터링
  const monitorPerformance = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    lastFrameTime.current = now;

    // 최근 60프레임의 평균 계산
    frameTimeRef.current.push(deltaTime);
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }

    const averageFrameTime = frameTimeRef.current.reduce((a, b) => a + b, 0) / frameTimeRef.current.length;
    const currentFPS = 1000 / averageFrameTime;

    // 품질 조정
    if (currentFPS < config.targetFPS - 10 && currentQuality.current !== 'low') {
      adjustQuality('down');
    } else if (currentFPS > config.targetFPS + 10 && currentQuality.current !== 'high') {
      adjustQuality('up');
    }

    return {
      fps: Math.round(currentFPS),
      frameTime: Math.round(averageFrameTime * 100) / 100,
      quality: currentQuality.current
    };
  }, [config.targetFPS]);

  // 품질 조정
  const adjustQuality = useCallback((direction: 'up' | 'down') => {
    const qualities: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const currentIndex = qualities.indexOf(currentQuality.current);

    if (direction === 'down' && currentIndex > 0) {
      currentQuality.current = qualities[currentIndex - 1];
      console.log(`Performance optimization: Quality reduced to ${currentQuality.current}`);
    } else if (direction === 'up' && currentIndex < qualities.length - 1) {
      currentQuality.current = qualities[currentIndex + 1];
      console.log(`Performance optimization: Quality improved to ${currentQuality.current}`);
    }

    // 렌더러 설정 업데이트
    updateRendererSettings();
  }, []);

  // 렌더러 설정 업데이트
  const updateRendererSettings = useCallback(() => {
    // WebGL 컨텍스트가 유효한지 확인
    if (!gl || !gl.getContext) return;

    const settings = config.qualityLevels[currentQuality.current];

    try {
      // 그림자 품질 조정
      if (gl.shadowMap && gl.shadowMap.mapSize) {
        gl.shadowMap.mapSize.width = settings.shadowQuality;
        gl.shadowMap.mapSize.height = settings.shadowQuality;
      }

      // 픽셀 비율 조정 (모바일 성능 개선)
      const pixelRatio = settings.antialias ? Math.min(window.devicePixelRatio, 2) : 1;
      if (gl.setPixelRatio) {
        gl.setPixelRatio(pixelRatio);
      }
    } catch (error) {
      console.warn('Failed to update renderer settings:', error);
    }
  }, [gl, config]);

  // 메모이제이션된 지오메트리 캐시
  const geometryCache = useMemo(() => new Map(), []);

  // 지오메트리 캐싱 함수
  const getCachedGeometry = useCallback((key: string, createFn: () => any) => {
    if (geometryCache.has(key)) {
      return geometryCache.get(key);
    }

    const geometry = createFn();
    geometryCache.set(key, geometry);
    return geometry;
  }, [geometryCache]);

  // 디바이스 성능 감지
  const detectDeviceCapabilities = useCallback(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'low';

    // GPU 정보 획득
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    // 모바일 디바이스 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // 저성능 디바이스 패턴
    const lowEndPatterns = [
      /Mali-400/i,
      /Adreno \(TM\) 2/i,
      /PowerVR SGX/i
    ];

    if (isMobile || lowEndPatterns.some(pattern => pattern.test(renderer))) {
      return 'low';
    }

    // GPU 메모리 추정 (WebGL extension)
    const memoryExtension = gl.getExtension('WEBGL_debug_renderer_info');
    if (memoryExtension) {
      const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      if (maxTextureSize < 4096) {
        return 'medium';
      }
    }

    return 'high';
  }, []);

  // 초기 품질 설정
  useEffect(() => {
    // WebGL 컨텍스트가 준비될 때까지 기다림
    const initializeSettings = () => {
      const detectedQuality = detectDeviceCapabilities();
      currentQuality.current = detectedQuality;

      // 렌더러가 준비되었을 때만 설정 적용
      if (gl && gl.getContext) {
        updateRendererSettings();
      }

      console.log(`Initial quality set to: ${detectedQuality}`);
    };

    // 약간의 지연을 두어 Three.js가 완전히 초기화될 때까지 기다림
    const timer = setTimeout(initializeSettings, 100);

    return () => clearTimeout(timer);
  }, [detectDeviceCapabilities, updateRendererSettings, gl]);

  return {
    monitorPerformance,
    adjustQuality,
    getCachedGeometry,
    currentQuality: currentQuality.current,
    config: config.qualityLevels[currentQuality.current]
  };
};