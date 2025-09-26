/**
 * useMobileOptimization Hook
 * 모바일 디바이스 최적화
 */

import { useEffect, useState, useCallback } from 'react';

interface MobileConfig {
  isMobile: boolean;
  isTablet: boolean;
  isTouch: boolean;
  screenSize: 'small' | 'medium' | 'large';
  pixelRatio: number;
  memoryLevel: 'low' | 'medium' | 'high';
}

export const useMobileOptimization = () => {
  const [config, setConfig] = useState<MobileConfig>({
    isMobile: false,
    isTablet: false,
    isTouch: false,
    screenSize: 'large',
    pixelRatio: 1,
    memoryLevel: 'high'
  });

  // 디바이스 감지
  const detectDevice = useCallback((): MobileConfig => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 화면 크기 분류
    const width = window.innerWidth;
    let screenSize: 'small' | 'medium' | 'large';
    if (width < 768) screenSize = 'small';
    else if (width < 1024) screenSize = 'medium';
    else screenSize = 'large';

    // 메모리 수준 추정
    const memoryLevel = estimateMemoryLevel();

    return {
      isMobile,
      isTablet,
      isTouch,
      screenSize,
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      memoryLevel
    };
  }, []);

  // 메모리 수준 추정
  const estimateMemoryLevel = useCallback((): 'low' | 'medium' | 'high' => {
    // Navigator 메모리 API (실험적)
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      if (memory <= 2) return 'low';
      if (memory <= 4) return 'medium';
      return 'high';
    }

    // 하드웨어 동시성을 통한 추정
    const cores = navigator.hardwareConcurrency || 2;
    if (cores <= 2) return 'low';
    if (cores <= 4) return 'medium';
    return 'high';
  }, []);

  // 모바일 최적화 설정 반환
  const getMobileOptimizedSettings = useCallback(() => {
    const { isMobile, screenSize, memoryLevel } = config;

    // 기본 설정
    let settings = {
      particleCount: 150,
      shadowQuality: 1024,
      antialias: true,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      enableDamping: true,
      autoRotateSpeed: 0.5
    };

    // 모바일 최적화
    if (isMobile || screenSize === 'small') {
      settings = {
        ...settings,
        particleCount: 50,
        shadowQuality: 256,
        antialias: false,
        pixelRatio: 1,
        autoRotateSpeed: 0.3
      };
    }

    // 메모리 기반 최적화
    if (memoryLevel === 'low') {
      settings = {
        ...settings,
        particleCount: Math.min(settings.particleCount, 30),
        shadowQuality: 256,
        antialias: false
      };
    }

    return settings;
  }, [config]);

  // 터치 제스처 설정
  const getTouchSettings = useCallback(() => {
    return {
      enableTouch: config.isTouch,
      touchSensitivity: config.isMobile ? 0.8 : 1.0,
      pinchZoomSpeed: config.isMobile ? 0.3 : 0.5,
      rotateSpeed: config.isMobile ? 0.3 : 0.5
    };
  }, [config]);

  // 반응형 레이아웃 설정
  const getResponsiveLayout = useCallback(() => {
    const { screenSize } = config;

    switch (screenSize) {
      case 'small':
        return {
          radarSize: Math.min(window.innerWidth - 40, 300),
          controlPanelPosition: 'bottom',
          showLabels: 'minimal',
          fontSize: 0.15
        };
      case 'medium':
        return {
          radarSize: 400,
          controlPanelPosition: 'bottom-left',
          showLabels: 'abbreviated',
          fontSize: 0.18
        };
      default:
        return {
          radarSize: 600,
          controlPanelPosition: 'bottom-left',
          showLabels: 'full',
          fontSize: 0.2
        };
    }
  }, [config]);

  // 초기 설정 및 리사이즈 리스너
  useEffect(() => {
    const updateConfig = () => {
      setConfig(detectDevice());
    };

    updateConfig();

    // 화면 회전/리사이즈 감지
    const handleResize = () => {
      // 디바운스를 위한 지연
      setTimeout(updateConfig, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [detectDevice]);

  return {
    config,
    getMobileOptimizedSettings,
    getTouchSettings,
    getResponsiveLayout,
    isLowPerformanceDevice: config.isMobile || config.memoryLevel === 'low'
  };
};