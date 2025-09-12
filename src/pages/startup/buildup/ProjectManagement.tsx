import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  List,
  Calendar,
  Grid3x3,
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { useBuildupContext } from '../../../contexts/BuildupContext';
import type { Project } from '../../../types/buildup.types';
import ProjectDetailPanel from '../../../components/buildup/ProjectDetailPanel';
import KanbanBoard from '../../../components/buildup/KanbanBoard';

type ViewMode = 'kanban' | 'list' | 'gantt' | 'grid';
type ProjectFilter = 'all' | 'active' | 'completed' | 'hold';

export default function ProjectManagement() {
  const navigate = useNavigate();
  const { projects, activeProjects, completedProjects } = useBuildupContext();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProjectFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects
  const getFilteredProjects = () => {
    let filtered = [...projects];

    // Status filter
    switch (filterStatus) {
      case 'active':
        filtered = activeProjects;
        break;
      case 'completed':
        filtered = completedProjects;
        break;
      case 'hold':
        filtered = projects.filter(p => p.status === 'hold');
        break;
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-blue-600 bg-blue-50';
      case 'review': return 'text-yellow-600 bg-yellow-50';
      case 'preparing': return 'text-purple-600 bg-purple-50';
      case 'hold': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    switch (status) {
      case 'active': return '진행중';
      case 'completed': return '완료';
      case 'review': return '검토중';
      case 'preparing': return '준비중';
      case 'hold': return '보류';
      default: return status;
    }
  };

  const viewModes = [
    { id: 'kanban', label: '칸반', icon: FolderKanban },
    { id: 'list', label: '리스트', icon: List },
    { id: 'gantt', label: '간트', icon: Calendar },
    { id: 'grid', label: '그리드', icon: Grid3x3 }
  ];

  const filterOptions = [
    { id: 'all', label: '전체' },
    { id: 'active', label: '진행중' },
    { id: 'completed', label: '완료' },
    { id: 'hold', label: '보류' }
  ];

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">프로젝트 관리</h1>
              <p className="text-gray-600 mt-1">모든 프로젝트를 한눈에 관리하세요</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새 프로젝트
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* View Mode Selector */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {viewModes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as ViewMode)}
                    className={`px-3 py-1.5 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
                      viewMode === mode.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Filters and Search */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="flex gap-1">
                {filterOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setFilterStatus(option.id as ProjectFilter)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      filterStatus === option.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="프로젝트 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button className="p-1.5 text-gray-600 hover:text-gray-900">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <KanbanBoard projects={filteredProjects} onProjectClick={(project) => navigate(`/startup/buildup/projects/${project.id}`)} />
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      프로젝트
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      진행률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      PM
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      다음 마일스톤
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProjects.map(project => (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/startup/buildup/projects/${project.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {project.category}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.progress.overall}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {project.progress.overall}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
                            {project.team?.pm?.name?.[0] || 'P'}
                          </div>
                          <span className="text-sm text-gray-900">
                            {project.team?.pm?.name || 'PM'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {project.timeline.next_milestone ? (
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {project.timeline.next_milestone.name}
                            </div>
                            <div className="text-gray-500">
                              {new Date(project.timeline.next_milestone.due_date).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle menu
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/startup/buildup/projects/${project.id}`)}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900 line-clamp-1">
                      {project.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">진행률</span>
                        <span className="font-medium">{project.progress.overall}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${project.progress.overall}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span>{project.deliverables.length} 산출물</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Users className="w-3 h-3" />
                        <span>{project.team?.members?.length || 0}명</span>
                      </div>
                    </div>

                    {project.timeline.next_milestone && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>다음: {project.timeline.next_milestone.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Gantt View (Placeholder) */}
          {viewMode === 'gantt' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">간트 차트 뷰는 준비중입니다</p>
            </div>
          )}

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">프로젝트가 없습니다</p>
              <p className="text-sm text-gray-400 mt-1">새 프로젝트를 생성해보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Panel */}
      {selectedProject && (
        <ProjectDetailPanel
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}