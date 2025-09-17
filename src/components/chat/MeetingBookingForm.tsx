import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Video, Send } from 'lucide-react';

interface MeetingBookingFormProps {
  onSubmit: (formData: MeetingBookingData) => void;
  disabled?: boolean;
}

export interface MeetingBookingData {
  date: string;
  time: string;
  duration: number;
  type: 'online' | 'offline';
  location?: string;
  agenda: string;
  notes?: string;
}

export default function MeetingBookingForm({ onSubmit, disabled = false }: MeetingBookingFormProps) {
  const [formData, setFormData] = useState<MeetingBookingData>({
    date: '',
    time: '',
    duration: 45,
    type: 'online',
    location: '',
    agenda: '프로젝트 목표 및 요구사항 논의',
    notes: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.time) return;

    setIsSubmitted(true);
    onSubmit(formData);
  };

  const updateField = <K extends keyof MeetingBookingData>(
    field: K,
    value: MeetingBookingData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 오늘부터 30일 후까지의 평일만 표시
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      // 평일만 (월-금)
      if (date.getDay() >= 1 && date.getDay() <= 5) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
          })
        });
      }
    }

    return dates.slice(0, 14); // 최대 14개 날짜
  };

  const timeSlots = [
    '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div className="text-green-600 mb-2">
          ✅ 미팅 예약 요청이 전송되었습니다!
        </div>
        <div className="text-sm text-green-700">
          경영지원팀에서 검토 후 확정된 일정을 안내드리겠습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 text-blue-800 font-medium">
        <Calendar className="h-4 w-4" />
        <span>가이드 미팅 예약</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 날짜 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            희망 날짜
          </label>
          <select
            value={formData.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">날짜를 선택하세요</option>
            {getAvailableDates().map(date => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </div>

        {/* 시간 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            희망 시간
          </label>
          <select
            value={formData.time}
            onChange={(e) => updateField('time', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">시간을 선택하세요</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* 미팅 방식 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            미팅 방식
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="online"
                checked={formData.type === 'online'}
                onChange={(e) => updateField('type', 'online')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <Video className="h-4 w-4 text-blue-600" />
              <span className="text-sm">온라인 (Zoom)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                value="offline"
                checked={formData.type === 'offline'}
                onChange={(e) => updateField('type', 'offline')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm">오프라인 (강남 사무실)</span>
            </label>
          </div>
        </div>

        {/* 소요시간 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            예상 소요시간
          </label>
          <select
            value={formData.duration}
            onChange={(e) => updateField('duration', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>30분</option>
            <option value={45}>45분 (권장)</option>
            <option value={60}>60분</option>
          </select>
        </div>

        {/* 추가 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            추가 요청사항 (선택)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="특별한 요청사항이나 미리 논의하고 싶은 내용이 있으시면 적어주세요."
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={disabled || !formData.date || !formData.time}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Send className="h-4 w-4" />
          <span>미팅 예약 요청하기</span>
        </button>
      </form>
    </div>
  );
}