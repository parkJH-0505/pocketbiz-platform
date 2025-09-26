/**
 * RadarMaterials Component
 * 3D 레이더용 머티리얼 관리 및 셰이더 효과
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import { useV2Store } from '../store/useV2Store';
import { ParticleSystem } from './ParticleSystem';

export const RadarMaterials: React.FC = () => {
  const sparklesRef = useRef<any>();
  const { animation } = useV2Store();

  // 파티클 애니메이션
  useFrame((state, delta) => {
    if (sparklesRef.current && animation.particlesActive) {
      sparklesRef.current.rotation.y += delta * 0.1;
    }
  });

  // 파티클 설정
  const particleConfig = useMemo(() => ({
    count: 100,
    scale: [4, 4, 2] as [number, number, number],
    size: 2,
    speed: 0.3,
    opacity: 0.6,
    color: '#8b5cf6'
  }), []);

  return (
    <>
      {/* 배경 별들 */}
      <Stars
        radius={50}
        depth={50}
        count={200}
        factor={2}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* 커스텀 파티클 시스템 */}
      <ParticleSystem />

      {/* 추가 스파클 효과 */}
      {animation.particlesActive && (
        <Sparkles
          ref={sparklesRef}
          {...particleConfig}
          position={[0, 0, 0]}
        />
      )}

      {/* 환경 조명 효과 */}
      <group>
        {/* 주변광 보조 */}
        <hemisphereLight
          args={['#ffffff', '#606060', 0.3]}
          position={[0, 1, 0]}
        />

        {/* 림라이트 효과 */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.4}
          color="#8b5cf6"
          castShadow
        />

        {/* 반대편 보조광 */}
        <directionalLight
          position={[-5, -5, -5]}
          intensity={0.2}
          color="#3b82f6"
        />
      </group>

      {/* 바닥 반사판 (옵션) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial
          color="#f8fafc"
          transparent
          opacity={0.1}
          reflectivity={0.5}
        />
      </mesh>
    </>
  );
};