/**
 * DraggableScorePoint Component
 * 드래그 가능한 점수 조정 포인트
 */

import React, { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster } from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface DraggableScorePointProps {
  axis: AxisKey;
  position: Vector3;
  score: number;
  onScoreChange: (axis: AxisKey, newScore: number) => void;
  color: string;
  maxRadius: number;
}

export const DraggableScorePoint: React.FC<DraggableScorePointProps> = ({
  axis,
  position,
  score,
  onScoreChange,
  color,
  maxRadius
}) => {
  const meshRef = useRef<any>();
  const { camera, raycaster, mouse, gl } = useThree();
  const { setSimulationActive, setSimulationAdjustments } = useV2Store();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector3 | null>(null);
  const [originalScore, setOriginalScore] = useState(score);
  const [isHovered, setIsHovered] = useState(false);

  // 스프링 애니메이션 설정
  const { scale, emissive } = useSpring({
    scale: isDragging ? 1.8 : isHovered ? 1.4 : 1.0,
    emissive: isDragging ? 0.3 : isHovered ? 0.1 : 0.0,
    config: {
      tension: 400,
      friction: 30
    }
  });

  // 점수를 거리로 변환
  const scoreToRadius = useCallback((score: number) => {
    return (score / 100) * maxRadius;
  }, [maxRadius]);

  // 거리를 점수로 변환
  const radiusToScore = useCallback((radius: number) => {
    return Math.max(0, Math.min(100, (radius / maxRadius) * 100));
  }, [maxRadius]);

  // 드래그 시작
  const handlePointerDown = useCallback((e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart(e.point.clone());
    setOriginalScore(score);
    setSimulationActive(true);
    gl.domElement.style.cursor = 'grabbing';
  }, [score, setSimulationActive, gl]);

  // 드래그 중
  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging || !dragStart) return;

    e.stopPropagation();

    // 축 중심에서의 거리 계산
    const center = new Vector3(0, 0, 0);
    const distance = e.point.distanceTo(center);

    // 새로운 점수 계산
    const newScore = radiusToScore(distance);

    // 점수 변경 적용
    onScoreChange(axis, newScore);

    // 시뮬레이션 조정값 업데이트
    const adjustment = newScore - originalScore;
    setSimulationAdjustments(axis, adjustment);

  }, [isDragging, dragStart, axis, originalScore, radiusToScore, onScoreChange, setSimulationAdjustments]);

  // 드래그 종료
  const handlePointerUp = useCallback((e: any) => {
    e.stopPropagation();
    setIsDragging(false);
    setDragStart(null);
    gl.domElement.style.cursor = 'default';
  }, [gl]);

  // 호버 효과
  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    setIsHovered(true);
    gl.domElement.style.cursor = isDragging ? 'grabbing' : 'grab';
  }, [isDragging, gl]);

  const handlePointerOut = useCallback((e: any) => {
    e.stopPropagation();
    setIsHovered(false);
    if (!isDragging) {
      gl.domElement.style.cursor = 'default';
    }
  }, [isDragging, gl]);

  // 필요한 경우에만 애니메이션 업데이트
  useFrame(() => {
    // 추가적인 프레임 기반 애니메이션이 필요한 경우 여기에 추가
  });

  return (
    <group>
      {/* 드래그 가능한 점수 포인트 */}
      <animated.mesh
        ref={meshRef}
        position={position}
        scale={scale}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <animated.meshStandardMaterial
          color={color}
          transparent
          opacity={0.9}
          metalness={0.3}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={emissive}
        />
      </animated.mesh>

      {/* 드래그 가이드 링 */}
      {isDragging && (
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[maxRadius - 0.05, maxRadius + 0.05, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
            side={2}
          />
        </mesh>
      )}

      {/* 점수 텍스트 */}
      <mesh position={[position.x, position.y + 0.2, position.z]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial
          color="white"
          transparent
          opacity={isDragging ? 1 : 0.8}
        />
      </mesh>

      {/* 드래그 중 점수 피드백 */}
      {isDragging && (
        <mesh position={[position.x, position.y + 0.4, position.z]}>
          <planeGeometry args={[0.8, 0.15]} />
          <meshBasicMaterial
            color="#4ade80"
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
};