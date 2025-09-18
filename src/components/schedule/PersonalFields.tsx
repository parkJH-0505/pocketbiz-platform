/**
 * PersonalFields Component
 *
 * 개인 일정 전용 필드 컴포넌트
 * 카테고리, 우선순위, 반복 설정, 알림 등 개인 일정 관리 기능
 */

import React, { useMemo, useState } from 'react';
import {
  Tag,
  Flag,
  Repeat,
  Bell,
  MapPin,
  Clock,
  Calendar,
  Target,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { TypeSpecificFieldsProps } from './types';

// 일정 카테고리
type PersonalCategory = 'work' | 'meeting' | 'personal' | 'health' | 'learning' | 'social' | 'other';

// 우선순위
type Priority = 'low' | 'medium' | 'high' | 'urgent';

// 반복 타입
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

// 알림 타입
type ReminderType = 'none' | '5min' | '15min' | '30min' | '1hour' | '1day' | 'custom';

/**
 * 개인 일정 특화 필드 컴포넌트
 */
export const PersonalFields: React.FC<TypeSpecificFieldsProps> = ({
  formData,
  onChange,
  errors,
  mode
}) => {
  const isReadOnly = mode === 'view';

  // 커스텀 반복 설정 표시 여부
  const [showCustomRecurrence, setShowCustomRecurrence] = useState(
    formData.recurrenceType === 'custom'
  );

  // 카테고리별 색상 매핑
  const categoryColors: Record<PersonalCategory, { bg: string; text: string; border: string }> = {
    work: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' },
    meeting: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' },
    personal: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' },
    health: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' },
    learning: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' },
    social: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' },
    other: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-400' }
  };

  // 우선순위별 색상 매핑
  const priorityColors: Record<Priority, { color: string; icon: React.ReactNode }> = {
    low: { color: 'text-gray-500', icon: <Info className="w-4 h-4" /> },
    medium: { color: 'text-blue-500', icon: <CheckCircle className="w-4 h-4" /> },
    high: { color: 'text-orange-500', icon: <AlertTriangle className="w-4 h-4" /> },
    urgent: { color: 'text-red-500', icon: <Flag className="w-4 h-4" /> }
  };

  // 카테고리 옵션
  const categoryOptions: { value: PersonalCategory; label: string }[] = [
    { value: 'work', label: '업무' },
    { value: 'meeting', label: '미팅' },
    { value: 'personal', label: '개인' },
    { value: 'health', label: '건강' },
    { value: 'learning', label: '학습' },
    { value: 'social', label: '소셜' },
    { value: 'other', label: '기타' }
  ];

  // 반복 종료일 계산 (예: 10회 반복 시 예상 종료일)
  const calculateEndDate = useMemo(() => {
    if (!formData.recurrenceType || formData.recurrenceType === 'none') return null;
    if (!formData.recurrenceCount) return null;

    const startDate = formData.startDateTime ? new Date(formData.startDateTime) : new Date();
    const count = formData.recurrenceCount || 1;

    switch (formData.recurrenceType) {
      case 'daily':
        startDate.setDate(startDate.getDate() + count);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() + (count * 7));
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() + count);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() + count);
        break;
    }

    return startDate;
  }, [formData.recurrenceType, formData.recurrenceCount, formData.startDateTime]);

  return (
    <div className="space-y-6">
      {/* 카테고리 선택 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">카테고리 선택</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {categoryOptions.map(option => {
            const isSelected = formData.personalCategory === option.value;
            const colors = categoryColors[option.value];

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ personalCategory: option.value })}
                disabled={isReadOnly}
                className={`
                  px-4 py-2.5 rounded-lg border transition-colors
                  ${isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text} border`
                    : 'border-gray-200 hover:border-gray-300'
                  }
                  ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                <span className="text-sm">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 우선순위 설정 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Flag className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">우선순위</span>
        </div>
        <div className="flex gap-2">
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(priority => {
            const isSelected = formData.priority === priority;
            const { color, icon } = priorityColors[priority];
            const labels = {
              low: '낮음',
              medium: '보통',
              high: '높음',
              urgent: '긴급'
            };

            return (
              <button
                key={priority}
                type="button"
                onClick={() => onChange({ priority })}
                disabled={isReadOnly}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors
                  ${isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }
                  ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                <span className={color}>{icon}</span>
                <span className="text-sm">{labels[priority]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 위치 정보 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">장소</span>
        </div>
        <input
          type="text"
          id="location"
          value={formData.location || ''}
          onChange={(e) => onChange({ location: e.target.value })}
          disabled={isReadOnly}
          placeholder="장소를 입력하세요"
          className={`
            w-full px-4 py-2.5 border border-gray-200 rounded-lg
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
          `}
        />
      </div>

      {/* 반복 설정 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">반복 설정</span>
        </div>
        <div className="space-y-3">
          <select
            value={formData.recurrenceType || 'none'}
            onChange={(e) => {
              const value = e.target.value as RecurrenceType;
              onChange({ recurrenceType: value });
              setShowCustomRecurrence(value === 'custom');
            }}
            disabled={isReadOnly}
            className={`
              w-full px-3 py-2 border rounded-lg border-gray-300
              ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
            `}
          >
            <option value="none">반복 안 함</option>
            <option value="daily">매일</option>
            <option value="weekly">매주</option>
            <option value="monthly">매월</option>
            <option value="yearly">매년</option>
            <option value="custom">사용자 지정</option>
          </select>

          {/* 반복 횟수 및 종료일 */}
          {formData.recurrenceType && formData.recurrenceType !== 'none' && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="recurrenceCount" className="block text-xs text-gray-600 mb-1">
                    반복 횟수
                  </label>
                  <input
                    type="number"
                    id="recurrenceCount"
                    min="1"
                    max="365"
                    value={formData.recurrenceCount || ''}
                    onChange={(e) => onChange({ recurrenceCount: parseInt(e.target.value) || undefined })}
                    disabled={isReadOnly}
                    placeholder="예: 10"
                    className={`
                      w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                      ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
                    `}
                  />
                </div>
                <div>
                  <label htmlFor="recurrenceEndDate" className="block text-xs text-gray-600 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    id="recurrenceEndDate"
                    value={formData.recurrenceEndDate || ''}
                    onChange={(e) => onChange({ recurrenceEndDate: e.target.value })}
                    disabled={isReadOnly}
                    className={`
                      w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                      ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
                    `}
                  />
                </div>
              </div>

              {calculateEndDate && (
                <p className="text-xs text-gray-600 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  예상 종료일: {calculateEndDate.toLocaleDateString('ko-KR')}
                </p>
              )}

              {/* 커스텀 반복 설정 */}
              {showCustomRecurrence && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700">반복 요일 선택</p>
                  <div className="flex gap-1">
                    {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
                      const isSelected = formData.recurrenceDays?.includes(index) || false;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const currentDays = formData.recurrenceDays || [];
                            const newDays = isSelected
                              ? currentDays.filter(d => d !== index)
                              : [...currentDays, index];
                            onChange({ recurrenceDays: newDays });
                          }}
                          disabled={isReadOnly}
                          className={`
                            w-8 h-8 rounded-full text-xs font-medium transition-colors
                            ${isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                            ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                          `}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 알림 설정 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">알림 설정</span>
        </div>
        <select
          value={formData.reminderType || 'none'}
          onChange={(e) => onChange({ reminderType: e.target.value as ReminderType })}
          disabled={isReadOnly}
          className={`
            w-full px-4 py-2.5 border border-gray-200 rounded-lg
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
          `}
        >
          <option value="none">알림 없음</option>
          <option value="5min">5분 전</option>
          <option value="15min">15분 전</option>
          <option value="30min">30분 전</option>
          <option value="1hour">1시간 전</option>
          <option value="1day">1일 전</option>
          <option value="custom">사용자 지정</option>
        </select>

        {formData.reminderType === 'custom' && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={formData.customReminderMinutes || ''}
              onChange={(e) => onChange({ customReminderMinutes: parseInt(e.target.value) || undefined })}
              disabled={isReadOnly}
              placeholder="시간"
              className={`
                w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm
                ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
              `}
            />
            <span className="text-sm text-gray-600">분 전</span>
          </div>
        )}
      </div>

      {/* 목표 및 메모 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">목표 및 메모</span>
        </div>
        <textarea
          id="personalGoals"
          rows={3}
          value={formData.personalGoals || ''}
          onChange={(e) => onChange({ personalGoals: e.target.value })}
          disabled={isReadOnly}
          placeholder="이 일정의 목표나 준비사항을 메모하세요"
          className={`
            w-full px-4 py-2.5 border border-gray-200 rounded-lg
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
          `}
        />
      </div>

      {/* 체크리스트 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">체크리스트</span>
        </div>
        {!isReadOnly && (
          <div className="mb-2">
            <input
              type="text"
              placeholder="할 일을 입력하고 Enter를 누르세요"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  if (input.value.trim()) {
                    const currentChecklist = formData.checklist || [];
                    onChange({
                      checklist: [
                        ...currentChecklist,
                        { id: Date.now().toString(), text: input.value.trim(), completed: false }
                      ]
                    });
                    input.value = '';
                  }
                }
              }}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        )}
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {formData.checklist?.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={(e) => {
                  const currentChecklist = formData.checklist || [];
                  onChange({
                    checklist: currentChecklist.map(i =>
                      i.id === item.id ? { ...i, completed: e.target.checked } : i
                    )
                  });
                }}
                disabled={isReadOnly}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {item.text}
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const currentChecklist = formData.checklist || [];
                    onChange({
                      checklist: currentChecklist.filter(i => i.id !== item.id)
                    });
                  }}
                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          {(!formData.checklist || formData.checklist.length === 0) && (
            <p className="text-sm text-gray-500 py-2">체크리스트가 비어있습니다</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalFields;