import React from 'react';
import { RotateCcw, Clock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const ProgressTab: React.FC = () => {
  // 목업 데이터 - Phase 3에서 실제 로직으로 대체
  const progressSummary = {
    inProgress: 2,
    waiting: 1,
    completed: 3
  };

  const activePrograms = [
    {
      id: 'tips-2024',
      name: 'TIPS 프로그램',
      status: 'active' as const,
      deadline: new Date('2024-02-15'),
      progress: 60,
      tasks: {
        completed: [
          { id: '1', title: '사업계획서 업데이트', completedDate: new Date('2024-01-10') },
          { id: '2', title: '재무제표 3개년 준비', completedDate: new Date('2024-01-12') }
        ],
        current: {
          id: '3',
          title: '재무모델링 작업',
          description: '담당: 김컨설턴트',
          estimatedDays: 3
        },
        upcoming: [
          { id: '4', title: 'PM 멘토링 예약 필요' },
          { id: '5', title: '모의 PT 준비' }
        ]
      },
      blockers: [
        {
          issue: '특허 출원 전략 수립 필요',
          suggestedSolution: 'IP 전략 컨설턴트',
          expertNeeded: 'IP 전문가'
        }
      ]
    }
  ];

  const waitingPrograms = [
    {
      id: 'k-startup-global',
      name: 'K-Startup 글로벌',
      condition: 'TIPS 결과 발표 후 진행',
      expectedStart: '4월'
    }
  ];

  const getDaysLeft = (deadline: Date) => {
    const today = new Date();
    const timeDiff = deadline.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8">
      {/* 진행 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <RotateCcw className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{progressSummary.inProgress}</p>
              <p className="text-sm text-gray-600">진행 중</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{progressSummary.waiting}</p>
              <p className="text-sm text-gray-600">대기 중</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{progressSummary.completed}</p>
              <p className="text-sm text-gray-600">완료</p>
            </div>
          </div>
        </div>
      </div>

      {/* 진행 중인 프로그램 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">현재 진행 중</h2>
        <div className="space-y-6">
          {activePrograms.map((program) => (
            <div key={program.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    🔄 진행중
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                </div>
                <span className="text-sm text-red-600 font-medium">
                  D-{getDaysLeft(program.deadline)}
                </span>
              </div>

              {/* 진행률 */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">진행률</span>
                  <span className="text-sm text-gray-900">{program.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${program.progress}%` }}
                  />
                </div>
              </div>

              {/* 작업 현황 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* 완료된 작업 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">완료됨 ({program.progress}%)</h4>
                  <div className="space-y-2">
                    {program.tasks.completed.map((task) => (
                      <div key={task.id} className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 진행 중인 작업 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">진행 중</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <RotateCcw className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <span className="text-sm text-gray-700">{program.tasks.current.title}</span>
                        <p className="text-xs text-gray-500 mt-1">
                          {program.tasks.current.description} | 예상 완료: {program.tasks.current.estimatedDays}일
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 다음 할 일 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">다음 할 일</h4>
                  <div className="space-y-2">
                    {program.tasks.upcoming.map((task) => (
                      <div key={task.id} className="flex items-start">
                        <Clock className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 막힌 부분 */}
              {program.blockers && program.blockers.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    도움 필요
                  </h4>
                  {program.blockers.map((blocker, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 font-medium mb-2">{blocker.issue}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-yellow-700">추천 전문가: {blocker.suggestedSolution}</p>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                          포켓빌더에서 찾기
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 대기 중인 프로그램 */}
      {waitingPrograms.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">대기 중</h2>
          <div className="space-y-4">
            {waitingPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      🟡 대기중
                    </span>
                    <h3 className="text-lg font-semibold text-gray-900">{program.name}</h3>
                  </div>
                  <span className="text-sm text-gray-500">예상 시작: {program.expectedStart}</span>
                </div>
                <p className="text-gray-600 mt-2">{program.condition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 완료된 프로그램 (접힌 상태) */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors">
          <span className="text-gray-700 font-medium">완료된 프로그램 ({progressSummary.completed}개)</span>
          <span className="text-gray-400 text-sm">펼쳐보기</span>
        </button>
      </div>
    </div>
  );
};

export default ProgressTab;