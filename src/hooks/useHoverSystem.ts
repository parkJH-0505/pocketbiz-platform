/**
 * @fileoverview Multi-Level Hover System Hook
 * @description 근접성 기반 멀티레벨 호버 상태 관리 시스템
 * @author PocketCompany
 * @since 2025-01-20
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// 타입 정의
// ============================================================================

export type HoverLevel = 'none' | 'proximity' | 'focus' | 'active';

export interface Point {
  x: number;
  y: number;
}

export interface HoverTarget {
  id: string;
  type: 'node' | 'branch' | 'marker' | 'label';
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: any;
  priority?: number;
}

export interface HoverState {
  level: HoverLevel;
  target: HoverTarget | null;
  relatedTargets: HoverTarget[];
  mousePosition: Point;
  proximityTargets: HoverTarget[];
  isTransitioning: boolean;
}

export interface ProximityConfig {
  enabled: boolean;
  radius: number;           // 감지 반경
  minRadius: number;        // 최소 반경
  maxRadius: number;        // 최대 반경
  sensitivity: number;      // 민감도 (0-1)
  debounceTime: number;     // 디바운스 시간
  maxTargets: number;       // 최대 타겟 수
}

export interface HoverSystemConfig {
  proximity: ProximityConfig;
  transitions: {
    duration: number;
    easing: string;
  };
  preview: {
    enabled: boolean;
    delay: number;
    fadeIn: boolean;
  };
  highlighting: {
    enabled: boolean;
    includeRelated: boolean;
    maxDepth: number;
  };
}

// ============================================================================
// 기본 설정
// ============================================================================

const DEFAULT_PROXIMITY_CONFIG: ProximityConfig = {
  enabled: true,
  radius: 100,
  minRadius: 50,
  maxRadius: 200,
  sensitivity: 0.8,
  debounceTime: 50,
  maxTargets: 5
};

const DEFAULT_CONFIG: HoverSystemConfig = {
  proximity: DEFAULT_PROXIMITY_CONFIG,
  transitions: {
    duration: 200,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
  },
  preview: {
    enabled: true,
    delay: 500,
    fadeIn: true
  },
  highlighting: {
    enabled: true,
    includeRelated: true,
    maxDepth: 2
  }
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 두 점 사이의 거리 계산
 */
const calculateDistance = (p1: Point, p2: Point): number => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 점과 사각형 사이의 최단 거리 계산
 */
const calculateDistanceToRect = (
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): number => {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  const dx = Math.max(Math.abs(point.x - centerX) - rect.width / 2, 0);
  const dy = Math.max(Math.abs(point.y - centerY) - rect.height / 2, 0);

  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 점이 사각형 내부에 있는지 확인
 */
const isPointInRect = (
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * 호버 레벨 계산
 */
const calculateHoverLevel = (
  distance: number,
  config: ProximityConfig
): HoverLevel => {
  if (distance === 0) return 'active';
  if (distance <= config.minRadius) return 'focus';
  if (distance <= config.radius) return 'proximity';
  return 'none';
};

/**
 * 근접성 점수 계산 (0-1)
 */
const calculateProximityScore = (
  distance: number,
  config: ProximityConfig
): number => {
  if (distance <= 0) return 1;
  if (distance >= config.radius) return 0;

  const normalized = distance / config.radius;
  return Math.pow(1 - normalized, config.sensitivity);
};

/**
 * 관련 타겟 찾기
 */
const findRelatedTargets = (
  target: HoverTarget,
  allTargets: HoverTarget[],
  maxDepth: number
): HoverTarget[] => {
  const related: HoverTarget[] = [];
  const visited = new Set<string>();

  const findRelatedRecursive = (current: HoverTarget, depth: number) => {
    if (depth > maxDepth || visited.has(current.id)) return;
    visited.add(current.id);

    // 메타데이터 기반 관련성 찾기
    allTargets.forEach(t => {
      if (t.id === current.id) return;

      // 같은 그룹이거나 연결된 요소
      if (
        (current.metadata?.groupId && t.metadata?.groupId === current.metadata.groupId) ||
        (current.metadata?.connectedTo?.includes(t.id)) ||
        (t.metadata?.connectedTo?.includes(current.id))
      ) {
        if (!related.some(r => r.id === t.id)) {
          related.push(t);
          if (depth < maxDepth) {
            findRelatedRecursive(t, depth + 1);
          }
        }
      }
    });
  };

  findRelatedRecursive(target, 0);
  return related;
};

// ============================================================================
// 메인 훅
// ============================================================================

export const useHoverSystem = (
  targets: HoverTarget[] = [],
  config: Partial<HoverSystemConfig> = {}
) => {
  const fullConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config,
    proximity: {
      ...DEFAULT_PROXIMITY_CONFIG,
      ...config.proximity
    }
  }), [config]);

  // ========== 상태 ==========
  const [hoverState, setHoverState] = useState<HoverState>({
    level: 'none',
    target: null,
    relatedTargets: [],
    mousePosition: { x: 0, y: 0 },
    proximityTargets: [],
    isTransitioning: false
  });

  // Refs
  const mousePositionRef = useRef<Point>({ x: 0, y: 0 });
  const debounceTimerRef = useRef<number>();
  const previewTimerRef = useRef<number>();
  const transitionTimerRef = useRef<number>();

  // ========== 근접성 타겟 계산 ==========
  const calculateProximityTargets = useCallback((mousePos: Point): HoverTarget[] => {
    if (!fullConfig.proximity.enabled) return [];

    const proximityMap = new Map<HoverTarget, number>();

    targets.forEach(target => {
      const distance = calculateDistanceToRect(mousePos, target.bounds);

      if (distance <= fullConfig.proximity.radius) {
        const score = calculateProximityScore(distance, fullConfig.proximity);
        proximityMap.set(target, score);
      }
    });

    // 점수 기반 정렬 및 제한
    return Array.from(proximityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, fullConfig.proximity.maxTargets)
      .map(([target]) => target);
  }, [targets, fullConfig.proximity]);

  // ========== 호버 타겟 업데이트 ==========
  const updateHoverTarget = useCallback((mousePos: Point) => {
    mousePositionRef.current = mousePos;

    // 디바운싱
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      // 직접 호버 타겟 찾기
      let directTarget: HoverTarget | null = null;
      let minDistance = Infinity;

      targets.forEach(target => {
        if (isPointInRect(mousePos, target.bounds)) {
          const distance = calculateDistanceToRect(mousePos, target.bounds);
          if (distance < minDistance) {
            minDistance = distance;
            directTarget = target;
          }
        }
      });

      // 근접성 타겟 계산
      const proximityTargets = calculateProximityTargets(mousePos);

      // 호버 레벨 결정
      let level: HoverLevel = 'none';
      if (directTarget) {
        level = 'active';
      } else if (proximityTargets.length > 0) {
        const closestDistance = calculateDistanceToRect(mousePos, proximityTargets[0].bounds);
        level = calculateHoverLevel(closestDistance, fullConfig.proximity);
      }

      // 관련 타겟 찾기
      const relatedTargets = directTarget
        ? findRelatedTargets(
            directTarget,
            targets,
            fullConfig.highlighting.maxDepth
          )
        : [];

      // 상태 업데이트
      setHoverState(prev => ({
        level,
        target: directTarget,
        relatedTargets: fullConfig.highlighting.includeRelated ? relatedTargets : [],
        mousePosition: mousePos,
        proximityTargets,
        isTransitioning: prev.level !== level
      }));

      // 트랜지션 상태 리셋
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      transitionTimerRef.current = window.setTimeout(() => {
        setHoverState(prev => ({ ...prev, isTransitioning: false }));
      }, fullConfig.transitions.duration);

    }, fullConfig.proximity.debounceTime);
  }, [targets, fullConfig, calculateProximityTargets]);

  // ========== 마우스 이동 핸들러 ==========
  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    const mousePos = { x: e.clientX, y: e.clientY };
    updateHoverTarget(mousePos);
  }, [updateHoverTarget]);

  // ========== 마우스 나가기 핸들러 ==========
  const handleMouseLeave = useCallback(() => {
    setHoverState({
      level: 'none',
      target: null,
      relatedTargets: [],
      mousePosition: { x: 0, y: 0 },
      proximityTargets: [],
      isTransitioning: false
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current);
    }
  }, []);

  // ========== 특정 타겟 호버 ==========
  const hoverTarget = useCallback((targetId: string) => {
    const target = targets.find(t => t.id === targetId);
    if (!target) return;

    const relatedTargets = fullConfig.highlighting.includeRelated
      ? findRelatedTargets(target, targets, fullConfig.highlighting.maxDepth)
      : [];

    setHoverState({
      level: 'active',
      target,
      relatedTargets,
      mousePosition: mousePositionRef.current,
      proximityTargets: [],
      isTransitioning: true
    });
  }, [targets, fullConfig.highlighting]);

  // ========== 호버 클리어 ==========
  const clearHover = useCallback(() => {
    handleMouseLeave();
  }, [handleMouseLeave]);

  // ========== 호버 상태 체크 유틸리티 ==========
  const isHovered = useCallback((targetId: string): boolean => {
    return hoverState.target?.id === targetId;
  }, [hoverState.target]);

  const isRelated = useCallback((targetId: string): boolean => {
    return hoverState.relatedTargets.some(t => t.id === targetId);
  }, [hoverState.relatedTargets]);

  const isInProximity = useCallback((targetId: string): boolean => {
    return hoverState.proximityTargets.some(t => t.id === targetId);
  }, [hoverState.proximityTargets]);

  const getHoverLevel = useCallback((targetId: string): HoverLevel => {
    if (isHovered(targetId)) return hoverState.level;
    if (isRelated(targetId)) return 'focus';
    if (isInProximity(targetId)) return 'proximity';
    return 'none';
  }, [hoverState.level, isHovered, isRelated, isInProximity]);

  // ========== 호버 스타일 생성 ==========
  const getHoverStyle = useCallback((targetId: string): React.CSSProperties => {
    const level = getHoverLevel(targetId);
    const baseTransition = `all ${fullConfig.transitions.duration}ms ${fullConfig.transitions.easing}`;

    switch (level) {
      case 'active':
        return {
          transform: 'scale(1.05)',
          opacity: 1,
          filter: 'brightness(1.1)',
          zIndex: 100,
          transition: baseTransition
        };

      case 'focus':
        return {
          transform: 'scale(1.02)',
          opacity: 0.9,
          filter: 'brightness(1.05)',
          zIndex: 50,
          transition: baseTransition
        };

      case 'proximity':
        return {
          opacity: 0.7,
          filter: 'brightness(1)',
          zIndex: 10,
          transition: baseTransition
        };

      default:
        return {
          opacity: 0.5,
          filter: 'brightness(0.95)',
          zIndex: 1,
          transition: baseTransition
        };
    }
  }, [getHoverLevel, fullConfig.transitions]);

  // ========== 정리 ==========
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // ========== 반환 값 ==========
  return {
    // 현재 상태
    hoverState,

    // 핸들러
    handleMouseMove,
    handleMouseLeave,
    hoverTarget,
    clearHover,

    // 상태 체크
    isHovered,
    isRelated,
    isInProximity,
    getHoverLevel,

    // 스타일링
    getHoverStyle,

    // 설정
    config: fullConfig,

    // 유틸리티
    calculateProximityTargets
  };
};