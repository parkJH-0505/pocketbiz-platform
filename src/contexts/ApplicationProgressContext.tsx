import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 지원 진행 상태 타입
export type ApplicationStatus =
  | 'not_started'    // 아직 시작 안 함
  | 'preparing'      // 서류 준비 중
  | 'submitted'      // 지원 완료
  | 'in_review'      // 심사 중
  | 'accepted'       // 합격
  | 'rejected';      // 탈락

// 진행 상황 인터페이스
export interface ApplicationProgress {
  eventId: string;
  status: ApplicationStatus;
  startedAt?: Date;
  submittedAt?: Date;
  deadline: Date;
  progress: number; // 0-100
  currentTask?: string;
  nextTask?: string;
  completedTasks: string[];
  totalTasks: number;
}

// Context 타입
interface ApplicationProgressContextType {
  applications: ApplicationProgress[];
  getApplicationProgress: (eventId: string) => ApplicationProgress | undefined;
  updateApplicationStatus: (eventId: string, status: ApplicationStatus) => void;
  updateApplicationProgress: (eventId: string, update: Partial<ApplicationProgress>) => void;
  startApplication: (eventId: string, deadline: Date) => void;
  isInProgress: (eventId: string) => boolean;
  getInProgressCount: () => number;
}

const ApplicationProgressContext = createContext<ApplicationProgressContextType | undefined>(undefined);

// Mock 데이터 - 실제로는 API나 localStorage에서 로드
const MOCK_PROGRESS_DATA: ApplicationProgress[] = [
  {
    eventId: 'tips-2024-spring',
    status: 'preparing',
    startedAt: new Date('2024-01-25'),
    deadline: new Date('2024-02-28'),
    progress: 60,
    currentTask: '재무모델링 작업',
    nextTask: 'PM 멘토링 예약',
    completedTasks: ['사업계획서 업데이트', '재무제표 3개년 준비'],
    totalTasks: 5
  },
  {
    eventId: 'k-startup-2024',
    status: 'submitted',
    startedAt: new Date('2024-01-10'),
    submittedAt: new Date('2024-01-20'),
    deadline: new Date('2024-03-15'),
    progress: 100,
    completedTasks: ['모든 서류 제출 완료'],
    totalTasks: 1
  }
];

export function ApplicationProgressProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<ApplicationProgress[]>([]);

  // 초기 데이터 로드
  useEffect(() => {
    // localStorage에서 로드 시도
    const saved = localStorage.getItem('applicationProgress');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Date 객체 복원
      const restored = parsed.map((app: any) => ({
        ...app,
        startedAt: app.startedAt ? new Date(app.startedAt) : undefined,
        submittedAt: app.submittedAt ? new Date(app.submittedAt) : undefined,
        deadline: new Date(app.deadline)
      }));
      setApplications(restored);
    } else {
      // Mock 데이터 사용
      setApplications(MOCK_PROGRESS_DATA);
    }
  }, []);

  // 변경사항 저장
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem('applicationProgress', JSON.stringify(applications));
    }
  }, [applications]);

  const getApplicationProgress = (eventId: string) => {
    return applications.find(app => app.eventId === eventId);
  };

  const updateApplicationStatus = (eventId: string, status: ApplicationStatus) => {
    setApplications(prev => prev.map(app =>
      app.eventId === eventId
        ? {
            ...app,
            status,
            submittedAt: status === 'submitted' ? new Date() : app.submittedAt
          }
        : app
    ));
  };

  const updateApplicationProgress = (eventId: string, update: Partial<ApplicationProgress>) => {
    setApplications(prev => {
      const existing = prev.find(app => app.eventId === eventId);
      if (existing) {
        return prev.map(app =>
          app.eventId === eventId
            ? { ...app, ...update }
            : app
        );
      } else {
        // 새로운 진행 상황 추가
        const newProgress: ApplicationProgress = {
          eventId,
          status: 'not_started',
          deadline: new Date(),
          progress: 0,
          completedTasks: [],
          totalTasks: 0,
          ...update
        };
        return [...prev, newProgress];
      }
    });
  };

  const startApplication = (eventId: string, deadline: Date) => {
    const existing = getApplicationProgress(eventId);
    if (!existing) {
      const newProgress: ApplicationProgress = {
        eventId,
        status: 'preparing',
        startedAt: new Date(),
        deadline,
        progress: 0,
        completedTasks: [],
        totalTasks: 5, // 기본 태스크 수
        currentTask: '사업계획서 준비',
        nextTask: '재무제표 준비'
      };
      setApplications(prev => [...prev, newProgress]);
    }
  };

  const isInProgress = (eventId: string) => {
    const progress = getApplicationProgress(eventId);
    return progress ?
      ['preparing', 'submitted', 'in_review'].includes(progress.status) :
      false;
  };

  const getInProgressCount = () => {
    return applications.filter(app =>
      ['preparing', 'submitted', 'in_review'].includes(app.status)
    ).length;
  };

  const value = {
    applications,
    getApplicationProgress,
    updateApplicationStatus,
    updateApplicationProgress,
    startApplication,
    isInProgress,
    getInProgressCount
  };

  return (
    <ApplicationProgressContext.Provider value={value}>
      {children}
    </ApplicationProgressContext.Provider>
  );
}

export function useApplicationProgress() {
  const context = useContext(ApplicationProgressContext);
  if (!context) {
    throw new Error('useApplicationProgress must be used within ApplicationProgressProvider');
  }
  return context;
}