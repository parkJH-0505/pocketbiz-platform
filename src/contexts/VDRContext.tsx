import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBuildupContext } from './BuildupContext';
import { useKPIDiagnosis } from './KPIDiagnosisContext';
import { useCurrentUser } from './CurrentUserContext';
import JSZip from 'jszip';

export interface VDRDocument {
  id: string;
  name: string;
  path: string;
  size: number;
  uploadDate: Date;
  lastModified: Date;
  category: 'buildup_deliverable' | 'kpi_report' | 'vdr_upload' | 'contract' | 'ir_deck' | 'business_plan' | 'financial' | 'marketing';
  source: 'buildup' | 'kpi' | 'manual' | 'dataroom' | 'buildup_deliverable' | 'kpi_diagnosis';
  projectId?: string;
  projectName?: string;
  visibility: 'private' | 'team' | 'investors' | 'public';
  isRepresentative?: boolean;
  representativeType?: RepresentativeDoc['type']; // 어떤 대표 문서 타입으로 지정되었는지
  sharedSessions?: SharedSession[];
  tags?: string[];
  description?: string;

  // 추가 속성들 (실제 CRM 시스템 기반)
  version?: string;                    // 파일 버전 (v1.0, v2.1 등)
  uploadedBy?: string;                // 업로더 이름
  uploadedById?: string;              // 업로더 ID
  downloadCount?: number;             // 다운로드 횟수
  viewCount?: number;                 // 조회 횟수
  lastAccessDate?: Date;              // 마지막 접근 일시
  isFavorite?: boolean;               // 즐겨찾기 여부
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // 승인 상태
  approvedBy?: string;                // 승인자
  approvedAt?: Date;                  // 승인 일시
  fileType?: string;                  // 파일 확장자 (.pdf, .docx 등)
  mimeType?: string;                  // MIME 타입
  thumbnail?: string;                 // 썸네일 이미지 URL
  hasPreview?: boolean;               // 미리보기 지원 여부
  checksum?: string;                  // 파일 무결성 체크
  linkedDocuments?: string[];         // 연관 문서 ID들
  customFields?: Record<string, any>; // 커스텀 필드들
}

export interface SharedSession {
  id: string;
  name: string;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
  link: string;
  documentIds: string[];
  accessLog?: AccessLog[];
}

interface AccessLog {
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// 강화된 접근 로그 인터페이스
export interface EnhancedAccessLog {
  id: string;
  timestamp: Date;
  sessionId?: string;        // 공유 세션 ID (세션을 통한 접근인 경우)
  documentId: string;        // 접근한 문서 ID
  action: 'view' | 'download' | 'share' | 'upload' | 'delete'; // 수행한 액션
  userInfo: {
    userId?: string;         // 인증된 사용자 ID
    userName?: string;       // 사용자 이름
    userRole?: string;       // 사용자 역할
    ipAddress?: string;      // IP 주소
    userAgent?: string;      // 브라우저 정보
    location?: string;       // 지역 정보 (선택적)
    isAnonymous: boolean;    // 익명 접근 여부
  };
  details: {
    documentName: string;    // 문서명
    documentCategory: VDRDocument['category']; // 문서 카테고리
    fileSize?: number;       // 파일 크기 (다운로드시)
    duration?: number;       // 조회 시간 (초)
    referrer?: string;       // 이전 페이지
    success: boolean;        // 작업 성공 여부
    errorMessage?: string;   // 에러 메시지 (실패시)
  };
  metadata?: {
    browserVersion?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    sessionDuration?: number;
    downloadSpeed?: number;  // 다운로드 속도 (KB/s)
  };
}

// 📧 Docsend 기능을 위한 고급 인터페이스들
export interface EmailInvite {
  id: string;
  email: string;
  accessToken: string;        // 개별 접근 토큰
  expiresAt: Date;
  viewCount: number;
  lastViewed?: Date;
  invitedAt: Date;
  invitedBy: string;
  status: 'pending' | 'viewed' | 'expired';
  emailSentAt?: Date;
  remindersSent: number;
  lastReminderAt?: Date;
  viewerName?: string;        // 뷰어가 입력한 이름
  viewerCompany?: string;     // 뷰어가 입력한 회사명
}

// 📊 페이지별 상세 추적
export interface PageView {
  id: string;
  pageNumber: number;
  timeSpent: number;          // 초 단위
  timestamp: Date;
  sessionId?: string;
  inviteId?: string;
  userAgent?: string;
  scrollDepth?: number;       // 스크롤 깊이 (%)
  zoomLevel?: number;         // 확대 비율
  interactions: {
    clicks: number;
    scrolls: number;
    downloads: number;
  };
}

// 🚀 고급 공유 세션 (기존 SharedSession 확장)
export interface DocsendSession extends SharedSession {
  // 이메일 초대 관련
  emailInvites: EmailInvite[];
  requireEmailAuth: boolean;   // 이메일 인증 필수 여부

  // 보안 설정
  downloadBlocked: boolean;    // 다운로드 차단
  watermarkEnabled: boolean;   // 워터마크 표시
  watermarkText?: string;      // 워터마크 텍스트

  // NDA 관련
  requireNDA: boolean;         // NDA 서명 필수
  ndaTemplateId?: string;      // 사용할 NDA 템플릿

  // 고급 추적
  pageViews: PageView[];       // 페이지별 상세 추적
  analytics: {
    totalViews: number;
    uniqueViewers: number;
    averageViewTime: number;   // 평균 조회 시간
    completionRate: number;    // 완독률
    topPages: number[];        // 가장 오래 본 페이지들
    bounceRate: number;        // 이탈률
  };

  // 기한 및 제한
  viewLimit?: number;          // 조회 횟수 제한
  ipRestrictions?: string[];   // IP 제한

  // 브랜딩
  customBranding?: {
    logoUrl?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

// 📋 NDA 관련 인터페이스
export interface NDATemplate {
  id: string;
  name: string;
  content: string;             // HTML 형태의 NDA 내용
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
  variables: string[];         // 템플릿 변수들 ({{company_name}} 등)
}

export interface NDASignature {
  id: string;
  ndaTemplateId: string;
  sessionId: string;
  signerEmail: string;
  signerName: string;
  signerCompany?: string;
  signedAt: Date;
  ipAddress?: string;
  signatureData: string;       // 전자서명 데이터
  status: 'signed' | 'expired' | 'revoked';
  documentHash: string;        // 서명된 문서의 해시
}

export interface RepresentativeDoc {
  type: 'ir_deck' | 'business_plan' | 'financial' | 'marketing';
  label: string;
  documentId?: string;
  profileVisibility?: VDRDocument['visibility']; // 프로필에서의 공개 범위
}

// 🎯 투자자 관리 시스템 인터페이스들
export interface InvestorLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  role: 'vc' | 'angel' | 'pe' | 'advisor' | 'accelerator' | 'family_office' | 'corporate_vc';
  source: 'profile_view' | 'nda_request' | 'manual_add' | 'referral' | 'event';
  firstContact: Date;
  lastActivity: Date;
  status: 'cold' | 'warm' | 'hot' | 'engaged' | 'passed' | 'invested';
  tags: string[];
  notes: string;
  profileViews: ProfileView[];
  contactHistory: ContactRecord[];

  // 투자자 상세 정보
  fundName?: string;
  fundSize?: string;
  investmentStage?: string[];
  sectors?: string[];
  checkSize?: string;
  website?: string;
  linkedinUrl?: string;

  // 관심도 점수 (0-100)
  interestScore: number;

  // 프로필 조회 요약
  totalProfileViews: number;
  lastProfileView?: Date;
  mostViewedSections: string[];
}

export interface NDARequest {
  id: string;
  leadId: string;
  requesterInfo: {
    name: string;
    email: string;
    company: string;
    role?: string;
    phone?: string;
  };
  requestedDocuments: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestDate: Date;
  responseDate?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;

  // 승인 후 접근 권한
  accessExpiresAt?: Date;
  downloadAllowed: boolean;

  // 자동 승인 조건
  autoApprovalRules?: {
    emailDomains?: string[];
    companies?: string[];
    minimumFollowupDays?: number;
  };
}

export interface ProfileView {
  id: string;
  timestamp: Date;
  leadId?: string;
  sections: string[];
  duration: number; // 초 단위
  source: string;

  // 상세 추적 정보
  timePerSection: Record<string, number>;
  scrollDepth: Record<string, number>;
  interactions: {
    clicks: number;
    downloads: number;
    shares: number;
  };

  // 기술적 정보
  ipAddress?: string;
  userAgent?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  location?: string;
}

export interface ContactRecord {
  id: string;
  leadId: string;
  type: 'email' | 'call' | 'meeting' | 'message' | 'event';
  date: Date;
  subject: string;
  content?: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  nextAction?: {
    type: 'follow_up' | 'send_documents' | 'schedule_meeting' | 'none';
    dueDate?: Date;
    description?: string;
  };

  // 미팅 관련 (type이 'meeting'인 경우)
  meetingDetails?: {
    duration: number;
    attendees: string[];
    location?: string;
    meetingType: 'pitch' | 'due_diligence' | 'term_discussion' | 'other';
  };

  createdBy: string;
  updatedAt: Date;
}

// 투자자 관리 통계
export interface InvestorAnalytics {
  totalLeads: number;
  leadsByStatus: Record<InvestorLead['status'], number>;
  leadsBySource: Record<InvestorLead['source'], number>;
  leadsByRole: Record<InvestorLead['role'], number>;

  profileViewStats: {
    totalViews: number;
    uniqueViewers: number;
    averageViewTime: number;
    popularSections: Array<{
      section: string;
      viewCount: number;
      averageTime: number;
    }>;
    viewsOverTime: Array<{
      date: string;
      views: number;
      uniqueViewers: number;
    }>;
  };

  ndaRequestStats: {
    totalRequests: number;
    pendingRequests: number;
    approvalRate: number;
    averageResponseTime: number; // 시간 단위
    requestsByMonth: Array<{
      month: string;
      requests: number;
      approvals: number;
    }>;
  };

  engagementMetrics: {
    averageInterestScore: number;
    hotLeads: number;
    activeConversations: number;
    nextActionsToday: number;
  };
}

interface VDRContextType {
  documents: VDRDocument[];
  sharedSessions: SharedSession[];
  representativeDocs: RepresentativeDoc[];
  accessLogs: EnhancedAccessLog[];
  aggregateDocuments: () => Promise<void>;
  uploadDocument: (file: File, category: VDRDocument['category']) => Promise<void>;
  updateDocumentVisibility: (docId: string, visibility: VDRDocument['visibility']) => void;
  setRepresentativeDocument: (type: RepresentativeDoc['type'], docId: string | null) => void;
  createShareSession: (name: string, documentIds: string[], expiresAt?: Date) => Promise<string>;
  getShareSession: (sessionId: string) => SharedSession | undefined;
  deleteDocument: (docId: string) => Promise<void>;
  searchDocuments: (query: string) => VDRDocument[];
  getDocumentsByCategory: (category: VDRDocument['category']) => VDRDocument[];
  downloadDocument: (docId: string) => Promise<void>;
  downloadMultipleDocuments: (docIds: string[]) => Promise<void>;
  viewDocument: (docId: string) => void;
  getRepresentativeDocumentsForProfile: (userType: 'public' | 'team' | 'investors') => VDRDocument[];
  updateRepresentativeDocumentVisibility: (type: RepresentativeDoc['type'], visibility: VDRDocument['visibility']) => void;

  // 접근 로그 관련 함수들
  getAccessLogs: (filter?: AccessLogFilter) => EnhancedAccessLog[];
  clearAccessLogs: (documentId?: string) => void;
  exportAccessLogs: (format: 'csv' | 'json') => void;
  getAccessStatistics: () => AccessStatistics;

  // 🚀 Docsend 고급 기능들
  docsendSessions: DocsendSession[];
  ndaTemplates: NDATemplate[];
  ndaSignatures: NDASignature[];

  // 이메일 초대 관련
  createEmailInvite: (sessionId: string, email: string, expiresAt?: Date) => Promise<EmailInvite>;
  sendEmailInvitation: (inviteId: string) => Promise<void>;
  sendReminder: (inviteId: string) => Promise<void>;
  verifyEmailToken: (token: string) => Promise<EmailInvite | null>;

  // 고급 세션 관리
  createDocsendSession: (
    name: string,
    documentIds: string[],
    options: {
      requireEmailAuth?: boolean;
      downloadBlocked?: boolean;
      watermarkEnabled?: boolean;
      requireNDA?: boolean;
      viewLimit?: number;
      expiresAt?: Date;
    }
  ) => Promise<DocsendSession>;
  updateSessionSettings: (sessionId: string, settings: Partial<DocsendSession>) => Promise<void>;

  // 페이지 추적
  trackPageView: (sessionId: string, pageNumber: number, timeSpent: number) => void;
  getSessionAnalytics: (sessionId: string) => DocsendSession['analytics'];

  // NDA 관리
  createNDATemplate: (name: string, content: string, variables: string[]) => Promise<NDATemplate>;
  updateNDATemplate: (templateId: string, updates: Partial<NDATemplate>) => Promise<void>;
  deleteNDATemplate: (templateId: string) => Promise<void>;
  signNDA: (sessionId: string, signerInfo: {
    email: string;
    name: string;
    company?: string;
    signatureData: string;
  }) => Promise<NDASignature>;

  // 🎯 투자자 관리 시스템
  investorLeads: InvestorLead[];
  ndaRequests: NDARequest[];

  // 투자자 리드 관리
  createInvestorLead: (leadData: Omit<InvestorLead, 'id' | 'firstContact' | 'lastActivity'>) => Promise<InvestorLead>;
  updateInvestorLead: (leadId: string, updates: Partial<InvestorLead>) => Promise<void>;
  deleteInvestorLead: (leadId: string) => Promise<void>;
  getInvestorLead: (leadId: string) => InvestorLead | undefined;
  searchInvestorLeads: (query: string) => InvestorLead[];
  updateLeadStatus: (leadId: string, status: InvestorLead['status']) => Promise<void>;
  updateInterestScore: (leadId: string, score: number) => Promise<void>;

  // 프로필 조회 추적
  trackProfileView: (leadId: string | undefined, sections: string[], duration: number, source: string) => Promise<void>;
  getProfileViewsForLead: (leadId: string) => ProfileView[];
  getProfileViewStatistics: () => InvestorAnalytics['profileViewStats'];

  // NDA 요청 관리
  createNDARequest: (requestData: Omit<NDARequest, 'id' | 'requestDate'>) => Promise<NDARequest>;
  updateNDARequestStatus: (requestId: string, status: NDARequest['status'], notes?: string) => Promise<void>;
  approveNDARequest: (requestId: string, approvedBy: string, accessExpiresAt?: Date) => Promise<void>;
  rejectNDARequest: (requestId: string, rejectionReason: string, approvedBy: string) => Promise<void>;
  getNDARequestsForLead: (leadId: string) => NDARequest[];

  // 연락 이력 관리
  addContactRecord: (contactData: Omit<ContactRecord, 'id' | 'updatedAt'>) => Promise<ContactRecord>;
  updateContactRecord: (contactId: string, updates: Partial<ContactRecord>) => Promise<void>;
  deleteContactRecord: (contactId: string) => Promise<void>;
  getContactHistoryForLead: (leadId: string) => ContactRecord[];

  // 투자자 분석
  getInvestorAnalytics: () => InvestorAnalytics;
  getLeadsByStatus: (status: InvestorLead['status']) => InvestorLead[];
  getLeadsBySource: (source: InvestorLead['source']) => InvestorLead[];
  getHotLeads: () => InvestorLead[];
  getUpcomingActions: () => ContactRecord[];

  loading: boolean;
}

// 접근 로그 필터 인터페이스
export interface AccessLogFilter {
  startDate?: Date;
  endDate?: Date;
  documentId?: string;
  sessionId?: string;
  action?: EnhancedAccessLog['action'];
  userId?: string;
  isAnonymous?: boolean;
}

// 접근 통계 인터페이스
export interface AccessStatistics {
  totalAccess: number;
  uniqueUsers: number;
  topDocuments: Array<{
    documentId: string;
    documentName: string;
    accessCount: number;
  }>;
  actionBreakdown: Record<EnhancedAccessLog['action'], number>;
  dailyStats: Array<{
    date: string;
    accessCount: number;
    uniqueUsers: number;
  }>;
  deviceBreakdown: Record<string, number>;
}

const VDRContext = createContext<VDRContextType | undefined>(undefined);

export const useVDRContext = () => {
  const context = useContext(VDRContext);
  if (!context) {
    throw new Error('useVDRContext must be used within VDRProvider');
  }
  return context;
};

export const VDRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<VDRDocument[]>([]);
  const [sharedSessions, setSharedSessions] = useState<SharedSession[]>([]);
  const [accessLogs, setAccessLogs] = useState<EnhancedAccessLog[]>([]);
  const [loading, setLoading] = useState(false);

  // 🚀 Docsend 관련 state들
  const [docsendSessions, setDocsendSessions] = useState<DocsendSession[]>([]);
  const [ndaTemplates, setNdaTemplates] = useState<NDATemplate[]>([]);
  const [ndaSignatures, setNdaSignatures] = useState<NDASignature[]>([]);

  // 🎯 투자자 관리 관련 state들
  const [investorLeads, setInvestorLeads] = useState<InvestorLead[]>([]);
  const [ndaRequests, setNDARequests] = useState<NDARequest[]>([]);
  const [profileViews, setProfileViews] = useState<ProfileView[]>([]);
  const [contactRecords, setContactRecords] = useState<ContactRecord[]>([]);
  const { projects } = useBuildupContext();
  const { savedAssessments } = useKPIDiagnosis();
  const { currentUser } = useCurrentUser();

  const representativeDocs: RepresentativeDoc[] = [
    { type: 'ir_deck', label: 'IR Deck', profileVisibility: 'investors' },
    { type: 'business_plan', label: '사업계획서', profileVisibility: 'team' },
    { type: 'financial', label: '재무제표', profileVisibility: 'team' },
    { type: 'marketing', label: '마케팅 지표', profileVisibility: 'public' }
  ];

  // 접근 로그 로컬 스토리지 키
  const ACCESS_LOGS_KEY = 'vdr_access_logs';

  // 접근 로그 초기화 (localStorage에서 로드)
  useEffect(() => {
    const savedLogs = localStorage.getItem(ACCESS_LOGS_KEY);
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        setAccessLogs(parsedLogs);
      } catch (error) {
        console.error('[VDR] Failed to load access logs:', error);
      }
    }
  }, []);

  // 🎯 투자자 관리 더미 데이터 초기화
  useEffect(() => {
    // 더미 투자자 리드 데이터
    const dummyLeads: InvestorLead[] = [
      {
        id: 'lead-1',
        name: '김민수',
        company: 'BlueLake Partners',
        email: 'minsu.kim@bluelake.vc',
        phone: '+82-10-1234-5678',
        role: 'vc',
        source: 'profile_view',
        firstContact: new Date('2024-01-15'),
        lastActivity: new Date('2024-09-18'),
        status: 'hot',
        tags: ['Early Stage', 'B2B SaaS', 'Korea'],
        notes: 'Series A 펀드 운용중. B2B SaaS에 특화된 투자자. 최근 우리 프로필을 여러 번 조회함.',
        profileViews: [],
        contactHistory: [],
        fundName: 'BlueLake Fund III',
        fundSize: '500억원',
        investmentStage: ['Series A', 'Series B'],
        sectors: ['B2B SaaS', 'Fintech', 'E-commerce'],
        checkSize: '10-50억원',
        website: 'https://bluelake.vc',
        linkedinUrl: 'https://linkedin.com/in/minsu-kim',
        interestScore: 92,
        totalProfileViews: 8,
        lastProfileView: new Date('2024-09-17'),
        mostViewedSections: ['financial', 'team', 'business_plan']
      },
      {
        id: 'lead-2',
        name: '박지혜',
        company: 'Spark Ventures',
        email: 'jihye.park@spark.ventures',
        phone: '+82-10-2345-6789',
        role: 'angel',
        source: 'nda_request',
        firstContact: new Date('2024-02-10'),
        lastActivity: new Date('2024-09-16'),
        status: 'engaged',
        tags: ['Angel Investor', 'Female Founder', 'Sustainability'],
        notes: '지속가능한 비즈니스 모델에 관심이 많음. NDA 요청 후 지속적인 소통 중.',
        profileViews: [],
        contactHistory: [],
        fundName: 'Personal Investment',
        investmentStage: ['Pre-Seed', 'Seed'],
        sectors: ['CleanTech', 'ESG', 'Impact'],
        checkSize: '1-10억원',
        linkedinUrl: 'https://linkedin.com/in/jihye-park',
        interestScore: 78,
        totalProfileViews: 5,
        lastProfileView: new Date('2024-09-15'),
        mostViewedSections: ['business_plan', 'esg', 'team']
      },
      {
        id: 'lead-3',
        name: 'David Chen',
        company: 'Global Tech Capital',
        email: 'david.chen@globaltech.capital',
        role: 'vc',
        source: 'referral',
        firstContact: new Date('2024-03-05'),
        lastActivity: new Date('2024-09-12'),
        status: 'warm',
        tags: ['Global', 'Series A', 'Cross-border'],
        notes: '싱가포르 기반 글로벌 VC. 아시아 시장 진출에 관심. 추천을 통해 연결됨.',
        profileViews: [],
        contactHistory: [],
        fundName: 'GTC Asia Fund II',
        fundSize: '$200M',
        investmentStage: ['Series A', 'Series B', 'Series C'],
        sectors: ['B2B', 'AI/ML', 'Cross-border'],
        checkSize: '$2-10M',
        website: 'https://globaltech.capital',
        interestScore: 65,
        totalProfileViews: 3,
        lastProfileView: new Date('2024-09-10'),
        mostViewedSections: ['market', 'financials', 'expansion']
      },
      {
        id: 'lead-4',
        name: '이성호',
        company: 'NextGen Partners',
        email: 'sungho.lee@nextgen.partners',
        phone: '+82-10-3456-7890',
        role: 'pe',
        source: 'manual_add',
        firstContact: new Date('2024-04-20'),
        lastActivity: new Date('2024-08-30'),
        status: 'cold',
        tags: ['PE', 'Growth Stage', 'Traditional Industries'],
        notes: '성장 단계 기업에 특화. 아직 초기 접촉 단계.',
        profileViews: [],
        contactHistory: [],
        fundName: 'NextGen Growth Fund',
        fundSize: '1,000억원',
        investmentStage: ['Series B', 'Series C', 'Pre-IPO'],
        sectors: ['Traditional Tech', 'Healthcare', 'Manufacturing'],
        checkSize: '50-200억원',
        interestScore: 35,
        totalProfileViews: 1,
        lastProfileView: new Date('2024-08-25'),
        mostViewedSections: ['overview']
      },
      {
        id: 'lead-5',
        name: 'Sarah Johnson',
        company: 'Innovation Labs',
        email: 'sarah.johnson@innovationlabs.com',
        role: 'corporate_vc',
        source: 'event',
        firstContact: new Date('2024-06-15'),
        lastActivity: new Date('2024-09-14'),
        status: 'hot',
        tags: ['Corporate VC', 'Strategic Partnership', 'US Market'],
        notes: 'Startup Conference에서 만남. 전략적 파트너십에 관심이 높음.',
        profileViews: [],
        contactHistory: [],
        fundName: 'Innovation Corporate Ventures',
        fundSize: '$500M',
        investmentStage: ['Series A', 'Series B'],
        sectors: ['Enterprise Software', 'AI', 'Automation'],
        checkSize: '$5-25M',
        website: 'https://innovationlabs.com/ventures',
        interestScore: 88,
        totalProfileViews: 12,
        lastProfileView: new Date('2024-09-14'),
        mostViewedSections: ['technology', 'partnership', 'team']
      }
    ];

    // 더미 NDA 요청 데이터
    const dummyNDARequests: NDARequest[] = [
      {
        id: 'nda-1',
        leadId: 'lead-1',
        requesterInfo: {
          name: '김민수',
          email: 'minsu.kim@bluelake.vc',
          company: 'BlueLake Partners',
          role: 'Investment Director',
          phone: '+82-10-1234-5678'
        },
        requestedDocuments: ['financial', 'business_plan', 'market_analysis'],
        status: 'pending',
        requestDate: new Date('2024-09-17'),
        downloadAllowed: true,
        notes: '투자 검토를 위한 상세 자료 요청'
      },
      {
        id: 'nda-2',
        leadId: 'lead-2',
        requesterInfo: {
          name: '박지혜',
          email: 'jihye.park@spark.ventures',
          company: 'Spark Ventures',
          role: 'Angel Investor'
        },
        requestedDocuments: ['ir_deck', 'financial'],
        status: 'approved',
        requestDate: new Date('2024-09-10'),
        responseDate: new Date('2024-09-11'),
        approvedBy: 'Admin',
        downloadAllowed: true,
        accessExpiresAt: new Date('2024-10-11')
      },
      {
        id: 'nda-3',
        leadId: 'external-1',
        requesterInfo: {
          name: '최현우',
          email: 'hyunwoo.choi@techventures.kr',
          company: 'Tech Ventures Korea',
          role: 'Principal'
        },
        requestedDocuments: ['ir_deck'],
        status: 'pending',
        requestDate: new Date('2024-09-16'),
        downloadAllowed: false,
        notes: '초기 투자 검토용'
      }
    ];

    // 더미 프로필 조회 데이터
    const dummyProfileViews: ProfileView[] = [
      {
        id: 'view-1',
        timestamp: new Date('2024-09-17'),
        leadId: 'lead-1',
        sections: ['hero', 'about', 'financial', 'team'],
        duration: 420, // 7분
        source: 'direct_link',
        timePerSection: {
          'hero': 60,
          'about': 120,
          'financial': 180,
          'team': 60
        },
        scrollDepth: {
          'hero': 100,
          'about': 85,
          'financial': 95,
          'team': 70
        },
        interactions: { clicks: 8, downloads: 2, shares: 0 },
        deviceType: 'desktop',
        ipAddress: '203.241.xxx.xxx',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        location: 'Seoul, KR'
      },
      {
        id: 'view-2',
        timestamp: new Date('2024-09-15'),
        leadId: 'lead-2',
        sections: ['hero', 'about', 'journey', 'team'],
        duration: 280,
        source: 'referral',
        timePerSection: {
          'hero': 45,
          'about': 90,
          'journey': 100,
          'team': 45
        },
        scrollDepth: {
          'hero': 100,
          'about': 90,
          'journey': 80,
          'team': 65
        },
        interactions: { clicks: 5, downloads: 1, shares: 1 },
        deviceType: 'desktop'
      },
      {
        id: 'view-3',
        timestamp: new Date('2024-09-14'),
        leadId: 'lead-5',
        sections: ['hero', 'about', 'technology', 'team', 'contact'],
        duration: 510,
        source: 'search',
        timePerSection: {
          'hero': 90,
          'about': 150,
          'technology': 180,
          'team': 60,
          'contact': 30
        },
        scrollDepth: {
          'hero': 100,
          'about': 95,
          'technology': 100,
          'team': 85,
          'contact': 90
        },
        interactions: { clicks: 12, downloads: 3, shares: 2 },
        deviceType: 'desktop'
      }
    ];

    // 더미 연락 이력 데이터
    const dummyContactRecords: ContactRecord[] = [
      {
        id: 'contact-1',
        leadId: 'lead-1',
        type: 'email',
        date: new Date('2024-09-16'),
        subject: 'IR 자료 공유 및 미팅 제안',
        content: 'IR 덱과 사업계획서를 공유했습니다. 다음 주 화요일 오후 미팅이 가능한지 문의드립니다.',
        outcome: 'positive',
        nextAction: {
          type: 'follow_up',
          dueDate: new Date('2024-09-20'),
          description: '미팅 일정 확정'
        },
        createdBy: 'admin',
        updatedAt: new Date('2024-09-16')
      },
      {
        id: 'contact-2',
        leadId: 'lead-2',
        type: 'meeting',
        date: new Date('2024-09-12'),
        subject: '투자 논의 미팅',
        content: '1시간 온라인 미팅 진행. ESG 관련 질문이 많았음.',
        outcome: 'positive',
        meetingDetails: {
          duration: 60,
          attendees: ['박지혜', 'CEO', 'CTO'],
          location: 'Zoom',
          meetingType: 'pitch'
        },
        nextAction: {
          type: 'send_documents',
          dueDate: new Date('2024-09-19'),
          description: 'ESG 관련 추가 자료 전달'
        },
        createdBy: 'admin',
        updatedAt: new Date('2024-09-12')
      },
      {
        id: 'contact-3',
        leadId: 'lead-5',
        type: 'call',
        date: new Date('2024-09-14'),
        subject: '전략적 파트너십 논의',
        content: '30분 전화 통화. 기술 스택과 확장 계획에 대해 논의',
        outcome: 'positive',
        nextAction: {
          type: 'schedule_meeting',
          dueDate: new Date('2024-09-21'),
          description: '본사 방문 미팅 일정 조율'
        },
        createdBy: 'admin',
        updatedAt: new Date('2024-09-14')
      }
    ];

    // 데이터 설정 (기존 데이터가 없을 때만)
    if (investorLeads.length === 0) {
      setInvestorLeads(dummyLeads);
    }
    if (ndaRequests.length === 0) {
      setNDARequests(dummyNDARequests);
    }
    if (profileViews.length === 0) {
      setProfileViews(dummyProfileViews);
    }
    if (contactRecords.length === 0) {
      setContactRecords(dummyContactRecords);
    }
  }, []);

  // 디바이스 타입 감지 헬퍼
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // 접근 로그 기록 헬퍼 함수
  const recordAccessLog = (
    documentId: string,
    action: EnhancedAccessLog['action'],
    success: boolean = true,
    additionalData?: Partial<EnhancedAccessLog>
  ) => {
    const document = documents.find(doc => doc.id === documentId);
    if (!document) {
      console.warn('[VDR] Document not found for logging:', documentId);
      return;
    }

    const logEntry: EnhancedAccessLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      documentId,
      action,
      sessionId: additionalData?.sessionId,
      userInfo: {
        userId: currentUser?.id,
        userName: currentUser?.name,
        userRole: currentUser?.role,
        ipAddress: 'localhost', // Mock IP - 실제 구현시 서버에서 가져와야 함
        userAgent: navigator.userAgent,
        isAnonymous: !currentUser?.id,
        ...additionalData?.userInfo
      },
      details: {
        documentName: document.name,
        documentCategory: document.category,
        fileSize: document.size,
        success,
        referrer: document.location?.href,
        ...additionalData?.details
      },
      metadata: {
        browserVersion: navigator.userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'unknown',
        deviceType: getDeviceType(),
        ...additionalData?.metadata
      },
      ...additionalData
    };

    // 로그를 상태에 추가
    setAccessLogs(prev => {
      const newLogs = [logEntry, ...prev];
      // 최대 1000개 로그만 유지 (성능 고려)
      const limitedLogs = newLogs.slice(0, 1000);

      // localStorage에 저장
      localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify(limitedLogs));

      return limitedLogs;
    });

    console.log(`[VDR] Access logged:`, {
      action,
      document: document.name,
      user: currentUser?.name || 'anonymous',
      timestamp: logEntry.timestamp.toISOString()
    });
  };

  // 모든 소스에서 문서 자동 집계
  const aggregateDocuments = async () => {
    setLoading(true);
    try {
      const aggregatedDocs: VDRDocument[] = [];

      // 빌드업 프로젝트 문서
      projects?.forEach(project => {
        // 1. 프로젝트 산출물 (deliverables)
        if (project.deliverables) {
          project.deliverables?.forEach(deliverable => {
            aggregatedDocs.push({
              id: `buildup-deliverable-${project.id}-${deliverable.id}`,
              name: deliverable.name,
              path: `/companies/buildup/projects/${project.id}/deliverables/${deliverable.name}`,
              size: 1048576, // Mock size
              uploadDate: new Date(deliverable.uploadDate || Date.now()),
              lastModified: new Date(deliverable.uploadDate || Date.now()),
              category: 'buildup_deliverable',
              source: 'buildup',
              projectId: project.id,
              projectName: project.title,
              visibility: 'team',
              tags: project.tags,
              description: `산출물 - ${deliverable.status || 'pending'}`
            });

            // 산출물에 첨부된 파일들
            if (deliverable.files && deliverable.files.length > 0) {
              deliverable.files.forEach((file: any) => {
                aggregatedDocs.push({
                  id: `buildup-file-${project.id}-${deliverable.id}-${file.id || Date.now()}`,
                  name: file.name || file.filename || 'Unknown File',
                  path: `/companies/buildup/projects/${project.id}/files/${file.name || file.filename}`,
                  size: file.size || 524288,
                  uploadDate: new Date(file.uploadDate || Date.now()),
                  lastModified: new Date(file.lastModified || Date.now()),
                  category: 'buildup_deliverable',
                  source: 'buildup',
                  projectId: project.id,
                  projectName: project.title,
                  visibility: 'team',
                  tags: [...(project.tags || []), 'attachment'],
                  description: `${deliverable.name} 첨부파일`
                });
              });
            }
          });
        }

        // 2. 프로젝트 파일함 (files)
        if (project.files && project.files.length > 0) {
          project.files.forEach((file: any) => {
            aggregatedDocs.push({
              id: `buildup-projectfile-${project.id}-${file.id || Date.now()}`,
              name: file.name || file.filename || 'Unknown File',
              path: `/companies/buildup/projects/${project.id}/library/${file.name || file.filename}`,
              size: file.size || 524288,
              uploadDate: new Date(file.uploadDate || Date.now()),
              lastModified: new Date(file.lastModified || Date.now()),
              category: file.category || 'buildup_deliverable',
              source: 'buildup',
              projectId: project.id,
              projectName: project.title,
              visibility: 'team',
              tags: [...(project.tags || []), 'project-file'],
              description: `프로젝트 자료실 파일`
            });
          });
        }
      });

      // KPI 진단 보고서
      savedAssessments?.forEach(assessment => {
        aggregatedDocs.push({
          id: `kpi-${assessment.id}`,
          name: `KPI_진단보고서_${new Date(assessment.completedAt || Date.now()).toLocaleDateString('ko-KR').replace(/\./g, '')}.pdf`,
          path: `/companies/kpi/reports/${assessment.id}.pdf`,
          size: 2097152, // Mock size
          uploadDate: new Date(assessment.completedAt || Date.now()),
          lastModified: new Date(assessment.completedAt || Date.now()),
          category: 'kpi_report',
          source: 'kpi',
          visibility: 'private',
          description: `KPI 진단 결과: 총점 ${assessment.overallScore || 0}점`
        });
      });

      // 기존 VDR 업로드 문서 (localStorage에서 가져오기)
      const storedDocs = localStorage.getItem('vdr_documents');
      if (storedDocs) {
        const parsedDocs = JSON.parse(storedDocs);
        aggregatedDocs.push(...parsedDocs.map((doc: any) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate),
          lastModified: new Date(doc.lastModified)
        })));
      }

      setDocuments(aggregatedDocs);
    } catch (error) {
      console.error('Failed to aggregate documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // 문서와 세션 간 연결 업데이트
  const updateDocumentSessionLinks = () => {
    setDocuments(docs =>
      docs.map(doc => ({
        ...doc,
        sharedSessions: sharedSessions.filter(session =>
          session.documentIds.includes(doc.id)
        )
      }))
    );
  };

  // 초기 로드 시 문서 집계
  useEffect(() => {
    aggregateDocuments();

    // 개발용 더미 세션 추가
    if (sharedSessions.length === 0) {
      const dummySessions: SharedSession[] = [
        {
          id: 'session-1',
          name: '포켓전자 IR - YS캐피탈',
          createdAt: new Date(Date.now() - 86400000 * 5), // 5일 전
          expiresAt: new Date(Date.now() + 86400000 * 2), // 2일 후
          accessCount: 23,
          link: 'https://pocketbiz.com/share/session-1',
          documentIds: ['dummy-1', 'dummy-2', 'dummy-3'],
          accessLog: []
        },
        {
          id: 'session-2',
          name: 'KB인베스트먼트 실사자료',
          createdAt: new Date(Date.now() - 86400000 * 3), // 3일 전
          expiresAt: new Date(Date.now() + 3600000 * 5), // 5시간 후 (만료 임박)
          accessCount: 15,
          link: 'https://pocketbiz.com/share/session-2',
          documentIds: ['dummy-2', 'dummy-3'],
          accessLog: []
        },
        {
          id: 'session-3',
          name: '내부 검토용 자료',
          createdAt: new Date(Date.now() - 86400000 * 10), // 10일 전
          expiresAt: undefined, // 무제한
          accessCount: 42,
          link: 'https://pocketbiz.com/share/session-3',
          documentIds: ['dummy-1', 'dummy-4', 'dummy-5'],
          accessLog: []
        },
        {
          id: 'session-4',
          name: '파트너사 협업 문서',
          createdAt: new Date(Date.now() - 86400000 * 7), // 7일 전
          expiresAt: new Date(Date.now() - 86400000), // 1일 전 (만료됨)
          accessCount: 8,
          link: 'https://pocketbiz.com/share/session-4',
          documentIds: ['dummy-4'],
          accessLog: []
        },
        {
          id: 'session-5',
          name: '2024 하반기 전략 발표자료',
          createdAt: new Date(Date.now() - 3600000 * 2), // 2시간 전
          expiresAt: new Date(Date.now() + 86400000 * 7), // 7일 후
          accessCount: 2,
          link: 'https://pocketbiz.com/share/session-5',
          documentIds: ['dummy-3', 'dummy-5'],
          accessLog: []
        }
      ];
      setSharedSessions(dummySessions);
      console.log('[VDR] Added dummy sessions for testing');
    }

    // 개발용 더미 문서 추가 (기존 문서가 10개 미만일 때)
    if (documents.length < 10) {
      const dummyDocs: VDRDocument[] = [
        {
          id: 'dummy-1',
          name: '포켓전자 사업계획서.pdf',
          path: '/dummy/business-plan.pdf',
          size: 2048000,
          uploadDate: new Date(),
          lastModified: new Date(),
          category: 'business_plan',
          source: 'manual',
          visibility: 'team',
          version: 'v1.0',
          uploadedBy: '김대표',
          downloadCount: 5,
          viewCount: 12,
          isFavorite: false,
          approvalStatus: 'pending',
          fileType: '.pdf',
          hasPreview: true,
          tags: ['사업계획', '기초자료'],
          isRepresentative: true,
          representativeType: 'business_plan'
        },
        {
          id: 'dummy-2',
          name: '2024년 재무제표.xlsx',
          path: '/dummy/financial.xlsx',
          size: 1024000,
          uploadDate: new Date(),
          lastModified: new Date(),
          category: 'financial',
          source: 'manual',
          visibility: 'team',
          version: 'v1.0',
          uploadedBy: '박회계',
          downloadCount: 8,
          viewCount: 20,
          isFavorite: true,
          approvalStatus: 'approved',
          approvedBy: '김대표',
          fileType: '.xlsx',
          hasPreview: false,
          tags: ['재무', '2024', '결산'],
          isRepresentative: true,
          representativeType: 'financial'
        },
        {
          id: 'dummy-3',
          name: 'IR Deck - YS캐피탈.pptx',
          path: '/dummy/ir-deck.pptx',
          size: 5120000,
          uploadDate: new Date(),
          lastModified: new Date(),
          category: 'ir_deck',
          source: 'manual',
          visibility: 'investors',
          version: 'v1.2',
          uploadedBy: '이기획',
          downloadCount: 25,
          viewCount: 50,
          isFavorite: true,
          approvalStatus: 'approved',
          approvedBy: '김대표',
          fileType: '.pptx',
          hasPreview: true,
          tags: ['IR', 'YS캐피탈', '투자유치'],
          isRepresentative: true,
          representativeType: 'ir_deck'
        },
        {
          id: 'dummy-4',
          name: '마케팅 전략 보고서.docx',
          path: '/dummy/marketing-strategy.docx',
          size: 1536000,
          uploadDate: new Date(Date.now() - 86400000), // 하루 전
          lastModified: new Date(Date.now() - 86400000),
          category: 'marketing',
          source: 'manual',
          visibility: 'public',
          version: 'v1.1',
          uploadedBy: '최마케팅',
          downloadCount: 3,
          viewCount: 15,
          isFavorite: false,
          approvalStatus: 'approved',
          fileType: '.docx',
          hasPreview: true,
          tags: ['마케팅', '전략', 'Q4'],
          isRepresentative: true,
          representativeType: 'marketing'
        },
        {
          id: 'dummy-5',
          name: '기술 개발 계획서.pdf',
          path: '/dummy/tech-plan.pdf',
          size: 3072000,
          uploadDate: new Date(Date.now() - 172800000), // 이틀 전
          lastModified: new Date(Date.now() - 172800000),
          category: 'business_plan',
          source: 'buildup_deliverable',
          visibility: 'private',
          projectName: '포켓전자 기술혁신 프로젝트'
        },
        {
          id: 'dummy-6',
          name: '투자제안서_v2.pptx',
          path: '/dummy/investment-proposal.pptx',
          size: 7680000,
          uploadDate: new Date(Date.now() - 259200000), // 사흘 전
          lastModified: new Date(Date.now() - 259200000),
          category: 'ir_deck',
          source: 'manual',
          visibility: 'investors',
          isRepresentative: true,
          version: 'v2.0',
          uploadedBy: '김대표',
          downloadCount: 15,
          viewCount: 42,
          lastAccessDate: new Date(Date.now() - 86400000),
          isFavorite: true,
          approvalStatus: 'approved',
          approvedBy: '이투자',
          approvedAt: new Date(Date.now() - 172800000),
          fileType: '.pptx',
          hasPreview: true,
          tags: ['투자', 'IR', '중요']
        },
        {
          id: 'dummy-7',
          name: '법무 검토 의견서.pdf',
          path: '/dummy/legal-review.pdf',
          size: 512000,
          uploadDate: new Date(Date.now() - 345600000), // 나흘 전
          lastModified: new Date(Date.now() - 345600000),
          category: 'contract',
          source: 'manual',
          visibility: 'private'
        },
        {
          id: 'dummy-8',
          name: 'KPI 월간 보고서.xlsx',
          path: '/dummy/kpi-monthly.xlsx',
          size: 768000,
          uploadDate: new Date(Date.now() - 432000000), // 닷새 전
          lastModified: new Date(Date.now() - 432000000),
          category: 'kpi_report',
          source: 'kpi_diagnosis',
          visibility: 'team'
        },
        {
          id: 'dummy-9',
          name: '사업자등록증.pdf',
          path: '/dummy/business-license.pdf',
          size: 256000,
          uploadDate: new Date(Date.now() - 604800000), // 일주일 전
          lastModified: new Date(Date.now() - 604800000),
          category: 'contract',
          source: 'manual',
          visibility: 'public'
        },
        {
          id: 'dummy-10',
          name: '팀 조직도.png',
          path: '/dummy/org-chart.png',
          size: 1024000,
          uploadDate: new Date(Date.now() - 691200000), // 8일 전
          lastModified: new Date(Date.now() - 691200000),
          category: 'marketing',
          source: 'manual',
          visibility: 'team'
        }
      ];
      setDocuments(dummyDocs);
      console.log('[VDR] Added dummy documents for testing');
    }
  }, [projects, savedAssessments]);

  // 세션이 변경될 때마다 문서-세션 연결 업데이트
  useEffect(() => {
    if (sharedSessions.length > 0) {
      updateDocumentSessionLinks();
      console.log('[VDR] Updated document-session links');
    }
  }, [sharedSessions]);

  // 파일 검증 설정
  const FILE_VALIDATION = {
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: {
      // 문서 파일
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      // 이미지 파일
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      // 압축 파일
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed'
    },
    // 카테고리별 허용 타입
    categoryTypes: {
      'ir_deck': ['.pdf', '.pptx', '.ppt'],
      'business_plan': ['.pdf', '.docx', '.doc'],
      'financial': ['.xlsx', '.xls', '.csv', '.pdf'],
      'contract': ['.pdf', '.docx', '.doc'],
      'marketing': ['.pdf', '.pptx', '.png', '.jpg', '.jpeg']
    }
  };

  // 파일 검증 함수
  const validateFile = (file: File, category: VDRDocument['category']): { valid: boolean; error?: string } => {
    // 파일 크기 검증
    if (file.size > FILE_VALIDATION.maxSize) {
      return {
        valid: false,
        error: `파일 크기가 ${(FILE_VALIDATION.maxSize / 1048576).toFixed(0)}MB를 초과합니다. (현재: ${(file.size / 1048576).toFixed(2)}MB)`
      };
    }

    // 파일 타입 검증
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const allowedExtensions = Object.keys(FILE_VALIDATION.allowedTypes);

    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `지원하지 않는 파일 형식입니다. 허용된 형식: ${allowedExtensions.join(', ')}`
      };
    }

    // 카테고리별 타입 검증 (카테고리별 제한이 있는 경우)
    const categoryRestrictions = FILE_VALIDATION.categoryTypes[category as keyof typeof FILE_VALIDATION.categoryTypes];
    if (categoryRestrictions && !categoryRestrictions.includes(fileExtension)) {
      return {
        valid: false,
        error: `${getCategoryLabel(category)} 카테고리에는 ${categoryRestrictions.join(', ')} 파일만 업로드 가능합니다.`
      };
    }

    // 파일명 검증 (특수문자 체크)
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    if (invalidChars.test(file.name)) {
      return {
        valid: false,
        error: '파일명에 사용할 수 없는 특수문자가 포함되어 있습니다.'
      };
    }

    // 중복 파일 검증
    const isDuplicate = documents.some(doc =>
      doc.name === file.name && doc.category === category
    );
    if (isDuplicate) {
      return {
        valid: false,
        error: '동일한 이름의 파일이 이미 존재합니다.'
      };
    }

    return { valid: true };
  };

  // 카테고리 라벨 헬퍼
  const getCategoryLabel = (category: VDRDocument['category']): string => {
    const labels: Record<VDRDocument['category'], string> = {
      'buildup_deliverable': '빌드업 산출물',
      'kpi_report': 'KPI 리포트',
      'vdr_upload': 'VDR 업로드',
      'contract': '계약서',
      'ir_deck': 'IR Deck',
      'business_plan': '사업계획서',
      'financial': '재무제표',
      'marketing': '마케팅'
    };
    return labels[category] || category;
  };

  // 문서 업로드 (강화된 검증 포함)
  const uploadDocument = async (file: File, category: VDRDocument['category']) => {
    // 파일 검증
    const validation = validateFile(file, category);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const hasPreview = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(fileExtension);

    const newDoc: VDRDocument = {
      id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      path: `/companies/vdr/uploads/${encodeURIComponent(file.name)}`,
      size: file.size,
      uploadDate: new Date(),
      lastModified: new Date(),
      category,
      source: 'manual',
      visibility: 'private',
      // 업로더 정보 자동 추가
      uploadedBy: currentUser?.name || 'Unknown',
      uploadedById: currentUser?.id,
      downloadCount: 0,
      viewCount: 0,
      version: 'v1.0',
      fileType: fileExtension,
      mimeType: file.type || FILE_VALIDATION.allowedTypes[fileExtension as keyof typeof FILE_VALIDATION.allowedTypes] || 'application/octet-stream',
      hasPreview,
      isFavorite: false,
      approvalStatus: 'pending',
      checksum: await generateChecksum(file),
      tags: []
    };

    const updatedDocs = [...documents, newDoc];
    setDocuments(updatedDocs);

    // 업로드 로그 기록
    recordAccessLog(newDoc.id, 'upload', true, {
      details: {
        fileSize: file.size,
        success: true
      }
    });

    // VDR 네임스페이스 이벤트 발생
    window.dispatchEvent(new CustomEvent('vdr:document_uploaded', {
      detail: newDoc
    }));

    // localStorage에 저장
    const manualDocs = updatedDocs.filter(d => d.source === 'manual');
    localStorage.setItem('vdr_documents', JSON.stringify(manualDocs));

    console.log('[VDR] Document uploaded successfully:', {
      id: newDoc.id,
      name: newDoc.name,
      size: `${(newDoc.size / 1048576).toFixed(2)}MB`,
      type: newDoc.fileType,
      category: newDoc.category
    });
  };

  // 체크섬 생성 함수 (파일 무결성 체크)
  const generateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 16); // 처음 16자만 사용
  };

  // 문서 공개 범위 업데이트
  const updateDocumentVisibility = (docId: string, visibility: VDRDocument['visibility']) => {
    setDocuments(docs => 
      docs.map(doc => doc.id === docId ? { ...doc, visibility } : doc)
    );
  };

  // 대표 문서 설정
  const setRepresentativeDocument = (type: RepresentativeDoc['type'], docId: string | null) => {
    console.log('[VDR] setRepresentativeDocument called:', { type, docId });

    setDocuments(docs => {
      const updatedDocs = docs.map(doc => {
        // 같은 타입의 기존 대표 문서 해제 (representativeType 기준)
        if (doc.isRepresentative && doc.representativeType === type) {
          console.log('[VDR] 기존 대표 문서 해제:', doc.name);
          return { ...doc, isRepresentative: false, representativeType: undefined };
        }
        // 새로운 대표 문서 지정 (docId가 null이면 해제만)
        if (docId && doc.id === docId) {
          console.log('[VDR] 새로운 대표 문서 지정:', doc.name, 'as', type);
          return { ...doc, isRepresentative: true, representativeType: type };
        }
        return doc;
      });

      console.log('[VDR] 업데이트된 문서들:', updatedDocs.filter(d => d.isRepresentative));
      return updatedDocs;
    });

    // VDR 네임스페이스 이벤트 발생
    window.dispatchEvent(new CustomEvent('vdr:representative_document_updated', {
      detail: { type, docId }
    }));
  };

  // 공유 세션 생성
  const createShareSession = async (name: string, documentIds: string[], expiresAt?: Date): Promise<string> => {
    try {
      console.log('[VDR] Creating share session:', { name, documentIds, expiresAt });

      const sessionId = Math.random().toString(36).substr(2, 9);
      const shareLink = `https://pocketbiz.com/share/${sessionId}`;

      const newSession: SharedSession = {
        id: sessionId,
        name,
        createdAt: new Date(),
        expiresAt,
        accessCount: 0,
        link: shareLink,
        documentIds,
        accessLog: []
      };

      console.log('[VDR] Session object created:', newSession);

      // 동기적으로 상태 업데이트
      setSharedSessions(prev => {
        console.log('[VDR] Updating shared sessions:', [...prev, newSession]);
        return [...prev, newSession];
      });

      // VDR 네임스페이스 이벤트 발생
      try {
        window.dispatchEvent(new CustomEvent('vdr:share_session_created', {
          detail: newSession
        }));
        console.log('[VDR] Event dispatched successfully');
      } catch (eventError) {
        console.warn('[VDR] Failed to dispatch event:', eventError);
      }

      // 공유된 문서에 세션 정보 추가
      try {
        setDocuments(docs => {
          const updatedDocs = docs.map(doc => {
            if (documentIds.includes(doc.id)) {
              const sessions = doc.sharedSessions || [];
              return {
                ...doc,
                sharedSessions: [...sessions, newSession]
              };
            }
            return doc;
          });
          console.log('[VDR] Documents updated with session info');
          return updatedDocs;
        });
      } catch (docUpdateError) {
        console.warn('[VDR] Failed to update documents:', docUpdateError);
      }

      console.log('[VDR] Share session created successfully:', shareLink);
      return shareLink;
    } catch (error) {
      console.error('[VDR] Failed to create share session:', error);
      throw new Error(`공유 세션 생성 실패: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 공유 세션 조회
  const getShareSession = (sessionId: string) => {
    return sharedSessions.find(session => session.id === sessionId);
  };

  // 문서 삭제
  const deleteDocument = async (docId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== docId));
  };

  // 문서 검색
  const searchDocuments = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc => 
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.description?.toLowerCase().includes(lowercaseQuery) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // 카테고리별 문서 조회
  const getDocumentsByCategory = (category: VDRDocument['category']) => {
    return documents.filter(doc => doc.category === category);
  };

  // 문서 조회 (조회수 증가)
  const viewDocument = (docId: string) => {
    const startTime = Date.now();

    setDocuments(docs =>
      docs.map(doc => {
        if (doc.id === docId) {
          const newViewCount = (doc.viewCount || 0) + 1;

          // 강화된 접근 로그 기록
          recordAccessLog(docId, 'view', true, {
            details: {
              duration: Math.round((Date.now() - startTime) / 1000), // 조회 시간 (초)
              success: true
            }
          });

          return {
            ...doc,
            viewCount: newViewCount,
            lastAccessDate: new Date()
          };
        }
        return doc;
      })
    );
  };

  // 단일 파일 다운로드
  const downloadDocument = async (docId: string) => {
    const downloadStartTime = Date.now();

    try {
      const document = documents.find(doc => doc.id === docId);
      if (!document) {
        // 실패 로그 기록
        recordAccessLog(docId, 'download', false, {
          details: {
            errorMessage: '문서를 찾을 수 없습니다.',
            success: false
          }
        });
        throw new Error('문서를 찾을 수 없습니다.');
      }

      // Mock 파일 콘텐츠 생성 (실제로는 서버에서 파일을 가져와야 함)
      const mockContent = `
========================================
문서명: ${document.name}
카테고리: ${document.category}
업로드일: ${new Date(document.uploadDate).toLocaleString('ko-KR')}
크기: ${(document.size / 1048576).toFixed(2)}MB
버전: ${document.version || 'v1.0'}
========================================

[문서 내용]

이것은 ${document.name}의 샘플 내용입니다.

본 문서는 VDR 시스템을 통해 안전하게 관리되고 있습니다.

- 문서 ID: ${document.id}
- 보안 등급: ${document.visibility}
- 업로더: ${document.uploadedBy || '시스템'}

========================================
© 2025 PocketBiz VDR System
========================================
      `;

      // Blob 생성
      const blob = new Blob([mockContent], {
        type: document.fileType === '.pdf' ? 'application/pdf' : 'text/plain'
      });

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name;

      // 클릭 이벤트 트리거
      document.body.appendChild(link);
      link.click();

      // 정리
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      // 다운로드 성공 - 카운트 증가 및 로그 기록
      const downloadDuration = Date.now() - downloadStartTime;
      const downloadSpeed = Math.round((document.size / 1024) / (downloadDuration / 1000)); // KB/s

      setDocuments(docs => docs.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            downloadCount: (doc.downloadCount || 0) + 1,
            viewCount: (doc.viewCount || 0) + 1,
            lastAccessDate: new Date()
          };
        }
        return doc;
      }));

      // 강화된 다운로드 로그 기록
      recordAccessLog(docId, 'download', true, {
        details: {
          duration: Math.round(downloadDuration / 1000), // 다운로드 시간 (초)
          success: true
        },
        metadata: {
          downloadSpeed: downloadSpeed
        }
      });

      // 최근 100개 로그만 유지
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }

      localStorage.setItem('vdr_download_logs', JSON.stringify(existingLogs));

      // 콘솔 로그
      console.log(`[VDR] Document downloaded:`, {
        name: document.name,
        downloadCount: (document.downloadCount || 0) + 1,
        timestamp: now.toISOString()
      });

    } catch (error) {
      console.error('[VDR] Download failed:', error);
      throw error;
    }
  };

  // 다중 파일 다운로드 (ZIP으로 압축)
  const downloadMultipleDocuments = async (docIds: string[]) => {
    try {
      console.log(`[VDR] Creating ZIP with ${docIds.length} documents`);

      // JSZip 인스턴스 생성
      const zip = new JSZip();

      // 각 문서를 ZIP에 추가
      for (const docId of docIds) {
        const document = documents.find(doc => doc.id === docId);
        if (!document) continue;

        // Mock 파일 콘텐츠 생성
        const mockContent = `
========================================
문서명: ${document.name}
카테고리: ${document.category}
업로드일: ${new Date(document.uploadDate).toLocaleString('ko-KR')}
크기: ${(document.size / 1048576).toFixed(2)}MB
버전: ${document.version || 'v1.0'}
========================================

[문서 내용]

이것은 ${document.name}의 샘플 내용입니다.

본 문서는 VDR 시스템을 통해 안전하게 관리되고 있습니다.

- 문서 ID: ${document.id}
- 보안 등급: ${document.visibility}
- 업로더: ${document.uploadedBy || '시스템'}

========================================
© 2025 PocketBiz VDR System
========================================
        `;

        // 파일을 ZIP에 추가 (폴더 구조 유지)
        const folder = document.category.replace(/_/g, '-');
        zip.folder(folder)?.file(document.name, mockContent);

        // 다운로드 카운트 증가
        setDocuments(docs => docs.map(doc => {
          if (doc.id === docId) {
            return {
              ...doc,
              downloadCount: (doc.downloadCount || 0) + 1,
              viewCount: (doc.viewCount || 0) + 1,
              lastAccessDate: new Date()
            };
          }
          return doc;
        }));
      }

      // 메타데이터 파일 추가
      const metadata = {
        exportDate: new Date().toISOString(),
        documentCount: docIds.length,
        documents: docIds.map(id => {
          const doc = documents.find(d => d.id === id);
          return doc ? {
            name: doc.name,
            category: doc.category,
            size: doc.size,
            uploadDate: doc.uploadDate
          } : null;
        }).filter(Boolean)
      };

      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // ZIP 파일 생성
      const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // 다운로드 링크 생성
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `VDR_Documents_${new Date().getTime()}.zip`;

      // 클릭 이벤트 트리거
      document.body.appendChild(link);
      link.click();

      // 정리
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      // 다운로드 로그 기록
      const downloadLog = {
        action: 'bulk_download',
        documentIds: docIds,
        documentCount: docIds.length,
        timestamp: new Date().toISOString(),
        userId: 'current-user',
        fileSize: content.size,
        userAgent: navigator.userAgent
      };

      const existingLogs = JSON.parse(localStorage.getItem('vdr_download_logs') || '[]');
      existingLogs.push(downloadLog);
      localStorage.setItem('vdr_download_logs', JSON.stringify(existingLogs));

      console.log(`[VDR] ZIP download completed:`, {
        documentCount: docIds.length,
        fileSize: `${(content.size / 1048576).toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[VDR] ZIP creation failed:', error);
      throw error;
    }
  };

  // 프로필용 대표 문서 필터링 함수
  const getRepresentativeDocumentsForProfile = (userType: 'public' | 'team' | 'investors'): VDRDocument[] => {
    return representativeDocs
      .filter(repDoc => {
        // 공개 범위에 따른 필터링
        if (userType === 'public') {
          return repDoc.profileVisibility === 'public';
        } else if (userType === 'team') {
          return ['public', 'team'].includes(repDoc.profileVisibility || 'private');
        } else if (userType === 'investors') {
          return ['public', 'team', 'investors'].includes(repDoc.profileVisibility || 'private');
        }
        return false;
      })
      .map(repDoc => {
        // 해당 타입으로 지정된 실제 문서 찾기
        const actualDoc = documents.find(doc =>
          doc.representativeType === repDoc.type && doc.isRepresentative
        );
        return actualDoc;
      })
      .filter(Boolean) as VDRDocument[];
  };

  // 대표 문서 공개 범위 업데이트 함수
  const updateRepresentativeDocumentVisibility = (type: RepresentativeDoc['type'], visibility: VDRDocument['visibility']) => {
    // 로컬 상태에서 대표 문서 공개 범위 업데이트
    const updatedRepDocs = representativeDocs.map(repDoc =>
      repDoc.type === type
        ? { ...repDoc, profileVisibility: visibility }
        : repDoc
    );

    // localStorage에 저장
    localStorage.setItem('vdr_representative_visibilities', JSON.stringify(
      updatedRepDocs.reduce((acc, repDoc) => {
        acc[repDoc.type] = repDoc.profileVisibility || 'private';
        return acc;
      }, {} as Record<RepresentativeDoc['type'], VDRDocument['visibility']>)
    ));

    console.log(`[VDR] Updated representative document visibility:`, { type, visibility });
  };

  // 접근 로그 관련 함수들
  const getAccessLogs = (filter?: AccessLogFilter): EnhancedAccessLog[] => {
    let filteredLogs = [...accessLogs];

    if (filter) {
      if (filter.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
      }
      if (filter.documentId) {
        filteredLogs = filteredLogs.filter(log => log.documentId === filter.documentId);
      }
      if (filter.sessionId) {
        filteredLogs = filteredLogs.filter(log => log.sessionId === filter.sessionId);
      }
      if (filter.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filter.action);
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userInfo.userId === filter.userId);
      }
      if (filter.isAnonymous !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.userInfo.isAnonymous === filter.isAnonymous);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const clearAccessLogs = (documentId?: string) => {
    if (documentId) {
      // 특정 문서의 로그만 삭제
      const filteredLogs = accessLogs.filter(log => log.documentId !== documentId);
      setAccessLogs(filteredLogs);
      localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify(filteredLogs));
    } else {
      // 모든 로그 삭제
      setAccessLogs([]);
      localStorage.removeItem(ACCESS_LOGS_KEY);
    }
    console.log(`[VDR] Access logs cleared:`, documentId ? `for document ${documentId}` : 'all logs');
  };

  const exportAccessLogs = (format: 'csv' | 'json') => {
    const logs = getAccessLogs();

    if (format === 'json') {
      const jsonData = JSON.stringify(logs, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vdr_access_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['ID', 'Timestamp', 'Document ID', 'Document Name', 'Action', 'User', 'Device', 'Success', 'Duration'];
      const csvRows = [headers.join(',')];

      logs.forEach(log => {
        const row = [
          log.id,
          log.timestamp.toISOString(),
          log.documentId,
          `"${log.details.documentName}"`,
          log.action,
          log.userInfo.userName || 'Anonymous',
          log.metadata?.deviceType || 'unknown',
          log.details.success,
          log.details.duration || 0
        ];
        csvRows.push(row.join(','));
      });

      const csvData = csvRows.join('\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vdr_access_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    console.log(`[VDR] Access logs exported as ${format.toUpperCase()}`);
  };

  const getAccessStatistics = (): AccessStatistics => {
    const logs = accessLogs;
    const uniqueUsers = new Set(logs.map(log => log.userInfo.userId || 'anonymous')).size;

    // 문서별 접근 통계
    const documentStats = new Map<string, { name: string; count: number }>();
    logs.forEach(log => {
      const current = documentStats.get(log.documentId) || { name: log.details.documentName, count: 0 };
      documentStats.set(log.documentId, { ...current, count: current.count + 1 });
    });

    const topDocuments = Array.from(documentStats.entries())
      .map(([documentId, stats]) => ({
        documentId,
        documentName: stats.name,
        accessCount: stats.count
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);

    // 액션별 통계
    const actionBreakdown = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<EnhancedAccessLog['action'], number>);

    // 일별 통계 (최근 30일)
    const dailyStats: AccessStatistics['dailyStats'] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayLogs = logs.filter(log =>
        log.timestamp.toISOString().split('T')[0] === dateStr
      );

      const dayUniqueUsers = new Set(dayLogs.map(log => log.userInfo.userId || 'anonymous')).size;

      dailyStats.push({
        date: dateStr,
        accessCount: dayLogs.length,
        uniqueUsers: dayUniqueUsers
      });
    }

    // 디바이스별 통계
    const deviceBreakdown = logs.reduce((acc, log) => {
      const device = log.metadata?.deviceType || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAccess: logs.length,
      uniqueUsers,
      topDocuments,
      actionBreakdown,
      dailyStats,
      deviceBreakdown
    };
  };

  // 🚀 Docsend 고급 기능 구현

  // 이메일 초대 생성
  const createEmailInvite = async (sessionId: string, email: string, expiresAt?: Date): Promise<EmailInvite> => {
    const accessToken = `invite_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const invite: EmailInvite = {
      id: `invite_${Date.now()}`,
      email,
      accessToken,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
      viewCount: 0,
      invitedAt: new Date(),
      invitedBy: currentUser?.name || 'System',
      status: 'pending',
      remindersSent: 0
    };

    // 세션에 초대 추가
    setDocsendSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, emailInvites: [...session.emailInvites, invite] }
        : session
    ));

    return invite;
  };

  // 이메일 초대 발송 (Mock 구현)
  const sendEmailInvitation = async (inviteId: string): Promise<void> => {
    console.log(`[Docsend] 이메일 초대 발송: ${inviteId}`);
    // TODO: 실제 이메일 발송 로직 구현

    setDocsendSessions(prev => prev.map(session => ({
      ...session,
      emailInvites: session.emailInvites.map(invite =>
        invite.id === inviteId
          ? { ...invite, emailSentAt: new Date() }
          : invite
      )
    })));
  };

  // 리마인더 발송
  const sendReminder = async (inviteId: string): Promise<void> => {
    console.log(`[Docsend] 리마인더 발송: ${inviteId}`);

    setDocsendSessions(prev => prev.map(session => ({
      ...session,
      emailInvites: session.emailInvites.map(invite =>
        invite.id === inviteId
          ? {
              ...invite,
              remindersSent: invite.remindersSent + 1,
              lastReminderAt: new Date()
            }
          : invite
      )
    })));
  };

  // 이메일 토큰 검증
  const verifyEmailToken = async (token: string): Promise<EmailInvite | null> => {
    const allInvites = docsendSessions.flatMap(session => session.emailInvites);
    const invite = allInvites.find(inv => inv.accessToken === token);

    if (!invite || invite.expiresAt < new Date()) {
      return null;
    }

    return invite;
  };

  // 고급 Docsend 세션 생성
  const createDocsendSession = async (
    name: string,
    documentIds: string[],
    options: {
      requireEmailAuth?: boolean;
      downloadBlocked?: boolean;
      watermarkEnabled?: boolean;
      requireNDA?: boolean;
      viewLimit?: number;
      expiresAt?: Date;
    }
  ): Promise<DocsendSession> => {
    const sessionId = `docsend_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const link = `${window.location.origin}/docsend/${sessionId}`;

    const docsendSession: DocsendSession = {
      // 기본 SharedSession 필드들
      id: sessionId,
      name,
      createdAt: new Date(),
      expiresAt: options.expiresAt,
      accessCount: 0,
      link,
      documentIds,
      accessLog: [],

      // Docsend 확장 필드들
      emailInvites: [],
      requireEmailAuth: options.requireEmailAuth || false,
      downloadBlocked: options.downloadBlocked || false,
      watermarkEnabled: options.watermarkEnabled || false,
      watermarkText: currentUser?.name || 'Confidential',
      requireNDA: options.requireNDA || false,
      pageViews: [],
      analytics: {
        totalViews: 0,
        uniqueViewers: 0,
        averageViewTime: 0,
        completionRate: 0,
        topPages: [],
        bounceRate: 0
      },
      viewLimit: options.viewLimit
    };

    setDocsendSessions(prev => [...prev, docsendSession]);
    setSharedSessions(prev => [...prev, docsendSession]); // 기본 세션 목록에도 추가

    return docsendSession;
  };

  // 세션 설정 업데이트
  const updateSessionSettings = async (sessionId: string, settings: Partial<DocsendSession>): Promise<void> => {
    setDocsendSessions(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, ...settings }
        : session
    ));
  };

  // 페이지 뷰 추적
  const trackPageView = (sessionId: string, pageNumber: number, timeSpent: number): void => {
    const pageView: PageView = {
      id: `pageview_${Date.now()}`,
      pageNumber,
      timeSpent,
      timestamp: new Date(),
      sessionId,
      userAgent: navigator.userAgent,
      scrollDepth: 100, // Mock 값
      zoomLevel: 1,
      interactions: {
        clicks: Math.floor(Math.random() * 5),
        scrolls: Math.floor(Math.random() * 10),
        downloads: 0
      }
    };

    setDocsendSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            pageViews: [...session.pageViews, pageView],
            analytics: {
              ...session.analytics,
              totalViews: session.analytics.totalViews + 1
            }
          }
        : session
    ));
  };

  // 세션 분석 데이터 가져오기
  const getSessionAnalytics = (sessionId: string): DocsendSession['analytics'] => {
    const session = docsendSessions.find(s => s.id === sessionId);
    return session?.analytics || {
      totalViews: 0,
      uniqueViewers: 0,
      averageViewTime: 0,
      completionRate: 0,
      topPages: [],
      bounceRate: 0
    };
  };

  // NDA 템플릿 생성
  const createNDATemplate = async (name: string, content: string, variables: string[]): Promise<NDATemplate> => {
    const template: NDATemplate = {
      id: `nda_template_${Date.now()}`,
      name,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDefault: ndaTemplates.length === 0, // 첫 번째 템플릿을 기본값으로
      variables
    };

    setNdaTemplates(prev => [...prev, template]);
    return template;
  };

  // NDA 템플릿 업데이트
  const updateNDATemplate = async (templateId: string, updates: Partial<NDATemplate>): Promise<void> => {
    setNdaTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, ...updates, updatedAt: new Date() }
        : template
    ));
  };

  // NDA 템플릿 삭제
  const deleteNDATemplate = async (templateId: string): Promise<void> => {
    setNdaTemplates(prev => prev.filter(template => template.id !== templateId));
  };

  // NDA 서명
  const signNDA = async (sessionId: string, signerInfo: {
    email: string;
    name: string;
    company?: string;
    signatureData: string;
  }): Promise<NDASignature> => {
    const signature: NDASignature = {
      id: `nda_signature_${Date.now()}`,
      ndaTemplateId: 'default_template', // TODO: 실제 템플릿 ID 연결
      sessionId,
      signerEmail: signerInfo.email,
      signerName: signerInfo.name,
      signerCompany: signerInfo.company,
      signedAt: new Date(),
      ipAddress: '127.0.0.1', // Mock IP
      signatureData: signerInfo.signatureData,
      status: 'signed',
      documentHash: `hash_${Date.now()}`
    };

    setNdaSignatures(prev => [...prev, signature]);
    return signature;
  };

  // 🎯 투자자 관리 함수들

  // 투자자 리드 관리
  const createInvestorLead = async (leadData: Omit<InvestorLead, 'id' | 'firstContact' | 'lastActivity'>): Promise<InvestorLead> => {
    const now = new Date();
    const newLead: InvestorLead = {
      ...leadData,
      id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      firstContact: now,
      lastActivity: now,
      profileViews: [],
      contactHistory: [],
      totalProfileViews: 0,
      mostViewedSections: []
    };

    setInvestorLeads(prev => [...prev, newLead]);
    return newLead;
  };

  const updateInvestorLead = async (leadId: string, updates: Partial<InvestorLead>): Promise<void> => {
    setInvestorLeads(prev =>
      prev.map(lead =>
        lead.id === leadId
          ? { ...lead, ...updates, lastActivity: new Date() }
          : lead
      )
    );
  };

  const deleteInvestorLead = async (leadId: string): Promise<void> => {
    setInvestorLeads(prev => prev.filter(lead => lead.id !== leadId));
    setNDARequests(prev => prev.filter(request => request.leadId !== leadId));
    setContactRecords(prev => prev.filter(contact => contact.leadId !== leadId));
  };

  const getInvestorLead = (leadId: string): InvestorLead | undefined => {
    return investorLeads.find(lead => lead.id === leadId);
  };

  const searchInvestorLeads = (query: string): InvestorLead[] => {
    const lowercaseQuery = query.toLowerCase();
    return investorLeads.filter(lead =>
      lead.name.toLowerCase().includes(lowercaseQuery) ||
      lead.company.toLowerCase().includes(lowercaseQuery) ||
      lead.email.toLowerCase().includes(lowercaseQuery) ||
      lead.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const updateLeadStatus = async (leadId: string, status: InvestorLead['status']): Promise<void> => {
    await updateInvestorLead(leadId, { status });
  };

  const updateInterestScore = async (leadId: string, score: number): Promise<void> => {
    await updateInvestorLead(leadId, { interestScore: Math.max(0, Math.min(100, score)) });
  };

  // 프로필 조회 추적
  const trackProfileView = async (
    leadId: string | undefined,
    sections: string[],
    duration: number,
    source: string
  ): Promise<void> => {
    const view: ProfileView = {
      id: `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      leadId,
      sections,
      duration,
      source,
      timePerSection: {},
      scrollDepth: {},
      interactions: { clicks: 0, downloads: 0, shares: 0 },
      deviceType: getDeviceType(),
      ipAddress: 'unknown',
      userAgent: navigator.userAgent
    };

    setProfileViews(prev => [...prev, view]);

    // 리드가 있으면 업데이트
    if (leadId) {
      const lead = investorLeads.find(l => l.id === leadId);
      if (lead) {
        await updateInvestorLead(leadId, {
          totalProfileViews: lead.totalProfileViews + 1,
          lastProfileView: new Date(),
          lastActivity: new Date()
        });
      }
    }
  };

  const getProfileViewsForLead = (leadId: string): ProfileView[] => {
    return profileViews.filter(view => view.leadId === leadId);
  };

  const getProfileViewStatistics = (): InvestorAnalytics['profileViewStats'] => {
    const totalViews = profileViews.length;
    const uniqueViewers = new Set(profileViews.map(v => v.leadId).filter(Boolean)).size;
    const averageViewTime = profileViews.reduce((sum, view) => sum + view.duration, 0) / totalViews || 0;

    // 섹션별 통계
    const sectionStats: Record<string, { viewCount: number; totalTime: number }> = {};
    profileViews.forEach(view => {
      view.sections.forEach(section => {
        if (!sectionStats[section]) {
          sectionStats[section] = { viewCount: 0, totalTime: 0 };
        }
        sectionStats[section].viewCount++;
        sectionStats[section].totalTime += view.timePerSection[section] || 0;
      });
    });

    const popularSections = Object.entries(sectionStats)
      .map(([section, stats]) => ({
        section,
        viewCount: stats.viewCount,
        averageTime: stats.totalTime / stats.viewCount || 0
      }))
      .sort((a, b) => b.viewCount - a.viewCount);

    // 일별 통계
    const viewsByDate: Record<string, { views: number; uniqueViewers: Set<string> }> = {};
    profileViews.forEach(view => {
      const date = view.timestamp.toISOString().split('T')[0];
      if (!viewsByDate[date]) {
        viewsByDate[date] = { views: 0, uniqueViewers: new Set() };
      }
      viewsByDate[date].views++;
      if (view.leadId) {
        viewsByDate[date].uniqueViewers.add(view.leadId);
      }
    });

    const viewsOverTime = Object.entries(viewsByDate)
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueViewers: data.uniqueViewers.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalViews,
      uniqueViewers,
      averageViewTime,
      popularSections,
      viewsOverTime
    };
  };

  // NDA 요청 관리
  const createNDARequest = async (requestData: Omit<NDARequest, 'id' | 'requestDate'>): Promise<NDARequest> => {
    const newRequest: NDARequest = {
      ...requestData,
      id: `nda-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestDate: new Date()
    };

    setNDARequests(prev => [...prev, newRequest]);

    // 리드 정보 업데이트
    if (requestData.leadId) {
      await updateInvestorLead(requestData.leadId, { lastActivity: new Date() });
    }

    return newRequest;
  };

  const updateNDARequestStatus = async (
    requestId: string,
    status: NDARequest['status'],
    notes?: string
  ): Promise<void> => {
    setNDARequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, status, responseDate: new Date(), notes }
          : request
      )
    );
  };

  const approveNDARequest = async (
    requestId: string,
    approvedBy: string,
    accessExpiresAt?: Date
  ): Promise<void> => {
    setNDARequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'approved' as const,
              responseDate: new Date(),
              approvedBy,
              accessExpiresAt
            }
          : request
      )
    );
  };

  const rejectNDARequest = async (
    requestId: string,
    rejectionReason: string,
    approvedBy: string
  ): Promise<void> => {
    setNDARequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'rejected' as const,
              responseDate: new Date(),
              rejectionReason,
              approvedBy
            }
          : request
      )
    );
  };

  const getNDARequestsForLead = (leadId: string): NDARequest[] => {
    return ndaRequests.filter(request => request.leadId === leadId);
  };

  // 연락 이력 관리
  const addContactRecord = async (contactData: Omit<ContactRecord, 'id' | 'updatedAt'>): Promise<ContactRecord> => {
    const newContact: ContactRecord = {
      ...contactData,
      id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: new Date()
    };

    setContactRecords(prev => [...prev, newContact]);

    // 리드 최종 활동 시간 업데이트
    await updateInvestorLead(contactData.leadId, { lastActivity: new Date() });

    return newContact;
  };

  const updateContactRecord = async (contactId: string, updates: Partial<ContactRecord>): Promise<void> => {
    setContactRecords(prev =>
      prev.map(contact =>
        contact.id === contactId
          ? { ...contact, ...updates, updatedAt: new Date() }
          : contact
      )
    );
  };

  const deleteContactRecord = async (contactId: string): Promise<void> => {
    setContactRecords(prev => prev.filter(contact => contact.id !== contactId));
  };

  const getContactHistoryForLead = (leadId: string): ContactRecord[] => {
    return contactRecords
      .filter(contact => contact.leadId === leadId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  // 투자자 분석
  const getInvestorAnalytics = (): InvestorAnalytics => {
    const leadsByStatus = investorLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<InvestorLead['status'], number>);

    const leadsBySource = investorLeads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<InvestorLead['source'], number>);

    const leadsByRole = investorLeads.reduce((acc, lead) => {
      acc[lead.role] = (acc[lead.role] || 0) + 1;
      return acc;
    }, {} as Record<InvestorLead['role'], number>);

    const profileViewStats = getProfileViewStatistics();

    const ndaRequestStats = {
      totalRequests: ndaRequests.length,
      pendingRequests: ndaRequests.filter(r => r.status === 'pending').length,
      approvalRate: ndaRequests.length > 0
        ? ndaRequests.filter(r => r.status === 'approved').length / ndaRequests.length
        : 0,
      averageResponseTime: 0, // TODO: 계산 로직 추가
      requestsByMonth: [] // TODO: 월별 통계 계산
    };

    const engagementMetrics = {
      averageInterestScore: investorLeads.reduce((sum, lead) => sum + lead.interestScore, 0) / investorLeads.length || 0,
      hotLeads: investorLeads.filter(lead => lead.status === 'hot').length,
      activeConversations: investorLeads.filter(lead =>
        lead.status === 'engaged' || lead.status === 'hot'
      ).length,
      nextActionsToday: contactRecords.filter(contact =>
        contact.nextAction?.dueDate &&
        contact.nextAction.dueDate <= new Date()
      ).length
    };

    return {
      totalLeads: investorLeads.length,
      leadsByStatus,
      leadsBySource,
      leadsByRole,
      profileViewStats,
      ndaRequestStats,
      engagementMetrics
    };
  };

  const getLeadsByStatus = (status: InvestorLead['status']): InvestorLead[] => {
    return investorLeads.filter(lead => lead.status === status);
  };

  const getLeadsBySource = (source: InvestorLead['source']): InvestorLead[] => {
    return investorLeads.filter(lead => lead.source === source);
  };

  const getHotLeads = (): InvestorLead[] => {
    return investorLeads.filter(lead =>
      lead.status === 'hot' ||
      (lead.status === 'warm' && lead.interestScore >= 80)
    );
  };

  const getUpcomingActions = (): ContactRecord[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return contactRecords.filter(contact =>
      contact.nextAction?.dueDate &&
      contact.nextAction.dueDate >= today &&
      contact.nextAction.dueDate <= nextWeek
    ).sort((a, b) =>
      (a.nextAction?.dueDate?.getTime() || 0) - (b.nextAction?.dueDate?.getTime() || 0)
    );
  };

  const value: VDRContextType = {
    documents,
    sharedSessions,
    representativeDocs,
    accessLogs,
    aggregateDocuments,
    uploadDocument,
    updateDocumentVisibility,
    setRepresentativeDocument,
    createShareSession,
    getShareSession,
    deleteDocument,
    searchDocuments,
    getDocumentsByCategory,
    downloadDocument,
    downloadMultipleDocuments,
    viewDocument,
    getRepresentativeDocumentsForProfile,
    updateRepresentativeDocumentVisibility,
    getAccessLogs,
    clearAccessLogs,
    exportAccessLogs,
    getAccessStatistics,

    // 🚀 Docsend 고급 기능들
    docsendSessions,
    ndaTemplates,
    ndaSignatures,
    createEmailInvite,
    sendEmailInvitation,
    sendReminder,
    verifyEmailToken,
    createDocsendSession,
    updateSessionSettings,
    trackPageView,
    getSessionAnalytics,
    createNDATemplate,
    updateNDATemplate,
    deleteNDATemplate,
    signNDA,

    // 🎯 투자자 관리 시스템
    investorLeads,
    ndaRequests,
    createInvestorLead,
    updateInvestorLead,
    deleteInvestorLead,
    getInvestorLead,
    searchInvestorLeads,
    updateLeadStatus,
    updateInterestScore,
    trackProfileView,
    getProfileViewsForLead,
    getProfileViewStatistics,
    createNDARequest,
    updateNDARequestStatus,
    approveNDARequest,
    rejectNDARequest,
    getNDARequestsForLead,
    addContactRecord,
    updateContactRecord,
    deleteContactRecord,
    getContactHistoryForLead,
    getInvestorAnalytics,
    getLeadsByStatus,
    getLeadsBySource,
    getHotLeads,
    getUpcomingActions,

    loading
  };

  return (
    <VDRContext.Provider value={value}>
      {children}
    </VDRContext.Provider>
  );
};