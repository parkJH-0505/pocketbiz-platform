export type ServiceCategory = '문서작업' | '개발' | '마케팅' | '투자' | '컨설팅';
export type ServiceProvider = '포켓' | '파트너사';
export type ServiceFormat = 'online' | 'offline' | 'hybrid';
export type ServiceStatus = 'active' | 'inactive' | 'coming_soon' | 'soldout';
export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';
export type StageType = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

// Enhanced BuildupService structure
export interface BuildupService {
  service_id: string;
  category: string;
  subcategory?: string;
  name: string;
  subtitle: string;
  description: string;
  badge?: 'HOT' | '신규' | '할인' | '추천';
  tags: string[];
  
  // Pricing
  price: {
    original: number;
    discounted?: number;
    unit: '프로젝트' | '월' | '회';
    discount_rate?: number;
  };
  
  // Duration
  duration: {
    weeks: number;
    display: string;
    urgent_available: boolean;
    urgent_days?: number;
  };
  
  // Provider
  provider: {
    name: string;
    type: ServiceProvider;
    certification?: string[];
    experience?: string;
    success_rate?: number;
  };
  
  // Target
  target: {
    stage: string[];
    industry?: string[];
    employee_count?: string;
  };
  
  // Benefits
  benefits: {
    target_areas: string[];
    expected_outcome: string;
    kpi_improvement: {
      GO: number;
      EC: number;
      PT: number;
      PF: number;
      TO: number;
    };
  };
  
  // Deliverables
  deliverables: {
    main: string[];
    additional?: string[];
    format?: string[];
  };
  
  // Process
  process: {
    steps: ProcessStep[];
    total_steps: number;
    methodology: '워터폴' | '애자일' | '하이브리드';
  };
  
  // Portfolio
  portfolio: {
    total_count: number;
    highlights: PortfolioHighlight[];
    success_stories?: number;
  };
  
  // Reviews
  reviews: {
    avg_rating: number;
    total_count: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
    recent_reviews: ReviewItem[];
  };
  
  // FAQ
  faq: FAQItem[];
  
  // Options
  options: {
    scope_levels: ScopeLevel[];
    addons?: AddonOption[];
  };
  
  // Bundle
  bundle?: {
    recommended_with: string[];
    bundle_discount: number;
    package_name: string;
  };
  
  // Metadata
  metadata: {
    created_date: string;
    updated_date: string;
    view_count: number;
    purchase_count: number;
    wishlist_count: number;
    completion_rate: number;
    avg_completion_days: number;
    satisfaction_rate: number;
    repeat_rate: number;
  };
  
  // Search & Display
  search_keywords: string[];
  is_active: boolean;
  is_featured: boolean;
  priority: number;
  
  // Media
  media: {
    thumbnail?: string;
    images?: string[];
    video_url?: string;
    brochure_url?: string;
  };
}

export interface ProcessStep {
  order: number;
  name: string;
  duration: string;
  description: string;
  deliverable: string;
}

export interface PortfolioHighlight {
  project_id: string;
  client_type: string;
  industry: string;
  outcome: string;
  date: string;
  testimonial?: string;
}

export interface ReviewItem {
  review_id: string;
  client_name: string;
  company: string;
  rating: number;
  date: string;
  content: string;
  verified: boolean;
  helpful_count?: number;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export interface ScopeLevel {
  name: string;
  price_multiplier: number;
  features: string[];
}

export interface AddonOption {
  name: string;
  price: number;
  description: string;
}

// Legacy interface for backward compatibility
// 구버전 타입 정의 - 현재 사용하지 않지만 호환성을 위해 유지
// TODO: 마이그레이션 완료 후 삭제 예정
export interface BuildupServiceLegacy {
  service_id: string;
  category: ServiceCategory;
  name: string;
  subtitle: string;
  description: string;
  target_axis: string[];
  expected_improvement: number;
  target_stage: string[];
  duration_weeks: number;
  price_base: number;
  price_urgent: number;
  price_package: number;
  provider: ServiceProvider;
  format: ServiceFormat;
  deliverables: string[];
  process_steps: ProcessStep[];
  portfolio_count: number;
  avg_rating: number;
  review_count: number;
  completion_rate: number;
  status: ServiceStatus;
}

// Service Detail Modal Types
export interface ServiceDetailModal {
  service: BuildupService;
  tabs: {
    overview: ServiceOverview;
    process: ServiceProcess;
    portfolio: ServicePortfolio;
    reviews: ServiceReviews;
    faq: ServiceFAQ;
  };
}

export interface ServiceOverview {
  introduction: string;
  target_customers: string[];
  key_features: string[];
  expected_outcomes: {
    kpi_improvement: {
      axis: AxisKey;
      current?: number;
      expected: number;
      confidence: number;
    }[];
    business_impact: string[];
    roi_expectation: string;
  };
  prerequisites: string[];
  limitations: string[];
}

export interface ServiceProcess {
  total_duration: string;
  steps: {
    step_number: number;
    title: string;
    duration: string;
    description: string;
    deliverables: string[];
    client_involvement: string;
  }[];
  timeline_visual: 'gantt' | 'flowchart' | 'milestone';
  dependencies: string[];
}

export interface ServicePortfolio {
  success_cases: {
    company_name: string;
    project_type: string;
    result: string;
    completion_date: string;
    testimonial?: string;
  }[];
  sample_deliverables: {
    title: string;
    type: 'document' | 'design' | 'code' | 'report';
    preview_url?: string;
    description: string;
  }[];
  performance_metrics: {
    total_projects: number;
    success_rate: number;
    avg_improvement: number;
    client_satisfaction: number;
  };
}

export interface ServiceReviews {
  overall_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  rating_aspects: {
    professionalism: number;
    communication: number;
    timeliness: number;
    quality: number;
    value_for_money: number;
  };
  reviews: {
    reviewer_name: string;
    reviewer_company: string;
    rating: number;
    date: string;
    title: string;
    content: string;
    helpful_count: number;
  }[];
}

export interface ServiceFAQ {
  categories: {
    category_name: string;
    questions: {
      question: string;
      answer: string;
      related_questions?: string[];
    }[];
  }[];
}

export interface CartItem {
  service: BuildupService;
  quantity: number;
  options: {
    scope: 'basic' | 'premium' | 'custom';
    rush_delivery: boolean;
    add_ons: string[];
  };
  subtotal: number;
}

// 프로젝트 상태 - 7단계 체계
export type ProjectPhase =
  | 'contract_pending'  // 계약중 (견적서 전달)
  | 'contract_signed'   // 계약완료 (입금완료)
  | 'planning'          // 진행중-기획
  | 'design'            // 진행중-설계
  | 'execution'         // 진행중-실행
  | 'review'            // 진행중-검토
  | 'completed';        // 종료(완료)

export interface Project {
  id: string;
  title: string;
  service_id: string;
  category: ServiceCategory;
  status: 'preparing' | 'active' | 'review' | 'completed' | 'hold';
  phase?: ProjectPhase;  // 7단계 진행 상태
  created_from: 'nba' | 'catalog' | 'manual' | 'drag_drop';
  contract: {
    id: string;
    value: number;
    signed_date: Date;
    start_date: Date;
    end_date: Date;
  };
  // 진행 상태는 phase 필드로 관리
  // progress 필드는 레거시 호환용으로만 유지
  progress?: {
    overall?: number;
    milestones_completed?: number;
    milestones_total?: number;
    deliverables_submitted?: number;
    deliverables_total?: number;
  };
  timeline: {
    kickoff_date: Date;
    phase_updated_at?: Date;  // 단계 업데이트 시간
    phase_updated_by?: string; // 단계 업데이트한 PM
    start_date: Date;
    end_date: Date;
    completion_date?: Date;
  };
  workstreams: Workstream[];
  deliverables: Deliverable[];
  team: {
    pm: TeamMember;
    members: TeamMember[];
    client_contact: TeamMember;
  };
  risks: Risk[];
  meetings: Meeting[];
  files: ProjectFile[];
  communication: {
    unread_messages: number;
    last_activity: Date;
  };
  kpi_impact?: {
    baseline: Record<AxisKey, number>;
    current?: Record<AxisKey, number>;
    target: Record<AxisKey, number>;
  };
}

export interface Workstream {
  id: string;
  name: string;
  status: 'backlog' | 'in_progress' | 'review' | 'completed';
  owner: TeamMember;
  tasks: Task[];
  progress: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done';
  assignee?: TeamMember;
  due_date?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dependencies?: string[];
  comments?: Comment[];
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  due_date: Date;
  submitted_date?: Date;
  approved_date?: Date;
  version: number;
  files: ProjectFile[];
  feedback?: Feedback[];
  approval?: {
    approved_by: TeamMember;
    approved_at: Date;
    signature?: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  company?: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  status: 'identified' | 'mitigating' | 'resolved' | 'escalated';
  mitigation_plan?: string;
  owner: TeamMember;
  identified_date: Date;
  resolved_date?: Date;
}

export interface Meeting {
  id: string;
  title: string;
  type: 'kickoff' | 'progress' | 'review' | 'closing' | 'demo';
  date: Date;
  duration: number;
  attendees: TeamMember[] | string[]; // CRM 연동 시 string 배열도 허용
  agenda?: string;
  minutes?: string;
  recording_url?: string;
  action_items?: ActionItem[];
  location?: string; // 회의 장소 (Zoom, Google Meet, 오프라인 등)
  meeting_link?: string; // 온라인 미팅 링크
  crm_id?: string; // CRM 시스템 연동용 ID
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: TeamMember;
  due_date: Date;
  status: 'pending' | 'completed';
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_by: TeamMember;
  uploaded_at: Date;
  version?: number;
  category?: 'document' | 'design' | 'code' | 'report' | 'other';
}

export interface Comment {
  id: string;
  content: string;
  author: TeamMember;
  created_at: Date;
  edited_at?: Date;
  replies?: Comment[];
  mentions?: TeamMember[];
}

export interface Feedback {
  id: string;
  content: string;
  type: 'comment' | 'revision' | 'approval';
  author: TeamMember;
  created_at: Date;
  resolved?: boolean;
  resolved_at?: Date;
}

export interface BuildupDashboard {
  quick_actions: {
    drag_drop_zone: boolean;
    recent_nba: any[];
    quick_templates: string[];
  };
  active_projects: {
    total: number;
    this_week: number;
    overdue: number;
    near_deadline: number;
    projects: Project[];
  };
  today_actions: {
    meetings: Meeting[];
    deliverables: Deliverable[];
    alerts: {
      type: 'deadline' | 'feedback' | 'change' | 'risk';
      message: string;
      action: string;
      project_id: string;
    }[];
  };
  stats: {
    total_projects: number;
    completion_rate: number;
    avg_improvement: number;
    total_investment: number;
  };
}