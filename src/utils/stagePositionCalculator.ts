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
  baseStageHeight: 140,  // 기본 높이 약간 증가 (시간 비례 표현을 위해)
  stageSpacing: 30,      // 간격 축소
  topPadding: 120,       // 상단 여백
  bottomPadding: 80,
  minStageHeight: 80,    // 최소 높이 더 축소 (짧은 단계 대응)
  maxStageHeight: 300    // 최대 높이 증가 (긴 단계 대응)
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

    // 실제 시간 기간 계산 (일 단위)
    const stageDurationDays = Math.max(1, Math.round(phaseDuration / (24 * 60 * 60 * 1000)));

    // 미팅 수 기반 높이 조정
    const meetingCount = phaseMeetingCounts[phase] || 0;
    const meetingHeightMultiplier = Math.max(0.8, Math.min(1.5, 1 + (meetingCount - 3) * 0.15));

    // 시간 기반 높이 조정 (새로운 로직)
    const durationHeightMultiplier = calculateDurationHeightMultiplier(stageDurationDays);

    // 결합된 높이 계산 (시간 + 미팅 밀도)
    const combinedMultiplier = (durationHeightMultiplier * 0.7) + (meetingHeightMultiplier * 0.3);
    const baseHeight = finalConfig.baseStageHeight * combinedMultiplier;

    const stageHeight = Math.max(
      finalConfig.minStageHeight,
      Math.min(finalConfig.maxStageHeight, baseHeight)
    );

    // 밀도 계산
    const density = calculateStageDensity(meetingCount);

    // 단계별 시각적 스타일 정보 생성 (밀도 정보 포함)
    const stageVisualStyle = {
      ...calculateStageVisualStyle(phase, phaseStartDate, phaseEndDate),
      densityEnhancements: calculateDensityVisualEnhancements(density, meetingCount)
    };

    // 단계 위치 정보 생성
    stagePositions[phase] = {
      startY: currentY,
      endY: currentY + stageHeight,
      centerY: currentY + stageHeight / 2,
      height: stageHeight,
      startDate: phaseStartDate,
      endDate: phaseEndDate,
      feedCount: meetingCount,
      density,
      visualStyle: stageVisualStyle
    };

    // 단계별 디버그 정보 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📅 ${phase} 기간 분석:`, {
        stageDurationDays,
        durationMultiplier: Math.round(durationHeightMultiplier * 1000) / 1000,
        meetingMultiplier: Math.round(meetingHeightMultiplier * 1000) / 1000,
        combinedMultiplier: Math.round(combinedMultiplier * 1000) / 1000,
        finalHeight: Math.round(stageHeight),
        meetingCount,
        period: `${phaseStartDate.toLocaleDateString()} ~ ${phaseEndDate.toLocaleDateString()}`,
        visualStyle: stageVisualStyle
      });
    }

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
 * 단계 기간에 따른 높이 배수 계산
 */
const calculateDurationHeightMultiplier = (stageDurationDays: number): number => {
  // 기준: 7일(1주) = 1.0 배수
  const baseWeeks = stageDurationDays / 7;

  if (baseWeeks <= 0.5) {
    // 3일 이하: 매우 짧은 단계 (0.6-0.8 배수)
    return 0.6 + (baseWeeks / 0.5) * 0.2;
  } else if (baseWeeks <= 1.0) {
    // 3-7일: 짧은 단계 (0.8-1.0 배수)
    return 0.8 + ((baseWeeks - 0.5) / 0.5) * 0.2;
  } else if (baseWeeks <= 2.0) {
    // 1-2주: 보통 단계 (1.0-1.3 배수)
    return 1.0 + ((baseWeeks - 1.0) / 1.0) * 0.3;
  } else if (baseWeeks <= 4.0) {
    // 2-4주: 긴 단계 (1.3-1.8 배수)
    return 1.3 + ((baseWeeks - 2.0) / 2.0) * 0.5;
  } else {
    // 4주 이상: 매우 긴 단계 (1.8-2.2 배수, 상한선)
    return Math.min(2.2, 1.8 + ((baseWeeks - 4.0) / 4.0) * 0.4);
  }
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
 * 단계별 시각적 스타일 계산
 */
const calculateStageVisualStyle = (
  phase: ProjectPhase,
  startDate: Date,
  endDate: Date
) => {
  const now = new Date();
  const isCompleted = now > endDate;
  const isCurrent = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;

  // 단계별 기본 색상 팔레트
  const phaseColors = {
    contract_pending: { primary: '#F59E0B', secondary: '#FEF3C7', accent: '#D97706' },
    ideation: { primary: '#8B5CF6', secondary: '#EDE9FE', accent: '#7C3AED' },
    research: { primary: '#3B82F6', secondary: '#DBEAFE', accent: '#2563EB' },
    design: { primary: '#10B981', secondary: '#D1FAE5', accent: '#059669' },
    development: { primary: '#EF4444', secondary: '#FEE2E2', accent: '#DC2626' },
    testing: { primary: '#F97316', secondary: '#FED7AA', accent: '#EA580C' },
    deployment: { primary: '#6366F1', secondary: '#E0E7FF', accent: '#4F46E5' },
    maintenance: { primary: '#6B7280', secondary: '#F3F4F6', accent: '#4B5563' }
  };

  const colors = phaseColors[phase] || phaseColors.ideation;

  // 진행률 계산 (현재 시점 기준)
  let progressPercentage = 0;
  if (isCompleted) {
    progressPercentage = 100;
  } else if (isCurrent) {
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    progressPercentage = Math.max(0, Math.min(100, (elapsed / total) * 100));
  }

  return {
    // 상태 기반 스타일
    state: isCompleted ? 'completed' : isCurrent ? 'current' : 'upcoming',

    // 배경 그라데이션
    backgroundColor: isCompleted
      ? `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary}15 100%)`
      : isCurrent
      ? `linear-gradient(135deg, ${colors.primary}08 0%, ${colors.secondary} 50%, ${colors.primary}12 100%)`
      : `linear-gradient(135deg, #F9FAFB 0%, ${colors.secondary}40 100%)`,

    // 경계선 스타일
    borderColor: isCurrent ? colors.primary : colors.secondary,
    borderStyle: isCurrent ? 'solid' : 'dashed',
    borderWidth: isCurrent ? 2 : 1,

    // 진행률 바 스타일
    progressBar: {
      percentage: progressPercentage,
      backgroundColor: colors.primary,
      height: isCurrent ? 4 : 2,
      opacity: isCurrent ? 1.0 : 0.6
    },

    // 단계 라벨 스타일
    label: {
      color: isCompleted ? colors.accent : isCurrent ? colors.primary : '#6B7280',
      fontWeight: isCurrent ? 600 : 400,
      opacity: isCompleted ? 0.8 : 1.0
    },

    // 그림자/글로우 효과
    shadowStyle: isCurrent
      ? `0 0 20px ${colors.primary}20, 0 4px 12px ${colors.primary}15`
      : isCompleted
      ? `0 2px 8px ${colors.secondary}30`
      : 'none',

    // 추가된 시각적 표시기들
    indicators: {
      // 단계 완료 마커
      completionMarker: {
        show: isCompleted,
        icon: '✅',
        color: colors.accent
      },
      // 현재 단계 펄스 효과
      pulseEffect: {
        show: isCurrent,
        color: colors.primary,
        intensity: 'medium'
      },
      // 예정 단계 대기 표시
      waitingIndicator: {
        show: isUpcoming,
        style: 'dashed-outline',
        opacity: 0.5
      },
      // 단계별 아이콘
      phaseIcon: getPhaseIcon(phase),
      // 진행률 텍스트
      progressText: `${Math.round(progressPercentage)}%`
    }
  };
};

/**
 * 프로젝트 단계별 아이콘 매핑
 */
const getPhaseIcon = (phase: ProjectPhase): string => {
  const icons = {
    contract_pending: '📋',
    ideation: '💡',
    research: '🔍',
    design: '🎨',
    development: '⚙️',
    testing: '🧪',
    deployment: '🚀',
    maintenance: '🔧'
  };
  return icons[phase] || '📌';
};

/**
 * 밀도 기반 향상된 시각적 표시기 계산
 */
const calculateDensityVisualEnhancements = (
  density: 'sparse' | 'normal' | 'dense' | 'overcrowded',
  feedCount: number
) => {
  const enhancements = {
    // 밀도별 배경 패턴
    backgroundPattern: 'none',
    // 활동량 표시기
    activityLevel: 'low',
    // 밀도 경고 표시
    densityWarning: false,
    // 높이 조정 힌트
    heightHint: 'normal'
  };

  switch (density) {
    case 'sparse':
      enhancements.backgroundPattern = 'dots';
      enhancements.activityLevel = 'low';
      enhancements.heightHint = 'compact';
      break;

    case 'normal':
      enhancements.backgroundPattern = 'none';
      enhancements.activityLevel = 'normal';
      enhancements.heightHint = 'normal';
      break;

    case 'dense':
      enhancements.backgroundPattern = 'lines';
      enhancements.activityLevel = 'high';
      enhancements.heightHint = 'expanded';
      break;

    case 'overcrowded':
      enhancements.backgroundPattern = 'grid';
      enhancements.activityLevel = 'very-high';
      enhancements.densityWarning = true;
      enhancements.heightHint = 'maximized';
      break;
  }

  return {
    ...enhancements,
    // 활동량 점수 (시각적 표시용)
    activityScore: Math.min(100, feedCount * 12),
    // 밀도 표시 색상
    densityColor: density === 'overcrowded' ? '#EF4444' :
                 density === 'dense' ? '#F59E0B' :
                 density === 'normal' ? '#10B981' : '#6B7280'
  };
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