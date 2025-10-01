/**
 * ExecutiveSummary Component
 * 경영진 요약 - 핵심 메트릭과 Critical Alerts
 */

import React from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { ScoreDisplay } from '../shared/ScoreDisplay';
import { StatusBadge } from '../shared/StatusBadge';
import type {
  ReportMetadata,
  ReportSummary
} from '../../types/reportV3UI.types';
import { SECTOR_NAMES, STAGE_NAMES } from '@/types/reportV3.types';

interface ExecutiveSummaryProps {
  metadata: ReportMetadata;
  summary: ReportSummary;
  quickHighlights: string[];
  criticalAlerts: string[];
  aiGeneratedSummary?: string | null; // AI 생성 요약 (선택적)
  isGeneratingAI?: boolean; // AI 생성 중 여부
  className?: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  metadata,
  summary,
  quickHighlights,
  criticalAlerts,
  aiGeneratedSummary = null,
  isGeneratingAI = false,
  className = ''
}) => {
  const sectorName = SECTOR_NAMES[metadata.cluster.sector as keyof typeof SECTOR_NAMES] || metadata.cluster.sector;
  const stageName = STAGE_NAMES[metadata.cluster.stage as keyof typeof STAGE_NAMES] || metadata.cluster.stage;

  // 메트릭 카드 데이터
  const metricsCards = [
    {
      title: '전체 점수',
      value: summary.overallScore.toFixed(1),
      unit: '점',
      icon: BarChart3,
      color: summary.overallScore >= 70 ? 'text-green-600' : summary.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600',
      bgColor: summary.overallScore >= 70 ? 'bg-green-50' : summary.overallScore >= 50 ? 'bg-yellow-50' : 'bg-red-50',
      description: '100점 만점 기준'
    },
    {
      title: '핵심 지표',
      value: summary.criticalKPIs.toString(),
      unit: '개',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: `총 ${metadata.totalKPIs}개 중`
    },
    {
      title: '완료율',
      value: summary.completionRate.toFixed(1),
      unit: '%',
      icon: CheckCircle,
      color: summary.completionRate >= 90 ? 'text-green-600' : summary.completionRate >= 70 ? 'text-yellow-600' : 'text-red-600',
      bgColor: summary.completionRate >= 90 ? 'bg-green-50' : summary.completionRate >= 70 ? 'bg-yellow-50' : 'bg-red-50',
      description: '진단 완료 비율'
    }
  ];

  return (
    <div className={className}>
      {/* 상단 컨텍스트 정보 */}
      <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <div className="flex items-center gap-2 mb-2">
          <Users size={18} className="text-indigo-600" />
          <span className="font-semibold text-indigo-900">
            {sectorName} • {stageName}
          </span>
        </div>
        <p className="text-sm text-indigo-700">
          해당 업종 및 성장단계 기준으로 평가된 결과입니다.
        </p>
      </div>

      {/* 핵심 메트릭 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metricsCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className={`${metric.bgColor} border border-gray-200 rounded-lg p-6 transition-transform hover:scale-105`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${metric.color} p-2 rounded-lg bg-white bg-opacity-70`}>
                  <Icon size={24} />
                </div>
                <StatusBadge
                  status={
                    index === 0 ? summary.status :
                    index === 1 ? (summary.criticalKPIs > 0 ? 'needs_attention' : 'good') :
                    (summary.completionRate >= 90 ? 'excellent' : summary.completionRate >= 70 ? 'good' : 'needs_attention')
                  }
                  size="sm"
                  variant="outline"
                />
              </div>

              <div className="text-center">
                <div className={`text-3xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                  <span className="text-lg font-normal ml-1">{metric.unit}</span>
                </div>
                <div className="font-medium text-gray-700 mb-1">
                  {metric.title}
                </div>
                <div className="text-xs text-gray-500">
                  {metric.description}
                </div>
              </div>

              {/* 추가 시각적 요소 */}
              {index === 0 && (
                <div className="mt-4">
                  <ScoreDisplay
                    score={summary.overallScore}
                    variant="linear"
                    showLabel={false}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 하이라이트 및 알림 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 핵심 하이라이트 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-blue-600" />
            <h4 className="font-semibold text-gray-800">핵심 하이라이트</h4>
          </div>

          {quickHighlights.length > 0 ? (
            <div className="space-y-3">
              {quickHighlights.slice(0, 3).map((highlight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">
              진단 데이터를 바탕으로 핵심 포인트를 생성하고 있습니다.
            </p>
          )}
        </div>

        {/* Critical Alerts */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle
              size={20}
              className={criticalAlerts.length > 0 ? "text-red-600" : "text-gray-400"}
            />
            <h4 className="font-semibold text-gray-800">주요 알림</h4>
            {criticalAlerts.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {criticalAlerts.length}건
              </span>
            )}
          </div>

          {criticalAlerts.length > 0 ? (
            <div className="space-y-3">
              {criticalAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <p className="text-sm text-red-700 leading-relaxed font-medium">
                    {alert}
                  </p>
                </div>
              ))}
              {criticalAlerts.length > 3 && (
                <p className="text-xs text-red-500 mt-2">
                  +{criticalAlerts.length - 3}개 추가 알림이 있습니다.
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={16} />
              <p className="text-sm font-medium">
                현재 긴급한 주의사항이 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 종합 평가 요약 (AI 생성) */}
      <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-semibold text-gray-800">Executive Summary</h5>
          {aiGeneratedSummary && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              AI 생성
            </span>
          )}
        </div>

        {isGeneratingAI ? (
          <div className="flex items-center gap-3 py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent"></div>
            <p className="text-sm text-indigo-700">AI가 맞춤형 인사이트를 생성하고 있습니다...</p>
          </div>
        ) : aiGeneratedSummary ? (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {aiGeneratedSummary}
          </div>
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary.status === 'excellent' &&
              `${sectorName} ${stageName} 단계에서 매우 우수한 성과를 보이고 있습니다. 현재 수준을 유지하며 지속적인 성장을 위한 전략을 수립하시기 바랍니다.`
            }
            {summary.status === 'good' &&
              `${sectorName} ${stageName} 단계에서 양호한 수준을 유지하고 있습니다. 일부 개선 영역에 집중하여 더 높은 성과를 달성할 수 있습니다.`
            }
            {summary.status === 'fair' &&
              `${sectorName} ${stageName} 단계 기준으로 보통 수준입니다. 체계적인 개선 계획을 통해 성과 향상을 도모할 필요가 있습니다.`
            }
            {summary.status === 'needs_improvement' &&
              `${sectorName} ${stageName} 단계에서 개선이 필요한 상태입니다. 핵심 지표 중심의 집중적인 개선 활동을 즉시 시작하시기 바랍니다.`
            }
          </p>
        )}
      </div>
    </div>
  );
};