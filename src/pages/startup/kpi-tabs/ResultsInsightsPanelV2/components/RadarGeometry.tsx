/**
 * RadarGeometry Component
 * 5축 레이더 메시 생성 및 관리
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import { Vector3, BufferGeometry } from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useV2Store } from '../store/useV2Store';
import { useRadarInteraction } from '../hooks/useRadarInteraction';
import { axisInfo } from '../utils/mockApi';
import { DraggableScorePoint } from './DraggableScorePoint';
import type { AxisKey } from '../types';

interface RadarGeometryProps {
  scores: Record<AxisKey, number>;
}

export const RadarGeometry: React.FC<RadarGeometryProps> = ({ scores }) => {
  const groupRef = useRef<any>();
  const { viewState, setSelectedAxis, simulation } = useV2Store();
  const { hoverState, attachEventListeners, isHovered, isSelected } = useRadarInteraction();
  const [simulationScores, setSimulationScores] = useState<Record<AxisKey, number>>(scores);

  // 스프링 애니메이션 설정
  const { scale, rotation, opacity } = useSpring({
    scale: hoverState.axis ? 1.05 : simulation.isActive ? 1.02 : 1.0,
    rotation: viewState.selectedAxis ? [0, Math.PI * 2, 0] : [0, 0, 0],
    opacity: simulation.isActive ? 0.9 : 1.0,
    config: {
      tension: 150,
      friction: 20,
      mass: 1
    }
  });

  // 점수 변화에 따른 폴리곤 애니메이션
  const { polygonScale } = useSpring({
    polygonScale: simulation.isActive ? 1.1 : 1.0,
    config: { tension: 200, friction: 25 }
  });

  // 드래그 시뮬레이션용 점수 상태 관리
  useEffect(() => {
    if (!simulation.isActive) {
      setSimulationScores(scores);
    }
  }, [scores, simulation.isActive]);

  // 5각형 레이더 설정
  const AXIS_COUNT = 5;
  const RADIUS = 3;
  const LEVELS = 5; // 5단계 격자

  // 축 위치 계산 (5각형)
  const axisPositions = useMemo(() => {
    const axes = Object.keys(axisInfo) as AxisKey[];
    return axes.map((axis, index) => {
      const angle = (index * 2 * Math.PI) / AXIS_COUNT - Math.PI / 2; // -90도부터 시작
      return {
        axis,
        angle,
        x: Math.cos(angle),
        z: Math.sin(angle), // z축이 깊이
        y: 0
      };
    });
  }, []);

  // 격자선 포인트 계산
  const gridLines = useMemo(() => {
    const lines = [];

    // 동심원 격자 (5개 레벨)
    for (let level = 1; level <= LEVELS; level++) {
      const radius = (RADIUS * level) / LEVELS;
      const points = [];

      for (let i = 0; i <= AXIS_COUNT; i++) {
        const angle = (i * 2 * Math.PI) / AXIS_COUNT - Math.PI / 2;
        points.push(new Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }

      lines.push({
        id: `grid-${level}`,
        points,
        opacity: 0.3 - (level - 1) * 0.05
      });
    }

    // 방사형 격자 (축선)
    axisPositions.forEach((pos, index) => {
      lines.push({
        id: `axis-line-${index}`,
        points: [
          new Vector3(0, 0, 0),
          new Vector3(pos.x * RADIUS, 0, pos.z * RADIUS)
        ],
        opacity: 0.4
      });
    });

    return lines;
  }, [axisPositions]);

  // 점수 폴리곤 포인트 계산 (시뮬레이션 점수 사용)
  const scorePolygon = useMemo(() => {
    const points = axisPositions.map((pos) => {
      const score = simulationScores[pos.axis] || 0;
      const radius = (score / 100) * RADIUS;
      return new Vector3(
        pos.x * radius,
        0,
        pos.z * radius
      );
    });

    // 폴리곤 닫기
    points.push(points[0]);
    return points;
  }, [axisPositions, simulationScores]);

  // 드래그 시뮬레이션 점수 변경 핸들러
  const handleScoreChange = (axis: AxisKey, newScore: number) => {
    setSimulationScores(prev => ({
      ...prev,
      [axis]: newScore
    }));
  };

  // 이벤트 리스너 연결
  useEffect(() => {
    const cleanup = attachEventListeners();
    return cleanup;
  }, [attachEventListeners]);

  // 미세한 회전 애니메이션을 위한 지속적인 프레임 업데이트
  useFrame((state, delta) => {
    if (groupRef.current && viewState.selectedAxis) {
      // 선택된 축이 있을 때 미세한 추가 회전 (스프링과 함께)
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <animated.group
      ref={groupRef}
      scale={scale}
      rotation={rotation}
    >
      {/* 격자선 렌더링 */}
      {gridLines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color="#e5e7eb"
          lineWidth={1}
          transparent
          opacity={line.opacity}
        />
      ))}

      {/* 점수 폴리곤 - 애니메이션 적용 */}
      <animated.group scale={polygonScale}>
        <Line
          points={scorePolygon}
          color="#8b5cf6"
          lineWidth={simulation.isActive ? 5 : 4}
          transparent
          opacity={simulation.isActive ? 0.9 : 0.8}
        />

        {/* 점수 영역 메시 (채우기) */}
        <mesh position={[0, -0.01, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={new Float32Array(
                scorePolygon.slice(0, -1).flatMap(p => [p.x, 0, p.z])
              )}
              count={scorePolygon.length - 1}
              itemSize={3}
            />
          </bufferGeometry>
          <meshBasicMaterial
            color="#8b5cf6"
            transparent
            opacity={simulation.isActive ? 0.3 : 0.2}
            side={2} // DoubleSide
          />
        </mesh>
      </animated.group>

      {/* 축 라벨 및 인터랙션 포인트 */}
      {axisPositions.map((pos, index) => {
        const info = axisInfo[pos.axis];
        const labelPosition = new Vector3(
          pos.x * (RADIUS + 0.5),
          0.2,
          pos.z * (RADIUS + 0.5)
        );

        const score = scores[pos.axis] || 0;

        const currentlyHovered = isHovered(pos.axis);
        const currentlySelected = isSelected(pos.axis);

        // 개별 축 애니메이션
        const axisSpring = useSpring({
          scale: currentlyHovered ? 1.3 : currentlySelected ? 1.2 : 1.0,
          labelScale: currentlyHovered ? 1.1 : 1.0,
          config: { tension: 300, friction: 30 }
        });

        return (
          <animated.group key={pos.axis} scale={axisSpring.scale}>
            {/* 클릭 가능한 축 영역 */}
            <mesh
              position={labelPosition}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAxis(pos.axis);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
              }}
            >
              <circleGeometry args={[0.4, 16]} />
              <meshBasicMaterial
                color={currentlySelected ? info.color : '#ffffff'}
                transparent
                opacity={currentlyHovered ? 0.3 : 0.1}
              />
            </mesh>

            {/* 축 라벨 */}
            <Text
              position={labelPosition}
              fontSize={currentlyHovered ? 0.25 : 0.2}
              color={currentlySelected ? info.color : currentlyHovered ? '#333' : '#666'}
              anchorX="center"
              anchorY="middle"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAxis(pos.axis);
              }}
            >
              {info.label}
            </Text>

            {/* 점수 표시 */}
            <Text
              position={[
                labelPosition.x,
                labelPosition.y - 0.3,
                labelPosition.z
              ]}
              fontSize={currentlyHovered ? 0.18 : 0.15}
              color={info.color}
              anchorX="center"
              anchorY="middle"
            >
              {simulationScores[pos.axis]?.toFixed(1) || score}
            </Text>

            {/* 인터랙션 포인트 (투명한 구) - userData 추가 */}
            <mesh
              position={labelPosition}
              userData={{ axis: pos.axis }}
              scale={currentlyHovered ? [1.2, 1.2, 1.2] : [1, 1, 1]}
            >
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                transparent
                opacity={currentlySelected ? 0.3 : currentlyHovered ? 0.2 : 0.1}
                color={info.color}
              />
            </mesh>

            {/* 글로우 링 (호버 상태) */}
            {currentlyHovered && (
              <mesh position={labelPosition}>
                <ringGeometry args={[0.35, 0.5, 32]} />
                <meshBasicMaterial
                  color={info.color}
                  transparent
                  opacity={0.4}
                  side={2}
                />
              </mesh>
            )}

            {/* 선택 표시 링 */}
            {currentlySelected && (
              <mesh position={labelPosition}>
                <ringGeometry args={[0.25, 0.35, 16]} />
                <meshBasicMaterial
                  color={info.color}
                  transparent
                  opacity={0.8}
                  side={2}
                />
              </mesh>
            )}

            {/* 드래그 가능한 점수 포인트 (시뮬레이션 모드에서만) */}
            {simulation.isActive && (
              <DraggableScorePoint
                axis={pos.axis}
                position={new Vector3(
                  pos.x * ((simulationScores[pos.axis] || 0) / 100) * RADIUS,
                  0.1,
                  pos.z * ((simulationScores[pos.axis] || 0) / 100) * RADIUS
                )}
                score={simulationScores[pos.axis] || 0}
                onScoreChange={handleScoreChange}
                color={info.color}
                maxRadius={RADIUS}
              />
            )}
          </animated.group>
        );
      })}

      {/* 중앙점 - 펄스 애니메이션 */}
      <animated.mesh scale={polygonScale}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial
          color={simulation.isActive ? "#8b5cf6" : "#666"}
          transparent
          opacity={simulation.isActive ? 0.8 : 1.0}
        />
      </animated.mesh>
    </animated.group>
  );
};