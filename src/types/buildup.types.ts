export type ServiceCategory = '문서작업' | '개발' | '마케팅' | '투자' | '컨설팅';
export type ServiceProvider = '포켓' | '파트너사';
export type ServiceFormat = 'online' | 'offline' | 'hybrid';
export type ServiceStatus = 'active' | 'inactive' | 'coming_soon';
export type AxisKey = 'GO' | 'EC' | 'PT' | 'PF' | 'TO';
export type StageType = 'A1' | 'A2' | 'A3' | 'A4' | 'A5';

export interface BuildupService {
  service_id: string;
  category: ServiceCategory;
  name: string;
  subtitle: string;
  description: string;
  target_axis: AxisKey[];
  expected_improvement: number;
  target_stage: StageType[];
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

export interface ProcessStep {
  name: string;
  duration: string;
  description?: string;
}

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

export interface Project {
  id: string;
  title: string;
  service_id: string;
  category: ServiceCategory;
  status: 'preparing' | 'active' | 'review' | 'completed' | 'hold';
  created_from: 'nba' | 'catalog' | 'manual' | 'drag_drop';
  contract: {
    id: string;
    value: number;
    signed_date: Date;
    start_date: Date;
    end_date: Date;
  };
  progress: {
    overall: number;
    milestones_completed: number;
    milestones_total: number;
    deliverables_submitted: number;
    deliverables_total: number;
  };
  timeline: {
    kickoff_date: Date;
    current_phase: string;
    next_milestone: {
      name: string;
      due_date: Date;
    };
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
  type: 'kickoff' | 'progress' | 'review' | 'closing';
  date: Date;
  duration: number;
  attendees: TeamMember[];
  agenda?: string;
  minutes?: string;
  recording_url?: string;
  action_items?: ActionItem[];
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