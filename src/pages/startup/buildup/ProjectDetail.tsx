import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  
  const project = projects.find(p => p.id === projectId);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'meetings'>('overview');

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
    { id: 'meetings', label: '미팅 기록', icon: Calendar }
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

        {/* 7단계 진행률 시스템 */}
        {progressData && (
          <div className="space-y-4">
            {/* 상단 정보 */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">프로젝트 단계</span>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-gray-600">현재 단계</span>
                  <span className="ml-2 font-medium">{progressData.phaseInfo.label}</span>
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
                className="absolute top-0 left-0 bg-blue-600 h-3 rounded-full transition-all duration-1000"
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
                    } ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : 'hover:scale-110'}`} />

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
                {/* Next Meeting */}
                {project.meetings && project.meetings.length > 0 && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">다음 미팅</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">
                        {project.meetings[0].title}
                      </p>
                      <p className="text-sm text-gray-700">
                        {new Date(project.meetings[0].date).toLocaleDateString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        })} {new Date(project.meetings[0].date).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-700">
                        장소: {project.meetings[0].location}
                      </p>
                      {project.meetings[0].meeting_link && (
                        <a
                          href={project.meetings[0].meeting_link}
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

                {/* Timeline */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">타임라인</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">프로젝트 시작</p>
                        <p className="text-xs text-gray-600">{new Date(project.contract.start_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">현재 단계</p>
                        <p className="text-xs text-gray-600">
                          {progressData ? `${progressData.phaseInfo.label} (${progressData.phaseIndex + 1}/7)` : '정보 없음'}
                        </p>
                      </div>
                    </div>
                    {project.timeline.next_milestone && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">다음 마일스톤</p>
                          <p className="text-xs text-gray-600">
                            {project.timeline.next_milestone.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(project.timeline.next_milestone.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">프로젝트 종료</p>
                        <p className="text-xs text-gray-600">{new Date(project.contract.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
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
                    <button className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" />
                      팀 메시지
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 미팅 기록 Tab */}
        {activeTab === 'meetings' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">가이드 미팅 기록</h2>
              <p className="text-sm text-gray-600">프로젝트 진행 중 실시된 모든 가이드 미팅 내역</p>
            </div>

            {/* 미팅 기록 내용 */}
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">미팅 기록 기능 준비 중</h3>
              <p className="text-gray-500">가이드 미팅 기록 시스템을 준비하고 있습니다.</p>
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
    </div>
  );
}