import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Project } from '../../types/buildup.types';
import { Clock, Users, AlertCircle } from 'lucide-react';

interface KanbanBoardProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export default function KanbanBoard({ projects, onProjectClick }: KanbanBoardProps) {
  const columns = [
    { id: 'preparing', label: '준비중', color: 'bg-gray-100' },
    { id: 'active', label: '진행중', color: 'bg-blue-100' },
    { id: 'review', label: '검토중', color: 'bg-yellow-100' },
    { id: 'completed', label: '완료', color: 'bg-green-100' }
  ];

  const getProjectsByStatus = (status: string) => {
    return projects.filter(p => p.status === status);
  };

  const getPriorityColor = (project: Project) => {
    // Simple priority logic based on days remaining
    if (project.timeline.next_milestone) {
      const daysRemaining = Math.ceil(
        (new Date(project.timeline.next_milestone.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysRemaining <= 3) return 'border-red-500';
      if (daysRemaining <= 7) return 'border-yellow-500';
    }
    return 'border-gray-200';
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-4 h-full">
        {columns.map(column => (
          <div key={column.id} className="flex-1 min-w-[300px]">
            <div className={`${column.color} rounded-t-lg p-3`}>
              <h3 className="font-semibold text-gray-900">
                {column.label}
                <span className="ml-2 text-sm text-gray-600">
                  ({getProjectsByStatus(column.id).length})
                </span>
              </h3>
            </div>
            
            <div className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] space-y-3">
              {getProjectsByStatus(column.id).map(project => (
                <div
                  key={project.id}
                  onClick={() => onProjectClick(project)}
                  className={`bg-white rounded-lg shadow-sm border-2 ${getPriorityColor(project)} p-4 cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">진행률</span>
                      <span className="font-medium">{project.progress.overall}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${project.progress.overall}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        {project.timeline.next_milestone && (
                          <>
                            <Clock className="w-3 h-3" />
                            <span>
                              {Math.ceil(
                                (new Date(project.timeline.next_milestone.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                              )}일
                            </span>
                          </>
                        )}
                      </div>
                      
                      {project.team?.pm && (
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">
                            {project.team.pm.name[0]}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {project.risks && project.risks.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        <span>{project.risks.length} 리스크</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {getProjectsByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">프로젝트가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DndProvider>
  );
}