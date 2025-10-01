/**
 * @fileoverview 애니메이션 컨트롤러
 * @description Phase 2 Step 4: 진입 애니메이션 시퀀스 관리
 * @author PocketCompany
 * @since 2025-01-30
 */

/**
 * 애니메이션 스테이지 정의
 */
export type AnimationStage = 0 | 1 | 2 | 3 | 4;

/**
 * 애니메이션 타이밍 상수
 */
export const ANIMATION_TIMING = {
  // Stage 1: 메인 타임라인 그리기
  TIMELINE_DRAW_DURATION: 800,

  // Stage 2: 단계 노드 페이드인
  PHASE_NODE_DELAY: 200,        // 각 노드 간격
  PHASE_NODE_DURATION: 300,     // 페이드인 시간

  // Stage 3: 브랜치 경로 드로잉
  BRANCH_PATH_DELAY: 50,        // 각 브랜치 간격
  BRANCH_PATH_DURATION: 400,    // 드로잉 시간

  // Stage 4: 활동 노드 등장
  ACTIVITY_NODE_DELAY: 30,      // 각 노드 간격
  ACTIVITY_NODE_DURATION: 200,  // 페이드인 시간
} as const;

/**
 * 애니메이션 스테이지 타이밍 계산
 *
 * @param phaseCount - 단계 노드 개수 (7개)
 * @param activityCount - 활동 노드 개수
 * @returns 각 스테이지 시작 시간 (ms)
 */
export const calculateStageTiming = (phaseCount: number, activityCount: number) => {
  const stage1Start = 0;
  const stage2Start = stage1Start + ANIMATION_TIMING.TIMELINE_DRAW_DURATION;
  const stage3Start = stage2Start + (phaseCount * ANIMATION_TIMING.PHASE_NODE_DELAY);
  const stage4Start = stage3Start + (activityCount * ANIMATION_TIMING.BRANCH_PATH_DELAY);

  return {
    stage1: stage1Start,
    stage2: stage2Start,
    stage3: stage3Start,
    stage4: stage4Start,
    total: stage4Start + (activityCount * ANIMATION_TIMING.ACTIVITY_NODE_DELAY)
  };
};

/**
 * CSS 애니메이션 클래스 생성
 *
 * @param stage - 현재 애니메이션 스테이지
 * @param targetStage - 표시할 타겟 스테이지
 * @param baseClass - 기본 클래스명
 * @returns 애니메이션 클래스 문자열
 */
export const getAnimationClass = (
  stage: AnimationStage,
  targetStage: AnimationStage,
  baseClass: string = ''
): string => {
  const classes = [baseClass];

  if (stage < targetStage) {
    classes.push('opacity-0');
  } else if (stage === targetStage) {
    classes.push('animate-fadeIn');
  } else {
    classes.push('opacity-100');
  }

  return classes.filter(Boolean).join(' ');
};

/**
 * SVG 경로 드로잉 애니메이션 속성
 *
 * @param pathLength - 경로 길이 (px)
 * @param isActive - 애니메이션 활성화 여부
 * @returns SVG 애니메이션 스타일 객체
 */
export const getPathDrawStyle = (pathLength: number, isActive: boolean) => {
  if (!isActive) {
    return {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      opacity: 0
    };
  }

  return {
    strokeDasharray: pathLength,
    strokeDashoffset: 0,
    opacity: 1,
    transition: `stroke-dashoffset ${ANIMATION_TIMING.BRANCH_PATH_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${ANIMATION_TIMING.BRANCH_PATH_DURATION}ms ease`
  };
};

/**
 * 순차 애니메이션 지연 시간 계산
 *
 * @param index - 요소 인덱스
 * @param baseDelay - 기본 지연 시간 (ms)
 * @returns 계산된 지연 시간 (ms)
 */
export const getSequentialDelay = (index: number, baseDelay: number): number => {
  return index * baseDelay;
};