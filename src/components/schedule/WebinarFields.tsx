/**
 * WebinarFields Component
 *
 * 웨비나 전용 필드 컴포넌트
 * 발표자 정보, 등록 관리, 스트리밍 설정, 자료 업로드 등을 처리
 */

import React, { useState, useMemo } from 'react';
import {
  Video,
  Users,
  Globe,
  FileText,
  Link2,
  Upload,
  Calendar,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import type { TypeSpecificFieldsProps } from './types';

// 웨비나 플랫폼 타입
type WebinarPlatform = 'zoom' | 'youtube' | 'custom' | 'offline';

// 웨비나 타입
type WebinarType = 'live' | 'recorded' | 'hybrid';

// 접근 레벨
type AccessLevel = 'public' | 'members' | 'invite_only' | 'paid';

/**
 * 웨비나 특화 필드 컴포넌트
 */
export const WebinarFields: React.FC<TypeSpecificFieldsProps> = ({
  formData,
  onChange,
  errors,
  mode
}) => {
  const isReadOnly = mode === 'view';

  // 발표자 추가 상태
  const [speakerInput, setSpeakerInput] = useState({ name: '', title: '', company: '' });

  // 플랫폼별 설정 표시 여부
  const showPlatformSettings = useMemo(() => {
    return formData.webinarPlatform && formData.webinarPlatform !== 'offline';
  }, [formData.webinarPlatform]);

  // 발표자 추가
  const handleAddSpeaker = () => {
    if (!speakerInput.name.trim()) return;

    const currentSpeakers = formData.speakers || [];
    const newSpeaker = {
      name: speakerInput.name.trim(),
      title: speakerInput.title.trim(),
      company: speakerInput.company.trim()
    };

    onChange({
      speakers: [...currentSpeakers, newSpeaker]
    });

    setSpeakerInput({ name: '', title: '', company: '' });
  };

  // 발표자 제거
  const handleRemoveSpeaker = (index: number) => {
    const currentSpeakers = formData.speakers || [];
    onChange({
      speakers: currentSpeakers.filter((_, i) => i !== index)
    });
  };

  // 예상 참석자 수에 따른 추천 플랫폼
  const getRecommendedPlatform = (attendeeCount: number) => {
    if (attendeeCount <= 100) return 'zoom';
    if (attendeeCount <= 500) return 'youtube';
    return 'custom';
  };

  return (
    <div className="space-y-6">
      {/* 웨비나 기본 정보 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 웨비나 타입 */}
        <div>
          <label htmlFor="webinarType" className="block text-sm text-gray-600 mb-1.5">
            웨비나 형식
          </label>
          <select
            id="webinarType"
            value={formData.webinarType || 'live'}
            onChange={(e) => onChange({ webinarType: e.target.value as WebinarType })}
            disabled={isReadOnly}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="live">실시간 라이브</option>
            <option value="recorded">사전 녹화</option>
            <option value="hybrid">하이브리드 (라이브 + 녹화)</option>
          </select>
          {errors.webinarType && (
            <p className="mt-1 text-sm text-red-600">{errors.webinarType}</p>
          )}
        </div>

        {/* 접근 레벨 */}
        <div>
          <label htmlFor="accessLevel" className="block text-sm text-gray-600 mb-1.5">
            참여 대상
          </label>
          <select
            id="accessLevel"
            value={formData.accessLevel || 'public'}
            onChange={(e) => onChange({ accessLevel: e.target.value as AccessLevel })}
            disabled={isReadOnly}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="public">누구나 참여 가능</option>
            <option value="members">회원 전용</option>
            <option value="invite_only">초대받은 사람만</option>
            <option value="paid">유료 참가자</option>
          </select>
          {errors.accessLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.accessLevel}</p>
          )}
        </div>
      </div>

      {/* 플랫폼 및 스트리밍 설정 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">진행 플랫폼</span>
        </div>
        <select
          id="webinarPlatform"
          value={formData.webinarPlatform || ''}
          onChange={(e) => onChange({ webinarPlatform: e.target.value as WebinarPlatform })}
          disabled={isReadOnly}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">플랫폼을 선택하세요</option>
          <option value="zoom">Zoom 웨비나</option>
          <option value="youtube">YouTube Live</option>
          <option value="custom">자체 플랫폼</option>
          <option value="offline">오프라인</option>
        </select>

        {/* 플랫폼별 추가 설정 */}
        {showPlatformSettings && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">스트리밍 링크</span>
            </div>
            <input
              type="url"
              id="streamingLink"
              value={formData.streamingLink || ''}
              onChange={(e) => onChange({ streamingLink: e.target.value })}
              disabled={isReadOnly}
              placeholder="https://..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        )}

        {errors.webinarPlatform && (
          <p className="mt-1 text-sm text-red-600">{errors.webinarPlatform}</p>
        )}
      </div>

      {/* 발표자 정보 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">발표자 정보</span>
        </div>

        {!isReadOnly && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <input
              type="text"
              value={speakerInput.name}
              onChange={(e) => setSpeakerInput({ ...speakerInput, name: e.target.value })}
              placeholder="이름 *"
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <input
              type="text"
              value={speakerInput.title}
              onChange={(e) => setSpeakerInput({ ...speakerInput, title: e.target.value })}
              placeholder="직책"
              className="px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={speakerInput.company}
                onChange={(e) => setSpeakerInput({ ...speakerInput, company: e.target.value })}
                placeholder="소속"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        )}

        {/* 발표자 리스트 */}
        <div className="space-y-2">
          {(!formData.speakers || formData.speakers.length === 0) ? (
            <p className="text-sm text-gray-500 py-2">
              발표자 정보를 추가해주세요
            </p>
          ) : (
            formData.speakers.map((speaker, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {speaker.name}
                  </span>
                  {(speaker.title || speaker.company) && (
                    <span className="text-sm text-gray-600 ml-2">
                      {speaker.title && speaker.title}
                      {speaker.title && speaker.company && ' · '}
                      {speaker.company && speaker.company}
                    </span>
                  )}
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSpeaker(index)}
                    className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors text-sm"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 참가 인원 관리 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="maxAttendees" className="block text-sm text-gray-600 mb-1.5">
            최대 참가 인원
          </label>
          <input
            type="number"
            id="maxAttendees"
            min="1"
            value={formData.maxAttendees || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || undefined;
              onChange({ maxAttendees: value });
              // 자동 플랫폼 추천
              if (value && !formData.webinarPlatform) {
                const recommended = getRecommendedPlatform(value);
                onChange({
                  maxAttendees: value,
                  webinarPlatform: recommended
                });
              }
            }}
            disabled={isReadOnly}
            placeholder="예: 100"
            className={`
              w-full px-4 py-2.5 border border-gray-200 rounded-lg
              ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'}
            `}
          />
          {formData.maxAttendees && formData.maxAttendees > 100 && (
            <p className="mt-1 text-xs text-yellow-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              대규모 웨비나는 사전 준비가 필요합니다
            </p>
          )}
        </div>

        <div>
          <label htmlFor="registeredCount" className="block text-sm text-gray-600 mb-1.5">
            현재 등록 인원
          </label>
          <div className="relative">
            <input
              type="number"
              id="registeredCount"
              min="0"
              value={formData.registeredCount || 0}
              onChange={(e) => onChange({ registeredCount: parseInt(e.target.value) || 0 })}
              disabled={isReadOnly}
              className={`
                w-full px-3 py-2 border rounded-lg border-gray-300
                ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
              `}
            />
            {formData.maxAttendees && formData.registeredCount !== undefined && (
              <div className="absolute -bottom-5 left-0 right-0">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      formData.registeredCount >= formData.maxAttendees
                        ? 'bg-red-500'
                        : formData.registeredCount >= formData.maxAttendees * 0.8
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((formData.registeredCount / formData.maxAttendees) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 웨비나 자료 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">웨비나 자료</span>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="presentationUrl" className="block text-xs text-gray-600 mb-1">
              발표 자료 URL
            </label>
            <input
              type="url"
              id="presentationUrl"
              value={formData.presentationUrl || ''}
              onChange={(e) => onChange({ presentationUrl: e.target.value })}
              disabled={isReadOnly}
              placeholder="Google Slides, PDF 링크 등"
              className={`
                w-full px-3 py-2 border rounded-lg border-gray-300
                ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
              `}
            />
          </div>

          {formData.webinarType === 'recorded' && (
            <div>
              <label htmlFor="recordingUrl" className="block text-xs text-gray-600 mb-1">
                녹화 영상 URL
              </label>
              <input
                type="url"
                id="recordingUrl"
                value={formData.recordingUrl || ''}
                onChange={(e) => onChange({ recordingUrl: e.target.value })}
                disabled={isReadOnly}
                placeholder="녹화된 영상 링크"
                className={`
                  w-full px-3 py-2 border rounded-lg border-gray-300
                  ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
                `}
              />
            </div>
          )}
        </div>
      </div>

      {/* 웨비나 설명 */}
      <div>
        <label htmlFor="webinarDescription" className="block text-sm text-gray-600 mb-1.5">
          웨비나 소개 및 아젠다
        </label>
        <textarea
          id="webinarDescription"
          rows={4}
          value={formData.webinarDescription || ''}
          onChange={(e) => onChange({ webinarDescription: e.target.value })}
          disabled={isReadOnly}
          placeholder="웨비나 내용, 대상, 학습 목표 등을 자세히 설명해주세요"
          className={`
            w-full px-3 py-2 border rounded-lg border-gray-300
            ${isReadOnly ? 'bg-gray-50 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}
          `}
        />
      </div>

      {/* 추가 옵션 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.enableQA || false}
            onChange={(e) => onChange({ enableQA: e.target.checked })}
            disabled={isReadOnly}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            Q&A 세션 진행
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.recordSession || false}
            onChange={(e) => onChange({ recordSession: e.target.checked })}
            disabled={isReadOnly}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            <Video className="w-4 h-4 text-gray-500" />
            세션 녹화 (참가자 동의 필요)
          </span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.sendReminder || false}
            onChange={(e) => onChange({ sendReminder: e.target.checked })}
            disabled={isReadOnly}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="text-sm text-gray-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            참가자에게 리마인더 발송
          </span>
        </label>
      </div>
    </div>
  );
};

export default WebinarFields;