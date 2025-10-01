/**
 * @fileoverview Y좌표 계산 (시간 비례)
 * @description 타임스탬프를 타임라인 Y좌표로 변환
 * @author PocketCompany
 * @since 2025-01-29
 */

import { TIMELINE_CONSTANTS } from '../../../types/timeline-v3.types';

/**
 * 타임스탬프를 Y좌표로 변환
 *
 * @param timestamp 활동 발생 시간
 * @param projectStart 프로젝트 시작 시간
 * @param projectEnd 프로젝트 종료 시간
 * @param canvasHeight 타임라인 캔버스 높이
 * @returns Y좌표 (CANVAS_PADDING_TOP ~ canvasHeight - CANVAS_PADDING_BOTTOM)
 *
 * @example
 * // 프로젝트 중간 지점
 * const y = calculateBranchY(
 *   new Date('2025-02-15'),
 *   new Date('2025-01-01'),
 *   new Date('2025-03-31'),
 *   1000
 * );
 * // y ≈ 500 (중간)
 */
export const calculateBranchY = (
  timestamp: Date,
  projectStart: Date,
  projectEnd: Date,
  canvasHeight: number
): number => {
  const { CANVAS_PADDING_TOP, CANVAS_PADDING_BOTTOM } = TIMELINE_CONSTANTS;

  // Phase 4 Step 2-4: 방어 코드 - canvasHeight가 0이거나 음수인 경우
  if (canvasHeight <= 0) {
    canvasHeight = 800; // 기본값
  }

  // 전체 프로젝트 기간 (밀리초)
  const totalDuration = projectEnd.getTime() - projectStart.getTime();

  // Phase 4: 방어 코드 - totalDuration이 0이거나 음수인 경우
  if (totalDuration <= 0) {
    // 프로젝트 시작과 종료가 같거나 역전된 경우
    return CANVAS_PADDING_TOP + 100; // 기본 위치 반환
  }

  // 시작부터 현재 활동까지 경과 시간 (밀리초)
  const elapsed = timestamp.getTime() - projectStart.getTime();

  // 진행 비율 (0.0 ~ 1.0)
  let ratio = elapsed / totalDuration;

  // Phase 4: 방어 코드 - ratio가 범위를 벗어난 경우
  ratio = Math.max(0, Math.min(1, ratio));

  // 실제 사용 가능한 높이 (상하 여백 제외)
  const usableHeight = canvasHeight - CANVAS_PADDING_TOP - CANVAS_PADDING_BOTTOM;

  // Y좌표 계산 (상단 여백 + 비율 * 사용 가능 높이)
  const rawY = CANVAS_PADDING_TOP + (ratio * usableHeight);

  // 경계값 처리: 최소 상단 여백, 최대 하단 여백 위치
  const clampedY = Math.max(
    CANVAS_PADDING_TOP,
    Math.min(canvasHeight - CANVAS_PADDING_BOTTOM, rawY)
  );

  return clampedY;
};

/**
 * 프로젝트 시간 범위 자동 계산
 * phases가 없거나 날짜가 없는 경우 폴백
 *
 * @param phases 프로젝트 단계 배열
 * @returns { start, end } 프로젝트 시작/종료 시간
 */
export const getProjectTimeRange = (
  phases?: Array<{ startDate?: string | Date; endDate?: string | Date }>
): { start: Date; end: Date } => {
  if (!phases || phases.length === 0) {
    // 폴백: 현재 시간 기준 ±30일
    const now = new Date();
    return {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  // 모든 단계의 시작/종료 날짜 수집
  const dates: Date[] = [];
  phases.forEach(phase => {
    if (phase.startDate) {
      dates.push(new Date(phase.startDate));
    }
    if (phase.endDate) {
      dates.push(new Date(phase.endDate));
    }
  });

  if (dates.length === 0) {
    // 날짜가 하나도 없으면 폴백
    const now = new Date();
    return {
      start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    };
  }

  // 가장 이른 날짜와 가장 늦은 날짜
  const start = new Date(Math.min(...dates.map(d => d.getTime())));
  const end = new Date(Math.max(...dates.map(d => d.getTime())));

  return { start, end };
};