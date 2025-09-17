import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  ArrowRight,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import type { Project } from '../../types/buildup.types';
import { useChatContext } from '../../contexts/ChatContext';
import { useBuildupContext } from '../../contexts/BuildupContext';

interface EnhancedProjectCardProps {
  project: Project;
}

// 단계별 색상 매핑
const getPhaseColor = (phase: string) => {
  const colors: Record<string, string> = {
    contracting: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    contracted: 'text-blue-600 bg-blue-50 border-blue-200',
    planning: 'text-purple-600 bg-purple-50 border-purple-200',
    design: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    execution: 'text-green-600 bg-green-50 border-green-200',
    review: 'text-orange-600 bg-orange-50 border-orange-200',
    completed: 'text-gray-600 bg-gray-50 border-gray-200'
  };
  return colors[phase] || colors.contracted;
};

// 단계 이름 한글 매핑
const getPhaseLabel = (phase: string) => {
  const labels: Record<string, string> = {
    contracting: '계약중',
    contracted: '계약완료',
    planning: '기획',
    design: '설계',
    execution: '실행',
    review: '검토',
    completed: '완료'
  };
  return labels[phase] || phase;
};

// 단계를 숫자로 변환
const getPhaseNumber = (phase: string): number => {
  const phases = ['contracting', 'contracted', 'planning', 'design', 'execution', 'review', 'completed'];
  return phases.indexOf(phase) + 1;
};

// D-Day 계산
const calculateDaysLeft = (endDate: Date | string): number => {
  const end = new Date(endDate);
  const today = new Date();
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// D-Day 색상
const getDaysLeftColor = (days: number): string => {
  if (days <= 3) return 'text-red-600 bg-red-50';
  if (days <= 7) return 'text-orange-600 bg-orange-50';
  if (days <= 14) return 'text-yellow-600 bg-yellow-50';
  return 'text-blue-600 bg-blue-50';
};

export default function EnhancedProjectCard({ project }: EnhancedProjectCardProps) {
  const navigate = useNavigate();
  const { openChatWithPM, getUnreadCountByPM } = useChatContext();
  const { projects } = useBuildupContext();

  const daysLeft = calculateDaysLeft(project.timeline.end_date);
  const currentPhaseNumber = getPhaseNumber(project.phase);
  const nextMeeting = project.meetings?.find(m => !m.completed && new Date(m.date) > new Date());

  // PM의 읽지 않은 메시지 수
  const pmUnreadCount = project.team?.pm ? getUnreadCountByPM(project.team.pm.id) : 0;

  const handleOpenChat = () => {
    if (project.team?.pm) {
      // 이 PM이 담당하는 모든 프로젝트 찾기
      const pmProjects = projects.filter(p => p.team?.pm?.id === project.team.pm.id);

      openChatWithPM(
        project.team.pm.id,
        {
          name: project.team.pm.name,
          email: project.team.pm.email,
          avatar: project.team.pm.avatar,
          company: project.team.pm.company
        },
        pmProjects
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {project.title}
            </h3>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPhaseColor(project.phase)}`}>
                {getPhaseLabel(project.phase)}
              </span>
              <span className="text-sm text-gray-500">
                {project.category}
              </span>
            </div>
          </div>

          {/* D-Day Badge */}
          <div className={`px-3 py-1.5 rounded-lg ${getDaysLeftColor(daysLeft)}`}>
            <div className="text-xs font-medium">D-{daysLeft}</div>
          </div>
        </div>

        {/* 7단계 진행률 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">진행 상황</span>
            <span className="text-sm font-medium text-gray-900">
              {currentPhaseNumber}/7 단계
            </span>
          </div>
          <div className="relative">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    num <= currentPhaseNumber
                      ? 'bg-primary-main text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 -z-10">
              <div
                className="h-full bg-primary-main transition-all duration-500"
                style={{ width: `${((currentPhaseNumber - 1) / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="grid grid-cols-3 gap-3">
          {/* 결제 상태 */}
          <div className="flex items-center gap-2">
            {project.payment?.status === 'confirmed' ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-600">결제완료</span>
              </>
            ) : project.payment?.status === 'pending' ? (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-gray-600">결제대기</span>
              </>
            ) : (
              <>
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600">미결제</span>
              </>
            )}
          </div>

          {/* 메시지 */}
          {project.communication?.unread_messages > 0 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-primary-main" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </div>
              <span className="text-xs text-gray-600">
                메시지 {project.communication.unread_messages}
              </span>
            </div>
          )}

          {/* 산출물 대기 */}
          {project.deliverables?.filter(d => d.status === 'pending_review').length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-600">
                검토대기 {project.deliverables.filter(d => d.status === 'pending_review').length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 다음 일정 */}
      {nextMeeting && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">다음 미팅:</span>
              <span className="text-sm font-medium text-gray-900">
                {nextMeeting.title}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(nextMeeting.date).toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="px-6 py-4 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary-main transition-colors"
              title="산출물 보기"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary-main transition-colors"
              title="팀 정보"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenChat}
              className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-primary-main transition-colors group"
              title="PM과 대화하기"
            >
              <MessageSquare className="w-4 h-4" />
              {pmUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pmUnreadCount}
                </span>
              )}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {project.team?.pm?.name || 'PM'}과 대화
              </span>
            </button>
          </div>

          <button
            onClick={() => navigate(`/startup/buildup/project/${project.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-main hover:text-primary-hover transition-colors"
          >
            상세보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}