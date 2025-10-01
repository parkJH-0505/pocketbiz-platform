/**
 * RiskAlertsSection
 * Phase 2C: 리스크 알림 UI 컴포넌트
 * Phase 3.4: 성능 최적화 (React.memo, useMemo)
 *
 * 자동 탐지된 리스크 알림을 시각적으로 표시합니다.
 * - Critical: 즉각 조치 필요
 * - Warning: 주의 필요
 * - Info: 참고 사항
 */

import React, { useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import type { RiskAlert } from '@/services/analysis/DataAnalysisEngine';

interface RiskAlertsSectionProps {
  alerts: RiskAlert[];
}

/**
 * Severity별 스타일 매핑
 */
const getSeverityStyle = (severity: RiskAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        borderL: 'border-l-red-500',
        text: 'text-red-900',
        iconColor: 'text-red-600',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-700',
        icon: AlertTriangle
      };
    case 'warning':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        borderL: 'border-l-orange-500',
        text: 'text-orange-900',
        iconColor: 'text-orange-600',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-700',
        icon: AlertCircle
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        borderL: 'border-l-blue-500',
        text: 'text-blue-900',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-700',
        icon: Info
      };
  }
};

/**
 * Severity별 라벨
 */
const getSeverityLabel = (severity: RiskAlert['severity']): string => {
  switch (severity) {
    case 'critical':
      return '긴급';
    case 'warning':
      return '경고';
    case 'info':
      return '정보';
  }
};

/**
 * 개별 리스크 알림 카드
 * Phase 3.4: React.memo로 최적화
 */
const RiskAlertCard = React.memo<{ alert: RiskAlert; index: number }>(({ alert, index }) => {
  const style = getSeverityStyle(alert.severity);
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} border-2 ${style.border} border-l-4 ${style.borderL} rounded-lg p-5 hover:shadow-md transition-all duration-200`}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`${style.iconColor} flex-shrink-0 mt-0.5`}>
          <Icon size={28} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold ${style.text} text-lg`}>{alert.title}</h4>
            <span
              className={`px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badgeText} text-xs font-semibold`}
            >
              {getSeverityLabel(alert.severity)}
            </span>
          </div>
          <p className={`text-sm ${style.text} leading-relaxed`}>{alert.description}</p>
        </div>
      </div>

      {/* 추천 액션 */}
      {alert.suggestedActions.length > 0 && (
        <div className="mt-4 p-3 bg-white bg-opacity-60 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className={style.iconColor} size={16} />
            <span className={`text-xs font-bold ${style.text}`}>추천 액션</span>
          </div>
          <ul className="space-y-2">
            {alert.suggestedActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <ArrowRight
                  className={`${style.iconColor} flex-shrink-0 mt-0.5`}
                  size={16}
                />
                <span className={style.text}>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-300 flex items-center justify-between text-xs">
        <span className={`${style.text} opacity-75`}>
          영향 KPI: {alert.affectedKPIs.length}개
        </span>
        <span className={`${style.text} opacity-60 font-mono`}>
          {alert.detectedBy}
        </span>
      </div>
    </div>
  );
});

/**
 * 리스크 알림 섹션 메인 컴포넌트
 * Phase 3.4: React.memo + useMemo로 최적화
 */
export const RiskAlertsSection = React.memo<RiskAlertsSectionProps>(({ alerts }) => {
  if (alerts.length === 0) {
    // 리스크 없음 - 긍정적 메시지
    return (
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-full shadow-sm">
            <CheckCircle2 className="text-green-600" size={28} />
          </div>
          <div>
            <h4 className="font-bold text-green-900 text-lg">위험 신호 없음</h4>
            <p className="text-sm text-green-700 mt-1">
              현재 탐지된 주요 리스크가 없습니다. 현재 상태를 유지하면서 지속적으로 모니터링하세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Severity별로 정렬 (critical > warning > info)
  // Phase 3.4: useMemo로 캐싱
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [alerts]);

  // 통계
  // Phase 3.4: useMemo로 캐싱
  const { criticalCount, warningCount, infoCount } = useMemo(() => {
    return {
      criticalCount: alerts.filter((a) => a.severity === 'critical').length,
      warningCount: alerts.filter((a) => a.severity === 'warning').length,
      infoCount: alerts.filter((a) => a.severity === 'info').length
    };
  }, [alerts]);

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={24} />
            리스크 알림
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            자동 탐지된 위험 신호 및 개선이 필요한 영역
          </p>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-900">{criticalCount}</div>
          <div className="text-xs text-red-600 mt-1">긴급 조치 필요</div>
        </div>
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-900">{warningCount}</div>
          <div className="text-xs text-orange-600 mt-1">주의 필요</div>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-900">{infoCount}</div>
          <div className="text-xs text-blue-600 mt-1">참고 사항</div>
        </div>
      </div>

      {/* 리스크 알림 목록 */}
      <div className="space-y-3">
        {sortedAlerts.map((alert, index) => (
          <RiskAlertCard key={index} alert={alert} index={index} />
        ))}
      </div>

      {/* 하단 안내 */}
      {criticalCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-red-900">
              <span className="font-bold">긴급 알림:</span> {criticalCount}개의 긴급 조치가
              필요한 항목이 있습니다. 즉시 대응하여 비즈니스 건강도를 개선하세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
