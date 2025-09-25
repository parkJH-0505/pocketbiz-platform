/**
 * Weekly VC Recommendation Component (Horizontal Scroll)
 *
 * 가로 스크롤 VC 추천 컴포넌트
 * - 한 명씩 표시하며 가로 스크롤/스와이프
 * - 교육적/정보성 톤앤매너
 * - 성공 포트폴리오 중심 소개
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Award,
  ExternalLink,
  Heart,
  Sparkles,
  Clock,
  Quote,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

interface WeeklyVCRecommendationProps {
  className?: string;
}

const WeeklyVCRecommendation: React.FC<WeeklyVCRecommendationProps> = ({ className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interestedVCs, setInterestedVCs] = useState<Set<number>>(new Set());
  const { addNotification } = useNotifications();

  // 여러 명의 VC 데이터 (실제로는 API에서 가져와야 함)
  const vcList = [
    {
      id: 1,
      name: '김벤처',
      fund: 'Kakao Ventures',
      specialty: '창업자의 마음을 읽는 투자자',
      touchingPoint: '새벽 3시까지 창업자와 함께 고민하는 파트너',
      successStories: ['당근마켓', '토스', '마켓컬리'],
      funFact: '투자 결정까지 평균 2주, 투자 후 월 1회 이상 만남',
      philosophy: '"좋은 사업보다 좋은 사람을 먼저 본다"',
      investmentStage: 'Seed ~ Series A',
      avgInvestment: '3~10억원',
      focus: ['AI/ML', '커머스', 'SaaS'],
      contact: {
        email: 'venture.kim@kakaoventures.com',
        linkedin: 'https://linkedin.com/in/venturekim'
      }
    },
    {
      id: 2,
      name: '이스타트',
      fund: 'Naver D2SF',
      specialty: '기술 기반 스타트업 전문가',
      touchingPoint: '제품 론칭부터 스케일업까지 함께하는 멘토',
      successStories: ['하이퍼커넥트', '타이탄', '세븐포인트원'],
      funFact: '포트폴리오사에 CTO 출신 인재 배치, 기술 지원 적극적',
      philosophy: '"기술로 세상을 바꾸는 팀을 찾는다"',
      investmentStage: 'Pre-Seed ~ Series A',
      avgInvestment: '2~8억원',
      focus: ['DeepTech', 'B2B SaaS', 'Developer Tools'],
      contact: {
        email: 'start.lee@naverd2sf.com',
        linkedin: 'https://linkedin.com/in/startlee'
      }
    },
    {
      id: 3,
      name: '박액셀',
      fund: 'Softbank Ventures',
      specialty: '글로벌 스케일업 전문가',
      touchingPoint: '해외 진출을 꿈꾸는 스타트업의 든든한 지원군',
      successStories: ['쿠팡', '야놀자', '토스페이먼츠'],
      funFact: '실리콘밸리 네트워크 활용, 글로벌 파트너십 지원',
      philosophy: '"큰 꿈을 가진 팀과 함께 성장한다"',
      investmentStage: 'Series A ~ C',
      avgInvestment: '10~50억원',
      focus: ['커머스', '핀테크', '모빌리티'],
      contact: {
        email: 'accel.park@sbventures.com',
        linkedin: 'https://linkedin.com/in/accelpark'
      }
    },
    {
      id: 4,
      name: '최임팩트',
      fund: 'Primer Sazze Partners',
      specialty: '임팩트 비즈니스 전문가',
      touchingPoint: '사회적 가치와 수익성을 동시에 추구하는 파트너',
      successStories: ['위쿠크', '클래스101', '트립비토즈'],
      funFact: '포트폴리오사 창업자 커뮤니티 운영, 정기 네트워킹',
      philosophy: '"비즈니스로 세상을 더 나은 곳으로"',
      investmentStage: 'Pre-Seed ~ Seed',
      avgInvestment: '1~5억원',
      focus: ['임팩트 테크', '에듀테크', '헬스케어'],
      contact: {
        email: 'impact.choi@primer.kr',
        linkedin: 'https://linkedin.com/in/impactchoi'
      }
    }
  ];

  const currentVC = vcList[currentIndex];
  const isInterested = interestedVCs.has(currentVC.id);

  const handleLearnMore = () => {
    window.open(currentVC.contact.linkedin, '_blank');
  };

  const handleShowInterest = () => {
    const newInterested = new Set(interestedVCs);

    if (!isInterested) {
      newInterested.add(currentVC.id);
      setInterestedVCs(newInterested);
      addNotification({
        type: 'achievement',
        title: '관심 표시 완료! 💫',
        message: `${currentVC.name}님에게 관심을 표시했습니다. 포켓비즈가 기회가 되면 소개해드릴게요!`,
        priority: 'medium'
      });
    } else {
      newInterested.delete(currentVC.id);
      setInterestedVCs(newInterested);
      addNotification({
        type: 'info',
        title: '관심 표시 취소',
        message: `${currentVC.name}님에 대한 관심 표시를 취소했습니다.`,
        priority: 'low'
      });
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % vcList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + vcList.length) % vcList.length);
  };

  return (
    <motion.div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 헤더 */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">이주의 주목할 투자자</h3>
            <span className="text-sm text-gray-600">
              ({currentIndex + 1}/{vcList.length})
            </span>
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 hover:shadow-sm"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* 바디 - 가로 레이아웃 */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentVC.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-6"
          >
            {/* 왼쪽: 아바타 및 기본 정보 */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {currentVC.name.substring(0, 2)}
              </div>
            </div>

            {/* 중앙: VC 정보 */}
            <div className="flex-1">
              {/* 이름 & 펀드 */}
              <div className="mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-bold text-gray-900">{currentVC.name}</span>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{currentVC.fund}</span>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {currentVC.investmentStage}
                  </span>
                </div>
                <p className="text-sm text-purple-600 font-medium italic">
                  💫 {currentVC.touchingPoint}
                </p>
              </div>

              {/* 투자 철학 & 정보 그리드 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex items-start gap-2 mb-3">
                    <Quote className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-700 font-medium leading-relaxed">
                      {currentVC.philosophy}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      {currentVC.funFact}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-gray-700 font-medium">
                      평균 투자금: {currentVC.avgInvestment}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">
                      {currentVC.successStories.join(', ')} 등
                    </span>
                  </div>
                </div>
              </div>

              {/* 포커스 영역 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {currentVC.focus.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            {/* 오른쪽: 액션 버튼 */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              <button
                onClick={handleLearnMore}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                더 알아보기
              </button>
              <button
                onClick={handleShowInterest}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                  isInterested
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${isInterested ? 'fill-current' : ''}`} />
                {isInterested ? '관심있음' : '관심표시'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 인디케이터 */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-center gap-2">
          {vcList.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'w-8 bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklyVCRecommendation;