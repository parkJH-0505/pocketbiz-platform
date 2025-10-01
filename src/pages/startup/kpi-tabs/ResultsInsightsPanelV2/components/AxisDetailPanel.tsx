/**
 * AxisDetailPanel Component
 * 축 클릭 시 나타나는 상세 정보 패널
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { axisInfo } from '../utils/mockApi';
import type { AxisKey } from '../types';

interface AxisDetailPanelProps {
  selectedAxis: AxisKey | null;
  onClose: () => void;
  scores: Record<AxisKey, number>;
  className?: string;
}

export const AxisDetailPanel: React.FC<AxisDetailPanelProps> = ({
  selectedAxis,
  onClose,
  scores,
  className = ''
}) => {
  if (!selectedAxis) return null;

  const axisData = axisInfo[selectedAxis];
  const currentScore = scores[selectedAxis] || 0;
  const previousScore = currentScore - (Math.random() * 10 - 5); // 모의 이전 점수
  const scoreChange = currentScore - previousScore;
  const isImproving = scoreChange > 0;

  // 개선 제안사항 생성
  const improvements = [
    "핵심 지표 모니터링 강화",
    "정기적인 성과 리뷰 실시",
    "팀원 역량 개발 프로그램 도입",
    "프로세스 자동화 검토"
  ];

  // 위험 요소 생성
  const risks = [
    { level: 'high', text: '예산 초과 위험' },
    { level: 'medium', text: '일정 지연 가능성' },
    { level: 'low', text: '리소스 부족' }
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto ${className}`}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-main to-primary-dark p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{axisData.name}</h2>
              <p className="text-primary-light text-sm mt-1">{axisData.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* 현재 점수 */}
          <div className="mt-4 flex items-center gap-4">
            <div className="text-3xl font-bold">{Math.round(currentScore)}</div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
              isImproving ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
              {isImproving ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{scoreChange > 0 ? '+' : ''}{Math.round(scoreChange)}</span>
            </div>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 성과 분석 */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Target size={18} className="text-primary-main" />
              성과 분석
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">목표</span>
                  <div className="font-semibold">80.0</div>
                </div>
                <div>
                  <span className="text-gray-600">달성률</span>
                  <div className="font-semibold">{Math.round((currentScore / 80) * 100)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">평균</span>
                  <div className="font-semibold">65.2</div>
                </div>
                <div>
                  <span className="text-gray-600">상위 %</span>
                  <div className="font-semibold">78%</div>
                </div>
              </div>
            </div>
          </section>

          {/* 주요 KPI */}
          <section>
            <h3 className="text-lg font-semibold mb-3">주요 KPI</h3>
            <div className="space-y-3">
              {axisData.kpis.slice(0, 3).map((kpi, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{kpi}</span>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              ))}
            </div>
          </section>

          {/* 개선 제안 */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-green-600" />
              개선 제안
            </h3>
            <div className="space-y-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-800">{improvement}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 위험 요소 */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600" />
              위험 요소
            </h3>
            <div className="space-y-2">
              {risks.map((risk, index) => (
                <div key={index} className={`p-3 rounded-lg ${getRiskColor(risk.level)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{risk.text}</span>
                    <span className="text-xs uppercase tracking-wide">
                      {risk.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 액션 버튼 */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <button className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors">
                액션 플랜 생성
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                상세 분석
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 배경 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 z-40"
      />
    </AnimatePresence>
  );
};