/**
 * ScenarioActionTab - 통합된 시나리오 및 액션 탭
 * 시나리오 관리 + 협업 기능 + 액션 아이템 통합
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Save, Users, MessageCircle, Share2,
  Plus, Archive, Star, Clock, CheckSquare,
  Play, Pause, Settings, Download
} from 'lucide-react';
import { useV2Store } from '../../store/useV2Store';
import { ScenarioManager } from '../ScenarioManager';
import { SmartRecommendations } from '../SmartRecommendations';

// 기능 플래그 (점진적 활성화용)
const FEATURE_FLAGS = {
  scenarios: true,
  recommendations: true,
  collaboration: false, // 협업 기능은 추후 구현
  notifications: false
};

// 간단한 액션 아이템 컴포넌트
const ActionItems: React.FC = () => {
  const [actionItems] = useState([
    {
      id: '1',
      title: '고객 획득 비용 최적화',
      priority: 'high' as const,
      estimated_impact: '+15점',
      timeframe: '2-4주',
      status: 'pending' as const
    },
    {
      id: '2',
      title: '제품 피드백 시스템 구축',
      priority: 'medium' as const,
      estimated_impact: '+8점',
      timeframe: '4-6주',
      status: 'in_progress' as const
    },
    {
      id: '3',
      title: '팀 역량 개발 프로그램',
      priority: 'medium' as const,
      estimated_impact: '+12점',
      timeframe: '6-8주',
      status: 'completed' as const
    }
  ]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Pause className="w-4 h-4 text-gray-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900">추천 액션 아이템</h4>
        <button className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-main text-white rounded hover:bg-primary-dark">
          <Plus className="w-4 h-4" />
          추가
        </button>
      </div>

      {actionItems.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(item.status)}
                <h5 className="font-medium text-gray-900">{item.title}</h5>
                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(item.priority)}`}>
                  {item.priority === 'high' ? '높음' : item.priority === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>예상 효과: <span className="font-medium text-green-600">{item.estimated_impact}</span></span>
                <span>소요시간: {item.timeframe}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 협업 섹션 (기본 UI만)
const CollaborationSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
        <Users className="w-4 h-4" />
        팀 협업
      </h4>

      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">협업 기능 준비중</p>
        <p className="text-sm text-gray-500">시나리오 공유, 댓글, 승인 워크플로우</p>
      </div>
    </div>
  );
};

export const ScenarioActionTab: React.FC = () => {
  const { simulation, viewState } = useV2Store();
  const [activeSection, setActiveSection] = useState<'scenarios' | 'actions' | 'collaboration'>('scenarios');

  const sections = [
    {
      key: 'scenarios',
      label: '시나리오 관리',
      icon: Archive,
      enabled: FEATURE_FLAGS.scenarios
    },
    {
      key: 'actions',
      label: '액션 아이템',
      icon: Target,
      enabled: FEATURE_FLAGS.recommendations
    },
    {
      key: 'collaboration',
      label: '팀 협업',
      icon: Users,
      enabled: FEATURE_FLAGS.collaboration
    }
  ];

  return (
    <motion.div
      className="space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 및 섹션 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-main" />
              <h3 className="text-lg font-semibold text-gray-900">
                시나리오 & 액션
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50">
                <Download className="w-4 h-4" />
                내보내기
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-50">
                <Share2 className="w-4 h-4" />
                공유
              </button>
            </div>
          </div>

          {/* 섹션 탭 */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key as any)}
                  disabled={!section.enabled}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all ${
                    activeSection === section.key
                      ? 'bg-white text-primary-main shadow-sm'
                      : section.enabled
                      ? 'text-gray-600 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                  {!section.enabled && (
                    <span className="text-xs bg-gray-200 px-1 rounded">준비중</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 섹션별 콘텐츠 */}
      <AnimatePresence mode="wait">
        {activeSection === 'scenarios' && (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="font-semibold text-gray-900">저장된 시나리오</h4>
                <p className="text-sm text-gray-600 mt-1">
                  시뮬레이션 결과를 저장하고 관리합니다
                </p>
              </div>
              <div className="p-6">
                <ScenarioManager />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'actions' && (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            {/* 액션 아이템 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="font-semibold text-gray-900">실행 계획</h4>
                <p className="text-sm text-gray-600 mt-1">
                  우선순위별 개선 과제
                </p>
              </div>
              <div className="p-6">
                <ActionItems />
              </div>
            </div>

            {/* 스마트 추천 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="font-semibold text-gray-900">AI 추천</h4>
                <p className="text-sm text-gray-600 mt-1">
                  데이터 기반 개선 제안
                </p>
              </div>
              <div className="p-6">
                <SmartRecommendations />
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === 'collaboration' && (
          <motion.div
            key="collaboration"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h4 className="font-semibold text-gray-900">팀 협업</h4>
                <p className="text-sm text-gray-600 mt-1">
                  시나리오 공유 및 승인 워크플로
                </p>
              </div>
              <div className="p-6">
                <CollaborationSection />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 현재 시뮬레이션 상태 */}
      {simulation.isActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">
              활성 시뮬레이션이 있습니다
            </span>
            <button className="ml-auto flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              <Save className="w-4 h-4" />
              시나리오로 저장
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};