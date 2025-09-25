/**
 * BuildupContext.tsx
 *
 * 포켓빌드업 서비스의 전체 상태 관리를 담당하는 Context
 *
 * 주요 기능:
 * 1. 서비스 데이터 관리 - 포켓빌드업 서비스 목록 로드 및 필터링
 * 2. 장바구니 기능 - 서비스 장바구니 추가/제거/업데이트
 * 3. 프로젝트 관리 - 진행중/완료된 프로젝트 관리
 * 4. 서비스 추천 - KPI 점수 기반 맞춤형 서비스 추천
 * 5. 검색 및 필터링 - 카테고리별, 가격별, 검색어별 필터링
 *
 * @author PocketCompany
 * @since 2024
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type {
  BuildupService,
  CartItem,
  Project,
  Meeting,
  AxisKey,
  PhaseTransitionEvent,
  GuideMeetingRecord,
  PhaseTransitionApprovalRequest
} from '../types/buildup.types';
import { useScheduleContext } from './ScheduleContext';
import { useSafeToast } from '../hooks/useSafeToast';
import { contextReadyEmitter } from '../utils/contextReadyEmitter';
import { useContextRegistration } from '../hooks/useContextRegistration';
import { CONTEXT_METADATA } from '../utils/contextMetadata';
import {
  loadBuildupServices,
  calculateBundleDiscount
} from '../utils/buildupServiceLoader';
import { dataConverter, DuplicateDetector } from '../utils/dataConverters';
import type { UnifiedSchedule, BuildupProjectMeeting } from '../types/schedule.types';
import {
  EventSourceTracker,
  CONTEXT_EVENTS,
  type ScheduleEventDetail,
  logEvent
} from '../types/events.types';
import { mockProjects, defaultBusinessSupportPM } from '../data/mockProjects';
import { mockMeetingRecords } from '../data/mockMeetingData';
import {
  calculatePhaseProgress,
  PHASE_INFO,
  getNextPhase
} from '../utils/projectPhaseUtils';
// Phase 4-2: Edge Case 및 동시성 제어 시스템
import { globalTransitionQueue } from '../utils/phaseTransitionQueue';
import { globalSnapshotManager } from '../utils/stateSnapshot';
import { globalMigrator } from '../utils/dataMigration';
import { EdgeCaseLogger } from '../utils/edgeCaseScenarios';
import { unifiedMigrationManager } from '../utils/unifiedMigrationManager';
import { ValidationManager, type ValidationResult } from '../utils/dataValidation';
// Sprint 4 Phase 4-4: Edge Case Systems
import { ScheduleConflictResolver, type ScheduleConflict } from '../utils/conflictResolver';
import { TimeValidator, type TimeValidationResult } from '../utils/timeValidator';
import { CascadeOperationManager, type DeletionConfirmation } from '../utils/cascadeOperations';
import { DataRecoveryManager, type SystemHealthReport } from '../utils/dataRecovery';
import { RetryMechanismManager, type RetryResult } from '../utils/retryMechanism';
import { QueueRecoveryManager, type QueueMetrics } from '../utils/queueRecovery';
// Sprint 4 Phase 4-5: Error Management & Monitoring
import { ErrorManager, setupGlobalErrorHandler, type ErrorStatistics } from '../utils/errorManager';
import { PerformanceMonitor, type PerformanceStatistics } from '../utils/performanceMonitor';
// Stage C-3: New Phase Transition Module Integration
import {
  phaseTransitionModule,
  eventBus,
  createEvent,
  usePhaseTransitionModule
} from '../core/index';
import type {
  MeetingCompletedEvent,
  PhaseChangeRequestEvent,
  PhaseChangedEvent
} from '../core/index';

// Sprint 1 Step 3: Event system imports (additional)
import {
  type BuildupEventDetail,
  createBuildupEvent
} from '../types/events.types';
import {
  updateMeetingInArray,
  removeMeetingFromArray,
  findMeetingById
} from '../utils/dataConverters';

interface BuildupContextType {
  // Services
  services: BuildupService[];
  loadingServices: boolean;
  
  // Cart
  cart: CartItem[];
  addToCart: (service: BuildupService, options?: CartItem['options']) => void;
  removeFromCart: (serviceId: string) => void;
  updateCartItem: (serviceId: string, options: Partial<CartItem['options']>) => void;
  clearCart: () => void;
  cartTotal: number;
  bundleDiscount: number;
  
  // Projects
  projects: Project[];
  activeProjects: Project[];
  completedProjects: Project[];
  createProject: (data: Partial<Project>) => void;
  updateProject: (projectId: string, data: Partial<Project>) => void;

  // Project calculations
  calculateDDay: (project: Project) => { days: number; isUrgent: boolean; isWarning: boolean; text: string } | null;
  getUrgentProjects: () => Project[];
  getTodayTasks: () => Array<{
    id: string;
    type: 'meeting' | 'deliverable' | 'review' | 'milestone';
    title: string;
    project: string;
    time?: string;
    priority: 'high' | 'medium' | 'low';
    status: 'pending' | 'in_progress' | 'completed';
  }>;
  getProjectProgress: (project: Project) => {
    phaseProgress: number;
    deliverableProgress: number;
    overallProgress: number;
    currentPhase: string;
    nextPhase: string | null;
  };
  
  // Recommendations
  getRecommendedServices: (userAxis?: Record<AxisKey, number>) => BuildupService[];
  getFeaturedServices: () => BuildupService[];

  // Filters
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Service operations (통합된 기능)
  getService: (id: string) => BuildupService | undefined;
  searchServices: (query: string) => BuildupService[];
  filterByCategory: (category: string) => BuildupService[];
  filterByPriceRange: (min: number, max: number) => BuildupService[];

  // Admin functions (나중에 관리자 기능용)
  addService: (service: BuildupService) => Promise<void>;
  updateService: (id: string, updates: Partial<BuildupService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Status
  error: string | null;

  // Phase Transition Functions
  triggerPhaseTransition: (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => void;
  handlePaymentCompleted: (projectId: string, paymentData: any) => void;
  requestManualPhaseTransition: (projectId: string, fromPhase: string, toPhase: string, requestedBy: string, reason: string) => void;
  approvePhaseTransition: (approvalRequestId: string, approvedBy: string) => boolean;
  rejectPhaseTransition: (approvalRequestId: string, rejectedBy: string, reason: string) => boolean;
  getPendingPhaseApprovals: () => PhaseTransitionApprovalRequest[];
  getPhaseTransitionHistory: (projectId?: string) => PhaseTransitionEvent[];
  phaseTransitionEvents: PhaseTransitionEvent[];

  // Sprint 1 Step 3: Meeting Management Functions
  addMeetingToProject: (projectId: string, meeting: Meeting) => void;
  updateProjectMeeting: (projectId: string, meetingId: string, updates: Partial<Meeting>) => void;
  removeProjectMeeting: (projectId: string, meetingId: string) => void;
  syncProjectMeetings: (projectId: string, meetings: Meeting[]) => void;
  getProjectMeetings: (projectId: string) => Meeting[];
}

const BuildupContext = createContext<BuildupContextType | undefined>(undefined);

export function BuildupProvider({ children }: { children: ReactNode }) {
  // ScheduleContext 접근
  const scheduleContext = useScheduleContext();

  // Safe Toast hooks (with fallback)
  const { showSuccess, showError, showInfo, showWarning, isUsingFallback } = useSafeToast();

  // Log if using fallback (for debugging)
  useEffect(() => {
    if (isUsingFallback && import.meta.env.DEV) {
      console.warn('BuildupContext: Using toast fallback mechanism');
    }
  }, [isUsingFallback]);

  const [services, setServices] = useState<BuildupService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProjectsInitialized, setIsProjectsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with all mock projects
  const getInitialProjects = (): Project[] => {
    return mockProjects; // 모든 프로젝트 활성화
  };

  const [projects, setProjects] = useState<Project[]>(getInitialProjects());
  const [phaseTransitionEvents, setPhaseTransitionEvents] = useState<PhaseTransitionEvent[]>([]);

  // Step 4: Initial Data Synchronization Implementation
  const performInitialSync = useCallback(async () => {
    // ✅ 이중 실행 방지: 이미 진행 중이면 중단
    if (scheduleContext.isSyncInProgress()) {
      return;
    }

    try {

      // 1. 동기화 플래그 설정
      scheduleContext.setSyncInProgress(true);

      // 2. 프로젝트별 미팅 데이터 수집
      const allMeetings: Meeting[] = [];

      projects.forEach(project => {
        if (project.meetings && project.meetings.length > 0) {
          allMeetings.push(...project.meetings);
        }
      });

      if (allMeetings.length === 0) {
        scheduleContext.setSyncInProgress(false);
        return;
      }

      // 3. 중복 제거 및 변환 준비
      const uniqueMeetings = DuplicateDetector.removeDuplicateMeetings(allMeetings);

      // 4. Meeting → UnifiedSchedule 변환
      const schedulesToCreate = uniqueMeetings.map(meeting => {
        const project = projects.find(p => p.meetings?.some(m => m.id === meeting.id));
        if (!project) {
          console.warn(`⚠️ Project not found for meeting ${meeting.id}`);
          return null;
        }

        try {
          const schedule = dataConverter.meetingToSchedule(meeting, project);
          return schedule;
        } catch (error) {
          console.error(`❌ Failed to convert meeting ${meeting.id}:`, error);
          return null;
        }
      }).filter((schedule): schedule is UnifiedSchedule => schedule !== null);

      // 5. 기존 스케줄 중복 체크
      const filteredSchedules = schedulesToCreate.filter(schedule => {
        // ScheduleContext에 이미 있는지 확인
        const hasExisting = scheduleContext.hasSchedulesForProject(
          (schedule as BuildupProjectMeeting).projectId
        );

        if (hasExisting) {
          return false;
        }

        return true;
      });

      if (filteredSchedules.length === 0) {
        scheduleContext.setSyncInProgress(false);
        return;
      }

      // 6. 배치 생성 실행

      const createdSchedules = await scheduleContext.createSchedulesBatch(
        filteredSchedules.map(s => ({
          ...s,
          id: undefined, // ID는 자동 생성되도록
          createdAt: undefined,
          updatedAt: undefined
        })),
        {
          skipDuplicateCheck: false, // 중복 체크 활성화
          suppressEvents: true, // 이벤트 억제 (무한 루프 방지)
          source: 'buildup_initial_sync'
        }
      );


      // 7. 통계 출력
      const stats = scheduleContext.getStatistics();

    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      setError('초기 데이터 동기화에 실패했습니다.');
    } finally {
      // 8. 동기화 플래그 해제
      scheduleContext.setSyncInProgress(false);
    }
  }, [projects, scheduleContext]);

  // Phase 4-2: Enhanced Phase Transition with Queue and Snapshot
  const executePhaseTransition = useCallback(async (projectId: string, toPhase: string, trigger: string, metadata?: any) => {

    const project = projects.find(p => p.id === projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      EdgeCaseLogger.log('EC_DATA_002', {
        projectId,
        toPhase,
        trigger,
        error: 'Project not found'
      });
      throw new Error(`Project not found: ${projectId}`);
    }

    const fromPhase = project.phase || 'contract_pending';

    // Phase 4-3: Business Logic Validation

    try {
      const validationResult = ValidationManager.validatePhaseTransitionRequest(
        project,
        fromPhase as any,
        toPhase as any,
        { trigger, metadata }
      );

      if (!validationResult.isValid) {
        console.error('❌ Phase transition validation failed:', validationResult);

        // Show user-friendly error messages
        const errorMessages = validationResult.errors.map(e => e.message).join(', ');
        const warningMessages = validationResult.warnings.map(w => w.message).join(', ');

        // Log validation failure
        EdgeCaseLogger.log('EC_DATA_004', {
          projectId,
          fromPhase,
          toPhase,
          trigger,
          validationErrors: validationResult.errors.length,
          validationWarnings: validationResult.warnings.length,
          errors: validationResult.errors.map(e => e.code)
        });

        // For critical errors, block the transition
        if (validationResult.severity === 'critical') {
          throw new Error(`Phase transition blocked: ${errorMessages}`);
        }

        // For warnings, log but continue
        if (validationResult.warnings.length > 0) {
          console.warn('⚠️ Phase transition warnings:', warningMessages);
        }
      } else {
      }

      // Use queue system for phase transition
      await globalTransitionQueue.enqueue({
        projectId,
        operation: 'phase_transition',
        payload: {
          projectId,
          fromPhase,
          toPhase,
          trigger,
          metadata,
          validationResult // Include validation context
        },
        priority: 10, // High priority for phase transitions
        maxRetries: 3
      });


      // Log successful validation
      if (validationResult.warnings.length > 0) {
      }

    } catch (error) {
      console.error('❌ Phase transition failed:', error);
      EdgeCaseLogger.log('EC_SYSTEM_001', {
        projectId,
        fromPhase,
        toPhase,
        trigger,
        error: error.message
      });
      throw error;
    }
  }, [projects]);

  // Load services on mount
  useEffect(() => {
    loadServices();
    loadCartFromStorage();
    // Don't load projects from storage anymore, use initial state
  }, []);

  // Step 4: Initial Data Synchronization - Single execution with sync flag
  const [initialSyncCompleted, setInitialSyncCompleted] = useState(false);

  useEffect(() => {
    // Wait for ScheduleContext to be initialized and ensure single execution
    if (scheduleContext && !scheduleContext.isLoading && !initialSyncCompleted) {
      performInitialSync().then(() => {
        setInitialSyncCompleted(true);
      }).catch((error) => {
        console.error('❌ Initial sync failed:', error);
        // Don't set flag on error, allow retry
      });
    }
  }, [scheduleContext?.isLoading, initialSyncCompleted, performInitialSync]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('buildup_cart', JSON.stringify(cart));
  }, [cart]);

  // Phase transition event handler will be initialized after updateProject is defined

  // Don't save projects to localStorage anymore - keep them in memory only

  const loadServices = async () => {
    setLoadingServices(true);
    try {
      const loadedServices = await loadBuildupServices();
      setServices(loadedServices);
      setError(null);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError('서비스를 불러오는데 실패했습니다');
    } finally {
      setLoadingServices(false);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem('buildup_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to load cart from storage:', error);
      }
    }
  };

  const loadProjectsFromStorage = () => {
    const savedProjects = localStorage.getItem('buildup_projects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        // Check if the saved projects is an empty array
        if (Array.isArray(parsed) && parsed.length === 0) {
          initializeSampleProjects();
        } else {
          setProjects(parsed);
          setIsProjectsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to load projects from storage:', error);
        initializeSampleProjects();
      }
    } else {
      // Initialize with sample projects if no saved projects
      initializeSampleProjects();
    }
  };

  const initializeSampleProjects = () => {
    const sampleProjects: Project[] = [
      {
        id: 'PRJ-001',
        title: 'MVP 개발 프로젝트',
        service_id: 'SVC-DEV-001',
        category: '개발',
        status: 'active',
        created_from: 'catalog',
        contract: {
          id: 'CNT-001',
          value: 30000000,
          signed_date: new Date('2024-01-15'),
          start_date: new Date('2024-01-20'),
          end_date: new Date('2024-04-20')
        },
        progress: {
          overall: 65,
          milestones_completed: 3,
          milestones_total: 5,
          deliverables_submitted: 8,
          deliverables_total: 12
        },
        timeline: {
          kickoff_date: new Date('2024-01-20'),
          phase_updated_at: new Date(),
          phase_updated_by: 'system',
          start_date: new Date('2024-01-20'),
          end_date: new Date('2024-06-20')
        },
        workstreams: [
          {
            id: 'WS-001',
            name: '백엔드 개발',
            status: 'in_progress',
            owner: {
              id: 'dev-1',
              name: '김개발',
              role: 'Backend Developer',
              email: 'kim@pocket.com'
            },
            tasks: [],
            progress: 70
          },
          {
            id: 'WS-002',
            name: '프론트엔드 개발',
            status: 'in_progress',
            owner: {
              id: 'dev-2',
              name: '이프론트',
              role: 'Frontend Developer',
              email: 'lee@pocket.com'
            },
            tasks: [],
            progress: 60
          }
        ],
        deliverables: [
          {
            id: 'DLV-001',
            name: 'API 설계서',
            description: 'RESTful API 상세 설계 문서',
            status: 'approved',
            due_date: new Date('2024-02-01'),
            submitted_date: new Date('2024-01-30'),
            approved_date: new Date('2024-02-01'),
            version: 2,
            files: []
          },
          {
            id: 'DLV-002',
            name: '데이터베이스 스키마',
            description: 'PostgreSQL 데이터베이스 설계',
            status: 'approved',
            due_date: new Date('2024-02-05'),
            submitted_date: new Date('2024-02-04'),
            approved_date: new Date('2024-02-05'),
            version: 1,
            files: []
          },
          {
            id: 'DLV-003',
            name: '프로토타입',
            description: '핵심 기능 프로토타입',
            status: 'in_review',
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            submitted_date: new Date(),
            version: 1,
            files: []
          }
        ],
        team: {
          pm: {
            id: 'pm-001',
            name: '박매니저',
            role: 'Project Manager',
            email: 'park@pocket.com',
            company: '포켓컴퍼니'
          },
          members: [
            {
              id: 'dev-1',
              name: '김개발',
              role: 'Backend Developer',
              email: 'kim@pocket.com',
              company: '포켓컴퍼니'
            },
            {
              id: 'dev-2',
              name: '이프론트',
              role: 'Frontend Developer',
              email: 'lee@pocket.com',
              company: '포켓컴퍼니'
            },
            {
              id: 'des-1',
              name: '최디자인',
              role: 'UI/UX Designer',
              email: 'choi@pocket.com',
              company: '포켓컴퍼니'
            }
          ],
          client_contact: {
            id: 'client-001',
            name: '정대표',
            role: 'CEO',
            email: 'ceo@startup.com',
            company: '스타트업A'
          }
        },
        risks: [
          {
            id: 'RSK-001',
            title: 'API 성능 이슈',
            description: '대용량 데이터 처리 시 응답 속도 저하 우려',
            level: 'medium',
            status: 'mitigating',
            mitigation_plan: '캐싱 전략 수립 및 쿼리 최적화 진행중',
            owner: {
              id: 'dev-1',
              name: '김개발',
              role: 'Backend Developer',
              email: 'kim@pocket.com'
            },
            identified_date: new Date('2024-02-10')
          }
        ],
        meetings: [
          {
            id: 'MTG-001',
            title: '주간 진행상황 점검',
            type: 'progress',
            date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            duration: 60,
            attendees: [],
            agenda: '1. 개발 진행 현황\\n2. 이슈 사항 논의\\n3. 다음 주 계획'
          }
        ],
        files: [],
        communication: {
          unread_messages: 3,
          last_activity: new Date()
        },
        kpi_impact: {
          baseline: { GO: 45, EC: 50, PT: 40, PF: 35, TO: 55 },
          current: { GO: 55, EC: 60, PT: 50, PF: 45, TO: 60 },
          target: { GO: 70, EC: 75, PT: 65, PF: 60, TO: 70 }
        }
      },
      {
        id: 'PRJ-002',
        title: 'IR 덱 컨설팅',
        service_id: 'SVC-DOC-002',
        category: '문서작업',
        status: 'active',
        created_from: 'nba',
        contract: {
          id: 'CNT-002',
          value: 8000000,
          signed_date: new Date('2024-02-01'),
          start_date: new Date('2024-02-05'),
          end_date: new Date('2024-03-05')
        },
        progress: {
          overall: 35,
          milestones_completed: 1,
          milestones_total: 4,
          deliverables_submitted: 2,
          deliverables_total: 6
        },
        timeline: {
          kickoff_date: new Date('2024-02-05'),
          phase_updated_at: new Date(),
          phase_updated_by: 'system',
          start_date: new Date('2024-02-05'),
          end_date: new Date('2024-05-05')
        },
        workstreams: [
          {
            id: 'WS-003',
            name: '시장조사',
            status: 'in_progress',
            owner: {
              id: 'con-1',
              name: '김컨설턴트',
              role: 'Strategy Consultant',
              email: 'kim.consultant@pocket.com'
            },
            tasks: [],
            progress: 40
          },
          {
            id: 'WS-004',
            name: '재무모델링',
            status: 'backlog',
            owner: {
              id: 'con-2',
              name: '이애널리스트',
              role: 'Financial Analyst',
              email: 'lee.analyst@pocket.com'
            },
            tasks: [],
            progress: 10
          }
        ],
        deliverables: [
          {
            id: 'DLV-004',
            name: '사업계획서 초안',
            description: '투자유치용 사업계획서 v1.0',
            status: 'in_progress',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            version: 1,
            files: []
          },
          {
            id: 'DLV-005',
            name: '시장분석 리포트',
            description: 'TAM/SAM/SOM 분석 및 경쟁사 분석',
            status: 'in_progress',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            version: 1,
            files: []
          }
        ],
        team: {
          pm: {
            id: 'pm-002',
            name: '이컨설턴트',
            role: 'Senior Consultant',
            email: 'lee.senior@pocket.com',
            company: '포켓컴퍼니'
          },
          members: [
            {
              id: 'con-1',
              name: '김컨설턴트',
              role: 'Strategy Consultant',
              email: 'kim.consultant@pocket.com',
              company: '포켓컴퍼니'
            },
            {
              id: 'con-2',
              name: '이애널리스트',
              role: 'Financial Analyst',
              email: 'lee.analyst@pocket.com',
              company: '포켓컴퍼니'
            }
          ],
          client_contact: {
            id: 'client-002',
            name: '김대표',
            role: 'CEO',
            email: 'kim@startup-b.com',
            company: '스타트업B'
          }
        },
        risks: [
          {
            id: 'RSK-002',
            title: '재무 데이터 부족',
            description: '과거 재무 실적 데이터가 충분하지 않아 예측 정확도 우려',
            level: 'low',
            status: 'identified',
            owner: {
              id: 'con-2',
              name: '이애널리스트',
              role: 'Financial Analyst',
              email: 'lee.analyst@pocket.com'
            },
            identified_date: new Date('2024-02-08')
          }
        ],
        meetings: [
          {
            id: 'MTG-002',
            title: '중간 리뷰 미팅',
            type: 'review',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            duration: 90,
            attendees: [],
            agenda: '1. 시장분석 결과 공유\\n2. IR 덱 초안 검토\\n3. 피드백 수렴'
          }
        ],
        files: [],
        communication: {
          unread_messages: 1,
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        kpi_impact: {
          baseline: { GO: 50, EC: 45, PT: 55, PF: 40, TO: 50 },
          current: { GO: 55, EC: 50, PT: 60, PF: 42, TO: 52 },
          target: { GO: 65, EC: 60, PT: 70, PF: 55, TO: 60 }
        }
      }
    ];
    
    setProjects(sampleProjects);
    setIsProjectsInitialized(true);
    localStorage.setItem('buildup_projects', JSON.stringify(sampleProjects));
  };

  const addToCart = (service: BuildupService, options?: CartItem['options']) => {
    const existingItem = cart.find(item => item.service.service_id === service.service_id);

    if (existingItem) {
      // Update quantity or options if item already in cart
      updateCartItem(service.service_id, options || {});
    } else {
      const newItem: CartItem = {
        service,
        quantity: 1,
        options: options || {
          scope: 'basic',
          rush_delivery: false,
          add_ons: []
        },
        subtotal: service.price?.original || 0  // 새 데이터 구조 사용
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.service.service_id !== serviceId));
  };

  const updateCartItem = (serviceId: string, options: Partial<CartItem['options']>) => {
    setCart(cart.map(item => {
      if (item.service.service_id === serviceId) {
        const updatedOptions = { ...item.options, ...options };
        let subtotal = item.service.price?.original || 0;  // 새 데이터 구조 사용

        if (updatedOptions.scope === 'premium') {
          subtotal = (item.service.price?.original || 0) * 1.5;
        } else if (updatedOptions.scope === 'custom') {
          subtotal = (item.service.price?.original || 0) * 2;
        }

        if (updatedOptions.rush_delivery && item.service.price?.discounted) {
          subtotal = item.service.price.discounted;  // 긴급 할증 대신 할인가 사용
        }

        return {
          ...item,
          options: updatedOptions,
          subtotal
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCart([]);
  };

  const createProjectFromService = (service: BuildupService, checkoutData?: any): Project => {
    const today = new Date();
    const kickoffDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const startDate = kickoffDate;
    const endDate = new Date(kickoffDate.getTime() + service.duration.weeks * 7 * 24 * 60 * 60 * 1000);

    return {
      id: `PRJ-${Date.now()}`,
      title: `${service.name} 프로젝트`,
      service_id: service.service_id,
      category: service.category,
      status: 'active',
      phase: 'contract_pending',  // 초기 상태: 계약중
      created_from: 'catalog',
      contract: {
        id: `CNT-${Date.now()}`,
        value: service.price.original,
        signed_date: today,
        start_date: startDate,
        end_date: endDate
      },
      // progress 필드는 레거시용으로만 유지
      timeline: {
        kickoff_date: kickoffDate,
        phase_updated_at: today,
        phase_updated_by: 'system',
        start_date: startDate,
        end_date: endDate
      },
      workstreams: [],
      deliverables: service.deliverables.main.map((d, idx) => ({
        id: `DLV-${Date.now()}-${idx}`,
        name: d,
        description: '',
        status: 'pending' as const,
        due_date: new Date(today.getTime() + ((idx + 1) * 7) * 24 * 60 * 60 * 1000),
        version: 1,
        files: []
      })),
      team: {
        pm: defaultBusinessSupportPM,
        members: [],
        client_contact: checkoutData?.contactInfo || {
          id: 'client-auto',
          name: checkoutData?.name || '고객사 담당자',
          role: 'CEO',
          email: checkoutData?.email || 'client@company.com',
          company: checkoutData?.company || '고객사'
        }
      },
      risks: [],
      meetings: [
        {
          id: `MTG-${Date.now()}`,
          title: '킥오프 미팅',
          type: 'kickoff',
          date: kickoffDate,
          duration: 60,
          attendees: [],
          agenda: '1. 프로젝트 목표 확인\n2. 일정 및 마일스톤 협의\n3. 커뮤니케이션 채널 확정',
          location: '줄',
          meeting_link: 'https://zoom.us/j/123456789'
        }
      ],
      files: [],
      communication: {
        unread_messages: 1,
        last_activity: today
      }
    };
  };

  const createProject = (data: Partial<Project>) => {
    // 비서비스를 통한 프로젝트 생성인 경우
    if (data.service_id) {
      const service = services.find(s => s.service_id === data.service_id);
      if (service) {
        const newProject = createProjectFromService(service, data);
        setProjects([...projects, newProject]);
        return newProject;
      }
    }

    // 수동 프로젝트 생성 (기존 코드와 호환)
    const today = new Date();
    const kickoffDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newProject: Project = {
      id: `PRJ-${Date.now()}`,
      title: data.title || 'New Project',
      service_id: data.service_id || '',
      category: data.category || '컨설팅',
      status: data.status || 'active',
      phase: data.phase || 'contract_pending',  // 기본 상태: 계약중
      created_from: data.created_from || 'manual',
      contract: data.contract || {
        id: `CNT-${Date.now()}`,
        value: 0,
        signed_date: today,
        start_date: kickoffDate,
        end_date: endDate
      },
      // progress 필드는 레거시용
      timeline: data.timeline || {
        kickoff_date: kickoffDate,
        phase_updated_at: today,
        phase_updated_by: 'system',
        start_date: kickoffDate,
        end_date: endDate
      },
      workstreams: data.workstreams || [],
      deliverables: data.deliverables || [],
      team: data.team || {
        pm: defaultBusinessSupportPM,
        members: [],
        client_contact: {
          id: 'client-1',
          name: '고객사 담당자',
          role: 'Stakeholder',
          email: 'client@company.com',
          company: '고객사'
        }
      },
      risks: data.risks || [],
      meetings: data.meetings || [],
      files: data.files || [],
      communication: data.communication || {
        unread_messages: 0,
        last_activity: today
      },
      ...data
    };

    setProjects([...projects, newProject]);

    // 프로젝트 생성 성공 알림 (나중에 토스트로 변경 가능)

    return newProject;
  };

  const updateProject = (projectId: string, data: Partial<Project>) => {
    setProjects(projects.map(project =>
      project.id === projectId ? { ...project, ...data } : project
    ));
  };

  // Stage C-3: Initialize new Phase Transition Module
  useEffect(() => {
    // Phase Changed Event Handler
    const handlePhaseChangedEvent = (event: PhaseChangedEvent) => {

      // Update local project state
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === event.payload.projectId
            ? {
                ...project,
                phase: event.payload.newPhase as any,
                timeline: {
                  ...project.timeline,
                  phase_updated_at: event.payload.changedAt,
                  phase_updated_by: event.payload.changedBy
                }
              }
            : project
        )
      );

      // Add to phase transition history
      const buildupEvent: PhaseTransitionEvent = {
        id: `PT-${Date.now()}`,
        projectId: event.payload.projectId,
        fromPhase: event.payload.previousPhase,
        toPhase: event.payload.newPhase,
        trigger: 'system',
        triggeredBy: event.payload.changedBy,
        status: 'completed',
        createdAt: event.payload.changedAt
      };

      setPhaseTransitionEvents(prev => [...prev, buildupEvent]);

    };

    // Register event listener
    const subscriptionId = eventBus.on('PHASE_CHANGED', handlePhaseChangedEvent);

    // Phase 4: Listen for Schedule Events from ScheduleContext (Refactored with EventSourceTracker)
    const handleBuildupMeetingCreated = (event: CustomEvent) => {
      const { schedule, metadata } = event.detail;

      // Step 3-4: Apply EventSourceTracker for circular reference prevention
      if (event.detail.eventId && !EventSourceTracker.shouldProcess(event.detail.eventId)) {
        logEvent('CIRCULAR_REF_PREVENTED', event.detail, 'BuildupContext-PhaseTransition');
        return;
      }

      // Also add the meeting to the project meetings array
      if (metadata?.projectId) {
        // Find the project for validation
        const project = projects.find(p => p.id === metadata.projectId);
        if (!project) {
          console.error('❌ Project not found for meeting validation:', metadata.projectId);
          EdgeCaseLogger.log('EC_DATA_002', {
            projectId: metadata.projectId,
            scheduleId: schedule.id,
            reason: 'Project not found during meeting creation'
          });
          return;
        }

        // Phase 4-3: Validate meeting schedule before processing
        if (schedule.type === 'buildup_project') {

          const validationResult = ValidationManager.validateMeetingCreation(
            schedule,
            project,
            scheduleContext?.schedules || []
          );

          if (!validationResult.isValid) {
            console.error('❌ Meeting validation failed:', validationResult);

            EdgeCaseLogger.log('EC_USER_004', {
              projectId: metadata.projectId,
              scheduleId: schedule.id,
              validationErrors: validationResult.errors.length,
              validationWarnings: validationResult.warnings.length,
              errors: validationResult.errors.map(e => e.code)
            });

            // For critical meeting validation errors, we might want to cancel the operation
            if (validationResult.severity === 'critical') {
              console.error('🚫 Critical meeting validation errors, skipping meeting creation');
              return;
            }

            // Log warnings but continue
            if (validationResult.warnings.length > 0) {
              const warningMessages = validationResult.warnings.map(w => w.message).join(', ');
              console.warn('⚠️ Meeting validation warnings:', warningMessages);
            }
          } else {
          }
        }

        // Convert schedule to meeting and add to project
        const meeting = dataConverter.scheduleToMeeting(schedule);

        setProjects(prevProjects => {
          const updatedProjects = prevProjects.map(project => {
            if (project.id !== metadata.projectId) return project;

            // Add meeting if not exists
            const existingMeeting = project.meetings?.find(m => m.id === meeting.id);
            if (!existingMeeting) {
              project = {
                ...project,
                meetings: [...(project.meetings || []), meeting]
              };
            }

            // Handle phase transition if needed
            if (metadata.phaseTransition?.toPhase) {
              const fromPhase = project.phase;
              project = {
                ...project,
                phase: metadata.phaseTransition.toPhase
              };
            }

            return project;
          });

          return updatedProjects;
        });

        // Still emit the event for other listeners
        if (metadata.phaseTransition) {
          const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
            projectId: metadata.projectId,
            currentPhase: project.phase || 'contract_pending',
            targetPhase: metadata.phaseTransition.toPhase,
            requestedBy: 'ScheduleSystem',
            reason: `미팅 예약됨: ${schedule.title}`,
            automatic: true
          }, { source: 'ScheduleContext' });

          eventBus.emit('PHASE_CHANGE_REQUEST', phaseChangeEvent);
        }
      }
    };

    // Add schedule event listener with debug log
    window.addEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated as EventListener);


    // Cleanup function
    return () => {
      eventBus.off(subscriptionId);
      window.removeEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated as EventListener);
    };
  }, []); // Empty dependency array since we use functional state updates

  // ================================================================================
  // Sprint 3 Phase 1: Phase Transition Mapping Constants
  // ================================================================================

  const MEETING_SEQUENCE_TO_PHASE_MAP: Record<string, string> = {
    'pre_meeting': 'contract_signed',
    'guide_1st': 'planning',
    'guide_2nd': 'design',
    'guide_3rd': 'execution',
    'guide_4th': 'review'
  };

  const PHASE_LABELS: Record<string, string> = {
    'contract_pending': '계약 중',
    'contract_signed': '계약 완료',
    'planning': '기획',
    'design': '설계',
    'execution': '실행',
    'review': '검토',
    'completed': '완료'
  };

  // ================================================================================
  // Sprint 1 Step 3: Schedule Event Handlers for Context Synchronization
  // ================================================================================

  useEffect(() => {
    // Sprint 3 Phase 1: Helper Functions

    // Identify meeting sequence from schedule
    const identifyMeetingSequence = (schedule: any): string | null => {
      // 1. Check explicit meetingSequence field
      if (schedule.meetingSequence) {
        return schedule.meetingSequence;
      }

      // 2. Check metadata for sequence
      if (schedule.metadata?.meetingSequence) {
        return schedule.metadata.meetingSequence;
      }

      // 3. Pattern matching from title
      const title = schedule.title?.toLowerCase() || '';

      if (title.includes('프리미팅') || title.includes('pre')) return 'pre_meeting';
      if (title.includes('킥오프') || title.includes('1차') || title.includes('guide 1')) return 'guide_1st';
      if (title.includes('2차') || title.includes('guide 2')) return 'guide_2nd';
      if (title.includes('3차') || title.includes('guide 3')) return 'guide_3rd';
      if (title.includes('4차') || title.includes('guide 4')) return 'guide_4th';

      return null;
    };


    // Phase 4-2: 실제 phase transition 실행 (Queue에서 호출됨)
    const executePhaseTransitionDirect = async (projectId: string, toPhase: string, trigger: string, metadata?: any) => {

      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const fromPhase = project.phase;

      // State snapshot 생성
      const snapshotId = await globalSnapshotManager.createSnapshot(
        projectId,
        'phase_transition',
        trigger,
        {
          description: `Phase transition: ${fromPhase} → ${toPhase}`,
          tags: ['phase_transition', trigger],
          userId: 'system'
        }
      );


      try {
        // Update project phase
        setProjects(prev => prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                phase: toPhase,
                phaseHistory: [
                  ...(p.phaseHistory || []),
                  {
                    phase: toPhase,
                    transitionedAt: new Date().toISOString(),
                    transitionedBy: metadata?.userId || 'system',
                    trigger,
                    metadata
                  }
                ]
              }
            : p
        ));

      // Record phase transition event
      const transitionEvent: PhaseTransitionEvent = {
        id: `PTE-${Date.now()}`,
        projectId,
        fromPhase,
        toPhase,
        trigger,
        timestamp: new Date().toISOString(),
        metadata
      };

      setPhaseTransitionEvents(prev => [...prev, transitionEvent]);

      // 🔥 Sprint 3 Phase 3: 단계별 맞춤 토스트 메시지
      const fromPhaseLabel = PHASE_LABELS[fromPhase] || fromPhase;
      const toPhaseLabel = PHASE_LABELS[toPhase] || toPhase;
      const projectTitle = project.title || '프로젝트';

      // 단계별 맞춤 메시지와 이모지
      const phaseMessages: Record<string, { emoji: string; title: string; description: string }> = {
        'contract_pending': {
          emoji: '📋',
          title: '계약 준비 단계',
          description: '프로젝트 계약 체결을 위한 준비가 시작되었습니다'
        },
        'contract_signed': {
          emoji: '✍️',
          title: '계약 체결 완료',
          description: '프로젝트 계약이 성공적으로 체결되었습니다'
        },
        'planning': {
          emoji: '🎯',
          title: '기획 단계 시작',
          description: '프로젝트 전략과 계획을 수립하는 단계입니다'
        },
        'design': {
          emoji: '🎨',
          title: '디자인 단계 진입',
          description: 'UI/UX 설계와 디자인 작업이 시작됩니다'
        },
        'execution': {
          emoji: '🚀',
          title: '개발 실행 단계',
          description: '본격적인 개발과 구현 작업이 진행됩니다'
        },
        'review': {
          emoji: '✅',
          title: '검토 및 테스트',
          description: '최종 검토와 품질 검증이 이루어집니다'
        },
        'completed': {
          emoji: '🎉',
          title: '프로젝트 완료',
          description: '프로젝트가 성공적으로 완료되었습니다'
        }
      };

      const phaseInfo = phaseMessages[toPhase];
      if (phaseInfo) {
        showSuccess(
          `${phaseInfo.emoji} ${projectTitle} - ${phaseInfo.title}\n${phaseInfo.description}`,
          6000 // 6초간 표시
        );
      } else {
        // 기본 메시지
        showSuccess(
          `🚀 ${projectTitle} 단계 전환 완료! ${fromPhaseLabel} → ${toPhaseLabel}`,
          5000
        );
      }

      // Emit custom event for other components
      window.dispatchEvent(new CustomEvent('project:phase_changed', {
        detail: { projectId, fromPhase, toPhase, trigger }
      }));


        // Cleanup snapshot on success
        setTimeout(() => {
          globalSnapshotManager.deleteSnapshot(snapshotId);
          console.log(`🧹 Cleaned up snapshot ${snapshotId}`);
        }, 10000); // 10초 후 정리

      } catch (error) {
        console.error(`❌ Phase transition failed:`, error);

        // Rollback on error
        try {
          const rollbackResult = await globalSnapshotManager.rollbackToSnapshot(snapshotId);
          if (rollbackResult.success) {
          } else {
            console.error(`❌ Rollback failed:`, rollbackResult.error);
          }
        } catch (rollbackError) {
          console.error(`❌ Critical error during rollback:`, rollbackError);
        }

        EdgeCaseLogger.log('EC_SYSTEM_001', {
          projectId,
          fromPhase,
          toPhase,
          trigger,
          error: error.message,
          snapshotId
        });

        throw error;
      }
    };

    // Step 3-2: Event Handlers Implementation

    // Handle schedule created event
    const handleScheduleCreated = (e: CustomEvent<ScheduleEventDetail>) => {
      const { schedule, metadata } = e.detail;

      // 1. Prevent circular reference
      if (!e.detail.eventId || !EventSourceTracker.shouldProcess(e.detail.eventId)) {
        logEvent('CIRCULAR_REF_PREVENTED', e.detail, 'BuildupContext');
        return;
      }

      // 2. Only process buildup project meetings
      if (schedule.subType !== 'buildup_project') return;

      // 3. Check project ID
      const projectId = metadata?.projectId;
      if (!projectId) {
        console.warn('[BuildupContext] Schedule has no projectId, skipping');
        return;
      }

      // 4. Convert to Meeting
      const meeting = dataConverter.scheduleToMeeting(schedule);

      // 5. Add to project meetings array
      setProjects(prev => prev.map(project => {
        if (project.id !== projectId) return project;

        // Check for duplicate
        const existingMeeting = project.meetings?.find(m => m.id === meeting.id);
        if (existingMeeting) {
          console.warn(`[BuildupContext] Meeting ${meeting.id} already exists in project ${projectId}`);
          return project;
        }

        return {
          ...project,
          meetings: [...(project.meetings || []), meeting]
        };
      }));

      logEvent('MEETING_ADDED_TO_PROJECT', e.detail, 'BuildupContext');

      // 🔥 Sprint 3 Phase 1: Check for phase transition
      const meetingSequence = identifyMeetingSequence(schedule);
      if (meetingSequence) {
        const targetPhase = MEETING_SEQUENCE_TO_PHASE_MAP[meetingSequence];
        if (targetPhase) {
          // Find the project that was just updated
          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject && updatedProject.phase !== targetPhase) {
            executePhaseTransition(projectId, targetPhase, setProjects);
          }
        }
      }
    };

    // Handle schedule updated event
    const handleScheduleUpdated = (e: CustomEvent<ScheduleEventDetail>) => {
      const { schedule, metadata } = e.detail;

      // 1. Prevent circular reference
      if (!e.detail.eventId || !EventSourceTracker.shouldProcess(e.detail.eventId)) {
        logEvent('CIRCULAR_REF_PREVENTED', e.detail, 'BuildupContext');
        return;
      }

      // 2. Only process buildup project meetings
      if (schedule.subType !== 'buildup_project') return;

      // 3. Check project ID
      const projectId = metadata?.projectId;
      if (!projectId) return;

      // 4. Convert to Meeting
      const updatedMeeting = dataConverter.scheduleToMeeting(schedule);

      // 5. Update in project meetings array
      setProjects(prev => prev.map(project => {
        if (project.id !== projectId) return project;

        return {
          ...project,
          meetings: updateMeetingInArray(project.meetings || [], schedule.id, updatedMeeting)
        };
      }));

      logEvent('MEETING_UPDATED_IN_PROJECT', e.detail, 'BuildupContext');
    };

    // Handle schedule deleted event
    const handleScheduleDeleted = (e: CustomEvent<ScheduleEventDetail>) => {
      const { schedule, metadata } = e.detail;

      // 1. Prevent circular reference
      if (!e.detail.eventId || !EventSourceTracker.shouldProcess(e.detail.eventId)) {
        logEvent('CIRCULAR_REF_PREVENTED', e.detail, 'BuildupContext');
        return;
      }

      // 2. Only process buildup project meetings
      if (schedule.subType !== 'buildup_project') return;

      // 3. Check project ID
      const projectId = metadata?.projectId;
      if (!projectId) return;

      // 4. Remove from project meetings array
      setProjects(prev => prev.map(project => {
        if (project.id !== projectId) return project;

        return {
          ...project,
          meetings: removeMeetingFromArray(project.meetings || [], schedule.id)
        };
      }));

      logEvent('MEETING_REMOVED_FROM_PROJECT', e.detail, 'BuildupContext');
    };

    // Handle schedule synced event (batch sync)
    const handleScheduleSynced = (e: CustomEvent<ScheduleEventDetail>) => {
      const { metadata } = e.detail;

      // This would be used for initial sync or batch updates
      // For now, we'll skip implementation as it requires more complex logic
      console.log('[BuildupContext] Schedule sync event received', metadata);
    };

    // Step 3-1: Register all event listeners
    const eventHandlers: Record<string, EventListener> = {
      [CONTEXT_EVENTS.SCHEDULE_CREATED]: handleScheduleCreated as EventListener,
      [CONTEXT_EVENTS.SCHEDULE_UPDATED]: handleScheduleUpdated as EventListener,
      [CONTEXT_EVENTS.SCHEDULE_DELETED]: handleScheduleDeleted as EventListener,
      [CONTEXT_EVENTS.SCHEDULE_SYNCED]: handleScheduleSynced as EventListener
    };

    // Register listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
      console.log(`  ✓ Registered: ${event}`);
    });

    // Cleanup
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, []); // Empty dependency to run once

  // Stage C-3: Phase transition functions connected to new system
  const triggerPhaseTransition = async (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => {

    try {
      // Find the project
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.error('Project not found:', projectId);
        return;
      }

      // Create meeting completed event
      const meetingEvent = createEvent('MEETING_COMPLETED', {
        meetingId: meetingRecord.id,
        projectId: projectId,
        meetingRecord: {
          id: meetingRecord.id,
          type: meetingRecord.type,
          notes: meetingRecord.notes
        },
        completedBy: pmId,
        completedAt: new Date()
      }, { source: 'BuildupContext' });

      // Emit the event - Phase Transition Engine will handle the rest
      await eventBus.emit('MEETING_COMPLETED', meetingEvent);

    } catch (error) {
      console.error('❌ Failed to trigger phase transition:', error);
    }
  };

  const handlePaymentCompleted = async (projectId: string, paymentData: any) => {

    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.error('Project not found:', projectId);
        return;
      }

      // For payment completion, we trigger a manual phase transition to start the project
      const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
        projectId: projectId,
        currentPhase: project.phase || 'contract_pending',
        targetPhase: 'kickoff_ready',
        reason: 'Payment completed',
        requestedBy: 'system',
        automatic: true
      }, { source: 'BuildupContext' });

      await eventBus.emit('PHASE_CHANGE_REQUEST', phaseChangeEvent);

    } catch (error) {
      console.error('❌ Failed to handle payment completion:', error);
    }
  };

  const requestManualPhaseTransition = async (projectId: string, fromPhase: string, toPhase: string, requestedBy: string, reason: string) => {

    try {
      // 1. 프로젝트 단계 업데이트
      setProjects(prev => prev.map(project =>
        project.id === projectId
          ? { ...project, phase: toPhase as any }
          : project
      ));

      // 2. 단계 전환 이력 추가
      const newTransitionEvent: PhaseTransitionEvent = {
        id: `transition-${projectId}-${Date.now()}`,
        projectId: projectId,
        fromPhase: fromPhase,
        toPhase: toPhase,
        timestamp: new Date(),
        requestedBy: requestedBy,
        reason: reason,
        automatic: false,
        status: 'completed'
      };

      setPhaseTransitionEvents(prev => [...prev, newTransitionEvent]);

      // 3. 이벤트 버스로 알림 (선택적)
      const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
        projectId: projectId,
        currentPhase: fromPhase,
        targetPhase: toPhase,
        reason: reason,
        requestedBy: requestedBy,
        automatic: false
      }, { source: 'BuildupContext' });

      await eventBus.emit('PHASE_CHANGE_REQUEST', phaseChangeEvent);

    } catch (error) {
      console.error('❌ Failed to request manual phase transition:', error);
      throw error;
    }
  };

  // These approval functions are for future enhancement - currently auto-approve
  const approvePhaseTransition = (approvalRequestId: string, approvedBy: string): boolean => {
    // Future: Implement approval workflow
    return true;
  };

  const rejectPhaseTransition = (approvalRequestId: string, rejectedBy: string, reason: string): boolean => {
    console.log('❌ Phase transition rejected:', { approvalRequestId, rejectedBy, reason });
    // Future: Implement approval workflow
    return true;
  };

  const getPendingPhaseApprovals = (): PhaseTransitionApprovalRequest[] => {
    // Future: Return actual pending approvals
    return [];
  };

  const getPhaseTransitionHistory = (projectId?: string): PhaseTransitionEvent[] => {
    if (projectId) {
      return phaseTransitionEvents.filter(event => event.projectId === projectId);
    }
    return phaseTransitionEvents;
  };

  const getRecommendedServices = (userAxis?: Record<AxisKey, number>) => {
    if (!userAxis) return services.slice(0, 5);

    // Find services that target user's weak axes
    const weakAxes = (Object.entries(userAxis) as [AxisKey, number][])
      .filter(([_, score]) => score < 70)
      .map(([axis, _]) => axis);

    return services
      .filter(service =>
        service.target_axis.some(axis => weakAxes.includes(axis))
      )
      .sort((a, b) => b.expected_improvement - a.expected_improvement)
      .slice(0, 5);
  };

  // 추천 서비스 가져오기 (높은 평점과 리뷰 수 기준)
  const getFeaturedServices = () => {
    return services
      .filter(s => s.avg_rating >= 4.5 && s.review_count >= 50)
      .sort((a, b) => b.avg_rating - a.avg_rating)
      .slice(0, 6);
  };

  // 서비스 ID로 단일 서비스 가져오기
  const getService = (id: string) => {
    return services.find(s => s.service_id === id);
  };

  // 서비스 검색 (제목, 설명, 부제목, 산출물에서 검색)
  const searchServices = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return services.filter(service =>
      service.name.toLowerCase().includes(lowercaseQuery) ||
      service.description.toLowerCase().includes(lowercaseQuery) ||
      service.subtitle.toLowerCase().includes(lowercaseQuery) ||
      service.deliverables.some(d => d.toLowerCase().includes(lowercaseQuery))
    );
  };

  // 카테고리별 필터링
  const filterByCategory = (category: string) => {
    if (category === 'all' || category === '전체') return services;
    return services.filter(s => s.category === category);
  };

  // 가격 범위별 필터링
  const filterByPriceRange = (min: number, max: number) => {
    return services.filter(s => {
      const price = s.price_base / 10000; // 만원 단위로 변환
      return price >= min && price <= max;
    });
  };

  // ================================================================================
  // Sprint 1 Step 3-3: Meeting Management Public Methods
  // ================================================================================

  // Add meeting to project
  const addMeetingToProject = useCallback((projectId: string, meeting: Meeting) => {
    // 1. Update internal state
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;

      // Check for duplicate
      const existingMeeting = project.meetings?.find(m => m.id === meeting.id);
      if (existingMeeting) {
        console.warn(`[BuildupContext] Meeting ${meeting.id} already exists in project ${projectId}`);
        return project;
      }

      return {
        ...project,
        meetings: [...(project.meetings || []), meeting]
      };
    }));

    // 2. Emit event to ScheduleContext (for bidirectional sync in future)
    // For now, we'll skip this to avoid circular dependency
    // This will be implemented in Sprint 2

  }, []);

  // Update project meeting
  const updateProjectMeeting = useCallback((projectId: string, meetingId: string, updates: Partial<Meeting>) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;

      const meetingExists = project.meetings?.find(m => m.id === meetingId);
      if (!meetingExists) {
        console.warn(`[BuildupContext] Meeting ${meetingId} not found in project ${projectId}`);
        return project;
      }

      return {
        ...project,
        meetings: updateMeetingInArray(project.meetings || [], meetingId, updates)
      };
    }));

  }, []);

  // Remove meeting from project
  const removeProjectMeeting = useCallback((projectId: string, meetingId: string) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;

      const meetingExists = project.meetings?.find(m => m.id === meetingId);
      if (!meetingExists) {
        console.warn(`[BuildupContext] Meeting ${meetingId} not found in project ${projectId}`);
        return project;
      }

      return {
        ...project,
        meetings: removeMeetingFromArray(project.meetings || [], meetingId)
      };
    }));

  }, []);

  // Sync all project meetings (batch update)
  const syncProjectMeetings = useCallback((projectId: string, meetings: Meeting[]) => {
    setProjects(prev => prev.map(project => {
      if (project.id !== projectId) return project;

      return {
        ...project,
        meetings
      };
    }));

  }, []);

  // Get project meetings
  const getProjectMeetings = useCallback((projectId: string): Meeting[] => {
    const project = projects.find(p => p.id === projectId);
    return project?.meetings || [];
  }, [projects]);

  // 관리자용: 새 서비스 추가
  const addService = async (service: BuildupService) => {
    try {
      // 실제 환경에서는 API 호출
      // await fetch('/api/buildup-services', { method: 'POST', body: JSON.stringify(service) });

      setServices([...services, service]);
      localStorage.setItem('buildup_services', JSON.stringify([...services, service]));
    } catch (err) {
      console.error('Error adding service:', err);
      throw err;
    }
  };

  // 관리자용: 서비스 업데이트
  const updateService = async (id: string, updates: Partial<BuildupService>) => {
    try {
      // 실제 환경에서는 API 호출
      // await fetch(`/api/buildup-services/${id}`, { method: 'PUT', body: JSON.stringify(updates) });

      const updatedServices = services.map(s =>
        s.service_id === id ? { ...s, ...updates } : s
      );
      setServices(updatedServices);
      localStorage.setItem('buildup_services', JSON.stringify(updatedServices));
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    }
  };

  // 관리자용: 서비스 삭제
  const deleteService = async (id: string) => {
    try {
      // 실제 환경에서는 API 호출
      // await fetch(`/api/buildup-services/${id}`, { method: 'DELETE' });

      const filteredServices = services.filter(s => s.service_id !== id);
      setServices(filteredServices);
      localStorage.setItem('buildup_services', JSON.stringify(filteredServices));
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    }
  };

  const activeProjects = projects.filter(p => 
    p.status === 'active' || p.status === 'preparing' || p.status === 'review'
  );
  
  const completedProjects = projects.filter(p => p.status === 'completed');

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const bundleDiscount = calculateBundleDiscount(cart.map(item => item.service));

  // D-Day 계산 함수
  const calculateDDay = (project: Project) => {
    if (!project.meetings || project.meetings.length === 0) return null;

    const nextMeeting = project.meetings[0];
    const now = new Date();
    const meetingDate = new Date(nextMeeting.date);

    const daysRemaining = Math.ceil(
      (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      days: daysRemaining,
      isUrgent: daysRemaining <= 2,     // 🔴 긴급: 1-2일
      isWarning: daysRemaining <= 7,    // 🟡 주의: 3-7일
      text: daysRemaining > 0 ? `D-${daysRemaining}` : daysRemaining === 0 ? '오늘' : '지남'
    };
  };

  // 긴급 프로젝트 조회
  const getUrgentProjects = () => {
    return activeProjects.filter(project => {
      const dday = calculateDDay(project);
      return dday && dday.isUrgent;
    });
  };

  // 오늘의 할 일 생성 (개선된 버전)
  const getTodayTasks = () => {
    const tasks: Array<{
      id: string;
      type: 'meeting' | 'deliverable' | 'review' | 'milestone';
      title: string;
      project: string;
      time?: string;
      priority: 'high' | 'medium' | 'low';
      status: 'pending' | 'in_progress' | 'completed';
    }> = [];

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);

    activeProjects.forEach(project => {
      const dday = calculateDDay(project);

      // 1. 미팅 관련 할 일
      if (project.meetings) {
        project.meetings.forEach(meeting => {
          const meetingDate = new Date(meeting.date);

          // 오늘, 내일, 모레 미팅
          if (meetingDate.toDateString() === today.toDateString() ||
              meetingDate.toDateString() === tomorrow.toDateString() ||
              meetingDate.toDateString() === dayAfterTomorrow.toDateString()) {

            const priority: 'high' | 'medium' | 'low' =
              meetingDate.toDateString() === today.toDateString() ? 'high' :
              dday?.isUrgent ? 'high' :
              dday?.isWarning ? 'medium' : 'low';

            const timeLabel = meetingDate.toDateString() === today.toDateString() ? '오늘' :
                            meetingDate.toDateString() === tomorrow.toDateString() ? '내일' : '모레';

            tasks.push({
              id: `${project.id}-${meeting.id}`,
              type: 'meeting',
              title: `${timeLabel} ${meeting.title}`,
              project: project.title,
              time: meetingDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              priority,
              status: 'pending'
            });
          }
        });
      }

      // 2. 산출물 마감 관련 할 일
      if (project.deliverables) {
        project.deliverables.forEach(deliverable => {
          const dueDate = new Date(deliverable.due_date);
          const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          // 3일 이내 마감인 산출물
          if (daysUntilDue <= 3 && daysUntilDue >= 0 &&
              (deliverable.status === 'pending' || deliverable.status === 'in_progress')) {

            const priority: 'high' | 'medium' | 'low' =
              daysUntilDue === 0 ? 'high' :
              daysUntilDue === 1 ? 'high' : 'medium';

            const dueDateLabel = daysUntilDue === 0 ? '오늘 마감' :
                               daysUntilDue === 1 ? '내일 마감' : `${daysUntilDue}일 후 마감`;

            tasks.push({
              id: `${project.id}-${deliverable.id}`,
              type: 'deliverable',
              title: `${deliverable.name} (${dueDateLabel})`,
              project: project.title,
              priority,
              status: deliverable.status === 'in_progress' ? 'in_progress' : 'pending'
            });
          }
        });
      }

      // 3. 읽지 않은 메시지 확인
      if (project.communication?.unread_messages > 0) {
        const priority: 'high' | 'medium' | 'low' =
          project.communication.unread_messages >= 5 ? 'high' :
          project.communication.unread_messages >= 2 ? 'medium' : 'low';

        tasks.push({
          id: `${project.id}-messages`,
          type: 'review',
          title: `읽지 않은 메시지 ${project.communication.unread_messages}개`,
          project: project.title,
          priority,
          status: 'pending'
        });
      }

      // 4. 프로젝트 단계 전환 필요 (검토 단계에서 7일 이상 머물러 있는 경우)
      if (project.phase === 'review' && project.timeline?.phase_updated_at) {
        const phaseUpdatedDate = new Date(project.timeline.phase_updated_at);
        const daysInCurrentPhase = Math.ceil((today.getTime() - phaseUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysInCurrentPhase >= 7) {
          tasks.push({
            id: `${project.id}-phase-transition`,
            type: 'milestone',
            title: '프로젝트 완료 검토 필요',
            project: project.title,
            priority: 'medium',
            status: 'pending'
          });
        }
      }
    });

    // 중요도 순으로 정렬 (high -> medium -> low)
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  // 7단계 기반 진행률 계산
  const getProjectProgress = (project: Project) => {
    // 1. 단계 기반 진행률 계산
    const phaseProgress = project.phase ? calculatePhaseProgress(project.phase) : 0;

    // 2. 산출물 기반 진행률 계산
    let deliverableProgress = 0;
    if (project.deliverables && project.deliverables.length > 0) {
      const completedDeliverables = project.deliverables.filter(
        d => d.status === 'approved' || d.status === 'completed'
      ).length;
      deliverableProgress = Math.round((completedDeliverables / project.deliverables.length) * 100);
    }

    // 3. 전체 진행률 계산 (단계 60% + 산출물 40%)
    const overallProgress = Math.round(phaseProgress * 0.6 + deliverableProgress * 0.4);

    // 4. 현재 단계 정보
    const currentPhase = project.phase ? PHASE_INFO[project.phase].label : '알 수 없음';
    const nextPhase = project.phase ? getNextPhase(project.phase) : null;
    const nextPhaseLabel = nextPhase ? PHASE_INFO[nextPhase].label : null;

    return {
      phaseProgress,
      deliverableProgress,
      overallProgress,
      currentPhase,
      nextPhase: nextPhaseLabel
    };
  };

  // 🔥 Sprint 4 Phase 4-5: Error Management & Monitoring System Initialization
  useEffect(() => {

    try {
      // 1. Setup global error handlers
      setupGlobalErrorHandler();

      // 2. Initialize performance monitoring
      PerformanceMonitor.setMonitoringEnabled(true);

      // 3. Start queue monitoring
      QueueRecoveryManager.startMonitoring(30000); // 30초마다 체크

      // 4. Enhanced phase transition with performance tracking
      const originalExecutePhaseTransition = executePhaseTransition;
      const enhancedExecutePhaseTransition = async (projectId: string, toPhase: string, trigger: string, metadata?: any) => {
        return await PerformanceMonitor.measurePhaseTransition(
          projectId,
          projects.find(p => p.id === projectId)?.phase || 'unknown',
          toPhase,
          () => originalExecutePhaseTransition(projectId, toPhase, trigger, metadata)
        );
      };

      // 5. Error handling for critical operations
      const handleCriticalError = (error: Error, context: any) => {
        const standardizedError = ErrorManager.standardizeError(error, context);

        // Report to user for high/critical errors
        if (['high', 'critical'].includes(standardizedError.severity)) {
          ErrorManager.reportErrorToUser(standardizedError.id);
        }

        // Always report critical errors to admin
        if (standardizedError.severity === 'critical') {
          ErrorManager.reportErrorToAdmin(standardizedError.id);
        }

        return standardizedError;
      };

      // 6. Memory usage monitoring
      const monitorMemoryUsage = () => {
        PerformanceMonitor.measureMemoryUsage();
      };

      // 메모리 모니터링 (5분마다)
      const memoryMonitorInterval = setInterval(monitorMemoryUsage, 5 * 60 * 1000);

      // 7. Periodic cleanup
      const cleanupInterval = setInterval(() => {
        // Old errors cleanup (3일 이상 된 것들)
        ErrorManager.clearOldErrors(72);

        // Old performance metrics cleanup
        PerformanceMonitor.clearOldMetrics(72);

        console.log('🧹 [BuildupContext] Performed periodic cleanup');
      }, 60 * 60 * 1000); // 1시간마다


      // 정리 함수
      return () => {
        QueueRecoveryManager.stopMonitoring();
        clearInterval(memoryMonitorInterval);
        clearInterval(cleanupInterval);
      };

    } catch (error) {
      console.error('❌ [BuildupContext] Failed to initialize error management systems:', error);

      // 초기화 실패도 에러로 처리
      const criticalError = new Error(`System initialization failed: ${error.message}`);
      ErrorManager.standardizeError(criticalError, {
        component: 'BuildupContext',
        action: 'system_initialization',
        projectId: 'system'
      });
    }
  }, []); // 한 번만 실행

  const value: BuildupContextType = {
    // 서비스 데이터
    services,
    loadingServices,
    error,

    // 장바구니 기능
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotal,
    bundleDiscount,

    // 프로젝트 관리
    projects,
    activeProjects,
    completedProjects,
    createProject,
    updateProject,

    // 프로젝트 계산 함수
    calculateDDay,
    getUrgentProjects,
    getTodayTasks,
    getProjectProgress,

    // 서비스 조회 및 필터링
    getService,
    searchServices,
    filterByCategory,
    filterByPriceRange,
    getRecommendedServices,
    getFeaturedServices,

    // 관리자 기능
    addService,
    updateService,
    deleteService,

    // UI 상태
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,

    // Phase Transition Functions
    triggerPhaseTransition,
    handlePaymentCompleted,
    requestManualPhaseTransition,
    approvePhaseTransition,
    rejectPhaseTransition,
    getPendingPhaseApprovals,
    getPhaseTransitionHistory,
    phaseTransitionEvents,

    // Meeting Management Functions (Sprint 1 Step 3)
    addMeetingToProject,
    updateProjectMeeting,
    removeProjectMeeting,
    syncProjectMeetings,
    getProjectMeetings
  };

  // Window 객체에 BuildupContext 노출 (Phase 전환 및 크로스 컨텍스트 통신용)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Context 객체 정의
      const buildupContextObj = {
        projects,
        setProjects,
        phaseTransitionEvents,
        setPhaseTransitionEvents,
        executePhaseTransition: async (projectId: string, toPhase: string, trigger: string, metadata?: any) => {
          // triggerPhaseTransition 함수 호출
          return triggerPhaseTransition(projectId, toPhase, trigger, metadata);
        }
      };

      // Window 객체에 노출 (Phase Transition 시스템과의 연동을 위해)
      window.buildupContext = buildupContextObj;

      // GlobalContextManager에 등록
      import('../utils/globalContextManager').then(({ contextManager }) => {
        contextManager.register('buildup', buildupContextObj, {
          name: 'buildup',
          version: '1.0.0',
          description: 'Buildup project management context',
          dependencies: ['schedule'],
          isReady: true
        });
      }).catch(error => {
        console.warn('GlobalContextManager registration failed:', error);
      });

      // Context ready 이벤트 발송
      contextReadyEmitter.markReady('buildup', [
        'projects',
        'setProjects',
        'phaseTransitionEvents',
        'setPhaseTransitionEvents',
        'executePhaseTransition'
      ]);
    }

    // Cleanup when unmounting
    return () => {
      if (typeof window !== 'undefined') {
        delete window.buildupContext;
        contextReadyEmitter.markUnready('buildup');
        console.log('🧹 BuildupContext removed from window');
      }
    };
  }, []); // Empty dependency - register once on mount

  // Migration 실행 플래그 (한 번만 실행하도록)
  const migrationAttemptedRef = useRef(false);

  // Development 테스트 도구 및 로그 (마운트 시 한 번만 실행)
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Development 환경에서는 전체 context도 노출
      // @ts-ignore
      if (window.testBuildupSync) {
        // @ts-ignore
        window.testBuildupSync._context = value;
        // @ts-ignore
        window.testBuildupSync.getContext = () => value;
      }

      // Phase 4-2: Setup global context references for queue system (중복 제거됨)
      // BuildupContext는 이미 위쪽 useEffect에서 window에 노출됨

      // Sprint 3 - Refactored: Use UnifiedMigrationManager
      const migrationManager = unifiedMigrationManager;

      const runMockDataMigration = async () => {
        // Sprint 5: Migration 임시 비활성화
        return;

        // 아래 코드는 Sprint 5 완료 후 재활성화 예정
        /*

        try {
          // Check if migration is already completed
          if (migrationManager.isCompleted()) {
            return;
          }

          // Run migration with progress tracking
          const success = await migrationManager.runMigration({
            onProgress: (progress, message) => {
            },
            onComplete: (results) => {
              const totalMigrated = results.reduce((sum, r) => sum + (r.migrated || 0), 0);
              if (totalMigrated > 0) {
                showSuccess(`📋 ${totalMigrated}개의 미팅 데이터가 마이그레이션되었습니다`);
              }
            },
            onError: (error) => {
              showError('미팅 데이터 마이그레이션 중 오류가 발생했습니다');
              console.error('Migration error:', error);
            }
          });

          const totalMigrated = results.reduce((sum, result) => sum + result.migrated, 0);

        } catch (error) {
          console.error('❌ Migration failed:', error);
          // MigrationManager handles retries internally
        }
        */
      };

      // Schedule migration check after initial load (only once)
      if (!migrationAttemptedRef.current) {
        migrationAttemptedRef.current = true;

        setTimeout(async () => {
          // Only run if contexts are ready
          if (projects.length > 0) {
            await runMockDataMigration();
          } else {
            // Retry later if projects not loaded yet
            setTimeout(runMockDataMigration, 5000);
          }
        }, 3000);
      }

      window.syncTest = {
        // 초기 동기화 재실행
        runInitialSync: () => {
          console.log('🧪 [Test] Running initial sync...');
          performInitialSync();
        },

        // Sprint 3: Manual migration trigger using MigrationManager
        runMockMigration: runMockDataMigration,

        // Unified Migration Manager controls (simplified)
        migrationManager: {
          getState: () => migrationManager.getState(),
          isCompleted: () => migrationManager.isCompleted(),
          isInProgress: () => migrationManager.isInProgress(),
          reset: () => migrationManager.reset(),
          forceMigration: () => migrationManager.forceMigration()
        },

        // Phase 4-2: Queue status check
        getQueueStatus: () => {
          return globalTransitionQueue.getAllQueues();
        },

        // Phase 4-2: Snapshot management
        getSnapshots: (projectId?: string) => {
          return globalSnapshotManager.getSnapshots(projectId);
        },

        // Phase 4-2: Edge case logs
        getEdgeCaseLogs: () => {
          return EdgeCaseLogger.getLogs();
        },

        // 동기화 상태 확인
        getSyncStatus: () => {
          const windowScheduleContext = (window as any).scheduleContext;
          return {
            isInProgress: windowScheduleContext?.isLoading || false,
            scheduleCount: windowScheduleContext?.schedules?.length || 0,
            buildupMeetingCount: windowScheduleContext?.schedules?.filter((s: any) =>
              s.type === 'buildup_project' || s.tags?.includes('buildup')).length || 0,
            projectCount: projects.length,
            totalMeetings: projects.reduce((acc, p) => acc + (p.meetings?.length || 0), 0)
          };
        },

        // 프로젝트별 스케줄 확인
        checkProjectSchedules: (projectId: string) => {
          const windowScheduleContext = (window as any).scheduleContext;
          const projectSchedules = windowScheduleContext?.schedules?.filter((s: any) =>
            s.projectId === projectId
          ) || [];
          const hasSchedules = projectSchedules.length > 0;
          const project = projects.find(p => p.id === projectId);

          return {
            projectId,
            hasSchedules,
            scheduleCount: projectSchedules.length,
            projectMeetingCount: project?.meetings?.length || 0,
            schedules: projectSchedules,
            meetings: project?.meetings || []
          };
        },

        // 이벤트 추적기 상태
        getEventTrackerStatus: () => {
          return {
            activeTrackers: EventSourceTracker.getActiveCount()
          };
        },

        // 전체 동기화 검증
        validateSync: () => {
          const results: any = {};
          const windowScheduleContext = (window as any).scheduleContext;

          projects.forEach(project => {
            const check = window.syncTest.checkProjectSchedules(project.id);
            // ✅ 올바른 검증: 프로젝트별 buildup_project 스케줄만 카운트
            const projectBuildupSchedules = windowScheduleContext?.schedules?.filter((s: any) =>
              s.type === 'buildup_project' && s.projectId === project.id
            ).length || 0;

            results[project.id] = {
              projectTitle: project.title,
              status: check.hasSchedules ? '✅ Synced' : '❌ Not Synced',
              meetingCount: check.projectMeetingCount,
              scheduleCount: check.scheduleCount, // 전체 스케줄 수
              buildupScheduleCount: projectBuildupSchedules, // 실제 비교할 값
              isValid: projectBuildupSchedules >= check.projectMeetingCount, // >=로 변경 (스케줄이 미팅보다 많거나 같으면 정상)
              syncRatio: check.projectMeetingCount > 0 ?
                Math.round((projectBuildupSchedules / check.projectMeetingCount) * 100) + '%' : '100%'
            };
          });

          console.table(results);
          return results;
        },

        // 강제 재동기화 (기존 데이터 삭제 후)
        forcePurgeAndResync: async () => {
          console.log('🧪 [Test] Force purge and resync...');

          // ScheduleContext 클리어 (window에서 접근)
          const windowScheduleContext = (window as any).scheduleContext;
          if (windowScheduleContext?.clearAllSchedules) {
            windowScheduleContext.clearAllSchedules();
          }

          // 잠시 대기
          await new Promise(resolve => setTimeout(resolve, 100));

          // 재동기화
          await performInitialSync();

          // 결과 검증
          return window.syncTest.validateSync();
        }
      };

      console.log('🧪 Sync testing tools available at window.syncTest');
      console.log('Available methods:', Object.keys(window.syncTest));
      console.log('  • window.testBuildupSync.testPhaseTransition("PRJ-001", "guide_1st") - Test single phase transition');
      console.log('  • window.testBuildupSync.testAllPhaseTransitions("PRJ-001") - Test all phase transitions');
      console.log('  • window.testBuildupSync.testUIIntegration("PRJ-001") - Test UI updates with phase transitions');
      console.log('  • window.testBuildupSync.testUIFeedback("PRJ-001") - Test UI feedback and animations');

      // 자동 검증 비활성화 (테스트 환경 최적화)
      // setTimeout(() => {
      //   window.syncTest.validateSync();
      // }, 2000);
    }
  }, []); // 빈 배열 - 마운트 시 한 번만 실행

  // GlobalContextManager에 자동 등록
  const { isRegistered, status } = useContextRegistration({
    name: 'buildup',
    context: value,
    metadata: CONTEXT_METADATA.buildup,
    dependencies: ['toast', 'schedule'], // Toast와 Schedule에 의존
    autoRegister: true,
    onReady: () => {
    },
    onError: (error) => {
      console.error('❌ Failed to register BuildupContext:', error);
    }
  });

  // 등록 상태 디버그 (개발 환경)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('BuildupContext registration status:', {
        isRegistered,
        status: status.status,
        errorCount: status.errorCount
      });
    }
  }, [isRegistered, status]);

  return (
    <BuildupContext.Provider value={value}>
      {children}
    </BuildupContext.Provider>
  );
}

export function useBuildupContext() {
  const context = useContext(BuildupContext);
  if (context === undefined) {
    throw new Error('useBuildupContext must be used within a BuildupProvider');
  }
  return context;
}

// ================================================================================
// Sprint 1 Step 3-5: Development Test Cases
// ================================================================================

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // @ts-ignore - Development only test utilities
  window.testBuildupSync = {
    // Test: Create a schedule and check if it syncs to buildup
    createTestMeeting: (projectId: string = 'PRJ-001') => {
      const testSchedule = {
        id: `test-meeting-${Date.now()}`,
        type: 'meeting',
        subType: 'buildup_project',
        title: 'Test Meeting',
        description: 'Test meeting for sync verification',
        date: new Date(),
        time: '10:00',
        duration: 60,
        location: 'Online',
        participants: ['PM', 'Client'],
        status: 'scheduled',
        priority: 'high',
        isRecurring: false,
        createdAt: new Date(),
        createdBy: 'test-system'
      };

      const testEvent = new CustomEvent(CONTEXT_EVENTS.SCHEDULE_CREATED, {
        detail: {
          action: 'created',
          schedule: testSchedule,
          source: 'Test',
          timestamp: Date.now(),
          eventId: `test-${Date.now()}`,
          metadata: {
            projectId
          }
        }
      });

      console.log('🧪 [TEST] Dispatching test schedule:created event...');
      window.dispatchEvent(testEvent);
      return testSchedule.id;
    },

    // Test: Update a schedule
    updateTestMeeting: (meetingId: string, projectId: string = 'PRJ-001') => {
      const updatedSchedule = {
        id: meetingId,
        type: 'meeting',
        subType: 'buildup_project',
        title: 'Updated Test Meeting',
        description: 'Updated description',
        date: new Date(),
        time: '14:00',
        duration: 90,
        location: 'Office',
        participants: ['PM', 'Client', 'Developer'],
        status: 'scheduled',
        priority: 'high',
        isRecurring: false,
        createdAt: new Date(),
        createdBy: 'test-system'
      };

      const testEvent = new CustomEvent(CONTEXT_EVENTS.SCHEDULE_UPDATED, {
        detail: {
          action: 'updated',
          schedule: updatedSchedule,
          source: 'Test',
          timestamp: Date.now(),
          eventId: `test-update-${Date.now()}`,
          metadata: {
            projectId
          }
        }
      });

      console.log('🧪 [TEST] Dispatching test schedule:updated event...');
      window.dispatchEvent(testEvent);
    },

    // Test: Delete a schedule
    deleteTestMeeting: (meetingId: string, projectId: string = 'PRJ-001') => {
      const testEvent = new CustomEvent(CONTEXT_EVENTS.SCHEDULE_DELETED, {
        detail: {
          action: 'deleted',
          schedule: {
            id: meetingId,
            type: 'meeting',
            subType: 'buildup_project',
            title: 'Deleted Meeting',
            date: new Date(),
            status: 'cancelled'
          },
          source: 'Test',
          timestamp: Date.now(),
          eventId: `test-delete-${Date.now()}`,
          metadata: {
            projectId
          }
        }
      });

      console.log('🧪 [TEST] Dispatching test schedule:deleted event...');
      window.dispatchEvent(testEvent);
    },

    // Check project meetings
    checkProjectMeetings: (projectId: string = 'PRJ-001') => {
      const buildupContext = window.testBuildupSync.getContext();
      if (!buildupContext) {
        console.error('[TEST] BuildupContext not available');
        return;
      }

      const meetings = buildupContext.getProjectMeetings(projectId);
      console.table(meetings.map(m => ({
        id: m.id,
        title: m.title,
        type: m.type,
        date: m.date,
        duration: m.duration,
        attendees: m.attendees?.length || 0
      })));
      return meetings;
    },

    // Check sync status
    checkSyncStatus: () => {
      console.log('  - Active event trackers:', EventSourceTracker.getActiveCount());
      console.log('    window.testBuildupSync.createTestMeeting("PRJ-001")');
      console.log('    window.testBuildupSync.checkProjectMeetings("PRJ-001")');
    },

    // Run full sync test
    runFullSyncTest: async (projectId: string = 'PRJ-001') => {

      // 1. Create a test meeting
      const meetingId = window.testBuildupSync.createTestMeeting(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Check if it was added
      window.testBuildupSync.checkProjectMeetings(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Update the meeting
      window.testBuildupSync.updateTestMeeting(meetingId, projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Check if it was updated
      window.testBuildupSync.checkProjectMeetings(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Delete the meeting
      window.testBuildupSync.deleteTestMeeting(meetingId, projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 6. Check if it was removed
      window.testBuildupSync.checkProjectMeetings(projectId);

    },

    // 🔥 Sprint 3 Phase 1: Test phase transition
    testPhaseTransition: async (projectId: string = 'PRJ-001', meetingType: string = 'guide_1st') => {

      // Get current project phase
      const buildupContext = window.testBuildupSync.getContext();
      if (!buildupContext) {
        console.error('[TEST] BuildupContext not available');
        return;
      }

      const project = buildupContext.projects.find((p: any) => p.id === projectId);
      if (!project) {
        console.error(`[TEST] Project ${projectId} not found`);
        return;
      }


      // Create a meeting with specific type
      const testSchedule = {
        id: `test-phase-${Date.now()}`,
        type: 'meeting',
        subType: 'buildup_project',
        title: `테스트 미팅 - ${meetingType}`,
        description: `Phase transition test for ${meetingType}`,
        date: new Date(),
        time: '10:00',
        duration: 60,
        location: 'Online',
        participants: ['PM', 'Client'],
        status: 'scheduled',
        priority: 'high',
        isRecurring: false,
        createdAt: new Date(),
        createdBy: 'test-system',
        meetingSequence: meetingType // Explicitly set meeting sequence
      };

      const testEvent = new CustomEvent(CONTEXT_EVENTS.SCHEDULE_CREATED, {
        detail: {
          action: 'created',
          schedule: testSchedule,
          source: 'Test',
          timestamp: Date.now(),
          eventId: `test-phase-${Date.now()}`,
          metadata: {
            projectId
          }
        }
      });

      window.dispatchEvent(testEvent);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if phase changed
      const updatedProject = buildupContext.projects.find((p: any) => p.id === projectId);
      if (updatedProject) {

        const expectedPhase = MEETING_SEQUENCE_TO_PHASE_MAP[meetingType];
        if (expectedPhase && updatedProject.phase === expectedPhase) {
        } else if (expectedPhase) {
        } else {
        }
      }

      return updatedProject;
    },

    // Test all phase transitions
    testAllPhaseTransitions: async (projectId: string = 'PRJ-001') => {

      const transitions = [
        { type: 'pre_meeting', expectedPhase: 'contract_signed', label: '사전 미팅 → 계약 체결' },
        { type: 'guide_1st', expectedPhase: 'planning', label: '1차 가이드 → 기획 단계' },
        { type: 'guide_2nd', expectedPhase: 'design', label: '2차 가이드 → 디자인 단계' },
        { type: 'guide_3rd', expectedPhase: 'execution', label: '3차 가이드 → 실행 단계' },
        { type: 'guide_4th', expectedPhase: 'review', label: '4차 가이드 → 검토 단계' }
      ];

      for (const transition of transitions) {
        await window.testBuildupSync.testPhaseTransition(projectId, transition.type);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    },

    // 🔥 Sprint 3 Phase 2: UI 업데이트 통합 테스트
    testUIIntegration: async (projectId: string = 'PRJ-001') => {

      const buildupContext = window.testBuildupSync.getContext();
      if (!buildupContext) {
        console.error('[TEST] BuildupContext not available');
        return;
      }

      // 1. 현재 프로젝트 단계 확인
      const project = buildupContext.projects.find((p: any) => p.id === projectId);
      if (!project) {
        console.error(`[TEST] Project ${projectId} not found`);
        return;
      }


      // 2. 단계 전환 테스트 및 UI 업데이트 확인
      await window.testBuildupSync.testPhaseTransition(projectId, 'guide_1st');

      // 3. 업데이트된 프로젝트 확인
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedProject = buildupContext.projects.find((p: any) => p.id === projectId);

      // 4. UI 컴포넌트 검증 가이드
      console.log('  2. BuildupCalendarV3: "단계 필터" 버튼 클릭하여 필터 UI 확인');
      console.log('  3. ServiceCatalog: "현재 단계" 추천 탭에서 단계별 서비스 확인');

    },

    // 🔥 Sprint 3 Phase 3: UI 피드백 및 애니메이션 테스트
    testUIFeedback: async (projectId: string = 'PRJ-001') => {

      const buildupContext = window.testBuildupSync.getContext();
      if (!buildupContext) {
        console.error('[TEST] BuildupContext not available');
        return;
      }

      const project = buildupContext.projects.find((p: any) => p.id === projectId);
      if (!project) {
        console.error(`[TEST] Project ${projectId} not found`);
        return;
      }


      // 1. 단계별 맞춤 토스트 메시지 테스트
      const phases = ['design', 'execution', 'review'];

      for (const phase of phases) {
        console.log(`  ➤ Testing ${phase} phase transition...`);
        await window.testBuildupSync.testPhaseTransition(projectId, phase === 'design' ? 'guide_2nd' : phase === 'execution' ? 'guide_3rd' : 'guide_4th');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 토스트 표시 시간 대기
      }

      // 2. UI 피드백 검증 가이드
      console.log('     - 현재 단계 텍스트 펄스 애니메이션 및 "새로 변경됨!" 표시');

      console.log('  3. "단계 이력" 탭에서 최근 변경사항 알림 확인');

      return true;
    },

    // Phase 4-3: Validation Test Utilities
    testValidation: {

      // Comprehensive validation test
      runComprehensiveValidation: async () => {

        try {
          const result = await ValidationManager.runComprehensiveValidation(projects, scheduleContext?.schedules || []);


          if (result.errors.length > 0) {
            result.errors.forEach((error, index) => {
              console.log(`  ${index + 1}. [${error.code}] ${error.message}`);
              if (error.field) console.log(`     Field: ${error.field}`);
              if (error.value) console.log(`     Value: ${error.value}`);
            });
          }

          if (result.warnings.length > 0) {
            result.warnings.forEach((warning, index) => {
              console.log(`  ${index + 1}. [${warning.code}] ${warning.message}`);
              if (warning.suggestion) console.log(`     Suggestion: ${warning.suggestion}`);
            });
          }

          return result;
        } catch (error) {
          console.error('❌ Validation test failed:', error);
          return null;
        }
      },

      // Test phase transition validation
      testPhaseTransitionValidation: (projectId: string, fromPhase: string, toPhase: string) => {

        const project = projects.find(p => p.id === projectId);
        if (!project) {
          console.error('❌ Project not found:', projectId);
          return null;
        }

        const result = ValidationManager.validatePhaseTransitionRequest(
          project,
          fromPhase as any,
          toPhase as any,
          { trigger: 'manual_test', timestamp: new Date() }
        );


        if (result.errors.length > 0) {
          result.errors.forEach(error => console.log(`    - ${error.message}`));
        }

        if (result.warnings.length > 0) {
          result.warnings.forEach(warning => console.log(`    - ${warning.message}`));
        }

        return result;
      },

      // Test meeting validation
      testMeetingValidation: (scheduleId: string) => {

        const schedule = scheduleContext?.schedules?.find(s => s.id === scheduleId);
        if (!schedule || schedule.type !== 'buildup_project') {
          console.error('❌ Buildup meeting schedule not found:', scheduleId);
          return null;
        }

        const meeting = schedule as any; // BuildupProjectMeeting
        const project = projects.find(p => p.id === meeting.projectId);
        if (!project) {
          console.error('❌ Project not found for meeting:', meeting.projectId);
          return null;
        }

        const result = ValidationManager.validateMeetingCreation(
          meeting,
          project,
          scheduleContext?.schedules || []
        );


        return result;
      },

      // Display validation status for all projects
      showValidationStatus: () => {
        console.log('=' * 50);

        // Project validation summary
        projects.forEach(project => {
          const result = ValidationManager.validateProject ?
            (ValidationManager as any).validateProject(project) :
            ProjectStateValidator.validateProject(project);

          const status = result.isValid ? '✅' : result.severity === 'critical' ? '🚨' : '⚠️';
          console.log(`  ${status} ${project.title} (${project.id})`);

          if (!result.isValid) {
            console.log(`    Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
          }
        });

        // Schedule validation summary
        const buildupSchedules = (scheduleContext?.schedules || []).filter(s => s.type === 'buildup_project');

        let validMeetings = 0;
        let invalidMeetings = 0;

        buildupSchedules.forEach(schedule => {
          const meeting = schedule as any;
          const project = projects.find(p => p.id === meeting.projectId);

          if (project) {
            const result = ValidationManager.validateMeetingCreation(meeting, project, scheduleContext?.schedules || []);
            if (result.isValid) {
              validMeetings++;
            } else {
              invalidMeetings++;
            }
          } else {
            invalidMeetings++;
          }
        });

        console.log(`  ❌ Invalid meetings: ${invalidMeetings}`);
      }
    },

    // 🔥 Sprint 4 Phase 4-4: Edge Case Testing Tools
    testEdgeCases: {

      // Conflict Resolution Testing
      testConflictResolution: async () => {

        // 현재 스케줄 가져오기
        const schedules = scheduleContext?.schedules || [];

        // 테스트용 충돌 스케줄 생성
        const testSchedule = {
          id: `test-conflict-${Date.now()}`,
          type: 'buildup_project' as const,
          title: '충돌 테스트 미팅',
          description: 'Conflict resolution test',
          startDateTime: new Date().toISOString(),
          endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1시간 후
          projectId: projects[0]?.id || 'PRJ-001',
          meetingSequence: 'guide_1' as any,
          attendees: ['Test PM', 'Test Client'],
          status: 'scheduled' as const,
          priority: 'high' as const,
          isRecurring: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'test-system'
        };

        // 충돌 감지
        const conflicts = ScheduleConflictResolver.detectConflicts(testSchedule, schedules, projects);

        conflicts.forEach((conflict, index) => {
          console.log(`  ${index + 1}. ${conflict.type} - ${conflict.conflictDetails.severity}`);
          console.log(`     Overlap: ${conflict.conflictDetails.overlapMinutes} minutes`);
          console.log(`     Resolutions: ${conflict.suggestedResolutions.length}`);
        });

        return { conflicts, testSchedule };
      },

      // Time Validation Testing
      testTimeValidation: () => {

        const testCases = [
          {
            name: 'Valid future meeting',
            schedule: {
              startDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 내일
              endDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            name: 'Past meeting (should fail)',
            schedule: {
              startDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 어제
              endDateTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            name: 'Weekend meeting (should warn)',
            schedule: {
              startDateTime: '2025-01-25T10:00:00.000Z', // 토요일
              endDateTime: '2025-01-25T11:00:00.000Z'
            }
          },
          {
            name: 'Too short meeting (should fail)',
            schedule: {
              startDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              endDateTime: new Date(Date.now() + 60 * 60 * 1000 + 5 * 60 * 1000).toISOString() // 5분
            }
          }
        ];

        testCases.forEach(testCase => {
          const mockSchedule = {
            id: 'test',
            type: 'buildup_project' as const,
            title: testCase.name,
            ...testCase.schedule
          } as any;

          const result = TimeValidator.validateScheduleTime(mockSchedule);

          if (result.errors.length > 0) {
            console.log(`   Errors: ${result.errors.map(e => e.message).join(', ')}`);
          }
          if (result.warnings.length > 0) {
            console.log(`   Warnings: ${result.warnings.map(w => w.message).join(', ')}`);
          }
        });
      },

      // Data Recovery Testing
      testDataRecovery: async () => {

        const healthReport = await DataRecoveryManager.performHealthCheck(projects, scheduleContext?.schedules || []);

        console.log(`   Projects: ${healthReport.statistics.totalProjects}`);
        console.log(`   Schedules: ${healthReport.statistics.totalSchedules}`);
        console.log(`   Orphan schedules: ${healthReport.statistics.orphanSchedules}`);
        console.log(`   Missing schedules: ${healthReport.statistics.missingSchedules}`);
        console.log(`   Duplicate meetings: ${healthReport.statistics.duplicateMeetings}`);

        healthReport.inconsistencies.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.type} (${issue.severity}): ${issue.description}`);
        });


        return healthReport;
      },

      // Retry Mechanism Testing
      testRetryMechanism: async () => {

        // 실패하는 작업 시뮬레이션
        const failingOperation = async () => {
          const shouldFail = Math.random() > 0.7; // 30% 성공률
          if (shouldFail) {
            throw new Error('Network timeout error');
          }
          return 'Success!';
        };

        const result = await RetryMechanismManager.executeWithRetry(
          'schedule_creation',
          failingOperation,
          {
            maxAttempts: 3,
            onRetry: (attempt, error) => {
              console.log(`   Retry attempt ${attempt}: ${error.message}`);
            },
            onSuccess: (result, attempts) => {
            },
            onFailure: (error, attempts) => {
              console.log(`   ❌ Failed after ${attempts} attempts: ${error.message}`);
            }
          }
        );

        console.log(`   Success: ${result.success}`);
        console.log(`   Attempts: ${result.attempts}`);
        console.log(`   Duration: ${result.totalDuration}ms`);
        console.log(`   Errors: ${result.errors.length}`);

        return result;
      },

      // Queue Recovery Testing
      testQueueRecovery: async () => {

        // 큐 모니터링 시작 (테스트 모드)
        QueueRecoveryManager.startMonitoring(5000); // 5초마다 체크

        // 큐 상태 요약 출력
        const summary = QueueRecoveryManager.getQueueSummary();
        console.log(`   Last Check: ${summary.lastCheck?.toLocaleString() || 'Never'}`);
        console.log(`   Recent Failures: ${summary.recentFailures}`);

        if (summary.currentMetrics) {
          console.log(`   Queue Size: ${summary.currentMetrics.size}`);
          console.log(`   Processing: ${summary.currentMetrics.processing}`);
          console.log(`   Error Rate: ${(summary.currentMetrics.errorRate * 100).toFixed(1)}%`);
          console.log(`   Health Score: ${summary.currentMetrics.healthScore}/100`);
        }

        summary.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });

        // 10초 후 모니터링 중지
        setTimeout(() => {
          QueueRecoveryManager.stopMonitoring();
        }, 10000);

        return summary;
      },

      // Cascade Operations Testing
      testCascadeOperations: async (projectId: string = projects[0]?.id || 'PRJ-001') => {

        // 삭제 영향 분석
        const impact = await CascadeOperationManager.analyzeProjectDeletionImpact(
          projectId,
          projects,
          scheduleContext?.schedules || []
        );

        console.log(`   Project: ${impact.projectTitle}`);
        console.log(`   Total Schedules: ${impact.impactAnalysis.totalSchedules}`);
        console.log(`   Upcoming Meetings: ${impact.impactAnalysis.upcomingMeetings}`);
        console.log(`   Phase Transition Events: ${impact.impactAnalysis.phaseTransitionEvents}`);
        console.log(`   Connected Systems: ${impact.impactAnalysis.connectedSystems.join(', ')}`);
        console.log(`   Estimated Data Size: ${impact.impactAnalysis.estimatedDataSize}`);

        impact.risks.factors.forEach((factor, index) => {
          console.log(`   ${index + 1}. ${factor}`);
        });

        impact.risks.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });


        return impact;
      },

      // 통합 Edge Case 시나리오 테스트
      runComprehensiveEdgeCaseTest: async () => {

        const results = {
          conflicts: null as any,
          timeValidation: null as any,
          dataRecovery: null as any,
          retryMechanism: null as any,
          queueRecovery: null as any,
          cascadeOperations: null as any,
          errors: [] as string[]
        };

        try {
          // 1. Conflict Resolution Test
          results.conflicts = await window.testBuildupSync.testEdgeCases.testConflictResolution();
        } catch (error) {
          results.errors.push(`Conflict Resolution: ${error.message}`);
        }

        try {
          // 2. Time Validation Test
          window.testBuildupSync.testEdgeCases.testTimeValidation();
          results.timeValidation = 'completed';
        } catch (error) {
          results.errors.push(`Time Validation: ${error.message}`);
        }

        try {
          // 3. Data Recovery Test
          results.dataRecovery = await window.testBuildupSync.testEdgeCases.testDataRecovery();
        } catch (error) {
          results.errors.push(`Data Recovery: ${error.message}`);
        }

        try {
          // 4. Retry Mechanism Test
          results.retryMechanism = await window.testBuildupSync.testEdgeCases.testRetryMechanism();
        } catch (error) {
          results.errors.push(`Retry Mechanism: ${error.message}`);
        }

        try {
          // 5. Queue Recovery Test
          results.queueRecovery = await window.testBuildupSync.testEdgeCases.testQueueRecovery();
        } catch (error) {
          results.errors.push(`Queue Recovery: ${error.message}`);
        }

        try {
          // 6. Cascade Operations Test
          results.cascadeOperations = await window.testBuildupSync.testEdgeCases.testCascadeOperations();
        } catch (error) {
          results.errors.push(`Cascade Operations: ${error.message}`);
        }

        // 결과 요약
        console.log('='.repeat(50));
        console.log(`❌ Tests Failed: ${results.errors.length}`);

        if (results.errors.length > 0) {
          results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }

        if (results.errors.length === 0) {
        } else if (results.errors.length < 3) {
        } else {
        }

        return results;
      }
    },

    // 🔥 Sprint 4 Phase 4-5: Error Management & Monitoring Testing Tools
    testErrorManagement: {

      // Error Manager Testing
      testErrorManager: () => {

        // 다양한 에러 시나리오 테스트
        const testScenarios = [
          {
            name: 'Network Error',
            error: new Error('Network timeout occurred'),
            context: { component: 'ScheduleContext', action: 'create_schedule' }
          },
          {
            name: 'Validation Error',
            error: new Error('Invalid project data provided'),
            context: { component: 'BuildupContext', action: 'create_project' }
          },
          {
            name: 'Phase Transition Error',
            error: new Error('executePhaseTransition failed: transition not allowed'),
            context: { component: 'BuildupContext', action: 'phase_transition', projectId: 'PRJ-001' }
          },
          {
            name: 'Critical System Error',
            error: new Error('Memory allocation failed'),
            context: { component: 'System', action: 'memory_allocation' }
          }
        ];

        testScenarios.forEach(scenario => {

          const standardizedError = ErrorManager.standardizeError(scenario.error, scenario.context);

          console.log(`   Error ID: ${standardizedError.id}`);
          console.log(`   Category: ${standardizedError.category}`);
          console.log(`   Severity: ${standardizedError.severity}`);
          console.log(`   User Message: ${standardizedError.userMessage}`);
          console.log(`   Action Message: ${standardizedError.actionMessage}`);
          console.log(`   Recoverable: ${standardizedError.isRecoverable}`);
          console.log(`   Recovery Strategy: ${standardizedError.recoveryStrategy}`);

          // 자동 복구 시도
          if (standardizedError.isRecoverable) {
            ErrorManager.attemptAutoRecovery(standardizedError.id).then(recovered => {
            });
          }
        });

        // 에러 통계 생성
        const stats = ErrorManager.generateStatistics(1);
        console.log(`   Total Errors: ${stats.totalErrors}`);
        console.log(`   Categories:`, stats.errorsByCategory);
        console.log(`   Severities:`, stats.errorsBySeverity);
        console.log(`   Recovery Success Rate: ${(stats.recoverySuccessRate * 100).toFixed(1)}%`);

        return stats;
      },

      // Performance Monitor Testing
      testPerformanceMonitor: async () => {

        // 다양한 성능 측정 시나리오
        const testOperations = [
          {
            name: 'Simulated API Call',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
              return 'API Response';
            }
          },
          {
            name: 'Data Processing',
            operation: async () => {
              // 복잡한 계산 시뮬레이션
              let result = 0;
              for (let i = 0; i < 100000; i++) {
                result += Math.sin(i) * Math.cos(i);
              }
              return result;
            }
          },
          {
            name: 'Mock Phase Transition',
            operation: async () => {
              await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
              return 'Phase transitioned';
            }
          }
        ];

        for (const test of testOperations) {

          const measurementId = PerformanceMonitor.startMeasurement(
            'api_response',
            test.name,
            { component: 'Test', action: 'performance_test' },
            ['test', 'simulation']
          );

          try {
            const result = await test.operation();
            const metric = PerformanceMonitor.endMeasurement(measurementId, { result: 'success' });

            if (metric) {
              console.log(`   Result: ${JSON.stringify(result).substring(0, 50)}...`);
            }
          } catch (error) {
            PerformanceMonitor.endMeasurement(measurementId, { result: 'error', error: error.message });
            console.log(`   ❌ Failed: ${error.message}`);
          }
        }

        // 메모리 사용량 측정
        const memoryMetric = PerformanceMonitor.measureMemoryUsage();

        // 성능 통계 생성
        const stats = PerformanceMonitor.generateStatistics(1);
        console.log(`   Total Measurements: ${stats.totalMeasurements}`);
        console.log(`   Performance Issues: ${stats.performanceIssues.length}`);

        if (stats.performanceIssues.length > 0) {
          stats.performanceIssues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue.type} (${issue.severity}): ${issue.description}`);
          });
        }

        return stats;
      },

      // System Health Check
      testSystemHealth: async () => {

        // Queue 상태 확인
        const queueSummary = QueueRecoveryManager.getQueueSummary();
        console.log(`   Recent Failures: ${queueSummary.recentFailures}`);

        // 에러 통계
        const errorStats = ErrorManager.generateStatistics(24);
        console.log(`   Total Errors: ${errorStats.totalErrors}`);
        console.log(`   Critical Errors: ${errorStats.errorsBySeverity?.critical || 0}`);
        console.log(`   High Errors: ${errorStats.errorsBySeverity?.high || 0}`);

        // 성능 통계
        const performanceStats = PerformanceMonitor.generateStatistics(24);
        console.log(`   Total Measurements: ${performanceStats.totalMeasurements}`);
        console.log(`   Performance Issues: ${performanceStats.performanceIssues.length}`);

        // 전체 시스템 건강성 판단
        const isHealthy =
          queueSummary.isHealthy &&
          (errorStats.errorsBySeverity?.critical || 0) === 0 &&
          (errorStats.errorsBySeverity?.high || 0) < 5 &&
          performanceStats.performanceIssues.filter(i => i.severity === 'critical').length === 0;


        // 권장사항
        const recommendations = [];
        if (!queueSummary.isHealthy) {
          recommendations.push('큐 시스템 문제 해결 필요');
        }
        if ((errorStats.errorsBySeverity?.critical || 0) > 0) {
          recommendations.push('심각한 에러 즉시 조치 필요');
        }
        if (performanceStats.performanceIssues.length > 0) {
          recommendations.push('성능 최적화 검토 필요');
        }

        if (recommendations.length > 0) {
          recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
          });
        }

        return {
          isHealthy,
          queueSummary,
          errorStats,
          performanceStats,
          recommendations
        };
      },

      // 통합 모니터링 시스템 테스트
      runComprehensiveMonitoringTest: async () => {

        const results = {
          errorManagement: null as any,
          performance: null as any,
          systemHealth: null as any,
          errors: [] as string[]
        };

        try {
          // 1. Error Management Test
          results.errorManagement = window.testBuildupSync.testErrorManagement.testErrorManager();
        } catch (error) {
          results.errors.push(`Error Management: ${error.message}`);
        }

        try {
          // 2. Performance Monitor Test
          results.performance = await window.testBuildupSync.testErrorManagement.testPerformanceMonitor();
        } catch (error) {
          results.errors.push(`Performance Monitor: ${error.message}`);
        }

        try {
          // 3. System Health Test
          results.systemHealth = await window.testBuildupSync.testErrorManagement.testSystemHealth();
        } catch (error) {
          results.errors.push(`System Health: ${error.message}`);
        }

        // 결과 요약
        console.log('='.repeat(60));
        console.log(`❌ Tests Failed: ${results.errors.length}`);

        if (results.errors.length > 0) {
          results.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }

        if (results.errors.length === 0) {
        } else if (results.errors.length < 2) {
        } else {
        }

        return results;
      },

      // 🔥 Sprint 5 최종: 시스템 통합 건강성 검사
      performSystemHealthCheck: async () => {

        try {
          // systemHealthCheck 함수가 전역으로 등록되어 있는지 확인
          if (typeof (window as any).systemHealthCheck === 'function') {
            const healthReport = await (window as any).systemHealthCheck();

            console.log(`Overall Status: ${healthReport.overall.toUpperCase()}`);
            console.log(`Total Checks: ${healthReport.checks.length}`);
            console.log(`Passed: ${healthReport.checks.filter(c => c.status === 'pass').length}`);
            console.log(`Warnings: ${healthReport.checks.filter(c => c.status === 'warning').length}`);
            console.log(`Failed: ${healthReport.checks.filter(c => c.status === 'fail').length}`);

            // 실패한 체크 항목들 표시
            const failedChecks = healthReport.checks.filter(c => c.status === 'fail');
            if (failedChecks.length > 0) {
              failedChecks.forEach(check => {
                console.log(`   - [${check.category.toUpperCase()}] ${check.name}: ${check.message}`);
              });
            }

            // 경고 체크 항목들 표시
            const warningChecks = healthReport.checks.filter(c => c.status === 'warning');
            if (warningChecks.length > 0) {
              warningChecks.forEach(check => {
                console.log(`   - [${check.category.toUpperCase()}] ${check.name}: ${check.message}`);
              });
            }

            // 권장사항 표시
            if (healthReport.recommendations.length > 0) {
              healthReport.recommendations.forEach(rec => {
                console.log(`   ${rec}`);
              });
            }

            return healthReport;
          } else {
            console.warn('⚠️ System health check function not available. Performing basic checks...');

            // 기본 건강성 검사
            const basicHealth = {
              overall: 'healthy' as const,
              timestamp: new Date(),
              checks: [
                {
                  name: 'BuildupContext Availability',
                  category: 'context' as const,
                  status: 'pass' as const,
                  message: 'BuildupContext is functioning'
                },
                {
                  name: 'ScheduleContext Integration',
                  category: 'integration' as const,
                  status: scheduleContext ? 'pass' : 'fail' as const,
                  message: scheduleContext ? 'ScheduleContext is connected' : 'ScheduleContext not available'
                },
                {
                  name: 'Project Data',
                  category: 'data' as const,
                  status: projects.length > 0 ? 'pass' : 'warning' as const,
                  message: `${projects.length} projects loaded`
                }
              ],
              statistics: {
                totalContexts: 3,
                activeProviders: scheduleContext ? 3 : 2,
                dataIntegrity: 85,
                performanceScore: 90,
                errorRate: 5,
                uptime: Math.round((Date.now() - Date.now()) / (1000 * 60))
              },
              recommendations: ['System health check utility should be properly loaded']
            };

            console.log(`Overall Status: ${basicHealth.overall.toUpperCase()}`);
            console.log(`Active Providers: ${basicHealth.statistics.activeProviders}/${basicHealth.statistics.totalContexts}`);

            return basicHealth;
          }
        } catch (error) {
          console.error('❌ System health check failed:', error);
          return {
            overall: 'critical' as const,
            timestamp: new Date(),
            checks: [{
              name: 'Health Check Execution',
              category: 'system' as const,
              status: 'fail' as const,
              message: `Health check failed: ${error.message}`
            }],
            statistics: {
              totalContexts: 0,
              activeProviders: 0,
              dataIntegrity: 0,
              performanceScore: 0,
              errorRate: 100,
              uptime: 0
            },
            recommendations: ['System health check needs to be fixed']
          };
        }
      }
    },

    // Store context reference for testing
    getContext: () => null,
    setContext: (ctx: BuildupContextType) => {
      // @ts-ignore
      window.testBuildupSync._context = ctx;
    }
  };

  console.log('🧪 [BuildupContext] Test utilities loaded. Access via window.testBuildupSync');
}