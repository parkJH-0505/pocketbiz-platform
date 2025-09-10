import { useState } from 'react';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { useCluster, getStageName } from '../../contexts/ClusterContext';
import { Calendar, TrendingUp, TrendingDown, Minus, FileText, Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AssessmentHistory {
  runId: string;
  date: Date;
  stage: string;
  overallScore: number;
  status: 'completed' | 'in_progress';
  delta: number;
  axisScores: {
    GO: number;
    EC: number;
    PT: number;
    PF: number;
    TO: number;
  };
}

const History = () => {
  const { cluster } = useCluster();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | '3m' | '6m' | '1y'>('all');

  // Mock historical data
  const mockHistory: AssessmentHistory[] = [
    {
      runId: '2025Q1-0003',
      date: new Date('2025-01-05'),
      stage: 'A-3',
      overallScore: 72.5,
      status: 'completed',
      delta: 5.2,
      axisScores: { GO: 78, EC: 65, PT: 72, PF: 75, TO: 73 }
    },
    {
      runId: '2024Q4-0002',
      date: new Date('2024-12-20'),
      stage: 'A-3',
      overallScore: 67.3,
      status: 'completed',
      delta: 3.1,
      axisScores: { GO: 72, EC: 63, PT: 68, PF: 70, TO: 64 }
    },
    {
      runId: '2024Q4-0001',
      date: new Date('2024-11-15'),
      stage: 'A-2',
      overallScore: 64.2,
      status: 'completed',
      delta: -2.4,
      axisScores: { GO: 68, EC: 60, PT: 65, PF: 67, TO: 61 }
    },
    {
      runId: '2024Q3-0003',
      date: new Date('2024-09-10'),
      stage: 'A-2',
      overallScore: 66.6,
      status: 'completed',
      delta: 4.8,
      axisScores: { GO: 70, EC: 62, PT: 67, PF: 69, TO: 65 }
    },
    {
      runId: '2024Q3-0002',
      date: new Date('2024-08-05'),
      stage: 'A-2',
      overallScore: 61.8,
      status: 'completed',
      delta: 0,
      axisScores: { GO: 65, EC: 58, PT: 62, PF: 64, TO: 60 }
    }
  ];

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp size={16} className="text-secondary-main" />;
    if (delta < 0) return <TrendingDown size={16} className="text-error" />;
    return <Minus size={16} className="text-neutral-gray" />;
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-secondary-main';
    if (delta < 0) return 'text-error';
    return 'text-neutral-gray';
  };

  const getStageChangeLabel = (current: string, previous: string | undefined) => {
    if (!previous || current === previous) return null;
    const stages = ['A-1', 'A-2', 'A-3', 'A-4', 'A-5'];
    const currentIndex = stages.indexOf(current);
    const previousIndex = stages.indexOf(previous);
    
    if (currentIndex > previousIndex) {
      return <span className="text-xs px-2 py-0.5 bg-secondary-light text-secondary-main rounded ml-2">승급</span>;
    }
    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-dark">평가 히스토리</h1>
        <p className="text-neutral-gray mt-2">과거 평가 기록과 성장 추이를 확인하세요</p>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-gray mb-1">현재 단계</p>
              <p className="text-2xl font-bold text-neutral-dark">
                {cluster.stage}: {getStageName(cluster.stage)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-gray mb-1">최근 평가</p>
              <p className="text-2xl font-bold text-primary-main">72.5점</p>
              <p className="text-sm text-secondary-main mt-1">+5.2 (전회 대비)</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-neutral-gray">기간:</span>
        <div className="flex gap-2">
          {(['all', '3m', '6m', '1y'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                selectedPeriod === period
                  ? 'bg-primary-main text-white'
                  : 'bg-neutral-light text-neutral-gray hover:bg-neutral-border'
              }`}
            >
              {period === 'all' ? '전체' : period === '3m' ? '3개월' : period === '6m' ? '6개월' : '1년'}
            </button>
          ))}
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {mockHistory.map((assessment, index) => {
          const previousAssessment = mockHistory[index + 1];
          return (
            <Card key={assessment.runId}>
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar size={18} className="text-neutral-lighter" />
                      <span className="text-sm text-neutral-gray">
                        {assessment.date.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="text-sm font-semibold text-neutral-dark">
                        {assessment.stage}
                      </span>
                      {getStageChangeLabel(assessment.stage, previousAssessment?.stage)}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-lg font-semibold text-neutral-dark">
                        평가 #{assessment.runId}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        assessment.status === 'completed'
                          ? 'bg-secondary-light text-secondary-main'
                          : 'bg-accent-orange-light text-accent-orange'
                      }`}>
                        {assessment.status === 'completed' ? '완료' : '진행중'}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-4">
                      <div>
                        <p className="text-xs text-neutral-gray mb-1">종합점수</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-neutral-dark">
                            {assessment.overallScore.toFixed(1)}
                          </span>
                          <div className={`flex items-center gap-1 ${getDeltaColor(assessment.delta)}`}>
                            {getDeltaIcon(assessment.delta)}
                            <span className="text-sm font-semibold">
                              {Math.abs(assessment.delta).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {Object.entries(assessment.axisScores).map(([axis, score]) => (
                        <div key={axis}>
                          <p className="text-xs text-neutral-gray mb-1">{axis}</p>
                          <p className="text-lg font-semibold text-neutral-dark">{score}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/startup/results?runId=${assessment.runId}`}>
                      <Button size="small" variant="ghost">
                        <Eye size={16} />
                        보기
                      </Button>
                    </Link>
                    <Button size="small" variant="ghost">
                      <Download size={16} />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Stage History Summary */}
      <Card className="mt-8">
        <CardHeader
          title="단계 변경 이력"
          subtitle="성장 단계 변화 추이"
        />
        <CardBody>
          <div className="space-y-3">
            {cluster.stageHistory.length > 0 ? (
              cluster.stageHistory.map((change, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-neutral-light rounded-lg">
                  <div className="text-sm text-neutral-gray">
                    {new Date(change.changedAt).toLocaleDateString('ko-KR')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{change.from}</span>
                    <span className="text-neutral-gray">→</span>
                    <span className="font-semibold text-primary-main">{change.to}</span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary-light text-primary-main rounded">
                    {change.reason === 'manual' ? '수동 변경' : 
                     change.reason === 'auto_upgrade' ? '자동 승급' : '관리자 변경'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-gray">아직 단계 변경 이력이 없습니다.</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default History;