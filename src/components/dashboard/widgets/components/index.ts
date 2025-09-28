/**
 * Widget Components Export
 * 모든 위젯 컴포넌트 내보내기
 */

// 임시 위젯 컴포넌트들 - 추후 개별 파일로 분리 예정
import React from 'react';
import type { WidgetComponentProps } from '../WidgetRegistry';

// Simulation Widget
export const SimulationWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🎲</span>
        <p className="text-sm">시뮬레이션 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Prediction Widget
export const PredictionWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🔮</span>
        <p className="text-sm">예측 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Goal Tracker Widget
export const GoalTrackerWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🎯</span>
        <p className="text-sm">목표 추적 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Pattern Analysis Widget
export const PatternAnalysisWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🔍</span>
        <p className="text-sm">패턴 분석 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Anomaly Detector Widget
export const AnomalyDetectorWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">⚠️</span>
        <p className="text-sm">이상 탐지 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Quick Actions Widget
export const QuickActionsWidget: React.FC<WidgetComponentProps> = () => {
  const actions = [
    { icon: '📊', label: 'KPI 진단', action: () => console.log('KPI 진단') },
    { icon: '📈', label: '트렌드 분석', action: () => console.log('트렌드 분석') },
    { icon: '🎯', label: '목표 설정', action: () => console.log('목표 설정') },
    { icon: '📝', label: '리포트 생성', action: () => console.log('리포트 생성') }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <span className="text-2xl block mb-1">{action.icon}</span>
          <span className="text-xs text-neutral-gray">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// Team Performance Widget
export const TeamPerformanceWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">👥</span>
        <p className="text-sm">팀 성과 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Notifications Widget
export const NotificationsWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🔔</span>
        <p className="text-sm">알림 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};

// Custom Widget
export const CustomWidget: React.FC<WidgetComponentProps> = () => {
  return (
    <div className="flex items-center justify-center h-full text-neutral-gray">
      <div className="text-center">
        <span className="text-4xl mb-2 block">🛠️</span>
        <p className="text-sm">커스텀 위젯</p>
        <p className="text-xs mt-1">준비 중</p>
      </div>
    </div>
  );
};