import { Card, CardBody } from '../common/Card';
import { 
  TrendingUp, TrendingDown, AlertTriangle, 
  Lightbulb, Shield, Target, ChevronRight 
} from 'lucide-react';
import { getAxisBgColor, getAxisTextColor } from '../../utils/axisColors';
import type { Insight } from '../../utils/insights';

interface InsightCardProps {
  insight: Insight;
  onAction?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'strength':
        return <TrendingUp className="text-secondary-main" size={20} />;
      case 'weakness':
        return <TrendingDown className="text-accent-red" size={20} />;
      case 'opportunity':
        return <Lightbulb className="text-accent-orange" size={20} />;
      case 'risk':
        return <AlertTriangle className="text-accent-red" size={20} />;
    }
  };

  const getTypeColor = () => {
    switch (insight.type) {
      case 'strength':
        return 'bg-secondary-light text-secondary-main';
      case 'weakness':
        return 'bg-red-50 text-accent-red';
      case 'opportunity':
        return 'bg-orange-50 text-accent-orange';
      case 'risk':
        return 'bg-red-50 text-accent-red';
    }
  };

  const getImpactBadge = () => {
    const colors = {
      high: 'bg-accent-red text-white',
      medium: 'bg-accent-orange text-white',
      low: 'bg-neutral-gray text-white'
    };
    
    const labels = {
      high: '높음',
      medium: '보통',
      low: '낮음'
    };

    return (
      <span className={`text-xs px-2 py-1 rounded font-medium ${colors[insight.impact]}`}>
        영향도 {labels[insight.impact]}
      </span>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${getTypeColor()}`}>
            {getIcon()}
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-neutral-dark mb-1">
                  {insight.title}
                </h3>
                <div className="flex items-center gap-2">
                  {insight.axis && (
                    <span className={`text-xs px-2 py-1 rounded ${getAxisTextColor(insight.axis)} ${getAxisBgColor(insight.axis).replace('bg-', 'bg-opacity-20 ')}`}>
                      {insight.axis}
                    </span>
                  )}
                  {getImpactBadge()}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-neutral-gray mb-3">
              {insight.description}
            </p>
            
            {insight.actionable && onAction && (
              <button
                onClick={onAction}
                className="flex items-center gap-1 text-sm font-medium text-primary-main hover:text-primary-hover transition-colors"
              >
                개선 방안 보기
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};