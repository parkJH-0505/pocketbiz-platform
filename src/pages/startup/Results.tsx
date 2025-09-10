import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { RadarChart } from '../../components/common/RadarChart';
import { ProgressBar } from '../../components/common/Progress';
import { 
  Download, Share2, TrendingUp, TrendingDown, 
  Award, Target, ChevronRight,
  BarChart3, FileText, ArrowLeft
} from 'lucide-react';
import { getAxisBgColor } from '../../utils/axisColors';
import { calculateAxisScore, calculateTotalScore, getTopContributors } from '../../utils/scoring';
import { assessmentStorage } from '../../utils/storage';
import { ScoreBreakdown } from '../../components/results/ScoreBreakdown';
import { KPIPerformance } from '../../components/results/KPIPerformance';
import { BenchmarkComparison } from '../../components/results/BenchmarkComparison';
import { InsightCard } from '../../components/results/InsightCard';
import { AIAnalysis } from '../../components/results/AIAnalysis';
import { SWOTAnalysis } from '../../components/results/SWOTAnalysis';
import { generateInsights, analyzeAxis } from '../../utils/insights';
import { generateActionPlan, generateRoadmap } from '../../utils/actionPlan';
import { exportToPDF, generateReportHTML } from '../../utils/pdfExport';
import { ActionPlan } from '../../components/results/ActionPlan';
import { Roadmap } from '../../components/results/Roadmap';
import type { AxisKey, RadarData, KPIResponse } from '../../types';

const Results = () => {
  const navigate = useNavigate();
  const [responses, setResponses] = useState<Record<string, KPIResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'detail' | 'benchmark' | 'insights' | 'action'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  
  // ?�이??로드
  useEffect(() => {
    const loadData = async () => {
      // ?�제로는 API?�서 로드
      const draft = assessmentStorage.loadDraft();
      if (draft) {
        setResponses(draft.responses);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 축별 ?�수 계산
  const axisScores = {
    GO: calculateAxisScore(responses, 'GO'),
    EC: calculateAxisScore(responses, 'EC'),
    PT: calculateAxisScore(responses, 'PT'),
    PF: calculateAxisScore(responses, 'PF'),
    TO: calculateAxisScore(responses, 'TO')
  };

  // 종합 ?�수
  const totalScore = calculateTotalScore(responses);

  // ?�급 계산
  const getGrade = (score: number): { grade: string; color: string } => {
    if (score >= 85) return { grade: 'A+', color: 'text-secondary-main' };
    if (score >= 80) return { grade: 'A', color: 'text-secondary-main' };
    if (score >= 75) return { grade: 'B+', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 65) return { grade: 'C+', color: 'text-accent-orange' };
    if (score >= 60) return { grade: 'C', color: 'text-accent-orange' };
    return { grade: 'D', color: 'text-accent-red' };
  };

  const { grade, color: gradeColor } = getGrade(totalScore);
  
  // 레이더 차트 데이터 먼저 정의
  const radarData: RadarData = {
    run_id: 'current',
    cluster: { sector: 'S1' as const, stage: 'A-3' as const },
    axis_scores: Object.entries(axisScores).map(([axis, score]) => ({
      axis: axis as AxisKey,
      score,
      delta: Math.floor(Math.random() * 10 - 5)
    })),
    overlays: {
      peer_avg: {
        GO: 72,
        EC: 68,
        PT: 70,
        PF: 65,
        TO: 71
      },
      target: {
        GO: 80,
        EC: 80,
        PT: 75,
        PF: 85,
        TO: 75
      }
    }
  };
  
  // 인사이트 생성 - radarData 사용
  const insights = generateInsights(responses, axisScores, radarData.overlays);
  const axisAnalyses = Object.keys(axisScores).map(axis => 
    analyzeAxis(axis as AxisKey, responses, radarData.overlays?.peer_avg?.[axis as AxisKey])
  );
  
  // 액션 플랜 생성
  const actions = generateActionPlan(responses, insights);
  const milestones = generateRoadmap(actions, axisScores);
  
  // PDF ?�보?�기
  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      const pdfData = {
        companyName: '?�스??기업', // ?�제로는 ?�용???�이?�에??가?��?????        assessmentDate: new Date().toLocaleDateString('ko-KR'),
        totalScore,
        grade,
        axisScores,
        insights: insights.slice(0, 10),
        actions: actions.slice(0, 10),
        milestones,
        benchmarks: {
          peerAvg: radarData.overlays?.peer_avg || {},
          top10: radarData.overlays?.target || {}
        }
      };
      
      // HTML ?�성
      const html = generateReportHTML(pdfData);
      
      // PDF 변??(?�제로는 ?�버?�서 처리)
      const pdfBlob = await exportToPDF(pdfData);
      
      // ?�운로드
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocketbiz-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      // 간단???�?? HTML????창에???�기 (브라?��? ?�쇄 기능 ?�용)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF ?�성???�패?�습?�다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="animate-pulse text-primary-main mx-auto mb-4" size={48} />
          <p className="text-neutral-gray">결과�?분석?�고 ?�습?�다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="small"
          onClick={() => navigate('/startup/assessments')}
          className="mb-4"
        >
          <ArrowLeft size={16} />
          ?��?�??�아가�?        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark">?��? 결과</h1>
            <p className="text-neutral-gray mt-2">
              2025??1분기 ?��? 결과 ??{new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" size="small">
              <Share2 size={16} />
              공유?�기
            </Button>
            <Button 
              variant="primary" 
              size="small"
              onClick={handlePDFExport}
              disabled={isExporting}
            >
              <Download size={16} className={isExporting ? 'animate-pulse' : ''} />
              {isExporting ? '?�성 �?..' : 'PDF ?�운로드'}
            </Button>
          </div>
        </div>
      </div>

      {/* 종합 ?�수 카드 */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2">
          <CardBody className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-neutral-gray mb-2">종합 ?��? ?�수</h2>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold text-neutral-dark">{Math.round(totalScore)}</span>
                  <span className="text-3xl font-bold text-neutral-gray">/100</span>
                </div>
                <div className="mt-4">
                  <ProgressBar
                    value={totalScore}
                    max={100}
                    size="large"
                    variant={totalScore >= 70 ? 'success' : totalScore >= 50 ? 'warning' : 'error'}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold ${gradeColor}`}>{grade}</div>
                <p className="text-sm text-neutral-gray mt-2">?�급</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-gray">종합평가 결과</h3>
              <Target className="text-primary-main" size={20} />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-gray">순위</span>
                  <span className="font-semibold text-neutral-dark">23%</span>
                </div>
                <ProgressBar
                  value={77}
                  max={100}
                  size="small"
                  variant="default"
                />
              </div>
              <p className="text-xs text-neutral-gray">
                ?�종?�계 ?�균 ?�수: 65.3??              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ??�� 컨텐�?*/}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-3 gap-6">
          {/* ?�이??차트 */}
          <div className="col-span-2">
            <RadarChart data={radarData} />
          </div>

          {/* 축별 ?�수 */}
          <div className="space-y-6">
          <Card>
            <CardHeader title="축별 ?��? ?�수" />
            <CardBody>
              <div className="space-y-4">
                {Object.entries(axisScores).map(([axis, score]) => {
                  const topContrib = getTopContributors(responses, axis as AxisKey, 1)[0];
                  return (
                    <div key={axis} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${getAxisBgColor(axis)}`} />
                          <div>
                            <span className="font-medium text-neutral-dark">{axis}</span>
                            <p className="text-xs text-neutral-gray">
                              {axis === 'GO' && 'Growth Opportunity'}
                              {axis === 'EC' && 'Economic Value'}
                              {axis === 'PT' && 'Product Technology'}
                              {axis === 'PF' && 'Performance Finance'}
                              {axis === 'TO' && 'Team Organization'}
                            </p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-neutral-dark">{score}</span>
                      </div>
                      <ProgressBar
                        value={score}
                        max={100}
                        size="small"
                        variant={score >= 70 ? 'success' : score >= 50 ? 'warning' : 'error'}
                      />
                      {topContrib && (
                        <p className="text-xs text-neutral-gray">
                          최고 기여: {topContrib.name} ({topContrib.score}??
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* 주요 ?�과 지??*/}
          <Card>
            <CardHeader title="주요 ?�과" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-secondary-light p-2 rounded-full">
                    <TrendingUp className="text-secondary-main" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-dark">가???��? ?�수</p>
                    <p className="text-sm text-neutral-gray">
                      {Object.entries(axisScores).reduce((a, b) => a[1] > b[1] ? a : b)[0]} �?({Math.max(...Object.values(axisScores))}??
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-accent-red bg-opacity-10 p-2 rounded-full">
                    <TrendingDown className="text-accent-red" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-dark">개선 ?�요</p>
                    <p className="text-sm text-neutral-gray">
                      {Object.entries(axisScores).reduce((a, b) => a[1] < b[1] ? a : b)[0]} �?({Math.min(...Object.values(axisScores))}??
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary-light p-2 rounded-full">
                    <Award className="text-primary-main" size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-dark">부분별 평가</p>
                    <p className="text-sm text-neutral-gray">
                      +5.3% 상승 (지속적 성장)
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    )}

      {/* 탭 네비게이션 */}
      <div className="mt-8 mb-6">
        <div className="border-b border-neutral-border">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'overview'
                  ? 'text-primary-main border-primary-main'
                  : 'text-neutral-gray border-transparent hover:text-neutral-dark'
              }`}
            >
              결과 ?�약
            </button>
            <button
              onClick={() => setActiveTab('detail')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'detail'
                  ? 'text-primary-main border-primary-main'
                  : 'text-neutral-gray border-transparent hover:text-neutral-dark'
              }`}
            >
              ?�세 분석
            </button>
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'benchmark'
                  ? 'text-primary-main border-primary-main'
                  : 'text-neutral-gray border-transparent hover:text-neutral-dark'
              }`}
            >
              벤치마킹
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'insights'
                  ? 'text-primary-main border-primary-main'
                  : 'text-neutral-gray border-transparent hover:text-neutral-dark'
              }`}
            >
              AI ?�사?�트
            </button>
            <button
              onClick={() => setActiveTab('action')}
              className={`px-6 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
                activeTab === 'action'
                  ? 'text-primary-main border-primary-main'
                  : 'text-neutral-gray border-transparent hover:text-neutral-dark'
              }`}
            >
              ?�션 ?�랜
            </button>
          </div>
        </div>
      </div>

      {/* ??컨텐�?*/}
      {activeTab === 'detail' && (
        <div className="space-y-8">
          <ScoreBreakdown
            axisScores={axisScores}
            previousScores={{
              GO: 60, EC: 65, PT: 58, PF: 68, TO: 62
            }}
            peerAvgScores={radarData.overlays?.peer_avg}
          />
          <KPIPerformance responses={responses} />
        </div>
      )}

      {activeTab === 'benchmark' && (
        <BenchmarkComparison
          currentScores={axisScores}
          benchmarks={{
            industry: radarData.overlays?.peer_avg || {},
            stage: {
              GO: 68, EC: 70, PT: 65, PF: 72, TO: 68
            },
            top10: radarData.overlays?.target || {}
          }}
        />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-8">
          {/* ?�심 ?�사?�트 */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">?�심 ?�사?�트</h3>
            <div className="grid grid-cols-2 gap-4">
              {insights.slice(0, 6).map((insight, idx) => (
                <InsightCard 
                  key={idx} 
                  insight={insight}
                  onAction={() => setActiveTab('action')}
                />
              ))}
            </div>
          </div>
          
          {/* AI 분석 */}
          <AIAnalysis 
            analyses={axisAnalyses}
            totalScore={totalScore}
          />
          
          {/* SWOT 분석 */}
          <SWOTAnalysis insights={insights} />
        </div>
      )}
      
      {activeTab === 'action' && (
        <div className="space-y-8">
          {/* ?�선?�위 ?�션 ?�랜 */}
          <ActionPlan actions={actions} />
          
          {/* ?�장 로드�?*/}
          <Roadmap 
            milestones={milestones} 
            currentScore={totalScore}
          />
        </div>
      )}

      {/* ?�음 ?�계 */}
      <Card className="mt-8">
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">?�음 ?�계</h3>
              <p className="text-neutral-gray">
                ?�세??분석 결과?� 맞춤??개선 ?�안???�인?�세??              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary">
                <FileText size={16} />
                ?�세 리포??              </Button>
              <Button 
                variant="primary"
                onClick={() => setActiveTab('action')}
              >
                개선 ?�안 ?�인
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default Results;
