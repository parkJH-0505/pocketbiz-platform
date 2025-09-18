import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../../../contexts/ChatContext';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import { UniversalScheduleModal } from '../../../components/schedule';
import ChatSideModal from '../../../components/chat/ChatSideModal';
import type { GuideMeetingRecord, GuideMeetingComment } from '../../../types/meeting.types';
import type { BuildupProjectMeeting } from '../../../types/schedule.types';
import { EventSourceTracker } from '../../../types/events.types';
import ProjectPhaseIndicator from '../../../components/project/ProjectPhaseIndicator';
import PhaseHistoryDisplay from '../../../components/project/PhaseHistoryDisplay';
import ProjectPhaseTransition from '../../../components/phaseTransition/ProjectPhaseTransition';
import {
  ArrowLeft,
  ArrowRight,
  MoreVertical,
  Clock,
  Users,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Download,
  Upload,
  Edit,
  Trash2,
  Share2,
  Bell,
  Activity,
  Target,
  Briefcase,
  Send,
  Paperclip,
  Image,
  File,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useToast } from '../../../contexts/ToastContext';
import type { Project } from '../../../types/buildup.types';
import {
  PHASE_INFO,
  ALL_PHASES,
  calculatePhaseProgress,
  getPhaseIndex
} from '../../../utils/projectPhaseUtils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: {
    id: string;
    name: string;
    avatar?: string;
  };
  due_date: string;
  tags: string[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  comments: number;
  attachments: number;
}

interface Activity {
  id: string;
  type: 'comment' | 'file' | 'status' | 'assignment' | 'milestone';
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  metadata?: any;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, updateProject } = useBuildupContext();
  const {
    openChatForProject,
    getUnreadCountByProject,
    createChatRoomForProject
  } = useChatContext();
  const { buildupMeetings } = useScheduleContext();
  const { showSuccess, showError, showInfo } = useToast();

  const project = projects.find(p => p.id === projectId);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'meetings' | 'phase-history'>('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<GuideMeetingRecord | null>(null);
  const [newComment, setNewComment] = useState('');

  // 🔥 Sprint 3 Phase 3: 애니메이션 상태
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);
  const [lastPhaseChange, setLastPhaseChange] = useState<{ from: string; to: string } | null>(null);

  // UniversalScheduleModal 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<BuildupProjectMeeting | null>(null);

  // ✅ Step 3을 위한 전문적 이벤트 발송 시스템 (EventSourceTracker 적용)
  const emitProjectMeetingEvent = (eventType: string, data: any) => {
    const eventId = `${projectId}_${eventType}_${Date.now()}`;

    // 🔒 순환 업데이트 방지
    if (!EventSourceTracker.shouldProcess(eventId)) {
      console.warn(`⚠️ ProjectDetail: Duplicate event blocked by EventSourceTracker`, { eventId, eventType });
      return eventId;
    }

    const event = new CustomEvent(`project:meeting_${eventType}`, {
      detail: {
        eventId,
        projectId,
        ...data,
        timestamp: new Date(),
        source: 'project_detail'
      }
    });

    console.log(`📤 ProjectDetail emitting: project:meeting_${eventType}`, {
      eventId,
      projectId,
      data,
      trackerStatus: 'allowed'
    });

    window.dispatchEvent(event);
    return eventId;
  };

  // ✅ Phase Transition 전용 이벤트 발송 (EventSourceTracker 적용)
  const emitPhaseTransitionEvent = (data: any) => {
    const eventId = `${projectId}_phase_transition_${Date.now()}`;

    // 🔒 순환 업데이트 방지
    if (!EventSourceTracker.shouldProcess(eventId)) {
      console.warn(`⚠️ ProjectDetail: Duplicate phase transition blocked`, { eventId });
      return eventId;
    }

    const event = new CustomEvent('project:phase_transition_requested', {
      detail: {
        eventId,
        projectId: project?.id,
        ...data,
        timestamp: new Date(),
        source: 'project_detail'
      }
    });

    console.log(`🔄 ProjectDetail emitting: project:phase_transition_requested`, {
      eventId,
      data,
      trackerStatus: 'allowed'
    });

    window.dispatchEvent(event);
    return eventId;
  };

  // 프로젝트 미팅 필터링
  const projectMeetings = buildupMeetings.filter(m => m.projectId === projectId);

  // ✅ 다음 미팅 계산 (ScheduleContext 기반)
  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return projectMeetings
      .filter(meeting => {
        try {
          const meetingDate = new Date(meeting.date || meeting.startDateTime);
          return meetingDate > now && meeting.status !== 'completed' && meeting.status !== 'cancelled';
        } catch (error) {
          console.warn('Invalid meeting date:', meeting.id, error);
          return false;
        }
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.startDateTime);
        const dateB = new Date(b.date || b.startDateTime);
        return dateA.getTime() - dateB.getTime();
      });
  }, [projectMeetings]);

  const nextMeeting = upcomingMeetings[0];

  // ✅ Step 3을 위한 이벤트 수신 및 Phase Transition 시스템
  useEffect(() => {
    console.log('🔧 ProjectDetail: Setting up event listeners for Step 3 preparation');

    // ScheduleContext에서 발생하는 변경사항 수신
    const handleScheduleChanged = (e: CustomEvent) => {
      const { schedule, operation, source } = e.detail;

      // 현재 프로젝트와 관련된 변경사항만 처리
      if (schedule.type === 'buildup_project' && schedule.projectId === projectId) {
        console.log(`📅 ProjectDetail received schedule change:`, {
          operation,
          scheduleId: schedule.id,
          title: schedule.title,
          source
        });

        // Phase Transition 확인 및 처리
        if (schedule.phaseTransitionTrigger && operation === 'created') {
          const { fromPhase, toPhase } = schedule.phaseTransitionTrigger;

          console.log(`🔄 ProjectDetail detected phase transition trigger:`, {
            fromPhase,
            toPhase,
            scheduleId: schedule.id
          });

          // ✅ 실제 프로젝트 단계 업데이트 실행
          if (project && updateProject) {
            try {
              updateProject(project.id, { phase: toPhase });
              console.log(`✅ ProjectDetail: Phase updated from ${fromPhase} to ${toPhase}`);
            } catch (error) {
              console.error(`❌ ProjectDetail: Failed to update project phase:`, error);
            }
          }

          // Phase Transition 이벤트 발송
          emitPhaseTransitionEvent({
            fromPhase,
            toPhase,
            triggerType: 'meeting_scheduled',
            scheduleId: schedule.id,
            scheduleName: schedule.title,
            actualUpdate: !!project && !!updateProject
          });
        }
      }
    };

    // BuildupContext에서 발생하는 프로젝트 변경사항 수신
    const handleProjectChanged = (e: CustomEvent) => {
      const { projectId: changedProjectId, changeType } = e.detail;

      if (changedProjectId === projectId) {
        console.log(`🏗️ ProjectDetail received project change:`, {
          projectId: changedProjectId,
          changeType
        });

        // 프로젝트 변경 시 관련 미팅도 새로고침 요청
        emitProjectMeetingEvent('refresh_requested', {
          reason: 'project_changed',
          changeType
        });
      }
    };

    // ✅ Step 3: ScheduleContext에서 동기화 완료 이벤트 수신
    const handleSyncCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, scheduleCount, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        console.log(`✅ ProjectDetail received sync completion from ${source}:`, {
          scheduleCount,
          originalEventId
        });
        // UI 새로고침이나 토스트 표시 등 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 생성 완료 이벤트 수신
    const handleCreateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, schedule, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        console.log(`✅ ProjectDetail received create completion from ${source}:`, {
          scheduleId: schedule.id,
          title: schedule.title,
          originalEventId
        });
        // 성공 토스트나 UI 업데이트 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 업데이트 완료 이벤트 수신
    const handleUpdateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, scheduleId, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        console.log(`✅ ProjectDetail received update completion from ${source}:`, {
          scheduleId,
          originalEventId
        });
        // 성공 토스트나 UI 업데이트 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 Phase Transition 완료 이벤트 수신
    const handlePhaseTransitionCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, fromPhase, toPhase, updatedScheduleCount, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        console.log(`✅ ProjectDetail received phase transition completion from ${source}:`, {
          fromPhase,
          toPhase,
          updatedScheduleCount,
          originalEventId
        });
        // Phase 변경 확인 토스트나 UI 업데이트 추후 구현
      }
    };

    // ✅ Step 3: 동기화 에러 이벤트 수신
    const handleSyncError = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, operation, error, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        console.error(`❌ ProjectDetail received sync error from ${source}:`, {
          operation,
          error,
          originalEventId
        });
        // 에러 토스트 표시 추후 구현
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('schedule:changed', handleScheduleChanged);
    window.addEventListener('schedule:created', handleScheduleChanged);
    window.addEventListener('schedule:updated', handleScheduleChanged);
    window.addEventListener('project:changed', handleProjectChanged);

    // ✅ Step 3: 양방향 동기화 이벤트 리스너
    window.addEventListener('schedule:refresh_complete', handleSyncCompleted);
    window.addEventListener('schedule:create_complete', handleCreateCompleted);
    window.addEventListener('schedule:update_complete', handleUpdateCompleted);
    window.addEventListener('schedule:phase_transition_complete', handlePhaseTransitionCompleted);
    window.addEventListener('schedule:sync_error', handleSyncError);
    window.addEventListener('schedule:phase_transition_error', handleSyncError);
    window.addEventListener('schedule:buildup_change_error', handleSyncError);

    // 컴포넌트 마운트 시 현재 상태 로깅
    console.log('📊 ProjectDetail mounted with:', {
      projectId,
      projectMeetingsCount: projectMeetings.length,
      hasProject: !!project,
      scheduleContextConnected: !!buildupMeetings
    });

    // 클린업
    return () => {
      console.log('🧹 ProjectDetail: Cleaning up event listeners');
      window.removeEventListener('schedule:changed', handleScheduleChanged);
      window.removeEventListener('schedule:created', handleScheduleChanged);
      window.removeEventListener('schedule:updated', handleScheduleChanged);
      window.removeEventListener('project:changed', handleProjectChanged);

      // ✅ Step 3: 양방향 동기화 이벤트 리스너 클린업
      window.removeEventListener('schedule:refresh_complete', handleSyncCompleted);
      window.removeEventListener('schedule:create_complete', handleCreateCompleted);
      window.removeEventListener('schedule:update_complete', handleUpdateCompleted);
      window.removeEventListener('schedule:phase_transition_complete', handlePhaseTransitionCompleted);
      window.removeEventListener('schedule:sync_error', handleSyncError);
      window.removeEventListener('schedule:phase_transition_error', handleSyncError);
      window.removeEventListener('schedule:buildup_change_error', handleSyncError);
    };
  }, [projectId, projectMeetings.length, project, buildupMeetings, emitPhaseTransitionEvent, emitProjectMeetingEvent]);

  // 🔥 Sprint 3 Phase 3: Project phase change 실시간 리스너
  useEffect(() => {
    const handlePhaseChanged = (e: CustomEvent) => {
      const { projectId: changedProjectId, fromPhase, toPhase, trigger } = e.detail;

      if (changedProjectId === projectId) {
        console.log(`🎨 ProjectDetail: Phase changed for current project ${projectId}: ${fromPhase} → ${toPhase}`);

        // 애니메이션 효과 시작
        setIsPhaseTransitioning(true);
        setLastPhaseChange({ from: fromPhase, to: toPhase });

        // 애니메이션 후 상태 리셋
        setTimeout(() => {
          setIsPhaseTransitioning(false);
        }, 1500); // 1.5초 애니메이션

        // 3초 후 마지막 변경 상태 클리어
        setTimeout(() => {
          setLastPhaseChange(null);
        }, 3000);
      }
    };

    window.addEventListener('project:phase_changed', handlePhaseChanged);
    return () => {
      window.removeEventListener('project:phase_changed', handlePhaseChanged);
    };
  }, [projectId]);

  // 채팅방 생성 및 읽지 않은 메시지 수 확인
  useEffect(() => {
    if (project) {
      // 프로젝트에 대한 채팅방이 없으면 생성
      createChatRoomForProject(project);
      // 읽지 않은 메시지 수 가져오기
      const count = getUnreadCountByProject(project.id);
      setUnreadCount(count);
    }
  }, [project, createChatRoomForProject, getUnreadCountByProject]);

  // 첫 번째 미팅을 기본 선택 (ScheduleContext 기반)
  useEffect(() => {
    if (projectMeetings.length > 0 && !selectedMeeting) {
      // ScheduleContext의 미팅을 GuideMeetingRecord 형태로 변환
      const firstMeeting = projectMeetings[0];
      const convertedMeeting: GuideMeetingRecord = {
        id: firstMeeting.id,
        title: firstMeeting.title,
        date: new Date(firstMeeting.startDateTime),
        status: firstMeeting.status as 'completed' | 'scheduled' | 'cancelled',
        participants: {
          pm: { name: 'PM', role: 'project_manager' },
          client: { name: '클라이언트', role: 'client' }
        },
        memo: null,
        comments: [],
        unreadCommentCount: 0,
        pmLastChecked: null
      };
      setSelectedMeeting(convertedMeeting);
    }
  }, [projectMeetings, selectedMeeting]);

  // 미팅 선택 핸들러
  const handleMeetingSelect = (meeting: GuideMeetingRecord) => {
    setSelectedMeeting(meeting);
    setNewComment(''); // 댓글 입력 초기화
  };

  // 댓글 추가 핸들러
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedMeeting) return;

    const newCommentObj: GuideMeetingComment = {
      id: `comment-${Date.now()}`,
      meetingId: selectedMeeting.id,
      content: newComment.trim(),
      authorId: 'customer-001',
      authorName: '김대표',
      authorType: 'customer',
      createdAt: new Date(),
      isReadByPM: false
    };

    // 실제로는 API 호출 또는 Context 업데이트
    selectedMeeting.comments.push(newCommentObj);
    selectedMeeting.unreadCommentCount++;
    setNewComment('');
  };

  // 상대 시간 포맷팅
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    return date.toLocaleDateString('ko-KR');
  };

  // 채팅방 열기 핸들러 (모달로 변경)
  const handleOpenChat = () => {
    if (project) {
      setShowChatModal(true);
    }
  };

  // 7단계 기반 진행률 계산
  const calculateProgress = () => {
    if (!project) return null;

    const phase = project.phase || 'contract_pending';
    const progress = calculatePhaseProgress(phase);

    return {
      phase,
      progress,
      phaseIndex: getPhaseIndex(phase),
      phaseInfo: PHASE_INFO[phase]
    };
  };

  const progressData = calculateProgress();
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comment, setComment] = useState('');

  // 통합 활동 피드 데이터
  const projectActivities = [
    {
      id: 'act-001',
      type: 'file_upload',
      category: '파일 활동',
      title: 'IR 덱 초안 v2.0 업로드',
      description: '김수민 PM이 업로드했습니다',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
      icon: 'upload'
    },
    {
      id: 'act-002',
      type: 'message',
      category: '커뮤니케이션',
      title: '클라이언트 피드백 수신',
      description: '"디자인 방향성 조정이 필요합니다"',
      user: project?.team?.client_contact?.name || '정대표',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
      icon: 'message'
    },
    {
      id: 'act-003',
      type: 'file_review',
      category: '파일 활동',
      title: '시장 조사 보고서 검토 완료',
      description: '승인 처리되었습니다',
      user: project?.team?.client_contact?.name || '정대표',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전
      icon: 'check'
    },
    {
      id: 'act-004',
      type: 'phase_update',
      category: '프로젝트 진행',
      title: '프로젝트 단계 업데이트',
      description: '기획 → 설계 단계로 진행',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1일 전
      icon: 'arrow-right'
    },
    {
      id: 'act-005',
      type: 'meeting',
      category: '커뮤니케이션',
      title: '가이드 미팅 1차 완료',
      description: '프로젝트 킥오프 및 요구사항 정리',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2일 전
      icon: 'calendar'
    }
  ];

  // 활동 아이콘 매핑
  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'upload': return Upload;
      case 'message': return MessageSquare;
      case 'check': return CheckCircle;
      case 'arrow-right': return ArrowRight;
      case 'calendar': return Calendar;
      default: return Activity;
    }
  };

  // 활동 카테고리별 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '파일 활동': return 'text-green-600 bg-green-50';
      case '커뮤니케이션': return 'text-blue-600 bg-blue-50';
      case '프로젝트 진행': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // 상대적 시간 표시
  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1일 전';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return timestamp.toLocaleDateString('ko-KR');
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">프로젝트를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/startup/buildup/projects')}
            className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            프로젝트 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Mock data for tasks
  const tasks: Task[] = [
    {
      id: '1',
      title: 'IR 자료 초안 작성',
      description: '투자자 미팅을 위한 IR 자료 초안 준비',
      status: 'in_progress',
      priority: 'high',
      assignee: { id: '1', name: '김혁신' },
      due_date: '2024-01-25',
      tags: ['문서작성', 'IR'],
      subtasks: [
        { id: '1-1', title: '회사 소개 섹션', completed: true },
        { id: '1-2', title: '시장 분석 섹션', completed: true },
        { id: '1-3', title: '비즈니스 모델 섹션', completed: false },
        { id: '1-4', title: '재무 계획 섹션', completed: false }
      ],
      comments: 5,
      attachments: 3
    },
    {
      id: '2',
      title: '사용자 인터뷰 진행',
      description: '타겟 고객 10명 대상 심층 인터뷰',
      status: 'todo',
      priority: 'medium',
      assignee: { id: '2', name: '이기획' },
      due_date: '2024-01-28',
      tags: ['리서치', '고객개발'],
      subtasks: [
        { id: '2-1', title: '인터뷰 대상자 모집', completed: false },
        { id: '2-2', title: '질문지 작성', completed: false },
        { id: '2-3', title: '인터뷰 진행', completed: false },
        { id: '2-4', title: '결과 정리', completed: false }
      ],
      comments: 2,
      attachments: 1
    },
    {
      id: '3',
      title: 'MVP 프로토타입 개발',
      description: '핵심 기능 구현된 MVP 프로토타입',
      status: 'review',
      priority: 'urgent',
      assignee: { id: '3', name: '박개발' },
      due_date: '2024-01-23',
      tags: ['개발', 'MVP'],
      subtasks: [
        { id: '3-1', title: '프론트엔드 구현', completed: true },
        { id: '3-2', title: '백엔드 API', completed: true },
        { id: '3-3', title: '테스트', completed: true },
        { id: '3-4', title: '배포 준비', completed: false }
      ],
      comments: 8,
      attachments: 5
    }
  ];

  // Mock activities
  const activities: Activity[] = [
    {
      id: '1',
      type: 'comment',
      user: { id: '1', name: '김혁신' },
      content: 'IR 자료 초안 검토 부탁드립니다.',
      timestamp: '10분 전'
    },
    {
      id: '2',
      type: 'file',
      user: { id: '2', name: '이기획' },
      content: '사용자 인터뷰 가이드.pdf를 업로드했습니다',
      timestamp: '1시간 전'
    },
    {
      id: '3',
      type: 'status',
      user: { id: '3', name: '박개발' },
      content: 'MVP 프로토타입 개발 작업을 완료로 변경했습니다',
      timestamp: '2시간 전'
    },
    {
      id: '4',
      type: 'milestone',
      user: { id: '1', name: '김혁신' },
      content: 'Phase 1 마일스톤을 완료했습니다',
      timestamp: '어제'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'todo': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return FileText;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return Image;
      case 'mp4':
      case 'avi':
      case 'mov':
        return Video;
      case 'mp3':
      case 'wav':
        return Music;
      case 'zip':
      case 'rar':
        return Archive;
      default:
        return File;
    }
  };

  const tabs = [
    { id: 'overview', label: '개요', icon: Briefcase },
    { id: 'files', label: '파일', icon: FileText },
    { id: 'meetings', label: '미팅 기록', icon: Calendar },
    { id: 'phase-history', label: '단계 이력', icon: Activity }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/startup/buildup/projects')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                  {project.status === 'active' ? '진행중' : 
                   project.status === 'completed' ? '완료' : 
                   project.status === 'review' ? '검토중' : '준비중'}
                </span>
                <span className="text-sm text-gray-600">{project.category}</span>
                <span className="text-sm text-gray-500">
                  {new Date(project.contract.start_date).toLocaleDateString()} - {new Date(project.contract.end_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 채팅방 바로가기 버튼 */}
            <button
              onClick={handleOpenChat}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
              title="프로젝트 채팅방"
            >
              <MessageSquare className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* 🔥 Sprint 3 Phase 3: 애니메이션이 적용된 7단계 진행률 시스템 */}
        {progressData && (
          <div className={`space-y-4 transition-all duration-500 ${
            isPhaseTransitioning ? 'transform scale-105 shadow-lg' : ''
          }`}>
            {/* 상단 정보 */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">프로젝트 단계</span>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-gray-600">현재 단계</span>
                  <span className={`ml-2 font-medium transition-all duration-300 ${
                    isPhaseTransitioning ? 'animate-pulse text-blue-600' : ''
                  }`}>
                    {progressData.phaseInfo.label}
                    {lastPhaseChange && (
                      <span className="ml-2 text-xs text-green-600 animate-fadeIn">
                        새로 변경됨!
                      </span>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">진행률</span>
                  <span className="ml-2 font-medium">{progressData.phaseIndex + 1}/7 단계</span>
                </div>
              </div>
            </div>

            {/* 7단계 진행바 */}
            <div className="relative">
              {/* 배경 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3"></div>

              {/* 진행 바 */}
              <div
                className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ${
                  isPhaseTransitioning
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 animate-pulse'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${progressData.progress}%` }}
              />

              {/* 7단계 점들 */}
              {ALL_PHASES.map((phase, idx) => {
                const phaseProgress = calculatePhaseProgress(phase);
                const isCurrent = phase === progressData.phase;
                const isPassed = phaseProgress <= progressData.progress;
                const phaseData = PHASE_INFO[phase];

                return (
                  <div
                    key={phase}
                    className="absolute group"
                    style={{
                      left: `${(idx / (ALL_PHASES.length - 1)) * 100}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10
                    }}
                  >
                    {/* 점 마커 */}
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all cursor-pointer ${
                      isPassed
                        ? 'bg-blue-600'
                        : isCurrent
                        ? 'bg-blue-400'
                        : 'bg-gray-300'
                    } ${
                      isCurrent
                        ? `ring-2 ring-blue-400 ring-offset-1 scale-110 ${
                            isPhaseTransitioning ? 'animate-bounce ring-green-400' : ''
                          }`
                        : 'hover:scale-110'
                    } ${
                      isPhaseTransitioning && isCurrent ? 'bg-gradient-to-r from-blue-500 to-green-500' : ''
                    }`} />

                    {/* 호버시 단계 정보 표시 */}
                    <div className="hidden group-hover:block absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="text-xs font-semibold">{phaseData.label}</div>
                        <div className="text-[10px] opacity-80">{phaseData.description}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 단계 라벨 */}
            <div className="flex justify-between text-xs text-gray-500 px-1">
              {ALL_PHASES.map((phase, idx) => {
                const phaseData = PHASE_INFO[phase];
                return (
                  <span
                    key={phase}
                    className={`text-center ${phase === progressData.phase ? 'text-blue-600 font-medium' : ''}`}
                    style={{
                      transform: idx === 0 ? 'translateX(0)' :
                                idx === ALL_PHASES.length - 1 ? 'translateX(-100%)' :
                                'translateX(-50%)'
                    }}
                  >
                    {phaseData.shortLabel}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="flex gap-1 mt-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Main Content */}
              <div className="col-span-8 space-y-6">
                {/* Phase Transition Controls */}
                {project && (
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">프로젝트 단계 관리</h3>
                      <p className="text-xs text-gray-500 mt-1">현재 단계 및 단계 전환 관리</p>
                    </div>
                    <div className="p-4">
                      <ProjectPhaseTransition project={project} />
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="text-xs text-gray-500">이번주</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                    <p className="text-xs text-gray-600">완료 작업</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="text-xs text-gray-500">진행중</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">5</p>
                    <p className="text-xs text-gray-600">활성 작업</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <span className="text-xs text-gray-500">팀</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                    <p className="text-xs text-gray-600">참여 인원</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <span className="text-xs text-gray-500">파일</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-xs text-gray-600">총 문서</p>
                  </div>
                </div>

                {/* 프로젝트 활동 */}
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">프로젝트 활동</h3>
                    <p className="text-xs text-gray-500 mt-1">서버 로그 기반 자동 수집</p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {projectActivities.slice(0, 5).map(activity => {
                      const IconComponent = getActivityIcon(activity.icon);
                      return (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* 아이콘 */}
                            <div className={`p-2 rounded-lg ${getCategoryColor(activity.category)}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>

                            {/* 내용 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm">{activity.title}</h4>
                                  <p className="text-xs text-gray-600 mt-0.5">{activity.description}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(activity.category)} font-medium`}>
                                  {activity.category}
                                </span>
                              </div>

                              {/* 메타 정보 */}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {activity.user}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getRelativeTime(activity.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 전체 활동 보기 */}
                  <div className="p-4 border-t border-gray-200">
                    <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                      전체 활동 보기
                    </button>
                  </div>
                </div>

                {/* Recent Files */}
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">최근 파일</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {project.files.slice(0, 4).map(file => {
                      const Icon = getFileIcon(file.name);
                      return (
                        <div key={file.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <Icon className="w-8 h-8 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)}KB · {new Date(file.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Download className="w-4 h-4 text-gray-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-span-4 space-y-6">
                {/* Project Phase Indicator */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <ProjectPhaseIndicator
                    currentPhase={project.phase}
                    progress={calculatePhaseProgress(project)}
                  />
                </div>

                {/* Phase History */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <PhaseHistoryDisplay
                    history={project.phaseHistory}
                    currentPhase={project.phase}
                    compact={true}
                  />
                </div>

                {/* Next Meeting - ✅ ScheduleContext 기반 개선 */}
                {nextMeeting ? (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">다음 미팅</h3>
                      <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ScheduleContext 연동
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        {nextMeeting.title}
                      </p>
                      <p className="text-sm text-gray-700">
                        {(() => {
                          try {
                            const meetingDate = new Date(nextMeeting.date || nextMeeting.startDateTime);
                            return (
                              meetingDate.toLocaleDateString('ko-KR', {
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              }) + ' ' + meetingDate.toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            );
                          } catch (error) {
                            console.error('Date formatting error:', error);
                            return '날짜 정보 오류';
                          }
                        })()}
                      </p>
                      <p className="text-sm text-gray-700">
                        장소: {nextMeeting.location || '미정'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>상태: {nextMeeting.status || 'scheduled'}</span>
                        {nextMeeting.meetingSequence && (
                          <span>• {
                            typeof nextMeeting.meetingSequence === 'string'
                              ? nextMeeting.meetingSequence
                              : nextMeeting.meetingSequence.type || '미팅'
                          }</span>
                        )}
                      </div>
                      {nextMeeting.onlineLink && (
                        <a
                          href={nextMeeting.onlineLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          미팅 참여하기
                          <ArrowLeft className="w-3 h-3 transform rotate-180" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-700">다음 미팅</h3>
                      <span className="ml-auto px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                        ScheduleContext 연동
                      </span>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm mb-2">예정된 미팅이 없습니다.</p>
                      <p className="text-xs text-gray-400">
                        총 {projectMeetings.length}개 미팅 중 {upcomingMeetings.length}개 예정
                      </p>
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">팀 멤버</h3>
                  <div className="space-y-3">
                    {project.team?.pm && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                          {project.team.pm.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{project.team.pm.name}</p>
                          <p className="text-xs text-gray-600">{project.team.pm.role}</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">PM</span>
                      </div>
                    )}
                    {project.team?.members?.map(member => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">
                          {member.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400">
                      + 멤버 추가
                    </button>
                  </div>
                </div>


                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">빠른 작업</h3>
                  <div className="space-y-2">
                    <button className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      <PlusCircle className="w-4 h-4" />
                      새 작업 추가
                    </button>
                    <button className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      <Upload className="w-4 h-4" />
                      파일 업로드
                    </button>
                    <button className="w-full py-2 px-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600">
                      <Calendar className="w-4 h-4" />
                      가이드 미팅 요청
                    </button>
                    <button
                      onClick={handleOpenChat}
                      className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium relative"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>PM과 대화하기</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미팅 기록 Tab */}
        {activeTab === 'meetings' && (
          <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-900 mb-2">가이드 미팅 기록</h2>
              <p className="text-sm text-gray-600">프로젝트 진행 중 실시된 모든 가이드 미팅 내역 및 PM 메모</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-blue-600 font-medium">
                  📅 총 {projectMeetings.length}개 미팅 (ScheduleContext 연동)
                </span>
                {projectMeetings.length > 0 && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✅ 실시간 동기화 활성
                  </span>
                )}
              </div>
            </div>

            {projectMeetings.length === 0 ? (
              /* ✅ ScheduleContext 기반 Empty State */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">프로젝트 미팅이 없습니다</h3>
                  <p className="text-gray-500 mb-4">
                    ScheduleContext에서 {projectId} 프로젝트의 미팅을 찾을 수 없습니다.<br/>
                    새 미팅을 생성하여 프로젝트를 시작해보세요.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedSchedule(null);
                      setScheduleModalMode('create');
                      setShowScheduleModal(true);
                      // 이벤트 발송
                      emitProjectMeetingEvent('create_requested', {
                        projectId,
                        source: 'empty_state'
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <PlusCircle className="w-4 h-4" />
                    첫 번째 미팅 생성
                  </button>
                </div>
              </div>
            ) : (
              /* 3단 레이아웃 */
              <div className="flex-1 flex bg-gray-50">
                {/* 1. 미팅 목록 (왼쪽 20%) */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">미팅 목록</h3>
                        <p className="text-xs text-gray-500 mt-1">{projectMeetings.length}개 미팅</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSchedule(null);
                          setScheduleModalMode('create');
                          setShowScheduleModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-1"
                      >
                        <PlusCircle className="w-4 h-4" />
                        미팅 추가
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {/* ✅ ScheduleContext 단일 데이터 소스 */}
                    {projectMeetings.map((meeting, index) => {
                      const isSelected = selectedSchedule?.id === meeting.id;
                      return (
                        <button
                          key={meeting.id}
                          onClick={() => {
                            setSelectedSchedule(meeting);
                            setScheduleModalMode('view');
                            setShowScheduleModal(true);
                            // 이벤트 발송
                            emitProjectMeetingEvent('selected', {
                              meetingId: meeting.id,
                              meetingTitle: meeting.title
                            });
                          }}
                          className={`w-full p-4 text-left border-b border-gray-100 transition-all hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 pt-1">
                              <div className={`w-3 h-3 rounded-full ${
                                meeting.status === 'completed'
                                  ? 'bg-green-500'
                                  : meeting.status === 'scheduled'
                                  ? 'bg-blue-500'
                                  : meeting.status === 'cancelled'
                                  ? 'bg-red-500'
                                  : 'bg-gray-300'
                              }`} />
                              {index < projectMeetings.length - 1 && (
                                <div className="w-0.5 h-12 bg-gray-200 ml-1 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                  {meeting.title}
                                </h4>
                                {meeting.meetingSequence && (
                                  <span className="text-xs text-blue-600 font-medium">
                                    {meeting.meetingSequence.type === 'pre_meeting' ? '프리미팅' :
                                     meeting.meetingSequence.type === 'guide_1' ? '가이드 1차' :
                                     meeting.meetingSequence.type === 'guide_2' ? '가이드 2차' :
                                     meeting.meetingSequence.type === 'guide_3' ? '가이드 3차' :
                                     meeting.meetingSequence.type === 'guide_4' ? '가이드 4차' : ''}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {new Date(meeting.startDateTime).toLocaleDateString('ko-KR')}
                                {' '}
                                {new Date(meeting.startDateTime).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  meeting.status === 'completed'
                                    ? 'text-green-700 bg-green-100'
                                    : meeting.status === 'scheduled'
                                    ? 'text-blue-700 bg-blue-100'
                                    : meeting.status === 'cancelled'
                                    ? 'text-red-700 bg-red-100'
                                    : 'text-gray-700 bg-gray-100'
                                }`}>
                                  {meeting.status === 'completed' ? '완료' :
                                   meeting.status === 'scheduled' ? '예정' :
                                   meeting.status === 'cancelled' ? '취소' : '연기'}
                                </span>
                                {meeting.phaseTransitionTrigger && (
                                  <span className="ml-2 text-xs text-purple-600 font-medium">
                                    🔄 단계 전환
                                  </span>
                                )}
                                <span className="ml-2 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                  Schedule#{meeting.id.slice(-6)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PM 미팅 메모 (가운데 50%) */}
                <div className="flex-1 bg-white border-r border-gray-200 flex flex-col">
                  {selectedMeeting ? (
                    <>
                      {/* 메모 헤더 */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedMeeting.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedMeeting.date.toLocaleDateString('ko-KR')} •
                              {selectedMeeting.duration ? `${selectedMeeting.duration}분` : '시간 미정'} •
                              {selectedMeeting.location || '장소 미정'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Download className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" title="PDF 다운로드" />
                            <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" title="인쇄" />
                          </div>
                        </div>
                      </div>

                      {/* 메모 내용 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {selectedMeeting.memo ? (
                          <div className="prose prose-sm max-w-none">
                            {/* 미팅 요약 */}
                            <div className="mb-6">
                              <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                                <Target className="w-4 h-4 mr-2 text-blue-500" />
                                미팅 요약
                              </h4>
                              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                                {selectedMeeting.memo.summary}
                              </p>
                            </div>

                            {/* 주요 논의사항 */}
                            {selectedMeeting.memo.discussions.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
                                  주요 논의사항
                                </h4>
                                <ul className="space-y-2">
                                  {selectedMeeting.memo.discussions.map((item, index) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700">
                                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 결정사항 */}
                            {selectedMeeting.memo.decisions.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <CheckCircle className="w-4 h-4 mr-2 text-purple-500" />
                                  결정사항
                                </h4>
                                <ul className="space-y-2">
                                  {selectedMeeting.memo.decisions.map((item, index) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700">
                                      <CheckCircle className="w-4 h-4 text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 액션 아이템 */}
                            {selectedMeeting.memo.actionItems.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                                  액션 아이템
                                </h4>
                                <ul className="space-y-2">
                                  {selectedMeeting.memo.actionItems.map((item, index) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700 bg-orange-50 p-2 rounded">
                                      <Clock className="w-4 h-4 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 다음 단계 */}
                            {selectedMeeting.memo.nextSteps && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                                  다음 단계
                                </h4>
                                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                  {selectedMeeting.memo.nextSteps}
                                </p>
                              </div>
                            )}

                            {/* 첨부파일 */}
                            {selectedMeeting.memo.attachments.length > 0 && (
                              <div className="mb-4">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <Paperclip className="w-4 h-4 mr-2 text-gray-500" />
                                  첨부파일
                                </h4>
                                <div className="space-y-2">
                                  {selectedMeeting.memo.attachments.map((file) => (
                                    <div key={file.id} className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                                      <FileText className="w-4 h-4 text-blue-500 mr-3" />
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                          {(file.size / 1024 / 1024).toFixed(1)}MB • {file.uploadedAt.toLocaleDateString('ko-KR')}
                                        </p>
                                      </div>
                                      <Download className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 메모 작성 정보 */}
                            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
                              <p>작성자: {selectedMeeting.participants.pm.name} PM</p>
                              <p>작성일: {selectedMeeting.memo.createdAt.toLocaleDateString('ko-KR')} {selectedMeeting.memo.createdAt.toLocaleTimeString('ko-KR')}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <h4 className="text-lg font-semibold text-gray-700 mb-2">미팅 메모 없음</h4>
                              <p className="text-gray-500">PM이 아직 미팅 메모를 작성하지 않았습니다</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">미팅을 선택해주세요</p>
                    </div>
                  )}
                </div>

                {/* 3. 댓글/피드백 (오른쪽 30%) */}
                <div className="w-96 bg-white flex flex-col">
                  {selectedMeeting ? (
                    <>
                      {/* 댓글 헤더 */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">댓글 & 피드백</h3>
                          <div className="text-xs text-gray-500">
                            {selectedMeeting.pmLastChecked ? (
                              <span className="text-green-600">✓ PM 확인: {formatRelativeTime(selectedMeeting.pmLastChecked)}</span>
                            ) : (
                              <span className="text-gray-500">PM 미확인</span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          댓글 {selectedMeeting.comments.length}개 • 미확인 {selectedMeeting.unreadCommentCount}개
                        </p>
                      </div>

                      {/* 댓글 목록 */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedMeeting.comments.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-500">아직 댓글이 없습니다</p>
                          </div>
                        ) : (
                          selectedMeeting.comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {comment.authorName}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    comment.authorType === 'pm'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {comment.authorType === 'pm' ? 'PM' : '고객'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500">
                                    {formatRelativeTime(comment.createdAt)}
                                  </span>
                                  {comment.isReadByPM && (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" title="PM 확인" />
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {comment.content}
                              </p>
                              {comment.attachments && comment.attachments.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {comment.attachments.map((file) => (
                                    <div key={file.id} className="flex items-center space-x-2 text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
                                      <Paperclip className="w-3 h-3" />
                                      <span>{file.name}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* 댓글 작성 */}
                      <div className="p-4 border-t border-gray-200">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="미팅에 대한 피드백이나 질문을 남겨보세요..."
                          className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            className={`px-4 py-2 text-sm rounded-lg transition-all ${
                              newComment.trim()
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            댓글 작성
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">미팅을 선택해주세요</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🔥 Sprint 3 Phase 3: 개선된 Phase History Tab */}
        {activeTab === 'phase-history' && (
          <div className="p-6 max-w-4xl mx-auto">
            {/* 최근 변경사항 알림 */}
            {lastPhaseChange && (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">단계 전환 완료</h3>
                    <p className="text-sm text-gray-600">
                      {PHASE_LABELS[lastPhaseChange.from]} → {PHASE_LABELS[lastPhaseChange.to]}으로 전환되었습니다
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={`bg-white rounded-xl border border-gray-200 p-6 transition-all duration-300 ${
              isPhaseTransitioning ? 'ring-2 ring-blue-200 shadow-lg' : ''
            }`}>
              <PhaseHistoryDisplay
                history={project.phaseHistory}
                currentPhase={project.phase}
                compact={false}
              />
            </div>
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="파일 검색..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>모든 파일</option>
                  <option>문서</option>
                  <option>이미지</option>
                  <option>비디오</option>
                  <option>기타</option>
                </select>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                파일 업로드
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      파일명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      크기
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업로드
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업로더
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.files.map(file => {
                    const Icon = getFileIcon(file.name);
                    return (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Icon className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{file.name}</div>
                              <div className="text-sm text-gray-500">{file.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)}KB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(file.uploaded_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.uploaded_by}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">팀 멤버</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                멤버 초대
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {project.team?.pm && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                      {project.team.pm.name[0]}
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">PM</span>
                  </div>
                  <h3 className="font-medium text-gray-900">{project.team.pm.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{project.team.pm.role}</p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span>작업 8개 담당</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>이번주 32시간</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                    <button className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                      메시지
                    </button>
                    <button className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                      프로필
                    </button>
                  </div>
                </div>
              )}

              {project.team?.members?.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center text-white text-lg">
                      {member.name[0]}
                    </div>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {member.role}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{member.role}</p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      <span>작업 5개 담당</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>이번주 20시간</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                    <button className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                      메시지
                    </button>
                    <button className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                      프로필
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Member Card */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center min-h-[200px]">
                <button className="text-center">
                  <PlusCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">새 멤버 추가</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Activity Feed */}
              <div className="col-span-8">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">활동 피드</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {activities.map(activity => (
                      <div key={activity.id} className="p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                            {activity.user.name[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {activity.user.name}
                              </span>
                              <span className="text-xs text-gray-500">{activity.timestamp}</span>
                            </div>
                            <p className="text-sm text-gray-600">{activity.content}</p>
                            {activity.type === 'comment' && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">{activity.metadata?.text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Box */}
                <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                      김
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-gray-600">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600">
                            <Image className="w-4 h-4" />
                          </button>
                        </div>
                        <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
                          <Send className="w-3 h-3" />
                          전송
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Stats */}
              <div className="col-span-4 space-y-4">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">이번주 활동</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">작업 완료</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">댓글</span>
                      <span className="font-medium">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">파일 업로드</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">가이드 미팅</span>
                      <span className="font-medium">3회</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">가장 활발한 멤버</h3>
                  <div className="space-y-3">
                    {project.team?.pm && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                          {project.team.pm.name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{project.team.pm.name}</p>
                          <p className="text-xs text-gray-600">활동 28회</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 채팅 사이드 모달 */}
      {showChatModal && project && (
        <ChatSideModal
          projectId={project.id}
          projectTitle={project.title}
          onClose={() => setShowChatModal(false)}
        />
      )}

      {/* Universal Schedule Modal */}
      <UniversalScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule || undefined}
        mode={scheduleModalMode}
        defaultType="buildup_project"
        projectId={projectId}
        onSuccess={(schedule) => {
          console.log('✅ ProjectDetail: Schedule saved successfully:', schedule);

          // ✅ Step 3: 실시간 양방향 동기화 트리거
          const operation = scheduleModalMode === 'create' ? 'created' : 'updated';
          const scheduleOperation = scheduleModalMode === 'create' ? 'create_meeting' : 'update_meeting';

          // 1. ScheduleContext로 동기화 요청 발송
          const eventId = `${projectId}_sync_${scheduleOperation}_${Date.now()}`;
          const syncEvent = new CustomEvent('schedule:sync_requested', {
            detail: {
              eventId,
              source: 'ProjectDetail',
              projectId,
              meeting: {
                id: schedule.id,
                title: schedule.title,
                description: schedule.description,
                date: schedule.date,
                startDateTime: schedule.startDateTime,
                endDateTime: schedule.endDateTime,
                meetingSequence: (schedule as BuildupProjectMeeting).meetingSequence,
                agenda: (schedule as BuildupProjectMeeting).agenda,
                deliverables: (schedule as BuildupProjectMeeting).deliverables,
                participants: schedule.participants,
                location: schedule.location,
                status: schedule.status,
                phaseTransitionTrigger: (schedule as BuildupProjectMeeting).phaseTransitionTrigger
              },
              operation: scheduleOperation,
              timestamp: new Date(),
              modalMode: scheduleModalMode
            }
          });

          console.log(`📤 ProjectDetail: Sending sync request to ScheduleContext`, {
            eventId,
            operation: scheduleOperation,
            scheduleId: schedule.id,
            title: schedule.title
          });

          window.dispatchEvent(syncEvent);

          // 2. 기존 프로젝트 이벤트도 유지 (호환성)
          emitProjectMeetingEvent(operation, {
            schedule,
            operation,
            modalMode: scheduleModalMode,
            timestamp: new Date()
          });

          // 3. Phase Transition 처리
          if (schedule.phaseTransitionTrigger && operation === 'created') {
            const { fromPhase, toPhase } = schedule.phaseTransitionTrigger;

            console.log(`🔄 ProjectDetail: Triggering phase transition from modal success`);

            // 실제 프로젝트 단계 업데이트 실행
            if (project && updateProject) {
              try {
                updateProject(project.id, { phase: toPhase });
                console.log(`✅ ProjectDetail: Phase updated from ${fromPhase} to ${toPhase} (modal success)`);

                // ScheduleContext로 Phase Transition 알림
                const phaseEventId = `${projectId}_phase_${fromPhase}_to_${toPhase}_${Date.now()}`;
                const phaseTransitionEvent = new CustomEvent('project:phase_transition_requested', {
                  detail: {
                    eventId: phaseEventId,
                    source: 'ProjectDetail',
                    projectId,
                    fromPhase,
                    toPhase,
                    scheduleId: schedule.id,
                    triggerType: 'meeting_scheduled',
                    timestamp: new Date()
                  }
                });

                console.log(`📤 ProjectDetail: Sending phase transition to ScheduleContext`, {
                  eventId: phaseEventId,
                  fromPhase,
                  toPhase,
                  scheduleId: schedule.id
                });

                window.dispatchEvent(phaseTransitionEvent);

              } catch (error) {
                console.error(`❌ ProjectDetail: Failed to update project phase (modal):`, error);
              }
            }

            // 기존 이벤트도 유지 (호환성)
            emitPhaseTransitionEvent({
              fromPhase,
              toPhase,
              triggerType: 'meeting_scheduled',
              scheduleId: schedule.id,
              scheduleName: schedule.title,
              source: 'modal_success',
              actualUpdate: !!project && !!updateProject
            });
          }

          // 4. BuildupContext로 데이터 변경 알림 (필요시)
          if (operation === 'created') {
            const buildupChangeEvent = new CustomEvent('buildup:data_changed', {
              detail: {
                eventId: `${projectId}_buildup_meeting_added_${Date.now()}`,
                source: 'ProjectDetail',
                projectId,
                changeType: 'meeting_added',
                data: {
                  meeting: schedule,
                  projectPhase: project?.phase
                },
                timestamp: new Date()
              }
            });

            console.log(`📤 ProjectDetail: Notifying BuildupContext of meeting addition`);
            window.dispatchEvent(buildupChangeEvent);
          }

          // 성공 토스트 표시
          showSuccess(`미팅이 성공적으로 ${operation === 'created' ? '생성' : '수정'}되었습니다: ${schedule.title}`);
        }}
      />
    </div>
  );
}