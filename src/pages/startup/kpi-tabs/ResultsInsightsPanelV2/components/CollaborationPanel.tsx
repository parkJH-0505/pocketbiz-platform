/**
 * Collaboration Panel
 * 협업 패널 - 시나리오 공유, 댓글, 승인 워크플로 UI
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  MessageCircle,
  CheckSquare,
  Bell,
  Users,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Brain,
  AlertCircle,
  Settings,
  Eye,
  Lock,
  Globe,
  Copy,
  Download
} from 'lucide-react';
import { CollaborationService } from '../services/collaborationService';
import type {
  User,
  Comment,
  ShareSettings,
  ApprovalWorkflow,
  Notification,
  SharedScenario
} from '../utils';

interface CollaborationPanelProps {
  scenarioId: string;
  scenarioName: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ scenarioId, scenarioName }) => {
  const [activeTab, setActiveTab] = useState<'share' | 'comments' | 'approval' | 'notifications'>('comments');
  const [collaborationService] = useState(() => CollaborationService.getInstance());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sharedScenarios, setSharedScenarios] = useState<SharedScenario[]>([]);

  // 댓글 입력
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // 공유 설정
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    visibility: 'team',
    permissions: {
      canView: true,
      canComment: true,
      canEdit: false,
      canApprove: false,
      canShare: false
    },
    requiresLogin: true
  });

  // 승인 워크플로
  const [selectedWorkflowTemplate, setSelectedWorkflowTemplate] = useState<'simple' | 'standard' | 'complex'>('standard');

  useEffect(() => {
    loadInitialData();
  }, [scenarioId]);

  const loadInitialData = async () => {
    const user = collaborationService.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      const [commentsData, workflowsData, notificationsData] = await Promise.all([
        collaborationService.getComments(scenarioId),
        collaborationService.getWorkflowsByScenario(scenarioId),
        collaborationService.getNotifications(user.id)
      ]);

      setComments(commentsData);
      setWorkflows(workflowsData);
      setNotifications(notificationsData);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    const comment = await collaborationService.addComment(scenarioId, newComment, 'general', replyTo || undefined);
    setComments(prev => [...prev, comment]);
    setNewComment('');
    setReplyTo(null);
  };

  const handleShare = async () => {
    const shared = await collaborationService.shareScenario(scenarioId, shareSettings);
    setSharedScenarios(prev => [...prev, shared]);
  };

  const handleCreateWorkflow = async () => {
    const workflow = await collaborationService.createApprovalWorkflow(scenarioId, selectedWorkflowTemplate);
    await collaborationService.submitForApproval(workflow.id);
    setWorkflows(prev => [...prev, workflow]);
  };

  const handleApproval = async (workflowId: string, stageId: string, action: 'approved' | 'rejected') => {
    const updatedWorkflow = await collaborationService.processApproval(workflowId, stageId, action);
    if (updatedWorkflow) {
      setWorkflows(prev => prev.map(w => w.id === workflowId ? updatedWorkflow : w));
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  const tabs = [
    { key: 'comments', label: '댓글', icon: MessageCircle, count: comments.length },
    { key: 'share', label: '공유', icon: Share2, count: sharedScenarios.length },
    { key: 'approval', label: '승인', icon: CheckSquare, count: workflows.length },
    { key: 'notifications', label: '알림', icon: Bell, count: unreadNotificationCount }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold text-gray-900">협업</h3>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">3명 참여</span>
          </div>
        </div>
        <div className="flex border-t border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* 댓글 탭 */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {/* 댓글 입력 */}
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요... (@멘션 가능)"
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>@멘션, #태그 지원</span>
                    </div>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                      <Send size={14} />
                      전송
                    </button>
                  </div>
                </div>

                {/* 댓글 목록 */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {comment.author.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{comment.author.name}</span>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt.toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              comment.type === 'suggestion' ? 'bg-blue-100 text-blue-800' :
                              comment.type === 'concern' ? 'bg-yellow-100 text-yellow-800' :
                              comment.type === 'approval' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {comment.type}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          <div className="flex items-center gap-3">
                            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                              <ThumbsUp size={14} />
                              <span>{comment.reactions?.filter(r => r.type === 'like').length || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
                              <Heart size={14} />
                              <span>{comment.reactions?.filter(r => r.type === 'heart').length || 0}</span>
                            </button>
                            <button
                              onClick={() => setReplyTo(comment.id)}
                              className="text-sm text-gray-500 hover:text-blue-600"
                            >
                              답글
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 공유 탭 */}
            {activeTab === 'share' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">시나리오 공유 설정</h4>

                  {/* 가시성 설정 */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">공유 범위</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'private', label: '비공개', icon: Lock },
                          { value: 'team', label: '팀', icon: Users },
                          { value: 'company', label: '회사', icon: Eye },
                          { value: 'public', label: '공개', icon: Globe }
                        ].map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              onClick={() => setShareSettings(prev => ({ ...prev, visibility: option.value as any }))}
                              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                                shareSettings.visibility === option.value
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <Icon size={14} />
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 권한 설정 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">권한</label>
                      <div className="space-y-2">
                        {[
                          { key: 'canView', label: '보기' },
                          { key: 'canComment', label: '댓글' },
                          { key: 'canEdit', label: '편집' },
                          { key: 'canShare', label: '공유' }
                        ].map((permission) => (
                          <label key={permission.key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={shareSettings.permissions[permission.key as keyof typeof shareSettings.permissions]}
                              onChange={(e) => setShareSettings(prev => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [permission.key]: e.target.checked
                                }
                              }))}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Share2 size={14} />
                      공유 링크 생성
                    </button>
                  </div>
                </div>

                {/* 기존 공유 목록 */}
                {sharedScenarios.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">기존 공유</h4>
                    {sharedScenarios.map((shared) => (
                      <div key={shared.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{shared.shareSettings.visibility} 공유</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(shared.shareUrl)}
                              className="p-1 text-gray-500 hover:text-blue-600"
                            >
                              <Copy size={14} />
                            </button>
                            <span className="text-xs text-gray-500">
                              {shared.accessCount}회 접근
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          생성: {shared.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 승인 탭 */}
            {activeTab === 'approval' && (
              <div className="space-y-4">
                {/* 새 승인 워크플로 생성 */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">승인 요청</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">워크플로 템플릿</label>
                      <select
                        value={selectedWorkflowTemplate}
                        onChange={(e) => setSelectedWorkflowTemplate(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="simple">간단 (관리자 승인)</option>
                        <option value="standard">표준 (부서장 → 경영진)</option>
                        <option value="complex">복합 (동료 → 부서장 → 경영진)</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateWorkflow}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckSquare size={14} />
                      승인 요청 보내기
                    </button>
                  </div>
                </div>

                {/* 워크플로 목록 */}
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            workflow.status === 'approved' ? 'bg-green-100 text-green-800' :
                            workflow.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            workflow.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {workflow.status}
                          </span>
                          <Clock size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {workflow.submittedAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* 승인 단계 */}
                      <div className="space-y-2">
                        {workflow.stages.map((stage, index) => (
                          <div key={stage.id} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              stage.status === 'approved' ? 'bg-green-500 text-white' :
                              stage.status === 'rejected' ? 'bg-red-500 text-white' :
                              index === workflow.currentStage ? 'bg-blue-500 text-white' :
                              'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-medium">{stage.name}</span>
                              {index === workflow.currentStage && stage.status === 'pending' &&
                               stage.approvers.includes(currentUser?.id || '') && (
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => handleApproval(workflow.id, stage.id, 'approved')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => handleApproval(workflow.id, stage.id, 'rejected')}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                  >
                                    거부
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 알림 탭 */}
            {activeTab === 'notifications' && (
              <div className="space-y-3">
                {notifications.slice(0, 10).map((notification) => (
                  <div key={notification.id} className={`p-3 rounded-lg border ${
                    notification.isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.isRead ? 'bg-gray-300' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{notification.title}</h5>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {notification.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollaborationPanel;