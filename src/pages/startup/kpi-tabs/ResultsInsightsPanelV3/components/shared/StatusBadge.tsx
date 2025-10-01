/**
 * StatusBadge Component
 * 상태를 시각적으로 표시하는 배지 컴포넌트
 */

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Award
} from 'lucide-react';
import type { StatusBadgeProps } from '../../types/reportV3UI.types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'solid',
  showIcon = true,
  className = ''
}) => {
  // 상태별 설정
  const statusConfig = {
    excellent: {
      label: '우수',
      icon: Award,
      className: 'excellent'
    },
    good: {
      label: '양호',
      icon: CheckCircle,
      className: 'good'
    },
    fair: {
      label: '보통',
      icon: AlertCircle,
      className: 'fair'
    },
    needs_attention: {
      label: '개선필요',
      icon: AlertTriangle,
      className: 'needs-attention'
    },
    critical: {
      label: '위험',
      icon: XCircle,
      className: 'critical'
    }
  };

  const config = statusConfig[status] || statusConfig.fair;
  const Icon = config.icon;

  // 아이콘 크기
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <div className={`status-badge size-${size} ${config.className} ${variant} ${className}`}>
      {showIcon && (
        <Icon size={iconSize[size]} />
      )}
      <span>{config.label}</span>
    </div>
  );
};