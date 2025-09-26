/**
 * Collaboration Types
 * 협업 기능 타입 정의 - 공유, 댓글, 승인 워크플로
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  department?: string;
}

export interface Comment {
  id: string;
  scenarioId: string;
  authorId: string;
  author: User;
  content: string;
  type: 'general' | 'suggestion' | 'concern' | 'approval';
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // For replies
  replies?: Comment[];
  reactions?: Reaction[];
  attachments?: Attachment[];
  mentions?: string[]; // User IDs
}

export interface Reaction {
  id: string;
  userId: string;
  user: User;
  type: 'like' | 'dislike' | 'heart' | 'thinking' | 'concern';
  createdAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document' | 'spreadsheet' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ShareSettings {
  visibility: 'private' | 'team' | 'company' | 'public';
  allowedUsers?: string[]; // User IDs for private sharing
  allowedDepartments?: string[]; // Department names for team sharing
  permissions: {
    canView: boolean;
    canComment: boolean;
    canEdit: boolean;
    canApprove: boolean;
    canShare: boolean;
  };
  expiresAt?: Date;
  requiresLogin: boolean;
  password?: string;
}

export interface ApprovalWorkflow {
  id: string;
  scenarioId: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested';
  currentStage: number;
  stages: ApprovalStage[];
  submittedBy: string;
  submittedAt: Date;
  completedAt?: Date;
  finalDecision?: 'approved' | 'rejected';
  rejectionReason?: string;
  history: ApprovalAction[];
}

export interface ApprovalStage {
  id: string;
  name: string;
  description: string;
  order: number;
  approvers: string[]; // User IDs
  requiresAll: boolean; // true: 모든 승인자 필요, false: 한 명만 필요
  status: 'pending' | 'approved' | 'rejected';
  dueDate?: Date;
  instructions?: string;
}

export interface ApprovalAction {
  id: string;
  stageId: string;
  approverId: string;
  approver: User;
  action: 'approved' | 'rejected' | 'revision_requested';
  comment?: string;
  createdAt: Date;
  suggestedChanges?: string[];
}

export interface SharedScenario {
  id: string;
  originalScenarioId: string;
  sharedBy: string;
  shareSettings: ShareSettings;
  shareUrl: string;
  accessCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  comments: Comment[];
  workflow?: ApprovalWorkflow;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'comment' | 'mention' | 'approval_request' | 'approval_decision' | 'share' | 'reaction';
  title: string;
  message: string;
  relatedId: string; // Scenario ID, Comment ID, etc.
  relatedType: 'scenario' | 'comment' | 'workflow';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ActivityLog {
  id: string;
  scenarioId: string;
  userId: string;
  user: User;
  action: 'created' | 'updated' | 'commented' | 'shared' | 'approved' | 'rejected' | 'accessed';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}