/**
 * ParticleSystem Component
 * 고성능 파티클 시스템 (Instanced Rendering)
 */

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Color, Vector3 } from 'three';
import { useV2Store } from '../store/useV2Store';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  scale: number;
  opacity: number;
  color: Color;
  life: number;
  maxLife: number;
}

export const ParticleSystem: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const { animation } = useV2Store();

  const PARTICLE_COUNT = 150;
  const SPAWN_RADIUS = 5;
  const MAX_HEIGHT = 8;

  // 파티클 데이터 생성
  const particles = useMemo(() => {
    const particleArray: Particle[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 원형 분포로 파티클 생성
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * SPAWN_RADIUS;
      const height = Math.random() * MAX_HEIGHT;

      particleArray.push({
        position: new Vector3(
          Math.cos(angle) * radius,
          height - MAX_HEIGHT / 2,
          Math.sin(angle) * radius
        ),
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.01 + 0.005,
          (Math.random() - 0.5) * 0.02
        ),
        scale: Math.random() * 0.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        color: new Color().setHSL(
          Math.random() * 0.3 + 0.6, // 보라-파랑 계열
          Math.random() * 0.5 + 0.5,
          Math.random() * 0.3 + 0.7
        ),
        life: Math.random() * 10,
        maxLife: Math.random() * 5 + 5
      });
    }

    return particleArray;
  }, []);

  // 파티클 업데이트
  useFrame((state, delta) => {
    if (!meshRef.current || !animation.particlesActive) return;

    const time = state.clock.getElapsedTime();

    particles.forEach((particle, i) => {
      // 위치 업데이트
      particle.position.add(particle.velocity.clone().multiplyScalar(delta * 60));

      // 생명주기 업데이트
      particle.life += delta;

      // 파티클 재생성 (수명 종료 시)
      if (particle.life > particle.maxLife) {
        // 새로운 위치로 리셋
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * SPAWN_RADIUS;

        particle.position.set(
          Math.cos(angle) * radius,
          -MAX_HEIGHT / 2,
          Math.sin(angle) * radius
        );

        particle.life = 0;
        particle.velocity.set(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.01 + 0.005,
          (Math.random() - 0.5) * 0.02
        );
      }

      // 생명주기에 따른 알파값 조정
      const lifeRatio = particle.life / particle.maxLife;
      const alpha = lifeRatio < 0.5
        ? lifeRatio * 2
        : (1 - lifeRatio) * 2;

      // 웨이브 효과
      const wave = Math.sin(time * 2 + i * 0.1) * 0.1;
      const finalScale = particle.scale * (1 + wave) * alpha;

      // 매트릭스 업데이트
      dummy.position.copy(particle.position);
      dummy.scale.setScalar(finalScale);
      dummy.rotation.y = time * 0.5 + i;
      dummy.updateMatrix();

      meshRef.current!.setMatrixAt(i, dummy.matrix);

      // 색상 업데이트 (옵션)
      if (meshRef.current!.instanceColor) {
        const hue = (particle.color.getHSL({ h: 0, s: 0, l: 0 }).h + delta * 0.1) % 1;
        particle.color.setHSL(hue, 0.7, 0.8);
        meshRef.current!.setColorAt(i, particle.color);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (!animation.particlesActive) {
    return null;
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      {/* 파티클 지오메트리 */}
      <sphereGeometry args={[0.02, 8, 8]} />

      {/* 파티클 머티리얼 */}
      <meshBasicMaterial
        color="#8b5cf6"
        transparent
        opacity={0.6}
      />
    </instancedMesh>
  );
};