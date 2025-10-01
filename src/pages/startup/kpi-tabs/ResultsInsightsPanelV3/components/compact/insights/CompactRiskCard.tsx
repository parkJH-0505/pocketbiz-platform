/**
 * CompactRiskCard Component
 * 간결한 리스크 카드 (Page 3 좌측)
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { CompactRisk } from '../../../utils/insightsDataExtractor';

interface CompactRiskCardProps {
  risk: CompactRisk;
  className?: string;
}

export const CompactRiskCard: React.FC<CompactRiskCardProps> = ({
  risk,
  className = ''
}) => {
  const getSeverityConfig = (severity: 'critical' | 'high' | 'medium') => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-900',
          badgeBg: 'bg-red-100',
          badgeText: 'text-red-700',
          label: '치명적'
        };
      case 'high':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-300',
          textColor: 'text-orange-900',
          badgeBg: 'bg-orange-100',
          badgeText: 'text-orange-700',
          label: '높음'
        };
      case 'medium':
        return {
          icon: Info,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-900',
          badgeBg: 'bg-yellow-100',
          badgeText: 'text-yellow-700',
          label: '중간'
        };
    }
  };

  const config = getSeverityConfig(risk.severity);
  const Icon = config.icon;

  return (
    <div
      className={`p-3 border rounded-lg ${config.bgColor} ${config.borderColor} ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-start gap-2 mb-2">
        <Icon size={18} className={config.textColor} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${config.badgeBg} ${config.badgeText}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-600">
              {risk.category}
            </span>
          </div>
          <h4 className={`text-sm font-semibold ${config.textColor} line-clamp-2`}>
            {risk.title}
          </h4>
        </div>
      </div>

      {/* 임팩트 */}
      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 mb-2">
        {risk.impact}
      </p>

      {/* 영향받는 KPI */}
      {risk.affectedKPIs.length > 0 && (
        <div className="pt-2 border-t border-gray-200">
          <span className="text-xs font-semibold text-gray-600">영향 KPI:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {risk.affectedKPIs.map((kpi, idx) => (
              <span
                key={idx}
                className="inline-block px-2 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-700"
              >
                {kpi}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
