import { Card, CardHeader, CardBody } from '../common/Card';
import { ProgressBar } from '../common/Progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getAxisBgColor, getAxisTextColor } from '../../utils/axisColors';
import type { AxisKey } from '../../types';

interface ScoreBreakdownProps {
  axisScores: Record<AxisKey, number>;
  previousScores?: Record<AxisKey, number>;
  peerAvgScores?: Record<AxisKey, number>;
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  axisScores,
  previousScores,
  peerAvgScores
}) => {
  const axes = [
    { key: 'GO' as AxisKey, name: 'Growth Opportunity', desc: '시장 기회 및 성장성' },
    { key: 'EC' as AxisKey, name: 'Economic Value', desc: '경제적 가치 창출' },
    { key: 'PT' as AxisKey, name: 'Product Technology', desc: '제품 기술 경쟁력' },
    { key: 'PF' as AxisKey, name: 'Performance Finance', desc: '재무 성과 관리' },
    { key: 'TO' as AxisKey, name: 'Team Organization', desc: '팀 조직 역량' }
  ];

  const getDelta = (current: number, previous?: number) => {
    if (!previous) return null;
    return current - previous;
  };

  const getDeltaIcon = (delta: number | null) => {
    if (delta === null) return null;
    if (delta > 0) return <TrendingUp size={16} className="text-secondary-main" />;
    if (delta < 0) return <TrendingDown size={16} className="text-accent-red" />;
    return <Minus size={16} className="text-neutral-gray" />;
  };

  return (
    <Card>
      <CardHeader title="축별 상세 분석" />
      <CardBody>
        <div className="space-y-6">
          {axes.map((axis) => {
            const score = axisScores[axis.key];
            const previousScore = previousScores?.[axis.key];
            const peerAvg = peerAvgScores?.[axis.key];
            const delta = getDelta(score, previousScore);
            
            return (
              <div key={axis.key} className="space-y-3">
                {/* 축 정보 헤더 */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getAxisBgColor(axis.key)}`} />
                    <div>
                      <h4 className="font-medium text-neutral-dark">
                        {axis.key} - {axis.name}
                      </h4>
                      <p className="text-xs text-neutral-gray">{axis.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-neutral-dark">{score}</span>
                      {delta !== null && (
                        <div className="flex items-center gap-1">
                          {getDeltaIcon(delta)}
                          <span className={`text-sm font-medium ${
                            delta > 0 ? 'text-secondary-main' : delta < 0 ? 'text-accent-red' : 'text-neutral-gray'
                          }`}>
                            {Math.abs(delta)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 점수 바 */}
                <div className="space-y-2">
                  <ProgressBar
                    value={score}
                    max={100}
                    size="small"
                    variant={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error'}
                  />
                  
                  {/* 비교 정보 */}
                  <div className="flex items-center justify-between text-xs text-neutral-gray">
                    {previousScore && (
                      <span>전분기: {previousScore}점</span>
                    )}
                    {peerAvg && (
                      <span className={score > peerAvg ? 'text-secondary-main' : 'text-neutral-gray'}>
                        동종업계 평균: {peerAvg}점 {score > peerAvg ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 등급 표시 */}
                <div className="flex items-center gap-2">
                  {getScoreGrades(score).map((grade, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-2 py-1 rounded ${
                        grade.active
                          ? `${getAxisTextColor(axis.key)} ${getAxisBgColor(axis.key).replace('bg-', 'bg-opacity-20 ')}`
                          : 'text-neutral-lighter bg-neutral-border'
                      }`}
                    >
                      {grade.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

function getScoreGrades(score: number) {
  const grades = [
    { label: '우수', min: 80, active: false },
    { label: '양호', min: 60, active: false },
    { label: '보통', min: 40, active: false },
    { label: '미흡', min: 0, active: false }
  ];

  for (let grade of grades) {
    if (score >= grade.min) {
      grade.active = true;
      break;
    }
  }

  return grades;
}