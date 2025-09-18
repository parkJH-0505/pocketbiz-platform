/**
 * Profile Card Component
 *
 * 신용카드 스타일의 ID카드형 프로필 컴포넌트
 * - 성장 단계 (A-1~5, S-1~5)
 * - KPI 총점 및 순위
 * - 담당 빌더 정보
 * - 빠른 액션 버튼
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star,
  Phone,
  MessageCircle,
  Calendar,
  Award,
  Target,
  ChevronRight,
  User,
  Building2,
  Zap
} from 'lucide-react';

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
  const [isFlipped, setIsFlipped] = useState(false);
  const isLoading = false;

  // Mock 데이터 (실제로는 useDashboard나 사용자 컨텍스트에서 가져옴)
  const mockUserData = {
    stage: 'A-4' as keyof typeof STAGE_INFO,
    sector: 'S-1' as keyof typeof SECTOR_INFO,
    kpiScore: 73.2,
    percentile: 25, // 상위 25%
    strongestAxis: 'GO',
    builder: {
      name: '김성장',
      role: '성장전문가',
      phone: '010-1234-5678',
      email: 'growth@pocketbiz.co.kr'
    }
  };

  const stageInfo = STAGE_INFO[mockUserData.stage];
  const sectorInfo = SECTOR_INFO[mockUserData.sector];

  if (isLoading) {
    return (
      <div className={`w-full h-24 bg-gray-200 rounded-lg animate-pulse ${className}`} />
    );
  }

  return (
    <div className={`perspective-1000 ${className}`}>
      <motion.div
        className="relative w-full h-24 preserve-3d cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 앞면 - 메인 정보 */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <div className="p-3 h-24 bg-gradient-to-br from-primary-main to-primary-dark rounded-lg shadow-md flex flex-col justify-between relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute top-1 right-1 w-8 h-8 bg-white/10 rounded-full blur-sm" />
            <div className="absolute bottom-1 left-1 w-6 h-6 bg-white/10 rounded-full blur-sm" />

            {/* 상단 정보 */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm">{stageInfo.icon}</span>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-white font-semibold text-sm">
                      {mockUserData.stage}-{mockUserData.sector}
                    </span>
                    <span className="px-1 py-0.5 bg-white/20 text-white text-[10px] rounded-full">
                      PRO
                    </span>
                  </div>
                  <p className="text-white/80 text-[10px] leading-tight">{stageInfo.label}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-300" />
                  <span className="text-white font-semibold text-sm">
                    {mockUserData.kpiScore}
                  </span>
                </div>
                <p className="text-white/80 text-[10px]">KPI 총점</p>
              </div>
            </div>

            {/* 하단 정보 */}
            <div className="flex items-end justify-between relative z-10">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-white/70" />
                <span className="text-white font-medium text-xs">
                  {mockUserData.builder.name}
                </span>
              </div>

              {/* 호버 시에만 나타나는 버튼들 */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1">
                <motion.button
                  className="p-1 bg-white/20 rounded backdrop-blur-sm hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`tel:${mockUserData.builder.phone}`);
                  }}
                >
                  <Phone className="w-3 h-3 text-white" />
                </motion.button>
                <motion.button
                  className="p-1 bg-white/20 rounded backdrop-blur-sm hover:bg-white/30 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // 상담 예약 모달 열기
                  }}
                >
                  <Calendar className="w-3 h-3 text-white" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* 뒤면 - 상세 정보 */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <div className="p-3 h-24 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col justify-between relative">
            {/* 상세 KPI 정보 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 text-xs">KPI 상세</h3>
                <span className="text-[10px] text-gray-500">최근 진단</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">강점 축</span>
                  <div className="flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 text-blue-600" />
                    <span className="text-[10px] font-medium text-blue-600">
                      {mockUserData.strongestAxis}축
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">개선률</span>
                  <span className="text-[10px] font-medium text-green-600">+12.3%</span>
                </div>
              </div>
            </div>

            {/* 빠른 액션 */}
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-1 text-left hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-2.5 h-2.5 text-blue-600" />
                  <span className="text-[10px] font-medium">상담 예약</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
              </button>

              <button className="w-full flex items-center justify-between p-1 text-left hover:bg-gray-50 rounded transition-colors">
                <div className="flex items-center gap-1">
                  <Target className="w-2.5 h-2.5 text-green-600" />
                  <span className="text-[10px] font-medium">KPI 상세보기</span>
                </div>
                <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default ProfileCard;