import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatContext } from '../../../contexts/ChatContext';
import { useScheduleContext } from '../../../contexts/ScheduleContext';
import { UniversalScheduleModal } from '../../../components/schedule';
import ChatSideModal from '../../../components/chat/ChatSideModal';
import type { GuideMeetingRecord, GuideMeetingComment } from '../../../types/meeting.types';
import type { BuildupProjectMeeting } from '../../../types/schedule.types';
import { EventSourceTracker } from '../../../types/events.types';
import { MEETING_TYPE_CONFIG } from '../../../types/meeting.enhanced.types';
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
  Zap,
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
  Archive,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import { useVDRContext } from '../../../contexts/VDRContext';
import { useToast } from '../../../contexts/ToastContext';
import { useMeetingNotes } from '../../../contexts/MeetingNotesContext';
import type { Project } from '../../../types/buildup.types';
import {
  PHASE_INFO,
  ALL_PHASES,
  calculatePhaseProgress,
  getPhaseIndex
} from '../../../utils/projectPhaseUtils';
import OverviewTabV3 from '../../../components/overview/OverviewTabV3';
import TimelineErrorBoundary from '../../../components/error/TimelineErrorBoundary';

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
  const { projects, updateProject, addFileToProject, removeFileFromProject } = useBuildupContext();
  const { documents } = useVDRContext();
  const {
    openChatForProject,
    getUnreadCountByProject,
    createChatRoomForProject
  } = useChatContext();
  const { buildupMeetings, createSchedule } = useScheduleContext();
  const { showSuccess, showError, showInfo } = useToast();
  const {
    notes,
    actionItems,
    getNotes,
    createNotes,
    updateNotes,
    getActionItemsByMeeting,
    createActionItem,
    updateActionItem,
    getNotesTemplate
  } = useMeetingNotes();

  const project = projects.find(p => p.id === projectId);

  // 해당 프로젝트와 연결된 VDR 문서들 필터링
  const projectDocuments = useMemo(() => {
    return documents.filter(doc => doc.projectId === projectId);
  }, [documents, projectId]);

  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'meetings' | 'phase-history'>('overview');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<GuideMeetingRecord | null>(null);
  const [selectedMeetingNotes, setSelectedMeetingNotes] = useState<any>(null);
  const [selectedMeetingActionItems, setSelectedMeetingActionItems] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 파일 업로드 상태
  const [fileCategory, setFileCategory] = useState('document');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'summary' | 'comments'>('comments'); // 기본값을 댓글로
  const [isProgressBarCollapsed, setIsProgressBarCollapsed] = useState(() => {
    // localStorage에서 접힌 상태 복원
    const saved = localStorage.getItem(`project-${projectId}-progress-collapsed`);
    return saved === 'true';
  });

  // 동적 활동 피드 상태
  const [dynamicActivities, setDynamicActivities] = useState<any[]>([]);

  // 진행바 접기/펼치기 토글
  const toggleProgressBar = () => {
    const newState = !isProgressBarCollapsed;
    setIsProgressBarCollapsed(newState);
    localStorage.setItem(`project-${projectId}-progress-collapsed`, String(newState));
  };

  // 미팅별 댓글 저장 (로컬 상태)
  const [meetingComments, setMeetingComments] = useState<Record<string, Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
  }>>>({});

  // 🔥 Sprint 3 Phase 3: 애니메이션 상태
  const [isPhaseTransitioning, setIsPhaseTransitioning] = useState(false);
  const [lastPhaseChange, setLastPhaseChange] = useState<{ from: string; to: string } | null>(null);

  // UniversalScheduleModal 상태
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<BuildupProjectMeeting | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false); // Sprint 5 추가

  // Sprint 5: Phase별 미팅 타입 매핑
  const PHASE_TO_MEETING = {
    'contract_pending': 'pre_meeting',     // 계약 대기 → 사전 미팅
    'contract_signed': 'guide_1st',        // 계약 완료 → 가이드 1차
    'planning': 'guide_2nd',               // 기획 → 가이드 2차
    'design': 'guide_3rd',                 // 설계 → 가이드 3차
    'execution': 'guide_4th',              // 실행 → 가이드 4차
    'review': 'post_meeting',              // 검토 → 사후 미팅
    'completed': 'post_meeting'            // 완료 → 사후 미팅
  };

  // Sprint 5: 다음 미팅 타입 결정 함수
  const getNextMeetingType = (currentPhase: string): string => {
    return PHASE_TO_MEETING[currentPhase as keyof typeof PHASE_TO_MEETING] || 'general_meeting';
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !project) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await addFileToProject(project.id, files[i], fileCategory);
      }
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setIsUploading(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileDelete = (fileId: string) => {
    if (project && window.confirm('이 파일을 삭제하시겠습니까?')) {
      removeFileFromProject(project.id, fileId);
    }
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  // VDR 업로드 결과 처리
  useEffect(() => {
    const handleUploadSuccess = (event: CustomEvent) => {
      const { projectId, fileName } = event.detail;
      if (projectId === project?.id) {
        setIsUploading(false);
        showSuccess(`파일 "${fileName}"이 VDR에 성공적으로 업로드되었습니다.`);

        // 활동 피드에 업로드 이벤트 추가
        const newActivity = {
          id: `act-upload-${Date.now()}`,
          type: 'file_upload',
          category: '파일 활동',
          title: `${fileName} 업로드`,
          description: `${project?.team?.pm?.name || '팀원'}이 VDR에 업로드했습니다`,
          user: project?.team?.pm?.name || '팀원',
          timestamp: new Date(),
          icon: 'upload'
        };

        setDynamicActivities(prev => [newActivity, ...prev]);

        // 파일 입력 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    const handleUploadError = (event: CustomEvent) => {
      const { projectId, fileName, error } = event.detail;
      if (projectId === project?.id) {
        setIsUploading(false);
        showError(`파일 "${fileName}" 업로드 실패: ${error}`);
      }
    };

    window.addEventListener('project-file-upload-success', handleUploadSuccess as EventListener);
    window.addEventListener('project-file-upload-error', handleUploadError as EventListener);

    return () => {
      window.removeEventListener('project-file-upload-success', handleUploadSuccess as EventListener);
      window.removeEventListener('project-file-upload-error', handleUploadError as EventListener);
    };
  }, [project?.id, showSuccess, showError]);

  const handleFileDownload = (file: any) => {
    if (file.url.startsWith('data:')) {
      // Base64 데이터인 경우 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // 일반 URL인 경우
      window.open(file.url, '_blank');
    }
  };

  // Sprint 5: 미팅 예약 핸들러
  const handleScheduleMeeting = async (scheduleData: any) => {
    try {
      // 1. 미팅 생성 (이벤트 자동 발생)
      const newMeeting = await createSchedule({
        ...scheduleData,
        type: 'buildup_project',
        projectId: project?.id,
        meetingSequence: getNextMeetingType(project?.phase || 'contract_pending')
      });

      showSuccess('미팅이 성공적으로 예약되었습니다.');

      // 2. UI 닫기
      setIsScheduleModalOpen(false);
      setShowScheduleModal(false);

      // 3. Phase 전환은 이벤트 시스템이 자동 처리
      // ScheduleContext → Event → PhaseTransitionManager

    } catch (error) {
      console.error('❌ 미팅 예약 실패:', error);
      showError('미팅 예약에 실패했습니다.');
    }
  };

  // 🚀 Sprint 6 Phase 6-3: 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + E: 편집 모드 토글
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && activeTab === 'meetings') {
        event.preventDefault();
        setIsEditMode(!isEditMode);
        showInfo(`편집 모드 ${!isEditMode ? '활성화' : '비활성화'}`);
      }

      // Ctrl/Cmd + S: 노트 저장
      if ((event.ctrlKey || event.metaKey) && event.key === 's' && activeTab === 'meetings' && selectedMeetingNotes) {
        event.preventDefault();
        const updatedNotes = updateNotes(selectedSchedule!.id, selectedMeetingNotes);
        setSelectedMeetingNotes(updatedNotes);
        showSuccess('미팅 노트가 저장되었습니다.');
      }

      // Escape: 검색 초기화
      if (event.key === 'Escape' && activeTab === 'meetings') {
        setSearchTerm('');
      }

      // Ctrl/Cmd + /: 검색 포커스
      if ((event.ctrlKey || event.metaKey) && event.key === '/' && activeTab === 'meetings') {
        event.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="검색"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, isEditMode, selectedMeetingNotes, selectedSchedule]);

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

    // ScheduleContext에서 발생하는 변경사항 수신
    const handleScheduleChanged = (e: CustomEvent) => {
      const { schedule, operation, source } = e.detail;

      // 현재 프로젝트와 관련된 변경사항만 처리
      if (schedule.type === 'buildup_project' && schedule.projectId === projectId) {

        // Phase Transition 확인 및 처리
        if (schedule.phaseTransitionTrigger && operation === 'created') {
          const { fromPhase, toPhase } = schedule.phaseTransitionTrigger;

          // ✅ 실제 프로젝트 단계 업데이트 실행
          if (project && updateProject) {
            try {
              updateProject(project.id, { phase: toPhase });
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
        // 프로젝트 변경 감지됨

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
        // 스케줄 생성 완료 확인됨
        // UI 새로고침이나 토스트 표시 등 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 생성 완료 이벤트 수신
    const handleCreateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, schedule, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        // 스케줄 생성 성공 확인됨
        // 성공 토스트나 UI 업데이트 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 업데이트 완료 이벤트 수신
    const handleUpdateCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, scheduleId, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        // 업데이트 완료 확인됨
        // 성공 토스트나 UI 업데이트 추후 구현
      }
    };

    // ✅ Step 3: ScheduleContext에서 Phase Transition 완료 이벤트 수신
    const handlePhaseTransitionCompleted = (e: CustomEvent) => {
      const { source, projectId: syncProjectId, fromPhase, toPhase, updatedScheduleCount, originalEventId } = e.detail;

      if (syncProjectId === projectId) {
        // Phase Transition 완료 확인됨
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

    // 컴포넌트 마운트 시 현재 상태 확인 (Sprint 5 완료 후 제거 예정)
    if (process.env.NODE_ENV === 'development') {
      // ProjectDetail 컴포넌트 상태 확인됨
    }

    // 클린업
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🧹 ProjectDetail: Cleaning up event listeners');
      }
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
  }, [projectId, projectMeetings.length, emitPhaseTransitionEvent, emitProjectMeetingEvent]);

  // 🔥 Sprint 3 Phase 3: Project phase change 실시간 리스너
  useEffect(() => {
    const handlePhaseChanged = (e: CustomEvent) => {
      const { projectId: changedProjectId, fromPhase, toPhase, trigger } = e.detail;

      if (changedProjectId === projectId) {

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

  // 댓글 데이터 로드 (로컬스토리지에서)
  useEffect(() => {
    const savedComments = localStorage.getItem(`meetingComments_${projectId}`);
    if (savedComments) {
      try {
        const parsedComments = JSON.parse(savedComments);
        setMeetingComments(parsedComments);
      } catch (error) {
        console.error('Failed to load meeting comments:', error);
      }
    } else {
      // 샘플 댓글 데이터 (초기 데모용)
      const sampleComments: Record<string, Array<{ id: string; content: string; author: string; timestamp: string }>> = {};
      projectMeetings.forEach(meeting => {
        if (meeting.status === 'completed') {
          sampleComments[meeting.id] = [
            {
              id: `sample-${meeting.id}-1`,
              content: '미팅 준비사항 모두 확인했습니다. IR 자료 최종본 준비 완료했어요.',
              author: '김대표',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: `sample-${meeting.id}-2`,
              content: '수고하셨습니다! 다음 미팅에서 논의할 액션아이템 정리해서 공유드릴게요.',
              author: '박PM',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
        }
      });
      if (Object.keys(sampleComments).length > 0) {
        setMeetingComments(sampleComments);
      }
    }
  }, [projectId, projectMeetings.length]); // projectMeetings 대신 length만 체크

  // 댓글 데이터 저장 (로컬스토리지에)
  useEffect(() => {
    if (Object.keys(meetingComments).length > 0) {
      localStorage.setItem(`meetingComments_${projectId}`, JSON.stringify(meetingComments));
    }
  }, [meetingComments, projectId]);

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

  // 통합 활동 피드 데이터 - 정적 활동들
  const staticProjectActivities = [
    {
      id: 'act-001',
      type: 'file_upload',
      category: '파일 활동',
      title: 'IR 덱 초안 v2.0 업로드',
      description: '김수민 PM이 업로드했습니다',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3일 전
      icon: 'upload'
    },
    {
      id: 'act-002',
      type: 'message',
      category: '커뮤니케이션',
      title: '클라이언트 피드백 수신',
      description: '"디자인 방향성 조정이 필요합니다"',
      user: project?.team?.client_contact?.name || '정대표',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5일 전
      icon: 'message'
    },
    {
      id: 'act-003',
      type: 'file_review',
      category: '파일 활동',
      title: '시장 조사 보고서 검토 완료',
      description: '승인 처리되었습니다',
      user: project?.team?.client_contact?.name || '정대표',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7일 전
      icon: 'check'
    },
    {
      id: 'act-004',
      type: 'phase_update',
      category: '프로젝트 진행',
      title: '프로젝트 단계 업데이트',
      description: '기획 → 설계 단계로 진행',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10일 전
      icon: 'arrow-right'
    },
    {
      id: 'act-005',
      type: 'meeting',
      category: '커뮤니케이션',
      title: '가이드 미팅 1차 완료',
      description: '프로젝트 킥오프 및 요구사항 정리',
      user: project?.team?.pm?.name || '김수민',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14일 전
      icon: 'calendar'
    }
  ];

  // 동적 활동과 정적 활동 결합
  const projectActivities = useMemo(() => {
    return [...dynamicActivities, ...staticProjectActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [dynamicActivities]);

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

  // D-day 계산 함수
  const getDaysUntilMeeting = (meetingDateTime: string): number => {
    const now = new Date();
    const meetingDate = new Date(meetingDateTime);
    const diffInTime = meetingDate.getTime() - now.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
    return diffInDays;
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
    { id: 'phase-history', label: '🔧 개발자 모드', icon: Activity, isDev: true }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header - 3분할 Grid 구조 (좌상단, 좌하단, 우측) */}
      <div className="bg-white border-b border-gray-200">
        <div className="grid grid-cols-2 auto-rows-min">
          {/* 좌상단: 프로젝트 정보 (50% 너비) */}
          <div className="col-span-1 px-6 py-6 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <button
                onClick={() => navigate('/startup/buildup/projects')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{project.title}</h1>

                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(project.status)}`}>
                    {project.status === 'active' ? '진행중' :
                     project.status === 'completed' ? '완료' :
                     project.status === 'review' ? '검토중' : '준비중'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">카테고리:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
                      {project.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">기간:</span>
                    <span className="text-sm text-gray-600">
                      {new Date(project.contract.start_date).toLocaleDateString('ko-KR')} - {new Date(project.contract.end_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">팀:</span>
                    <span className="text-sm text-gray-600">
                      {project.team ? Object.keys(project.team).length : 0}명
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 2열 서브그리드 (50% 너비) */}
          <div className="col-span-1 row-span-2 border-l border-gray-100 grid grid-cols-2 grid-rows-1">
            {/* 위치 2-5 통합: 미팅 박스 (우측 왼쪽 열, 세로형) */}
            <div className="col-span-1 p-4 border-r border-gray-100">
            {nextMeeting ? (
              <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex flex-col">
                <div className="flex flex-row items-start gap-3">
                  {/* 미팅 아이콘 */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center text-white">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 border-2 border-white rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {getDaysUntilMeeting(nextMeeting.startDateTime)}
                      </span>
                    </div>
                  </div>

                  {/* 미팅 정보 */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">다음 프로젝트 일정</p>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">
                      {nextMeeting.meetingSequence ?
                        `${nextMeeting.meetingSequence.type === 'guide' ? '가이드' : nextMeeting.meetingSequence.type === 'premeeting' ? '프리미팅' : nextMeeting.meetingSequence.type} ${nextMeeting.meetingSequence.sequence}차` :
                        nextMeeting.title}
                    </h3>
                    <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full mb-2">
                      D-{getDaysUntilMeeting(nextMeeting.startDateTime)}
                    </span>

                    <p className="text-xs text-gray-600 mb-2">
                      {new Date(nextMeeting.startDateTime).toLocaleDateString('ko-KR', {
                        month: 'long', day: 'numeric', weekday: 'short'
                      })} {new Date(nextMeeting.startDateTime).toLocaleTimeString('ko-KR', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span>예정된 미팅</span>
                    </div>
                  </div>

                </div>
                <button
                  onClick={() => {
                    setIsScheduleModalOpen(true);
                    setShowScheduleModal(true);
                    setScheduleModalMode('create');
                  }}
                  className="mt-3 p-2 w-full bg-white hover:bg-emerald-50 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600">일정 추가</span>
                </button>
              </div>
              ) : (
                <div className="bg-gradient-to-b from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <div className="flex flex-row items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-slate-400 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">다음 프로젝트 일정</p>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">예정된 일정이 없습니다</h3>
                      <p className="text-xs text-gray-600">새로운 미팅을 예약해보세요</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsScheduleModalOpen(true);
                      setShowScheduleModal(true);
                      setScheduleModalMode('create');
                    }}
                    className="mt-3 p-2 w-full bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">일정 추가</span>
                  </button>
                </div>
              )}
            </div>

            {/* 위치 3-6 통합: 빌더 프로필 카드 (우측 오른쪽 열, 세로형) */}
            <div className="col-span-1 p-4">
              {project.team?.pm && (
              <div className="bg-gradient-to-b from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col">
                <div className="flex flex-row items-start gap-3">
                  {/* 빌더 아바타 */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-bold">
                      {project.team.pm.name[0]}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>

                  {/* 빌더 정보 */}
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">담당 빌더</p>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{project.team.pm.name}</h3>
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                      {project.team.pm.role || '빌더'}
                    </span>

                    <p className="text-xs text-gray-600 mb-2">
                      {project.team.pm.email || '전담 PM입니다'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>현재 온라인</span>
                    </div>
                  </div>

                </div>
                <button
                  onClick={handleOpenChat}
                  className="mt-3 p-2 w-full bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-sm relative flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">메시지</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
            </div>
          </div>

          {/* 좌하단: 탭 네비게이션 (50% 너빔) */}
          <div className="col-span-1 px-6 py-4 bg-gray-50/50">
            <nav className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                      tab.isDev
                        ? activeTab === tab.id
                          ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400 shadow-sm'
                          : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-2 border-yellow-300 border-dashed bg-yellow-50/50'
                        : activeTab === tab.id
                        ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:shadow-md hover:scale-102'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 3층: 진행바 + PM 상세 정보 (전체 너비) */}
        <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
          {/* 접기/펼치기 헤더 - 향상된 시각적 계층 */}
          <button
            onClick={toggleProgressBar}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-all duration-200"
          >
            <div className="flex items-center gap-6">
              {/* 프로젝트 진행 정보 */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-800">프로젝트 진행 상황</span>
                {progressData && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border">
                      <span className="text-gray-600">현재: </span>
                      <span className="font-semibold text-gray-900">{progressData.phaseInfo.label}</span>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg shadow-sm border">
                      <span className="text-gray-600">진행률: </span>
                      <span className="font-semibold text-blue-600">{progressData.phaseIndex + 1}/7 단계</span>
                      <span className="text-gray-500"> ({Math.round(progressData.progress)}%)</span>
                    </div>
                    {lastPhaseChange && (
                      <span className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-lg font-medium border border-green-200 animate-fadeIn shadow-sm">
                        🎉 새로 변경됨
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* PM 정보는 1층 프로필 카드로 이동 */}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 font-medium">
                {isProgressBarCollapsed ? '펼치기' : '접기'}
              </span>
              {isProgressBarCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500 transition-transform" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500 transition-transform" />
              )}
            </div>
          </button>

          {/* Collapsible Content */}
          {!isProgressBarCollapsed && progressData && (
            <div className={`px-6 pb-4 space-y-4 transition-all duration-500 ${
              isPhaseTransitioning ? 'transform scale-105 shadow-lg' : ''
            }`}>

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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Overview Tab - 브랜치 타임라인 V3 */}
        {activeTab === 'overview' && (
          <TimelineErrorBoundary>
            <OverviewTabV3
              project={project}
              debugMode={true}
            />
          </TimelineErrorBoundary>
        )}


        {/* 미팅 기록 Tab */}
        {activeTab === 'meetings' && (
          <div className="h-full flex flex-col">
            {/* 헤더 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div>
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

                {/* 키보드 단축키 가이드 */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2">키보드 단축키</h4>
                  <div className="space-y-1">
                    <div><kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+E</kbd> 편집 모드</div>
                    <div><kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+S</kbd> 노트 저장</div>
                    <div><kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+/</kbd> 검색 포커스</div>
                    <div><kbd className="px-1 py-0.5 bg-white border rounded text-xs">ESC</kbd> 검색 초기화</div>
                  </div>
                </div>
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
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">미팅 목록</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {projectMeetings.filter(meeting =>
                            meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (meeting.meetingSequence?.type && MEETING_TYPE_CONFIG[meeting.meetingSequence.type]?.label.includes(searchTerm))
                          ).length}개 미팅 표시 (총 {projectMeetings.length}개)
                        </p>
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

                    {/* 검색 및 필터 */}
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="미팅 제목이나 유형으로 검색..."
                          className="w-full px-3 py-2 pl-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <MessageSquare className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                      </div>

                      {/* 빠른 필터 */}
                      <div className="flex space-x-1 overflow-x-auto">
                        <button
                          onClick={() => setSearchTerm('')}
                          className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                            searchTerm === '' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          전체
                        </button>
                        {Object.entries(MEETING_TYPE_CONFIG).map(([type, config]) => (
                          <button
                            key={type}
                            onClick={() => setSearchTerm(config.label)}
                            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                              searchTerm === config.label ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {config.icon} {config.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {/* ✅ ScheduleContext 단일 데이터 소스 with Search Filter */}
                    {projectMeetings
                      .filter(meeting =>
                        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (meeting.meetingSequence?.type && MEETING_TYPE_CONFIG[meeting.meetingSequence.type]?.label.includes(searchTerm))
                      )
                      .map((meeting, index) => {
                      const isSelected = selectedSchedule?.id === meeting.id;
                      return (
                        <button
                          key={meeting.id}
                          onClick={async () => {
                            setSelectedSchedule(meeting);
                            // setScheduleModalMode('view');
                            // setShowScheduleModal(true); // 모달을 열지 않음

                            // MeetingNotesContext에서 해당 미팅의 노트와 액션 아이템 가져오기
                            const contextNotes = getNotes(meeting.id);
                            const meetingActionItems = getActionItemsByMeeting(meeting.id);

                            // 미팅 자체에 노트가 있으면 우선 사용, 없으면 context에서 가져온 것 사용
                            // meeting.meetingNotes가 string이면 바로 사용, object면 content 사용
                            const noteContent = typeof meeting.meetingNotes === 'string'
                              ? meeting.meetingNotes
                              : meeting.meetingNotes?.content;

                            const meetingNotes = noteContent ? {
                              id: meeting.id,
                              meetingId: meeting.id,
                              content: noteContent,
                              lastModified: meeting.meetingNotes?.updatedAt || new Date(),
                              modifiedBy: meeting.meetingNotes?.updatedBy || 'System',
                              createdAt: meeting.meetingNotes?.updatedAt || new Date(),
                              createdBy: meeting.meetingNotes?.updatedBy || 'System',
                              version: 1,
                              // 간단한 형식의 노트로 표시
                              discussion: {
                                keyPoints: [noteContent],
                                concerns: []
                              },
                              outcomes: {
                                decisions: [],
                                actionItems: [],
                                nextSteps: []
                              },
                              preparation: {
                                agenda: meeting.agenda || []
                              }
                            } : contextNotes;

                            console.log('미팅 노트 필드:', meeting.meetingNotes);
                            console.log('최종 설정될 노트:', meetingNotes);

                            setSelectedMeetingNotes(meetingNotes);
                            setSelectedMeetingActionItems(meetingActionItems);

                            // 노트가 없으면 미팅 타입에 따른 템플릿 생성
                            if (!meetingNotes && meeting.meetingSequence?.type) {
                              const template = getNotesTemplate(meeting.meetingSequence.type);
                              if (template) {
                                const newNotes = await createNotes(meeting.id, template);
                                setSelectedMeetingNotes(newNotes);
                              }
                            }

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
                                {meeting.meetingSequence && MEETING_TYPE_CONFIG[meeting.meetingSequence.type] && (
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    MEETING_TYPE_CONFIG[meeting.meetingSequence.type].color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                    MEETING_TYPE_CONFIG[meeting.meetingSequence.type].color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                    MEETING_TYPE_CONFIG[meeting.meetingSequence.type].color === 'green' ? 'bg-green-100 text-green-700' :
                                    MEETING_TYPE_CONFIG[meeting.meetingSequence.type].color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {MEETING_TYPE_CONFIG[meeting.meetingSequence.type].icon} {MEETING_TYPE_CONFIG[meeting.meetingSequence.type].label}
                                  </span>
                                )}
                              </div>
                              {meeting.meetingSequence && MEETING_TYPE_CONFIG[meeting.meetingSequence.type] && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {MEETING_TYPE_CONFIG[meeting.meetingSequence.type].description}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-0.5">
                                {(() => {
                                  try {
                                    const meetingDate = new Date(meeting.date || meeting.startDateTime);
                                    if (isNaN(meetingDate.getTime())) {
                                      return '날짜 미정';
                                    }
                                    return meetingDate.toLocaleDateString('ko-KR') + ' ' +
                                           meetingDate.toLocaleTimeString('ko-KR', {
                                             hour: '2-digit',
                                             minute: '2-digit'
                                           });
                                  } catch (error) {
                                    return '날짜 미정';
                                  }
                                })()}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  (() => {
                                    const meetingDate = new Date(meeting.date || meeting.startDateTime);
                                    const now = new Date();
                                    const status = meeting.status ||
                                      (isNaN(meetingDate.getTime()) ? 'unknown' :
                                       meetingDate < now ? 'completed' : 'scheduled');

                                    switch (status) {
                                      case 'completed': return 'text-green-700 bg-green-100';
                                      case 'scheduled': return 'text-blue-700 bg-blue-100';
                                      case 'cancelled': return 'text-red-700 bg-red-100';
                                      default: return 'text-gray-700 bg-gray-100';
                                    }
                                  })()
                                }`}>
                                  {(() => {
                                    const meetingDate = new Date(meeting.date || meeting.startDateTime);
                                    const now = new Date();
                                    const status = meeting.status ||
                                      (isNaN(meetingDate.getTime()) ? 'unknown' :
                                       meetingDate < now ? 'completed' : 'scheduled');

                                    switch (status) {
                                      case 'completed': return '완료';
                                      case 'scheduled': return '예정';
                                      case 'cancelled': return '취소';
                                      case 'unknown': return '시간 미정';
                                      default: return '예정';
                                    }
                                  })()}
                                </span>
                                {meeting.phaseTransitionTrigger && (
                                  <span className="ml-2 text-xs text-purple-600 font-medium">
                                    🔄 단계 전환
                                  </span>
                                )}
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
                  {selectedSchedule ? (
                    <>
                      {/* 메모 헤더 */}
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{selectedSchedule.title}</h3>
                            <div className="flex items-center mt-1 space-x-2">
                              {selectedSchedule.meetingSequence?.type && MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type] && (
                                <div className="flex flex-col space-y-1">
                                  <span className={`px-3 py-1 text-sm font-medium rounded-lg ${
                                    MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                    MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'green' ? 'bg-green-100 text-green-800' :
                                    MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                    'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].icon} {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].label}
                                  </span>
                                  <p className="text-xs text-gray-600">
                                    {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].description}
                                  </p>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {(() => {
                                try {
                                  const meetingDate = new Date(selectedSchedule.date || selectedSchedule.startDateTime);
                                  if (isNaN(meetingDate.getTime())) {
                                    return '날짜 미정';
                                  }
                                  return meetingDate.toLocaleDateString('ko-KR');
                                } catch (error) {
                                  return '날짜 미정';
                                }
                              })()} •
                              {selectedSchedule.duration ? `${selectedSchedule.duration}분` : '시간 미정'} •
                              {selectedSchedule.location || '장소 미정'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setScheduleModalMode('view');
                                setShowScheduleModal(true);
                              }}
                              className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                              title="일정 상세 보기"
                            >
                              <Calendar className="w-3 h-3" />
                              상세
                            </button>
                            <Download className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" title="PDF 다운로드" />
                            <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" title="편집" />
                          </div>
                        </div>
                      </div>

                      {/* 메모 내용 */}
                      <div className="flex-1 overflow-y-auto p-4">
                        {selectedMeetingNotes ? (
                          <div className="prose prose-sm max-w-none">
                            {/* 미팅 노트가 단순 텍스트일 경우 */}
                            {selectedMeetingNotes && typeof selectedMeetingNotes.content === 'string' && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                                  미팅 노트
                                </h4>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {selectedMeetingNotes.content}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* 사전 준비 */}
                            {selectedMeetingNotes.preparation && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <Briefcase className="w-4 h-4 mr-2 text-purple-500" />
                                  사전 준비
                                </h4>
                                <div className="bg-purple-50 p-3 rounded-lg space-y-2">
                                  {selectedMeetingNotes.preparation.agenda?.length > 0 && (
                                    <div>
                                      <span className="text-xs font-medium text-purple-700">안건:</span>
                                      <ul className="text-sm text-gray-700 ml-2">
                                        {selectedMeetingNotes.preparation.agenda.map((item: string, index: number) => (
                                          <li key={index} className="flex items-start">
                                            <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {selectedMeetingNotes.preparation.goals?.length > 0 && (
                                    <div>
                                      <span className="text-xs font-medium text-purple-700">목표:</span>
                                      <ul className="text-sm text-gray-700 ml-2">
                                        {selectedMeetingNotes.preparation.goals.map((goal: string, index: number) => (
                                          <li key={index} className="flex items-start">
                                            <Target className="w-3 h-3 text-purple-400 mt-1 mr-2 flex-shrink-0" />
                                            {goal}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 미팅 진행 - 핵심 포인트 */}
                            {selectedMeetingNotes.discussion?.keyPoints?.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
                                  핵심 논의사항
                                </h4>
                                <ul className="space-y-2">
                                  {selectedMeetingNotes.discussion.keyPoints.map((item: string, index: number) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700">
                                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 우려사항 */}
                            {selectedMeetingNotes.discussion?.concerns?.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                                  우려사항
                                </h4>
                                <ul className="space-y-2">
                                  {selectedMeetingNotes.discussion.concerns.map((item: string, index: number) => (
                                    <li key={index} className="flex items-start text-sm text-gray-700 bg-yellow-50 p-2 rounded">
                                      <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* 결정사항 */}
                            {selectedMeetingNotes.outcomes?.decisions?.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <CheckCircle className="w-4 h-4 mr-2 text-purple-500" />
                                  결정사항
                                </h4>
                                <div className="space-y-3">
                                  {selectedMeetingNotes.outcomes.decisions.map((decision: any, index: number) => (
                                    <div key={decision.id || index} className="bg-purple-50 p-3 rounded-lg">
                                      <div className="flex items-start">
                                        <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 mr-3 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">{decision.decision}</p>
                                          {decision.rationale && (
                                            <p className="text-xs text-gray-600 mt-1">근거: {decision.rationale}</p>
                                          )}
                                          <div className="flex items-center mt-2 space-x-3">
                                            <span className={`px-2 py-1 text-xs rounded ${
                                              decision.impact === 'high' ? 'bg-red-100 text-red-700' :
                                              decision.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-green-100 text-green-700'
                                            }`}>
                                              {decision.impact === 'high' ? '🔴 높음' :
                                               decision.impact === 'medium' ? '🟡 보통' : '🟢 낮음'} 영향도
                                            </span>
                                            {decision.approvedBy && (
                                              <span className="text-xs text-gray-500">승인: {decision.approvedBy}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 액션 아이템 */}
                            {selectedMeetingActionItems.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                                  액션 아이템 ({selectedMeetingActionItems.length}개)
                                </h4>
                                <div className="space-y-2">
                                  {selectedMeetingActionItems.map((item: any) => (
                                    <div key={item.id} className="bg-orange-50 p-3 rounded-lg">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                              item.status === 'completed' ? 'bg-green-500' :
                                              item.status === 'in_progress' ? 'bg-blue-500' :
                                              item.status === 'overdue' ? 'bg-red-500' : 'bg-gray-400'
                                            }`} />
                                            <span className="text-sm font-medium text-gray-900">{item.item}</span>
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-gray-600 mt-1 ml-4">{item.description}</p>
                                          )}
                                          <div className="flex items-center mt-2 ml-4 space-x-3">
                                            <span className="text-xs text-gray-500">담당: {item.assignee}</span>
                                            <span className="text-xs text-gray-500">
                                              마감: {new Date(item.dueDate).toLocaleDateString('ko-KR')}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded ${
                                              item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                              item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                              'bg-gray-100 text-gray-700'
                                            }`}>
                                              {item.priority === 'urgent' ? '🚨 긴급' :
                                               item.priority === 'high' ? '🔴 높음' :
                                               item.priority === 'medium' ? '🟡 보통' : '⚪ 낮음'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 다음 단계 */}
                            {selectedMeetingNotes.outcomes?.nextSteps?.length > 0 && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-2">
                                  <ArrowRight className="w-4 h-4 mr-2 text-blue-500" />
                                  다음 단계
                                </h4>
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <ul className="space-y-1">
                                    {selectedMeetingNotes.outcomes.nextSteps.map((step: string, index: number) => (
                                      <li key={index} className="flex items-start text-sm text-gray-700">
                                        <ArrowRight className="w-3 h-3 text-blue-400 mt-1 mr-2 flex-shrink-0" />
                                        {step}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* 미팅 유형별 특화 데이터 */}
                            {selectedSchedule.meetingSequence?.type && selectedMeetingNotes && (
                              <div className="mb-6">
                                <h4 className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                                  <Briefcase className="w-4 h-4 mr-2 text-indigo-500" />
                                  {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].label} 특화 내용
                                </h4>
                                <div className="bg-indigo-50 p-3 rounded-lg">
                                  {/* 프리미팅 특화 내용 */}
                                  {selectedSchedule.meetingSequence.type === 'pre_meeting' && (
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                          <span className="font-medium text-indigo-700">예상 예산:</span>
                                          <p className="text-gray-700 mt-1">미정 (프리미팅에서 협의)</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-indigo-700">예상 기간:</span>
                                          <p className="text-gray-700 mt-1">미정 (프리미팅에서 협의)</p>
                                        </div>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium text-indigo-700">기술 요구사항:</span>
                                        <p className="text-gray-700 mt-1">프리미팅에서 상세히 논의됩니다.</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 가이드 1차 특화 내용 */}
                                  {selectedSchedule.meetingSequence.type === 'guide_1' && (
                                    <div className="space-y-2">
                                      <div className="text-xs">
                                        <span className="font-medium text-blue-700">킥오프 완료:</span>
                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded">✅ 완료</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium text-blue-700">프로젝트 비전:</span>
                                        <p className="text-gray-700 mt-1">프로젝트의 전체적인 방향성과 목표를 설정합니다.</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 가이드 2차 특화 내용 */}
                                  {selectedSchedule.meetingSequence.type === 'guide_2' && (
                                    <div className="space-y-2">
                                      <div className="text-xs">
                                        <span className="font-medium text-green-700">설계 승인:</span>
                                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded">⏳ 검토중</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium text-green-700">기술 스택:</span>
                                        <p className="text-gray-700 mt-1">React, TypeScript, Node.js 등 기술 스택을 확정합니다.</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 가이드 3차 특화 내용 */}
                                  {selectedSchedule.meetingSequence.type === 'guide_3' && (
                                    <div className="space-y-2">
                                      <div className="text-xs">
                                        <span className="font-medium text-orange-700">개발 진행률:</span>
                                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded">65% 완료</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium text-orange-700">QA 상태:</span>
                                        <p className="text-gray-700 mt-1">중간 테스트 진행 중, 주요 기능 검증 완료</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* 가이드 4차 특화 내용 */}
                                  {selectedSchedule.meetingSequence.type === 'guide_4' && (
                                    <div className="space-y-2">
                                      <div className="text-xs">
                                        <span className="font-medium text-emerald-700">최종 납품:</span>
                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded">✅ 준비완료</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="font-medium text-emerald-700">고객 만족도:</span>
                                        <span className="ml-2 text-yellow-500">★★★★★ (5.0/5.0)</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 메모 메타데이터 */}
                            <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
                              <div className="flex justify-between">
                                <div>
                                  <p>작성자: {selectedMeetingNotes.createdBy}</p>
                                  <p>작성일: {new Date(selectedMeetingNotes.createdAt).toLocaleDateString('ko-KR')} {new Date(selectedMeetingNotes.createdAt).toLocaleTimeString('ko-KR')}</p>
                                </div>
                                <div className="text-right">
                                  <p>버전: v{selectedMeetingNotes.version}</p>
                                  <p>최종 수정: {new Date(selectedMeetingNotes.lastModified).toLocaleDateString('ko-KR')}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <h4 className="text-lg font-semibold text-gray-700 mb-2">미팅 노트 작성 중</h4>
                              <p className="text-gray-500 mb-4">
                                {selectedSchedule.meetingSequence?.type
                                  ? '미팅 유형에 맞는 템플릿이 생성되었습니다.'
                                  : 'PM이 아직 미팅 노트를 작성하지 않았습니다.'}
                              </p>
                              <button
                                onClick={async () => {
                                  if (selectedSchedule.meetingSequence?.type) {
                                    const template = getNotesTemplate(selectedSchedule.meetingSequence.type);
                                    if (template) {
                                      const newNotes = await createNotes(selectedSchedule.id, template);
                                      setSelectedMeetingNotes(newNotes);
                                      showSuccess('미팅 노트 템플릿이 생성되었습니다.');
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                              >
                                <PlusCircle className="w-4 h-4" />
                                노트 작성 시작
                              </button>
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

                {/* 3. 미팅 요약 & 댓글 (오른쪽 30%) */}
                <div className="w-96 bg-white flex flex-col">
                  {selectedSchedule ? (
                    <>
                      {/* 탭 헤더 */}
                      <div className="p-4 border-b border-gray-200">
                        {/* 탭 버튼 */}
                        <div className="flex space-x-1 mb-3">
                          <button
                            onClick={() => setRightPanelTab('summary')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              rightPanelTab === 'summary'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            미팅 요약
                          </button>
                          <button
                            onClick={() => setRightPanelTab('comments')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              rightPanelTab === 'comments'
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            댓글
                            {meetingComments[selectedSchedule.id]?.length > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                                {meetingComments[selectedSchedule.id].length}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* 탭별 헤더 정보 */}
                        {rightPanelTab === 'summary' ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                selectedMeetingNotes ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {selectedMeetingNotes ? '✅ 노트 작성됨' : '📝 노트 없음'}
                              </span>
                              <span className="text-xs text-gray-500">
                                액션 아이템 {selectedMeetingActionItems.length}개
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                if (selectedMeetingNotes) {
                                  const updatedNotes = updateNotes(selectedSchedule.id, selectedMeetingNotes);
                                  setSelectedMeetingNotes(updatedNotes);
                                  showSuccess('미팅 노트가 저장되었습니다.');
                                }
                              }}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              저장
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              총 {meetingComments[selectedSchedule.id]?.length || 0}개의 댓글
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 탭별 콘텐츠 */}
                      <div className="flex-1 overflow-y-auto">
                        {rightPanelTab === 'summary' ? (
                          // 요약 탭 콘텐츠
                          <div className="p-4 space-y-4">
                            {/* 미팅 상태 요약 */}
                            <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <Activity className="w-4 h-4 mr-2 text-blue-500" />
                            미팅 현황
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">완료율</span>
                              <span className="font-medium text-gray-900">
                                {selectedMeetingNotes && selectedMeetingActionItems.length > 0
                                  ? `${Math.round((selectedMeetingActionItems.filter(item => item.status === 'completed').length / selectedMeetingActionItems.length) * 100)}%`
                                  : '0%'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">노트 상태</span>
                              <span className={selectedMeetingNotes ? 'text-green-600' : 'text-gray-500'}>
                                {selectedMeetingNotes ? '작성완료' : '미작성'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">액션 아이템</span>
                              <span className="text-gray-900">
                                {selectedMeetingActionItems.length}개
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 빠른 액션 아이템 관리 */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-orange-500" />
                              액션 아이템
                            </h4>
                            <button
                              onClick={async () => {
                                const newActionItemData = {
                                  item: '새 액션 아이템',
                                  description: '',
                                  assignee: 'PM',
                                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
                                  status: 'pending' as const,
                                  priority: 'medium' as const
                                };
                                const newActionItem = await createActionItem(selectedSchedule.id, newActionItemData);
                                setSelectedMeetingActionItems([...selectedMeetingActionItems, newActionItem]);
                                showSuccess('새 액션 아이템이 추가되었습니다.');
                              }}
                              className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            >
                              + 추가
                            </button>
                          </div>

                          {selectedMeetingActionItems.length === 0 ? (
                            <div className="text-center py-4">
                              <Clock className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                              <p className="text-xs text-gray-500">액션 아이템이 없습니다</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {selectedMeetingActionItems.slice(0, 5).map((item, index) => (
                                <div key={item.id} className="bg-white border border-gray-200 rounded p-2">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => {
                                            const updatedItem = {
                                              ...item,
                                              status: item.status === 'completed' ? 'pending' : 'completed',
                                              completedAt: item.status === 'completed' ? undefined : new Date()
                                            };
                                            updateActionItem(item.id, updatedItem);
                                            const updatedItems = selectedMeetingActionItems.map(ai =>
                                              ai.id === item.id ? updatedItem : ai
                                            );
                                            setSelectedMeetingActionItems(updatedItems);
                                          }}
                                          className={`w-3 h-3 rounded-full border-2 ${
                                            item.status === 'completed'
                                              ? 'bg-green-500 border-green-500'
                                              : 'border-gray-300 hover:border-green-400'
                                          }`}
                                        />
                                        <span className={`text-xs truncate ${
                                          item.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                                        }`}>
                                          {item.item}
                                        </span>
                                      </div>
                                      <div className="flex items-center mt-1 space-x-2">
                                        <span className="text-xs text-gray-500">{item.assignee}</span>
                                        <span className={`text-xs px-1 py-0.5 rounded ${
                                          item.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                                          item.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {item.priority}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {selectedMeetingActionItems.length > 5 && (
                                <p className="text-xs text-gray-500 text-center">
                                  +{selectedMeetingActionItems.length - 5}개 더 있음
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 미팅 유형별 가이드라인 */}
                        {selectedSchedule.meetingSequence?.type && MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type] && (
                          <div className={`rounded-lg p-3 ${
                            MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'purple' ? 'bg-purple-50' :
                            MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'blue' ? 'bg-blue-50' :
                            MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'green' ? 'bg-green-50' :
                            MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].color === 'orange' ? 'bg-orange-50' :
                            'bg-emerald-50'
                          }`}>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                              <span className="mr-2">
                                {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].icon}
                              </span>
                              미팅 가이드라인
                            </h4>
                            <div className="space-y-2">
                              <div className="text-xs text-gray-700">
                                <span className="font-medium">추천 시간:</span> {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].defaultDuration}분
                              </div>
                              <div className="text-xs text-gray-700">
                                <span className="font-medium">필수 참석자:</span> {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].requiredAttendees.join(', ')}
                              </div>
                              {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].phaseTransition && (
                                <div className="text-xs text-gray-700">
                                  <span className="font-medium">단계 전환:</span> {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].phaseTransition.from} → {MEETING_TYPE_CONFIG[selectedSchedule.meetingSequence.type].phaseTransition.to}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 빠른 메모 */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                            핵심 요약
                          </h4>
                          {selectedMeetingNotes?.discussion?.keyPoints?.length > 0 ? (
                            <ul className="space-y-1">
                              {selectedMeetingNotes.discussion.keyPoints.slice(0, 3).map((point: string, index: number) => (
                                <li key={index} className="flex items-start text-xs text-gray-700">
                                  <span className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                                  <span className="line-clamp-2">{point}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500">주요 논의사항이 아직 기록되지 않았습니다.</p>
                          )}
                        </div>
                          </div>
                        ) : (
                          // 댓글 탭 콘텐츠
                          <div className="flex flex-col h-full">
                            {/* 댓글 목록 */}
                            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                              {meetingComments[selectedSchedule.id]?.length > 0 ? (
                                meetingComments[selectedSchedule.id].map((comment) => (
                                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                                          {comment.author.charAt(0)}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(comment.timestamp).toLocaleString('ko-KR', {
                                            month: 'numeric',
                                            day: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric'
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <MessageSquare className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                  <p className="text-sm text-gray-500">아직 댓글이 없습니다</p>
                                  <p className="text-xs text-gray-400 mt-1">첫 번째 댓글을 작성해보세요!</p>
                                </div>
                              )}
                            </div>

                            {/* 댓글 입력 영역 */}
                            <div className="p-4 border-t border-gray-200">
                              <div className="space-y-3">
                                <textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="댓글을 작성하세요..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows={3}
                                />
                                <button
                                  onClick={() => {
                                    if (!newComment.trim() || !selectedSchedule) return;

                                    const newCommentObj = {
                                      id: `comment-${Date.now()}`,
                                      content: newComment.trim(),
                                      author: '김대표', // 현재 사용자 정보로 대체 필요
                                      timestamp: new Date().toISOString()
                                    };

                                    setMeetingComments(prev => ({
                                      ...prev,
                                      [selectedSchedule.id]: [
                                        ...(prev[selectedSchedule.id] || []),
                                        newCommentObj
                                      ]
                                    }));

                                    setNewComment('');
                                    showSuccess('댓글이 추가되었습니다.');
                                  }}
                                  disabled={!newComment.trim()}
                                  className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  댓글 작성
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 빠른 액션 버튼 - 요약 탭에서만 표시 */}
                      {rightPanelTab === 'summary' && (
                        <div className="p-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setIsEditMode(!isEditMode);
                              if (!isEditMode) {
                                showInfo('편집 모드가 활성화되었습니다. 직접 텍스트를 수정할 수 있습니다.');
                              } else {
                                showSuccess('편집 모드가 비활성화되었습니다. 변경사항이 저장되었습니다.');
                              }
                            }}
                            className={`px-3 py-2 text-xs rounded hover:bg-gray-200 flex items-center justify-center gap-1 ${
                              isEditMode ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            <Edit className="w-3 h-3" />
                            {isEditMode ? '저장' : '편집'}
                          </button>
                          <button
                            onClick={() => {
                              // PDF 내보내기 로직
                              showInfo('PDF 내보내기는 개발 중입니다.');
                            }}
                            className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            if (selectedSchedule.meetingSequence?.type) {
                              const template = getNotesTemplate(selectedSchedule.meetingSequence.type);
                              if (template) {
                                const newNotes = await createNotes(selectedSchedule.id, template);
                                setSelectedMeetingNotes(newNotes);
                                showSuccess('미팅 노트 템플릿이 생성되었습니다.');
                              }
                            }
                          }}
                          className="w-full mt-2 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-1"
                        >
                          <PlusCircle className="w-3 h-3" />
                          {selectedMeetingNotes ? '새 버전 생성' : '노트 작성 시작'}
                        </button>
                      </div>
                      )}
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

        {/* 🔧 개발자 모드: 프로젝트 단계-일정 연동 시스템 */}
        {activeTab === 'phase-history' && (
          <div className="p-6 max-w-4xl mx-auto">
            {/* 개발자 모드 안내 */}
            <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 border-dashed rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚠️</span>
                <h2 className="font-bold text-yellow-800">개발자 모드 - 프로젝트 단계/일정 연동 시스템</h2>
              </div>
              <p className="text-sm text-yellow-700">
                이 탭은 개발 및 테스트용입니다. 실제 서비스에서는 표시되지 않습니다.
              </p>
            </div>
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

            {/* 프로젝트 단계 관리 - 개요 탭에서 이동 */}
            {project && (
              <div className="mb-6 bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">프로젝트 단계 관리</h3>
                  <p className="text-xs text-gray-500 mt-1">현재 단계 및 단계 전환 관리</p>
                </div>
                <div className="p-4">
                  <ProjectPhaseTransition project={project} />
                </div>
              </div>
            )}

            {/* 단계 이력 표시 */}
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
            {/* 숨겨진 파일 입력 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.svg,.zip,.rar,.7z"
              className="hidden"
            />

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="파일 검색..."
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={fileCategory}
                  onChange={(e) => setFileCategory(e.target.value)}
                >
                  <option value="document">문서</option>
                  <option value="design">이미지/디자인</option>
                  <option value="code">코드</option>
                  <option value="report">보고서</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <button
                onClick={handleUploadButtonClick}
                disabled={isUploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? '업로드 중...' : '파일 업로드'}
                <span className="text-xs bg-blue-500 px-1 rounded">→VDR</span>
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
                  {projectDocuments.length > 0 ? (
                    projectDocuments
                      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()) // 최신 순 정렬
                      .map(doc => {
                      const Icon = getFileIcon(doc.name);
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Icon className="w-8 h-8 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{doc.name}</div>
                                <div className="text-sm text-gray-500">{doc.mimeType}</div>
                                <div className="text-xs text-blue-600">VDR에서 관리됨</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(doc.size / 1024).toFixed(1)}KB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              <div className="font-medium text-gray-900">
                                {new Date(doc.uploadDate).toLocaleDateString('ko-KR')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(doc.uploadDate).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doc.uploadedBy || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  // VDR 페이지로 이동하여 해당 문서 보기
                                  window.open(`/pocketbiz-platform/startup/vdr`, '_blank');
                                }}
                                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                                title="VDR에서 보기"
                              >
                                VDR에서 보기
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-sm">이 프로젝트와 연결된 파일이 없습니다.</p>
                          <p className="text-xs text-gray-400 mt-1">VDR에서 파일 업로드 시 이 프로젝트를 선택하세요.</p>
                        </div>
                      </td>
                    </tr>
                  )}
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
                    {projectActivities.slice(0, 8).map(activity => (
                      <div key={activity.id} className="p-4">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                            {activity.user[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {activity.user}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(new Date(activity.timestamp))}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{activity.description}</p>
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
        isOpen={showScheduleModal || isScheduleModalOpen}
        onClose={() => {
          setShowScheduleModal(false);
          setIsScheduleModalOpen(false);
          // setSelectedSchedule(null); // 선택을 유지하기 위해 주석 처리
        }}
        schedule={selectedSchedule || undefined}
        mode={scheduleModalMode}
        defaultType="buildup_project"
        projectId={projectId}
        initialData={scheduleModalMode === 'create' ? {
          projectId: projectId,
          title: `${project?.title || ''} - ${getNextMeetingType(project?.phase || 'contract_pending')} 미팅`,
          type: 'buildup_project',
          meetingSequence: getNextMeetingType(project?.phase || 'contract_pending')
        } : undefined}
        onSubmit={scheduleModalMode === 'create' ? handleScheduleMeeting : undefined}  // Sprint 5: 생성 모드일 때만 사용
        onSuccess={(schedule) => {

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

          // 동기화 이벤트 발송
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


            // 실제 프로젝트 단계 업데이트 실행
            if (project && updateProject) {
              try {
                updateProject(project.id, { phase: toPhase });

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

              // Phase Transition 이벤트 발송
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

            window.dispatchEvent(buildupChangeEvent);
          }

          // 성공 토스트 표시
          const operationText = operation === 'created' ? '생성' : '수정';
          showSuccess(`미팅이 성공적으로 ${operationText}되었습니다: ${schedule.title}`);
        }}
      />
    </div>
  );
}