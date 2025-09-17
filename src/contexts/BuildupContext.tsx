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

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  BuildupService,
  CartItem,
  Project,
  AxisKey
} from '../types/buildup.types';
import {
  loadBuildupServices,
  calculateBundleDiscount
} from '../utils/buildupServiceLoader';
import { mockProjects } from '../data/mockProjects';
import {
  calculatePhaseProgress,
  PHASE_INFO,
  getNextPhase
} from '../utils/projectPhaseUtils';

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
}

const BuildupContext = createContext<BuildupContextType | undefined>(undefined);

export function BuildupProvider({ children }: { children: ReactNode }) {
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

  // Load services on mount
  useEffect(() => {
    loadServices();
    loadCartFromStorage();
    // Don't load projects from storage anymore, use initial state
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('buildup_cart', JSON.stringify(cart));
  }, [cart]);

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
        pm: {
          id: 'pm-auto',
          name: '담당 PM 배정 중',
          role: 'Project Manager',
          email: 'pm@pocket.com',
          company: '포켓컴퍼니'
        },
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
        pm: {
          id: 'pm-auto',
          name: '담당 PM 배정 중',
          role: 'Project Manager',
          email: 'pm@pocket.com',
          company: '포켓컴퍼니'
        },
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

  // Phase transition functions
  const triggerPhaseTransition = (projectId: string, meetingRecord: GuideMeetingRecord, pmId: string) => {
    PhaseTransitionService.handleMeetingCompleted(projectId, meetingRecord, pmId);
  };

  const handlePaymentCompleted = (projectId: string, paymentData: any) => {
    PhaseTransitionService.handlePaymentCompleted(projectId, paymentData);
  };

  const requestManualPhaseTransition = (projectId: string, fromPhase: string, toPhase: string, requestedBy: string, reason: string) => {
    PhaseTransitionService.requestTransition(projectId, fromPhase as any, toPhase as any, requestedBy, reason);
  };

  const approvePhaseTransition = (approvalRequestId: string, approvedBy: string): boolean => {
    return PhaseTransitionService.approve(approvalRequestId, approvedBy);
  };

  const rejectPhaseTransition = (approvalRequestId: string, rejectedBy: string, reason: string): boolean => {
    return PhaseTransitionService.reject(approvalRequestId, rejectedBy, reason);
  };

  const getPendingPhaseApprovals = (): PhaseTransitionApprovalRequest[] => {
    return PhaseTransitionService.getPendingApprovals();
  };

  const getPhaseTransitionHistory = (projectId?: string): PhaseTransitionEvent[] => {
    return PhaseTransitionService.getHistory(projectId);
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
    setSearchQuery
  };

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