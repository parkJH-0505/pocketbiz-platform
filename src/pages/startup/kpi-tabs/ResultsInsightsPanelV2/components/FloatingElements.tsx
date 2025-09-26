/**
 * Floating Elements Component for V2 Dashboard
 * 플로팅 요소들 - AI 챗봇, FAB, 알림
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  HelpCircle,
  ChevronUp,
  Sparkles,
  Trophy,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';

export const FloatingElements: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFabExpanded, setIsFabExpanded] = useState(false);
  const { viewState } = useV2Store();

  return (
    <>
      {/* AI Chat Assistant */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl z-50"
          >
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} />
                  <span className="font-semibold">AI 인사이트 어시스턴트</span>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto h-[calc(100%-120px)]">
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm">
                    안녕하세요! KPI 점수를 분석해드릴게요. 🎯
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm">
                    현재 <strong>제품·기술력(PT)</strong> 점수가 가장 높네요!
                    이는 제품 완성도와 기술 역량이 우수하다는 의미입니다.
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm">
                    💡 <strong>개선 제안:</strong> 경제성·자본(EC) 점수를 개선하면
                    전체 점수가 크게 향상될 것으로 예상됩니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="질문을 입력하세요..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  전송
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {isFabExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-2 space-y-2"
            >
              <button
                onClick={() => setIsChatOpen(true)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors w-full"
              >
                <MessageCircle size={18} />
                <span className="text-sm">AI 챗봇</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors w-full">
                <Trophy size={18} />
                <span className="text-sm">업적 확인</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors w-full">
                <TrendingUp size={18} />
                <span className="text-sm">트렌드 분석</span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded transition-colors w-full">
                <HelpCircle size={18} />
                <span className="text-sm">도움말</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFabExpanded(!isFabExpanded)}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        >
          <motion.div
            animate={{ rotate: isFabExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isFabExpanded ? '✕' : '✨'}
          </motion.div>
        </motion.button>
      </div>

      {/* Achievement Notification */}
      <AnimatePresence>
        {Math.random() > 0.8 && ( // Temporary random trigger for demo
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-24 right-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <Trophy size={24} />
              <div>
                <div className="font-semibold">새로운 업적 달성!</div>
                <div className="text-sm opacity-90">첫 시뮬레이션 완료</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-6 left-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow z-40"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ChevronUp size={20} />
      </motion.button>

      {/* Risk Alert (Conditional) */}
      {viewState.selectedAxis === 'EC' && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-lg z-50"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span className="text-sm">
              경제성 지표가 주의 수준입니다. 개선 방안을 확인해보세요.
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
};