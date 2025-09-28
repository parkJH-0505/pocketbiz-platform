/**
 * 세로형 프로그레스바 전용 계산 유틸리티
 * Overview Tab Timeline Redesign을 위한 공통 함수
 */

import type { ProjectPhase } from '../types/buildup.types';
import { PHASE_INFO, ALL_PHASES, calculatePhaseProgress, getPhaseIndex } from './projectPhaseUtils';

export interface VerticalProgressData {
  phase: ProjectPhase;
  progress: number;
  phaseIndex: number;
  phaseInfo: typeof PHASE_INFO[ProjectPhase];
  completedPhases: ProjectPhase[];
  currentPhase: ProjectPhase | null;
  upcomingPhases: ProjectPhase[];
}

/**
 * 프로젝트의 전체 진행 상황 계산 (세로 프로그레스바용)
 */
export function calculateVerticalProgress(currentPhase: ProjectPhase): VerticalProgressData {
  const progress = calculatePhaseProgress(currentPhase);
  const phaseIndex = getPhaseIndex(currentPhase);
  const phaseInfo = PHASE_INFO[currentPhase];

  // 완료된 단계들
  const completedPhases = ALL_PHASES.slice(0, phaseIndex);

  // 현재 진행중인 단계
  const currentPhaseValue = currentPhase;

  // 예정된 단계들
  const upcomingPhases = ALL_PHASES.slice(phaseIndex + 1);

  return {
    phase: currentPhase,
    progress,
    phaseIndex,
    phaseInfo,
    completedPhases,
    currentPhase: currentPhaseValue,
    upcomingPhases
  };
}

/**
 * 각 단계의 상태 결정 (완료/진행중/예정)
 */
export function getPhaseStatus(
  phase: ProjectPhase,
  currentPhase: ProjectPhase
): 'completed' | 'current' | 'upcoming' {
  const currentIndex = getPhaseIndex(currentPhase);
  const phaseIndex = getPhaseIndex(phase);

  if (phaseIndex < currentIndex) return 'completed';
  if (phaseIndex === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * D-Day 계산 (프로젝트 예상 완료일)
 */
export function calculateDDay(
  currentPhase: ProjectPhase,
  startDate: Date = new Date()
): { dDay: number; estimatedEndDate: Date } {
  const phaseIndex = getPhaseIndex(currentPhase);
  const remainingPhases = ALL_PHASES.slice(phaseIndex);

  // 각 단계별 예상 소요 시간 (일)
  const phaseDurations: Record<ProjectPhase, number> = {
    contract_pending: 3,
    contract_signed: 1,
    planning: 5,
    design: 7,
    execution: 14,
    review: 3,
    completed: 0
  };

  // 남은 일수 계산
  const dDay = remainingPhases.reduce((total, phase) => {
    return total + phaseDurations[phase];
  }, 0);

  // 예상 완료일
  const estimatedEndDate = new Date(startDate);
  estimatedEndDate.setDate(estimatedEndDate.getDate() + dDay);

  return { dDay, estimatedEndDate };
}

/**
 * 진행률 색상 결정
 */
export function getProgressColor(progress: number): string {
  if (progress < 30) return 'bg-gray-500';
  if (progress < 50) return 'bg-blue-500';
  if (progress < 70) return 'bg-indigo-500';
  if (progress < 90) return 'bg-purple-500';
  if (progress < 100) return 'bg-green-500';
  return 'bg-gray-500';
}

/**
 * 단계별 노드 스타일
 */
export function getNodeStyle(status: 'completed' | 'current' | 'upcoming') {
  switch (status) {
    case 'completed':
      return {
        icon: '✅',
        bgColor: 'bg-green-500',
        borderColor: 'border-green-600',
        textColor: 'text-green-700',
        animation: ''
      };
    case 'current':
      return {
        icon: '🔵',
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-600',
        textColor: 'text-blue-700',
        animation: 'animate-pulse'
      };
    case 'upcoming':
      return {
        icon: '⭕',
        bgColor: 'bg-gray-200',
        borderColor: 'border-gray-300',
        textColor: 'text-gray-500',
        animation: ''
      };
  }
}

/**
 * 연결선 스타일 결정
 */
export function getConnectionLineStyle(
  fromPhase: ProjectPhase,
  toPhase: ProjectPhase,
  currentPhase: ProjectPhase
): { type: 'solid' | 'gradient' | 'dashed'; color: string; width: string } {
  const fromStatus = getPhaseStatus(fromPhase, currentPhase);
  const toStatus = getPhaseStatus(toPhase, currentPhase);

  if (fromStatus === 'completed' && toStatus === 'completed') {
    return { type: 'solid', color: 'bg-green-500', width: 'w-1' };
  }

  if (fromStatus === 'completed' && toStatus === 'current') {
    return { type: 'gradient', color: 'bg-gradient-to-b from-green-500 to-blue-500', width: 'w-1' };
  }

  if (fromStatus === 'current' && toStatus === 'upcoming') {
    return { type: 'dashed', color: 'bg-gray-300', width: 'w-0.5' };
  }

  return { type: 'dashed', color: 'bg-gray-200', width: 'w-0.5' };
}

/**
 * 브랜치 연결점 위치 계산 (나중에 피드를 붙일 위치)
 */
export function calculateBranchPoint(
  phaseIndex: number,
  totalPhases: number = 7
): { x: number; y: number } {
  const nodeHeight = 120; // 각 노드의 높이 (px)
  const nodeSpacing = 80; // 노드 간 간격 (px)
  const topMargin = 100; // 상단 여백 (원형 프로그레스 공간)

  const y = topMargin + (phaseIndex * (nodeHeight + nodeSpacing)) + (nodeHeight / 2);
  const x = 60; // 노드의 오른쪽 끝 위치

  return { x, y };
}