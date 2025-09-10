import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { 
  Clock, Target, ChevronRight, 
  AlertCircle, Calendar
} from 'lucide-react';
import { getAxisBgColor, getAxisTextColor } from '../../utils/axisColors';
import type { Action } from '../../utils/actionPlan';

interface ActionPlanProps {
  actions: Action[];
}

export const ActionPlan: React.FC<ActionPlanProps> = ({ actions }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const filteredActions = filter === 'all' 
    ? actions 
    : actions.filter(a => a.priority === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '🟢';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'low': return '⭐';
      case 'medium': return '⭐⭐';
      case 'high': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  return (
    <Card>
      <CardHeader 
        title="우선순위 액션 플랜"
        subtitle={`${filteredActions.length}개의 실행 과제`}
        action={
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium'].map(level => (
              <button
                key={level}
                onClick={() => setFilter(level as any)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  filter === level
                    ? 'bg-primary-main text-white'
                    : 'bg-neutral-border text-neutral-gray hover:bg-neutral-light'
                }`}
              >
                {level === 'all' ? '전체' : 
                 level === 'critical' ? '긴급' :
                 level === 'high' ? '높음' : '보통'}
              </button>
            ))}
          </div>
        }
      />
      <CardBody>
        <div className="space-y-4">
          {filteredActions.map((action, index) => {
            const isExpanded = expandedAction === action.id;
            
            return (
              <div
                key={action.id}
                className="border border-neutral-border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl font-bold text-neutral-lighter">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-neutral-dark">
                            {action.title}
                          </h4>
                          <p className="text-sm text-neutral-gray mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight 
                          size={20} 
                          className={`text-neutral-lighter transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded border font-medium ${getPriorityColor(action.priority)}`}>
                          {action.priority === 'critical' ? '긴급' :
                           action.priority === 'high' ? '높음' :
                           action.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className={`${getAxisTextColor(action.axis)} ${getAxisBgColor(action.axis).replace('bg-', 'bg-opacity-20 ')} px-2 py-1 rounded`}>
                          {action.axis}
                        </span>
                        <span className="flex items-center gap-1 text-neutral-gray">
                          <Clock size={12} />
                          {action.timeframe}
                        </span>
                        <span title="노력도">
                          {getEffortIcon(action.effort)}
                        </span>
                        <span title="영향도">
                          {getImpactIcon(action.impact)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-neutral-border bg-neutral-light">
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">
                          기대 효과
                        </h5>
                        <p className="text-sm text-neutral-gray">
                          {action.expectedOutcome}
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">
                          필요 리소스                        </h5>
                        <ul className="text-sm text-neutral-gray">
                          {action.resources.map((resource, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="text-primary-main">•</span>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {action.kpis.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-neutral-dark mb-2">
                          관련 KPI
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {action.kpis.map(kpi => (
                            <span
                              key={kpi}
                              className="text-xs px-2 py-1 bg-white rounded border border-neutral-border"
                            >
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex gap-2">
                      <Button size="small" variant="primary">
                        <Target size={16} />
                        실행 계획 수립
                      </Button>
                      <Button size="small" variant="ghost">
                        <Calendar size={16} />
                        일정 추가
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredActions.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto text-neutral-lighter mb-2" size={32} />
              <p className="text-neutral-gray">해당 우선순위의 액션이 없습니다.</p>
            </div>
          )}
        </div>
        
        {/* 요약 통계 */}
        <div className="mt-6 pt-6 border-t border-neutral-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-accent-red">
                {actions.filter(a => a.priority === 'critical').length}
              </p>
              <p className="text-xs text-neutral-gray">긴급 과제</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-accent-orange">
                {actions.filter(a => a.priority === 'high').length}
              </p>
              <p className="text-xs text-neutral-gray">높음 우선순위</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary-main">
                {actions.filter(a => a.impact === 'high').length}
              </p>
              <p className="text-xs text-neutral-gray">높은 영향</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-main">
                {actions.filter(a => a.effort === 'low').length}
              </p>
              <p className="text-xs text-neutral-gray">Quick Win</p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
