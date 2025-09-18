/**
 * CommonScheduleFields Component
 *
 * 모든 스케줄 타입에서 공통으로 사용되는 필드 컴포넌트
 * 제목, 설명, 시간, 장소 등의 기본 필드를 렌더링
 */

import React from 'react';
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react';
import type { StepComponentProps } from './types';
import { formatDateTimeLocal, getFieldError } from './utils';

/**
 * 공통 스케줄 필드 컴포넌트
 */
export const CommonScheduleFields: React.FC<StepComponentProps> = ({
  formData,
  onChange,
  errors,
  mode
}) => {
  const isReadOnly = mode === 'view';

  return (
    <div className="space-y-6">
      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="일정 제목을 입력하세요"
          disabled={isReadOnly}
          className={`
            w-full px-4 py-2.5 border rounded-lg transition-colors
            ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
          `}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-2">
          설명
        </label>
        <textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="일정에 대한 설명을 입력하세요"
          disabled={isReadOnly}
          rows={3}
          className={`
            w-full px-4 py-2.5 border rounded-lg resize-none transition-colors
            ${errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200'}
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
          `}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* 날짜 및 시간 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">일정 시간</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDateTime" className="block text-sm text-gray-600 mb-1.5">
              시작
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="startDateTime"
                type="datetime-local"
                value={formatDateTimeLocal(formData.startDateTime)}
                onChange={(e) => onChange({ startDateTime: e.target.value })}
                disabled={isReadOnly}
                className={`
                  w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors
                  ${errors.startDateTime ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
                `}
              />
            </div>
            {errors.startDateTime && (
              <p className="mt-1 text-sm text-red-600">{errors.startDateTime}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDateTime" className="block text-sm text-gray-600 mb-1.5">
              종료
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="endDateTime"
                type="datetime-local"
                value={formatDateTimeLocal(formData.endDateTime)}
                onChange={(e) => onChange({ endDateTime: e.target.value })}
                disabled={isReadOnly}
                className={`
                  w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors
                  ${errors.endDateTime ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
                `}
              />
            </div>
            {errors.endDateTime && (
              <p className="mt-1 text-sm text-red-600">{errors.endDateTime}</p>
            )}
          </div>
        </div>
      </div>

      {/* 장소 및 온라인 설정 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">위치 설정</span>
        </div>

        {/* 온라인 미팅 여부 */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => onChange({ isOnline: false })}
            disabled={isReadOnly}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              ${!formData.isOnline
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }
              ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <MapPin className="w-4 h-4" />
            오프라인
          </button>
          <button
            type="button"
            onClick={() => onChange({ isOnline: true })}
            disabled={isReadOnly}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
              ${formData.isOnline
                ? 'bg-blue-50 border-blue-500 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }
              ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            `}
          >
            <Video className="w-4 h-4" />
            온라인
          </button>
        </div>

        {/* 장소 또는 온라인 링크 입력 */}
        {formData.isOnline ? (
          <div>
            <label htmlFor="onlineLink" className="block text-sm text-gray-600 mb-1.5">
              미팅 링크
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="onlineLink"
                type="url"
                value={formData.onlineLink || ''}
                onChange={(e) => onChange({ onlineLink: e.target.value })}
                placeholder="https://zoom.us/..."
                disabled={isReadOnly}
                className={`
                  w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors
                  ${errors.onlineLink ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
                `}
              />
            </div>
            {errors.onlineLink && (
              <p className="mt-1 text-sm text-red-600">{errors.onlineLink}</p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="location" className="block text-sm text-gray-600 mb-1.5">
              장소
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="location"
                type="text"
                value={formData.location || ''}
                onChange={(e) => onChange({ location: e.target.value })}
                placeholder="미팅 장소를 입력하세요"
                disabled={isReadOnly}
                className={`
                  w-full pl-10 pr-4 py-2.5 border rounded-lg transition-colors
                  ${errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                  ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
                `}
              />
            </div>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        )}
      </div>

      {/* 참석자 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">참석자</span>
        </div>
        <input
          id="participants"
          type="text"
          value={formData.participants?.join(', ') || ''}
          onChange={(e) => {
            const participants = e.target.value
              .split(',')
              .map(p => p.trim())
              .filter(p => p.length > 0);
            onChange({ participants });
          }}
          placeholder="참석자 이름 또는 이메일을 입력하세요"
          disabled={isReadOnly}
          className={`
            w-full px-4 py-2.5 border rounded-lg transition-colors
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'border-gray-200 hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}
          `}
        />
        <p className="mt-1 text-xs text-gray-500">
          여러 명을 입력할 때는 쉼표(,)로 구분해주세요
        </p>
      </div>
    </div>
  );
};

export default CommonScheduleFields;