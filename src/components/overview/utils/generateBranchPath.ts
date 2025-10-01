/**
 * @fileoverview 브랜치 경로 생성 유틸리티
 * @description Phase 2 Step 2: 3차 베지어 곡선 생성
 * @author PocketCompany
 * @since 2025-01-30
 */

/**
 * 3차 베지어 곡선 경로 생성
 *
 * 부드러운 S자 곡선을 생성하여 Git 스타일 브랜치 표현
 *
 * @param startX - 시작 X 좌표 (메인 타임라인, 일반적으로 32px)
 * @param startY - 시작 Y 좌표 (브랜치 Y 위치)
 * @param endX - 종료 X 좌표 (활동 노드 위치, 280~480px)
 * @param endY - 종료 Y 좌표 (브랜치 Y 위치, 일반적으로 startY와 동일)
 * @param laneIndex - 레인 인덱스 (0, 1, 2) - Phase 5 Step 2
 * @returns SVG path 문자열
 *
 * @example
 * const path = generateBranchPath(32, 150, 280, 150, 0);
 * // 레인 0: 가장 위로 굽어진 아치형
 */
export const generateBranchPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  laneIndex: number = 0
): string => {
  const distance = endX - startX;

  // Phase 5 Step 3: 동적 아치 높이 (수평 거리에 비례)
  // 브랜치가 길수록 더 크게 굽어지고, 짧으면 작게 굽어짐
  const baseArchRatio = 0.25; // 수평 거리의 25%
  const laneMultipliers = [1.0, 0.6, 0.2]; // 레인별 승수
  const dynamicHeight = Math.abs(distance) * baseArchRatio * (laneMultipliers[laneIndex] || 1.0);

  // 최소/최대 클램핑 (너무 작거나 크지 않도록)
  const minArchHeight = 15;
  const maxArchHeights = [80, 50, 20]; // 레인별 최대값
  const clampedHeight = Math.max(
    minArchHeight,
    Math.min(maxArchHeights[laneIndex] || 80, dynamicHeight)
  );

  const archOffset = -clampedHeight; // 음수 = 위로 굽힘

  // 제어점 계산 (30%, 70% 지점에서 아치형 곡선 생성)
  const cp1x = startX + distance * 0.3;  // 첫 번째 제어점 X (30% 지점)
  const cp1y = startY + archOffset;      // 첫 번째 제어점 Y (위로 굽힘)
  const cp2x = startX + distance * 0.7;  // 두 번째 제어점 X (70% 지점)
  const cp2y = endY + archOffset;        // 두 번째 제어점 Y (위로 굽힘)

  // SVG path 명령어: M (moveTo) C (cubicBezierCurve)
  return `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
};

/**
 * 브랜치 경로 길이 계산 (근사값)
 *
 * 베지어 곡선의 정확한 길이는 적분 필요하지만,
 * 직선 거리의 1.05배로 근사
 *
 * @param startX - 시작 X
 * @param startY - 시작 Y
 * @param endX - 종료 X
 * @param endY - 종료 Y
 * @returns 경로 길이 (px)
 */
export const calculatePathLength = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): number => {
  const dx = endX - startX;
  const dy = endY - startY;
  const straightDistance = Math.sqrt(dx * dx + dy * dy);

  // 베지어 곡선은 직선보다 약간 김 (약 5%)
  return straightDistance * 1.05;
};

/**
 * 브랜치 중간 지점 좌표 계산
 *
 * t=0.5 (50% 지점)에서의 베지어 곡선 좌표
 * 툴팁이나 레이블 배치에 사용
 *
 * @param startX - 시작 X
 * @param startY - 시작 Y
 * @param endX - 종료 X
 * @param endY - 종료 Y
 * @returns 중간 지점 좌표 {x, y}
 */
export const getBranchMidpoint = (
  startX: number,
  startY: number,
  endX: number,
  endY: number
): { x: number; y: number } => {
  const distance = endX - startX;
  const cp1x = startX + distance * 0.3;
  const cp1y = startY;
  const cp2x = startX + distance * 0.7;
  const cp2y = endY;

  const t = 0.5; // 50% 지점

  // 3차 베지어 곡선 공식: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * startX + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * endX;
  const y = mt3 * startY + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * endY;

  return { x, y };
};