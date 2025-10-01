/**
 * AlertsPreview Component
 * Critical Alerts 미리보기 (최대 3개)
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Alert {
  severity: 'critical' | 'warning';
  message: string;
  icon: string;
}

interface AlertsPreviewProps {
  alerts: Alert[];
  className?: string;
}

export const AlertsPreview: React.FC<AlertsPreviewProps> = ({
  alerts,
  className = ''
}) => {
  if (alerts.length === 0) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white rounded-lg text-green-600">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">모두 정상</p>
            <p className="text-xs text-green-600">긴급 알림 없음</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-white rounded-lg text-red-600">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-red-900">긴급 알림</p>
          <p className="text-xs text-red-600">{alerts.length}건</p>
        </div>
      </div>

      <div className="space-y-2">
        {alerts.slice(0, 3).map((alert, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-xs text-red-800 bg-white bg-opacity-70 p-2 rounded"
          >
            <span>{alert.icon}</span>
            <span className="flex-1 line-clamp-2">{alert.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
