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

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
import {
  calculatePhaseProgress,
  PHASE_INFO,
  getNextPhase
} from '../utils/projectPhaseUtils';
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
      console.log('⏸️ Sync already in progress, skipping...');
      return;
    }

    try {
      console.log('🔄 Starting initial data synchronization...');

      // 1. 동기화 플래그 설정
      scheduleContext.setSyncInProgress(true);

      // 2. 프로젝트별 미팅 데이터 수집
      const allMeetings: Meeting[] = [];

      projects.forEach(project => {
        if (project.meetings && project.meetings.length > 0) {
          console.log(`📋 Found ${project.meetings.length} meetings in project ${project.id}`);
          allMeetings.push(...project.meetings);
        }
      });

      if (allMeetings.length === 0) {
        console.log('ℹ️ No meetings found to sync');
        scheduleContext.setSyncInProgress(false);
        return;
      }

      // 3. 중복 제거 및 변환 준비
      const uniqueMeetings = DuplicateDetector.removeDuplicateMeetings(allMeetings);
      console.log(`📦 Processing ${uniqueMeetings.length} unique meetings (removed ${allMeetings.length - uniqueMeetings.length} duplicates)`);

      // 4. Meeting → UnifiedSchedule 변환
      const schedulesToCreate = uniqueMeetings.map(meeting => {
        const project = projects.find(p => p.meetings?.some(m => m.id === meeting.id));
        if (!project) {
          console.warn(`⚠️ Project not found for meeting ${meeting.id}`);
          return null;
        }

        try {
          const schedule = dataConverter.meetingToSchedule(meeting, project);
          console.log(`✅ Converted meeting ${meeting.id} to schedule`);
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
          console.log(`ℹ️ Skipping sync for project ${(schedule as BuildupProjectMeeting).projectId} - already exists`);
          return false;
        }

        return true;
      });

      if (filteredSchedules.length === 0) {
        console.log('ℹ️ No new schedules to sync (all already exist)');
        scheduleContext.setSyncInProgress(false);
        return;
      }

      // 6. 배치 생성 실행
      console.log(`📦 Creating ${filteredSchedules.length} schedules in batch...`);

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

      console.log(`✅ Initial sync completed: ${createdSchedules.length} schedules created`);

      // 7. 통계 출력
      const stats = scheduleContext.getStatistics();
      console.log('📊 Sync Statistics:', {
        totalSchedules: scheduleContext.schedules.length,
        buildupMeetings: scheduleContext.buildupMeetings.length,
        newlyCreated: createdSchedules.length
      });

    } catch (error) {
      console.error('❌ Initial sync failed:', error);
      setError('초기 데이터 동기화에 실패했습니다.');
    } finally {
      // 8. 동기화 플래그 해제
      scheduleContext.setSyncInProgress(false);
    }
  }, [projects, scheduleContext]);

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
      console.log('📋 ScheduleContext ready, starting initial sync...');
      performInitialSync().then(() => {
        setInitialSyncCompleted(true);
        console.log('🎯 Initial sync completed, won\'t run again until page refresh');
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
          console.log('Empty projects array found, initializing sample projects');
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
      console.log('No saved projects found, initializing sample projects');
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
          current_phase: '개발 단계',
          next_milestone: {
            name: '1차 QA 테스트',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
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
          current_phase: '시장 분석',
          next_milestone: {
            name: '시장 분석 보고서 제출',
            due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          }
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
        console.log(`✅ 프로젝트 "${newProject.title}"이(가) 생성되었습니다.`);
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
    console.log(`✅ 프로젝트 "${newProject.title}"이(가) 생성되었습니다.`);

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
      console.log('📋 Phase Changed Event received:', event);

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
        reason: event.payload.reason,
        requestedBy: event.payload.changedBy,
        status: 'completed',
        timestamp: event.payload.changedAt,
        automatic: event.payload.automatic
      };

      setPhaseTransitionEvents(prev => [...prev, buildupEvent]);

      console.log(`✅ 프로젝트 ${event.payload.projectId} 단계가 ${event.payload.previousPhase}에서 ${event.payload.newPhase}로 전환되었습니다.`);
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
              project = {
                ...project,
                currentPhase: metadata.phaseTransition.toPhase
              };

              console.log('✅ Phase transition completed:', {
                projectId: metadata.projectId,
                fromPhase: project.phase,
                toPhase: metadata.phaseTransition.toPhase
              });
            }

            return project;
          });

          return updatedProjects;
        });

        // Still emit the event for other listeners
        if (metadata.phaseTransition) {
          const phaseChangeEvent = createEvent('PHASE_CHANGE_REQUEST', {
            projectId: metadata.projectId,
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
    console.log('🎧 Setting up BuildupContext event listener for: schedule:buildup_meeting_created');
    window.addEventListener('schedule:buildup_meeting_created', handleBuildupMeetingCreated as EventListener);

    console.log('🚀 New Phase Transition Module initialized with Schedule integration');

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
        console.log('📋 Meeting sequence from field:', schedule.meetingSequence);
        return schedule.meetingSequence;
      }

      // 2. Check metadata for sequence
      if (schedule.metadata?.meetingSequence) {
        console.log('📋 Meeting sequence from metadata:', schedule.metadata.meetingSequence);
        return schedule.metadata.meetingSequence;
      }

      // 3. Pattern matching from title
      const title = schedule.title?.toLowerCase() || '';

      if (title.includes('프리미팅') || title.includes('pre')) return 'pre_meeting';
      if (title.includes('킥오프') || title.includes('1차') || title.includes('guide 1')) return 'guide_1st';
      if (title.includes('2차') || title.includes('guide 2')) return 'guide_2nd';
      if (title.includes('3차') || title.includes('guide 3')) return 'guide_3rd';
      if (title.includes('4차') || title.includes('guide 4')) return 'guide_4th';

      console.log('⚠️ Could not identify meeting sequence from title:', title);
      return null;
    };

    // Execute phase transition
    const executePhaseTransition = (projectId: string, toPhase: string, trigger: string, metadata?: any) => {
      console.log('🔄 Executing phase transition:', { projectId, toPhase, trigger });

      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.error('Project not found:', projectId);
        return;
      }

      const fromPhase = project.phase;

      // Skip if already in target phase
      if (fromPhase === toPhase) {
        console.log('Already in phase:', toPhase);
        return;
      }

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

      console.log(`✅ Phase transition completed: ${fromPhase} → ${toPhase}`);
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
      console.log(`✅ [BuildupContext] Added meeting ${meeting.id} to project ${projectId}`);

      // 🔥 Sprint 3 Phase 1: Check for phase transition
      const meetingSequence = identifyMeetingSequence(schedule);
      if (meetingSequence) {
        const targetPhase = MEETING_SEQUENCE_TO_PHASE_MAP[meetingSequence];
        if (targetPhase) {
          // Find the project that was just updated
          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject && updatedProject.phase !== targetPhase) {
            console.log(`🚀 [Phase Transition] Triggering phase change for project ${projectId}: ${updatedProject.phase} → ${targetPhase}`);
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
      console.log(`✅ [BuildupContext] Updated meeting ${schedule.id} in project ${projectId}`);
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
      console.log(`✅ [BuildupContext] Removed meeting ${schedule.id} from project ${projectId}`);
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
    console.log('🎧 [BuildupContext] Registering schedule event listeners...');
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler);
      console.log(`  ✓ Registered: ${event}`);
    });

    // Cleanup
    return () => {
      console.log('🔌 [BuildupContext] Removing schedule event listeners...');
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler);
      });
    };
  }, []); // Empty dependency to run once

  // Stage C-3: Phase transition functions connected to new system
  const triggerPhaseTransition = async (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => {
    console.log('🔄 Triggering phase transition for project:', projectId);

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

      console.log('✅ Meeting completed event emitted successfully');
    } catch (error) {
      console.error('❌ Failed to trigger phase transition:', error);
    }
  };

  const handlePaymentCompleted = async (projectId: string, paymentData: any) => {
    console.log('💳 Handling payment completion for project:', projectId);

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

      console.log('✅ Payment-triggered phase change requested');
    } catch (error) {
      console.error('❌ Failed to handle payment completion:', error);
    }
  };

  const requestManualPhaseTransition = async (projectId: string, fromPhase: string, toPhase: string, requestedBy: string, reason: string) => {
    console.log('🔄 Requesting manual phase transition:', { projectId, fromPhase, toPhase, requestedBy, reason });

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

      console.log('✅ Manual phase transition completed:', newTransitionEvent);
    } catch (error) {
      console.error('❌ Failed to request manual phase transition:', error);
      throw error;
    }
  };

  // These approval functions are for future enhancement - currently auto-approve
  const approvePhaseTransition = (approvalRequestId: string, approvedBy: string): boolean => {
    console.log('✅ Phase transition approved:', { approvalRequestId, approvedBy });
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

    console.log(`✅ [BuildupContext] Meeting ${meeting.id} added to project ${projectId}`);
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

    console.log(`✅ [BuildupContext] Meeting ${meetingId} updated in project ${projectId}`);
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

    console.log(`✅ [BuildupContext] Meeting ${meetingId} removed from project ${projectId}`);
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

    console.log(`✅ [BuildupContext] Synced ${meetings.length} meetings for project ${projectId}`);
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

  // Development: Store context for testing
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // @ts-ignore
      if (window.testBuildupSync) {
        // @ts-ignore
        window.testBuildupSync._context = value;
        // @ts-ignore
        window.testBuildupSync.getContext = () => value;
      }

      // Step 5: Integration Testing Tools
      // @ts-ignore
      window.syncTest = {
        // 초기 동기화 재실행
        runInitialSync: () => {
          console.log('🧪 [Test] Running initial sync...');
          performInitialSync();
        },

        // 동기화 상태 확인
        getSyncStatus: () => {
          return {
            isInProgress: scheduleContext.isSyncInProgress(),
            scheduleCount: scheduleContext.schedules.length,
            buildupMeetingCount: scheduleContext.buildupMeetings.length,
            projectCount: projects.length,
            totalMeetings: projects.reduce((acc, p) => acc + (p.meetings?.length || 0), 0)
          };
        },

        // 프로젝트별 스케줄 확인
        checkProjectSchedules: (projectId: string) => {
          const hasSchedules = scheduleContext.hasSchedulesForProject(projectId);
          const projectSchedules = scheduleContext.getSchedulesByProject(projectId);
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

          projects.forEach(project => {
            const check = window.syncTest.checkProjectSchedules(project.id);
            // ✅ 올바른 검증: 프로젝트별 buildup_project 스케줄만 카운트
            const projectBuildupSchedules = scheduleContext.schedules.filter(s =>
              s.type === 'buildup_project' && s.projectId === project.id
            ).length;

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

          // ScheduleContext 클리어
          scheduleContext.clearAllSchedules();

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
      console.log('');
      console.log('🎉 Sprint 1 Step 5: Integration Testing Complete!');
      console.log('📋 Test Commands:');
      console.log('  • window.syncTest.getSyncStatus() - Check sync status');
      console.log('  • window.syncTest.validateSync() - Validate all projects');
      console.log('  • window.syncTest.runInitialSync() - Run sync again');
      console.log('  • window.syncTest.forcePurgeAndResync() - Clean and resync');
      console.log('');
      console.log('🚀 Sprint 3 Phase 1: Phase Transition Test Commands:');
      console.log('  • window.testBuildupSync.testPhaseTransition("PRJ-001", "guide_1st") - Test single phase transition');
      console.log('  • window.testBuildupSync.testAllPhaseTransitions("PRJ-001") - Test all phase transitions');
      console.log('');
      console.log('🎨 Sprint 3 Phase 2: UI Integration Test Commands:');
      console.log('  • window.testBuildupSync.testUIIntegration("PRJ-001") - Test UI updates with phase transitions');
      console.log('');
      console.log('🎭 Sprint 3 Phase 3: UI Feedback & Animation Test Commands:');
      console.log('  • window.testBuildupSync.testUIFeedback("PRJ-001") - Test UI feedback and animations');
      console.log('');
      console.log('📝 Available meeting types for phase transitions:');
      console.log('  • pre_meeting → contract_signed (계약 체결)');
      console.log('  • guide_1st → planning (기획)');
      console.log('  • guide_2nd → design (디자인)');
      console.log('  • guide_3rd → execution (실행)');
      console.log('  • guide_4th → review (검토)');
      console.log('');

      // 자동으로 초기 상태 검증 실행
      setTimeout(() => {
        console.log('🔍 Running automatic validation...');
        window.syncTest.validateSync();
      }, 2000);
    }
  }, [value]);

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
      console.log(`🔍 [TEST] Project ${projectId} meetings:`, meetings);
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
      console.log('📊 [TEST] Sync Status:');
      console.log('  - Active event trackers:', EventSourceTracker.getActiveCount());
      console.log('  - Test commands:');
      console.log('    window.testBuildupSync.createTestMeeting("PRJ-001")');
      console.log('    window.testBuildupSync.checkProjectMeetings("PRJ-001")');
      console.log('    window.testBuildupSync.runFullSyncTest()');
    },

    // Run full sync test
    runFullSyncTest: async (projectId: string = 'PRJ-001') => {
      console.log('🎬 [TEST] Starting full sync test...');

      // 1. Create a test meeting
      console.log('1️⃣ Creating test meeting...');
      const meetingId = window.testBuildupSync.createTestMeeting(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Check if it was added
      console.log('2️⃣ Checking if meeting was added...');
      window.testBuildupSync.checkProjectMeetings(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Update the meeting
      console.log('3️⃣ Updating test meeting...');
      window.testBuildupSync.updateTestMeeting(meetingId, projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Check if it was updated
      console.log('4️⃣ Checking if meeting was updated...');
      window.testBuildupSync.checkProjectMeetings(projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Delete the meeting
      console.log('5️⃣ Deleting test meeting...');
      window.testBuildupSync.deleteTestMeeting(meetingId, projectId);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 6. Check if it was removed
      console.log('6️⃣ Checking if meeting was removed...');
      window.testBuildupSync.checkProjectMeetings(projectId);

      console.log('✅ [TEST] Full sync test completed!');
    },

    // 🔥 Sprint 3 Phase 1: Test phase transition
    testPhaseTransition: async (projectId: string = 'PRJ-001', meetingType: string = 'guide_1st') => {
      console.log('🚀 [TEST] Testing phase transition...');
      console.log(`📌 Project: ${projectId}, Meeting Type: ${meetingType}`);

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

      console.log(`📊 Current Phase: ${project.phase} (${PHASE_LABELS[project.phase] || project.phase})`);

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

      console.log('📤 Dispatching schedule:created event with meeting sequence:', meetingType);
      window.dispatchEvent(testEvent);

      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if phase changed
      const updatedProject = buildupContext.projects.find((p: any) => p.id === projectId);
      if (updatedProject) {
        console.log(`📊 New Phase: ${updatedProject.phase} (${PHASE_LABELS[updatedProject.phase] || updatedProject.phase})`);

        const expectedPhase = MEETING_SEQUENCE_TO_PHASE_MAP[meetingType];
        if (expectedPhase && updatedProject.phase === expectedPhase) {
          console.log(`✅ Phase transition successful! ${project.phase} → ${updatedProject.phase}`);
        } else if (expectedPhase) {
          console.log(`⚠️ Phase transition expected ${expectedPhase}, but got ${updatedProject.phase}`);
        } else {
          console.log(`ℹ️ No phase transition expected for meeting type: ${meetingType}`);
        }
      }

      return updatedProject;
    },

    // Test all phase transitions
    testAllPhaseTransitions: async (projectId: string = 'PRJ-001') => {
      console.log('🔄 [TEST] Testing all phase transitions...');

      const transitions = [
        { type: 'pre_meeting', expectedPhase: 'contract_signed', label: '사전 미팅 → 계약 체결' },
        { type: 'guide_1st', expectedPhase: 'planning', label: '1차 가이드 → 기획 단계' },
        { type: 'guide_2nd', expectedPhase: 'design', label: '2차 가이드 → 디자인 단계' },
        { type: 'guide_3rd', expectedPhase: 'execution', label: '3차 가이드 → 실행 단계' },
        { type: 'guide_4th', expectedPhase: 'review', label: '4차 가이드 → 검토 단계' }
      ];

      for (const transition of transitions) {
        console.log(`\n🔹 Testing: ${transition.label}`);
        await window.testBuildupSync.testPhaseTransition(projectId, transition.type);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('\n✅ [TEST] All phase transition tests completed!');
    },

    // 🔥 Sprint 3 Phase 2: UI 업데이트 통합 테스트
    testUIIntegration: async (projectId: string = 'PRJ-001') => {
      console.log('🎨 [TEST] Testing Sprint 3 Phase 2: UI Integration...');

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

      console.log(`📊 현재 프로젝트 단계: ${project.phase} (${PHASE_LABELS[project.phase] || project.phase})`);

      // 2. 단계 전환 테스트 및 UI 업데이트 확인
      console.log('\n🔄 Testing phase transition with UI updates...');
      await window.testBuildupSync.testPhaseTransition(projectId, 'guide_1st');

      // 3. 업데이트된 프로젝트 확인
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedProject = buildupContext.projects.find((p: any) => p.id === projectId);
      console.log(`📊 업데이트된 단계: ${updatedProject?.phase} (${PHASE_LABELS[updatedProject?.phase] || updatedProject?.phase})`);

      // 4. UI 컴포넌트 검증 가이드
      console.log('\n🎯 UI 컴포넌트 검증 가이드:');
      console.log('  1. ProjectDetail: 7단계 진행바에서 현재 단계 강조 표시 확인');
      console.log('  2. BuildupCalendarV3: "단계 필터" 버튼 클릭하여 필터 UI 확인');
      console.log('  3. ServiceCatalog: "현재 단계" 추천 탭에서 단계별 서비스 확인');
      console.log('  4. 단계 전환 시 토스트 알림 표시 확인');

      console.log('\n✅ [TEST] Phase 2 UI Integration test completed!');
      console.log('🔔 Manual verification required for UI components');
    },

    // 🔥 Sprint 3 Phase 3: UI 피드백 및 애니메이션 테스트
    testUIFeedback: async (projectId: string = 'PRJ-001') => {
      console.log('🎭 [TEST] Testing Sprint 3 Phase 3: UI Feedback & Animations...');

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

      console.log(`📊 현재 프로젝트: ${project.title || projectId}`);
      console.log(`📊 현재 단계: ${project.phase} (${PHASE_LABELS[project.phase] || project.phase})`);

      // 1. 단계별 맞춤 토스트 메시지 테스트
      console.log('\n🎯 Testing customized toast messages...');
      const phases = ['design', 'execution', 'review'];

      for (const phase of phases) {
        console.log(`  ➤ Testing ${phase} phase transition...`);
        await window.testBuildupSync.testPhaseTransition(projectId, phase === 'design' ? 'guide_2nd' : phase === 'execution' ? 'guide_3rd' : 'guide_4th');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 토스트 표시 시간 대기
      }

      // 2. UI 피드백 검증 가이드
      console.log('\n🎨 UI 피드백 및 애니메이션 검증 가이드:');
      console.log('  1. 단계별 맞춤 토스트: 각 단계마다 고유한 이모지와 메시지 확인');
      console.log('     - 기획: 🎯, 디자인: 🎨, 실행: 🚀, 검토: ✅');
      console.log('  2. ProjectDetail 애니메이션:');
      console.log('     - 7단계 진행률 시스템 전체 확대/축소 효과');
      console.log('     - 현재 단계 텍스트 펄스 애니메이션 및 "새로 변경됨!" 표시');
      console.log('     - 진행바 그라데이션 및 펄스 효과');
      console.log('     - 현재 단계 점(dot) 바운스 애니메이션');
      console.log('  3. Phase History 탭:');
      console.log('     - 최근 변경사항 알림 카드 표시');
      console.log('     - 히스토리 컨테이너 링 효과');

      console.log('\n🎯 수동 검증 단계:');
      console.log('  1. ProjectDetail 페이지로 이동');
      console.log('  2. 단계 전환 테스트 실행 후 애니메이션 효과 확인');
      console.log('  3. "단계 이력" 탭에서 최근 변경사항 알림 확인');
      console.log('  4. 여러 단계 전환을 연속으로 실행하여 애니메이션 지속성 확인');

      console.log('\n✅ [TEST] Phase 3 UI Feedback test completed!');
      return true;
    },

    // Store context reference for testing
    getContext: () => null,
    setContext: (ctx: BuildupContextType) => {
      // @ts-ignore
      window.testBuildupSync._context = ctx;
    }
  };

  console.log('🧪 [BuildupContext] Test utilities loaded. Access via window.testBuildupSync');
  console.log('   Run window.testBuildupSync.checkSyncStatus() for available commands');
}