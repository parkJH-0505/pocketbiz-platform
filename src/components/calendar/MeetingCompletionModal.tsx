/**
 * MeetingCompletionModal.tsx
 *
 * 미팅 완료 처리를 위한 모달 컴포넌트
 * 미팅 내용 기록, 참석자 확인, 다음 단계 설정 등을 처리
 */

import React, { useState, useEffect } from 'react';
import { X, Users, FileText, Calendar, CheckCircle, AlertCircle, Clock, Target } from 'lucide-react';
import type { CalendarEvent } from '../../types/calendar.types';
import type { GuideMeetingRecord, MeetingType } from '../../types/buildup.types';

interface MeetingCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onComplete: (record: Partial<GuideMeetingRecord>) => void;
}

interface MeetingOutcome {
  id: string;
  text: string;
  completed: boolean;
}

interface NextStep {
  id: string;
  action: string;
  deadline?: string;
  responsible?: string;
}

export default function MeetingCompletionModal({
  isOpen,
  onClose,
  event,
  onComplete
}: MeetingCompletionModalProps) {
  // Form states
  const [attendees, setAttendees] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [outcomes, setOutcomes] = useState<MeetingOutcome[]>([]);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [meetingSatisfaction, setMeetingSatisfaction] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 새로운 outcome 입력
  const [newOutcome, setNewOutcome] = useState('');
  const [newNextStep, setNewNextStep] = useState('');

  // 초기화
  useEffect(() => {
    if (event && isOpen) {
      // 이벤트의 참석자 정보로 초기화
      setAttendees(event.attendees || []);
      setNotes('');
      setOutcomes([]);
      setNextSteps([]);
      setMeetingSatisfaction('good');
    }
  }, [event, isOpen]);

  // Outcome 추가
  const addOutcome = () => {
    if (newOutcome.trim()) {
      setOutcomes([
        ...outcomes,
        {
          id: `outcome-${Date.now()}`,
          text: newOutcome.trim(),
          completed: false
        }
      ]);
      setNewOutcome('');
    }
  };

  // Next Step 추가
  const addNextStep = () => {
    if (newNextStep.trim()) {
      setNextSteps([
        ...nextSteps,
        {
          id: `step-${Date.now()}`,
          action: newNextStep.trim()
        }
      ]);
      setNewNextStep('');
    }
  };

  // Outcome 완료 토글
  const toggleOutcome = (id: string) => {
    setOutcomes(outcomes.map(o =>
      o.id === id ? { ...o, completed: !o.completed } : o
    ));
  };

  // 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    setIsSubmitting(true);

    try {
      const meetingRecord: Partial<GuideMeetingRecord> = {
        id: `meeting-${Date.now()}`,
        projectId: event.projectId || '',
        type: event.meetingType || '정기',
        calendarEventId: event.id,
        date: new Date(event.start),
        attendees,
        notes,
        outcomes: outcomes.filter(o => o.completed).map(o => o.text),
        nextSteps: nextSteps.map(s => s.action),
        completedAt: new Date(),
        completedBy: 'current-user' // TODO: 실제 사용자 ID
      };

      await onComplete(meetingRecord);

      // 성공 피드백
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to complete meeting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                미팅 완료 처리
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {event.title} • {new Date(event.start).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 참석자 확인 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 mr-2" />
                참석자 확인
              </label>
              <div className="space-y-2">
                {attendees.map((attendee, index) => (
                  <label key={index} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked
                      className="mr-3 text-blue-600 rounded focus:ring-blue-500"
                      readOnly
                    />
                    <span className="text-sm text-gray-900">{attendee}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 미팅 만족도 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 mr-2" />
                미팅 만족도
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['excellent', 'good', 'fair', 'poor'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setMeetingSatisfaction(level)}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-all
                      ${meetingSatisfaction === level
                        ? level === 'excellent' ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : level === 'good' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : level === 'fair' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500'
                        : 'bg-red-100 text-red-700 border-2 border-red-500'
                        : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
                      }
                    `}
                  >
                    {level === 'excellent' ? '매우 만족' :
                     level === 'good' ? '만족' :
                     level === 'fair' ? '보통' : '불만족'}
                  </button>
                ))}
              </div>
            </div>

            {/* 주요 논의사항 */}
            <div>
              <label htmlFor="notes" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                주요 논의사항
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="미팅에서 논의된 주요 내용을 입력해주세요..."
                required
              />
            </div>

            {/* 미팅 성과 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                미팅 성과 (달성한 목표)
              </label>
              <div className="space-y-2">
                {outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={outcome.completed}
                      onChange={() => toggleOutcome(outcome.id)}
                      className="mr-3 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className={`text-sm ${outcome.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {outcome.text}
                    </span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                    placeholder="달성한 목표 추가..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addOutcome}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 다음 단계 */}
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                다음 단계 액션 아이템
              </label>
              <div className="space-y-2">
                {nextSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-start p-3 bg-blue-50 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-900">{step.action}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNextStep}
                    onChange={(e) => setNewNextStep(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNextStep())}
                    placeholder="다음 단계 액션 추가..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addNextStep}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    추가
                  </button>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !notes.trim()}
                className={`
                  px-6 py-3 rounded-lg font-medium transition-all
                  ${isSubmitting || !notes.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  '미팅 완료'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}