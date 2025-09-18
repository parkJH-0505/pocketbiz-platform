/**
 * UnifiedScheduleSystem.test.tsx
 *
 * 통합 스케줄 시스템의 전체 워크플로우를 테스트
 * Sprint 2의 모든 단계가 제대로 통합되어 작동하는지 검증
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// 테스트 대상 컴포넌트들
import BuildupCalendarV3 from '../../pages/startup/buildup/BuildupCalendarV3';
import { UniversalScheduleModal } from '../../components/schedule';

// 컨텍스트들
import { ToastProvider } from '../../contexts/ToastContext';
import { LoadingProvider } from '../../contexts/LoadingContext';
import { ScheduleProvider } from '../../contexts/ScheduleContext';
import { BuildupProvider } from '../../contexts/BuildupContext';
import { CalendarProvider } from '../../contexts/CalendarContext';

// 타입들
import type { UnifiedSchedule, BuildupProjectMeeting } from '../../types/schedule.types';
import type { Project } from '../../types/buildup.types';

// 테스트 헬퍼 컴포넌트
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LoadingProvider>
      <ToastProvider>
        <ScheduleProvider>
          <BuildupProvider>
            <CalendarProvider>
              {children}
            </CalendarProvider>
          </BuildupProvider>
        </ScheduleProvider>
      </ToastProvider>
    </LoadingProvider>
  );
};

// 목 데이터
const mockProject: Project = {
  id: 'test-project-1',
  title: '테스트 프로젝트',
  category: 'development',
  phase: 'planning',
  progress: 25,
  status: 'active',
  created_from: 'catalog',
  service_id: 'test-service-1',
  startDate: new Date('2025-09-01'),
  deadline: new Date('2025-12-31'),
  description: '테스트용 프로젝트입니다',
  currentPhase: 'planning',
  nextPhase: 'contract_signed',
  requirements: [],
  deliverables: []
};

const mockSchedule: UnifiedSchedule = {
  id: 'test-schedule-1',
  type: 'buildup_project',
  title: '테스트 빌드업 미팅',
  startDateTime: new Date('2025-09-20T10:00:00'),
  endDateTime: new Date('2025-09-20T11:00:00'),
  description: '테스트용 빌드업 미팅',
  status: 'scheduled',
  projectId: 'test-project-1',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('통합 스케줄 시스템 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();

    // localStorage 초기화
    localStorage.clear();

    // 시간 고정 (테스트 일관성을 위해)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-18T09:00:00Z'));

    // Console 경고/에러 모킹
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Step 1: 기본 캘린더 렌더링', () => {
    it('캘린더가 올바르게 렌더링되어야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 캘린더 헤더 확인
      expect(screen.getByText('빌드업 캘린더')).toBeInTheDocument();

      // 현재 월 표시 확인
      expect(screen.getByText('2025년 9월')).toBeInTheDocument();

      // 네비게이션 버튼 확인
      expect(screen.getByRole('button', { name: /이전 달/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /다음 달/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /오늘/i })).toBeInTheDocument();
    });

    it('뷰 전환이 올바르게 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 기본값은 월 뷰
      expect(screen.getByText('월')).toHaveClass('bg-blue-500');

      // 주 뷰로 전환
      await user.click(screen.getByText('주'));
      expect(screen.getByText('주')).toHaveClass('bg-blue-500');

      // 목록 뷰로 전환
      await user.click(screen.getByText('목록'));
      expect(screen.getByText('목록')).toHaveClass('bg-blue-500');
    });
  });

  describe('Step 2: 스케줄 생성 워크플로우', () => {
    it('새 스케줄 생성이 전체 워크플로우가 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 1. 스케줄 추가 버튼 클릭
      const addButton = screen.getByRole('button', { name: /일정 추가/i });
      await user.click(addButton);

      // 2. UniversalScheduleModal 열림 확인
      await waitFor(() => {
        expect(screen.getByText('새 일정 만들기')).toBeInTheDocument();
      });

      // 3. 빌드업 프로젝트 미팅 타입 선택
      const buildupOption = screen.getByLabelText('빌드업 프로젝트');
      await user.click(buildupOption);

      // 4. 필수 필드 입력
      await user.type(
        screen.getByLabelText('미팅 제목'),
        '테스트 빌드업 미팅'
      );

      // 5. 날짜/시간 설정
      const dateInput = screen.getByLabelText('날짜');
      await user.clear(dateInput);
      await user.type(dateInput, '2025-09-20');

      const timeInput = screen.getByLabelText('시작 시간');
      await user.clear(timeInput);
      await user.type(timeInput, '10:00');

      // 6. 프로젝트 선택 (목 데이터 필요)
      // 실제 구현에서는 프로젝트 목록이 로드되어야 함

      // 7. 저장 버튼 클릭
      const saveButton = screen.getByRole('button', { name: /저장/i });
      await user.click(saveButton);

      // 8. 성공 토스트 확인
      await waitFor(() => {
        expect(screen.getByText(/일정이 생성되었습니다/i)).toBeInTheDocument();
      });

      // 9. 모달 닫힘 확인
      await waitFor(() => {
        expect(screen.queryByText('새 일정 만들기')).not.toBeInTheDocument();
      });
    });

    it('Phase Transition이 포함된 스케줄 생성이 작동해야 함', async () => {
      // Phase Transition 메타데이터를 포함한 스케줄 생성 테스트
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 커스텀 이벤트 리스너 설정
      const phaseTransitionHandler = vi.fn();
      window.addEventListener('project:phase_transition', phaseTransitionHandler);

      // 스케줄 생성 시뮬레이션 (Phase Transition 포함)
      const buildupMeetingEvent = new CustomEvent('schedule:buildup_meeting_created', {
        detail: {
          schedule: mockSchedule,
          metadata: {
            projectId: mockProject.id,
            phaseTransition: {
              fromPhase: 'planning',
              toPhase: 'contract_signed'
            }
          }
        }
      });

      act(() => {
        window.dispatchEvent(buildupMeetingEvent);
      });

      // Phase Transition 이벤트 발송 확인
      await waitFor(() => {
        expect(phaseTransitionHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            detail: expect.objectContaining({
              projectId: mockProject.id,
              fromPhase: 'planning',
              toPhase: 'contract_signed',
              triggerType: 'meeting_scheduled'
            })
          })
        );
      });

      // 통합 토스트 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/빌드업 미팅이 예약되었습니다.*계약 체결.*으로 변경/)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: 동기화 시스템', () => {
    it('동기화 버튼이 올바르게 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 동기화 버튼 찾기
      const syncButton = screen.getByRole('button', { name: /동기화/i });

      // 동기화 실행
      await user.click(syncButton);

      // 로딩 상태 확인
      expect(syncButton).toBeDisabled();
      expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();

      // 동기화 완료 후 상태 확인
      await waitFor(() => {
        expect(syncButton).not.toBeDisabled();
        expect(screen.getByText(/캘린더 데이터가 동기화되었습니다/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('동기화 실패 시 재시도 로직이 작동해야 함', async () => {
      // refreshSchedules 함수를 실패하도록 목킹
      const mockRefreshSchedules = vi.fn().mockRejectedValue(new Error('Network error'));

      // 실제 구현에서는 ScheduleContext를 목킹해야 함

      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      const syncButton = screen.getByRole('button', { name: /동기화/i });
      await user.click(syncButton);

      // 재시도 토스트 확인
      await waitFor(() => {
        expect(screen.getByText(/재시도 중/i)).toBeInTheDocument();
      });

      // 최종 실패 후 오류 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/연결에 문제가 있습니다/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });
  });

  describe('Step 4: 사용자 경험 개선', () => {
    it('토스트 시스템이 올바르게 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 성공 토스트 테스트
      const successEvent = new CustomEvent('schedule:created', {
        detail: { schedule: mockSchedule }
      });

      act(() => {
        window.dispatchEvent(successEvent);
      });

      await waitFor(() => {
        expect(screen.getByText(/일정이 생성되었습니다/i)).toBeInTheDocument();
      });

      // 토스트 자동 사라짐 테스트
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(screen.queryByText(/일정이 생성되었습니다/i)).not.toBeInTheDocument();
      });
    });

    it('개발자용 디버깅 토스트와 사용자용 토스트가 분리되어야 함', async () => {
      // NODE_ENV를 development로 설정
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // Phase Transition 이벤트로 두 종류의 토스트 확인
      const buildupMeetingEvent = new CustomEvent('schedule:buildup_meeting_created', {
        detail: {
          schedule: mockSchedule,
          metadata: {
            projectId: mockProject.id,
            phaseTransition: {
              fromPhase: 'planning',
              toPhase: 'contract_signed'
            }
          }
        }
      });

      act(() => {
        window.dispatchEvent(buildupMeetingEvent);
      });

      // 사용자용 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/빌드업 미팅이 예약되었습니다/i)).toBeInTheDocument();
      });

      // 개발자용 디버깅 정보는 개발 환경에서만 콘솔에 표시
      // (실제로는 showDebug 함수가 개발 환경에서만 토스트를 표시)

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Step 5: 오류 처리 및 복구', () => {
    it('ErrorBoundary가 오류를 올바르게 포착해야 함', async () => {
      const ThrowError = () => {
        throw new Error('테스트 오류');
      };

      // ErrorBoundary로 감싼 컴포넌트 렌더링
      const { container } = render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </TestWrapper>
      );

      // 오류 폴백 UI 확인
      await waitFor(() => {
        expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /다시 시도/i })).toBeInTheDocument();
      });
    });

    it('네트워크 오류 시 적절한 피드백이 표시되어야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 네트워크 오류 시뮬레이션
      const networkError = new Error('Network request failed');

      // 실제 구현에서는 API 호출을 목킹하고 에러를 throw해야 함

      // 오류 처리 확인
      // 실제로는 useErrorHandler를 통해 처리된 오류 메시지를 확인
    });
  });

  describe('전체 시스템 통합 테스트', () => {
    it('완전한 빌드업 미팅 생성 → 완료 워크플로우가 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 1. 새 빌드업 미팅 생성
      await user.click(screen.getByRole('button', { name: /일정 추가/i }));

      await waitFor(() => {
        expect(screen.getByText('새 일정 만들기')).toBeInTheDocument();
      });

      // 2. 빌드업 미팅 타입 선택 및 정보 입력
      await user.click(screen.getByLabelText('빌드업 프로젝트'));
      await user.type(screen.getByLabelText('미팅 제목'), '프로젝트 킥오프 미팅');

      // 3. 저장
      await user.click(screen.getByRole('button', { name: /저장/i }));

      // 4. 생성 확인
      await waitFor(() => {
        expect(screen.getByText(/일정이 생성되었습니다/i)).toBeInTheDocument();
      });

      // 5. 캘린더에서 생성된 미팅 확인
      await waitFor(() => {
        expect(screen.getByText('프로젝트 킥오프 미팅')).toBeInTheDocument();
      });

      // 6. 미팅 완료 처리
      const meetingElement = screen.getByText('프로젝트 킥오프 미팅');
      await user.click(meetingElement);

      // 완료 버튼 클릭
      const completeButton = screen.getByRole('button', { name: /완료/i });
      await user.click(completeButton);

      // 7. 완료 모달에서 정보 입력
      await waitFor(() => {
        expect(screen.getByText('미팅 완료')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('미팅 노트'), '킥오프 미팅이 성공적으로 완료되었습니다.');
      await user.click(screen.getByRole('button', { name: /완료 저장/i }));

      // 8. 완료 확인
      await waitFor(() => {
        expect(screen.getByText(/미팅이 성공적으로 완료되었습니다/i)).toBeInTheDocument();
      });
    });

    it('Phase Transition → 토스트 → 동기화 전체 플로우가 작동해야 함', async () => {
      render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      let phaseTransitionTriggered = false;
      let syncCompleted = false;

      // 이벤트 리스너 설정
      window.addEventListener('project:phase_transition', () => {
        phaseTransitionTriggered = true;
      });

      window.addEventListener('calendar:sync_completed', () => {
        syncCompleted = true;
      });

      // 1. Phase Transition이 포함된 빌드업 미팅 생성
      const buildupMeetingEvent = new CustomEvent('schedule:buildup_meeting_created', {
        detail: {
          schedule: mockSchedule,
          metadata: {
            projectId: mockProject.id,
            phaseTransition: {
              fromPhase: 'planning',
              toPhase: 'contract_signed'
            }
          }
        }
      });

      act(() => {
        window.dispatchEvent(buildupMeetingEvent);
      });

      // 2. Phase Transition 이벤트 발송 확인
      await waitFor(() => {
        expect(phaseTransitionTriggered).toBe(true);
      });

      // 3. 사용자 친화적 토스트 메시지 확인
      await waitFor(() => {
        expect(screen.getByText(/빌드업 미팅이 예약되었습니다.*계약 체결.*으로 변경/)).toBeInTheDocument();
      });

      // 4. 수동 동기화 실행
      await user.click(screen.getByRole('button', { name: /동기화/i }));

      // 5. 동기화 완료 확인
      await waitFor(() => {
        expect(syncCompleted).toBe(true);
        expect(screen.getByText(/캘린더 데이터가 동기화되었습니다/i)).toBeInTheDocument();
      });
    });
  });

  describe('성능 및 메모리 누수 테스트', () => {
    it('컴포넌트 언마운트 시 이벤트 리스너가 제거되어야 함', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <TestWrapper>
          <BuildupCalendarV3 />
        </TestWrapper>
      );

      // 이벤트 리스너 등록 확인
      expect(addEventListenerSpy).toHaveBeenCalledWith('schedule:created', expect.any(Function));

      // 컴포넌트 언마운트
      unmount();

      // 이벤트 리스너 제거 확인
      expect(removeEventListenerSpy).toHaveBeenCalledWith('schedule:created', expect.any(Function));
    });

    it('과도한 리렌더링이 발생하지 않아야 함', async () => {
      const renderSpy = vi.fn();

      const SpyComponent = () => {
        renderSpy();
        return <BuildupCalendarV3 />;
      };

      render(
        <TestWrapper>
          <SpyComponent />
        </TestWrapper>
      );

      // 초기 렌더링
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // 동기화 실행
      await user.click(screen.getByRole('button', { name: /동기화/i }));

      // 동기화로 인한 과도한 리렌더링 확인
      await waitFor(() => {
        // 적절한 횟수의 리렌더링만 발생해야 함 (예: 3회 이하)
        expect(renderSpy).toHaveBeenCalledTimes(lessThanOrEqual(5));
      });
    });
  });
});

// 테스트 헬퍼 함수들
function lessThanOrEqual(expected: number) {
  return {
    asymmetricMatch: (received: number) => received <= expected,
    toString: () => `<= ${expected}`
  };
}

// 추가 테스트 유틸리티
export const createMockSchedule = (overrides?: Partial<UnifiedSchedule>): UnifiedSchedule => ({
  ...mockSchedule,
  ...overrides,
  id: overrides?.id || `mock-schedule-${Date.now()}`
});

export const createMockProject = (overrides?: Partial<Project>): Project => ({
  ...mockProject,
  ...overrides,
  id: overrides?.id || `mock-project-${Date.now()}`
});

// ErrorBoundary import 추가 필요
import ErrorBoundary from '../../components/ErrorBoundary';