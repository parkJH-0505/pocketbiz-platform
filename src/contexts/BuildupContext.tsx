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
  
  // Recommendations
  getRecommendedServices: (userAxis?: Record<AxisKey, number>) => BuildupService[];
  
  // Filters
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const BuildupContext = createContext<BuildupContextType | undefined>(undefined);

export function BuildupProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<BuildupService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isProjectsInitialized, setIsProjectsInitialized] = useState(false);
  
  // Initialize with default sample projects
  const getInitialProjects = (): Project[] => {
    return [
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
            agenda: '1. 개발 진행 현황\n2. 이슈 사항 논의\n3. 다음 주 계획'
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
            agenda: '1. 시장분석 결과 공유\n2. IR 덱 초안 검토\n3. 피드백 수렴'
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
    } catch (error) {
      console.error('Failed to load services:', error);
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
        subtotal: service.price_base
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
        let subtotal = item.service.price_base;
        
        if (updatedOptions.scope === 'premium') {
          subtotal = item.service.price_base * 1.5;
        } else if (updatedOptions.scope === 'custom') {
          subtotal = item.service.price_base * 2;
        }
        
        if (updatedOptions.rush_delivery) {
          subtotal = item.service.price_urgent;
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

  const createProject = (data: Partial<Project>) => {
    const newProject: Project = {
      id: `PRJ-${Date.now()}`,
      title: data.title || 'New Project',
      service_id: data.service_id || '',
      category: data.category || '컨설팅',
      status: 'preparing',
      created_from: data.created_from || 'manual',
      contract: data.contract || {
        id: `CNT-${Date.now()}`,
        value: 0,
        signed_date: new Date(),
        start_date: new Date(),
        end_date: new Date()
      },
      progress: {
        overall: 0,
        milestones_completed: 0,
        milestones_total: 0,
        deliverables_submitted: 0,
        deliverables_total: 0
      },
      timeline: {
        kickoff_date: new Date(),
        current_phase: 'Initiation',
        next_milestone: {
          name: 'Kickoff Meeting',
          due_date: new Date()
        }
      },
      workstreams: [],
      deliverables: [],
      team: {
        pm: {
          id: 'pm-1',
          name: 'PM',
          role: 'Project Manager',
          email: 'pm@pocket.com'
        },
        members: [],
        client_contact: {
          id: 'client-1',
          name: 'Client',
          role: 'Stakeholder',
          email: 'client@company.com'
        }
      },
      risks: [],
      meetings: [],
      files: [],
      communication: {
        unread_messages: 0,
        last_activity: new Date()
      },
      ...data
    };
    
    setProjects([...projects, newProject]);
    return newProject;
  };

  const updateProject = (projectId: string, data: Partial<Project>) => {
    setProjects(projects.map(project => 
      project.id === projectId ? { ...project, ...data } : project
    ));
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

  const activeProjects = projects.filter(p => 
    p.status === 'active' || p.status === 'preparing' || p.status === 'review'
  );
  
  const completedProjects = projects.filter(p => p.status === 'completed');

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const bundleDiscount = calculateBundleDiscount(cart.map(item => item.service));

  const value: BuildupContextType = {
    services,
    loadingServices,
    cart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    cartTotal,
    bundleDiscount,
    projects,
    activeProjects,
    completedProjects,
    createProject,
    updateProject,
    getRecommendedServices,
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