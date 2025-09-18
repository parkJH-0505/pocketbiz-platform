/**
 * Profile Card Component
 *
 * 신용카드 스타일의 ID카드형 프로필 컴포넌트
 * - 성장 단계 (A-1~5, S-1~5)
 * - KPI 총점 및 순위
 * - 담당 빌더 정보
 * - 빠른 액션 버튼
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Phone,
  MessageCircle,
  Calendar,
  Award,
  User
} from 'lucide-react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useDashboard } from '../../contexts/DashboardContext';

// 성장 단계 정보
const STAGE_INFO = {
  'A-1': { label: '예비창업자', color: 'gray', icon: '🌱' },
  'A-2': { label: '창업 직전', color: 'blue', icon: '🚀' },
  'A-3': { label: 'PMF 검증', color: 'green', icon: '✅' },
  'A-4': { label: 'Pre-A 단계', color: 'purple', icon: '💜' },
  'A-5': { label: 'Series A+', color: 'gold', icon: '🏆' }
};

const SECTOR_INFO = {
  'S-1': { label: 'IT·SaaS', icon: '💻' },
  'S-2': { label: '제조·하드웨어', icon: '🔧' },
  'S-3': { label: '브랜드·커머스', icon: '🛍️' },
  'S-4': { label: '바이오·헬스', icon: '🧬' },
  'S-5': { label: '크리에이티브', icon: '🎨' }
};

interface ProfileCardProps {
  className?: string;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ className = '' }) => {
  const { overallScore, strongestAxis, progress, loading: kpiLoading } = useKPIDiagnosis();
  const { growthStatus, loading: dashboardLoading } = useDashboard();

  const isLoading = kpiLoading || dashboardLoading;

  // 실제 데이터 (컨텍스트에서 가져옴)
  const userData = {
    stage: (growthStatus?.level?.current?.name === '예비창업자' ? 'A-1' :
           growthStatus?.level?.current?.name === '창업 직전' ? 'A-2' :
           growthStatus?.level?.current?.name === 'PMF 검증' ? 'A-3' :
           growthStatus?.level?.current?.name === 'Pre-A 단계' ? 'A-4' : 'A-5') as keyof typeof STAGE_INFO,
    sector: 'S-1' as keyof typeof SECTOR_INFO, // TODO: 사용자 섹터 정보 추가
    kpiScore: overallScore || 0,
    percentile: Math.round(((100 - (overallScore || 0)) / 100) * 100), // 간단한 백분위 계산
    strongestAxis: strongestAxis || 'GO',
    builder: {
      name: '김성장',
      role: '성장전문가',
      phone: '010-1234-5678',
      email: 'growth@pocketbiz.co.kr'
    }
  };

  const stageInfo = STAGE_INFO[userData.stage];
  const sectorInfo = SECTOR_INFO[userData.sector];

  if (isLoading) {
    return (
      <div className={`w-full h-24 bg-gray-200 rounded-lg animate-pulse ${className}`} />
    );
  }

  return (
    <motion.div
      className={`w-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="px-4 py-3 bg-gradient-to-r from-primary-main to-primary-dark rounded-lg shadow-md relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-2 right-2 w-8 h-8 bg-white/8 rounded-full blur-sm" />
        <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/8 rounded-full blur-sm" />

        {/* 1열 레이아웃 */}
        <div className="flex items-center justify-between relative z-10">
          {/* 왼쪽: 프로필 정보 */}
          <div className="flex items-center gap-3">
            <span className="text-lg">{stageInfo.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">
                  {userData.stage}-{userData.sector}
                </span>
                <span className="px-2 py-0.5 bg-white/20 text-white text-xs rounded-full font-medium">
                  PRO
                </span>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-white/15 rounded-full">
                  <Award className="w-3 h-3 text-yellow-300" />
                  <span className="text-white text-xs font-medium">
                    {userData.strongestAxis}축
                  </span>
                </div>
              </div>
              <p className="text-white/80 text-xs">{stageInfo.label}</p>
            </div>
          </div>

          {/* 중앙: KPI 점수 */}
          <div className="text-center px-4">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-white font-bold text-xl">
                {userData.kpiScore.toFixed(1)}
              </span>
            </div>
            <p className="text-white/70 text-xs">KPI</p>
          </div>

          {/* 오른쪽: 담당자와 액션 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-white font-medium text-sm block">
                  {userData.builder.name}
                </span>
                <span className="text-white/70 text-xs">
                  {userData.builder.role}
                </span>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center gap-1">
              <motion.button
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(`tel:${userData.builder.phone}`)}
                title="전화걸기"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
              </motion.button>
              <motion.button
                className="p-2 bg-white/20 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // 상담 예약 모달 열기
                }}
                title="상담 예약"
              >
                <Calendar className="w-3.5 h-3.5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;