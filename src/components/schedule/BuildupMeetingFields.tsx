/**
 * BuildupMeetingFields Component
 * 
 * 빌드업 프로젝트 미팅 전용 필드 컴포넌트
 * 프로젝트 선택, 미팅 차수, PM 정보, 단계 전환 설정 등을 관리
 */

import React, { useMemo } from 'react';
import { useBuildupContext } from '../../contexts/BuildupContext';
import type { TypeSpecificFieldsProps } from './types';
import { 
  getMeetingSequenceLabel, 
  getPhaseTransitionInfo,
  getFieldError 
} from './utils';

/**
 * 빌드업 프로젝트 미팅 특화 필드 컴포넌트
 */
export const BuildupMeetingFields: React.FC<TypeSpecificFieldsProps> = ({
  formData,
  onChange,
  errors,
  mode,
  project
}) => {
  const { projects } = useBuildupContext();
  const isReadOnly = mode === 'view';

  // 선택된 프로젝트 정보
  const selectedProject = useMemo(() => {
    if (!formData.projectId) return null;
    return projects.find(p => p.id === formData.projectId) || project;
  }, [formData.projectId, projects, project]);

  // 단계 전환 정보 계산
  const phaseTransitionInfo = useMemo(() => {
    if (!formData.meetingSequenceType || !formData.phaseTransitionEnabled) {
      return null;
    }
    return getPhaseTransitionInfo(
      formData.meetingSequenceType,
      selectedProject?.phase
    );
  }, [formData.meetingSequenceType, formData.phaseTransitionEnabled, selectedProject]);

  // 미팅 시퀀스 옵션
  const meetingSequenceOptions = [
    { value: 'pre_meeting', label: '프리미팅' },
    { value: 'guide_1', label: '가이드 1차 (킥오프)' },
    { value: 'guide_2', label: '가이드 2차' },
    { value: 'guide_3', label: '가이드 3차' },
    { value: 'guide_4', label: '가이드 4차' }
  ];

  return (
    <div className="space-y-6">
      {/* 프로젝트 선택 */}
      <div>
        <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
          프로젝트 <span className="text-red-500">*</span>
        </label>
        {project ? (
          // 프로젝트가 이미 지정된 경우 (ProjectDetail에서 호출)
          <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-sm font-medium text-gray-900">{project.title}</p>
            <p className="text-xs text-gray-500 mt-1">
              현재 단계: {project.phase}
            </p>
          </div>
        ) : (
          // 프로젝트 선택 드롭다운
          <select
            id="projectId"
            value={formData.projectId || ''}
            onChange={(e) => onChange({ projectId: e.target.value })}
            disabled={isReadOnly}
            className={`
              w-full px-3 py-2 border rounded-lg
              ${errors.projectId ? 'border-red-300' : 'border-gray-300'}
              ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
            `}
          >
            <option value="">프로젝트를 선택하세요</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.phase})
              </option>
            ))}
          </select>
        )}
        {errors.projectId && (
          <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
        )}
      </div>

      {/* 미팅 차수 선택 */}
      <div>
        <label htmlFor="meetingSequenceType" className="block text-sm font-medium text-gray-700 mb-1">
          미팅 차수 <span className="text-red-500">*</span>
        </label>
        <select
          id="meetingSequenceType"
          value={formData.meetingSequenceType || ''}
          onChange={(e) => onChange({ meetingSequenceType: e.target.value as any })}
          disabled={isReadOnly}
          className={`
            w-full px-3 py-2 border rounded-lg
            ${errors.meetingSequenceType ? 'border-red-300' : 'border-gray-300'}
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
          `}
        >
          <option value="">미팅 차수를 선택하세요</option>
          {meetingSequenceOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.meetingSequenceType && (
          <p className="mt-1 text-sm text-red-600">{errors.meetingSequenceType}</p>
        )}
      </div>

      {/* PM 이름 */}
      <div>
        <label htmlFor="pmName" className="block text-sm font-medium text-gray-700 mb-1">
          담당 PM
        </label>
        <input
          id="pmName"
          type="text"
          value={formData.pmName || ''}
          onChange={(e) => onChange({ pmName: e.target.value })}
          placeholder="담당 PM 이름을 입력하세요"
          disabled={isReadOnly}
          className={`
            w-full px-3 py-2 border rounded-lg
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
          `}
        />
      </div>

      {/* 미팅 노트 */}
      <div>
        <label htmlFor="meetingNotes" className="block text-sm font-medium text-gray-700 mb-1">
          미팅 노트
        </label>
        <textarea
          id="meetingNotes"
          value={formData.meetingNotes || ''}
          onChange={(e) => onChange({ meetingNotes: e.target.value })}
          placeholder="미팅 준비사항이나 주요 논의사항을 입력하세요"
          disabled={isReadOnly}
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-lg
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
          `}
        />
      </div>

      {/* 단계 전환 설정 (생성 모드에서만 표시) */}
      {mode === 'create' && (
        <div className="border-t pt-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="phaseTransitionEnabled"
                type="checkbox"
                checked={formData.phaseTransitionEnabled}
                onChange={(e) => onChange({ phaseTransitionEnabled: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="phaseTransitionEnabled" className="text-sm font-medium text-gray-700">
                프로젝트 단계 자동 전환
              </label>
              <p className="text-xs text-gray-500 mt-1">
                미팅 예약 시 프로젝트 단계를 자동으로 전환합니다
              </p>
            </div>
          </div>

          {/* 단계 전환 정보 표시 */}
          {phaseTransitionInfo && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <svg 
                  className="h-5 w-5 text-blue-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    단계 전환 예정
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {phaseTransitionInfo.description}
                  </p>
                  <div className="mt-2 flex items-center text-xs text-blue-600">
                    <span className="px-2 py-1 bg-blue-100 rounded">
                      {phaseTransitionInfo.fromPhase}
                    </span>
                    <svg 
                      className="h-4 w-4 mx-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <span className="px-2 py-1 bg-blue-100 rounded">
                      {phaseTransitionInfo.toPhase}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BuildupMeetingFields;