import React, { useState } from 'react';
import { Bell, Target, Calendar, TrendingUp, DollarSign, Rocket, ChevronDown, ChevronUp } from 'lucide-react';
import { getClusterTemplate, getCategoryIcon } from '../../../data/clusterMilestones';

interface NowActionTabProps {
  onOpenNotification: () => void;
}

const NowActionTab: React.FC<NowActionTabProps> = ({ onOpenNotification }) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  // 현재 사용자의 클러스터 (실제로는 Context나 props에서 가져올 예정)
  const currentStage = 'A-4'; // Pre-A 단계
  const currentSector = 'S-1'; // IT·플랫폼/SaaS

  // 클러스터별 마일스톤 템플릿 가져오기
  const clusterTemplate = getClusterTemplate(currentStage, currentSector);

  const roadmapContext = clusterTemplate ? {
    currentQuarter: 'Q1 2024',
    quarterGoal: clusterTemplate.goalDescription,
    checklist: {
      completed: clusterTemplate.milestones.completed.map(m => `${getCategoryIcon(m.category)} ${m.title}`),
      inProgress: clusterTemplate.milestones.inProgress.map(m => `${getCategoryIcon(m.category)} ${m.title}`),
      pending: clusterTemplate.milestones.pending.map(m => `${getCategoryIcon(m.category)} ${m.title}`)
    }
  } : {
    currentQuarter: 'Q1 2024',
    quarterGoal: '목표 설정 필요',
    checklist: {
      completed: [],
      inProgress: [],
      pending: []
    }
  };

  const primaryAction = {
    program: {
      id: 'tips-2024',
      name: 'TIPS 프로그램',
      provider: '중소벤처기업부',
      deadline: new Date('2024-02-15'),
      category: 'government' as const
    },
    whyNow: [
      '📅 마감까지 28일 (준비 기간 고려 시 지금 시작 필수)',
      '📊 현재 매출 성장률이 평가 기준 충족 (전월 대비 +15%)',
      '🏢 동일 단계 3개 기업이 TIPS 후 Series A 성공'
    ],
    checklist: {
      passed: ['Series A 단계 적합', '헬스케어 우대 섹터', '매출 10억 달성'],
      failed: [],
      optional: ['특허 1건 보완 필요']
    },
    preparationWeeks: [
      {
        week: 1,
        tasks: ['사업계획서 업데이트 (2일)', '재무모델링 검증 (3일)']
      },
      {
        week: 2,
        tasks: ['기술 증빙 자료 준비 (2일)', '팀 소개서 작성 (2일)']
      },
      {
        week: 3,
        tasks: ['최종 검토 및 제출 (3일)', '모의 PT 연습 (2일)']
      }
    ],
    expectedImpact: [
      { icon: TrendingUp, text: '로드맵 기여: GO축 +12점' },
      { icon: DollarSign, text: '자금 확보: 최대 5억원' },
      { icon: Rocket, text: 'Series A 준비: 6개월 단축' }
    ]
  };

  const alternatives = [
    { name: '창업도약패키지', deadline: 'D-14', category: 'government' },
    { name: 'K-Global 스타트업', deadline: 'D-45', category: 'global' }
  ];

  const daysUntilDeadline = Math.ceil(
    (primaryAction.program.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-8">
      {/* 로드맵 컨텍스트 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{roadmapContext.currentQuarter} 목표</h2>
          <p className="text-blue-700 font-medium">{roadmapContext.quarterGoal}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 완료됨 */}
          <div>
            <h4 className="text-sm font-medium text-green-800 mb-2">✅ 완료됨</h4>
            <div className="space-y-1">
              {roadmapContext.checklist.completed.map((item, index) => (
                <div key={index} className="text-sm text-green-700">{item}</div>
              ))}
            </div>
          </div>

          {/* 진행 중 */}
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">🔄 진행 중</h4>
            <div className="space-y-1">
              {roadmapContext.checklist.inProgress.map((item, index) => (
                <div key={index} className="text-sm text-blue-700">{item}</div>
              ))}
            </div>
          </div>

          {/* 예정 */}
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">⏳ 예정</h4>
            <div className="space-y-1">
              {roadmapContext.checklist.pending.map((item, index) => (
                <div key={index} className="text-sm text-gray-600">{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 알림 설정 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={onOpenNotification}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Bell className="w-4 h-4 mr-2" />
          맞춤형 이벤트 알림 설정하기
        </button>
      </div>

      {/* THE ONE 액션 */}
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              김대표님의 다음 액션
            </span>
            <span className="text-sm text-gray-500">Q1 목표 달성용</span>
          </div>
          <div className="flex items-center mt-4">
            <Target className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">{primaryAction.program.name} 지원</h3>
            <span className="ml-4 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
              D-{daysUntilDeadline}
            </span>
          </div>
        </div>

        {/* 왜 지금인가? */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">왜 지금 시작해야 하나요?</h4>
          <div className="space-y-3">
            {primaryAction.whyNow.map((reason, index) => (
              <div key={index} className="flex items-start">
                <div className="text-blue-500 mr-3 mt-1">•</div>
                <p className="text-gray-700">{reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 매칭 분석 */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">적합도 분석</h4>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center mb-3">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="font-medium text-green-800">높은 적합도</span>
            </div>
            <div className="space-y-2">
              {primaryAction.checklist.passed.map((item, index) => (
                <div key={index} className="flex items-center text-green-700">
                  <span className="mr-2">✅</span>
                  <span>{item}</span>
                </div>
              ))}
              {primaryAction.checklist.optional.map((item, index) => (
                <div key={index} className="flex items-center text-yellow-700">
                  <span className="mr-2">⚠️</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3주 준비 로드맵 */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">3주 준비 로드맵</h4>
          <div className="space-y-4">
            {primaryAction.preparationWeeks.map((week) => (
              <div key={week.week} className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Week {week.week}</h5>
                <div className="space-y-1">
                  {week.tasks.map((task, index) => (
                    <div key={index} className="text-gray-600 text-sm">
                      • {task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 기대 효과 */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">기대 효과</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {primaryAction.expectedImpact.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="text-gray-700 text-sm">{impact.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Rocket className="w-5 h-5 inline mr-2" />
            300만원으로 컨설팅 시작
          </button>
          <button className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            <Calendar className="w-5 h-5 inline mr-2" />
            3주 상세 로드맵 보기
          </button>
        </div>
      </div>

      {/* 대안 액션 (접힌 상태) */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={() => setShowAlternatives(!showAlternatives)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <span className="text-gray-700 font-medium">
            다른 기회도 있어요 ({alternatives.length}개)
          </span>
          {showAlternatives ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showAlternatives && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            {alternatives.map((alt, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{alt.name}</span>
                <span className="text-sm text-gray-500">{alt.deadline}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NowActionTab;