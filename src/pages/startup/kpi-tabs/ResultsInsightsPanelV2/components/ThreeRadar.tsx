/**
 * ThreeRadar Component
 * React Three Fiber 기반 3D 레이더 차트
 */

import React, { Suspense, useRef, useEffect, useCallback, useState, useMemo, memo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { RotateCcw, Camera, Activity, RefreshCw } from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';
import { RadarGeometry } from './RadarGeometry';
import { RadarMaterials } from './RadarMaterials';
import type { AxisKey } from '../types';

interface ThreeRadarProps {
  width?: number;
  height?: number;
  scores: Record<AxisKey, number>;
  className?: string;
}

// 성능 모니터링 컴포넌트 - 메모이제이션 적용
const PerformanceMonitor: React.FC<{ onUpdate: (stats: any) => void }> = memo(({ onUpdate }) => {
  const { gl } = useThree();
  const { monitorPerformance } = usePerformanceOptimization();

  useFrame(() => {
    // WebGL 컨텍스트가 유효할 때만 모니터링
    if (gl && gl.getContext) {
      try {
        const stats = monitorPerformance();
        onUpdate(stats);
      } catch (error) {
        console.warn('Performance monitoring error:', error);
        // 기본값 반환
        onUpdate({ fps: 60, frameTime: 16.7, quality: 'medium' });
      }
    }
  });

  return null;
});

// Props 비교 함수 - scores 값이 실제로 변경됐을 때만 리렌더링
const arePropsEqual = (prevProps: ThreeRadarProps, nextProps: ThreeRadarProps) => {
  if (prevProps.width !== nextProps.width || prevProps.height !== nextProps.height) {
    return false;
  }
  if (prevProps.className !== nextProps.className) {
    return false;
  }
  // scores 객체의 실제 값 비교
  const prevScores = prevProps.scores;
  const nextScores = nextProps.scores;
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  for (const axis of axes) {
    if (Math.abs((prevScores[axis] || 0) - (nextScores[axis] || 0)) > 0.1) {
      return false; // 0.1 이상 차이나면 변경으로 간주
    }
  }

  return true; // props가 같음
};

// ThreeRadar 컴포넌트 정의 - React.memo로 감싸기
const ThreeRadarComponent: React.FC<ThreeRadarProps> = ({
  width = 600,
  height = 600,
  scores,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<any>(null);
  const [performanceStats, setPerformanceStats] = useState({ fps: 60, frameTime: 16.7, quality: 'high' });
  const [showStats, setShowStats] = useState(false);
  const { animation, setRotation, toggleAutoRotate, toggleParticles } = useV2Store();

  // 카메라 리셋 함수
  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // 스크린샷 캡처 함수
  const captureScreenshot = useCallback(() => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `radar-chart-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  }, []);

  // 성능 최적화를 위한 설정 - useMemo로 캐싱
  const cameraConfig = useMemo(() => ({
    position: [0, 0, 8] as [number, number, number],
    fov: 45,
    near: 0.1,
    far: 100
  }), []);

  const controlsConfig = useMemo(() => ({
    enablePan: false,
    enableZoom: true,
    enableRotate: true,
    minDistance: 3,
    maxDistance: 12,
    minPolarAngle: Math.PI / 6, // 30도 - 위에서 보는 각도 제한
    maxPolarAngle: Math.PI / 2.2, // 약 82도 (거의 수평까지)
    autoRotate: animation.isAutoRotating,
    autoRotateSpeed: 0.5,
    enableDamping: true, // 부드러운 댐핑
    dampingFactor: 0.05, // 댐핑 강도
    rotateSpeed: 0.5, // 회전 민감도
    zoomSpeed: 0.5, // 줌 속도
    panSpeed: 0.8,
    screenSpacePanning: false
  }), [animation.isAutoRotating]);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <Canvas
        ref={canvasRef}
        shadows
        dpr={[1, 2]} // 레티나 지원하되 성능 고려
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance' // 성능 우선
        }}
        camera={cameraConfig}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />

        {/* 환경 설정 */}
        <Environment preset="studio" />

        {/* 카메라 설정 */}
        <PerspectiveCamera makeDefault {...cameraConfig} />

        {/* 컨트롤 설정 */}
        <OrbitControls
          ref={controlsRef}
          {...controlsConfig}
          onChange={(event) => {
            if (event?.target) {
              const controls = event.target as any;
              setRotation({
                x: controls.getPolarAngle(),
                y: controls.getAzimuthalAngle(),
                z: 0
              });
            }
          }}
        />

        {/* 성능 모니터링 */}
        <PerformanceMonitor onUpdate={setPerformanceStats} />

        {/* 3D 레이더 메인 컴포넌트 */}
        <Suspense fallback={null}>
          <RadarGeometry scores={scores} />
        </Suspense>

        {/* 머티리얼 매니저 */}
        <RadarMaterials />

        {/* 포그 효과 */}
        <fog attach="fog" args={['#f0f0f0', 8, 20]} />
      </Canvas>

      {/* 3D 컨트롤 패널 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex gap-2">
          <button
            onClick={() => toggleAutoRotate()}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              animation.isAutoRotating
                ? 'bg-primary-main text-white'
                : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
            }`}
            title="자동 회전"
          >
            <RotateCcw size={14} />
            {animation.isAutoRotating ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => toggleParticles()}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              animation.particlesActive
                ? 'bg-primary-main text-white'
                : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
            }`}
            title="파티클 효과"
          >
            ✨
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-light text-neutral-gray rounded text-sm hover:bg-neutral-border transition-colors"
            title="시점 재설정"
          >
            <RefreshCw size={14} />
            재설정
          </button>

          <button
            onClick={captureScreenshot}
            className="flex items-center gap-1 px-3 py-1 bg-neutral-light text-neutral-gray rounded text-sm hover:bg-neutral-border transition-colors"
            title="스크린샷 저장"
          >
            <Camera size={14} />
            저장
          </button>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition-colors ${
              showStats
                ? 'bg-accent-green text-white'
                : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
            }`}
            title="성능 통계"
          >
            <Activity size={14} />
            {performanceStats.fps}
          </button>
        </div>
      </div>

      {/* 성능 통계 패널 */}
      {showStats && (
        <div className="absolute top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono">
          <div className="space-y-1">
            <div>FPS: {performanceStats.fps}</div>
            <div>Frame Time: {performanceStats.frameTime}ms</div>
            <div>Quality: {performanceStats.quality}</div>
            <div>Device: {/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}</div>
          </div>
        </div>
      )}

      {/* 로딩 인디케이터 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-neutral-gray text-sm">3D 레이더 로딩 중...</div>
      </div>
    </div>
  );
};

// React.memo로 감싸서 export
export const ThreeRadar = memo(ThreeRadarComponent, arePropsEqual);