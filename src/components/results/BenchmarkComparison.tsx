import { Card, CardHeader, CardBody } from '../common/Card';
import { ProgressBar } from '../common/Progress';
import { TrendingUp, TrendingDown, Users, Building2, Trophy } from 'lucide-react';
import { getAxisBgColor, getAxisTextColor } from '../../utils/axisColors';
import type { AxisKey } from '../../types';

interface BenchmarkComparisonProps {
  currentScores: Record<AxisKey, number>;
  benchmarks: {
    industry: Record<AxisKey, number>;
    top10: Record<AxisKey, number>;
    stage: Record<AxisKey, number>;
  };
}

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  currentScores,
  benchmarks
}) => {
  const axes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];

  const calculateGap = (current: number, benchmark: number) => {
    return current - benchmark;
  };

  const getGapColor = (gap: number) => {
    if (gap > 0) return 'text-secondary-main';
    if (gap < -10) return 'text-accent-red';
    return 'text-accent-orange';
  };

  const benchmarkTypes = [
    { 
      key: 'industry', 
      label: '동종업계 평균', 
      icon: Building2,
      description: 'S-1 섹터 전체 평균'
    },
    { 
      key: 'stage', 
      label: '동일 단계 평균', 
      icon: Users,
      description: 'A-3 단계 기업 평균'
    },
    { 
      key: 'top10', 
      label: '상위 10%', 
      icon: Trophy,
      description: '우수 기업 기준'
    }
  ];

  return (
    <div className="space-y-6">
      {benchmarkTypes.map(({ key, label, icon: Icon, description }) => {
        const benchmarkData = benchmarks[key as keyof typeof benchmarks];
        const totalCurrent = Object.values(currentScores).reduce((a, b) => a + b, 0) / 5;
        const totalBenchmark = Object.values(benchmarkData).reduce((a, b) => a + b, 0) / 5;
        const totalGap = totalCurrent - totalBenchmark;
        
        return (
          <Card key={key}>
            <CardHeader 
              title={
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-primary-main" />
                  <span>{label}</span>
                </div>
              }
              subtitle={description}
            />
            <CardBody>
              {/* 종합 비교 */}
              <div className="mb-6 pb-6 border-b border-neutral-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-gray">종합 점수</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-neutral-dark">
                      {totalCurrent.toFixed(1)}
                    </span>
                    <span className="text-sm text-neutral-gray ml-2">
                      vs {totalBenchmark.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalGap > 0 ? (
                    <TrendingUp className="text-secondary-main" size={16} />
                  ) : (
                    <TrendingDown className="text-accent-red" size={16} />
                  )}
                  <span className={`text-sm font-medium ${getGapColor(totalGap)}`}>
                    {totalGap > 0 ? '+' : ''}{totalGap.toFixed(1)}점 
                    {totalGap > 0 ? ' 우위' : ' 열위'}
                  </span>
                </div>
              </div>
              
              {/* 축별 비교 */}
              <div className="space-y-3">
                {axes.map(axis => {
                  const current = currentScores[axis];
                  const benchmark = benchmarkData[axis];
                  const gap = calculateGap(current, benchmark);
                  
                  return (
                    <div key={axis} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getAxisBgColor(axis)}`} />
                          <span className="font-medium">{axis}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-gray">
                            {benchmark}점
                          </span>
                          <span className={`font-medium ${getGapColor(gap)}`}>
                            {gap > 0 ? '+' : ''}{gap.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <ProgressBar
                          value={benchmark}
                          max={100}
                          size="small"
                          variant="default"
                          className="opacity-30"
                        />
                        <div className="absolute top-0 left-0 w-full">
                          <ProgressBar
                            value={current}
                            max={100}
                            size="small"
                            variant={gap > 0 ? 'success' : 'error'}
                            className="bg-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};