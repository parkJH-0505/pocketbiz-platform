/**
 * RiskAlertsSection
 * Phase 2C: 리스크 알림 섹션
 *
 * 자동 탐지된 위험 신호를 표시
 * - Critical: 즉각 조치 필요
 * - Warning: 주의 필요
 * - Info: 참고 사항
 */

import React from 'react';
import type { RiskAlert } from '@/types/reportV3.types';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface RiskAlertsSectionProps {
  alerts: RiskAlert[];
}

export const RiskAlertsSection: React.FC<RiskAlertsSectionProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  // Severity별로 정렬 (critical > warning > info)
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="mb-8">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle className="text-red-600" size={24} />
          리스크 알림
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          자동 탐지된 위험 신호입니다
          {criticalCount > 0 && (
            <span className="ml-2 text-red-600 font-semibold">
              • 긴급 {criticalCount}개
            </span>
          )}
          {warningCount > 0 && (
            <span className="ml-2 text-orange-600 font-semibold">
              • 주의 {warningCount}개
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {sortedAlerts.map((alert, idx) => (
          <RiskAlertCard key={idx} alert={alert} />
        ))}
      </div>
    </div>
  );
};

const RiskAlertCard: React.FC<{ alert: RiskAlert }> = ({ alert }) => {
  const getSeverityConfig = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-900',
          badge: '긴급',
          badgeBg: 'bg-red-100'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-900',
          badge: '주의',
          badgeBg: 'bg-orange-100'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-900',
          badge: '정보',
          badgeBg: 'bg-blue-100'
        };
    }
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <div
      className={`p-5 border-2 rounded-lg ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={24} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold ${config.textColor}`}>{alert.title}</h4>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${config.badgeBg} ${config.textColor}`}
            >
              {config.badge}
            </span>
          </div>
          <p className={`text-sm ${config.textColor}`}>{alert.description}</p>
        </div>
      </div>

      {alert.affectedKPIs.length > 0 && (
        <div className="mb-3 p-2 bg-white bg-opacity-70 rounded">
          <p className={`text-xs ${config.textColor} font-medium mb-1`}>
            영향을 받는 KPI ({alert.affectedKPIs.length}개)
          </p>
          <div className="flex flex-wrap gap-1">
            {alert.affectedKPIs.slice(0, 5).map((kpiId, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-white rounded border border-gray-300"
              >
                {kpiId}
              </span>
            ))}
            {alert.affectedKPIs.length > 5 && (
              <span className="text-xs text-gray-600">
                +{alert.affectedKPIs.length - 5}개 더
              </span>
            )}
          </div>
        </div>
      )}

      {alert.suggestedActions.length > 0 && (
        <div className="p-3 bg-white bg-opacity-70 rounded-lg">
          <p className={`text-xs font-semibold ${config.textColor} mb-2`}>
            추천 액션
          </p>
          <ul className="space-y-1">
            {alert.suggestedActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle
                  size={16}
                  className="text-green-600 flex-shrink-0 mt-0.5"
                />
                <span className={config.textColor}>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">탐지: {alert.detectedBy}</p>
    </div>
  );
};