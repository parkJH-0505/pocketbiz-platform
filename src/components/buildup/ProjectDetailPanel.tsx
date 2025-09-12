import React, { useState } from 'react';
import {
  X,
  FileText,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Paperclip,
  ChevronRight
} from 'lucide-react';
import type { Project } from '../../types/buildup.types';

interface ProjectDetailPanelProps {
  project: Project;
  onClose: () => void;
}

export default function ProjectDetailPanel({ project, onClose }: ProjectDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'workstreams' | 'deliverables' | 'meetings' | 'files'>('overview');

  const tabs = [
    { id: 'overview', label: '개요', icon: FileText },
    { id: 'workstreams', label: '작업', icon: CheckCircle },
    { id: 'deliverables', label: '산출물', icon: Paperclip },
    { id: 'meetings', label: '미팅', icon: Calendar },
    { id: 'files', label: '파일', icon: FileText }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'preparing': return 'text-purple-600 bg-purple-50';
      case 'hold': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h2>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                {project.status === 'active' ? '진행중' : 
                 project.status === 'completed' ? '완료' :
                 project.status === 'review' ? '검토중' :
                 project.status === 'preparing' ? '준비중' : '보류'}
              </span>
              <span className="text-sm text-gray-500">{project.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">전체 진행률</span>
            <span className="font-medium">{project.progress.overall}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${project.progress.overall}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 px-6">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 inline mr-1" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Contract Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">계약 금액</span>
                  <span className="font-medium">₩{(project.contract.value / 10000).toLocaleString()}만원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">시작일</span>
                  <span>{new Date(project.contract.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">종료일</span>
                  <span>{new Date(project.contract.end_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">타임라인</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">현재 단계</p>
                    <p className="text-xs text-gray-600">{project.timeline.current_phase}</p>
                  </div>
                </div>
                {project.timeline.next_milestone && (
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">다음 마일스톤</p>
                      <p className="text-xs text-gray-600">
                        {project.timeline.next_milestone.name} - {new Date(project.timeline.next_milestone.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Team */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">팀</h3>
              <div className="space-y-2">
                {project.team?.pm && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                      {project.team.pm.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{project.team.pm.name}</p>
                      <p className="text-xs text-gray-600">{project.team.pm.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {project.progress.milestones_completed}/{project.progress.milestones_total}
                </p>
                <p className="text-xs text-gray-600">마일스톤 완료</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {project.progress.deliverables_submitted}/{project.progress.deliverables_total}
                </p>
                <p className="text-xs text-gray-600">산출물 제출</p>
              </div>
            </div>
          </div>
        )}

        {/* Workstreams Tab */}
        {activeTab === 'workstreams' && (
          <div className="space-y-4">
            {project.workstreams.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">작업이 없습니다</p>
            ) : (
              project.workstreams.map(workstream => (
                <div key={workstream.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{workstream.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      workstream.status === 'completed' ? 'bg-green-100 text-green-700' :
                      workstream.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      workstream.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {workstream.status === 'completed' ? '완료' :
                       workstream.status === 'in_progress' ? '진행중' :
                       workstream.status === 'review' ? '검토중' : '백로그'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    담당: {workstream.owner?.name || '미정'}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>작업 {workstream.tasks.length}개</span>
                    <span>진행률 {workstream.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Deliverables Tab */}
        {activeTab === 'deliverables' && (
          <div className="space-y-4">
            {project.deliverables.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">산출물이 없습니다</p>
            ) : (
              project.deliverables.map(deliverable => (
                <div key={deliverable.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{deliverable.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      deliverable.status === 'approved' ? 'bg-green-100 text-green-700' :
                      deliverable.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      deliverable.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {deliverable.status === 'approved' ? '승인' :
                       deliverable.status === 'submitted' ? '제출' :
                       deliverable.status === 'in_review' ? '검토중' : '대기'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{deliverable.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>마감: {new Date(deliverable.due_date).toLocaleDateString()}</span>
                    <span>v{deliverable.version}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="space-y-4">
            {project.meetings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">예정된 미팅이 없습니다</p>
            ) : (
              project.meetings.map(meeting => (
                <div key={meeting.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">{meeting.title}</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>{new Date(meeting.date).toLocaleString()}</p>
                    <p>{meeting.duration}분</p>
                    <p>참석자 {meeting.attendees.length}명</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            {project.files.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">파일이 없습니다</p>
            ) : (
              project.files.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <FileText className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)}KB · {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex gap-2">
          <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
            메시지
          </button>
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}