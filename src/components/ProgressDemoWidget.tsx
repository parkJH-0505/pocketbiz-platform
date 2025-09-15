import React, { useState } from 'react';
import { RefreshCw, Clock, Target, TrendingUp } from 'lucide-react';

/**
 * 진행률 계산 방식 비교 데모 위젯
 * PM의 공수를 줄이기 위한 자동화 시스템 시연
 */
export default function ProgressDemoWidget() {
  const [method, setMethod] = useState<'time_based' | 'milestone_based' | 'hybrid'>('hybrid');

  // 예시 프로젝트 데이터
  const mockProject = {
    name: 'IR 덱 전문 컨설팅',
    start_date: new Date('2025-01-01'),
    end_date: new Date('2025-02-15'),
    milestones_completed: 2,
    milestones_total: 5,
    deliverables_submitted: 3,
    deliverables_total: 6
  };

  // 각 방식별 진행률 계산
  const calculateTimeProgress = () => {
    const now = new Date();
    const total = mockProject.end_date.getTime() - mockProject.start_date.getTime();
    const elapsed = now.getTime() - mockProject.start_date.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const calculateMilestoneProgress = () => {
    return Math.round((mockProject.milestones_completed / mockProject.milestones_total) * 100);
  };

  const calculateHybridProgress = () => {
    const timeProgress = calculateTimeProgress() * 0.7;
    const milestoneProgress = calculateMilestoneProgress() * 0.3;
    const deliverableBonus = (mockProject.deliverables_submitted / mockProject.deliverables_total) * 10;
    return Math.min(100, Math.round(timeProgress + milestoneProgress + deliverableBonus));
  };

  const getProgress = () => {
    switch (method) {
      case 'time_based':
        return calculateTimeProgress();
      case 'milestone_based':
        return calculateMilestoneProgress();
      case 'hybrid':
        return calculateHybridProgress();
    }
  };

  const progress = getProgress();

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">진행률 자동 계산 시스템</h3>

      {/* 프로젝트 정보 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{mockProject.name}</p>
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>기간: 45일</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            <span>마일스톤: {mockProject.milestones_completed}/{mockProject.milestones_total}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>산출물: {mockProject.deliverables_submitted}/{mockProject.deliverables_total}</span>
          </div>
        </div>
      </div>

      {/* 계산 방식 선택 */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">계산 방식</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="hybrid">하이브리드 (권장)</option>
          <option value="time_based">시간 기반 자동</option>
          <option value="milestone_based">마일스톤 수동</option>
        </select>
      </div>

      {/* 진행률 표시 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">계산된 진행률</span>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 text-green-600 animate-spin" />
            <span className="text-xl font-bold text-gray-900">{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 계산 방식 설명 */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          {method === 'hybrid' && (
            <>
              <strong>하이브리드:</strong> 시간(70%) + 마일스톤(30%) + 산출물 보너스(10%)
              <br />
              PM 개입 최소화, 자동 계산으로 10개 이상 프로젝트 동시 관리 가능
            </>
          )}
          {method === 'time_based' && (
            <>
              <strong>시간 기반:</strong> 프로젝트 기간 대비 경과 시간으로 자동 계산
              <br />
              PM 개입 불필요, 완전 자동화
            </>
          )}
          {method === 'milestone_based' && (
            <>
              <strong>마일스톤:</strong> PM이 마일스톤 완료 시마다 수동 업데이트
              <br />
              정확하지만 PM 공수 많음
            </>
          )}
        </p>
      </div>
    </div>
  );
}