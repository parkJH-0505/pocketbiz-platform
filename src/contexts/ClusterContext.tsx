import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';

export type SectorType = 'S-1' | 'S-2' | 'S-3' | 'S-4' | 'S-5';
export type StageType = 'A-1' | 'A-2' | 'A-3' | 'A-4' | 'A-5';

export interface StageChange {
  from: StageType;
  to: StageType;
  changedAt: Date;
  reason?: 'manual' | 'auto_upgrade' | 'admin_override';
}

export interface ClusterState {
  sector: SectorType;           // 온보딩 시 결정, 읽기 전용
  stage: StageType;            // 사용자가 변경 가능
  sectorLockedAt: Date;        // 섹터 확정 시간
  lastStageUpdate: Date;       // 마지막 단계 변경 시간
  stageHistory: StageChange[]; // 단계 변경 이력
}

interface ClusterContextType {
  cluster: ClusterState;
  updateStage: (newStage: StageType, reason?: StageChange['reason']) => void;
  canChangeStage: boolean;
  isLoading: boolean;
  getStageInfo: (stage: StageType) => StageInfo;
  getNextStageRequirements: () => string[];
}

export interface StageInfo {
  id: StageType;
  name: string;
  description: string;
  minKPIs: number;
  typicalDuration: string;
  keyMilestones: string[];
}

const STAGE_INFO: Record<StageType, StageInfo> = {
  'A-1': {
    id: 'A-1',
    name: '아이디어',
    description: '아이디어 검증 및 팀 구성 단계',
    minKPIs: 8,
    typicalDuration: '3-6개월',
    keyMilestones: ['아이디어 도출', '팀 구성', '초기 시장 조사']
  },
  'A-2': {
    id: 'A-2',
    name: '창업초기',
    description: 'MVP 개발 및 초기 고객 확보',
    minKPIs: 12,
    typicalDuration: '6-12개월',
    keyMilestones: ['MVP 출시', '초기 고객 10명', '피드백 수집']
  },
  'A-3': {
    id: 'A-3',
    name: 'PMF 검증',
    description: 'Product-Market Fit 검증 단계',
    minKPIs: 15,
    typicalDuration: '12-18개월',
    keyMilestones: ['MAU 1,000명', '유료 전환', 'NPS 40+']
  },
  'A-4': {
    id: 'A-4',
    name: 'Pre-A',
    description: '시리즈 A 준비 및 성장 가속화',
    minKPIs: 18,
    typicalDuration: '12-24개월',
    keyMilestones: ['MRR $50K+', '팀 20명+', '시장 확장']
  },
  'A-5': {
    id: 'A-5',
    name: 'Series A+',
    description: '본격적인 스케일업 단계',
    minKPIs: 20,
    typicalDuration: '24개월+',
    keyMilestones: ['ARR $1M+', '팀 50명+', '해외 진출']
  }
};

const SECTOR_INFO: Record<SectorType, string> = {
  'S-1': 'B2B SaaS',
  'S-2': 'B2C 플랫폼',
  'S-3': '이커머스',
  'S-4': '핀테크',
  'S-5': '헬스케어'
};

const ClusterContext = createContext<ClusterContextType | undefined>(undefined);

export const ClusterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cluster, setCluster] = useState<ClusterState>(() => {
    // localStorage에서 저장된 클러스터 정보 로드
    const saved = localStorage.getItem('clusterState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        sectorLockedAt: new Date(parsed.sectorLockedAt),
        lastStageUpdate: new Date(parsed.lastStageUpdate),
        stageHistory: parsed.stageHistory.map((h: any) => ({
          ...h,
          changedAt: new Date(h.changedAt)
        }))
      };
    }
    
    // 기본값: 온보딩 전까지는 S-1, A-1로 시작
    return {
      sector: 'S-1',
      stage: 'A-1',
      sectorLockedAt: new Date(),
      lastStageUpdate: new Date(),
      stageHistory: []
    };
  });

  const [isLoading] = useState(false);

  // localStorage에 상태 저장
  useEffect(() => {
    localStorage.setItem('clusterState', JSON.stringify(cluster));
  }, [cluster]);

  const updateStage = useCallback((newStage: StageType, reason: StageChange['reason'] = 'manual') => {
    setCluster(prev => {
      const change: StageChange = {
        from: prev.stage,
        to: newStage,
        changedAt: new Date(),
        reason
      };

      return {
        ...prev,
        stage: newStage,
        lastStageUpdate: new Date(),
        stageHistory: [...prev.stageHistory, change]
      };
    });
  }, []);

  const getStageInfo = useCallback((stage: StageType): StageInfo => {
    return STAGE_INFO[stage];
  }, []);

  const getNextStageRequirements = useCallback((): string[] => {
    const currentStageIndex = Object.keys(STAGE_INFO).indexOf(cluster.stage);
    const stages = Object.keys(STAGE_INFO) as StageType[];
    
    if (currentStageIndex < stages.length - 1) {
      const nextStage = stages[currentStageIndex + 1];
      return STAGE_INFO[nextStage].keyMilestones;
    }
    
    return ['최고 단계에 도달했습니다'];
  }, [cluster.stage]);

  const contextValue: ClusterContextType = {
    cluster,
    updateStage,
    canChangeStage: true, // 사용자는 항상 단계 변경 가능
    isLoading,
    getStageInfo,
    getNextStageRequirements
  };

  return (
    <ClusterContext.Provider value={contextValue}>
      {children}
    </ClusterContext.Provider>
  );
};

export const useCluster = () => {
  const context = useContext(ClusterContext);
  if (!context) {
    throw new Error('useCluster must be used within a ClusterProvider');
  }
  return context;
};

// Helper functions
export const getSectorName = (sector: SectorType): string => {
  return SECTOR_INFO[sector];
};

export const getStageName = (stage: StageType): string => {
  return STAGE_INFO[stage].name;
};

export const getStageColor = (stage: StageType): string => {
  const colors: Record<StageType, string> = {
    'A-1': 'bg-gray-100 text-gray-700',
    'A-2': 'bg-blue-100 text-blue-700',
    'A-3': 'bg-purple-100 text-purple-700',
    'A-4': 'bg-orange-100 text-orange-700',
    'A-5': 'bg-green-100 text-green-700'
  };
  return colors[stage];
};