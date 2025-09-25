/**
 * @fileoverview 현재 사용자 정보 관리 Context
 * @description Sprint 5 Phase 5-2: 사용자 프로필 및 인증 상태 관리
 * @author PocketCompany
 * @since 2025-01-19
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

/**
 * 사용자 역할 타입
 */
export type UserRole = 'startup' | 'pm' | 'mentor' | 'admin' | 'partner' | 'internal-builder';

/**
 * 사용자 상태 타입
 */
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

/**
 * 사용자 정보 인터페이스
 */
export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  company: string;
  profileImage?: string;
  phone?: string;
  position?: string;
  bio?: string;

  // 역할별 추가 정보
  startupInfo?: {
    companyId?: string;
    stage?: string;
    industry?: string;
  };

  pmInfo?: {
    specialties: string[];
    experience: number;
    rating: number;
    completedProjects: number;
  };

  mentorInfo?: {
    expertise: string[];
    experience: number;
    rating: number;
    mentoringSessions: number;
  };

  // 시스템 정보
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
}

/**
 * 사용자 설정 인터페이스
 */
export interface UserSettings {
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts_only';
    showEmail: boolean;
    showPhone: boolean;
  };
  preferences: {
    language: 'ko' | 'en';
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

/**
 * 인증 상태 인터페이스
 */
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
  accessToken?: string;
  refreshToken?: string;
}

/**
 * Context 타입 정의
 */
interface CurrentUserContextType {
  // 기존 호환성 유지
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser) => void;
  logout: () => void;

  // 새로운 기능
  authState: AuthState;
  updateProfile: (updates: Partial<CurrentUser>) => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isRole: (role: UserRole) => boolean;
  getDisplayName: () => string;
  getAvatarUrl: () => string;
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined);

/**
 * 기본 사용자 설정
 */
const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    browser: true,
    mobile: true,
    frequency: 'immediate'
  },
  privacy: {
    profileVisibility: 'contacts_only',
    showEmail: false,
    showPhone: false
  },
  preferences: {
    language: 'ko',
    timezone: 'Asia/Seoul',
    theme: 'light'
  }
};

/**
 * 데모 사용자 데이터 (개발용)
 */
const DEMO_USERS: Record<UserRole, CurrentUser> = {
  startup: {
    id: 'user-001',
    email: 'ceo@pocketbiz.com',
    name: '김대표',
    role: 'startup',
    status: 'active',
    company: '포켓전자',
    profileImage: '/avatars/startup.jpg',
    phone: '010-1234-5678',
    position: '대표',
    bio: '혁신적인 기술로 세상을 변화시키고 싶습니다.',
    startupInfo: {
      companyId: 'company-001',
      stage: 'seed',
      industry: 'tech'
    },
    createdAt: new Date('2024-01-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  },
  pm: {
    id: 'user-pm-001',
    email: 'pm@pocketcompany.co.kr',
    name: '박매니저',
    role: 'pm',
    status: 'active',
    company: '포켓컴퍼니',
    profileImage: '/avatars/pm.jpg',
    phone: '010-2345-6789',
    position: 'Project Manager',
    bio: '스타트업의 성공을 위해 최선을 다하겠습니다.',
    pmInfo: {
      specialties: ['웹개발', '앱개발', 'UI/UX'],
      experience: 5,
      rating: 4.8,
      completedProjects: 47
    },
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  },
  mentor: {
    id: 'user-mentor-001',
    email: 'mentor@example.com',
    name: '이멘토',
    role: 'mentor',
    status: 'active',
    company: '멘토링 프로',
    profileImage: '/avatars/mentor.jpg',
    phone: '010-3456-7890',
    position: '시니어 멘토',
    bio: '20년간의 창업 경험을 공유합니다.',
    mentorInfo: {
      expertise: ['창업전략', '투자유치', '마케팅'],
      experience: 20,
      rating: 4.9,
      mentoringSessions: 156
    },
    createdAt: new Date('2022-01-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  },
  admin: {
    id: 'user-admin-001',
    email: 'admin@pocketcompany.co.kr',
    name: '관리자',
    role: 'admin',
    status: 'active',
    company: '포켓컴퍼니',
    profileImage: '/avatars/admin.jpg',
    position: '시스템 관리자',
    bio: '시스템 운영 및 관리를 담당합니다.',
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  },
  partner: {
    id: 'user-partner-001',
    email: 'partner@example.com',
    name: '최파트너',
    role: 'partner',
    status: 'active',
    company: '파트너십 코리아',
    profileImage: '/avatars/partner.jpg',
    position: '사업개발팀장',
    bio: '파트너십을 통한 상생을 추구합니다.',
    createdAt: new Date('2023-06-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  },
  'internal-builder': {
    id: 'user-builder-001',
    email: 'builder@pocketcompany.co.kr',
    name: '김빌더',
    role: 'internal-builder',
    status: 'active',
    company: '포켓컴퍼니',
    profileImage: '/avatars/builder.jpg',
    position: '내부 빌더',
    bio: '고품질 솔루션을 구축합니다.',
    createdAt: new Date('2023-01-01'),
    lastLoginAt: new Date(),
    settings: DEFAULT_USER_SETTINGS
  }
};

/**
 * 역할별 권한 매핑
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'], // 모든 권한
  pm: [
    'project:read',
    'project:update',
    'schedule:create',
    'schedule:update',
    'schedule:delete',
    'user:read'
  ],
  startup: [
    'project:read',
    'project:create',
    'schedule:read',
    'schedule:create',
    'profile:update'
  ],
  mentor: [
    'schedule:read',
    'schedule:create',
    'mentoring:all',
    'profile:update'
  ],
  partner: [
    'partnership:all',
    'schedule:read',
    'profile:update'
  ],
  'internal-builder': [
    'project:read',
    'project:update',
    'schedule:all',
    'admin:limited'
  ]
};

export const useCurrentUser = () => {
  const context = useContext(CurrentUserContext);
  if (!context) {
    throw new Error('useCurrentUser must be used within CurrentUserProvider');
  }
  return context;
};

export const CurrentUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 기존 상태 유지 (호환성)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_USERS.startup);

  // 새로운 인증 상태
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true, // 개발 환경에서는 기본 인증
    isLoading: false,
    user: DEMO_USERS.startup
  });

  /**
   * 초기 인증 상태 동기화
   */
  useEffect(() => {
    if (currentUser) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        user: currentUser
      }));
    }
  }, [currentUser]);

  /**
   * 로그인
   */
  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const demoUser = Object.values(DEMO_USERS).find(user => user.email === email);

      if (!demoUser) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      const authData = {
        user: demoUser,
        accessToken: `demo_token_${Date.now()}`,
        refreshToken: `demo_refresh_${Date.now()}`
      };

      setCurrentUser(demoUser);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        ...authData
      });

    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null
      });
      throw error;
    }
  }, []);

  /**
   * 로그아웃
   */
  const logout = useCallback(() => {
    setCurrentUser(null);
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });
  }, []);

  /**
   * 인증 토큰 갱신
   */
  const refreshAuth = useCallback(async () => {
    if (!authState.refreshToken) return;

    try {
      const newAccessToken = `refreshed_token_${Date.now()}`;

      setAuthState(prev => ({
        ...prev,
        accessToken: newAccessToken
      }));
    } catch (error) {
      console.error('❌ 토큰 갱신 실패:', error);
      logout();
    }
  }, [authState.refreshToken, logout]);

  /**
   * 프로필 업데이트
   */
  const updateProfile = useCallback(async (updates: Partial<CurrentUser>) => {
    if (!currentUser) return;

    try {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      setAuthState(prev => ({ ...prev, user: updatedUser }));

    } catch (error) {
      console.error('❌ 프로필 업데이트 실패:', error);
      throw error;
    }
  }, [currentUser]);

  /**
   * 설정 업데이트
   */
  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    if (!currentUser) return;

    try {
      const updatedSettings = { ...currentUser.settings, ...settings };
      await updateProfile({ settings: updatedSettings });

    } catch (error) {
      console.error('❌ 설정 업데이트 실패:', error);
      throw error;
    }
  }, [currentUser, updateProfile]);

  /**
   * 권한 확인
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentUser) return false;

    const userPermissions = ROLE_PERMISSIONS[currentUser.role] || [];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [currentUser]);

  /**
   * 역할 확인
   */
  const isRole = useCallback((role: UserRole): boolean => {
    return currentUser?.role === role;
  }, [currentUser]);

  /**
   * 표시용 이름 반환
   */
  const getDisplayName = useCallback((): string => {
    if (!currentUser) return '게스트';
    return currentUser.name || currentUser.email.split('@')[0];
  }, [currentUser]);

  /**
   * 아바타 URL 반환
   */
  const getAvatarUrl = useCallback((): string => {
    if (!currentUser) return '/avatars/default.png';
    return currentUser.profileImage || `/avatars/${currentUser.role}.jpg`;
  }, [currentUser]);

  const contextValue: CurrentUserContextType = {
    // 기존 호환성
    currentUser,
    setCurrentUser,
    logout,

    // 새로운 기능
    authState,
    updateProfile,
    updateSettings,
    login,
    refreshAuth,
    hasPermission,
    isRole,
    getDisplayName,
    getAvatarUrl
  };

  return (
    <CurrentUserContext.Provider value={contextValue}>
      {children}
    </CurrentUserContext.Provider>
  );
};