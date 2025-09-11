/**
 * Insight Card Component
 * AI 인사이트 표시 카드
 */

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';

export interface Insight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'recommendation';
  title: string;
  description: string;
  impact?: 'high' | 'medium' | 'low';
  axis?: string;
}

interface InsightCardProps {
  insight: Insight;
  compact?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  compact = false
}) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'strength':
        return <TrendingUp className="text-success-main" size={20} />;
      case 'weakness':
        return <TrendingDown className="text-error-main" size={20} />;
      case 'opportunity':
        return <Lightbulb className="text-warning-main" size={20} />;
      case 'threat':
        return <AlertTriangle className="text-error-main" size={20} />;
      case 'recommendation':
        return <Target className="text-primary-main" size={20} />;
      default:
        return <Zap className="text-neutral-gray" size={20} />;
    }
  };
  
  const getBorderColor = () => {
    switch (insight.type) {
      case 'strength':
        return 'border-l-success-main';
      case 'weakness':
        return 'border-l-error-main';
      case 'opportunity':
        return 'border-l-warning-main';
      case 'threat':
        return 'border-l-error-dark';
      case 'recommendation':
        return 'border-l-primary-main';
      default:
        return 'border-l-neutral-gray';
    }
  };
  
  const getTypeLabel = () => {
    const labels = {
      strength: '강점',
      weakness: '약점',
      opportunity: '기회',
      threat: '위협',
      recommendation: '제안'
    };
    return labels[insight.type] || '인사이트';
  };
  
  const getImpactBadge = () => {
    if (!insight.impact) return null;
    
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    
    const labels = {
      high: '높음',
      medium: '보통',
      low: '낮음'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[insight.impact]}`}>
        영향도: {labels[insight.impact]}
      </span>
    );
  };
  
  if (compact) {
    return (
      <div className={`border-l-4 ${getBorderColor()} pl-4 py-2`}>
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-dark">{insight.title}</p>
            <p className="text-xs text-neutral-gray mt-1">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white border border-neutral-border rounded-lg p-4 hover:shadow-md transition-shadow border-l-4 ${getBorderColor()}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-neutral-gray">{getTypeLabel()}</span>
          {insight.axis && (
            <span className="text-xs px-2 py-1 bg-neutral-light rounded">
              {insight.axis}
            </span>
          )}
        </div>
        {getImpactBadge()}
      </div>
      
      <h4 className="font-semibold text-neutral-dark mb-2">{insight.title}</h4>
      <p className="text-sm text-neutral-gray">{insight.description}</p>
    </div>
  );
};