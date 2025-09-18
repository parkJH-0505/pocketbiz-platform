import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flag,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Trophy,
  Rocket,
  Star,
  TrendingUp,
  Users,
  DollarSign,
  Globe,
  Award,
  Zap
} from 'lucide-react';

interface JourneyMilestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'founding' | 'product' | 'funding' | 'growth' | 'achievement';
  status: 'completed' | 'current' | 'upcoming';
  metrics?: {
    label: string;
    value: string;
  }[];
  isHighlight?: boolean;
}

interface JourneySectionProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const JourneySection: React.FC<JourneySectionProps> = ({ viewMode, isEditing = false }) => {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const milestoneRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const timelineRef = useRef<HTMLDivElement>(null);

  // 포켓비즈 디자인 시스템 색상
  const colors = {
    primary: "rgb(15, 82, 222)",
    GO: "rgb(112, 46, 220)", // 보라
    EC: "rgb(76, 206, 148)", // 초록
    PT: "rgb(251, 146, 60)", // 주황
    PF: "rgb(15, 82, 222)", // 파랑
    TO: "rgb(239, 68, 68)"   // 빨강
  };

  // 마일스톤 데이터
  const [milestones] = useState<JourneyMilestone[]>([
    {
      id: '1',
      date: '2023-01',
      title: '포켓비즈 창립',
      description: '스타트업 성장 플랫폼의 필요성을 느낀 창업자들이 만나 회사를 설립했습니다.',
      type: 'founding',
      status: 'completed',
      isHighlight: true
    },
    {
      id: '2',
      date: '2023-03',
      title: 'MVP 출시',
      description: '첫 번째 빌드업 프로그램과 기본 기능들을 포함한 MVP를 성공적으로 출시했습니다.',
      type: 'product',
      status: 'completed',
      metrics: [
        { label: '초기 사용자', value: '100명' },
        { label: '개발 기간', value: '2개월' }
      ]
    },
    {
      id: '3',
      date: '2023-06',
      title: 'Seed 투자 유치',
      description: '주요 벤처캐피털로부터 시드 라운드 투자를 성공적으로 유치했습니다.',
      type: 'funding',
      status: 'completed',
      isHighlight: true,
      metrics: [
        { label: '투자 금액', value: '5억원' },
        { label: '참여 VC', value: '3개사' }
      ]
    },
    {
      id: '4',
      date: '2023-09',
      title: '사용자 1만명 돌파',
      description: '플랫폼 사용자가 10,000명을 돌파하며 PMF를 입증했습니다.',
      type: 'growth',
      status: 'completed',
      isHighlight: true,
      metrics: [
        { label: 'MAU', value: '10,000명' },
        { label: '성장률', value: '300%' }
      ]
    },
    {
      id: '5',
      date: '2023-12',
      title: 'Best Startup Award 수상',
      description: '국내 주요 스타트업 어워드에서 올해의 스타트업으로 선정되었습니다.',
      type: 'achievement',
      status: 'completed',
      metrics: [
        { label: '수상 부문', value: '혁신상' }
      ]
    },
    {
      id: '6',
      date: '2024-03',
      title: '글로벌 진출 준비',
      description: '일본 및 동남아시아 시장 진출을 위한 현지화 작업을 진행 중입니다.',
      type: 'growth',
      status: 'current'
    },
    {
      id: '7',
      date: '2024-06',
      title: 'Series A 라운드',
      description: '글로벌 확장과 AI 기능 강화를 위한 Series A 투자 유치를 계획하고 있습니다.',
      type: 'funding',
      status: 'upcoming',
      isHighlight: true
    }
  ]);

  // 타입별 스타일
  const getTypeStyle = (type: string) => {
    const styles = {
      founding: { icon: Rocket, color: colors.GO, name: '창립' },
      product: { icon: Zap, color: colors.primary, name: '제품' },
      funding: { icon: DollarSign, color: colors.TO, name: '투자' },
      growth: { icon: TrendingUp, color: colors.EC, name: '성장' },
      achievement: { icon: Trophy, color: colors.PT, name: '성과' }
    };
    return styles[type as keyof typeof styles] || styles.product;
  };

  // 상태별 스타일
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'upcoming':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // 보기 모드별 필터링
  const getVisibleMilestones = () => {
    if (viewMode === 'public') {
      return milestones.filter(m => !m.type.includes('funding') || m.isHighlight);
    }
    return milestones;
  };

  const visibleMilestones = getVisibleMilestones();

  // Intersection Observer를 사용한 스크롤 기반 애니메이션
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const milestoneId = entry.target.getAttribute('data-milestone-id');
        if (milestoneId) {
          setTimeout(() => {
            setVisibleItems(prev => new Set([...prev, milestoneId]));
          }, 100); // 살짝 딜레이로 자연스러운 효과
        }
      }
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.3, // 30% 보일 때 트리거
      rootMargin: '-50px 0px' // 50px 마진으로 조금 더 스크롤해야 트리거
    });

    visibleMilestones.forEach((milestone) => {
      const element = milestoneRefs.current[milestone.id];
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [visibleMilestones, observerCallback]);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: colors.EC + '15' }}
            >
              <Flag className="w-6 h-6" style={{ color: colors.EC }} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">우리의 여정</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            포켓비즈가 지금까지 걸어온 길과 앞으로의 계획을 타임라인으로 소개합니다
          </p>
        </div>

        {/* 타임라인 */}
        <div className="relative" ref={timelineRef}>
          {/* 중앙 세로 라인 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-orange-200"></div>

          {/* 마일스톤 목록 */}
          <div className="space-y-12">
            {visibleMilestones.map((milestone, index) => {
              const typeStyle = getTypeStyle(milestone.type);
              const Icon = typeStyle.icon;
              const isLeft = index % 2 === 0;
              const isVisible = visibleItems.has(milestone.id);

              return (
                <div
                  key={milestone.id}
                  ref={(el) => {
                    milestoneRefs.current[milestone.id] = el;
                  }}
                  data-milestone-id={milestone.id}
                  className={`relative transition-all duration-700 ease-out ${
                    isVisible
                      ? 'opacity-100 translate-x-0 translate-y-0'
                      : `opacity-0 ${isLeft ? '-translate-x-12' : 'translate-x-12'} translate-y-8`
                  }`}
                >
                  {/* 타임라인 포인트 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-4 z-10">
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center transition-all duration-500 ${
                        milestone.status === 'current' ? 'animate-pulse' : ''
                      } ${isVisible ? 'scale-100' : 'scale-0'}`}
                      style={{ backgroundColor: typeStyle.color }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* 하이라이트 마일스톤 링 */}
                    {milestone.isHighlight && isVisible && (
                      <div className="absolute inset-0 rounded-full border-4 animate-ping"
                           style={{ borderColor: typeStyle.color + '40' }} />
                    )}
                  </div>

                  {/* 마일스톤 카드 */}
                  <div className={`grid grid-cols-2 gap-8 items-center ${isLeft ? '' : 'text-right'}`}>
                    <div className={isLeft ? 'order-1' : 'order-2'}>
                      <div
                        className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-500 cursor-pointer group hover:bg-gray-50 ${
                          selectedMilestone === milestone.id
                            ? 'shadow-lg scale-105 bg-gray-50'
                            : 'hover:shadow-md hover:scale-102'
                        }`}
                        style={{
                          borderColor: selectedMilestone === milestone.id ? typeStyle.color : '#e5e7eb'
                        }}
                        onClick={() => setSelectedMilestone(
                          selectedMilestone === milestone.id ? null : milestone.id
                        )}
                      >
                        {/* 카드 헤더 */}
                        <div className={`flex items-center gap-3 mb-4 ${isLeft ? '' : 'flex-row-reverse'}`}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-600">
                              {new Date(milestone.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: typeStyle.color + '15',
                                color: typeStyle.color
                              }}
                            >
                              {typeStyle.name}
                            </span>
                            {getStatusIcon(milestone.status)}
                          </div>
                        </div>

                        {/* 카드 내용 */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                          {milestone.title}
                        </h3>

                        <p className="text-gray-600 leading-relaxed mb-4">
                          {milestone.description}
                        </p>

                        {/* 메트릭 */}
                        {milestone.metrics && milestone.metrics.length > 0 && (
                          <div className={`flex gap-4 ${isLeft ? '' : 'justify-end'}`}>
                            {milestone.metrics.map((metric, idx) => (
                              <div key={idx} className="text-center">
                                <div className="text-sm font-bold text-gray-900">
                                  {metric.value}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {metric.label}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 확장된 정보 */}
                        {selectedMilestone === milestone.id && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Star className="w-3 h-3" />
                              <span>자세히 보기 모드 활성화됨</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 빈 공간 */}
                    <div className={isLeft ? 'order-2' : 'order-1'}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 하단 통계 */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">여정 한눈에 보기</h3>
            <p className="text-gray-600">지금까지의 성과를 숫자로 정리했습니다</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.GO + '15' }}
              >
                <Calendar className="w-6 h-6" style={{ color: colors.GO }} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {Math.floor((new Date().getTime() - new Date('2023-01-01').getTime()) / (1000 * 60 * 60 * 24 * 30))}
              </div>
              <div className="text-sm text-gray-500">개월 여정</div>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.EC + '15' }}
              >
                <CheckCircle className="w-6 h-6" style={{ color: colors.EC }} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {milestones.filter(m => m.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">완료된 목표</div>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.PT + '15' }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: colors.PT }} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {milestones.filter(m => m.status === 'current').length}
              </div>
              <div className="text-sm text-gray-500">진행 중</div>
            </div>

            <div className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: colors.TO + '15' }}
              >
                <Target className="w-6 h-6" style={{ color: colors.TO }} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {milestones.filter(m => m.status === 'upcoming').length}
              </div>
              <div className="text-sm text-gray-500">계획된 목표</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneySection;