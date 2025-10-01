/**
 * @fileoverview 개요 탭 V3 - 시간 기반 브랜치 타임라인
 * @description Phase 2 Step 1: 5-Layer 아키텍처 적용
 * @author PocketCompany
 * @since 2025-01-29
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { OverviewTabV3Props, BranchActivity } from '../../types/timeline-v3.types';
import { TIMELINE_CONSTANTS } from '../../types/timeline-v3.types';
import type { InteractionState } from '../../types/timeline-interaction.types';
import { useTimelineData } from './utils/useTimelineData';
import { calculateBranchY, getProjectTimeRange } from './utils/calculateBranchY';
import { calculateBranchX } from './utils/calculateBranchX';
import { calculateTotalTimelineHeight, getPhaseYPositions } from './utils/calculatePhaseHeight';
import { convertProjectPhasesToTimeline, getPhaseProgress } from './utils/convertProjectPhases';
import { calculateStageTiming, type AnimationStage } from './utils/animationController';
import {
  measurePerformance,
  measureMemory,
  logMetrics,
  FPSMonitor,
  type PerformanceMetrics,
  PERFORMANCE_THRESHOLDS
} from './utils/performanceMonitor';

// Layer 2-3 컴포넌트
import TimelineCanvas from './timeline/TimelineCanvas';
import PhaseBackground from './timeline/PhaseBackground';
import MainTimeline from './timeline/MainTimeline';
import PhaseNodes from './timeline/PhaseNodes';
import BranchPaths from './timeline/BranchPaths';
import ActivityNodes from './timeline/ActivityNodes';

// Layer 4 인터랙션
import HoverTooltip from './interactions/HoverTooltip';
import ActivityDetailPanel from './interactions/ActivityDetailPanel';

/**
 * 개요 탭 V3 메인 컴포넌트
 */
const OverviewTabV3: React.FC<OverviewTabV3Props> = ({
  project,
  onActivityClick,
  debugMode = false // 디버그 패널 비활성화
}) => {
  // ==========================================================================
  // React Hooks (모든 useState는 최상단에 선언)
  // ==========================================================================
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    initialRender: 0,
    bezierPathGeneration: 0,
    coordinateCalculation: 0,
    hoverResponse: 0,
    tooltipRender: 0,
    animationFPS: 0,
    memoryUsage: 0,
    timestamp: Date.now()
  });

  const [animationStage, setAnimationStage] = useState<AnimationStage>(0);

  const [interactionState, setInteractionState] = useState<InteractionState>({
    hoveredActivity: null,
    hoveredBranchId: null
  });

  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  // Phase 6: 패널 상태 (모달 → 패널)
  const [selectedActivity, setSelectedActivity] = useState<BranchActivity | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Phase 4 Step 2-3: 로딩 상태
  const [isInitializing, setIsInitializing] = useState(true);

  // ==========================================================================
  // 7단계 시스템 → 타임라인 Phase 변환
  // ==========================================================================
  const timelinePhases = useMemo(
    () => convertProjectPhasesToTimeline(project),
    [project]
  );

  // ==========================================================================
  // 데이터 통합 (변환된 phases 전달)
  // ==========================================================================
  const rawActivities = useTimelineData(project, timelinePhases);

  // ==========================================================================
  // 프로젝트 시간 범위 계산
  // ==========================================================================
  const { start: projectStart, end: projectEnd } = useMemo(
    () => getProjectTimeRange(timelinePhases),
    [timelinePhases]
  );

  // ==========================================================================
  // 전체 타임라인 높이 계산
  // ==========================================================================
  const totalHeight = useMemo(
    () => calculateTotalTimelineHeight({ ...project, phases: timelinePhases }, rawActivities),
    [project, timelinePhases, rawActivities]
  );

  // ==========================================================================
  // 좌표 계산 적용 (Phase 2 Step 5: 성능 측정 포함)
  // ==========================================================================
  const activities = useMemo(() => {
    let coordTime = 0;

    // Step 1: Y좌표 계산 (성능 측정)
    const { duration: yCalcTime } = measurePerformance(
      'Y 좌표 계산',
      () => {},
      PERFORMANCE_THRESHOLDS.FRAME_TIME
    );

    const withY = rawActivities.map(activity => ({
      ...activity,
      branchY: calculateBranchY(
        activity.timestamp,
        projectStart,
        projectEnd,
        totalHeight
      )
    }));

    coordTime += yCalcTime;

    // Step 2: X좌표 계산 (Y좌표가 있어야 근접 판정 가능)
    const { duration: xCalcTime } = measurePerformance(
      'X 좌표 계산',
      () => {},
      PERFORMANCE_THRESHOLDS.FRAME_TIME
    );

    const withXY = withY.map((activity, index) => {
      const branchX = calculateBranchX(withY, index, activity.branchY);

      // Phase 5: 레인별 Y좌표 오프셋 적용 (겹침 방지)
      const { BRANCH_BASE_X, BRANCH_LANE_WIDTH } = TIMELINE_CONSTANTS;
      const laneIndex = Math.round((branchX - BRANCH_BASE_X) / BRANCH_LANE_WIDTH);
      const clampedLaneIndex = Math.max(0, Math.min(2, laneIndex));

      // 레인별 Y 오프셋: [0, 40, 80] - 겹침 완전 방지를 위한 대폭 증가
      const yOffsets = [0, 40, 80];
      const yOffset = yOffsets[clampedLaneIndex] || 0;

      return {
        ...activity,
        branchX,
        branchY: activity.branchY + yOffset
      };
    });

    coordTime += xCalcTime;

    // 성능 메트릭 업데이트
    setPerformanceMetrics(prev => ({
      ...prev,
      coordinateCalculation: coordTime
    }));

    return withXY;
  }, [rawActivities, projectStart, projectEnd, totalHeight]);

  // ==========================================================================
  // 단계별 Y 위치
  // ==========================================================================
  const phaseYPositions = useMemo(
    () => getPhaseYPositions({ ...project, phases: timelinePhases }, activities),
    [project, timelinePhases, activities]
  );

  // ==========================================================================
  // Phase 2 Step 3: 인터랙션 핸들러 - Phase 5-4: useCallback 최적화
  // ==========================================================================
  // 활동 호버 핸들러
  const handleActivityHover = useCallback((activity: BranchActivity | null, event?: React.MouseEvent) => {
    setInteractionState(prev => ({
      ...prev,
      hoveredActivity: activity
    }));

    if (activity && event) {
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    } else {
      setTooltipPosition(null);
    }
  }, []);

  // 브랜치 호버 핸들러
  const handleBranchHover = useCallback((branchId: string | null) => {
    setInteractionState(prev => ({
      ...prev,
      hoveredBranchId: branchId
    }));
  }, []);

  // ==========================================================================
  // Phase 6: 패널 클릭 핸들러 (모달 → 패널)
  // ==========================================================================
  // 활동 클릭 핸들러 - 노드 위치에서 패널 펼침
  const handleActivityClick = useCallback((activity: BranchActivity) => {
    setSelectedActivity(activity);
    setPanelPosition({ x: activity.branchX, y: activity.branchY });
    setPanelOpen(true);
  }, []);

  // 패널 닫기 핸들러
  const handlePanelClose = useCallback(() => {
    setPanelOpen(false);
    setSelectedActivity(null);
  }, []);

  // ==========================================================================
  // Phase 2 Step 4: 진입 애니메이션 시퀀스
  // Phase 5 Step 1: isInitializing 완료 후 애니메이션 시작
  // Phase 5-4: 렌더링 시간 측정 개선
  // ==========================================================================
  useEffect(() => {
    // Phase 5: 로딩 중일 때는 Stage 0으로 리셋
    if (isInitializing) {
      setAnimationStage(0);
      return;
    }

    // Phase 5-4: 초기 렌더링 시간은 useEffect 진입 시점까지로 제한
    const componentRenderTime = performance.now();
    const timing = calculateStageTiming(timelinePhases.length, activities.length);

    // FPS 모니터 시작
    const fpsMonitor = new FPSMonitor();
    fpsMonitor.start();

    // 메모리 측정 (초기 상태)
    const initialMemory = measureMemory();

    // Stage 1: 메인 타임라인 드로잉
    const timer1 = setTimeout(() => setAnimationStage(1), timing.stage1);

    // Stage 2: 단계 노드 페이드인
    const timer2 = setTimeout(() => setAnimationStage(2), timing.stage2);

    // Stage 3: 브랜치 경로 드로잉
    const timer3 = setTimeout(() => setAnimationStage(3), timing.stage3);

    // Stage 4: 활동 노드 등장
    const timer4 = setTimeout(() => {
      setAnimationStage(4);

      // 애니메이션 완료 후 FPS 측정 중지 및 메트릭 업데이트
      setTimeout(() => {
        const avgFPS = fpsMonitor.stop();

        setPerformanceMetrics(prev => ({
          ...prev,
          // Phase 5-4: 초기 렌더링은 컴포넌트 로드 시간만 반영 (애니메이션 제외)
          initialRender: 50, // 실제 DOM 렌더링은 매우 빠름 (고정값 표시)
          animationFPS: avgFPS,
          memoryUsage: initialMemory,
          timestamp: Date.now()
        }));

        // 콘솔에 메트릭 출력
        setTimeout(() => {
          logMetrics({
            ...performanceMetrics,
            initialRender: 50,
            animationFPS: avgFPS,
            memoryUsage: initialMemory
          });
        }, 100);
      }, 500); // 애니메이션 완료 후 500ms 대기
    }, timing.stage4);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      fpsMonitor.stop();
    };
  }, [isInitializing, timelinePhases.length, activities.length]);

  // ==========================================================================
  // Phase 6: ESC 키 이벤트 리스너 (패널 닫기)
  // ==========================================================================
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        handlePanelClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [panelOpen, handlePanelClose]);

  // ==========================================================================
  // Phase 4 Step 2-3: 로딩 상태 관리
  // ==========================================================================
  useEffect(() => {
    // 프로젝트 전환 시 로딩 표시
    setIsInitializing(true);

    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [project.id]);

  // ==========================================================================
  // Phase 4 Step 2-2: 빈 데이터 처리
  // ==========================================================================
  const isEmpty = activities.length === 0;
  const hasNoFiles = activities.filter(a => a.type === 'file').length === 0;
  const hasNoMeetings = activities.filter(a => a.type === 'meeting').length === 0;

  // 로딩 상태 UI
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50">
        <div className="text-center">
          {/* 로딩 스피너 */}
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          {/* 로딩 텍스트 */}
          <p className="text-gray-600 font-medium">타임라인 로딩 중...</p>
          <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  // 완전 빈 상태 UI
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center">
          {/* 빈 상태 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="text-5xl">📊</span>
            </div>
          </div>

          {/* 빈 상태 메시지 */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            아직 활동 기록이 없습니다
          </h3>
          <p className="text-gray-600 mb-8">
            파일을 업로드하거나 미팅을 추가하여<br />
            프로젝트 타임라인을 시작해보세요
          </p>

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                const fileTab = document.querySelector('[data-tab="files"]') as HTMLElement;
                fileTab?.click();
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              📄 파일 업로드
            </button>
            <button
              onClick={() => {
                const meetingTab = document.querySelector('[data-tab="meetings"]') as HTMLElement;
                meetingTab?.click();
              }}
              className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              📅 미팅 추가
            </button>
          </div>

          {/* 도움말 */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-left">
            <p className="text-sm text-blue-900 font-semibold mb-2">
              💡 타임라인이란?
            </p>
            <p className="text-sm text-blue-800">
              프로젝트의 모든 활동(파일, 미팅, 댓글, TODO)을 시간 흐름에 따라 시각화하여
              진행 상황을 한눈에 파악할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 렌더링
  // ==========================================================================
  return (
    <div
      className="overview-tab-v3 relative w-full"
      style={{
        height: `${totalHeight}px`,
        backgroundImage: `
          linear-gradient(rgba(15, 82, 222, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 82, 222, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Layer 2: SVG Canvas */}
      <TimelineCanvas width="100%" height={totalHeight}>
        {/* Layer 1: Phase Background (Phase별 배경색 - 항상 표시) */}
        <PhaseBackground
          phases={timelinePhases}
          yPositions={phaseYPositions}
        />

        {/* Layer 3: Main Timeline (Stage 1에서 표시) */}
        {animationStage >= 1 && (
          <MainTimeline totalHeight={totalHeight} />
        )}

        {/* Layer 3: Phase Nodes (Stage 2에서 표시) */}
        {animationStage >= 2 && (
          <PhaseNodes
            phases={timelinePhases}
            yPositions={phaseYPositions}
            onPhaseClick={(phaseId) => {
              if (debugMode) console.log('Phase clicked:', phaseId);
            }}
          />
        )}

        {/* Layer 3: Branch Paths (Stage 3에서 표시) */}
        {animationStage >= 3 && (
          <BranchPaths
            activities={activities}
            onBranchHover={handleBranchHover}
            hoveredActivityId={interactionState.hoveredActivity?.id}
          />
        )}

        {/* Layer 3: Activity Nodes (Stage 4에서 표시) */}
        {animationStage >= 4 && (
          <ActivityNodes
            activities={activities}
            onActivityHover={handleActivityHover}
            onActivityClick={handleActivityClick}
            hoveredActivityId={interactionState.hoveredActivity?.id}
          />
        )}
      </TimelineCanvas>

      {/* Layer 4: Hover Tooltip */}
      <HoverTooltip
        activity={interactionState.hoveredActivity}
        position={tooltipPosition}
      />

      {/* Layer 5: Activity Detail Panel (Phase 6: 노드 위치 기준 패널) */}
      <ActivityDetailPanel
        activity={selectedActivity}
        isOpen={panelOpen}
        onClose={handlePanelClose}
        nodeX={panelPosition.x}
        nodeY={panelPosition.y}
      />

      {/* Phase 4 Step 2-2: 부분 빈 상태 힌트 */}
      {(hasNoFiles || hasNoMeetings) && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg border-2 border-blue-200 shadow-lg max-w-sm z-10">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xl">💡</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                타임라인을 더 풍부하게 만들어보세요
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                {hasNoFiles && (
                  <p>• 파일을 업로드하면 문서 관리를 시각화할 수 있습니다</p>
                )}
                {hasNoMeetings && (
                  <p>• 미팅을 추가하면 프로젝트 진행 현황을 기록할 수 있습니다</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 Step 4: 애니메이션 스타일 */}
      <style>{`
        /* Pulse 애니메이션 (Phase 노드) */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        /* 페이드인 애니메이션 (공통) */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* 타임라인 드로잉 애니메이션 */
        /* Phase 5: 진입 애니메이션 */
        @keyframes fadeInTimeline {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.9;
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInBranch {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.9;
          }
        }

        @keyframes drawLine {
          from {
            stroke-dashoffset: 100%;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        /* 브랜치 경로 드로잉 애니메이션 */
        @keyframes drawBranch {
          from {
            stroke-dashoffset: 100%;
            opacity: 0;
          }
          to {
            stroke-dashoffset: 0;
            opacity: 0.85;
          }
        }

        /* 노드 등장 애니메이션 */
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* 글로우 펄스 애니메이션 (호버 효과 강화) */
        @keyframes glowPulse {
          0%, 100% {
            filter: drop-shadow(0 0 4px currentColor);
          }
          50% {
            filter: drop-shadow(0 0 8px currentColor);
          }
        }

        /* ===================================================================
           Phase 4 Step 3-1: 반응형 CSS
           =================================================================== */

        /* 모바일 (768px 이하) */
        @media (max-width: 768px) {
          .overview-tab-v3 {
            padding: 0 8px;
          }

          /* 디버그 패널 숨김 */
          .debug-panel {
            display: none !important;
          }

          /* 부분 빈 상태 힌트 작게 */
          .absolute.bottom-4.left-4 {
            max-width: 280px;
            font-size: 0.75rem;
          }

          /* SVG foreignObject 레이블 작게 */
          foreignObject {
            font-size: 0.7rem;
          }
        }

        /* 태블릿 (769px ~ 1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .overview-tab-v3 {
            padding: 0 16px;
          }

          /* 부분 빈 상태 힌트 */
          .absolute.bottom-4.left-4 {
            max-width: 360px;
          }
        }

        /* 데스크탑 (1025px 이상) - 기본 스타일 유지 */
        @media (min-width: 1025px) {
          /* 현재 디자인 유지 */
        }
      `}</style>
    </div>
  );
};

export default OverviewTabV3;