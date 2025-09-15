import React from 'react';
import { Globe, DollarSign, Target, FileText, Download } from 'lucide-react';

const PipelineTab: React.FC = () => {
  // 목업 데이터 - Phase 4에서 실제 로직으로 대체
  const roadmapTimeline = [
    { quarter: 'Q1 2024', goal: 'Series A 준비', progress: 73, isCurrent: true },
    { quarter: 'Q2 2024', goal: '해외 진출', progress: 0, isCurrent: false },
    { quarter: 'Q3 2024', goal: 'Series A 완료', progress: 0, isCurrent: false }
  ];

  const q2Pipeline = {
    quarter: 'Q2 2024',
    condition: 'Q1 목표 달성 시 진행',
    programs: [
      {
        id: 'k-startup-global',
        name: 'K-Startup 글로벌 프로그램',
        icon: Globe,
        timeline: '4-5월',
        description: '해외 진출을 위한 정부 지원 프로그램',
        prerequisites: [
          '📄 영문 IR 덱 제작',
          '🔍 타겟 시장 조사 (미국/일본)',
          '💼 현지 파트너 탐색'
        ],
        earlyActions: [
          {
            action: '영문 IR 덱 템플릿 받기',
            available: true
          }
        ],
        benefits: {
          funding: '최대 10억원',
          support: '현지 네트워킹 지원'
        }
      }
    ]
  };

  const q3Pipeline = {
    quarter: 'Q3 2024',
    condition: '해외 PMF 검증 후 진행',
    programs: [
      {
        id: 'series-a-funding',
        name: 'Series A 투자 유치',
        icon: DollarSign,
        timeline: '7-9월',
        description: '본격적인 스케일업을 위한 투자 유치',
        milestones: [
          'ARR 30억 달성',
          '해외 고객 10개사',
          '팀 30명 확장'
        ],
        targetInvestors: '헬스케어 전문 VC 3곳 사전 미팅 예정',
        targetAmount: '50억원'
      }
    ]
  };

  const scenarios = [
    {
      condition: 'Q1 매출 목표 미달 시',
      action: '브릿지 투자 먼저 진행',
      impact: 'Q2 일정 2개월 연기'
    },
    {
      condition: 'TIPS 탈락 시',
      action: '창업도약패키지 재도전',
      impact: '대안 자금 확보 경로'
    }
  ];

  return (
    <div className="space-y-8">
      {/* 로드맵 타임라인 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">로드맵 타임라인</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmapTimeline.map((quarter) => (
            <div
              key={quarter.quarter}
              className={`rounded-lg p-6 border-2 ${
                quarter.isCurrent
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${
                  quarter.isCurrent ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {quarter.quarter}
                  {quarter.isCurrent && <span className="ml-2 text-sm font-normal">(현재)</span>}
                </h3>
                <span className={`text-2xl font-bold ${
                  quarter.isCurrent ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {quarter.progress}%
                </span>
              </div>
              <p className={quarter.isCurrent ? 'text-blue-800' : 'text-gray-600'}>
                {quarter.goal}
              </p>
              {quarter.isCurrent && (
                <div className="mt-4">
                  <div className="bg-white rounded-full h-2">
                    <div
                      className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${quarter.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Q2 파이프라인 */}
      <div>
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{q2Pipeline.quarter} 파이프라인</h2>
          <span className="ml-4 text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            <Target className="w-4 h-4 inline mr-1" />
            {q2Pipeline.condition}
          </span>
        </div>

        <div className="space-y-6">
          {q2Pipeline.programs.map((program) => {
            const Icon = program.icon;
            return (
              <div key={program.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-lg p-2 mr-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-gray-600">{program.description}</p>
                    </div>
                  </div>
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {program.timeline}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 사전 준비 필요 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">사전 준비 필요</h4>
                    <div className="space-y-2">
                      {program.prerequisites.map((item, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 지금 준비 가능 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">지금 준비 가능한 것</h4>
                    <div className="space-y-2">
                      {program.earlyActions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{action.action}</span>
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                            받기
                            <Download className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>💰 {program.benefits.funding}</span>
                    <span>🤝 {program.benefits.support}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Q3 파이프라인 */}
      <div>
        <div className="flex items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{q3Pipeline.quarter} 파이프라인</h2>
          <span className="ml-4 text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
            <Target className="w-4 h-4 inline mr-1" />
            {q3Pipeline.condition}
          </span>
        </div>

        <div className="space-y-6">
          {q3Pipeline.programs.map((program) => {
            const Icon = program.icon;
            return (
              <div key={program.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-green-100 rounded-lg p-2 mr-4">
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                      <p className="text-gray-600">{program.description}</p>
                    </div>
                  </div>
                  <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                    {program.timeline}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 달성 목표 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">달성 목표</h4>
                    <div className="space-y-2">
                      {program.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center">
                          <Target className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-sm text-gray-700">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 투자자 정보 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">예상 투자자</h4>
                    <p className="text-sm text-gray-700 mb-2">{program.targetInvestors}</p>
                    <div className="text-sm font-medium text-green-600">
                      목표 금액: {program.targetAmount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 시나리오 플래닝 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">만약 목표가 바뀐다면?</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">만약</span>
                    <span className="ml-2 text-sm text-gray-700">{scenario.condition}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-600">→</span>
                    <span className="ml-2 text-sm text-gray-700">{scenario.action}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {scenario.impact}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button className="w-full py-2 px-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <FileText className="w-4 h-4 inline mr-2" />
              시나리오 조정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineTab;