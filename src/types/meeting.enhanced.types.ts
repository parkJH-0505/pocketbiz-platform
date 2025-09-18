/**
 * @fileoverview 확장된 미팅 데이터 모델
 * @description Sprint 6 Phase 6-2: 미팅 메모 및 특화 기능을 위한 타입 정의
 * @author PocketCompany
 * @since 2025-01-19
 */

/**
 * 미팅 유형 정의
 */
export type MeetingType = 'pre_meeting' | 'guide_1' | 'guide_2' | 'guide_3' | 'guide_4';

/**
 * 미팅 상태 정의
 */
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

/**
 * 액션 아이템 인터페이스
 */
export interface ActionItem {
  id: string;
  item: string;
  description?: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  completedAt?: Date;
  completedBy?: string;
}

/**
 * 미팅 메모 인터페이스
 */
export interface MeetingNotes {
  id: string;
  meetingId: string;

  // 사전 준비
  preparation: {
    agenda: string[];
    materials: string[];
    attendeePrep: string;
    goals: string[];
  };

  // 미팅 진행
  discussion: {
    keyPoints: string[];
    concerns: string[];
    opportunities: string[];
    feedback: string;
  };

  // 결정사항 및 후속조치
  outcomes: {
    decisions: {
      id: string;
      decision: string;
      rationale: string;
      impact: 'low' | 'medium' | 'high';
      approvedBy: string;
      decisionDate: Date;
    }[];
    actionItems: ActionItem[];
    nextSteps: string[];
    followUpDate?: Date;
  };

  // 메타데이터
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  version: number;
  isPublic: boolean;
  tags: string[];
}

/**
 * 참석자 정보
 */
export interface MeetingAttendee {
  id: string;
  name: string;
  email: string;
  role: 'pm' | 'client' | 'stakeholder' | 'observer';
  company?: string;
  position?: string;
  attended: boolean;
  confirmedAt?: Date;
  notes?: string;
}

/**
 * 미팅 첨부파일
 */
export interface MeetingAttachment {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  isPublic: boolean;
}

/**
 * 미팅 유형별 특화 데이터
 */
export interface MeetingTypeSpecificData {
  pre_meeting?: {
    contractVersion: string;
    estimatedBudget: number;
    estimatedTimeline: string;
    projectScope: string[];
    technicalRequirements: string[];
    businessRequirements: string[];
    riskAssessment: string[];
    successCriteria: string[];
  };

  guide_1?: {
    kickoffComplete: boolean;
    projectCharter: {
      vision: string;
      scope: string[];
      outOfScope: string[];
      assumptions: string[];
      constraints: string[];
    };
    teamIntroduction: {
      pmAssigned: string;
      teamMembers: string[];
      communicationPlan: string;
    };
    initialPlanning: {
      milestones: {
        name: string;
        targetDate: Date;
        deliverables: string[];
      }[];
      riskMitigation: string[];
    };
  };

  guide_2?: {
    designReview: {
      designApproved: boolean;
      designFeedback: string[];
      designChanges: string[];
      prototypeReady: boolean;
    };
    technicalSpecs: {
      architecture: string;
      techStack: string[];
      integrations: string[];
      performanceRequirements: string[];
    };
    uiuxReview: {
      wireframesApproved: boolean;
      designSystemDefined: boolean;
      userFlowValidated: boolean;
      accessibilityConsidered: boolean;
    };
  };

  guide_3?: {
    developmentProgress: {
      completionPercentage: number;
      completedFeatures: string[];
      inProgressFeatures: string[];
      blockers: string[];
    };
    qualityAssurance: {
      testingStarted: boolean;
      bugCount: number;
      criticalIssues: string[];
      performanceMetrics: Record<string, number>;
    };
    clientFeedback: {
      feedbackReceived: boolean;
      satisfactionScore: number;
      changeRequests: string[];
      approvedChanges: string[];
    };
  };

  guide_4?: {
    finalDelivery: {
      deliveryReady: boolean;
      deliverables: {
        name: string;
        status: 'ready' | 'pending' | 'approved';
        deliveryDate: Date;
      }[];
      documentationComplete: boolean;
      trainingProvided: boolean;
    };
    projectClosure: {
      clientSatisfaction: number;
      lessonsLearned: string[];
      recommendationsForFuture: string[];
      supportPlanDefined: boolean;
    };
    handover: {
      maintenanceDocumentation: boolean;
      accessCredentials: boolean;
      supportContactsDefined: boolean;
      warrantyTermsAgreed: boolean;
    };
  };
}

/**
 * 확장된 미팅 인터페이스
 */
export interface EnhancedMeeting {
  // 기본 정보
  id: string;
  title: string;
  type: MeetingType;
  projectId: string;

  // 일정 정보
  scheduledDate: Date;
  startTime?: string;
  endTime?: string;
  duration: number; // minutes
  timezone: string;

  // 장소 정보
  location?: string;
  meetingLink?: string;
  isOnline: boolean;

  // 상태 관리
  status: MeetingStatus;
  createdAt: Date;
  lastModified: Date;

  // 참석자
  attendees: MeetingAttendee[];
  organizer: string;

  // 미팅 특화 데이터
  typeSpecificData: MeetingTypeSpecificData;

  // 메모 및 첨부파일
  notes?: MeetingNotes;
  attachments: MeetingAttachment[];

  // 후속 미팅 연결
  previousMeetingId?: string;
  nextMeetingId?: string;

  // 메타데이터
  tags: string[];
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };

  // 평가 및 피드백
  feedback?: {
    pmRating: number;
    clientRating: number;
    effectivenessScore: number;
    comments: string;
  };
}

/**
 * 미팅 생성 DTO
 */
export interface CreateMeetingDTO {
  title: string;
  type: MeetingType;
  projectId: string;
  scheduledDate: Date;
  duration: number;
  attendees: Omit<MeetingAttendee, 'id' | 'attended' | 'confirmedAt'>[];
  location?: string;
  meetingLink?: string;
  agenda?: string[];
  preparation?: string;
}

/**
 * 미팅 업데이트 DTO
 */
export interface UpdateMeetingDTO {
  title?: string;
  scheduledDate?: Date;
  duration?: number;
  location?: string;
  meetingLink?: string;
  status?: MeetingStatus;
  notes?: Partial<MeetingNotes>;
  typeSpecificData?: Partial<MeetingTypeSpecificData>;
}

/**
 * 미팅 통계 인터페이스
 */
export interface MeetingStatistics {
  totalMeetings: number;
  meetingsByType: Record<MeetingType, number>;
  meetingsByStatus: Record<MeetingStatus, number>;
  averageDuration: number;
  completionRate: number;
  averageRating: number;
  totalActionItems: number;
  completedActionItems: number;
  overdueActionItems: number;
}

/**
 * 미팅 검색 필터
 */
export interface MeetingFilter {
  projectId?: string;
  type?: MeetingType;
  status?: MeetingStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  attendee?: string;
  hasNotes?: boolean;
  hasActionItems?: boolean;
  tags?: string[];
}

/**
 * 유틸리티 타입 가드
 */
export const isMeetingType = (type: string): type is MeetingType => {
  return ['pre_meeting', 'guide_1', 'guide_2', 'guide_3', 'guide_4'].includes(type);
};

export const isMeetingStatus = (status: string): status is MeetingStatus => {
  return ['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(status);
};

/**
 * 미팅 유형별 설정
 */
export const MEETING_TYPE_CONFIG = {
  pre_meeting: {
    label: '프리미팅',
    description: '프로젝트 계약 전 사전 미팅',
    icon: '🤝',
    color: 'purple',
    defaultDuration: 60,
    requiredAttendees: ['pm', 'client'],
    phaseTransition: { from: 'contract_pending', to: 'contract_signed' }
  },
  guide_1: {
    label: '가이드 1차 (킥오프)',
    description: '프로젝트 킥오프 및 요구사항 정리',
    icon: '🚀',
    color: 'blue',
    defaultDuration: 90,
    requiredAttendees: ['pm', 'client'],
    phaseTransition: { from: 'contract_signed', to: 'planning' }
  },
  guide_2: {
    label: '가이드 2차 (설계)',
    description: '설계 검토 및 기술 스택 결정',
    icon: '🎨',
    color: 'green',
    defaultDuration: 120,
    requiredAttendees: ['pm', 'client'],
    phaseTransition: { from: 'planning', to: 'design' }
  },
  guide_3: {
    label: '가이드 3차 (개발)',
    description: '개발 진행 상황 및 중간 검토',
    icon: '⚙️',
    color: 'orange',
    defaultDuration: 90,
    requiredAttendees: ['pm', 'client'],
    phaseTransition: { from: 'design', to: 'execution' }
  },
  guide_4: {
    label: '가이드 4차 (완료)',
    description: '최종 검수 및 프로젝트 완료',
    icon: '✅',
    color: 'emerald',
    defaultDuration: 60,
    requiredAttendees: ['pm', 'client'],
    phaseTransition: { from: 'execution', to: 'review' }
  }
} as const;