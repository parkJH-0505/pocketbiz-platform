import React, { createContext, useContext, useState, useEffect } from 'react';

// Iteration 22 문서 기반으로 단순화된 버전
export interface CompanyProfile {
  // 기본 정보
  name: string;
  registrationNumber?: string;
  foundedYear?: number;
  website?: string;
  description?: string;
  logoUrl?: string;

  // 규모 정보
  employeeCount: "1-5명" | "6-20명" | "21-50명" | "51-200명" | "200명+";

  // 주소 정보
  address: {
    country: "KR" | "US" | "JP" | "CN" | "SG";
    city: string;
    district?: string;
    fullAddress?: string;
    isRemote?: boolean;
  };
}

export interface BusinessInfo {
  industry: string;
  sector: "S-1" | "S-2" | "S-3" | "S-4" | "S-5";
  businessModel: "B2B" | "B2C" | "B2B2C" | "Marketplace" | "SaaS" | "기타";
  targetMarket: string;

  // 매출 정보 (공개 범위 설정 가능)
  revenueRange?: "pre-revenue" | "1억 미만" | "1-10억" | "10-100억" | "100억+";
  isPublicRevenue: boolean;
}

export interface FundingInfo {
  currentStage: "pre-seed" | "seed" | "series-a" | "series-b+" | "exit" | "기타";
  totalFunded?: number;
  lastFundingDate?: Date;
  investors?: string[];
  isSeekingFunding: boolean;
  fundingGoal?: number;
}

export interface ProductInfo {
  name?: string;
  category: string;
  developmentStage: "아이디어" | "MVP" | "베타" | "출시" | "성장" | "성숙";

  // 기술 스택 (IT/SaaS 전용)
  techStack?: string[];

  // 경쟁사
  competitors?: string[];
}

export interface TeamInfo {
  totalMembers: number;
  coreTeam: {
    founders: number;
    cLevel: number;
    employees: number;
  };

  // 역할별 구성
  departments: {
    development?: number;
    design?: number;
    marketing?: number;
    sales?: number;
    operations?: number;
    finance?: number;
    hr?: number;
    others?: number;
  };

  // 채용 계획
  hiringPlan?: {
    positions: string[];
    timeframe: "즉시" | "3개월" | "6개월" | "1년";
    budget?: number;
  };
}

export interface PersonalRole {
  position: string; // "대표", "CTO", "개발팀장" 등
  isFounder: boolean;
  experienceYears?: number;
  previousCompanies?: string[];
}

// VDR과 연동되는 프라이버시 설정
export interface PrivacySettings {
  profileVisibility: "public" | "limited" | "private";

  publicFields: {
    companyName: boolean;
    industry: boolean;
    fundingStage: boolean;
    teamSize: boolean;
    location: boolean;
    establishedYear: boolean;
    revenueInfo: boolean;
  };

  // VDR 공유 시 기본 설정
  vdrDefaults: {
    showCompanyName: boolean;
    showContactInfo: boolean;
    showDetailedMetrics: boolean;
  };
}

export interface MyProfile {
  // 개인 정보
  personalRole: PersonalRole;

  // 회사 정보
  company: CompanyProfile;

  // 비즈니스 정보
  business: BusinessInfo;

  // 자금 조달
  funding: FundingInfo;

  // 제품/서비스
  product: ProductInfo;

  // 팀 구성
  team: TeamInfo;

  // 프라이버시 설정
  privacy: PrivacySettings;

  // 메타 정보
  lastUpdated: Date;
  completeness: number; // 0-100%
  isPublic: boolean;
}

interface MyProfileContextType {
  profile: MyProfile | null;
  loading: boolean;

  // 프로필 관리
  updateProfile: (updates: Partial<MyProfile>) => Promise<void>;
  updateCompany: (updates: Partial<CompanyProfile>) => Promise<void>;
  updateBusiness: (updates: Partial<BusinessInfo>) => Promise<void>;
  updateFunding: (updates: Partial<FundingInfo>) => Promise<void>;
  updateProduct: (updates: Partial<ProductInfo>) => Promise<void>;
  updateTeam: (updates: Partial<TeamInfo>) => Promise<void>;
  updatePrivacy: (updates: Partial<PrivacySettings>) => Promise<void>;

  // 유틸리티
  calculateCompleteness: () => number;
  generatePublicUrl: () => string;
  exportProfile: () => MyProfile;

  // VDR 연동
  getVDRDisplayInfo: () => {
    displayName: string;
    publicInfo: Record<string, any>;
    contactInfo?: Record<string, any>;
  };
}

const MyProfileContext = createContext<MyProfileContextType | undefined>(undefined);

export const useMyProfile = () => {
  const context = useContext(MyProfileContext);
  if (!context) {
    throw new Error('useMyProfile must be used within MyProfileProvider');
  }
  return context;
};

// 기본 프로필 템플릿
const createDefaultProfile = (): MyProfile => ({
  personalRole: {
    position: '',
    isFounder: false,
  },
  company: {
    name: '',
    employeeCount: "1-5명",
    address: {
      country: "KR",
      city: '',
    },
  },
  business: {
    industry: '',
    sector: "S-1",
    businessModel: "B2B",
    targetMarket: '',
    isPublicRevenue: false,
  },
  funding: {
    currentStage: "pre-seed",
    isSeekingFunding: false,
  },
  product: {
    category: '',
    developmentStage: "아이디어",
  },
  team: {
    totalMembers: 1,
    coreTeam: {
      founders: 1,
      cLevel: 0,
      employees: 0,
    },
    departments: {},
  },
  privacy: {
    profileVisibility: "limited",
    publicFields: {
      companyName: true,
      industry: true,
      fundingStage: false,
      teamSize: true,
      location: true,
      establishedYear: true,
      revenueInfo: false,
    },
    vdrDefaults: {
      showCompanyName: true,
      showContactInfo: false,
      showDetailedMetrics: false,
    },
  },
  lastUpdated: new Date(),
  completeness: 0,
  isPublic: false,
});

export const MyProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const storedProfile = localStorage.getItem('myProfile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        // Date 객체 복원
        parsed.lastUpdated = new Date(parsed.lastUpdated);
        if (parsed.funding.lastFundingDate) {
          parsed.funding.lastFundingDate = new Date(parsed.funding.lastFundingDate);
        }
        setProfile(parsed);
      } else {
        // 기본 프로필 생성
        const defaultProfile = createDefaultProfile();
        setProfile(defaultProfile);
        await saveProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(createDefaultProfile());
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: MyProfile) => {
    try {
      const updatedProfile = {
        ...profileData,
        lastUpdated: new Date(),
        completeness: calculateCompleteness(profileData),
      };

      localStorage.setItem('myProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      // MyProfile 네임스페이스 이벤트 발생
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: updatedProfile
      }));
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  const updateProfile = async (updates: Partial<MyProfile>) => {
    if (!profile) return;
    const updatedProfile = { ...profile, ...updates };
    await saveProfile(updatedProfile);
  };

  const updateCompany = async (updates: Partial<CompanyProfile>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      company: { ...profile.company, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  const updateBusiness = async (updates: Partial<BusinessInfo>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      business: { ...profile.business, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  const updateFunding = async (updates: Partial<FundingInfo>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      funding: { ...profile.funding, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  const updateProduct = async (updates: Partial<ProductInfo>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      product: { ...profile.product, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  const updateTeam = async (updates: Partial<TeamInfo>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      team: { ...profile.team, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  const updatePrivacy = async (updates: Partial<PrivacySettings>) => {
    if (!profile) return;
    const updatedProfile = {
      ...profile,
      privacy: { ...profile.privacy, ...updates }
    };
    await saveProfile(updatedProfile);
  };

  // Iteration 22의 점진적 수집 전략 기반 완성도 계산
  const calculateCompleteness = (profileData: MyProfile = profile!) => {
    if (!profileData) return 0;

    const requiredFields = [
      // 필수 정보 (40점)
      profileData.company.name,
      profileData.personalRole.position,
      profileData.business.industry,
      profileData.business.sector,

      // 중요 정보 (40점)
      profileData.company.foundedYear,
      profileData.business.businessModel,
      profileData.product.category,
      profileData.team.totalMembers > 0,

      // 선택 정보 (20점)
      profileData.company.website,
      profileData.product.developmentStage !== "아이디어"
    ];

    const filledFields = requiredFields.filter(field =>
      field && field !== '' && field !== 0
    ).length;

    return Math.round((filledFields / requiredFields.length) * 100);
  };

  const generatePublicUrl = () => {
    if (!profile?.company.name) return '';
    const slug = profile.company.name.toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .trim();
    return `https://pocketbiz.com/profile/${slug}`;
  };

  const exportProfile = () => {
    if (!profile) throw new Error('No profile to export');
    return { ...profile };
  };

  // VDR 연동을 위한 표시 정보 생성
  const getVDRDisplayInfo = () => {
    if (!profile) {
      return {
        displayName: '프로필 없음',
        publicInfo: {},
      };
    }

    const { privacy, company, business, team } = profile;
    const publicInfo: Record<string, any> = {};

    if (privacy.publicFields.companyName) {
      publicInfo.companyName = company.name;
    }
    if (privacy.publicFields.industry) {
      publicInfo.industry = business.industry;
    }
    if (privacy.publicFields.fundingStage) {
      publicInfo.fundingStage = profile.funding.currentStage;
    }
    if (privacy.publicFields.teamSize) {
      publicInfo.teamSize = company.employeeCount;
    }
    if (privacy.publicFields.location) {
      publicInfo.location = `${company.address.city}, ${company.address.country}`;
    }
    if (privacy.publicFields.establishedYear && company.foundedYear) {
      publicInfo.establishedYear = company.foundedYear;
    }
    if (privacy.publicFields.revenueInfo && business.revenueRange && business.isPublicRevenue) {
      publicInfo.revenueRange = business.revenueRange;
    }

    const contactInfo = privacy.vdrDefaults.showContactInfo ? {
      website: company.website,
      // 추후 연락처 정보 추가
    } : undefined;

    return {
      displayName: company.name || '회사명 미설정',
      publicInfo,
      contactInfo,
    };
  };

  const value: MyProfileContextType = {
    profile,
    loading,
    updateProfile,
    updateCompany,
    updateBusiness,
    updateFunding,
    updateProduct,
    updateTeam,
    updatePrivacy,
    calculateCompleteness: () => calculateCompleteness(),
    generatePublicUrl,
    exportProfile,
    getVDRDisplayInfo,
  };

  return (
    <MyProfileContext.Provider value={value}>
      {children}
    </MyProfileContext.Provider>
  );
};