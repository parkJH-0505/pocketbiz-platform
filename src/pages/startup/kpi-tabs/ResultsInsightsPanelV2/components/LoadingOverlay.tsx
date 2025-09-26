/**
 * Enhanced Loading States for V2 Dashboard
 * 개선된 로딩 상태 및 스켈레톤 스크린
 */

import React from 'react';
import { motion } from 'framer-motion';

interface LoadingOverlayProps {
  message?: string;
  submessage?: string;
  progress?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = '데이터 로딩 중',
  submessage = '잠시만 기다려주세요...',
  progress
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-8 shadow-xl border border-neutral-light max-w-sm w-full mx-4"
      >
        <div className="flex flex-col items-center">
          {/* 개선된 로딩 애니메이션 */}
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 border-4 border-neutral-light rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-primary-main rounded-full border-t-transparent border-r-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* 메시지 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-center"
          >
            <div className="text-lg font-semibold text-neutral-dark">{message}</div>
            <div className="text-sm text-neutral-gray mt-1">{submessage}</div>
          </motion.div>

          {/* 진행률 표시 (옵션) */}
          {progress !== undefined && (
            <div className="w-full mt-4">
              <div className="flex justify-between text-xs text-neutral-gray mb-1">
                <span>진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-primary-main rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* 단순한 도트 애니메이션 */}
          {progress === undefined && (
            <div className="flex gap-1 mt-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-main rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut'
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// 스켈레톤 스크린 컴포넌트
export const SkeletonCard: React.FC<{ className?: string; lines?: number }> = ({
  className = '',
  lines = 3
}) => {
  return (
    <div className={`bg-white rounded-lg border border-neutral-light p-6 ${className}`}>
      {/* 헤더 스켈레톤 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-light rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-neutral-light rounded animate-pulse" />
            <div className="h-3 w-16 bg-neutral-light rounded animate-pulse" />
          </div>
        </div>
        <div className="w-16 h-6 bg-neutral-light rounded animate-pulse" />
      </div>

      {/* 컨텐츠 라인들 */}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-neutral-light rounded animate-pulse" style={{ width: `${Math.random() * 30 + 70}%` }} />
            {i < lines - 1 && <div className="h-3 bg-neutral-light rounded animate-pulse" style={{ width: `${Math.random() * 40 + 40}%` }} />}
          </div>
        ))}
      </div>

      {/* 하단 액션 영역 */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-light">
        <div className="h-6 w-20 bg-neutral-light rounded animate-pulse" />
        <div className="h-8 w-16 bg-neutral-light rounded animate-pulse" />
      </div>
    </div>
  );
};

// 레이더 차트 스켈레톤
export const RadarSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-neutral-light p-6">
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          {/* 외부 원 */}
          <div className="w-64 h-64 border-2 border-neutral-light rounded-full animate-pulse" />

          {/* 내부 원들 */}
          <div className="absolute inset-8 border border-neutral-light rounded-full animate-pulse" />
          <div className="absolute inset-16 border border-neutral-light rounded-full animate-pulse" />
          <div className="absolute inset-24 border border-neutral-light rounded-full animate-pulse" />

          {/* 축 라인들 */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const x = Math.cos(angle) * 128;
            const y = Math.sin(angle) * 128;
            return (
              <div
                key={i}
                className="absolute w-px h-32 bg-neutral-light animate-pulse"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 72}deg)`,
                  transformOrigin: '50% 100%'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 하단 설명 */}
      <div className="mt-4 text-center">
        <div className="h-6 w-32 bg-neutral-light rounded animate-pulse mx-auto mb-2" />
        <div className="h-4 w-48 bg-neutral-light rounded animate-pulse mx-auto" />
      </div>
    </div>
  );
};

// 인사이트 스켈레톤
export const InsightsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <div className="h-6 w-32 bg-neutral-light rounded animate-pulse" />
          <div className="h-4 w-48 bg-neutral-light rounded animate-pulse" />
        </div>
        <div className="h-8 w-24 bg-neutral-light rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-neutral-light rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-light rounded-lg animate-pulse" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-neutral-light rounded animate-pulse" />
                  <div className="h-3 w-20 bg-neutral-light rounded animate-pulse" />
                </div>
              </div>
              <div className="w-12 h-5 bg-neutral-light rounded-full animate-pulse" />
            </div>

            <div className="space-y-2 mb-3">
              <div className="h-3 bg-neutral-light rounded animate-pulse" />
              <div className="h-3 bg-neutral-light rounded animate-pulse" style={{ width: '80%' }} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neutral-light rounded animate-pulse" />
                <div className="w-12 h-4 bg-neutral-light rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};