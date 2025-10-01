/**
 * SimplifiedResultsView - 사용자 중심의 간단한 KPI 결과 뷰
 * 복잡한 기능 대신 명확한 결과와 액션에 집중
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  Star
} from 'lucide-react';
import { useV2Store } from '../store/useV2Store';
import type { AxisKey } from '../types';

interface SimplifiedResultsViewProps {
  className?: string;
  onAdvancedModeClick?: () => void;
}

interface KPIAnalysis {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeColor: string;
  gradeLabel: string;
  strongestArea: {
    key: AxisKey;
    name: string;
    score: number;
    icon: string;
  };
  weakestArea: {
    key: AxisKey;
    name: string;
    score: number;
    icon: string;
  };
  urgentActions: string[];
  trend: 'improving' | 'declining' | 'stable';
  trendIcon: React.ReactNode;
}

export const SimplifiedResultsView: React.FC<SimplifiedResultsViewProps> = ({
  className = '',
  onAdvancedModeClick
}) => {
  const { data } = useV2Store();
  const [showDetails, setShowDetails] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const scores = data?.current.scores || {
    GO: 0, EC: 0, PT: 0, PF: 0, TO: 0
  };

  const axisNames = {
    GO: '성장·운영',
    EC: '경제성·자본',
    PT: '제품·기술력',
    PF: '증빙·딜레디',
    TO: '팀·조직'
  };

  const axisIcons = {
    GO: '🚀',
    EC: '💰',
    PT: '⚡',
    PF: '📋',
    TO: '👥'
  };

  // KPI 분석 계산
  const analysis = useMemo((): KPIAnalysis => {
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);

    // 등급 계산
    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    let gradeColor: string;
    let gradeLabel: string;

    if (overall >= 90) {
      grade = 'A';
      gradeColor = 'text-green-600 bg-green-100';
      gradeLabel = '우수';
    } else if (overall >= 80) {
      grade = 'B';
      gradeColor = 'text-blue-600 bg-blue-100';
      gradeLabel = '양호';
    } else if (overall >= 70) {
      grade = 'C';
      gradeColor = 'text-yellow-600 bg-yellow-100';
      gradeLabel = '보통';
    } else if (overall >= 60) {
      grade = 'D';
      gradeColor = 'text-orange-600 bg-orange-100';
      gradeLabel = '주의';
    } else {
      grade = 'F';
      gradeColor = 'text-red-600 bg-red-100';
      gradeLabel = '위험';
    }

    // 최고/최저 영역
    const entries = Object.entries(scores) as [AxisKey, number][];
    const sortedByScore = entries.sort((a, b) => b[1] - a[1]);

    const strongestArea = {
      key: sortedByScore[0][0],
      name: axisNames[sortedByScore[0][0]],
      score: sortedByScore[0][1],
      icon: axisIcons[sortedByScore[0][0]]
    };

    const weakestArea = {
      key: sortedByScore[sortedByScore.length - 1][0],
      name: axisNames[sortedByScore[sortedByScore.length - 1][0]],
      score: sortedByScore[sortedByScore.length - 1][1],
      icon: axisIcons[sortedByScore[sortedByScore.length - 1][0]]
    };

    // 긴급 액션 생성
    const urgentActions: string[] = [];

    if (weakestArea.score < 50) {
      urgentActions.push(`${weakestArea.name} 영역 즉시 개선 필요`);
    }

    if (overall < 70) {
      urgentActions.push('전반적인 KPI 향상 계획 수립');
    }

    entries.forEach(([key, score]) => {
      if (score < 60) {
        switch(key) {
          case 'GO':
            urgentActions.push('성장 전략 재검토 및 운영 효율화');
            break;
          case 'EC':
            urgentActions.push('재무구조 개선 및 투자 계획 수립');
            break;
          case 'PT':
            urgentActions.push('기술 역량 강화 및 제품 고도화');
            break;
          case 'PF':
            urgentActions.push('IR 자료 보완 및 실적 문서화');
            break;
          case 'TO':
            urgentActions.push('조직 문화 개선 및 팀 역량 강화');
            break;
        }
      }
    });

    // 트렌드 (변화 데이터가 있다면)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendIcon = <TrendingUp className="w-4 h-4 text-gray-500" />;

    if (data?.changes) {
      const totalChange = Object.values(data.changes).reduce((sum, change) => sum + change, 0);
      if (totalChange > 2) {
        trend = 'improving';
        trendIcon = <TrendingUp className="w-4 h-4 text-green-500" />;
      } else if (totalChange < -2) {
        trend = 'declining';
        trendIcon = <TrendingDown className="w-4 h-4 text-red-500" />;
      }
    }

    return {
      overall,
      grade,
      gradeColor,
      gradeLabel,
      strongestArea,
      weakestArea,
      urgentActions: urgentActions.slice(0, 3), // 최대 3개
      trend,
      trendIcon
    };
  }, [scores, data, axisNames, axisIcons]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Level 1: 즉시 이해 섹션 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        {/* 메인 결과 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className={`px-4 py-2 rounded-full font-bold text-2xl ${analysis.gradeColor}`}>
              {analysis.grade}등급
            </div>
            <div className="flex items-center gap-1">
              {analysis.trendIcon}
              <span className="text-sm text-gray-600">
                {analysis.trend === 'improving' ? '개선 중' :
                 analysis.trend === 'declining' ? '하락 중' : '안정'}
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {analysis.overall}점 ({analysis.gradeLabel})
          </h2>

          <p className="text-gray-600">
            우리 회사 KPI 종합 건강도
          </p>
        </div>

        {/* 핵심 인사이트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 강점 영역 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">가장 잘하는 부분</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{analysis.strongestArea.icon}</span>
              <div>
                <div className="font-medium text-green-900">
                  {analysis.strongestArea.name}
                </div>
                <div className="text-lg font-bold text-green-700">
                  {Math.round(analysis.strongestArea.score)}점
                </div>
              </div>
            </div>
          </div>

          {/* 개선 필요 영역 */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">가장 시급한 문제</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{analysis.weakestArea.icon}</span>
              <div>
                <div className="font-medium text-red-900">
                  {analysis.weakestArea.name}
                </div>
                <div className="text-lg font-bold text-red-700">
                  {Math.round(analysis.weakestArea.score)}점
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 이번 주 할 일 */}
        {analysis.urgentActions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">이번 주 우선 과제</span>
            </div>
            <div className="space-y-2">
              {analysis.urgentActions.map((action, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-blue-900 text-sm">{action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            영역별 상세 분석
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowRoadmap(!showRoadmap)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Target className="w-4 h-4" />
            개선 로드맵
            {showRoadmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Level 2: 상세 분석 (펼침) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">영역별 상세 점수</h3>

            <div className="space-y-4">
              {Object.entries(scores).map(([key, score]) => {
                const axisKey = key as AxisKey;
                const name = axisNames[axisKey];
                const icon = axisIcons[axisKey];

                let statusColor = 'bg-gray-200';
                let statusIcon = null;
                let statusText = '보통';

                if (score >= 80) {
                  statusColor = 'bg-green-500';
                  statusIcon = <CheckCircle className="w-4 h-4 text-green-600" />;
                  statusText = '우수';
                } else if (score >= 70) {
                  statusColor = 'bg-blue-500';
                  statusIcon = <TrendingUp className="w-4 h-4 text-blue-600" />;
                  statusText = '양호';
                } else if (score >= 60) {
                  statusColor = 'bg-yellow-500';
                  statusIcon = <Clock className="w-4 h-4 text-yellow-600" />;
                  statusText = '주의';
                } else {
                  statusColor = 'bg-red-500';
                  statusIcon = <AlertTriangle className="w-4 h-4 text-red-600" />;
                  statusText = '위험';
                }

                return (
                  <div key={key} className="flex items-center gap-4">
                    <div className="flex items-center gap-3 w-32">
                      <span className="text-xl">{icon}</span>
                      <span className="font-medium text-gray-900 text-sm">{name}</span>
                    </div>

                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className={`${statusColor} h-4 rounded-full transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-2 w-20">
                      {statusIcon}
                      <span className="font-bold text-gray-900">{Math.round(score)}점</span>
                    </div>

                    <div className="w-12 text-xs text-gray-600">
                      {statusText}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level 3: 개선 로드맵 (펼침) */}
      <AnimatePresence>
        {showRoadmap && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">3개월 개선 로드맵</h3>

            <div className="space-y-6">
              {/* 목표 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">3개월 목표</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {Math.round(analysis.overall + 10)}점 달성 (현재 {Math.round(analysis.overall)}점 → 목표 {Math.round(analysis.overall + 10)}점)
                </div>
              </div>

              {/* 단계별 계획 */}
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-red-800 mb-2">🚨 1개월차 (긴급)</h4>
                  <ul className="space-y-1 text-sm text-red-700">
                    <li>• {analysis.weakestArea.name} 영역 집중 개선 ({Math.round(analysis.weakestArea.score)}점 → {Math.round(analysis.weakestArea.score + 15)}점 목표)</li>
                    <li>• 즉시 실행 가능한 개선 사항 적용</li>
                    <li>• 전문가 컨설팅 또는 외부 자원 활용</li>
                  </ul>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ 2개월차 (개선)</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>• 중간 점검 및 전략 조정</li>
                    <li>• 60점 미만 영역들 순차 개선</li>
                    <li>• 내부 프로세스 정비</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-green-800 mb-2">✅ 3개월차 (최적화)</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• {analysis.strongestArea.name} 강점 극대화 ({Math.round(analysis.strongestArea.score)}점 → 90점 목표)</li>
                    <li>• 전체 영역 균형 조정</li>
                    <li>• 지속 가능한 관리 시스템 구축</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 고급 도구 링크 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">더 자세한 분석이 필요하세요?</h4>
            <p className="text-sm text-gray-600">고급 분석 도구와 시뮬레이션 기능을 사용해보세요</p>
          </div>
          <button
            onClick={onAdvancedModeClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            <Zap className="w-4 h-4" />
            고급 도구 보기
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};