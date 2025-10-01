/**
 * @fileoverview 미팅 데이터를 피드 아이템으로 변환
 * @description 실제 프로젝트 데이터를 브랜치 타임라인용 피드로 변환
 * @author PocketCompany
 * @since 2025-01-20
 */

import type { BuildupProjectMeeting } from '../types/schedule.types';
import type { VDRDocument } from '../types/vdr.types';
import type {
  FeedItem,
  FeedType,
  FileFeedData,
  MeetingFeedData,
  CommentFeedData,
  ProgressFeedData,
  TodoFeedData,
  TeamFeedData
} from '../types/timeline.types';
import type { ProjectPhase } from '../types/buildup.types';

// 고유 ID 생성을 위한 카운터
let feedIdCounter = 0;

/**
 * 고유한 피드 ID 생성
 */
const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${++feedIdCounter}`;
};
import { MEETING_TYPE_CONFIG } from '../types/meeting.enhanced.types';

/**
 * 미팅 타입을 피드 타입으로 매핑
 */
const getMeetingFeedType = (meetingType?: string): FeedType => {
  switch (meetingType) {
    case 'KICKOFF':
    case 'REGULAR':
    case 'MILESTONE':
      return 'meeting';
    case 'REVIEW':
    case 'FEEDBACK':
      return 'comment';
    case 'PLANNING':
    case 'WORKSHOP':
      return 'todo';
    default:
      return 'meeting';
  }
};

/**
 * 미팅 상태를 피드 상태로 변환
 */
const getMeetingFeedStatus = (status?: string): FeedItem['status'] => {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'scheduled':
      return 'pending';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'active';
  }
};

/**
 * 미팅을 피드 아이템으로 변환
 */
export const convertMeetingToFeed = (meeting: BuildupProjectMeeting): FeedItem => {
  const feedType = getMeetingFeedType(meeting.meetingSequence?.type);
  const meetingConfig = meeting.meetingSequence?.type
    ? MEETING_TYPE_CONFIG[meeting.meetingSequence.type]
    : null;

  // 미팅 데이터 구성
  const meetingData: MeetingFeedData = {
    meetingTitle: meeting.title,
    meetingDate: new Date(meeting.date),
    duration: meeting.duration || 60,
    participants: meeting.participants?.map(p => ({
      name: p.name || 'Unknown',
      role: p.role,
      attended: p.attended !== false
    })) || [],
    summary: meeting.description,
    nextSteps: meeting.nextSteps || [],
    recordingUrl: meeting.recordingUrl,
    meetingNotes: meeting.meetingNotes
  };

  return {
    id: `meeting-${meeting.id}`,
    type: feedType,
    title: meeting.title,
    description: meeting.description || meetingConfig?.description,
    timestamp: new Date(meeting.date),
    stageId: meeting.phase || 'planning',
    priority: meeting.importance === 'high' ? 'high' :
             meeting.importance === 'low' ? 'low' : 'medium',
    status: getMeetingFeedStatus(meeting.status),
    author: meeting.organizer ? {
      name: meeting.organizer.name || 'System',
      avatar: meeting.organizer.avatar,
      role: meeting.organizer.role
    } : undefined,
    data: meetingData,
    tags: meeting.tags || [],
    visualPriority: meeting.importance === 'high' ? 'high' : 'medium',
    importance: meeting.importance === 'high' ? 80 :
               meeting.importance === 'low' ? 30 : 50
  };
};

/**
 * VDR 문서를 파일 피드로 변환
 */
export const convertDocumentToFeed = (
  document: VDRDocument,
  phase: ProjectPhase
): FeedItem => {
  const fileFeedData: FileFeedData = {
    fileName: document.name,
    fileSize: document.size || 0,
    fileType: document.type || 'document',
    uploadedBy: document.uploadedBy?.name || 'System',
    uploadedAt: new Date(document.uploadedAt || Date.now()),
    downloadUrl: document.url || '#',
    thumbnailUrl: document.thumbnailUrl,
    category: document.category
  };

  return {
    id: `file-${document.id}`,
    type: 'file',
    title: document.name,
    description: document.description,
    timestamp: new Date(document.uploadedAt || Date.now()),
    stageId: phase,
    priority: document.importance === 'critical' ? 'high' :
             document.importance === 'optional' ? 'low' : 'medium',
    status: document.status === 'approved' ? 'completed' :
           document.status === 'rejected' ? 'cancelled' :
           document.status === 'pending' ? 'pending' : 'active',
    author: document.uploadedBy ? {
      name: document.uploadedBy.name || 'Unknown',
      avatar: document.uploadedBy.avatar,
      role: document.uploadedBy.role
    } : undefined,
    data: fileFeedData,
    tags: document.tags || [],
    importance: document.importance === 'critical' ? 90 :
               document.importance === 'optional' ? 20 : 50
  };
};

/**
 * 진행률 변경을 피드로 변환
 */
export const createProgressFeed = (
  progress: {
    previousProgress: number;
    currentProgress: number;
    previousPhase: ProjectPhase;
    currentPhase: ProjectPhase;
    updatedBy: string;
    reason?: string;
  }
): FeedItem => {
  const progressData: ProgressFeedData = {
    previousProgress: progress.previousProgress,
    currentProgress: progress.currentProgress,
    previousPhase: progress.previousPhase,
    currentPhase: progress.currentPhase,
    updatedBy: progress.updatedBy,
    updatedAt: new Date(),
    changeReason: progress.reason
  };

  return {
    id: generateUniqueId('progress'),
    type: 'progress',
    title: `진행률 ${progress.currentProgress}% 달성`,
    description: progress.reason || `${progress.previousProgress}%에서 ${progress.currentProgress}%로 업데이트`,
    timestamp: new Date(),
    stageId: progress.currentPhase,
    priority: 'high',
    status: 'completed',
    author: {
      name: progress.updatedBy,
      role: 'Project Manager'
    },
    data: progressData,
    visualPriority: 'high',
    importance: 85
  };
};

/**
 * 코멘트/피드백을 피드로 변환
 */
export const createCommentFeed = (
  comment: {
    message: string;
    author: string;
    parentId?: string;
    phase: ProjectPhase;
  }
): FeedItem => {
  const commentData: CommentFeedData = {
    message: comment.message,
    author: comment.author,
    timestamp: new Date(),
    parentId: comment.parentId
  };

  return {
    id: generateUniqueId('comment'),
    type: 'comment',
    title: `${comment.author}님의 코멘트`,
    description: comment.message.substring(0, 100),
    timestamp: new Date(),
    stageId: comment.phase,
    priority: 'low',
    status: 'completed',
    author: {
      name: comment.author
    },
    data: commentData,
    importance: 30
  };
};

/**
 * TODO/작업을 피드로 변환
 */
export const createTodoFeed = (
  task: {
    title: string;
    description?: string;
    assignee?: string;
    phase: ProjectPhase;
    completed?: boolean;
    category?: string;
  }
): FeedItem => {
  const todoData: TodoFeedData = {
    taskTitle: task.title,
    taskDescription: task.description,
    completedBy: task.completed ? (task.assignee || 'Unknown') : '',
    completedAt: task.completed ? new Date() : new Date(),
    taskCategory: task.category || 'general'
  };

  return {
    id: generateUniqueId('todo'),
    type: 'todo',
    title: task.title,
    description: task.description,
    timestamp: new Date(),
    stageId: task.phase,
    priority: 'medium',
    status: task.completed ? 'completed' : 'pending',
    author: task.assignee ? {
      name: task.assignee
    } : undefined,
    data: todoData,
    importance: 40
  };
};

/**
 * 팀 활동을 피드로 변환
 */
export const createTeamFeed = (
  activity: {
    memberName: string;
    action: string;
    details?: string;
    phase: ProjectPhase;
    activityType: 'join' | 'leave' | 'role_change' | 'assignment' | 'other';
  }
): FeedItem => {
  const teamData: TeamFeedData = {
    memberName: activity.memberName,
    action: activity.action,
    details: activity.details,
    timestamp: new Date(),
    activityType: activity.activityType
  };

  return {
    id: generateUniqueId('team'),
    type: 'team',
    title: activity.action,
    description: activity.details,
    timestamp: new Date(),
    stageId: activity.phase,
    priority: 'low',
    status: 'completed',
    author: {
      name: activity.memberName
    },
    data: teamData,
    importance: 25
  };
};

/**
 * 미팅 배열을 피드 배열로 일괄 변환
 */
export const convertMeetingsToFeeds = (
  meetings: BuildupProjectMeeting[]
): FeedItem[] => {
  return meetings.map(convertMeetingToFeed);
};

/**
 * 모든 데이터 소스를 통합하여 피드 생성
 */
export interface DataSources {
  meetings?: BuildupProjectMeeting[];
  documents?: Array<VDRDocument & { phase: ProjectPhase }>;
  comments?: Array<{ message: string; author: string; phase: ProjectPhase }>;
  tasks?: Array<{
    title: string;
    description?: string;
    assignee?: string;
    phase: ProjectPhase;
    completed?: boolean;
  }>;
  progressUpdates?: Array<{
    previousProgress: number;
    currentProgress: number;
    previousPhase: ProjectPhase;
    currentPhase: ProjectPhase;
    updatedBy: string;
  }>;
}

export const createIntegratedFeeds = (sources: DataSources): FeedItem[] => {
  const feeds: FeedItem[] = [];

  // 미팅 피드 추가
  if (sources.meetings) {
    feeds.push(...convertMeetingsToFeeds(sources.meetings));
  }

  // 문서 피드 추가
  if (sources.documents) {
    sources.documents.forEach(doc => {
      feeds.push(convertDocumentToFeed(doc, doc.phase));
    });
  }

  // 코멘트 피드 추가
  if (sources.comments) {
    sources.comments.forEach(comment => {
      feeds.push(createCommentFeed(comment));
    });
  }

  // 작업 피드 추가
  if (sources.tasks) {
    sources.tasks.forEach(task => {
      feeds.push(createTodoFeed(task));
    });
  }

  // 진행률 피드 추가
  if (sources.progressUpdates) {
    sources.progressUpdates.forEach(update => {
      feeds.push(createProgressFeed(update));
    });
  }

  // 시간순 정렬 (최신순)
  return feeds.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};