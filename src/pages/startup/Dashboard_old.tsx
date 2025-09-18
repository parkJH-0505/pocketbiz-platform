import { RadarChart } from '../../components/charts/RadarChart';
import { ArrowRight, AlertCircle, Activity, Target, Award, TrendingUp, TrendingDown, Package, Calendar, CheckCircle, FileText, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getAxisColor } from '../../utils/axisColors';
import { useCluster, getSectorName, getStageName } from '../../contexts/ClusterContext';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useMemo } from 'react';
import type { AxisKey } from '../../types';
import { PHASE_INFO, ALL_PHASES, calculatePhaseProgress } from '../../utils/projectPhaseUtils';
import { IndustryInsights, CompetitorUpdates } from '../../components/dashboard/IndustryInsights';
import { GrowthChart, GoalTracking, MilestoneTracking } from '../../components/dashboard/GrowthTracking';
import { SmartRecommendations, PersonalizedInsights } from '../../components/dashboard/PersonalizedRecommendations';
import { IRDeckBuilder } from '../../components/automation/IRDeckBuilder';
import { VCEmailBuilder } from '../../components/automation/VCEmailBuilder';
import { GovernmentDocBuilder } from '../../components/automation/GovernmentDocBuilder';
import { NotificationToastContainer } from '../../components/notifications/NotificationToast';
import { useNotifications } from '../../contexts/NotificationContext';
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const [showIRBuilder, setShowIRBuilder] = useState(false);
  const [showVCEmailBuilder, setShowVCEmailBuilder] = useState(false);
  const [showGovernmentDocBuilder, setShowGovernmentDocBuilder] = useState(false);
  const { cluster } = useCluster();
  const { notifications, getUnreadNotifications, removeNotification, addNotification } = useNotifications();
  const {
    axisScores,
    overallScore,
    previousScores,
    progress,
    responses,
    totalKPIs
  } = useKPIDiagnosis();
  const { activeProjects, completedProjects } = useBuildupContext();
  
  // 축 정의
  const axes = [
    { key: 'GO', label: 'Growth & Ops', fullName: '성장·운영' },
    { key: 'EC', label: 'Economics', fullName: '경제성·자본' },
    { key: 'PT', label: 'Product & Tech', fullName: '제품·기술력' },
    { key: 'PF', label: 'Proof', fullName: '증빙·딜레디' },
    { key: 'TO', label: 'Team & Org', fullName: '팀·조직 역량' }
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

  // 샘플 알림 생성 (테스트용)
  useEffect(() => {
    const timers = [
      setTimeout(() => {
        addNotification({
          type: 'achievement',
          priority: 'medium',
          title: '🎉 대시보드에 오신 것을 환영합니다!',
          message: '실시간 알림 시스템이 활성화되었습니다. KPI 변화와 중요한 업데이트를 놓치지 마세요.',
          icon: '🎉',
          color: 'text-blue-600',
          actionUrl: '/startup/kpi',
          actionLabel: 'KPI 확인하기'
        });
      }, 2000),

      setTimeout(() => {
        addNotification({
          type: 'investment_match',
          priority: 'high',
          title: '💰 새로운 투자 기회 발견!',
          message: 'TIPS 프로그램과 85% 매칭됩니다. 마감일이 7일 남았으니 서둘러 지원하세요.',
          icon: '💰',
          color: 'text-green-600',
          actionUrl: '/startup/matching',
          actionLabel: '자세히 보기'
        });
      }, 4000),

      setTimeout(() => {
        addNotification({
          type: 'kpi_milestone',
          priority: 'urgent',
          title: '🎯 성장·운영 영역 80점 돌파!',
          message: '축하합니다! 성장·운영 영역에서 80점을 달성했습니다. (현재: 82.3점)',
          icon: '🎯',
          color: 'text-green-600',
          actionUrl: '/startup/kpi',
          actionLabel: 'KPI 상세보기'
        });
      }, 6000),

      setTimeout(() => {
        addNotification({
          type: 'program_deadline',
          priority: 'urgent',
          title: '⏰ Series A 투자계획서 마감 임박!',
          message: 'Series A 투자계획서 제출 마감까지 2일 남았습니다. 지금 확인하세요!',
          icon: '⏰',
          color: 'text-red-600',
          actionUrl: '/startup/buildup',
          actionLabel: '빠른 지원',
          expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2일 후 만료
        });
      }, 8000)
    ];

    return () => timers.forEach(clearTimeout);
  }, [addNotification]);

  const recentPrograms = [
    { id: 1, name: 'TIPS ?�로그램', deadline: '2025.04.15', match: 85 },
    { id: 2, name: 'Series A ?�자?�치', deadline: '2025.05.01', match: 78 },
    { id: 3, name: '정부 R&D 지원', deadline: '2025.03.30', match: 72 },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-dark">대시보드</h1>
          <p className="text-neutral-gray mt-2">스타트업 성장 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-neutral-gray">등급</p>
            <p className="text-sm font-semibold text-neutral-dark">{cluster.stage}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-gray">섹터</p>
            <p className="text-sm font-semibold text-neutral-dark">{cluster.sector}</p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 그리드 */}
      <div className="grid grid-cols-12 gap-6">
        {/* 좌측 메인 영역 (8칸) */}
        <div className="col-span-8 space-y-6">
          {/* 이번 주 일정 */}
          <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-neutral-dark">이번 주 일정</h2>
                <span className="text-sm text-neutral-gray">
                  {new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* 진행중인 프로젝트 */}
              <div>
                <h3 className="text-sm font-medium text-neutral-gray mb-3">진행중인 프로젝트</h3>
                {activeProjects.length > 0 ? (
                  <div className="space-y-3">
                    {activeProjects.slice(0, 3).map(project => {
                      const phase = project.phase || 'contract_pending';
                      const progress = calculatePhaseProgress(phase);
                      return (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-neutral-light rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-neutral-dark">{project.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-32 h-2 bg-neutral-border rounded-full">
                                <div
                                  className="h-2 bg-primary-main rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-neutral-gray">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </div>
                          <Link
                            to={`/startup/buildup/projects/${project.id}`}
                            className="ml-4 px-3 py-1 bg-primary-main text-white rounded-md text-sm hover:bg-primary-hover transition-colors"
                          >
                            보기
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-gray italic">진행중인 프로젝트가 없습니다</p>
                )}
              </div>

              {/* 이번 주 미팅 */}
              <div>
                <h3 className="text-sm font-medium text-neutral-gray mb-3">이번 주 미팅</h3>
                <div className="space-y-2">
                  {/* 샘플 미팅 데이터 */}
                  <div className="flex items-center gap-3 p-3 border border-neutral-border rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-primary-main" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-dark">IR덱 검토 미팅</p>
                      <p className="text-sm text-neutral-gray">1월 18일 14:00 · 온라인</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-neutral-border rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-secondary-main" />
                    <div className="flex-1">
                      <p className="font-medium text-neutral-dark">TIPS 프로그램 멘토링</p>
                      <p className="text-sm text-neutral-gray">1월 20일 10:00 · 강남</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 이번 주 마감 */}
              <div>
                <h3 className="text-sm font-medium text-neutral-gray mb-3">마감 예정</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-dark">Series A 투자계획서</p>
                      <p className="text-sm text-orange-600">D-2 · 1월 17일</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">긴급</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border border-neutral-border rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-dark">월간 KPI 업데이트</p>
                      <p className="text-sm text-neutral-gray">D-5 · 1월 20일</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">일반</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* 성장 트래킹 */}
          <GrowthChart />

          {/* 목표 및 마일스톤 */}
          <div className="grid grid-cols-2 gap-6">
            <GoalTracking />
            <MilestoneTracking />
          </div>

          {/* 개인화 인사이트 */}
          <PersonalizedInsights />
        </div>

        {/* 우측 사이드 영역 (4칸) */}
        <div className="col-span-4 space-y-6">
          {/* 맞춤 추천 */}
          <SmartRecommendations />

          {/* 업계 인사이트 */}
          <IndustryInsights />

          {/* 빠른 작업 */}
          <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-dark">빠른 작업</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/startup/kpi?tab=assess"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary-main text-white border border-primary-main hover:bg-primary-hover transition-all"
                >
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">KPI 업데이트</span>
                </Link>
                <button
                  onClick={() => setShowIRBuilder(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white text-neutral-dark border border-neutral-border hover:border-primary-main hover:bg-primary-light transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">IR덱 생성</span>
                </button>
                <button
                  onClick={() => setShowVCEmailBuilder(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white text-neutral-dark border border-neutral-border hover:border-primary-main hover:bg-primary-light transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">VC 이메일</span>
                </button>
                <Link
                  to="/startup/buildup/catalog"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white text-neutral-dark border border-neutral-border hover:border-primary-main hover:bg-primary-light transition-all"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">빌드업 상담</span>
                </Link>
                <Link
                  to="/startup/matches"
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white text-neutral-dark border border-neutral-border hover:border-primary-main hover:bg-primary-light transition-all"
                >
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">투자 매칭</span>
                </Link>
                <button
                  onClick={() => setShowGovernmentDocBuilder(true)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-white text-neutral-dark border border-neutral-border hover:border-primary-main hover:bg-primary-light transition-all"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">정부지원</span>
                </button>
              </div>
            </CardBody>
          </Card>

          {/* 추천 프로그램 */}
          <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
            <CardHeader>
              <h3 className="text-lg font-semibold text-neutral-dark">추천 프로그램</h3>
            </CardHeader>
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

      {/* IR덱 빌더 모달 */}
      {showIRBuilder && (
        <IRDeckBuilder onClose={() => setShowIRBuilder(false)} />
      )}

      {/* VC 이메일 빌더 모달 */}
      {showVCEmailBuilder && (
        <VCEmailBuilder onClose={() => setShowVCEmailBuilder(false)} />
      )}

      {/* 정부지원 서류 빌더 모달 */}
      {showGovernmentDocBuilder && (
        <GovernmentDocBuilder onClose={() => setShowGovernmentDocBuilder(false)} />
      )}

      {/* 알림 토스트 컨테이너 */}
      <NotificationToastContainer
        notifications={getUnreadNotifications().filter(n => n.priority === 'urgent' || n.priority === 'high')}
        onRemove={removeNotification}
        maxToasts={3}
        position="top-right"
      />
    </div>
  );
};

export default Dashboard;
