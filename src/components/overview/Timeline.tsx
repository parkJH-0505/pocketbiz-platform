/**
 * @fileoverview 타임라인 메인 컴포넌트 - BranchTimeline 통합
 * @description Git 브랜치 스타일의 통합 타임라인 컴포넌트
 * @author PocketCompany
 * @since 2025-01-20
 */

import React, { useState, useCallback, useMemo } from 'react';
import type { Project, ProjectPhase } from '../../types/buildup.types';
import type { BuildupProjectMeeting } from '../../types/schedule.types';
import type { FeedItem } from '../../types/timeline.types';
import type { BranchInteractionEvent } from '../../types/branch-timeline.types';
import BranchTimeline from './BranchTimeline';
import { groupFeedsByStage } from '../../utils/feedUtils';
import { convertMeetingsToFeeds, createIntegratedFeeds } from '../../utils/meetingToFeedConverter';

interface TimelineProps {
  project: Project;
  meetings: BuildupProjectMeeting[];
  onPhaseClick?: (phase: ProjectPhase) => void;
}

/**
 * Timeline 래퍼 컴포넌트
 * ProjectDetail에서 사용하는 인터페이스를 유지하면서
 * 내부적으로 BranchTimeline을 사용
 */
const Timeline: React.FC<TimelineProps> = ({
  project,
  meetings,
  onPhaseClick
}) => {
  // 피드 데이터 관리
  const [selectedFeed, setSelectedFeed] = useState<FeedItem | null>(null);

  // 실제 미팅 데이터를 피드로 변환
  const feeds = useMemo(() => {
    // 기본적으로 미팅 데이터를 변환
    const meetingFeeds = convertMeetingsToFeeds(meetings);

    // 추가 데이터 소스가 있다면 통합 (현재는 미팅만)
    // 향후 VDRContext, BuildupContext 등에서 데이터 가져와서 통합
    const integratedFeeds = createIntegratedFeeds({
      meetings: meetings,
      // documents: vdrDocuments,
      // tasks: buildupTasks,
      // comments: meetingComments,
      // progressUpdates: projectProgressHistory
    });

    // 개발 중에는 더미 데이터도 일부 포함하여 다양한 피드 타입 테스트
    if (process.env.NODE_ENV === 'development' && meetingFeeds.length < 5) {
      // 더미 데이터 추가 예시
      return [
        ...integratedFeeds,
        // 샘플 파일 피드
        {
          id: 'sample-file-1',
          type: 'file' as const,
          title: '프로젝트 제안서.pdf',
          description: '초기 프로젝트 제안서',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          stageId: 'planning' as ProjectPhase,
          priority: 'high' as const,
          status: 'completed' as const,
          data: {
            fileName: '프로젝트 제안서.pdf',
            fileSize: 2048576,
            fileType: 'application/pdf',
            uploadedBy: 'PM',
            uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            downloadUrl: '#'
          }
        },
        // 샘플 진행률 피드
        {
          id: 'sample-progress-1',
          type: 'progress' as const,
          title: '프로젝트 25% 완료',
          description: '초기 기획 단계 완료',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          stageId: 'design' as ProjectPhase,
          priority: 'high' as const,
          status: 'completed' as const,
          data: {
            previousProgress: 10,
            currentProgress: 25,
            previousPhase: 'planning' as ProjectPhase,
            currentPhase: 'design' as ProjectPhase,
            updatedBy: 'System',
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        }
      ];
    }

    return integratedFeeds;
  }, [meetings]);

  // 단계별 피드 그룹화
  const feedsByStage = useMemo(() => {
    const groups = groupFeedsByStage(feeds);
    return groups.reduce((acc, group) => {
      acc[group.stageId] = group.feeds;
      return acc;
    }, {} as Record<ProjectPhase, FeedItem[]>);
  }, [feeds]);

  // 피드 인터랙션 핸들러
  const handleFeedInteraction = useCallback((event: BranchInteractionEvent) => {
    console.log('Feed interaction:', event);

    switch (event.type) {
      case 'click':
      case 'select':
        const clickedFeed = feeds.find(f => f.id === event.feedId);
        if (clickedFeed) {
          setSelectedFeed(clickedFeed);
        }
        break;

      case 'deselect':
        setSelectedFeed(null);
        break;

      case 'hover':
        // 호버 효과는 BranchTimeline 내부에서 처리
        break;

      case 'expand':
      case 'collapse':
        // 확장/축소는 BranchTimeline 내부에서 처리
        break;

      default:
        break;
    }
  }, [feeds]);

  // 단계 클릭 핸들러
  const handlePhaseClick = useCallback((phase: ProjectPhase) => {
    console.log('Phase clicked:', phase);
    onPhaseClick?.(phase);

    // 해당 단계의 첫 번째 피드 선택
    const phaseFeeds = feedsByStage[phase];
    if (phaseFeeds && phaseFeeds.length > 0) {
      setSelectedFeed(phaseFeeds[0]);
    }
  }, [onPhaseClick, feedsByStage]);

  return (
    <div className="h-full flex flex-col bg-white rounded-lg">
      {/* 헤더 영역 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">프로젝트 타임라인</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>실시간 동기화</span>
            </div>
            <span className="text-gray-400">•</span>
            <span>{feeds.length}개 활동</span>
          </div>
        </div>
      </div>

      {/* 메인 타임라인 영역 */}
      <div className="flex-1 relative overflow-hidden">
        <BranchTimeline
          project={project}
          meetings={meetings}
          feedsByStage={feedsByStage}
          onFeedInteraction={handleFeedInteraction}
          onPhaseClick={handlePhaseClick}
          className="h-full"
        />
      </div>

      {/* 선택된 피드 상세 정보 (하단 패널) */}
      {selectedFeed && (
        <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {selectedFeed.type === 'file' ? '📄' :
                     selectedFeed.type === 'meeting' ? '🤝' :
                     selectedFeed.type === 'comment' ? '💬' :
                     selectedFeed.type === 'todo' ? '✅' :
                     selectedFeed.type === 'progress' ? '📊' :
                     selectedFeed.type === 'team' ? '👥' : '📋'}
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedFeed.title}
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    selectedFeed.priority === 'high' ? 'bg-red-100 text-red-700' :
                    selectedFeed.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedFeed.priority === 'high' ? '높음' :
                     selectedFeed.priority === 'medium' ? '보통' : '낮음'}
                  </span>
                </div>

                {selectedFeed.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedFeed.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    {new Date(selectedFeed.timestamp).toLocaleString('ko-KR')}
                  </span>
                  {selectedFeed.author && (
                    <span>작성자: {selectedFeed.author.name}</span>
                  )}
                  <span className={`px-2 py-0.5 rounded ${
                    selectedFeed.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedFeed.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    selectedFeed.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedFeed.status === 'completed' ? '완료' :
                     selectedFeed.status === 'pending' ? '대기중' :
                     selectedFeed.status === 'cancelled' ? '취소됨' : '진행중'}
                  </span>
                </div>

                {/* 타입별 추가 정보 */}
                {selectedFeed.type === 'meeting' && selectedFeed.data && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm">
                      <div className="font-medium mb-1">참가자:</div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedFeed.data as any).participants?.map((p: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {p.name}
                          </span>
                        )) || <span className="text-gray-400">참가자 정보 없음</span>}
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeed.type === 'file' && selectedFeed.data && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">
                      파일명: {(selectedFeed.data as any).fileName}<br/>
                      크기: {((selectedFeed.data as any).fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedFeed(null)}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;