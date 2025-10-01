/**
 * @fileoverview Timeline V3 데이터 통합 훅
 * @description 4개 데이터 소스를 BranchActivity[]로 통합
 * @author PocketCompany
 * @since 2025-01-29
 */

import { useMemo } from 'react';
import { useVDRContext } from '../../../contexts/VDRContext';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import type { BranchActivity } from '../../../types/timeline-v3.types';
import type { Project } from '../../../types/buildup.types';
import type { VDRDocument } from '../../../contexts/VDRContext';
import type { BuildupProjectMeeting } from '../../../types/schedule.types';
import type { TimelinePhase } from './convertProjectPhases';

/**
 * 타임라인 데이터 통합 훅
 * @param project 현재 프로젝트
 * @param phases 변환된 타임라인 단계 배열
 * @returns 통합된 브랜치 활동 배열
 */
export const useTimelineData = (project: Project, phases: TimelinePhase[]): BranchActivity[] => {
  const { documents } = useVDRContext();
  const { buildupMeetings } = useScheduleContext();

  const activities = useMemo(() => {
    const result: BranchActivity[] = [];

    // Phase 4 Step 2-4: 방어 코드 - undefined 체크
    const safeDocuments = documents || [];
    const safeBuildupMeetings = buildupMeetings || [];

    // ========================================================================
    // 1. 파일 데이터 변환 (VDRContext) - 100% 실제 데이터
    // ========================================================================
    const projectDocuments = safeDocuments.filter(doc =>
      doc.projectId === project.id ||
      doc.category === project.name
    );

    projectDocuments.forEach(doc => {
      result.push(convertFileToActivity(doc));
    });

    // ========================================================================
    // 2. 미팅 데이터 변환 (ScheduleContext) - 100% 실제 데이터
    // ========================================================================
    const projectMeetings = safeBuildupMeetings.filter(meeting =>
      meeting.projectId === project.id
    );

    projectMeetings.forEach(meeting => {
      result.push(convertMeetingToActivity(meeting));
    });

    // ========================================================================
    // 3. 댓글 샘플 데이터 생성 (70% - 나중에 실제 데이터로 교체)
    // ========================================================================
    const commentSamples = generateCommentSamples(phases);
    result.push(...commentSamples);

    // ========================================================================
    // 4. TODO 샘플 데이터 생성 (60% - 나중에 실제 데이터로 교체)
    // ========================================================================
    const todoSamples = generateTodoSamples(phases);
    result.push(...todoSamples);

    // ========================================================================
    // 5. 타임스탬프 기준 오름차순 정렬
    // ========================================================================
    result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Phase 4 Step 3-3: 조건부 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Timeline Data Integration:', {
        total: result.length,
        files: projectDocuments.length,
        meetings: projectMeetings.length,
        comments: commentSamples.length,
        todos: todoSamples.length,
        timeRange: {
          start: result[0]?.timestamp,
          end: result[result.length - 1]?.timestamp
        },
        projectId: project.id,
        availableBuildupMeetings: safeBuildupMeetings.length
      });
    }

    return result;
  }, [documents, buildupMeetings, project, phases]);

  return activities;
};

// ============================================================================
// 변환 함수들
// ============================================================================

/**
 * VDR 파일 → BranchActivity 변환
 * Phase 4 Step 2-4: 방어 코드 추가
 */
const convertFileToActivity = (doc: VDRDocument): BranchActivity => {
  // Phase 4: Invalid Date 방어
  let timestamp = new Date(doc.uploadDate || Date.now());
  if (isNaN(timestamp.getTime())) {
    timestamp = new Date();
  }

  return {
    id: `file-${doc.id}`,
    type: 'file',
    timestamp,
    title: doc.name || '파일 제목 없음',
    branchY: 0,  // Step 3에서 계산
    branchX: 0,  // Step 3에서 계산
    color: '#10B981',
    icon: '📄',
    strokePattern: 'none',
    metadata: {
      file: {
        size: doc.size || 0,
        uploader: doc.uploadedBy || 'Unknown',
        format: doc.type || 'unknown',
        url: doc.url || '#'
      }
    }
  };
};

/**
 * 스케줄 미팅 → BranchActivity 변환
 * Phase 4 Step 2-4: 방어 코드 추가
 */
const convertMeetingToActivity = (meeting: BuildupProjectMeeting): BranchActivity => {
  // Phase 4: Invalid Date 방어
  let timestamp = new Date(meeting.date);
  if (isNaN(timestamp.getTime())) {
    timestamp = new Date();
  }

  return {
    id: `meeting-${meeting.id}`,
    type: 'meeting',
    timestamp,
    title: meeting.title || '미팅 제목 없음',
    branchY: 0,
    branchX: 0,
    color: '#3B82F6',
    icon: '📅',
    strokePattern: '5,3',
    metadata: {
      meeting: {
        participants: meeting.participants || [],
        duration: meeting.duration || 60,
        location: meeting.location || '온라인',
        notes: meeting.notes
      }
    }
  };
};

/**
 * 댓글 샘플 데이터 생성
 * TODO: 실제 댓글 시스템 구축 시 교체
 */
const generateCommentSamples = (phases: TimelinePhase[]): BranchActivity[] => {
  if (!phases || phases.length === 0) {
    return [];
  }

  const samples: BranchActivity[] = [];
  const authors = ['김대표', '이PM', '박개발', '최디자이너'];
  const comments = [
    '프로젝트 시작합니다!',
    '일정 검토 부탁드립니다.',
    '진행 상황 공유드립니다.',
    '피드백 반영 완료했습니다.',
    '다음 단계 준비 중입니다.'
  ];

  // 각 단계당 1-2개 댓글 생성
  phases.slice(0, 3).forEach((phase, phaseIndex) => {
    const phaseStart = phase.startDate;
    const phaseEnd = phase.endDate;
    const phaseDuration = phaseEnd.getTime() - phaseStart.getTime();

    // 단계 시작 후 30% 지점에 댓글
    const commentDate1 = new Date(phaseStart.getTime() + phaseDuration * 0.3);
    samples.push({
      id: `comment-${phaseIndex}-1`,
      type: 'comment',
      timestamp: commentDate1,
      title: comments[phaseIndex % comments.length],
      branchY: 0,
      branchX: 0,
      color: '#8B5CF6',
      icon: '💬',
      strokePattern: '3,2',
      metadata: {
        comment: {
          author: authors[phaseIndex % authors.length],
          content: comments[phaseIndex % comments.length],
          relatedTo: phase.id
        }
      }
    });

    // 단계 시작 후 70% 지점에 댓글
    if (phaseIndex < 2) {
      const commentDate2 = new Date(phaseStart.getTime() + phaseDuration * 0.7);
      samples.push({
        id: `comment-${phaseIndex}-2`,
        type: 'comment',
        timestamp: commentDate2,
        title: comments[(phaseIndex + 2) % comments.length],
        branchY: 0,
        branchX: 0,
        color: '#8B5CF6',
        icon: '💬',
        strokePattern: '3,2',
        metadata: {
          comment: {
            author: authors[(phaseIndex + 1) % authors.length],
            content: comments[(phaseIndex + 2) % comments.length],
            relatedTo: phase.id
          }
        }
      });
    }
  });

  return samples;
};

/**
 * TODO 샘플 데이터 생성
 * TODO: 실제 TODO 시스템 구축 시 교체
 */
const generateTodoSamples = (phases: TimelinePhase[]): BranchActivity[] => {
  if (!phases || phases.length === 0) {
    return [];
  }

  const samples: BranchActivity[] = [];
  const assignees = ['박개발', '최디자이너', '이PM'];
  const todos = [
    '요구사항 정의 완료',
    '설계 문서 작성',
    '프로토타입 제작',
    '코드 리뷰',
    '테스트 시나리오 작성'
  ];

  // 각 단계당 1개 TODO 생성
  phases.slice(0, 3).forEach((phase, phaseIndex) => {
    const phaseStart = phase.startDate;
    const phaseEnd = phase.endDate;
    const phaseDuration = phaseEnd.getTime() - phaseStart.getTime();

    // 단계 종료 직전 (90% 지점)에 완료된 TODO
    const todoDate = new Date(phaseStart.getTime() + phaseDuration * 0.9);
    samples.push({
      id: `todo-${phaseIndex}`,
      type: 'todo',
      timestamp: todoDate,
      title: todos[phaseIndex % todos.length],
      branchY: 0,
      branchX: 0,
      color: '#F97316',
      icon: '✅',
      strokePattern: 'none',
      metadata: {
        todo: {
          assignee: assignees[phaseIndex % assignees.length],
          status: 'completed',
          priority: phaseIndex === 0 ? 'high' : 'medium',
          completedAt: todoDate
        }
      }
    });
  });

  return samples;
};