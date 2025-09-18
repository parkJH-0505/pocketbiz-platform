/**
 * MentorSessionFields Component
 *
 * 포켓멘토 세션 전용 필드 컴포넌트
 * 멘토 선택, 프로그램 정보, 세션 차수, 참석자 관리 등을 처리
 */

import React, { useMemo, useState } from 'react';
import { Users, BookOpen, Award, Clock, UserCheck, Info } from 'lucide-react';
import type { TypeSpecificFieldsProps } from './types';

// 임시 데이터 타입
interface Mentor {
  id: string;
  name: string;
  expertise: string;
  bio: string;
  email: string;
  rating: number;
  sessions: number;
}

interface MentorProgram {
  id: string;
  name: string;
  description: string;
  duration: number;
  progress: number;
}

/**
 * 포켓멘토 세션 특화 필드 컴포넌트
 */
export const MentorSessionFields: React.FC<TypeSpecificFieldsProps> = ({
  formData,
  onChange,
  errors,
  mode
}) => {
  const isReadOnly = mode === 'view';

  // 참석자 리스트 관리
  const [attendees, setAttendees] = useState<Array<{ name: string; email: string }>>(
    formData.attendees || [{ name: '', email: '' }]
  );

  // 임시 멘토 데이터
  const availableMentors: Mentor[] = useMemo(() => [
    {
      id: 'mentor-1',
      name: '김성진',
      expertise: '스타트업 전략',
      bio: '10년 경력의 스타트업 전문가',
      email: 'kim@pocketbiz.com',
      rating: 4.8,
      sessions: 120
    },
    {
      id: 'mentor-2',
      name: '이지은',
      expertise: '투자 유치',
      bio: 'VC 출신 투자 전문가',
      email: 'lee@pocketbiz.com',
      rating: 4.9,
      sessions: 89
    }
  ], []);

  // 임시 프로그램 데이터
  const availablePrograms: MentorProgram[] = useMemo(() => [
    {
      id: 'prog-1',
      name: '스타트업 성장 전략',
      description: '초기 스타트업의 성장 전략 수립',
      duration: 8,
      progress: 37
    },
    {
      id: 'prog-2',
      name: '투자 유치 마스터',
      description: 'IR 준비부터 투자 협상까지',
      duration: 12,
      progress: 25
    }
  ], []);

  const selectedMentor = availableMentors.find(m => m.id === formData.mentorInfo?.mentorId);
  const selectedProgram = availablePrograms.find(p => p.id === formData.programId);

  const handleMentorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mentor = availableMentors.find(m => m.id === e.target.value);
    if (mentor) {
      onChange({
        mentorInfo: {
          mentorId: mentor.id,
          mentorName: mentor.name,
          expertise: mentor.expertise
        }
      });
    }
  };

  const handleAttendeeChange = (index: number, field: 'name' | 'email', value: string) => {
    const newAttendees = [...attendees];
    newAttendees[index][field] = value;
    setAttendees(newAttendees);
    onChange({ attendees: newAttendees });
  };

  const addAttendee = () => {
    if (attendees.length < 10) {
      const newAttendees = [...attendees, { name: '', email: '' }];
      setAttendees(newAttendees);
      onChange({ attendees: newAttendees });
    }
  };

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      const newAttendees = attendees.filter((_, i) => i !== index);
      setAttendees(newAttendees);
      onChange({ attendees: newAttendees });
    }
  };

  return (
    <div className="space-y-6">
      {/* 멘토 선택 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">멘토 정보</span>
        </div>
        <select
          value={formData.mentorInfo?.mentorId || ''}
          onChange={handleMentorChange}
          disabled={isReadOnly}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">멘토를 선택하세요</option>
          {availableMentors.map(mentor => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.name} - {mentor.expertise}
            </option>
          ))}
        </select>

        {selectedMentor && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900">{selectedMentor.name}</p>
            <p className="text-xs text-gray-600 mt-1">{selectedMentor.bio}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-xs text-gray-500">
                {selectedMentor.email}
              </span>
              <span className="text-xs text-gray-500">
                {selectedMentor.expertise}
              </span>
              <span className="text-xs text-gray-500">
                평점 {selectedMentor.rating} ({selectedMentor.sessions}회)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 프로그램 정보 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">프로그램</span>
        </div>
        <select
          value={formData.programId || ''}
          onChange={(e) => onChange({ programId: e.target.value })}
          disabled={isReadOnly}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        >
          <option value="">프로그램을 선택하세요</option>
          {availablePrograms.map(program => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>

        {selectedProgram && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">{selectedProgram.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {selectedProgram.duration}주 프로그램
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">진행률:</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${selectedProgram.progress}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700">{selectedProgram.progress}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 세션 정보 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1.5">
            세션 차수
          </label>
          <input
            type="number"
            value={formData.sessionNumber || 1}
            onChange={(e) => onChange({ sessionNumber: parseInt(e.target.value) })}
            min="1"
            disabled={isReadOnly}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5">
            세션 시간
          </label>
          <select
            value={formData.sessionDuration || '60'}
            onChange={(e) => onChange({ sessionDuration: e.target.value })}
            disabled={isReadOnly}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="30">30분</option>
            <option value="60">1시간</option>
            <option value="90">1시간 30분</option>
            <option value="120">2시간</option>
          </select>
        </div>
      </div>

      {/* 참석자 관리 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">참석자 ({attendees.length}명)</span>
          </div>
        </div>
        <div className="space-y-2">
          {attendees.map((attendee, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={attendee.name}
                onChange={(e) => handleAttendeeChange(index, 'name', e.target.value)}
                placeholder="이름"
                disabled={isReadOnly}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <input
                type="email"
                value={attendee.email}
                onChange={(e) => handleAttendeeChange(index, 'email', e.target.value)}
                placeholder="이메일"
                disabled={isReadOnly}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              {!isReadOnly && attendees.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAttendee(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
          {!isReadOnly && attendees.length < 10 && (
            <button
              type="button"
              onClick={addAttendee}
              className="w-full py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
            >
              참석자 추가
            </button>
          )}
        </div>
      </div>

      {/* 세션 목표 및 아젠다 */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">세션 목표</span>
          </div>
          <textarea
            value={formData.sessionGoal || ''}
            onChange={(e) => onChange({ sessionGoal: e.target.value })}
            placeholder="이번 세션에서 달성하고자 하는 목표를 입력하세요"
            disabled={isReadOnly}
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1.5">
            주요 아젠다
          </label>
          <textarea
            value={formData.agenda || ''}
            onChange={(e) => onChange({ agenda: e.target.value })}
            placeholder="• 시작 인사 및 근황 공유
• 주요 토픽 논의
• Q&A 및 피드백
• 다음 단계 계획"
            disabled={isReadOnly}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

export default MentorSessionFields;