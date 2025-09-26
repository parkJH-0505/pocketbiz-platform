/**
 * useRadarInteraction Hook
 * 3D 레이더 인터랙션 로직 관리
 */

import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector2, Vector3 } from 'three';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface HoverState {
  axis: AxisKey | null;
  position: Vector3 | null;
  distance: number;
}

export const useRadarInteraction = () => {
  const { camera, gl, scene } = useThree();
  const { setSelectedAxis, setHoveredElement, viewState } = useV2Store();

  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());
  const [hoverState, setHoverState] = useState<HoverState>({
    axis: null,
    position: null,
    distance: Infinity
  });

  // 마우스/터치 이벤트 처리
  const handlePointerMove = useCallback((event: PointerEvent) => {
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();

    // 정규화된 좌표 계산 (-1 to 1)
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycaster 업데이트
    raycaster.current.setFromCamera(mouse.current, camera);

    // 교차점 계산
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
      const closest = intersects[0];

      // 축 인터랙션 오브젝트 감지
      if (closest.object.userData?.axis) {
        const axis = closest.object.userData.axis as AxisKey;

        setHoverState({
          axis,
          position: closest.point,
          distance: closest.distance
        });

        setHoveredElement(`axis-${axis}`);

        // 커서 변경
        canvas.style.cursor = 'pointer';
      }
    } else {
      // 호버 해제
      setHoverState({
        axis: null,
        position: null,
        distance: Infinity
      });

      setHoveredElement(null);
      canvas.style.cursor = 'auto';
    }
  }, [camera, gl.domElement, scene.children, setHoveredElement]);

  // 클릭 이벤트 처리
  const handleClick = useCallback((event: PointerEvent) => {
    if (hoverState.axis) {
      setSelectedAxis(hoverState.axis);

      // 햅틱 피드백 (지원되는 경우)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [hoverState.axis, setSelectedAxis]);

  // 이벤트 리스너 등록
  const attachEventListeners = useCallback(() => {
    const canvas = gl.domElement;

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, [gl.domElement, handlePointerMove, handleClick]);

  // 애니메이션 프레임에서 실행
  useFrame(() => {
    // 호버된 축에 대한 추가 처리가 필요하면 여기서
    if (hoverState.axis && hoverState.position) {
      // 예: 호버 상태에 따른 이펙트 업데이트
    }
  });

  return {
    hoverState,
    attachEventListeners,
    isHovered: (axis: AxisKey) => hoverState.axis === axis,
    isSelected: (axis: AxisKey) => viewState.selectedAxis === axis
  };
};