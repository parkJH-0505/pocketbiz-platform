import React, { useCallback } from 'react';
import type { ProjectPhase, Project } from '../../types/buildup.types';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import type { FeedItem } from '../../types/timeline.types';
import { ALL_PHASES, PHASE_INFO } from '../../utils/projectPhaseUtils';
import { getPhaseStatus } from '../../utils/verticalProgressCalculator';
import { calculateProjectProgress } from '../../utils/progressCalculator';
import ProgressNode from './ProgressNode';
import ProgressLine from './ProgressLine';
import ProgressSummary from './ProgressSummary';

interface VerticalProgressBarProps {
  project: Project;
  meetings: BuildupProjectMeeting[];
  feedsByStage: Record<ProjectPhase, FeedItem[]>;
  onConnectionPoint: (phase: ProjectPhase, point: { x: number; y: number }) => void;
  onPhaseClick?: (phase: ProjectPhase) => void;
}

const VerticalProgressBar: React.FC<VerticalProgressBarProps> = ({
  project,
  meetings,
  feedsByStage,
  onConnectionPoint,
  onPhaseClick
}) => {
  const currentPhase = project.phase || 'contract_pending';
  const progressData = calculateProjectProgress(project, meetings);

  // 프로젝트 종료일 계산
  const projectEndDate = new Date(project.timeline?.end_date || project.contract?.end_date || new Date());

  // 연결점 등록 핸들러 (각 단계별로 고유한 함수 생성)
  const handleConnectionPoint = useCallback((phase: ProjectPhase) =>
    (point: { x: number; y: number }) => {
      onConnectionPoint(phase, point);
    }, [onConnectionPoint]);

  return (
    <div className="relative h-full bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-xl overflow-hidden">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(0,0,0,0.03) 35px,
            rgba(0,0,0,0.03) 70px
          )`
        }} />
      </div>

      {/* 상단 원형 진행률 서클 - 개선된 컨테이너 */}
      <div className="relative p-8 border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
        <ProgressSummary
          progress={progressData.percentage}
          dDay={progressData.dDayToEnd}
          estimatedEndDate={projectEndDate}
          currentPhase={currentPhase}
          dDayToNextMeeting={progressData.dDayToNextMeeting}
        />
      </div>

      {/* 세로 프로그레스바 - 개선된 레이아웃 */}
      <div className="relative p-8 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100% - 280px)' }}>
        <div className="relative" style={{ minHeight: '1680px' }}> {/* 7단계 * 240px */}
          {/* 연결선들 */}
          {ALL_PHASES.slice(0, -1).map((phase, index) => {
            const nextPhase = ALL_PHASES[index + 1];
            return (
              <ProgressLine
                key={`${phase}-${nextPhase}`}
                fromPhase={phase}
                toPhase={nextPhase}
                currentPhase={currentPhase}
                index={index}
              />
            );
          })}

          {/* 노드들 */}
          {ALL_PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase, currentPhase);
            const phaseInfo = PHASE_INFO[phase];
            const phaseDuration = progressData.phaseDurations[phase];
            const phaseStats = progressData.phaseStats[phase];
            const phaseFeeds = feedsByStage[phase] || [];

            return (
              <ProgressNode
                key={phase}
                phase={phase}
                status={status}
                phaseInfo={phaseInfo}
                index={index}
                isLast={index === ALL_PHASES.length - 1}
                duration={phaseDuration}
                meetingStats={phaseStats}
                feeds={phaseFeeds}
                onGetConnectionPoint={handleConnectionPoint(phase)}
                onClick={() => onPhaseClick?.(phase)}
              />
            );
          })}

          {/* 브랜치 피드들은 CenterPanel로 이동됨 */}
        </div>
      </div>

      {/* 하단 그라데이션 페이드 */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  );
};

export default VerticalProgressBar;