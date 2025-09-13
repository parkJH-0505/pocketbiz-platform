import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  CheckCircle, 
  TrendingUp,
  Sparkles,
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingProgressButtonProps {
  currentAxisProgress: number; // 0-100
  isLastAxis: boolean;
  isFirstAxis: boolean;
  onNext: () => void;
  onPrevious: () => void;
  axisName: string;
  nextAxisName?: string;
}

export const FloatingProgressButton: React.FC<FloatingProgressButtonProps> = ({
  currentAxisProgress,
  isLastAxis,
  isFirstAxis,
  onNext,
  onPrevious,
  axisName,
  nextAxisName
}) => {
  const [showComplete, setShowComplete] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (currentAxisProgress === 100 && !showComplete) {
      setShowComplete(true);
      setJustCompleted(true);
      // 2초 후 완료 메시지 숨기기
      setTimeout(() => setJustCompleted(false), 2000);
    } else if (currentAxisProgress < 100) {
      setShowComplete(false);
      setJustCompleted(false);
    }
  }, [currentAxisProgress, showComplete]);

  // 진행률에 따른 색상 계산
  const getGradientColors = () => {
    if (currentAxisProgress === 0) return 'from-gray-300 to-gray-500';
    if (currentAxisProgress < 25) return 'from-gray-400 to-gray-600';
    if (currentAxisProgress < 50) return 'from-blue-300 to-blue-500';
    if (currentAxisProgress < 75) return 'from-blue-400 to-blue-600';
    if (currentAxisProgress < 100) return 'from-primary-light to-primary-main';
    return 'from-green-400 to-green-600';
  };

  // 진행률에 따른 아이콘 선택
  const getIcon = () => {
    if (currentAxisProgress === 100) {
      return isLastAxis ? <Trophy size={24} /> : <Sparkles size={24} />;
    }
    if (currentAxisProgress >= 75) return <TrendingUp size={24} />;
    if (currentAxisProgress >= 50) return <ArrowLeft size={24} />;
    return <ChevronLeft size={24} />;
  };

  // 버튼 텍스트
  const getButtonText = () => {
    if (currentAxisProgress === 100) {
      return isLastAxis ? '결과' : '다음';
    }
    return `${currentAxisProgress}%`;
  };

  return (
    <>
      {/* 오른쪽 다음 버튼 (반원 플로팅 버튼) */}
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
      >
        {/* 완료 메시지 */}
        <AnimatePresence>
          {justCompleted && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.9 }}
              className="absolute -left-48 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 
                         bg-gradient-to-r from-green-500 to-emerald-500 text-white 
                         rounded-full shadow-xl whitespace-nowrap"
            >
              <CheckCircle size={20} />
              <span className="font-bold">입력 완료!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 반원 버튼 */}
        <motion.button
          onClick={onNext}
          whileHover={{ scale: 1.05, x: -5 }}
          whileTap={{ scale: 0.95 }}
          className={`
            w-28 h-48 -mr-8 rounded-l-full
            bg-gradient-to-l ${getGradientColors()}
            text-white shadow-2xl transition-all duration-300
            hover:shadow-3xl hover:mr-[-8px]
            flex flex-col items-center justify-center gap-2
            ${currentAxisProgress === 100 ? 'animate-pulse' : ''}
          `}
          animate={
            currentAxisProgress === 100 
              ? {
                  boxShadow: [
                    '0 0 0 0px rgba(34, 197, 94, 0.4)',
                    '0 0 0 20px rgba(34, 197, 94, 0)',
                    '0 0 0 0px rgba(34, 197, 94, 0.4)',
                  ],
                }
              : {}
          }
          transition={
            currentAxisProgress === 100
              ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              : { duration: 0.2 }
          }
        >
          {/* 진행률 표시 */}
          <div className="absolute inset-0 rounded-l-full overflow-hidden">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white/20"
              initial={{ height: '0%' }}
              animate={{ height: `${currentAxisProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="relative z-10 -ml-8 flex flex-col items-center">
            {/* 다음 축 이름 (마지막 축이 아닐 때만) */}
            {!isLastAxis && nextAxisName && (
              <div className="text-xs font-medium opacity-90 mb-1">
                {nextAxisName}
              </div>
            )}
            
            {/* 아이콘 */}
            <motion.div
              animate={currentAxisProgress === 100 ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              {getIcon()}
            </motion.div>
            
            {/* 진행률 또는 상태 텍스트 */}
            <div className="text-lg font-bold mt-1">
              {getButtonText()}
            </div>
          </div>
        </motion.button>

        {/* 호버시 나타나는 툴팁 */}
        <div className="absolute -left-32 top-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="bg-gray-800 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap"
          >
            {currentAxisProgress === 100 
              ? (isLastAxis ? '결과 보기' : '다음 축으로 이동')
              : `${100 - currentAxisProgress}% 남음`
            }
          </motion.div>
        </div>
      </motion.div>

      {/* 완료시 컨페티 효과 */}
      {justCompleted && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: window.innerWidth - 100,
                y: window.innerHeight / 2,
                opacity: 1 
              }}
              animate={{ 
                x: window.innerWidth - 100 - Math.random() * 300,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{ 
                duration: 1,
                delay: i * 0.02,
                ease: "easeOut"
              }}
              className={`absolute w-3 h-3 
                ${i % 3 === 0 ? 'bg-yellow-400' : 
                  i % 3 === 1 ? 'bg-green-400' : 'bg-blue-400'}
              `}
              style={{
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
              }}
            />
          ))}
        </div>
      )}
    </>
  );
};