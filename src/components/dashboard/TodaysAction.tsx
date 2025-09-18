/**
 * TodaysAction Component
 *
 * 실제 KPI 데이터 기반 개인화된 액션 제안 컴포넌트
 * - 스마트 알고리즘: 40개 이상 요소 고려한 액션 선택
 * - 완료 추적: 사용자 패턴 학습 및 개인화
 * - 피드백 루프: 실시간 난이도 및 시간 조정
 * - 긍정적 UX: 압박감 없는 격려 메시지
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Target, Clock, TrendingUp, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

// 컨텍스트 및 유틸리티
import { useDashboard } from '../../contexts/DashboardContext';
import { trackActionStart, getUserPattern } from '../../utils/dashboard/actionTracker';

const TodaysAction: React.FC = () => {
  const { todaysAction, isLoading, markActionCompleted } = useDashboard();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const handleActionClick = useCallback(async () => {
    if (!todaysAction || isStarting) return;

    try {
      setIsStarting(true);

      // 1. 액션 추적 시작
      trackActionStart(todaysAction);

      // 2. 시각적 피드백 (짧은 지연)
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. 페이지 이동
      navigate(todaysAction.actionUrl);

    } catch (error) {
      console.error('액션 시작 중 오류:', error);
    } finally {
      setIsStarting(false);
    }
  }, [todaysAction, navigate, isStarting]);

  const getDifficultyInfo = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { text: '쉬움', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
      case 'medium':
        return { text: '보통', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Target };
      case 'hard':
        return { text: '도전', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Sparkles };
      default:
        return { text: '보통', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Target };
    }
  };

  // 개인화 메시지 생성
  const getPersonalizedMessage = () => {
    const userPattern = getUserPattern();

    if (userPattern.completionStreak >= 3) {
      return `${userPattern.completionStreak}회 연속 완료 중! 이 멘텀을 이어가세요 🔥`;
    }

    if (userPattern.totalActions === 0) {
      return '첫 번째 성장 액션을 시작해보세요 ✨';
    }

    return '작은 한 걸음이 큰 변화를 만들어요 ✨';
  };

  // 로딩 또는 액션이 없는 경우
  if (isLoading || !todaysAction) {
    return (
      <div className="w-full bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            최적의 액션을 찾고 있어요
          </h2>
          <p className="text-sm text-gray-500">
            KPI 데이터를 분석하여 가장 효과적인 액션을 준비하고 있습니다
          </p>
        </div>
      </div>
    );
  }

  const difficultyInfo = getDifficultyInfo(todaysAction.impact.difficulty);
  const DifficultyIcon = difficultyInfo.icon;

  return (
    <motion.div
      className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      data-tour="todays-action"
    >
      <div className="text-center">
        {/* 아이콘 */}
        <motion.div
          className="text-4xl mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          🎯
        </motion.div>

        {/* 메인 타이틀 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          오늘은 이것만 하세요
        </h2>

        {/* 액션 제목 */}
        <div className="text-xl text-gray-800 mb-2 font-semibold">
          {todaysAction.title}
        </div>

        {/* 액션 설명 */}
        <div className="text-sm text-gray-600 mb-4">
          {todaysAction.description}
        </div>

        {/* 메타 정보 */}
        <div className="flex items-center justify-center gap-6 text-sm mb-6 flex-wrap">
          {/* 동기부여 메시지 */}
          <div className="flex items-center gap-2 text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{todaysAction.motivation}</span>
          </div>

          {/* 예상 시간 */}
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>예상 {todaysAction.estimatedTime}</span>
          </div>

          {/* 난이도 */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${difficultyInfo.bgColor} ${difficultyInfo.color}`}>
            <DifficultyIcon className="w-3 h-3" />
            <span>{difficultyInfo.text}</span>
          </div>
        </div>

        {/* 신뢰도 표시 (높은 신뢰도일 때만) */}
        {todaysAction.impact.confidence >= 0.8 && (
          <motion.div
            className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                성공 확률 {Math.round(todaysAction.impact.confidence * 100)}% - 추천 액션
              </span>
            </div>
          </motion.div>
        )}

        {/* 액션 버튼 */}
        <AnimatePresence mode="wait">
          <motion.button
            key={isStarting ? 'starting' : 'ready'}
            onClick={handleActionClick}
            disabled={isStarting}
            className={`
              px-8 py-3 rounded-lg font-semibold transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isStarting
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
            whileHover={!isStarting ? { scale: 1.02 } : {}}
            whileTap={!isStarting ? { scale: 0.98 } : {}}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isStarting ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                시작하는 중...
              </div>
            ) : (
              '지금 시작하기'
            )}
          </motion.button>
        </AnimatePresence>

        {/* 개인화된 격려 메시지 */}
        <motion.p
          className="mt-4 text-xs text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {getPersonalizedMessage()}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default TodaysAction;