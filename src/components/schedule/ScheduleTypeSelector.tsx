/**
 * ScheduleTypeSelector Component
 * 
 * 스케줄 타입 선택 컴포넌트
 * 사용자가 생성하고자 하는 스케줄의 타입을 선택할 수 있도록 하는 UI
 */

import React from 'react';
import type { ScheduleTypeSelectorProps } from './types';
import { TYPE_ICONS, TYPE_LABELS } from './types';
import type { ScheduleType } from '../../types/schedule.types';

/**
 * 스케줄 타입 설명
 */
const TYPE_DESCRIPTIONS: Record<ScheduleType, string> = {
  buildup_project: '빌드업 프로젝트와 관련된 미팅을 예약합니다',
  mentor_session: '멘토와의 1:1 세션을 예약합니다',
  webinar: '웨비나 참석 일정을 등록합니다',
  pm_consultation: 'PM과의 상담 일정을 예약합니다',
  external_meeting: '외부 파트너와의 미팅을 등록합니다',
  general: '일반적인 일정을 등록합니다'
};

/**
 * 스케줄 타입 선택기 컴포넌트
 */
export const ScheduleTypeSelector: React.FC<ScheduleTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  const scheduleTypes: ScheduleType[] = [
    'buildup_project',
    'mentor_session',
    'webinar',
    'pm_consultation',
    'external_meeting',
    'general'
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900">
        일정 유형을 선택하세요
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scheduleTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            disabled={disabled}
            className={`
              relative rounded-lg border-2 p-4 flex items-start
              transition-all duration-200 text-left
              ${value === type 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'cursor-pointer hover:shadow-md'
              }
            `}
          >
            {/* 선택 지표 */}
            {value === type && (
              <div className="absolute top-2 right-2">
                <svg 
                  className="h-5 w-5 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}

            {/* 아이콘 */}
            <div className="flex-shrink-0">
              <span className="text-2xl">{TYPE_ICONS[type]}</span>
            </div>

            {/* 컨텐츠 */}
            <div className="ml-3 flex-1">
              <p className={`text-sm font-medium ${
                value === type ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {TYPE_LABELS[type]}
              </p>
              <p className={`mt-1 text-xs ${
                value === type ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {TYPE_DESCRIPTIONS[type]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 타입 정보 */}
      {value && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">선택된 유형:</span> {TYPE_LABELS[value]}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScheduleTypeSelector;