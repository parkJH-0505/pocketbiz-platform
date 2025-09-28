/**
 * @fileoverview 피드 관련 유틸리티 함수들
 * @description 피드 생성, 변환, 정렬 등의 헬퍼 함수들
 * @author PocketCompany
 * @since 2025-01-20
 */

import type {
  FeedItem,
  FeedType,
  StageFeedGroup,
  FileFeedData,
  MeetingFeedData,
  CommentFeedData
} from '../types/timeline.types';
import type { ProjectPhase } from '../types/buildup.types';
import { ALL_PHASES } from './projectPhaseUtils';

/**
 * 테스트용 더미 피드 데이터 생성
 */
export function generateDummyFeeds(projectId: string): FeedItem[] {
  const now = new Date();
  const feeds: FeedItem[] = [];

  // 파일 업로드 피드
  feeds.push({
    id: `feed-file-1`,
    type: 'file',
    title: '프로젝트 요구사항 문서.pdf',
    description: '초기 요구사항 정의 문서',
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2일 전
    stageId: 'planning',
    priority: 'high',
    status: 'completed',
    author: {
      name: '김기획',
      role: 'PM'
    },
    data: {
      fileName: '프로젝트 요구사항 문서.pdf',
      fileSize: 2048000,
      fileType: 'application/pdf',
      uploadedBy: '김기획',
      uploadedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      downloadUrl: '#'
    } as FileFeedData
  });

  // 미팅 기록 피드
  feeds.push({
    id: `feed-meeting-1`,
    type: 'meeting',
    title: '킥오프 미팅',
    description: '프로젝트 시작 회의',
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1일 전
    stageId: 'contract_signed',
    priority: 'medium',
    status: 'completed',
    author: {
      name: '박PM',
      role: 'Project Manager'
    },
    data: {
      meetingTitle: '킥오프 미팅',
      meetingDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      duration: 60,
      participants: [
        { name: '김기획', role: 'PM', attended: true },
        { name: '이개발', role: 'Developer', attended: true },
        { name: '최디자인', role: 'Designer', attended: false }
      ],
      summary: '프로젝트 목표와 일정을 공유하고 역할을 분담했습니다.',
      nextSteps: ['요구사항 정리', '와이어프레임 작성', '개발 환경 구성']
    } as MeetingFeedData
  });

  // 댓글 피드
  feeds.push({
    id: `feed-comment-1`,
    type: 'comment',
    title: '디자인 피드백',
    description: '초기 디자인에 대한 의견',
    timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4시간 전
    stageId: 'design',
    priority: 'medium',
    status: 'active',
    author: {
      name: '정클라이언트',
      role: 'Client'
    },
    data: {
      message: '전체적인 디자인 방향성은 좋습니다. 다만 메인 컬러를 좀 더 밝게 조정해주시면 좋겠어요.',
      author: '정클라이언트',
      timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      mentions: ['최디자인']
    } as CommentFeedData
  });

  // TODO 완료 피드
  feeds.push({
    id: `feed-todo-1`,
    type: 'todo',
    title: 'API 명세서 작성 완료',
    description: 'REST API 엔드포인트 정의',
    timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2시간 전
    stageId: 'execution',
    priority: 'low',
    status: 'completed',
    author: {
      name: '이개발',
      role: 'Backend Developer'
    },
    data: {
      taskTitle: 'API 명세서 작성',
      taskDescription: '백엔드 REST API 엔드포인트 문서화',
      completedBy: '이개발',
      completedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      taskCategory: '개발',
      estimatedHours: 4,
      actualHours: 3.5
    }
  });

  // 진행률 변경 피드
  feeds.push({
    id: `feed-progress-1`,
    type: 'progress',
    title: '진행률 업데이트',
    description: '설계 단계에서 개발 단계로 이동',
    timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30분 전
    stageId: 'execution',
    priority: 'high',
    status: 'active',
    author: {
      name: '박PM',
      role: 'Project Manager'
    },
    data: {
      previousProgress: 35,
      currentProgress: 50,
      previousPhase: 'design' as ProjectPhase,
      currentPhase: 'execution' as ProjectPhase,
      updatedBy: '박PM',
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      changeReason: '설계 승인 완료로 개발 단계 진입'
    }
  });

  // 더 많은 테스트 피드 추가
  feeds.push({
    id: `feed-file-2`,
    type: 'file',
    title: '와이어프레임.figma',
    description: 'UI/UX 설계 파일',
    timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    stageId: 'design',
    priority: 'medium',
    status: 'completed',
    author: { name: '최디자인', role: 'Designer' },
    data: {
      fileName: '와이어프레임.figma',
      fileSize: 5120000,
      fileType: 'application/figma',
      uploadedBy: '최디자인',
      uploadedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      downloadUrl: '#'
    } as FileFeedData
  });

  feeds.push({
    id: `feed-comment-2`,
    type: 'comment',
    title: '개발 환경 질문',
    description: '백엔드 환경 설정 관련',
    timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
    stageId: 'execution',
    priority: 'low',
    status: 'active',
    author: { name: '이개발', role: 'Developer' },
    data: {
      message: 'Docker 컨테이너 설정에서 포트 충돌이 발생하고 있습니다. 해결 방법이 있을까요?',
      author: '이개발',
      timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      mentions: ['박PM']
    } as CommentFeedData
  });

  return feeds;
}

/**
 * 피드들을 단계별로 그룹화
 */
export function groupFeedsByStage(feeds: FeedItem[]): StageFeedGroup[] {
  const groups: StageFeedGroup[] = [];

  ALL_PHASES.forEach(phase => {
    const stageFeeds = feeds.filter(feed => feed.stageId === phase);

    if (stageFeeds.length > 0) {
      groups.push({
        stageId: phase,
        stageName: phase,
        feeds: stageFeeds.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        totalCount: stageFeeds.length,
        expandedCount: stageFeeds.filter(f => f.expanded).length,
        lastActivity: stageFeeds.length > 0 ?
          new Date(Math.max(...stageFeeds.map(f => f.timestamp.getTime()))) :
          undefined
      });
    }
  });

  return groups;
}

/**
 * 피드 ID로 토글
 */
export function toggleFeedExpansion(feeds: FeedItem[], feedId: string): FeedItem[] {
  return feeds.map(feed =>
    feed.id === feedId ? { ...feed, expanded: !feed.expanded } : feed
  );
}

/**
 * 피드 우선순위에 따른 자동 정렬
 */
export function sortFeedsByPriority(feeds: FeedItem[]): FeedItem[] {
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...feeds].sort((a, b) => {
    // 1차: 우선순위
    const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 2차: 시간 (최신순)
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

/**
 * 특정 기간 내 피드 필터링
 */
export function filterFeedsByDateRange(
  feeds: FeedItem[],
  days: number
): FeedItem[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return feeds.filter(feed => feed.timestamp >= cutoff);
}

/**
 * 피드 타입별 아이콘 색상 반환
 */
export function getFeedTypeColor(type: FeedType): string {
  const colors = {
    file: 'text-blue-600',
    meeting: 'text-green-600',
    comment: 'text-purple-600',
    progress: 'text-orange-600',
    todo: 'text-emerald-600',
    team: 'text-indigo-600'
  };

  return colors[type];
}

/**
 * 상대적 시간 표시 함수
 */
export function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days > 7) {
    return timestamp.toLocaleDateString('ko-KR');
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
}