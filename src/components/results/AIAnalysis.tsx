import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getAxisBgColor } from '../../utils/axisColors';
import type { AxisAnalysis } from '../../utils/insights';

interface AIAnalysisProps {
  analyses: AxisAnalysis[];
  totalScore: number;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ analyses, totalScore }) => {
  const [expandedAxis, setExpandedAxis] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    // 실제로는 AI API 호출
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRegenerating(false);
  };

  const getOverallAnalysis = () => {
    if (totalScore >= 80) {
      return {
        summary: '전반적으로 매우 우수한 결과를 보이고 있습니다.',
        detail: '모든 축에서 균형잡힌 성장을 이루고 있으며, 특히 시장 성장성과 수익성 측면에서 우월한 진전을 보이고 있습니다. 현재의 성장 모멘텀을 유지하면서 다음 단계로의 도약을 준비하세요.'
      };
    } else if (totalScore >= 65) {
      return {
        summary: '안정적인 성장 궤도에 진입했습니다.',
        detail: '핵심 지표들에 개선이 있고 있으며, 몇 가지 부분만 보완한다면 더욱 좋은 성장을 기대할 수 있습니다. 특히 약점으로 나타난 축들에 집중하여 개선한다면 전체적인 경쟁력이 크게 향상될 것입니다.'
      };
    } else if (totalScore >= 50) {
      return {
        summary: '성장 잠재력은 있으나 개선이 필요합니다.',
        detail: '기본적인 사업 기반은 갖추었으나, 여러 영역에서 보완이 필요합니다. 우선순위를 명확하게 하고 체계적으로 개선할 수 있는 전략이 필요합니다.'
      };
    } else {
      return {
        summary: '전반적인 개선이 시급합니다.',
        detail: '사업의 기초를 다시 점검하고 핵심 문제부터 해결해야 합니다. 선택과 집중을 통해 가장 중요한 지표들을 개선할 필요가 있습니다.'
      };
    }
  };

  const overallAnalysis = getOverallAnalysis();

  return (
    <div className="space-y-6">
      {/* AI 종합 분석 */}
      <Card>
        <CardHeader 
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary-main" size={20} />
              <span>AI 종합 분석</span>
            </div>
          }
          action={
            <Button
              size="small"
              variant="ghost"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
              다시 생성
            </Button>
          }
        />
        <CardBody>
          <div className="space-y-4">
            <div className="bg-primary-light bg-opacity-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">
                {overallAnalysis.summary}
              </h3>
              <p className="text-neutral-gray leading-relaxed">
                {overallAnalysis.detail}
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-neutral-dark mb-1">
                  {analyses.filter(a => a.score >= 70).length}�?                </div>
                <p className="text-sm text-neutral-gray">우수 개</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-orange mb-1">
                  {analyses.filter(a => a.score >= 50 && a.score < 70).length}�?                </div>
                <p className="text-sm text-neutral-gray">보통 개</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-red mb-1">
                  {analyses.filter(a => a.score < 50).length}개                </div>
                <p className="text-sm text-neutral-gray">개선 필요</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 축별 상세 분석 */}
      <Card>
        <CardHeader title="축별 AI 분석" />
        <CardBody>
          <div className="space-y-4">
            {analyses.map(analysis => {
              const isExpanded = expandedAxis === analysis.axis;
              
              return (
                <div key={analysis.axis} className="border border-neutral-border rounded-lg overflow-hidden">
                  <button
                    className="w-full px-6 py-4 bg-neutral-light hover:bg-neutral-border transition-colors flex items-center justify-between"
                    onClick={() => setExpandedAxis(isExpanded ? null : analysis.axis)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${getAxisBgColor(analysis.axis)}`} />
                      <span className="font-medium text-neutral-dark">
                        {analysis.axis} 분석
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        analysis.trend === 'improving' 
                          ? 'bg-green-100 text-green-700'
                          : analysis.trend === 'stable'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {analysis.trend === 'improving' ? '개선 중' : 
                         analysis.trend === 'stable' ? '안정적' : '하락 중'}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="p-6 space-y-4 bg-white">
                      {/* 강점 */}
                      {analysis.strengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-dark mb-2">
                            💪 강점
                          </h4>
                          <ul className="space-y-1">
                            {analysis.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm text-neutral-gray flex items-start gap-2">
                                <span className="text-secondary-main mt-1">✓</span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 약점 */}
                      {analysis.weaknesses.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-dark mb-2">
                            ⚠️ 개선 필요
                          </h4>
                          <ul className="space-y-1">
                            {analysis.weaknesses.map((weakness, idx) => (
                              <li key={idx} className="text-sm text-neutral-gray flex items-start gap-2">
                                <span className="text-accent-red mt-1">•</span>
                                <span>{weakness}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 추천사항 */}
                      {analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-dark mb-2">
                            💡 추천 액션
                          </h4>
                          <ul className="space-y-2">
                            {analysis.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm bg-blue-50 p-3 rounded-md flex items-start gap-2">
                                <span className="text-primary-main font-bold">{idx + 1}.</span>
                                <span className="text-neutral-dark">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
