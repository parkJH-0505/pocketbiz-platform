/**
 * Weekly VC Recommendation Component (Compact)
 *
 * 컴팩트한 주간 VC 추천 컴포넌트
 * - 교육적/정보성 톤앤매너
 * - 성공 포트폴리오 중심 소개
 * - 1/4 사이즈로 간소화
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Building2,
  MessageCircle,
  BookOpen,
  Award,
  ExternalLink,
  Heart,
  Sparkles,
  Clock,
  Quote
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

interface WeeklyVCRecommendationProps {
  className?: string;
}

const WeeklyVCRecommendation: React.FC<WeeklyVCRecommendationProps> = ({ className = '' }) => {
  const [isInterested, setIsInterested] = useState(false);
  const { addNotification } = useNotifications();

  // 컴팩트 VC 데이터 - 더 touching하고 흥미로운 버전
  const weeklyVC = {
    name: '김벤처',
    fund: 'Kakao Ventures',
    specialty: '창업자의 마음을 읽는 투자자',
    touchingPoint: '새벽 3시까지 창업자와 함께 고민하는 파트너',
    successStories: ['당근마켓', '토스', '마켓컬리'],
    funFact: '투자 결정까지 평균 2주, 투자 후 월 1회 이상 만남',
    philosophy: '"좋은 사업보다 좋은 사람을 먼저 본다"',
    contact: {
      email: 'venture.kim@kakaoventures.com',
      linkedin: 'https://linkedin.com/in/venturekim'
    }
  };

  const handleLearnMore = () => {
    window.open(weeklyVC.contact.linkedin, '_blank');
  };

  const handleShowInterest = () => {
    setIsInterested(!isInterested);
    if (!isInterested) {
      // 관심 표시 로직 (VDR 연동 등)
      addNotification({
        type: 'achievement',
        title: '관심 표시 완료! 💫',
        message: `${weeklyVC.name}님에게 관심을 표시했습니다. 포켓비즈가 기회가 되면 소개해드릴게요!`,
        priority: 'medium'
      });
    } else {
      addNotification({
        type: 'info',
        title: '관심 표시 취소',
        message: `${weeklyVC.name}님에 대한 관심 표시를 취소했습니다.`,
        priority: 'low'
      });
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 좌우 레이아웃: 왼쪽 정보 + 오른쪽 버튼 */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* 왼쪽: VC 정보 */}
          <div className="flex items-start gap-4 flex-1">
            {/* 아바타 */}
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0">
              {weeklyVC.name.substring(0, 2)}
            </div>

            {/* 정보 */}
            <div className="flex-1 min-w-0">
              {/* 헤더 라인 */}
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <span className="text-base font-semibold text-gray-900">이주의 주목할 투자자</span>
              </div>

              {/* VC 이름 & 펀드 */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-gray-900">{weeklyVC.name}</span>
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{weeklyVC.fund}</span>
                </div>
                <p className="text-sm text-purple-600 font-medium italic leading-relaxed">
                  💫 {weeklyVC.touchingPoint}
                </p>
              </div>

              {/* 투자 철학 */}
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-700 font-medium leading-relaxed">{weeklyVC.philosophy}</span>
                </div>
              </div>

              {/* 재미있는 팩트 */}
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600 leading-relaxed">{weeklyVC.funFact}</span>
                </div>
              </div>

              {/* 성공사례 */}
              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-600 leading-relaxed">
                  {weeklyVC.successStories.slice(0, 2).join(', ')} 등을 성공시킨 투자자
                </span>
              </div>
            </div>
          </div>

          {/* 오른쪽: 액션 버튼 */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button
              onClick={handleLearnMore}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <ExternalLink className="w-4 h-4" />
              더 알아보기
            </button>
            <button
              onClick={handleShowInterest}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${
                isInterested
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
              {isInterested ? '관심있음' : '관심표시'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyVCRecommendation;