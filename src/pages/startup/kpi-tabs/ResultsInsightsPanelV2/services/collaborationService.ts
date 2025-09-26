/**
 * Collaboration Service
 * 협업 기능 서비스 - 시나리오 공유, 댓글, 승인 워크플로 관리
 */

import type {
  User,
  Comment,
  ShareSettings,
  SharedScenario,
  ApprovalWorkflow,
  ApprovalAction,
  Notification,
  ActivityLog,
  Reaction
} from '../utils';

export class CollaborationService {
  private static instance: CollaborationService;
  private currentUser: User | null = null;
  private users: Map<string, User> = new Map();
  private sharedScenarios: Map<string, SharedScenario> = new Map();
  private comments: Map<string, Comment> = new Map();
  private workflows: Map<string, ApprovalWorkflow> = new Map();
  private notifications: Map<string, Notification[]> = new Map();
  private activityLogs: Map<string, ActivityLog[]> = new Map();

  static getInstance(): CollaborationService {
    if (!CollaborationService.instance) {
      CollaborationService.instance = new CollaborationService();
    }
    return CollaborationService.instance;
  }

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock users
    const mockUsers: User[] = [
      {
        id: 'user1',
        name: '김대표',
        email: 'ceo@company.com',
        role: 'admin',
        department: 'Executive',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: 'user2',
        name: '이재무',
        email: 'cfo@company.com',
        role: 'manager',
        department: 'Finance',
        avatar: '/api/placeholder/32/32'
      },
      {
        id: 'user3',
        name: '박분석',
        email: 'analyst@company.com',
        role: 'analyst',
        department: 'Strategy',
        avatar: '/api/placeholder/32/32'
      }
    ];

    mockUsers.forEach(user => this.users.set(user.id, user));
    this.currentUser = mockUsers[2]; // 현재 사용자를 분석가로 설정
  }

  // User Management
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // Scenario Sharing
  async shareScenario(
    scenarioId: string,
    shareSettings: ShareSettings
  ): Promise<SharedScenario> {
    const shareId = `share_${Date.now()}`;
    const shareUrl = `${window.location.origin}/shared/${shareId}`;

    const sharedScenario: SharedScenario = {
      id: shareId,
      originalScenarioId: scenarioId,
      sharedBy: this.currentUser?.id || 'anonymous',
      shareSettings,
      shareUrl,
      accessCount: 0,
      createdAt: new Date(),
      expiresAt: shareSettings.expiresAt,
      isActive: true,
      comments: []
    };

    this.sharedScenarios.set(shareId, sharedScenario);

    // 활동 로그 추가
    await this.addActivityLog(scenarioId, 'shared', `시나리오를 공유했습니다: ${shareSettings.visibility}`);

    // 알림 발송 (team/company visibility인 경우)
    if (shareSettings.visibility === 'team' || shareSettings.visibility === 'company') {
      await this.createShareNotifications(scenarioId, shareSettings);
    }

    return sharedScenario;
  }

  async getSharedScenario(shareId: string): Promise<SharedScenario | null> {
    const shared = this.sharedScenarios.get(shareId);
    if (!shared || !shared.isActive) return null;

    // 만료 확인
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      shared.isActive = false;
      return null;
    }

    // 접근 카운트 증가
    shared.accessCount++;
    shared.lastAccessedAt = new Date();

    return shared;
  }

  async updateShareSettings(
    shareId: string,
    shareSettings: Partial<ShareSettings>
  ): Promise<SharedScenario | null> {
    const shared = this.sharedScenarios.get(shareId);
    if (!shared) return null;

    shared.shareSettings = { ...shared.shareSettings, ...shareSettings };
    return shared;
  }

  async revokeShare(shareId: string): Promise<boolean> {
    const shared = this.sharedScenarios.get(shareId);
    if (!shared) return false;

    shared.isActive = false;
    return true;
  }

  // Comment System
  async addComment(
    scenarioId: string,
    content: string,
    type: Comment['type'] = 'general',
    parentId?: string
  ): Promise<Comment> {
    if (!this.currentUser) {
      throw new Error('User must be logged in to comment');
    }

    const commentId = `comment_${Date.now()}`;
    const comment: Comment = {
      id: commentId,
      scenarioId,
      authorId: this.currentUser.id,
      author: this.currentUser,
      content,
      type,
      createdAt: new Date(),
      parentId,
      replies: [],
      reactions: [],
      attachments: []
    };

    this.comments.set(commentId, comment);

    // 부모 댓글에 답글 추가
    if (parentId) {
      const parentComment = this.comments.get(parentId);
      if (parentComment) {
        parentComment.replies = parentComment.replies || [];
        parentComment.replies.push(comment);
      }
    }

    // 공유된 시나리오에 댓글 추가
    const sharedScenarios = Array.from(this.sharedScenarios.values())
      .filter(shared => shared.originalScenarioId === scenarioId);

    sharedScenarios.forEach(shared => {
      shared.comments.push(comment);
    });

    // 활동 로그 추가
    await this.addActivityLog(scenarioId, 'commented', `댓글을 작성했습니다: ${content.substring(0, 50)}...`);

    // 멘션 처리
    await this.processMentions(comment);

    return comment;
  }

  async getComments(scenarioId: string): Promise<Comment[]> {
    const comments = Array.from(this.comments.values())
      .filter(comment => comment.scenarioId === scenarioId && !comment.parentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return comments;
  }

  async updateComment(commentId: string, content: string): Promise<Comment | null> {
    const comment = this.comments.get(commentId);
    if (!comment || comment.authorId !== this.currentUser?.id) return null;

    comment.content = content;
    comment.updatedAt = new Date();

    return comment;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const comment = this.comments.get(commentId);
    if (!comment || comment.authorId !== this.currentUser?.id) return false;

    this.comments.delete(commentId);
    return true;
  }

  async addReaction(commentId: string, reactionType: Reaction['type']): Promise<Reaction | null> {
    if (!this.currentUser) return null;

    const comment = this.comments.get(commentId);
    if (!comment) return null;

    // 기존 반응 제거
    comment.reactions = comment.reactions?.filter(r => r.userId !== this.currentUser!.id) || [];

    const reaction: Reaction = {
      id: `reaction_${Date.now()}`,
      userId: this.currentUser.id,
      user: this.currentUser,
      type: reactionType,
      createdAt: new Date()
    };

    comment.reactions.push(reaction);
    return reaction;
  }

  // Approval Workflow
  async createApprovalWorkflow(
    scenarioId: string,
    workflowTemplate: 'simple' | 'standard' | 'complex' = 'standard'
  ): Promise<ApprovalWorkflow> {
    const workflowId = `workflow_${Date.now()}`;
    const stages = this.getWorkflowStages(workflowTemplate);

    const workflow: ApprovalWorkflow = {
      id: workflowId,
      scenarioId,
      status: 'draft',
      currentStage: 0,
      stages,
      submittedBy: this.currentUser?.id || 'anonymous',
      submittedAt: new Date(),
      history: []
    };

    this.workflows.set(workflowId, workflow);

    // 승인 요청 알림 발송
    await this.createApprovalNotifications(workflow);

    return workflow;
  }

  async submitForApproval(workflowId: string): Promise<ApprovalWorkflow | null> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.status !== 'draft') return null;

    workflow.status = 'pending';
    workflow.currentStage = 0;
    workflow.stages[0].status = 'pending';

    // 첫 번째 단계 승인자들에게 알림
    await this.notifyStageApprovers(workflow, 0);

    return workflow;
  }

  async processApproval(
    workflowId: string,
    stageId: string,
    action: 'approved' | 'rejected' | 'revision_requested',
    comment?: string,
    suggestedChanges?: string[]
  ): Promise<ApprovalWorkflow | null> {
    if (!this.currentUser) return null;

    const workflow = this.workflows.get(workflowId);
    if (!workflow) return null;

    const stage = workflow.stages.find(s => s.id === stageId);
    if (!stage || !stage.approvers.includes(this.currentUser.id)) return null;

    const approvalAction: ApprovalAction = {
      id: `action_${Date.now()}`,
      stageId,
      approverId: this.currentUser.id,
      approver: this.currentUser,
      action,
      comment,
      suggestedChanges,
      createdAt: new Date()
    };

    workflow.history.push(approvalAction);

    if (action === 'rejected' || action === 'revision_requested') {
      workflow.status = action === 'rejected' ? 'rejected' : 'revision_requested';
      workflow.finalDecision = 'rejected';
      workflow.rejectionReason = comment;
      workflow.completedAt = new Date();
    } else if (action === 'approved') {
      stage.status = 'approved';

      // 다음 단계 확인
      const nextStageIndex = workflow.currentStage + 1;
      if (nextStageIndex < workflow.stages.length) {
        workflow.currentStage = nextStageIndex;
        workflow.stages[nextStageIndex].status = 'pending';
        await this.notifyStageApprovers(workflow, nextStageIndex);
      } else {
        // 모든 단계 완료
        workflow.status = 'approved';
        workflow.finalDecision = 'approved';
        workflow.completedAt = new Date();
      }
    }

    // 결과 알림
    await this.createApprovalDecisionNotifications(workflow, approvalAction);

    return workflow;
  }

  async getWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  async getWorkflowsByScenario(scenarioId: string): Promise<ApprovalWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.scenarioId === scenarioId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  // Notification System
  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.get(userId) || [];
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      return true;
    }
    return false;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.forEach(notification => {
      notification.isRead = true;
    });
    return true;
  }

  // Activity Logs
  async getActivityLogs(scenarioId: string): Promise<ActivityLog[]> {
    return this.activityLogs.get(scenarioId) || [];
  }

  // Private helper methods
  private getWorkflowStages(template: 'simple' | 'standard' | 'complex') {
    const allUsers = Array.from(this.users.values());
    const admins = allUsers.filter(u => u.role === 'admin');
    const managers = allUsers.filter(u => u.role === 'manager');

    switch (template) {
      case 'simple':
        return [
          {
            id: 'stage_1',
            name: '관리자 승인',
            description: '관리자 최종 승인',
            order: 1,
            approvers: admins.map(u => u.id),
            requiresAll: false,
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2일 후
          }
        ];

      case 'standard':
        return [
          {
            id: 'stage_1',
            name: '부서장 검토',
            description: '부서장 1차 검토',
            order: 1,
            approvers: managers.map(u => u.id),
            requiresAll: false,
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1일 후
          },
          {
            id: 'stage_2',
            name: '경영진 승인',
            description: '경영진 최종 승인',
            order: 2,
            approvers: admins.map(u => u.id),
            requiresAll: false,
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3일 후
          }
        ];

      case 'complex':
        return [
          {
            id: 'stage_1',
            name: '동료 검토',
            description: '동료 분석가 검토',
            order: 1,
            approvers: allUsers.filter(u => u.role === 'analyst').map(u => u.id),
            requiresAll: false,
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
          },
          {
            id: 'stage_2',
            name: '부서장 검토',
            description: '부서장 2차 검토',
            order: 2,
            approvers: managers.map(u => u.id),
            requiresAll: false,
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          },
          {
            id: 'stage_3',
            name: '경영진 승인',
            description: '경영진 최종 승인',
            order: 3,
            approvers: admins.map(u => u.id),
            requiresAll: true, // 모든 경영진 승인 필요
            status: 'pending' as const,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          }
        ];

      default:
        return [];
    }
  }

  private async addActivityLog(
    scenarioId: string,
    action: ActivityLog['action'],
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.currentUser) return;

    const log: ActivityLog = {
      id: `log_${Date.now()}`,
      scenarioId,
      userId: this.currentUser.id,
      user: this.currentUser,
      action,
      description,
      metadata,
      createdAt: new Date()
    };

    const logs = this.activityLogs.get(scenarioId) || [];
    logs.unshift(log);
    this.activityLogs.set(scenarioId, logs);
  }

  private async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    relatedId: string,
    relatedType: Notification['relatedType'],
    actionUrl?: string,
    actionLabel?: string
  ): Promise<void> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${userId}`,
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
      isRead: false,
      createdAt: new Date(),
      actionUrl,
      actionLabel
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    this.notifications.set(userId, userNotifications);
  }

  private async createShareNotifications(scenarioId: string, shareSettings: ShareSettings): Promise<void> {
    const targetUsers = this.getTargetUsersForSharing(shareSettings);
    const sharer = this.currentUser?.name || 'Someone';

    for (const user of targetUsers) {
      await this.createNotification(
        user.id,
        'share',
        '새로운 시나리오 공유',
        `${sharer}님이 시나리오를 공유했습니다.`,
        scenarioId,
        'scenario',
        `/scenarios/${scenarioId}`,
        '시나리오 보기'
      );
    }
  }

  private async createApprovalNotifications(workflow: ApprovalWorkflow): Promise<void> {
    const submitter = this.currentUser?.name || 'Someone';

    for (const approverId of workflow.stages[0].approvers) {
      await this.createNotification(
        approverId,
        'approval_request',
        '승인 요청',
        `${submitter}님이 승인을 요청했습니다.`,
        workflow.id,
        'workflow',
        `/approval/${workflow.id}`,
        '승인 처리하기'
      );
    }
  }

  private async notifyStageApprovers(workflow: ApprovalWorkflow, stageIndex: number): Promise<void> {
    const stage = workflow.stages[stageIndex];
    const submitter = this.users.get(workflow.submittedBy)?.name || 'Someone';

    for (const approverId of stage.approvers) {
      await this.createNotification(
        approverId,
        'approval_request',
        `${stage.name} 승인 요청`,
        `${submitter}님의 시나리오 승인이 필요합니다.`,
        workflow.id,
        'workflow',
        `/approval/${workflow.id}`,
        '승인 처리하기'
      );
    }
  }

  private async createApprovalDecisionNotifications(
    workflow: ApprovalWorkflow,
    action: ApprovalAction
  ): Promise<void> {
    const approver = action.approver.name;
    const submitter = workflow.submittedBy;

    let title = '';
    let message = '';

    switch (action.action) {
      case 'approved':
        title = '승인 완료';
        message = `${approver}님이 승인했습니다.`;
        break;
      case 'rejected':
        title = '승인 거부';
        message = `${approver}님이 승인을 거부했습니다.`;
        break;
      case 'revision_requested':
        title = '수정 요청';
        message = `${approver}님이 수정을 요청했습니다.`;
        break;
    }

    await this.createNotification(
      submitter,
      'approval_decision',
      title,
      message,
      workflow.id,
      'workflow',
      `/scenarios/${workflow.scenarioId}`,
      '시나리오 보기'
    );
  }

  private async processMentions(comment: Comment): Promise<void> {
    const mentionRegex = /@(\w+)/g;
    const matches = comment.content.match(mentionRegex);

    if (matches) {
      const mentionedUsernames = matches.map(match => match.substring(1));
      const mentionedUsers = Array.from(this.users.values())
        .filter(user => mentionedUsernames.includes(user.name));

      for (const user of mentionedUsers) {
        await this.createNotification(
          user.id,
          'mention',
          '멘션 알림',
          `${comment.author.name}님이 댓글에서 언급했습니다.`,
          comment.id,
          'comment',
          `/scenarios/${comment.scenarioId}#comment-${comment.id}`,
          '댓글 보기'
        );
      }

      comment.mentions = mentionedUsers.map(user => user.id);
    }
  }

  private getTargetUsersForSharing(shareSettings: ShareSettings): User[] {
    const allUsers = Array.from(this.users.values());

    switch (shareSettings.visibility) {
      case 'team':
        const currentUserDept = this.currentUser?.department;
        return allUsers.filter(user => user.department === currentUserDept);

      case 'company':
        return allUsers;

      case 'private':
        return shareSettings.allowedUsers
          ? allUsers.filter(user => shareSettings.allowedUsers!.includes(user.id))
          : [];

      default:
        return [];
    }
  }
}