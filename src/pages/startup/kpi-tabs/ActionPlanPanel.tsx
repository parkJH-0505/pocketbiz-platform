/**
 * 액션플랜 패널 - 포켓컴퍼니 빌드업 생태계 연결
 * Created: 2025-01-11
 */

import { useState, useMemo } from 'react';
import { 
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  Award,
  Zap,
  BookOpen,
  MessageCircle,
  Star,
  CheckCircle2,
  ArrowRight,
  Target,
  Sparkles
} from 'lucide-react';
import { Card, CardBody } from '../../../components/common/Card';
import { useKPIDiagnosis } from '../../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../../contexts/ClusterContext';
import type { AxisKey } from '../../../types';

// 빌드업 프로그램 데이터
const buildupPrograms = {
  GO: {
    name: 'Growth Hacking 마스터클래스',
    duration: '8주',
    format: '온라인 + 오프라인 워크샵',
    curriculum: [
      'Week 1-2: 그로스 지표 설계 및 분석',
      'Week 3-4: 고객 획득 채널 최적화',
      'Week 5-6: 리텐션 & 액티베이션 전략',
      'Week 7-8: 바이럴 루프 구축'
    ],
    expectedImprovement: 20,
    successCase: {
      company: 'A사 (에듀테크)',
      result: 'MAU 300% 성장, CAC 50% 감소'
    }
  },
  EC: {
    name: '유닛이코노믹스 집중 개선',
    duration: '6주',
    format: '1:1 컨설팅 + 실습',
    curriculum: [
      'Week 1-2: CAC/LTV 심층 분석',
      'Week 3-4: 가격 전략 최적화',
      'Week 5-6: 수익 모델 다각화'
    ],
    expectedImprovement: 25,
    successCase: {
      company: 'B사 (SaaS)',
      result: 'BEP 달성, 총이익률 35% 개선'
    }
  },
  PT: {
    name: 'Product-Market Fit 액셀러레이팅',
    duration: '10주',
    format: '멘토링 + 스프린트',
    curriculum: [
      'Week 1-3: 고객 인터뷰 & 페인포인트 발굴',
      'Week 4-6: MVP 고도화 스프린트',
      'Week 7-9: 사용성 테스트 & 피드백 루프',
      'Week 10: PMF 지표 검증'
    ],
    expectedImprovement: 30,
    successCase: {
      company: 'C사 (헬스케어)',
      result: 'NPS 40점 상승, 리텐션 2배'
    }
  },
  PF: {
    name: '데이터 드리븐 퍼포먼스 관리',
    duration: '4주',
    format: '온라인 부트캠프',
    curriculum: [
      'Week 1: 핵심 지표 대시보드 구축',
      'Week 2: A/B 테스트 프레임워크',
      'Week 3: 코호트 분석 실습',
      'Week 4: 예측 모델링 기초'
    ],
    expectedImprovement: 15,
    successCase: {
      company: 'D사 (커머스)',
      result: '전환율 80% 개선, ROAS 2.5배'
    }
  },
  TO: {
    name: '하이퍼포밍 팀 빌딩',
    duration: '12주',
    format: '팀 워크샵 + 코칭',
    curriculum: [
      'Month 1: 채용 프로세스 최적화',
      'Month 2: 조직문화 & 비전 정렬',
      'Month 3: 성과관리 시스템 구축'
    ],
    expectedImprovement: 20,
    successCase: {
      company: 'E사 (핀테크)',
      result: '이직률 70% 감소, eNPS 45점'
    }
  }
};

// 전문가 데이터
const experts = {
  GO: {
    name: '김성장',
    title: '그로스 해킹 전문가',
    experience: '前 쿠팡 그로스팀 리드, 100+ 스타트업 자문',
    expertise: ['바이럴 마케팅', 'PLG 전략', '리텐션 최적화'],
    rating: 4.9
  },
  EC: {
    name: '이경제',
    title: '재무 전략 컨설턴트',
    experience: '前 맥킨지 시니어 컨설턴트, Series B+ 20개사 자문',
    expertise: ['유닛이코노믹스', '가격 전략', '투자 유치'],
    rating: 4.8
  },
  PT: {
    name: '박제품',
    title: 'CPO & 프로덕트 코치',
    experience: '前 네이버 프로덕트 매니저, 3개 유니콘 CPO',
    expertise: ['PMF 검증', 'UX 최적화', '애자일 방법론'],
    rating: 4.9
  },
  PF: {
    name: '정성과',
    title: '데이터 사이언티스트',
    experience: '前 카카오 데이터팀, Y Combinator 멘토',
    expertise: ['데이터 분석', 'ML/AI', 'Growth Metrics'],
    rating: 4.7
  },
  TO: {
    name: '최조직',
    title: '조직 개발 전문가',
    experience: '前 구글 HR 디렉터, 50+ 스타트업 팀빌딩',
    expertise: ['채용 전략', '조직문화', '리더십 코칭'],
    rating: 4.8
  }
};

const ActionPlanPanel = () => {
  const { cluster } = useCluster();
  const { axisScores, overallScore } = useKPIDiagnosis();
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | null>(null);

  // 축 정의
  const axes = [
    { key: 'GO' as AxisKey, label: '성장 지향성', color: '#9333ea' },
    { key: 'EC' as AxisKey, label: '경제성', color: '#10b981' },
    { key: 'PT' as AxisKey, label: '제품/기술', color: '#f97316' },
    { key: 'PF' as AxisKey, label: '성과 지표', color: '#3b82f6' },
    { key: 'TO' as AxisKey, label: '팀/조직', color: '#ef4444' }
  ];

  // 약점 분석 (하위 3개 축)
  const weaknesses = useMemo(() => {
    return Object.entries(axisScores)
      .filter(([_, score]) => score > 0)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 3)
      .map(([axis, score]) => {
        const axisInfo = axes.find(a => a.key === axis);
        const percentile = Math.max(5, Math.round((score / 100) * 100));
        const severity = score < 30 ? 'critical' : score < 50 ? 'warning' : 'moderate';
        
        return {
          axis: axis as AxisKey,
          label: axisInfo?.label || axis,
          score: Math.round(score),
          percentile,
          severity,
          color: axisInfo?.color || '#666'
        };
      });
  }, [axisScores]);

  // Quick Win 로드맵 생성
  const quickWins = useMemo(() => {
    const wins = [];
    
    // Phase 1: 즉시 실행 가능 (2주)
    wins.push({
      phase: 1,
      title: '데이터 기반 구축',
      timeframe: '2주',
      difficulty: 'easy' as const,
      tasks: [
        'Google Analytics 4 설정 및 이벤트 추적',
        '핵심 KPI 대시보드 구축 (Looker Studio)',
        '주간 리포트 자동화 설정'
      ],
      expectedImpact: 5
    });

    // Phase 2: 단기 개선 (4주)
    if (weaknesses[0]?.axis === 'EC') {
      wins.push({
        phase: 2,
        title: 'CAC 최적화',
        timeframe: '4주',
        difficulty: 'medium' as const,
        tasks: [
          '유료 광고 채널 ROI 분석',
          '오가닉 채널 강화 (SEO, 콘텐츠)',
          '레퍼럴 프로그램 론칭'
        ],
        expectedImpact: 12
      });
    } else if (weaknesses[0]?.axis === 'GO') {
      wins.push({
        phase: 2,
        title: '성장 엔진 구축',
        timeframe: '4주',
        difficulty: 'medium' as const,
        tasks: [
          '온보딩 퍼널 최적화',
          '이메일 마케팅 자동화',
          '바이럴 루프 설계'
        ],
        expectedImpact: 15
      });
    } else {
      wins.push({
        phase: 2,
        title: '제품 개선 스프린트',
        timeframe: '4주',
        difficulty: 'medium' as const,
        tasks: [
          '사용자 인터뷰 10건 진행',
          'Top 3 페인포인트 해결',
          'NPS 측정 시스템 구축'
        ],
        expectedImpact: 10
      });
    }

    // Phase 3: 구조적 개선 (8주)
    wins.push({
      phase: 3,
      title: '지속가능한 성장 체계',
      timeframe: '8주',
      difficulty: 'hard' as const,
      tasks: [
        '수익 모델 다각화 전략 수립',
        '고객 세그먼트별 전략 차별화',
        '장기 성장 로드맵 수립'
      ],
      expectedImpact: 20
    });

    return wins;
  }, [weaknesses]);

  // 예상 점수 시뮬레이션
  const scoreSimulation = useMemo(() => {
    let currentScore = overallScore;
    const stages = [];
    
    quickWins.forEach((win, idx) => {
      currentScore += win.expectedImpact * 0.7; // 보수적 예측
      stages.push({
        phase: win.phase,
        score: Math.round(currentScore),
        milestone: currentScore >= 80 ? 'A-3 진입' : currentScore >= 70 ? 'A-2 유지' : 'A-1'
      });
    });
    
    return stages;
  }, [overallScore, quickWins]);

  return (
    <div className="space-y-6">
      {/* 1. 약점 메타인지 섹션 */}
      <Card className="border-2 border-error-light">
        <CardBody>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="text-error-main mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-dark mb-2">
                🔍 당신이 놓치고 있는 핵심 문제
              </h3>
              <p className="text-neutral-gray">
                현재 단계: <span className="font-semibold">{cluster.stage}</span> | 
                종합 점수: <span className="font-semibold">{Math.round(overallScore)}점</span> 
                (업계 평균 대비 <span className="text-error-main font-semibold">-{Math.round(70 - overallScore)}점</span>)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {weaknesses.map((weakness, idx) => (
              <div 
                key={weakness.axis}
                className={`p-4 rounded-lg border ${
                  weakness.severity === 'critical' 
                    ? 'bg-error-light/20 border-error-main' 
                    : weakness.severity === 'warning'
                    ? 'bg-accent-orange-light/20 border-accent-orange'
                    : 'bg-accent-yellow-light/20 border-accent-yellow'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-neutral-dark">#{idx + 1}</span>
                    <div>
                      <span className="font-semibold text-neutral-dark">{weakness.label}</span>
                      <span className="ml-2 text-sm text-neutral-gray">
                        {weakness.score}점 (하위 {weakness.percentile}%)
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    weakness.severity === 'critical' 
                      ? 'bg-error-main text-white' 
                      : weakness.severity === 'warning'
                      ? 'bg-accent-orange text-white'
                      : 'bg-accent-yellow text-neutral-dark'
                  }`}>
                    {weakness.severity === 'critical' ? '심각' : weakness.severity === 'warning' ? '경고' : '주의'}
                  </span>
                </div>
                
                {weakness.axis === 'EC' && (
                  <p className="text-sm text-neutral-gray">
                    💡 <strong>수익성 없는 성장은 위험합니다.</strong> CAC가 LTV를 초과하면 성장할수록 손실이 커집니다.
                  </p>
                )}
                {weakness.axis === 'GO' && (
                  <p className="text-sm text-neutral-gray">
                    💡 <strong>성장 정체는 투자 유치의 최대 장애물.</strong> MoM 성장률 5% 미만 시 VC 관심도 급감.
                  </p>
                )}
                {weakness.axis === 'PT' && (
                  <p className="text-sm text-neutral-gray">
                    💡 <strong>제품력이 약하면 마케팅 비용만 증가.</strong> PMF 없는 스케일업은 실패로 직결됩니다.
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 2. 맞춤형 빌드업 프로그램 추천 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 추천 프로그램 */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
              <Target className="text-primary-main" size={20} />
              맞춤형 포켓빌드업 프로그램
            </h3>
            
            {weaknesses.slice(0, 2).map((weakness) => {
              const program = buildupPrograms[weakness.axis];
              const expert = experts[weakness.axis];
              
              return (
                <div key={weakness.axis} className="mb-4 p-4 border border-neutral-border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-neutral-dark flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: weakness.color }}></span>
                        {program.name}
                      </h4>
                      <p className="text-sm text-neutral-gray mt-1">
                        {program.duration} | {program.format}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-gray">예상 개선</div>
                      <div className="text-xl font-bold text-primary-main">+{program.expectedImprovement}점</div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-neutral-gray mb-2">커리큘럼</p>
                    <ul className="space-y-1">
                      {program.curriculum.slice(0, 2).map((item, idx) => (
                        <li key={idx} className="text-xs text-neutral-gray flex items-start gap-1">
                          <CheckCircle2 size={12} className="text-success-main mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-light">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-neutral-light flex items-center justify-center">
                        <Users size={16} className="text-neutral-gray" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-dark">{expert.name}</p>
                        <p className="text-xs text-neutral-gray">{expert.title}</p>
                      </div>
                    </div>
                    <button className="text-sm font-semibold text-primary-main hover:text-primary-dark flex items-center gap-1">
                      상세보기
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* 성공 사례 */}
                  <div className="mt-3 p-2 bg-success-light/10 rounded">
                    <p className="text-xs text-neutral-gray">
                      <span className="font-semibold">{program.successCase.company}:</span> {program.successCase.result}
                    </p>
                  </div>
                </div>
              );
            })}

            <button className="w-full mt-2 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors font-medium">
              전체 프로그램 보기
            </button>
          </CardBody>
        </Card>

        {/* 전문가 매칭 */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
              <MessageCircle className="text-secondary-main" size={20} />
              즉시 상담 가능한 전문가
            </h3>

            <div className="space-y-3">
              {weaknesses.slice(0, 2).map((weakness) => {
                const expert = experts[weakness.axis];
                
                return (
                  <div key={weakness.axis} className="p-4 border border-neutral-border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-light to-primary-main flex items-center justify-center text-white font-bold">
                        {expert.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-neutral-dark">{expert.name}</h4>
                            <p className="text-sm text-neutral-gray">{expert.title}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-accent-yellow fill-current" />
                            <span className="text-sm font-semibold">{expert.rating}</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-neutral-gray mt-2">{expert.experience}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expert.expertise.map((skill) => (
                            <span key={skill} className="px-2 py-0.5 bg-neutral-light rounded text-xs text-neutral-gray">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <div className="mt-3 p-2 bg-primary-light/10 rounded">
                          <p className="text-xs text-primary-dark">
                            💬 "{weakness.label} 개선을 위한 Quick Win 3가지를 30분 안에 찾아드립니다"
                          </p>
                        </div>

                        <button className="mt-3 w-full py-2 bg-secondary-main text-white rounded hover:bg-secondary-dark transition-colors text-sm font-medium">
                          30분 무료 상담 예약 (구독 회원 무제한)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* 3. Quick Win 로드맵 */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">
            <Zap className="text-accent-orange" size={20} />
            바로 실행 가능한 Quick Win 로드맵
          </h3>

          <div className="space-y-4">
            {quickWins.map((win) => (
              <div key={win.phase} className="border border-neutral-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-primary-light text-primary-dark rounded text-xs font-semibold">
                        Phase {win.phase}
                      </span>
                      <span className="text-sm text-neutral-gray">{win.timeframe}</span>
                      <span className="text-xs text-neutral-gray">
                        난이도: {win.difficulty === 'easy' ? '⭐' : win.difficulty === 'medium' ? '⭐⭐' : '⭐⭐⭐'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-neutral-dark">{win.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-neutral-gray">예상 개선</div>
                    <div className="text-lg font-bold text-primary-main">+{win.expectedImpact}점</div>
                  </div>
                </div>

                <ul className="space-y-1 mb-3">
                  {win.tasks.map((task, idx) => (
                    <li key={idx} className="text-sm text-neutral-gray flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-success-main mt-0.5 flex-shrink-0" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>

                {/* Progress visualization */}
                <div className="h-2 bg-neutral-light rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-main to-primary-dark transition-all duration-500"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 점수 시뮬레이션 */}
          <div className="mt-6 p-4 bg-primary-light/10 rounded-lg">
            <h4 className="font-semibold text-neutral-dark mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-main" />
              예상 점수 개선 시뮬레이션
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-gray">현재:</span>
                <span className="font-bold text-neutral-dark">{Math.round(overallScore)}점</span>
              </div>
              {scoreSimulation.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <ArrowRight size={16} className="text-neutral-gray" />
                  <div className="flex flex-col">
                    <span className="text-xs text-neutral-gray">P{stage.phase}</span>
                    <span className="font-bold text-primary-main">{stage.score}점</span>
                    {stage.milestone !== 'A-1' && (
                      <span className="text-xs text-success-main font-semibold">{stage.milestone}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 4. 포켓컴퍼니 생태계 CTA */}
      <Card className="bg-gradient-to-br from-primary-light/20 to-secondary-light/20 border-2 border-primary-light">
        <CardBody>
          <div className="text-center">
            <Sparkles className="mx-auto text-primary-main mb-3" size={32} />
            <h3 className="text-xl font-bold text-neutral-dark mb-2">
              포켓컴퍼니와 함께 성장하세요
            </h3>
            <p className="text-neutral-gray mb-6">
              지금 구독하고 모든 빌드업 프로그램과 전문가 컨설팅을 무제한으로 이용하세요
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white rounded-lg">
                <BookOpen className="mx-auto text-primary-main mb-2" size={24} />
                <h4 className="font-semibold text-neutral-dark mb-1">빌드업 프로그램</h4>
                <p className="text-sm text-neutral-gray">20% 할인 혜택</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <Users className="mx-auto text-secondary-main mb-2" size={24} />
                <h4 className="font-semibold text-neutral-dark mb-1">전문가 컨설팅</h4>
                <p className="text-sm text-neutral-gray">무제한 이용</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <Award className="mx-auto text-accent-orange mb-2" size={24} />
                <h4 className="font-semibold text-neutral-dark mb-1">네트워킹</h4>
                <p className="text-sm text-neutral-gray">VIP 이벤트 초대</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button className="px-6 py-3 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors font-semibold">
                첫 달 무료 체험 시작하기
              </button>
              <button className="px-6 py-3 bg-white text-primary-main border-2 border-primary-main rounded-lg hover:bg-primary-light/10 transition-colors font-semibold">
                구독 혜택 자세히 보기
              </button>
            </div>

            <p className="text-xs text-neutral-gray mt-4">
              월 9.9만원 | 언제든 해지 가능 | 첫 달 100% 환불 보장
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ActionPlanPanel;