/**
 * usePhaseTransition.ts
 *
 * Stage C-3: Phase Transition React Hook
 * React 컴포넌트에서 Phase Transition 기능을 쉽게 사용할 수 있도록 하는 hook
 */

import { useState, useEffect, useCallback } from 'react';
import { phaseTransitionModule } from '../core/index';
import type { Project, GuideMeetingRecord } from '../types/buildup.types';
import { useBuildupContext } from '../contexts/BuildupContext';

export interface PhaseTransitionStatus {
  isEnabled: boolean;
  moduleState: string;
  engineAvailable: boolean;
  healthy: boolean;
}

export interface UsePhaseTransitionReturn {
  // Status
  status: PhaseTransitionStatus;
  isLoading: boolean;
  error: string | null;

  // Actions
  enablePhaseTransition: () => Promise<void>;
  disablePhaseTransition: () => void;
  triggerMeetingCompleted: (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => Promise<void>;
  requestPhaseChange: (projectId: string, fromPhase: string, toPhase: string, reason: string) => Promise<void>;

  // Project helpers
  canTransitionTo: (project: Project, targetPhase: string) => boolean;
  getAvailableTransitions: (project: Project) => string[];

  // Health check
  refreshStatus: () => Promise<void>;
}

// Phase transition rules - 모든 단계로 전환 가능 (관리자 권한)
const PHASE_TRANSITIONS: Record<string, string[]> = {
  'contract_pending': ['contract_signed', 'planning', 'design', 'execution', 'review', 'completed'],
  'contract_signed': ['contract_pending', 'planning', 'design', 'execution', 'review', 'completed'],
  'planning': ['contract_pending', 'contract_signed', 'design', 'execution', 'review', 'completed'],
  'design': ['contract_pending', 'contract_signed', 'planning', 'execution', 'review', 'completed'],
  'execution': ['contract_pending', 'contract_signed', 'planning', 'design', 'review', 'completed'],
  'review': ['contract_pending', 'contract_signed', 'planning', 'design', 'execution', 'completed'],
  'completed': ['contract_pending', 'contract_signed', 'planning', 'design', 'execution', 'review']
};

export function usePhaseTransition(): UsePhaseTransitionReturn {
  const [status, setStatus] = useState<PhaseTransitionStatus>({
    isEnabled: false,
    moduleState: 'not_loaded',
    engineAvailable: false,
    healthy: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { triggerPhaseTransition, requestManualPhaseTransition } = useBuildupContext();

  // Status 새로고침 함수
  const refreshStatus = useCallback(async () => {
    try {
      const moduleStatus = phaseTransitionModule.getStatus();
      const healthCheck = await phaseTransitionModule.healthCheck();

      setStatus({
        isEnabled: phaseTransitionModule.isAvailable(),
        moduleState: moduleStatus.state,
        engineAvailable: moduleStatus.engineStatus?.enabled || false,
        healthy: healthCheck.healthy
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to refresh phase transition status:', err);
    }
  }, []);

  // 초기 status 로드
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Phase Transition 활성화
  const enablePhaseTransition = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Feature flag 활성화
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', true);
      phaseTransitionModule.updateFeatureFlag('ENABLE_MEETING_TRIGGERS', true);

      // 엔진 활성화
      await phaseTransitionModule.enable();

      // Status 업데이트
      await refreshStatus();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable phase transition';
      setError(errorMessage);
      console.error('Failed to enable phase transition:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus]);

  // Phase Transition 비활성화
  const disablePhaseTransition = useCallback(() => {
    try {
      phaseTransitionModule.updateFeatureFlag('ENABLE_PHASE_TRANSITION_V2', false);
      phaseTransitionModule.disable();

      refreshStatus();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disable phase transition';
      setError(errorMessage);
      console.error('Failed to disable phase transition:', err);
    }
  }, [refreshStatus]);

  // 미팅 완료 트리거
  const triggerMeetingCompleted = useCallback(async (
    projectId: string,
    meetingRecord: GuideMeetingRecord,
    pmId: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await triggerPhaseTransition(projectId, meetingRecord, pmId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger meeting completion';
      setError(errorMessage);
      console.error('Failed to trigger meeting completion:', err);
    } finally {
      setIsLoading(false);
    }
  }, [triggerPhaseTransition]);

  // 수동 단계 전환 요청
  const requestPhaseChange = useCallback(async (
    projectId: string,
    fromPhase: string,
    toPhase: string,
    reason: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      await requestManualPhaseTransition(projectId, fromPhase, toPhase, 'user', reason);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request phase change';
      setError(errorMessage);
      console.error('Failed to request phase change:', err);
    } finally {
      setIsLoading(false);
    }
  }, [requestManualPhaseTransition]);

  // 단계 전환 가능 여부 확인
  const canTransitionTo = useCallback((project: Project, targetPhase: string): boolean => {
    const currentPhase = project.phase || 'contract_pending';
    const availableTransitions = PHASE_TRANSITIONS[currentPhase] || [];
    return availableTransitions.includes(targetPhase);
  }, []);

  // 가능한 단계 전환 목록
  const getAvailableTransitions = useCallback((project: Project): string[] => {
    const currentPhase = project.phase || 'contract_pending';
    return PHASE_TRANSITIONS[currentPhase] || [];
  }, []);

  return {
    status,
    isLoading,
    error,
    enablePhaseTransition,
    disablePhaseTransition,
    triggerMeetingCompleted,
    requestPhaseChange,
    canTransitionTo,
    getAvailableTransitions,
    refreshStatus
  };
}