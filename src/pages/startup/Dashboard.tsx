import { RadarChart } from '../../components/common/RadarChart';
import { ArrowRight, AlertCircle, Activity, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getAxisColor } from '../../utils/axisColors';
import { useCluster, getSectorName, getStageName } from '../../contexts/ClusterContext';

const Dashboard = () => {
  const { cluster } = useCluster();
  
  // Mock data
  const mockRadarData = {
    run_id: '2025Q3-0001',
    cluster: { sector: 'S-1' as const, stage: 'A-3' as const },
    axis_scores: [
      { axis: 'GO' as const, score: 78, delta: 6 },
      { axis: 'EC' as const, score: 63, delta: 2 },
      { axis: 'PT' as const, score: 55, delta: -3 },
      { axis: 'PF' as const, score: 71, delta: 1 },
      { axis: 'TO' as const, score: 60, delta: 0 },
    ],
    overlays: {
      prev: { GO: 72, EC: 61, PT: 58, PF: 70, TO: 60 },
      peer_avg: { GO: 65, EC: 66, PT: 60, PF: 68, TO: 62 },
      target: { GO: 80, EC: 75, PT: 70, PF: 80, TO: 70 },
    },
  };

  const todoItems = [
    { id: 1, label: 'MAU 데이터 입력', axis: 'GO' },
    { id: 2, label: '재료 전환율 업데이트', axis: 'EC' },
    { id: 3, label: '팀 구성 정보 확인', axis: 'TO' },
  ];

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
                <p className="text-2xl font-bold text-neutral-dark">65.4</p>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="text-secondary-main" size={20} />
                <span className="text-secondary-main text-sm font-semibold">+3.2</span>
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
                <p className="text-2xl font-bold text-neutral-dark">87%</p>
              </div>
              <div className="w-full max-w-[80px] bg-neutral-border rounded-full h-2 mt-2">
                <div className="bg-secondary-main h-2 rounded-full" style={{width: '87%'}} />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Radar Chart */}
        <div className="col-span-2">
          <RadarChart data={mockRadarData} />
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
                {todoItems.map(item => (
                  <Link
                    key={item.id}
                    to="/startup/assessments"
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
                ))}
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
