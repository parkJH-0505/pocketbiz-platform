/**
 * @fileoverview Timeline 브랜치 피드 시스템 타입 정의
 * @description 프로젝트 단계별 활동 피드들의 타입 시스템
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { ProjectPhase } from './buildup.types';

/**
 * 피드 아이템의 기본 타입들
 */
export type FeedType = 'file' | 'meeting' | 'comment' | 'progress' | 'todo' | 'team';
export type FeedPriority = 'high' | 'medium' | 'low';
export type FeedStatus = 'active' | 'completed' | 'pending' | 'cancelled';

/**
 * 기본 피드 아이템 인터페이스
 */
export interface BaseFeedItem {
  id: string;
  type: FeedType;
  title: string;
  description?: string;
  timestamp: Date;
  stageId: ProjectPhase;
  priority: FeedPriority;
  status: FeedStatus;
  author?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * 파일 업로드 피드 데이터
 */
export interface FileFeedData {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: Date;
  downloadUrl: string;
  thumbnailUrl?: string;
  category?: string;
}

/**
 * 미팅 기록 피드 데이터
 */
export interface MeetingFeedData {
  meetingTitle: string;
  meetingDate: Date;
  duration?: number;
  participants: Array<{
    name: string;
    role?: string;
    attended: boolean;
  }>;
  summary?: string;
  nextSteps?: string[];
  recordingUrl?: string;
  meetingNotes?: string;
}

/**
 * 댓글 피드 데이터
 */
export interface CommentFeedData {
  message: string;
  author: string;
  timestamp: Date;
  parentId?: string;
  mentions?: string[];
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

/**
 * 진행률 변경 피드 데이터
 */
export interface ProgressFeedData {
  previousProgress: number;
  currentProgress: number;
  previousPhase: ProjectPhase;
  currentPhase: ProjectPhase;
  updatedBy: string;
  updatedAt: Date;
  changeReason?: string;
}

/**
 * TODO 완료 피드 데이터
 */
export interface TodoFeedData {
  taskTitle: string;
  taskDescription?: string;
  completedBy: string;
  completedAt: Date;
  taskCategory: string;
  estimatedHours?: number;
  actualHours?: number;
  relatedFiles?: string[];
}

/**
 * 팀원 활동 피드 데이터
 */
export interface TeamFeedData {
  memberName: string;
  action: string;
  details?: string;
  timestamp: Date;
  activityType: 'join' | 'leave' | 'role_change' | 'assignment' | 'other';
  relatedEntity?: {
    type: string;
    id: string;
    name: string;
  };
}

/**
 * 타입별 피드 데이터 유니온 타입
 */
export type FeedData =
  | FileFeedData
  | MeetingFeedData
  | CommentFeedData
  | ProgressFeedData
  | TodoFeedData
  | TeamFeedData;

/**
 * 완전한 피드 아이템 (데이터 포함)
 */
export interface FeedItem extends BaseFeedItem {
  data: FeedData;
  expanded?: boolean;
  pinned?: boolean;
  tags?: string[];

  // 브랜치 타임라인을 위한 확장 필드들
  visualPriority?: 'high' | 'medium' | 'low';
  interactionHistory?: {
    viewCount: number;
    lastViewed?: Date;
    isBookmarked: boolean;
    averageViewDuration?: number;
  };
  renderingHints?: {
    preferredBranchLength?: number;
    allowOverlap: boolean;
    requiresLargeNode: boolean;
    customColor?: string;
  };
  relatedFeeds?: string[]; // 관련된 다른 피드들의 ID
  importance?: number; // 0-100, 자동 펼침/접힘에 사용
}

/**
 * 단계별 피드 그룹
 */
export interface StageFeedGroup {
  stageId: ProjectPhase;
  stageName: string;
  feeds: FeedItem[];
  totalCount: number;
  expandedCount: number;
  lastActivity?: Date;
}

/**
 * 브랜치 피드 컴포넌트 Props
 */
export interface BranchFeedProps {
  stageId: ProjectPhase;
  feeds: FeedItem[];
  connectionPoint: {
    x: number;
    y: number;
  };
  onFeedClick?: (feed: FeedItem) => void;
  onFeedToggle?: (feedId: string) => void;
  onFeedAction?: (feedId: string, action: string) => void;
  maxVisible?: number;
  autoExpand?: boolean;
}

/**
 * 피드 카드 컴포넌트 Props
 */
export interface FeedCardProps {
  feed: FeedItem;
  expanded: boolean;
  onToggle: () => void;
  onAction?: (action: string, data?: any) => void;
  className?: string;
  size?: 'compact' | 'normal' | 'detailed';
}

/**
 * 피드 필터링 옵션
 */
export interface FeedFilter {
  types?: FeedType[];
  priorities?: FeedPriority[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  authors?: string[];
  stages?: ProjectPhase[];
  searchQuery?: string;
  tags?: string[];
}

/**
 * 타임라인 상태 관리
 */
export interface TimelineState {
  stages: StageFeedGroup[];
  selectedFeed: string | null;
  expandedFeeds: Set<string>;
  filter: FeedFilter;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
}

/**
 * 피드 액션 타입들
 */
export type FeedAction =
  | 'view'
  | 'edit'
  | 'delete'
  | 'pin'
  | 'unpin'
  | 'expand'
  | 'collapse'
  | 'reply'
  | 'download'
  | 'share'
  | 'mark_important'
  | 'archive';

/**
 * 피드 템플릿 구성 옵션
 */
export interface FeedTemplate {
  type: FeedType;
  icon: string;
  color: string;
  bgColor: string;
  collapsedFields: string[];
  expandedFields: string[];
  actions: FeedAction[];
  maxContentLength?: number;
}

/**
 * 브랜치 연결 스타일 옵션
 */
export interface BranchConnection {
  type: 'straight' | 'curved' | 'stepped';
  style: 'solid' | 'dashed' | 'dotted';
  color: string;
  width: number;
  animated?: boolean;
}

/**
 * 레이아웃 계산 결과
 */
export interface LayoutCalculation {
  stagePositions: Record<ProjectPhase, { x: number; y: number }>;
  branchPositions: Record<string, { x: number; y: number; width: number; height: number }>;
  totalHeight: number;
  scrollOffset: number;
}