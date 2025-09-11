import { RadarChart } from '../../components/charts/RadarChart';
import { ArrowRight, AlertCircle, Activity, Target, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getAxisColor } from '../../utils/axisColors';
import { useCluster, getSectorName, getStageName } from '../../contexts/ClusterContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useMemo } from 'react';
import type { AxisKey } from '../../types';

const Dashboard = () => {
  const { cluster } = useCluster();
  const { 
    axisScores, 
    overallScore, 
    previousScores,
    progress,
    responses,
    totalKPIs
  } = useKPIDiagnosis();
  
  // 축 정의
  const axes = [
    { key: 'GO', label: 'Growth', fullName: '성장 지향성' },
    { key: 'EC', label: 'Economics', fullName: '경제성 및 효율성' },
    { key: 'PT', label: 'Product', fullName: '제품 및 기술' },
    { key: 'PF', label: 'Performance', fullName: '성과 지표' },
    { key: 'TO', label: 'Team & Org', fullName: '팀 및 조직' }
  ];
  
  // 피어 평균 데이터 (임시 - 추후 API 연동)
  const peerAverage = {
    GO: 65,
    EC: 62,
    PT: 68,
    PF: 63,
    TO: 66
  };
  
  // 레이더 차트용 데이터 변환
  const radarData = useMemo(() => {
    return axes.map(axis => ({
      axis: axis.label,
      value: axisScores[axis.key as AxisKey] || 0,
      fullMark: 100
    }));
  }, [axisScores]);
  
  const peerData = axes.map(axis => ({
    axis: axis.label,
    value: peerAverage[axis.key as AxisKey] || 0,
    fullMark: 100
  }));
  
  // 진단 완료율 계산
  const completionRate = useMemo(() => {
    const completedCount = Object.values(responses).filter(r => r.status !== 'unanswered').length;
    return totalKPIs > 0 ? Math.round((completedCount / totalKPIs) * 100) : 0;
  }, [responses, totalKPIs]);
  
  // 이전 대비 변화 계산
  const scoreChange = useMemo(() => {
    if (!previousScores || Object.keys(previousScores).length === 0) return 0;
    const prevAvg = Object.values(previousScores).reduce((sum, score) => sum + score, 0) / Object.values(previousScores).length;
    return overallScore - prevAvg;
  }, [overallScore, previousScores]);

  // 미완료 KPI 항목 추출 (최대 5개)
  const todoItems = useMemo(() => {
    const unansweredKPIs = [];
    
    // 각 축별로 미완료 항목 확인
    for (const axis of axes) {
      const axisKey = axis.key as AxisKey;
      // 해당 축의 미완료 항목 찾기
      const unanswered = Object.entries(responses)
        .filter(([kpiId, response]) => {
          return response.status === 'unanswered' && kpiId.includes(axisKey.toLowerCase());
        })
        .slice(0, 1); // 각 축에서 1개씩만
      
      if (unanswered.length > 0) {
        unansweredKPIs.push({
          id: unansweredKPIs.length + 1,
          kpiId: unanswered[0][0],
          label: `${axis.fullName} KPI 입력 필요`,
          axis: axisKey
        });
      }
    }
    
    // 미완료 항목이 없으면 기본 항목 표시
    if (unansweredKPIs.length === 0) {
      return [
        { id: 1, label: 'MAU 데이터 입력', axis: 'GO' as AxisKey },
        { id: 2, label: '재료 전환율 업데이트', axis: 'EC' as AxisKey },
        { id: 3, label: '팀 구성 정보 확인', axis: 'TO' as AxisKey },
      ];
    }
    
    return unansweredKPIs.slice(0, 5); // 최대 5개
  }, [responses]);

  const recentPrograms = [
    { id: 1, name: 'TIPS ?�로그램', deadline: '2025.04.15', match: 85 },
    { id: 2, name: 'Series A ?�자?�치', deadline: '2025.05.01', match: 78 },
    { id: 3, name: '정부 R&D 지원', deadline: '2025.03.30', match: 72 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-dark">대시보드</h1>
        <p className="text-neutral-gray mt-2">스타트업 성장 현황을 한눈에 확인하세요</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-gray mb-1">현재 등급</p>
                <p className="text-2xl font-bold text-neutral-dark">{cluster.stage}</p>
              </div>
              <div className="bg-primary-light p-3 rounded-full">
                <Award className="text-primary-main" size={24} />
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-gray mb-1">종합 점수</p>
                <p className="text-2xl font-bold text-neutral-dark">{Math.round(overallScore)}</p>
              </div>
              <div className="flex items-center gap-2">
                {scoreChange > 0 ? (
                  <>
                    <TrendingUp className="text-success-main" size={20} />
                    <span className="text-success-main text-sm font-semibold">+{Math.abs(scoreChange).toFixed(1)}</span>
                  </>
                ) : scoreChange < 0 ? (
                  <>
                    <TrendingDown className="text-error-main" size={20} />
                    <span className="text-error-main text-sm font-semibold">{scoreChange.toFixed(1)}</span>
                  </>
                ) : (
                  <>
                    <Activity className="text-neutral-gray" size={20} />
                    <span className="text-neutral-gray text-sm font-semibold">0.0</span>
                  </>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-gray mb-1">섹터</p>
                <p className="text-2xl font-bold text-neutral-dark">{cluster.sector}</p>
                <p className="text-xs text-neutral-gray mt-1">{getSectorName(cluster.sector)}</p>
              </div>
              <div className="bg-accent-purple-light bg-opacity-20 p-3 rounded-full">
                <Target className="text-accent-purple" size={24} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-gray mb-1">진단 완료율</p>
                <p className="text-2xl font-bold text-neutral-dark">{completionRate}%</p>
              </div>
              <div className="w-full max-w-[80px] bg-neutral-border rounded-full h-2 mt-2">
                <div className="bg-secondary-main h-2 rounded-full transition-all duration-500" style={{width: `${completionRate}%`}} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Radar Chart */}
        <div className="col-span-2">
          <Card>
            <CardHeader
              title="5축 평가 결과"
              subtitle={`${cluster.sector} · ${cluster.stage} 단계`}
            />
            <CardBody>
              <div className="h-96">
                <RadarChart 
                  data={radarData}
                  compareData={peerData}
                  showComparison={true}
                />
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary-main rounded-full"></div>
                  <span className="text-sm text-neutral-gray">우리 회사</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-neutral-gray rounded-full opacity-50"></div>
                  <span className="text-sm text-neutral-gray">피어 평균</span>
                </div>
              </div>
              
              {/* 축별 점수 요약 */}
              <div className="grid grid-cols-5 gap-3 mt-6">
                {axes.map(axis => {
                  const score = axisScores[axis.key as AxisKey] || 0;
                  const diff = score - peerAverage[axis.key as AxisKey];
                  return (
                    <div key={axis.key} className="text-center">
                      <p className="text-xs text-neutral-gray mb-1">{axis.fullName}</p>
                      <p className="text-xl font-bold text-neutral-dark">{Math.round(score)}</p>
                      <p className={`text-xs ${diff > 0 ? 'text-success-main' : diff < 0 ? 'text-error-main' : 'text-neutral-gray'}`}>
                        {diff > 0 ? '+' : ''}{Math.round(diff)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* To-do List */}
          <Card>
            <CardHeader
              title="미완료 항목"
              subtitle={`${todoItems.length}개의 항목이 남아있습니다`}
            />
            <CardBody>
              <div className="space-y-3">
                {todoItems.length > 0 ? (
                  todoItems.map(item => (
                    <Link
                      key={item.id}
                      to="/startup/kpi?tab=assess"
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-light hover:bg-neutral-border transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="text-accent-orange" size={18} />
                        <span className="text-sm text-neutral-dark font-medium">{item.label}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getAxisColor(item.axis)}`}>
                          {item.axis}
                        </span>
                      </div>
                      <ArrowRight size={16} className="text-neutral-lighter group-hover:text-neutral-dark transition-colors" />
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-neutral-gray">
                    모든 KPI가 완료되었습니다!
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Recommended Programs */}
          <Card>
            <CardHeader title="추천 프로그램" />
            <CardBody>
              <div className="space-y-3">
                {recentPrograms.map(program => (
                  <div key={program.id} className="border border-neutral-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-neutral-dark">{program.name}</h4>
                      <span className="text-sm font-bold text-secondary-main">{program.match}%</span>
                    </div>
                    <p className="text-sm text-neutral-gray">마감: {program.deadline}</p>
                    <div className="mt-3">
                      <div className="w-full bg-neutral-border rounded-full h-1.5">
                        <div 
                          className="bg-secondary-main h-1.5 rounded-full transition-all duration-300"
                          style={{width: `${program.match}%`}}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link to="/startup/matches">
                  <Button variant="secondary" fullWidth>
                    전체 프로그램 보기
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
