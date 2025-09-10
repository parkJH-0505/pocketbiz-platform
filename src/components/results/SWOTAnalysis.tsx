import { Card, CardHeader, CardBody } from '../common/Card';
import { Shield, AlertTriangle, Target, Zap } from 'lucide-react';
import type { Insight } from '../../utils/insights';

interface SWOTAnalysisProps {
  insights: Insight[];
}

export const SWOTAnalysis: React.FC<SWOTAnalysisProps> = ({ insights }) => {
  const categorizeInsights = () => {
    const strengths = insights.filter(i => i.type === 'strength');
    const weaknesses = insights.filter(i => i.type === 'weakness');
    const opportunities = insights.filter(i => i.type === 'opportunity');
    const threats = insights.filter(i => i.type === 'risk');
    
    return { strengths, weaknesses, opportunities, threats };
  };

  const { strengths, weaknesses, opportunities, threats } = categorizeInsights();

  const quadrants = [
    {
      title: 'Strengths',
      subtitle: '강점',
      items: strengths,
      icon: Shield,
      bgColor: 'bg-secondary-light',
      iconColor: 'text-secondary-main',
      borderColor: 'border-secondary-main'
    },
    {
      title: 'Weaknesses',
      subtitle: '약점',
      items: weaknesses,
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconColor: 'text-accent-red',
      borderColor: 'border-accent-red'
    },
    {
      title: 'Opportunities',
      subtitle: '기회',
      items: opportunities,
      icon: Target,
      bgColor: 'bg-orange-50',
      iconColor: 'text-accent-orange',
      borderColor: 'border-accent-orange'
    },
    {
      title: 'Threats',
      subtitle: '위협',
      items: threats,
      icon: Zap,
      bgColor: 'bg-purple-50',
      iconColor: 'text-accent-purple',
      borderColor: 'border-accent-purple'
    }
  ];

  return (
    <Card>
      <CardHeader 
        title="SWOT 분석" 
        subtitle="강점, 약점, 기회, 위협 요인 분석"
      />
      <CardBody>
        <div className="grid grid-cols-2 gap-6">
          {quadrants.map(({ title, subtitle, items, icon: Icon, bgColor, iconColor, borderColor }) => (
            <div 
              key={title}
              className={`rounded-lg border-2 ${borderColor} ${bgColor} p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full bg-white shadow-sm`}>
                  <Icon className={iconColor} size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-dark">{title}</h3>
                  <p className="text-sm text-neutral-gray">{subtitle}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {items.length > 0 ? (
                  items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-white rounded-md p-3 shadow-sm">
                      <h4 className="text-sm font-medium text-neutral-dark mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-neutral-gray line-clamp-2">
                        {item.description}
                      </p>
                      {item.axis && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-neutral-light rounded text-neutral-gray">
                          {item.axis}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-neutral-gray italic">
                    해당 항목이 없습니다
                  </p>
                )}
                
                {items.length > 3 && (
                  <p className="text-xs text-neutral-gray text-center pt-2">
                    +{items.length - 3}개 더보기
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* SWOT 전략 매트릭스 */}
        <div className="mt-6 pt-6 border-t border-neutral-border">
          <h4 className="text-sm font-semibold text-neutral-dark mb-3">전략적 제언</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-800 mb-2">SO 전략 (강점-기회)</h5>
              <p className="text-xs text-blue-700">
                강점을 활용하여 기회를 극대화하세요. 
                {strengths.length > 0 && opportunities.length > 0 
                  ? `특히 ${strengths[0].title}를 바탕으로 ${opportunities[0].title}를 추진하세요.`
                  : '현재 우위를 점하고 있는 영역에서 신규 기회를 발굴하세요.'}
              </p>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-yellow-800 mb-2">WO 전략 (약점-기회)</h5>
              <p className="text-xs text-yellow-700">
                약점을 보완하여 기회를 놓치지 마세요.
                {weaknesses.length > 0 
                  ? `${weaknesses[0].title}를 개선하면 새로운 성장 기회가 열릴 것입니다.`
                  : '개선이 필요한 영역을 파악하고 보완 전략을 수립하세요.'}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-green-800 mb-2">ST 전략 (강점-위협)</h5>
              <p className="text-xs text-green-700">
                강점을 활용하여 위협을 방어하세요.
                {strengths.length > 0 && threats.length > 0
                  ? `${strengths[0].title}를 활용하여 ${threats[0].title}에 대응하세요.`
                  : '핵심 역량을 강화하여 외부 위협에 대비하세요.'}
              </p>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="text-sm font-medium text-red-800 mb-2">WT 전략 (약점-위협)</h5>
              <p className="text-xs text-red-700">
                약점과 위협을 최소화하는 방어 전략이 필요합니다.
                {weaknesses.length > 0 && threats.length > 0
                  ? `${weaknesses[0].title}를 시급히 개선하여 리스크를 줄이세요.`
                  : '취약점을 보완하고 위험 요소를 관리하세요.'}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};