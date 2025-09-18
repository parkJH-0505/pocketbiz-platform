/**
 * ScheduleModalTest Component
 *
 * UniversalScheduleModal 테스트를 위한 간단한 래퍼 컴포넌트
 * 이 컴포넌트는 개발 중 모달 테스트를 위해 사용됩니다
 */

import React, { useState } from 'react';
import { UniversalScheduleModal } from './UniversalScheduleModal';
import type { UnifiedSchedule } from '../../types/schedule.types';

export const ScheduleModalTest: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSchedule, setSelectedSchedule] = useState<UnifiedSchedule | undefined>();

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', schedule?: UnifiedSchedule) => {
    setModalMode(mode);
    setSelectedSchedule(schedule);
    setIsModalOpen(true);
  };

  const handleSuccess = (schedule: UnifiedSchedule) => {
    console.log('Schedule saved:', schedule);
    alert(`일정이 ${modalMode === 'create' ? '생성' : '수정'}되었습니다!`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          UniversalScheduleModal 테스트
        </h2>

        <div className="space-y-4">
          {/* 생성 모드 테스트 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">새 일정 만들기</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => handleOpenModal('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                일반 일정 생성
              </button>
              <button
                onClick={() => {
                  setModalMode('create');
                  setSelectedSchedule(undefined);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                빌드업 미팅 생성
              </button>
            </div>
          </div>

          {/* 편집 모드 테스트 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">기존 일정 수정</h3>
            <button
              onClick={() => {
                const sampleSchedule: UnifiedSchedule = {
                  id: 'test-1',
                  type: 'general',
                  title: '테스트 일정',
                  description: '테스트 설명',
                  startDateTime: new Date(),
                  endDateTime: new Date(Date.now() + 60 * 60 * 1000),
                  location: '회의실 A',
                  isOnline: false,
                  status: 'scheduled',
                  priority: 'medium',
                  participants: ['user1@example.com'],
                  tags: ['테스트'],
                  reminders: [],
                  createdBy: 'test-user',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                handleOpenModal('edit', sampleSchedule);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              샘플 일정 수정
            </button>
          </div>

          {/* 보기 모드 테스트 */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">일정 상세 보기</h3>
            <button
              onClick={() => {
                const sampleSchedule: UnifiedSchedule = {
                  id: 'test-2',
                  type: 'buildup_project',
                  title: '빌드업 킥오프 미팅',
                  description: '프로젝트 시작 미팅',
                  startDateTime: new Date(),
                  endDateTime: new Date(Date.now() + 90 * 60 * 1000),
                  location: '온라인',
                  isOnline: true,
                  onlineLink: 'https://zoom.us/meeting/123',
                  status: 'scheduled',
                  priority: 'high',
                  participants: ['pm@company.com', 'startup@example.com'],
                  tags: ['빌드업', '킥오프'],
                  reminders: [],
                  createdBy: 'pm-user',
                  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                  updatedAt: new Date()
                };
                handleOpenModal('view', sampleSchedule);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              샘플 일정 보기
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>참고:</strong> 이 페이지는 UniversalScheduleModal 컴포넌트를 테스트하기 위한 개발용 페이지입니다.
          </p>
        </div>
      </div>

      {/* 모달 컴포넌트 */}
      <UniversalScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedule={selectedSchedule}
        mode={modalMode}
        defaultType={modalMode === 'create' ? 'general' : undefined}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default ScheduleModalTest;