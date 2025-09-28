/**
 * @fileoverview 단계 위치 계산 유틸리티
 * @description VerticalProgressBar의 단계 정보를 브랜치 레이아웃 시스템과 연동
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from '../types/buildup.types';
import type { Project } from '../types/buildup.types';
import type { StagePosition } from '../types/branch-timeline.types';
import type { BuildupProjectMeeting } from '../types/schedule.types';
import { ALL_PHASES } from './projectPhaseUtils';

interface StageCalculationConfig {
  /** 각 단계의 기본 높이 */
  baseStageHeight: number;
  /** 단계 간 간격 */
  stageSpacing: number;
  /** 상단 여백 */
  topPadding: number;
  /** 하단 여백 */
  bottomPadding: number;
  /** 최소 단계 높이 */
  minStageHeight: number;
  /** 최대 단계 높이 */
  maxStageHeight: number;
}

const DEFAULT_CONFIG: StageCalculationConfig = {
  baseStageHeight: 240,
  stageSpacing: 100,
  topPadding: 80,
  bottomPadding: 80,
  minStageHeight: 180,
  maxStageHeight: 400
};

/**
 * 프로젝트와 미팅 정보를 기반으로 단계별 위치 정보 계산
 */
export const calculateStagePositions = (
  project: Project,
  meetings: BuildupProjectMeeting[],
  config: Partial<StageCalculationConfig> = {}
): Record<ProjectPhase, StagePosition> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const stagePositions: Record<ProjectPhase, StagePosition> = {} as Record<ProjectPhase, StagePosition>;

  // 프로젝트 전체 기간 계산
  const projectStartDate = new Date(project.timeline?.start_date || project.contract?.start_date || new Date());
  const projectEndDate = new Date(project.timeline?.end_date || project.contract?.end_date || new Date());
  const totalProjectDuration = projectEndDate.getTime() - projectStartDate.getTime();

  // 각 단계의 시간 비율 계산 (기본값 설정)
  const phaseTimeRatios = calculatePhaseTimeRatios(project, meetings);

  // 각 단계별 미팅 수 기반 높이 조정
  const phaseMeetingCounts = calculatePhaseMeetingCounts(meetings);

  let currentY = finalConfig.topPadding;

  ALL_PHASES.forEach((phase, index) => {
    // 시간 기반 단계 기간 계산
    const phaseDuration = totalProjectDuration * phaseTimeRatios[phase];
    const phaseStartDate = new Date(projectStartDate.getTime() +
      totalProjectDuration * getPhaseCumulativeRatio(phase, phaseTimeRatios));
    const phaseEndDate = new Date(phaseStartDate.getTime() + phaseDuration);

    // 미팅 수 기반 높이 조정
    const meetingCount = phaseMeetingCounts[phase] || 0;
    const heightMultiplier = Math.max(0.7, Math.min(2.0, 1 + (meetingCount - 2) * 0.2));

    const baseHeight = finalConfig.baseStageHeight * heightMultiplier;
    const stageHeight = Math.max(
      finalConfig.minStageHeight,
      Math.min(finalConfig.maxStageHeight, baseHeight)
    );

    // 밀도 계산
    const density = calculateStageDensity(meetingCount);

    // 단계 위치 정보 생성
    stagePositions[phase] = {
      startY: currentY,
      endY: currentY + stageHeight,
      centerY: currentY + stageHeight / 2,
      height: stageHeight,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      feedCount: meetingCount,
      density
    };

    // 다음 단계를 위해 Y 위치 업데이트
    currentY += stageHeight + finalConfig.stageSpacing;
  });

  return stagePositions;
};

/**
 * 각 단계의 시간 비율 계산
 */
const calculatePhaseTimeRatios = (
  project: Project,
  meetings: BuildupProjectMeeting[]
): Record<ProjectPhase, number> => {
  // 기본 비율 (균등 분배)
  const defaultRatio = 1 / ALL_PHASES.length;

  // 실제 미팅 데이터가 있는 경우 더 정교한 계산 가능
  // 현재는 기본 비율 사용
  const ratios: Record<ProjectPhase, number> = {} as Record<ProjectPhase, number>;

  ALL_PHASES.forEach(phase => {
    ratios[phase] = defaultRatio;
  });

  // 프로젝트 현재 단계 기준 조정
  const currentPhase = project.phase || 'contract_pending';
  const currentPhaseIndex = ALL_PHASES.indexOf(currentPhase);

  // 완료된 단계는 약간 축소, 현재 및 미래 단계는 확대
  ALL_PHASES.forEach((phase, index) => {
    if (index < currentPhaseIndex) {
      ratios[phase] *= 0.8; // 완료된 단계 축소
    } else if (index === currentPhaseIndex) {
      ratios[phase] *= 1.3; // 현재 단계 확대
    } else {
      ratios[phase] *= 1.1; // 미래 단계 약간 확대
    }
  });

  // 비율 정규화
  const totalRatio = Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0);
  Object.keys(ratios).forEach(phase => {
    ratios[phase as ProjectPhase] /= totalRatio;
  });

  return ratios;
};

/**
 * 특정 단계까지의 누적 시간 비율 계산
 */
const getPhaseCumulativeRatio = (
  targetPhase: ProjectPhase,
  phaseRatios: Record<ProjectPhase, number>
): number => {
  let cumulativeRatio = 0;

  for (const phase of ALL_PHASES) {
    if (phase === targetPhase) break;
    cumulativeRatio += phaseRatios[phase];
  }

  return cumulativeRatio;
};

/**
 * 각 단계별 미팅 수 계산
 */
const calculatePhaseMeetingCounts = (
  meetings: BuildupProjectMeeting[]
): Record<ProjectPhase, number> => {
  const counts: Record<ProjectPhase, number> = {} as Record<ProjectPhase, number>;

  // 초기화
  ALL_PHASES.forEach(phase => {
    counts[phase] = 0;
  });

  // 미팅을 단계별로 분류
  meetings.forEach(meeting => {
    if (meeting.phase && counts[meeting.phase] !== undefined) {
      counts[meeting.phase]++;
    }
  });

  return counts;
};

/**
 * 단계별 밀도 레벨 계산
 */
const calculateStageDensity = (
  feedCount: number
): 'sparse' | 'normal' | 'dense' | 'overcrowded' => {
  if (feedCount <= 2) return 'sparse';
  if (feedCount <= 5) return 'normal';
  if (feedCount <= 8) return 'dense';
  return 'overcrowded';
};

/**
 * 단계 위치를 기반으로 Y 좌표에서 해당 단계 찾기
 */
export const findStageAtPosition = (
  y: number,
  stagePositions: Record<ProjectPhase, StagePosition>
): ProjectPhase | null => {
  for (const [phase, position] of Object.entries(stagePositions)) {
    if (y >= position.startY && y <= position.endY) {
      return phase as ProjectPhase;
    }
  }
  return null;
};

/**
 * 단계 내에서의 상대적 위치 계산 (0.0 ~ 1.0)
 */
export const calculateRelativePositionInStage = (
  y: number,
  stagePosition: StagePosition
): number => {
  if (y < stagePosition.startY) return 0;
  if (y > stagePosition.endY) return 1;

  return (y - stagePosition.startY) / stagePosition.height;
};

/**
 * 시간 기반 Y 위치 계산
 */
export const calculateTimeBasedY = (
  timestamp: Date,
  stagePosition: StagePosition
): number => {
  const stageStart = stagePosition.startDate.getTime();
  const stageEnd = stagePosition.endDate.getTime();
  const targetTime = timestamp.getTime();

  // 시간 진행률 계산
  const timeProgress = (targetTime - stageStart) / (stageEnd - stageStart);

  // 안전한 범위로 클램핑 (0.05 ~ 0.95)
  const clampedProgress = Math.max(0.05, Math.min(0.95, timeProgress));

  // Y 위치 계산
  return stagePosition.startY + (stagePosition.height * clampedProgress);
};

/**
 * 단계별 총 높이 계산
 */
export const calculateTotalTimelineHeight = (
  stagePositions: Record<ProjectPhase, StagePosition>,
  config: Partial<StageCalculationConfig> = {}
): number => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const stages = Object.values(stagePositions);
  if (stages.length === 0) return 0;

  const maxY = Math.max(...stages.map(stage => stage.endY));
  return maxY + finalConfig.bottomPadding;
};

/**
 * 디버그용 단계 정보 출력
 */
export const debugStagePositions = (
  stagePositions: Record<ProjectPhase, StagePosition>
): void => {
  if (process.env.NODE_ENV !== 'development') return;

  console.group('🎯 Stage Positions Debug');

  Object.entries(stagePositions).forEach(([phase, position]) => {
    console.log(`📍 ${phase}:`, {
      Y: `${Math.round(position.startY)} → ${Math.round(position.endY)} (${Math.round(position.height)}px)`,
      Time: `${position.startDate.toLocaleDateString()} → ${position.endDate.toLocaleDateString()}`,
      Feeds: position.feedCount,
      Density: position.density
    });
  });

  const totalHeight = calculateTotalTimelineHeight(stagePositions);
  console.log(`📏 Total Height: ${Math.round(totalHeight)}px`);

  console.groupEnd();
};