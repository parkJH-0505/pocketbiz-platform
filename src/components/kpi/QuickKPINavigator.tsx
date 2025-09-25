/**
 * Quick KPI Navigator Component
 *
 * 사용자에게 할당된 KPI에 빠르게 접근할 수 있는 네비게이터
 * - 섹터/단계별 필터링된 KPI 목록
 * - 클릭 시 해당 KPI로 자동 스크롤
 * - 입력 상태 표시 (완료/미완료/변경필요)
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Hash,
  Target,
  Edit,
  ArrowRight,
  Filter,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import { useCluster } from '../../contexts/ClusterContext';
import type { KPIDefinition, AxisKey } from '../../types';

interface QuickKPINavigatorProps {
  onKPISelect?: (kpiId: string, axis: AxisKey) => void;
  className?: string;
}

// KPI 상태 타입
type KPIStatus = 'completed' | 'in-progress' | 'not-started' | 'needs-update';

interface KPIQuickItem {
  kpi: KPIDefinition;
  axis: AxisKey;
  status: KPIStatus;
  currentValue?: any;
  lastUpdated?: Date;
  changeFromLastWeek?: number;
}

const QuickKPINavigator: React.FC<QuickKPINavigatorProps> = ({
  onKPISelect,
  className = ''
}) => {
  const { cluster } = useCluster();
  const { kpiData, responses, lastSaved } = useKPIDiagnosis();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAxis, setSelectedAxis] = useState<AxisKey | 'all'>('all');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [myKPIs, setMyKPIs] = useState<KPIQuickItem[]>([]);

  const axes = [
    { key: 'GO', label: '성장·운영', color: 'purple' },
    { key: 'EC', label: '경제성', color: 'green' },
    { key: 'PT', label: '제품·기술', color: 'orange' },
    { key: 'PF', label: '증빙', color: 'blue' },
    { key: 'TO', label: '팀·조직', color: 'red' }
  ];

  // 내 섹터/단계에 해당하는 KPI 필터링
  useEffect(() => {
    if (!kpiData) return;

    const assignedKPIs: KPIQuickItem[] = [];

    // 각 축별로 할당된 KPI 찾기
    axes.forEach(({ key }) => {
      const axisKey = key as AxisKey;
      const axisKPIs = kpiData.libraries.filter(kpi =>
        kpi.axis === axisKey &&
        kpi.applicable_stages?.includes(cluster.stage) &&
        kpi.applicable_sectors?.includes(cluster.sector)
      );

      axisKPIs.forEach(kpi => {
        const response = responses[kpi.kpi_id];
        let status: KPIStatus = 'not-started';

        if (response) {
          const daysSinceUpdate = lastSaved
            ? Math.floor((Date.now() - new Date(lastSaved).getTime()) / (1000 * 60 * 60 * 24))
            : 999;

          if (daysSinceUpdate > 7) {
            status = 'needs-update';
          } else if (response.value !== null && response.value !== undefined) {
            status = 'completed';
          } else {
            status = 'in-progress';
          }
        }

        assignedKPIs.push({
          kpi,
          axis: axisKey,
          status,
          currentValue: response?.value,
          lastUpdated: lastSaved ? new Date(lastSaved) : undefined
        });
      });
    });

    setMyKPIs(assignedKPIs);
  }, [kpiData, responses, cluster, lastSaved]);

  // 필터링된 KPI 목록
  const filteredKPIs = myKPIs.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.kpi.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kpi.kpi_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAxis = selectedAxis === 'all' || item.axis === selectedAxis;
    const matchesIncomplete = !showOnlyIncomplete || item.status !== 'completed';

    return matchesSearch && matchesAxis && matchesIncomplete;
  });

  // KPI 클릭 핸들러
  const handleKPIClick = (item: KPIQuickItem) => {
    if (onKPISelect) {
      onKPISelect(item.kpi.kpi_id, item.axis);
    }

    // 해당 KPI 엘리먼트로 스크롤
    const element = document.getElementById(`kpi-card-${item.kpi.kpi_id}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // 하이라이트 효과
      element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      }, 2000);
    }
  };

  // 상태별 아이콘 및 색상
  const getStatusIcon = (status: KPIStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-update':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  // 통계 정보
  const stats = {
    total: myKPIs.length,
    completed: myKPIs.filter(k => k.status === 'completed').length,
    needsUpdate: myKPIs.filter(k => k.status === 'needs-update').length,
    notStarted: myKPIs.filter(k => k.status === 'not-started').length
  };

  return (
    <div className={`fixed right-6 top-24 z-40 ${className}`}>
      {/* 컴팩트 뷰 - 플로팅 버튼 */}
      {!isExpanded && (
        <motion.button
          onClick={() => setIsExpanded(true)}
          className="bg-white rounded-full shadow-lg p-4 hover:shadow-xl transition-shadow group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <div className="text-left hidden group-hover:block">
              <div className="text-sm font-semibold text-gray-900">빠른 KPI 찾기</div>
              <div className="text-xs text-gray-500">
                {stats.completed}/{stats.total} 완료
              </div>
            </div>
          </div>
          {stats.needsUpdate > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
          )}
        </motion.button>
      )}

      {/* 확장 뷰 - 네비게이터 패널 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="bg-white rounded-xl shadow-2xl w-96 max-h-[80vh] overflow-hidden"
          >
            {/* 헤더 */}
            <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">내 KPI 빠른 찾기</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* 현재 클러스터 정보 */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="px-2 py-1 bg-white rounded-md">{cluster.sector}</span>
                <span className="text-gray-400">•</span>
                <span className="px-2 py-1 bg-white rounded-md">{cluster.stage}</span>
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                  <div className="text-xs text-gray-500">전체</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.completed}</div>
                  <div className="text-xs text-gray-500">완료</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-600">{stats.needsUpdate}</div>
                  <div className="text-xs text-gray-500">업데이트</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-400">{stats.notStarted}</div>
                  <div className="text-xs text-gray-500">미입력</div>
                </div>
              </div>
            </div>

            {/* 필터 & 검색 */}
            <div className="p-3 border-b bg-gray-50">
              {/* 검색 */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="KPI 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 축 필터 */}
              <div className="flex gap-1 mb-2">
                <button
                  onClick={() => setSelectedAxis('all')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedAxis === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  전체
                </button>
                {axes.map(axis => (
                  <button
                    key={axis.key}
                    onClick={() => setSelectedAxis(axis.key as AxisKey)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedAxis === axis.key
                        ? `bg-${axis.color}-600 text-white`
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {axis.label}
                  </button>
                ))}
              </div>

              {/* 미완료만 보기 체크박스 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyIncomplete}
                  onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">미완료 항목만 보기</span>
              </label>
            </div>

            {/* KPI 목록 */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 280px)' }}>
              {filteredKPIs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">해당하는 KPI가 없습니다</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredKPIs.map((item, index) => (
                    <motion.button
                      key={item.kpi.kpi_id}
                      onClick={() => handleKPIClick(item)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        {/* 상태 아이콘 */}
                        {getStatusIcon(item.status)}

                        {/* KPI 정보 */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded bg-${
                              axes.find(a => a.key === item.axis)?.color || 'gray'
                            }-100 text-${
                              axes.find(a => a.key === item.axis)?.color || 'gray'
                            }-700`}>
                              {item.axis}
                            </span>
                            <span className="text-xs text-gray-500">
                              #{item.kpi.kpi_id.slice(-4)}
                            </span>
                          </div>

                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {item.kpi.kpi_name}
                          </div>

                          <div className="text-xs text-gray-600 line-clamp-2">
                            {item.kpi.question_text}
                          </div>

                          {/* 현재 값 표시 */}
                          {item.currentValue !== undefined && (
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-gray-500">현재값:</span>
                              <span className="font-medium text-gray-900">
                                {typeof item.currentValue === 'boolean'
                                  ? (item.currentValue ? '예' : '아니오')
                                  : item.currentValue}
                              </span>
                              {item.lastUpdated && (
                                <span className="text-gray-400">
                                  ({Math.floor((Date.now() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))}일 전)
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* 이동 아이콘 */}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 액션 */}
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  // 진단 페이지로 이동
                  window.location.href = '/pocketbiz-platform/startup/kpi?tab=assess';
                }}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                KPI 진단 페이지로 이동
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickKPINavigator;