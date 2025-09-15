import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile, UserCluster, UserKPIDiagnosis } from '../types/userProfile';
import { defaultUserProfile, clusterLabels, getClusterKey } from '../types/userProfile';

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;

  // 클러스터 관련
  updateCluster: (stage: string, sector: string) => void;
  getClusterKey: () => string;

  // KPI 관련
  updateKPIScores: (scores: any) => void;

  // 프로필 관리
  initializeProfile: (name: string, email?: string) => void;
  saveProfile: () => void;
  loadProfile: () => void;

  // 매칭 기록
  addBookmark: (programId: string) => void;
  removeBookmark: (programId: string) => void;
  addApplication: (programId: string) => void;

  // 알림 설정
  updateNotificationSettings: (settings: any) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // localStorage 키
  const STORAGE_KEY = 'userProfile';

  // 초기 로드
  useEffect(() => {
    loadProfile();
  }, []);

  // 프로필 초기화
  const initializeProfile = (name: string, email?: string) => {
    const basicInfo = {
      id: `user_${Date.now()}`,
      name,
      email,
      joinedAt: new Date()
    };

    const newProfile = defaultUserProfile(basicInfo);
    setProfile(newProfile);
    saveProfileToStorage(newProfile);
  };

  // 클러스터 업데이트
  const updateCluster = (stage: string, sector: string) => {
    if (!profile) return;

    const updatedCluster: UserCluster = {
      stage: stage as any,
      sector: sector as any,
      stageLabel: clusterLabels.stages[stage as keyof typeof clusterLabels.stages],
      sectorLabel: clusterLabels.sectors[sector as keyof typeof clusterLabels.sectors],
      lastUpdated: new Date(),
      updatedBy: 'user'
    };

    const updatedProfile = {
      ...profile,
      cluster: updatedCluster,
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // KPI 점수 업데이트
  const updateKPIScores = (scores: any) => {
    if (!profile) return;

    const totalScore = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0);

    const kpiDiagnosis: UserKPIDiagnosis = {
      scores,
      totalScore,
      lastDiagnosisDate: new Date(),
      completionRate: 100 // 모든 항목 완료했다고 가정
    };

    const updatedProfile = {
      ...profile,
      kpiDiagnosis,
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // 클러스터 키 조회
  const getClusterKeyValue = (): string => {
    if (!profile) return 'A2S1';
    return getClusterKey(profile.cluster.stage, profile.cluster.sector);
  };

  // 북마크 추가
  const addBookmark = (programId: string) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      matchingHistory: {
        ...profile.matchingHistory,
        bookmarkedPrograms: [...profile.matchingHistory.bookmarkedPrograms, programId]
      },
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // 북마크 제거
  const removeBookmark = (programId: string) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      matchingHistory: {
        ...profile.matchingHistory,
        bookmarkedPrograms: profile.matchingHistory.bookmarkedPrograms.filter(id => id !== programId)
      },
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // 지원 프로그램 추가
  const addApplication = (programId: string) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      matchingHistory: {
        ...profile.matchingHistory,
        appliedPrograms: [...profile.matchingHistory.appliedPrograms, programId],
        clickedRecommendations: profile.matchingHistory.clickedRecommendations + 1
      },
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // 알림 설정 업데이트
  const updateNotificationSettings = (settings: any) => {
    if (!profile) return;

    const updatedProfile = {
      ...profile,
      notificationSettings: {
        ...profile.notificationSettings,
        ...settings
      },
      metadata: {
        ...profile.metadata,
        updatedAt: new Date()
      }
    };

    setProfile(updatedProfile);
    saveProfileToStorage(updatedProfile);
  };

  // localStorage에 저장
  const saveProfileToStorage = (profileToSave: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profileToSave, (key, value) => {
        // Date 객체를 ISO 문자열로 변환
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error);
    }
  };

  // localStorage에서 불러오기
  const loadProfile = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProfile = JSON.parse(stored, (key, value) => {
          // ISO 문자열을 Date 객체로 변환
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
            return new Date(value);
          }
          return value;
        });
        setProfile(parsedProfile);
      } else {
        // 저장된 프로필이 없으면 기본 더미 프로필 생성
        initializeProfile('김대표', 'demo@company.com');
      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error);
      // 오류 시 기본 프로필 생성
      initializeProfile('김대표', 'demo@company.com');
    }
    setIsLoading(false);
  };

  // 수동 저장
  const saveProfile = () => {
    if (profile) {
      saveProfileToStorage(profile);
    }
  };

  const value: UserProfileContextType = {
    profile,
    isLoading,
    updateCluster,
    getClusterKey: getClusterKeyValue,
    updateKPIScores,
    initializeProfile,
    saveProfile,
    loadProfile,
    addBookmark,
    removeBookmark,
    addApplication,
    updateNotificationSettings
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};