import { Card, CardHeader, CardBody } from '../common/Card';
import { Target, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { ProgressBar } from '../common/Progress';
import type { Milestone } from '../../utils/actionPlan';

interface RoadmapProps {
  milestones: Milestone[];
  currentScore: number;
}

export const Roadmap: React.FC<RoadmapProps> = ({ milestones, currentScore }) => {
  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1: return '🔥';
      case 2: return '🏗️';
      case 3: return '🚀';
      default: return '📍';
    }
  };

  return (
    <Card>
      <CardHeader 
        title="성장 로드맵"
        subtitle="단계별 실행 계획"
      />
      <CardBody>
        {/* 현재 위치 */}
        <div className="mb-8 p-4 bg-primary-light bg-opacity-20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-neutral-gray">현재 종합 점수</p>
              <p className="text-2xl font-bold text-neutral-dark">{currentScore.toFixed(1)}점</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-gray">목표 점수</p>
              <p className="text-2xl font-bold text-primary-main">80점</p>
            </div>
          </div>
          <ProgressBar
            value={currentScore}
            max={100}
            size="medium"
            variant="default"
          />
        </div>

        {/* 타임라인 */}
        <div className="relative">
          {/* 세로 선 */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-border" />
          
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={milestone.phase} className="relative flex gap-6">
                {/* 원형 마커 */}
                <div className={`
                  absolute left-3 w-6 h-6 rounded-full border-4 border-white
                  ${getPhaseColor(milestone.phase)} z-10
                  flex items-center justify-center text-white font-bold text-xs
                `}>
                  {milestone.phase}
                </div>
                
                {/* 컨텐츠 */}
                <div className="ml-12 flex-1">
                  <div className="bg-white border border-neutral-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    {/* 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getPhaseIcon(milestone.phase)}</span>
                          <h3 className="text-lg font-semibold text-neutral-dark">
                            Phase {milestone.phase}: {milestone.title}
                          </h3>
                        </div>
                        <p className="text-sm text-neutral-gray">{milestone.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-sm text-neutral-gray">
                          <Calendar size={16} />
                          {milestone.duration}
                        </div>
                        {milestone.targetScore && (
                          <div className="flex items-center gap-2 text-sm text-primary-main mt-1">
                            <Target size={16} />
                            목표 {milestone.targetScore}점
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 주요 액션 */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-dark mb-2">
                        주요 실행 과제 ({milestone.actions.length}개)
                      </p>
                      {milestone.actions.slice(0, 3).map((action, actionIndex) => (
                        <div 
                          key={action.id}
                          className="flex items-center gap-3 p-2 bg-neutral-light rounded"
                        >
                          <span className="text-sm font-mono text-neutral-gray">
                            {String(actionIndex + 1).padStart(2, '0')}
                          </span>
                          <span className="text-sm text-neutral-dark flex-1">
                            {action.title}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white rounded text-neutral-gray">
                            {action.axis}
                          </span>
                        </div>
                      ))}
                      
                      {milestone.actions.length > 3 && (
                        <button className="text-sm text-primary-main hover:text-primary-hover flex items-center gap-1 mt-2">
                          <span>+{milestone.actions.length - 3}개 더보기</span>
                          <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                    
                    {/* 예상 성과 */}
                    <div className="mt-4 pt-4 border-t border-neutral-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp size={16} className="text-secondary-main" />
                          <span className="text-neutral-gray">예상 점수 상승</span>
                        </div>
                        <span className="text-lg font-bold text-secondary-main">
                          +{milestone.targetScore ? milestone.targetScore - (index === 0 ? currentScore : milestones[index - 1].targetScore!) : 10}점
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 완료 예상 시점 */}
        <div className="mt-8 p-6 bg-secondary-light bg-opacity-20 rounded-lg text-center">
          <p className="text-sm text-neutral-gray mb-2">전체 로드맵 완료 예상 시점</p>
          <p className="text-2xl font-bold text-neutral-dark">
            {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long'
            })}
          </p>
          <p className="text-sm text-neutral-gray mt-2">
            목표 달성 시 상위 10% 기업 수준 도달
          </p>
        </div>
      </CardBody>
    </Card>
  );
};