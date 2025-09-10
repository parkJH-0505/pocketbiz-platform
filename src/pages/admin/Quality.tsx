import { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  Database, Activity, BarChart3, PieChart, RefreshCw, Download,
  Info, Filter, Calendar, ArrowUp, ArrowDown, Minus, FileWarning
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import type { 
  DataQualityMetrics,
  KPICompletionStats,
  SectorStats,
  StageStats,
  DataAnomaly,
  ConsistencyCheckResult
} from '../../types/dataQuality';

const Quality = () => {
  // 상태 관리
  const [metrics, setMetrics] = useState<DataQualityMetrics | null>(null);
  const [kpiStats, setKpiStats] = useState<KPICompletionStats[]>([]);
  const [sectorStats, setSectorStats] = useState<SectorStats[]>([]);
  const [stageStats, setStageStats] = useState<StageStats[]>([]);
  const [anomalies, setAnomalies] = useState<DataAnomaly[]>([]);
  const [consistencyChecks, setConsistencyChecks] = useState<ConsistencyCheckResult[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'completion' | 'anomalies' | 'consistency'>('overview');
  const [overallScore, setOverallScore] = useState(85);
  const [trend, setTrend] = useState<'improving' | 'stable' | 'declining'>('stable');

  // 초기 데이터 로드
  useEffect(() => {
    loadQualityData();
  }, []);

  const loadQualityData = async () => {
    setIsRefreshing(true);
    
    // 샘플 데이터
    setMetrics({
      totalStartups: 156,
      totalEvaluations: 423,
      averageCompletionRate: 78.5,
      lastUpdated: new Date()
    });

    setKpiStats([
      {
        kpiId: 'S1-GO-01',
        kpiName: '고객 문제 정의 수준',
        axis: 'GO',
        totalRequired: 156,
        totalCompleted: 145,
        completionRate: 92.9,
        missingCount: 11
      },
      {
        kpiId: 'S1-GO-02',
        kpiName: '목표 시장 검증 수준',
        axis: 'GO',
        totalRequired: 156,
        totalCompleted: 132,
        completionRate: 84.6,
        missingCount: 24
      },
      {
        kpiId: 'S1-EC-01',
        kpiName: '재무 관리 수준',
        axis: 'EC',
        totalRequired: 156,
        totalCompleted: 98,
        completionRate: 62.8,
        missingCount: 58
      }
    ]);

    setSectorStats([
      {
        sector: 'S1',
        startupCount: 45,
        evaluationCount: 123,
        averageScore: 72.5,
        averageCompletionRate: 82.3,
        topPerformers: 12,
        lowPerformers: 5
      },
      {
        sector: 'S2',
        startupCount: 38,
        evaluationCount: 95,
        averageScore: 68.9,
        averageCompletionRate: 75.8,
        topPerformers: 8,
        lowPerformers: 7
      }
    ]);

    setStageStats([
      {
        stage: 'A-1',
        startupCount: 42,
        evaluationCount: 85,
        averageScore: 65.2,
        averageCompletionRate: 71.5,
        progressionRate: 45.2
      },
      {
        stage: 'A-2',
        startupCount: 35,
        evaluationCount: 98,
        averageScore: 71.8,
        averageCompletionRate: 78.9,
        progressionRate: 62.8
      },
      {
        stage: 'A-3',
        startupCount: 28,
        evaluationCount: 112,
        averageScore: 78.4,
        averageCompletionRate: 85.2,
        progressionRate: 71.4
      }
    ]);

    setAnomalies([
      {
        id: '1',
        type: 'outlier',
        severity: 'high',
        entityType: 'evaluation',
        entityId: 'eval-123',
        field: 'GO_SCORE',
        currentValue: 150,
        expectedRange: { min: 0, max: 100 },
        description: 'GO 축 점수가 최대값을 초과했습니다',
        detectedAt: new Date(),
        resolved: false
      },
      {
        id: '2',
        type: 'inconsistent',
        severity: 'medium',
        entityType: 'startup',
        entityId: 'startup-456',
        field: 'STAGE',
        currentValue: 'A-1',
        description: '매출 데이터와 단계가 일치하지 않습니다',
        detectedAt: new Date(Date.now() - 86400000),
        resolved: false
      }
    ]);

    setConsistencyChecks([
      {
        checkId: '1',
        checkName: '축별 가중치 합계 검증',
        status: 'passed',
        checkedAt: new Date(),
        totalChecked: 156,
        passedCount: 156,
        failedCount: 0,
        warningCount: 0,
        details: []
      },
      {
        checkId: '2',
        checkName: '필수 KPI 입력 검증',
        status: 'warning',
        checkedAt: new Date(),
        totalChecked: 156,
        passedCount: 98,
        failedCount: 24,
        warningCount: 34,
        details: [
          {
            entityId: 'startup-789',
            issue: '필수 KPI 3개 미입력',
            suggestion: '재무 관련 KPI 입력 필요'
          }
        ]
      }
    ]);

    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // 점수별 색상
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-blue-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // 심각도별 색상
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 체크 상태별 아이콘
  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="text-green-600" size={20} />;
      case 'failed': return <XCircle className="text-red-600" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-600" size={20} />;
      default: return <Info className="text-gray-600" size={20} />;
    }
  };

  return (
    <div className="p-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">데이터 품질 대시보드</h1>
            <p className="text-sm text-neutral-gray mt-1">
              데이터 완성도, 정합성, 이상치를 모니터링합니다
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => console.log('Export report')}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              리포트 다운로드
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={loadQualityData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              새로고침
            </Button>
          </div>
        </div>

        {/* 전체 품질 점수 */}
        <div className="bg-white p-6 rounded-lg border border-neutral-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#3b82f6' : '#f59e0b'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(overallScore / 100) * 226} 226`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{overallScore}</span>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-dark mb-1">
                  데이터 품질 점수
                </h2>
                <div className="flex items-center gap-2">
                  {trend === 'improving' && (
                    <>
                      <TrendingUp className="text-green-600" size={20} />
                      <span className="text-sm text-green-600">개선 중</span>
                    </>
                  )}
                  {trend === 'stable' && (
                    <>
                      <Minus className="text-blue-600" size={20} />
                      <span className="text-sm text-blue-600">안정적</span>
                    </>
                  )}
                  {trend === 'declining' && (
                    <>
                      <TrendingDown className="text-red-600" size={20} />
                      <span className="text-sm text-red-600">하락 중</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {metrics && (
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-neutral-gray">총 스타트업</p>
                  <p className="text-2xl font-bold text-neutral-dark">{metrics.totalStartups}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray">총 평가</p>
                  <p className="text-2xl font-bold text-neutral-dark">{metrics.totalEvaluations}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray">평균 완성도</p>
                  <p className={`text-2xl font-bold ${getScoreColor(metrics.averageCompletionRate)}`}>
                    {metrics.averageCompletionRate.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-gray">이상치</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {anomalies.filter(a => !a.resolved).length}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-neutral-border mb-6">
        <div className="flex">
          {[
            { key: 'overview', label: '개요', icon: BarChart3 },
            { key: 'completion', label: 'KPI 완성도', icon: PieChart },
            { key: 'anomalies', label: '이상치', icon: AlertTriangle },
            { key: 'consistency', label: '정합성 체크', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`px-6 py-3 flex items-center gap-2 font-medium text-sm border-b-2 transition-colors ${
                  selectedTab === tab.key
                    ? 'border-primary-main text-primary-main'
                    : 'border-transparent text-neutral-gray hover:text-neutral-dark'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {/* 개요 탭 */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-2 gap-6">
            {/* 섹터별 통계 */}
            <div className="bg-white rounded-lg border border-neutral-border p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">섹터별 품질</h3>
              <div className="space-y-4">
                {sectorStats.map(sector => (
                  <div key={sector.sector} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-12 font-medium">{sector.sector}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-gray">완성도</span>
                          <span className={getScoreColor(sector.averageCompletionRate)}>
                            {sector.averageCompletionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              sector.averageCompletionRate >= 80 ? 'bg-green-500' :
                              sector.averageCompletionRate >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${sector.averageCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-gray">
                      {sector.startupCount} 스타트업
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 단계별 통계 */}
            <div className="bg-white rounded-lg border border-neutral-border p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">단계별 품질</h3>
              <div className="space-y-4">
                {stageStats.map(stage => (
                  <div key={stage.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-12 font-medium">{stage.stage}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-neutral-gray">완성도</span>
                          <span className={getScoreColor(stage.averageCompletionRate)}>
                            {stage.averageCompletionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-48 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stage.averageCompletionRate >= 80 ? 'bg-green-500' :
                              stage.averageCompletionRate >= 60 ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${stage.averageCompletionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-gray">
                      {stage.startupCount} 스타트업
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 최근 이상치 */}
            <div className="bg-white rounded-lg border border-neutral-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-dark">최근 이상치</h3>
                <span className="text-sm text-neutral-gray">
                  미해결: {anomalies.filter(a => !a.resolved).length}
                </span>
              </div>
              <div className="space-y-3">
                {anomalies.slice(0, 5).map(anomaly => (
                  <div key={anomaly.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileWarning className={
                      anomaly.severity === 'critical' || anomaly.severity === 'high' 
                        ? 'text-red-600' 
                        : 'text-yellow-600'
                    } size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-dark">
                        {anomaly.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity}
                        </span>
                        <span className="text-xs text-neutral-gray">
                          {anomaly.entityType} - {anomaly.field}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 정합성 체크 결과 */}
            <div className="bg-white rounded-lg border border-neutral-border p-6">
              <h3 className="text-lg font-semibold text-neutral-dark mb-4">정합성 체크</h3>
              <div className="space-y-3">
                {consistencyChecks.map(check => (
                  <div key={check.checkId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCheckIcon(check.status)}
                      <div>
                        <p className="text-sm font-medium text-neutral-dark">
                          {check.checkName}
                        </p>
                        <p className="text-xs text-neutral-gray">
                          {check.totalChecked}개 검사 / {check.passedCount} 통과
                        </p>
                      </div>
                    </div>
                    {check.failedCount > 0 && (
                      <span className="text-sm text-red-600 font-medium">
                        {check.failedCount} 실패
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI 완성도 탭 */}
        {selectedTab === 'completion' && (
          <div className="bg-white rounded-lg border border-neutral-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-dark">KPI별 입력 현황</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-gray">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>90% 이상</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>70-90%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>50-70%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>50% 미만</span>
                  </div>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-dark">KPI</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-dark">축</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-dark">필수</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-dark">완료</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-dark">미입력</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-neutral-dark">완성도</th>
                  </tr>
                </thead>
                <tbody>
                  {kpiStats.map((kpi, index) => (
                    <tr key={kpi.kpiId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-dark">{kpi.kpiId}</p>
                          <p className="text-xs text-neutral-gray">{kpi.kpiName}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-primary-light text-primary-dark rounded text-xs">
                          {kpi.axis}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm">{kpi.totalRequired}</td>
                      <td className="py-3 px-4 text-right text-sm">{kpi.totalCompleted}</td>
                      <td className="py-3 px-4 text-right text-sm text-red-600">{kpi.missingCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                kpi.completionRate >= 90 ? 'bg-green-500' :
                                kpi.completionRate >= 70 ? 'bg-blue-500' :
                                kpi.completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${kpi.completionRate}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(kpi.completionRate)}`}>
                            {kpi.completionRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 이상치 탭 */}
        {selectedTab === 'anomalies' && (
          <div className="bg-white rounded-lg border border-neutral-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-dark">데이터 이상치 목록</h3>
              <div className="flex gap-2">
                <select className="px-3 py-1.5 border border-neutral-border rounded-lg text-sm">
                  <option value="all">모든 유형</option>
                  <option value="outlier">이상값</option>
                  <option value="inconsistent">불일치</option>
                  <option value="duplicate">중복</option>
                  <option value="invalid">무효</option>
                </select>
                <select className="px-3 py-1.5 border border-neutral-border rounded-lg text-sm">
                  <option value="all">모든 심각도</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {anomalies.map(anomaly => (
                <div key={anomaly.id} className="border border-neutral-border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-neutral-gray">
                          {anomaly.type} | {anomaly.entityType}
                        </span>
                        {anomaly.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            해결됨
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutral-dark mb-2">
                        {anomaly.description}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-neutral-gray">필드: </span>
                          <span className="font-medium">{anomaly.field}</span>
                        </div>
                        <div>
                          <span className="text-neutral-gray">현재값: </span>
                          <span className="font-medium text-red-600">{anomaly.currentValue}</span>
                        </div>
                        {anomaly.expectedRange && (
                          <div>
                            <span className="text-neutral-gray">정상범위: </span>
                            <span className="font-medium">
                              {anomaly.expectedRange.min} ~ {anomaly.expectedRange.max}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!anomaly.resolved && (
                      <div className="flex gap-2">
                        <Button variant="secondary" size="small">
                          검토
                        </Button>
                        <Button variant="primary" size="small">
                          해결
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 정합성 체크 탭 */}
        {selectedTab === 'consistency' && (
          <div className="space-y-6">
            {consistencyChecks.map(check => (
              <div key={check.checkId} className="bg-white rounded-lg border border-neutral-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getCheckIcon(check.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-dark">{check.checkName}</h3>
                      <p className="text-sm text-neutral-gray">
                        마지막 검사: {new Date(check.checkedAt).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="small">
                    재검사
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-neutral-gray">총 검사</p>
                    <p className="text-xl font-bold text-neutral-dark">{check.totalChecked}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700">통과</p>
                    <p className="text-xl font-bold text-green-700">{check.passedCount}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-700">경고</p>
                    <p className="text-xl font-bold text-yellow-700">{check.warningCount}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700">실패</p>
                    <p className="text-xl font-bold text-red-700">{check.failedCount}</p>
                  </div>
                </div>

                {check.details.length > 0 && (
                  <div className="border-t border-neutral-border pt-4">
                    <h4 className="text-sm font-medium text-neutral-dark mb-2">상세 내역</h4>
                    <div className="space-y-2">
                      {check.details.map((detail, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="text-sm text-neutral-dark">{detail.issue}</p>
                            {detail.suggestion && (
                              <p className="text-xs text-neutral-gray mt-1">
                                제안: {detail.suggestion}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-neutral-gray">{detail.entityId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quality;