/**
 * QuickKPINavigator Component
 *
 * KPI 진단 페이지에서 할당된 KPI를 빠르게 찾아 이동할 수 있는 네비게이터
 * - 할당된 KPI 목록을 컴팩트하게 표시
 * - 클릭 시 해당 KPI 입력 폼으로 자동 스크롤
 * - 입력 상태를 한눈에 확인 가능
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  ChevronLeft,
  X,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  TrendingUp,
  Star,
  Search,
  Filter,
  MinusCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import type { KPIDefinition } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

// Props 타입 정의
interface QuickKPINavigatorProps {
  kpiData: Record<string, KPIDefinition[]>;  // 축별 KPI 데이터
  responses: Record<string, any>;            // KPI 응답 데이터
  onKPIClick: (kpiId: string, axis: string) => void;  // 클릭 핸들러
  userCluster?: {
    sector?: string;
    stage?: string;
  };
}

const QuickKPINavigator: React.FC<QuickKPINavigatorProps> = ({
  kpiData,
  responses,
  onKPIClick,
  userCluster
}) => {
  // 상태 관리
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAxis, setSelectedAxis] = useState<string>('all');
  const [favoriteKPIs, setFavoriteKPIs] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{field: string; direction: 'asc' | 'desc'}>({
    field: 'name',
    direction: 'asc'
  });

  // LocalStorage 안전 접근 함수들
  const getFavoriteStorageKey = () => {
    const userId = userCluster?.id || 'default';
    return `kpi-favorites-${userId}`;
  };

  const saveFavoritesToStorage = (favorites: string[]) => {
    try {
      localStorage.setItem(getFavoriteStorageKey(), JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  };

  const loadFavoritesFromStorage = () => {
    try {
      const stored = localStorage.getItem(getFavoriteStorageKey());
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load favorites:', error);
      return [];
    }
  };

  // 즐겨찾기 토글 함수
  const toggleFavorite = useCallback((kpiId: string) => {
    setFavoriteKPIs(prev => {
      const newFavorites = prev.includes(kpiId)
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId];

      saveFavoritesToStorage(newFavorites);
      return newFavorites;
    });
  }, [userCluster?.id]);

  // 컴포넌트 마운트 시 즐겨찾기 로드
  useEffect(() => {
    const favorites = loadFavoritesFromStorage();
    setFavoriteKPIs(favorites);
  }, [userCluster?.id]);

  // 사용자에게 할당된 KPI만 필터링
  const assignedKPIs = useMemo(() => {
    if (!kpiData) return [];

    // Response 구조 확인 (개발용 로그)
    if (responses && Object.keys(responses).length > 0) {
      const firstResponseKey = Object.keys(responses)[0];
      // KPI 응답 데이터 확인됨
    }

    // KPI 데이터 구조 확인 (개발용 로그)
    if (kpiData && Object.keys(kpiData).length > 0) {
      const firstAxis = Object.keys(kpiData)[0];
      const firstKPI = kpiData[firstAxis]?.[0];
      // KPI 데이터 구조 확인됨
    }

    const allKPIs = Object.entries(kpiData).flatMap(([axis, kpis]) =>
      Array.isArray(kpis) ? kpis.map(kpi => {
        const kpiId = kpi.kpi_id || kpi.id;
        const response = responses[kpiId];

        // 실제 response 구조에 맞춰 데이터 추출
        const hasValue = response && response.raw !== undefined && response.raw !== '';
        const timestamp = response?.timestamp;

        // 업데이트 시간 계산
        let daysSinceUpdate = null;
        let isRecent = false;
        if (timestamp) {
          daysSinceUpdate = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24);
          isRecent = daysSinceUpdate <= 7;
        }

        return {
          ...kpi,
          axis,
          id: kpiId,
          currentValue: response?.raw || '',
          hasValue,
          responseStatus: response?.status || 'empty',  // 'valid', 'na', 'invalid', 'empty'
          timestamp,
          daysSinceUpdate,
          isRecent
        };
      }) : []
    );

    // 섹터와 단계에 맞는 KPI만 필터링 (실제 로직은 백엔드에서 처리됨)
    // 현재는 모든 KPI를 표시하되, assigned 필드가 있으면 그것을 사용
    return allKPIs.filter(kpi => {
      // assigned 필드가 있으면 그것을 확인
      if ('assigned' in kpi) return kpi.assigned;
      // 없으면 모두 표시 (백엔드에서 이미 필터링됨)
      return true;
    });
  }, [kpiData, responses, userCluster]);

  // 할당된 KPI 총 개수 계산
  const totalKPIs = assignedKPIs.length;

  // 입력 완료된 KPI 개수 계산
  const completedKPIs = assignedKPIs.filter(kpi => kpi.hasValue).length;

  // 업데이트 필요한 KPI 개수
  const outdatedKPIs = assignedKPIs.filter(kpi => kpi.hasValue && !kpi.isRecent).length;

  // 정렬 함수
  const sortKPIs = useCallback((kpis: any[]) => {
    const sorted = [...kpis].sort((a, b) => {
      // 즐겨찾기 KPI는 항상 최상단
      const aIsFavorite = favoriteKPIs.includes(a.id);
      const bIsFavorite = favoriteKPIs.includes(b.id);

      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // 같은 즐겨찾기 레벨에서 선택된 기준으로 정렬
      let comparison = 0;

      switch (sortConfig.field) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'status':
          const aStatus = getKPIStatus(a);
          const bStatus = getKPIStatus(b);
          comparison = aStatus.priority - bStatus.priority;
          break;
        case 'updated':
          const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
          const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
          comparison = bTime - aTime; // 최신순
          break;
        case 'axis':
          comparison = (a.axis || '').localeCompare(b.axis || '');
          break;
        default:
          comparison = (a.name || '').localeCompare(b.name || '');
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [favoriteKPIs, sortConfig]);

  // 검색, 필터링, 정렬된 KPI
  const filteredAndSortedKPIs = useMemo(() => {
    let filtered = assignedKPIs;

    // 축 필터링
    if (selectedAxis !== 'all') {
      filtered = filtered.filter(kpi => kpi.axis === selectedAxis);
    }

    // 검색어 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(kpi =>
        kpi.name.toLowerCase().includes(query) ||
        kpi.question?.toLowerCase().includes(query)
      );
    }

    // 정렬 적용
    return sortKPIs(filtered);
  }, [assignedKPIs, selectedAxis, searchQuery, sortKPIs]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // KPI 상태를 정확하게 계산하는 함수
  const getKPIStatus = (kpi: any) => {
    // NA (해당없음) 상태
    if (kpi.responseStatus === 'na') {
      return { type: 'na', label: '해당없음', priority: 0 };
    }

    // Invalid (유효하지 않음) 상태
    if (kpi.responseStatus === 'invalid') {
      return { type: 'invalid', label: '재입력 필요', priority: 4 };
    }

    // 값이 없는 경우
    if (!kpi.hasValue) {
      return { type: 'empty', label: '미입력', priority: 3 };
    }

    // 값이 있고 valid한 경우 - 시간 체크
    if (kpi.daysSinceUpdate !== null) {
      if (kpi.daysSinceUpdate <= 3) {
        return { type: 'recent', label: '최신', priority: 1 };
      }
      if (kpi.daysSinceUpdate <= 7) {
        return { type: 'normal', label: '완료', priority: 1 };
      }
      if (kpi.daysSinceUpdate <= 14) {
        return { type: 'outdated', label: '업데이트 필요', priority: 2 };
      }
      return { type: 'critical', label: '긴급 업데이트', priority: 3 };
    }

    // 시간 정보가 없는 경우
    return { type: 'normal', label: '완료', priority: 1 };
  };

  // KPI 값을 보기 좋게 포맷팅
  const formatKPIValue = (value: any) => {
    if (!value) return '미입력';

    // 숫자인 경우
    if (!isNaN(value) && value !== '') {
      const num = parseFloat(value);
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
      if (num % 1 !== 0) return num.toFixed(2);
      return num.toString();
    }

    // 텍스트인 경우
    const text = String(value);
    if (text.length > 25) {
      return text.substring(0, 25) + '...';
    }
    return text;
  };

  // 업데이트 시간을 읽기 쉽게 포맷팅
  const formatUpdateTime = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${Math.floor(diffHours)}시간 전`;
    if (diffDays < 2) return '어제';
    if (diffDays < 7) return `${Math.floor(diffDays)}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;

    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  };

  // 상태별 아이콘과 색상 반환
  const getStatusIcon = (status: ReturnType<typeof getKPIStatus>) => {
    switch (status.type) {
      case 'recent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'outdated':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'invalid':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case 'na':
        return <MinusCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  // 축별 색상 설정 (AssessmentPanel의 축과 동일하게)
  const getAxisColor = (axis: string) => {
    const colors: Record<string, string> = {
      'GO': 'bg-purple-100 text-purple-700',  // Growth & Ops
      'EC': 'bg-green-100 text-green-700',    // Economics
      'PT': 'bg-orange-100 text-orange-700',  // Product & Tech
      'PF': 'bg-blue-100 text-blue-700',      // Proof
      'TO': 'bg-red-100 text-red-700'         // Team & Org
    };
    return colors[axis] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      {/* 개선된 플로팅 버튼 - 더 임팩트있는 디자인 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="
                relative
                bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700
                text-white
                shadow-2xl
                rounded-l-3xl
                px-6 py-4
                hover:shadow-blue-500/50
                hover:scale-105
                transition-all duration-300
                group
                border-2 border-white/20
              "
            >
              <div className="flex items-center gap-4">
                {/* 메인 아이콘과 텍스트 - 가로 정렬 */}
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                    className="relative"
                  >
                    <Target className="w-8 h-8" />
                    {/* 펄스 효과 */}
                    <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
                  </motion.div>

                  <div className="text-left">
                    <div className="text-sm font-bold leading-tight">
                      KPI 빠른이동
                    </div>
                    <div className="text-xs text-blue-100 leading-tight">
                      {completedKPIs}/{totalKPIs}개 완료
                    </div>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="w-16">
                  <div className="text-xs text-right mb-1 font-bold">
                    {Math.round((completedKPIs / totalKPIs) * 100)}%
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedKPIs / totalKPIs) * 100}%` }}
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* 호버 시 나타나는 안내 텍스트 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileHover={{ opacity: 1, x: 0 }}
                className="absolute right-full mr-2 top-1/2 -translate-y-1/2
                          bg-black/80 text-white text-xs px-2 py-1 rounded
                          whitespace-nowrap pointer-events-none"
              >
                클릭해서 KPI 목록 보기 →
              </motion.div>

              {/* 업데이트 필요 알림 - 더 눈에 띄게 */}
              {outdatedKPIs > 0 && (
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="
                    absolute -top-3 -left-3
                    w-8 h-8
                    bg-gradient-to-r from-red-500 to-orange-500
                    rounded-full
                    flex items-center justify-center
                    shadow-lg
                    border-2 border-white
                  "
                >
                  <AlertCircle className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {outdatedKPIs}
                  </span>
                </motion.div>
              )}

              {/* 새 기능 배지 */}
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                NEW
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 개선된 펼친 상태 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="
              fixed right-4 top-20
              w-96 max-h-[calc(100vh-120px)]
              bg-white rounded-2xl shadow-2xl
              border border-gray-200
              overflow-hidden z-40
            "
          >
            {/* 헤더 - 그라디언트 배경 */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-6 h-6" />
                  <h3 className="text-lg font-bold">KPI 관리센터</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 검색 바 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="KPI 이름 또는 질문 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-full pl-10 pr-4 py-2
                    bg-white text-gray-900
                    rounded-lg
                    placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-white/50
                  "
                />
              </div>

              {/* 축 필터 버튼 */}
              <div className="flex gap-1 mt-3 flex-wrap">
                <button
                  onClick={() => setSelectedAxis('all')}
                  className={`
                    px-3 py-1 text-xs rounded-full transition-all
                    ${selectedAxis === 'all'
                      ? 'bg-white text-blue-700 font-semibold'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }
                  `}
                >
                  전체 ({assignedKPIs.length})
                </button>
                {['GO', 'EC', 'PT', 'PF', 'TO'].map(axis => {
                  const count = assignedKPIs.filter(kpi => kpi.axis === axis).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={axis}
                      onClick={() => setSelectedAxis(axis)}
                      className={`
                        px-3 py-1 text-xs rounded-full transition-all
                        ${selectedAxis === axis
                          ? 'bg-white text-blue-700 font-semibold'
                          : 'bg-white/20 text-white hover:bg-white/30'
                        }
                      `}
                    >
                      {axis} ({count})
                    </button>
                  );
                })}
              </div>

              {/* 정렬 옵션 */}
              <div className="mt-3 flex items-center justify-between">
                <select
                  value={`${sortConfig.field}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split('-');
                    setSortConfig({ field, direction: direction as 'asc' | 'desc' });
                  }}
                  className="
                    text-xs bg-white/20 text-white rounded px-2 py-1
                    focus:outline-none focus:bg-white/30
                  "
                >
                  <option value="name-asc" className="text-gray-900">이름순 ↑</option>
                  <option value="name-desc" className="text-gray-900">이름순 ↓</option>
                  <option value="status-asc" className="text-gray-900">상태순 (완료우선)</option>
                  <option value="status-desc" className="text-gray-900">상태순 (미완료우선)</option>
                  <option value="updated-asc" className="text-gray-900">업데이트순 (오래된순)</option>
                  <option value="updated-desc" className="text-gray-900">업데이트순 (최신순)</option>
                  <option value="axis-asc" className="text-gray-900">축순 ↑</option>
                </select>

                <span className="text-xs">
                  ⭐ {favoriteKPIs.length}개 즐겨찾기
                </span>
              </div>

              {/* 진행 상태 */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>진행률</span>
                  <span>{completedKPIs}/{totalKPIs}개 완료</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedKPIs / totalKPIs) * 100}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>
            </div>

            {/* KPI 리스트 - 개선된 디자인 */}
            <div className="overflow-y-auto max-h-[calc(100vh-400px)] p-3">
              {filteredAndSortedKPIs.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {searchQuery ? '검색 결과가 없습니다' : 'KPI가 없습니다'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAndSortedKPIs.map(kpi => {
                    const status = getKPIStatus(kpi);
                    const statusIcon = getStatusIcon(status);

                    return (
                      <motion.button
                        key={kpi.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onKPIClick(kpi.id, kpi.axis);
                          // 패널은 열린 상태로 유지
                          // 검색 초기화만 수행
                          setSearchQuery('');
                        }}
                        className="
                          w-full p-3
                          bg-white
                          border border-gray-200
                          rounded-xl
                          hover:border-blue-400
                          hover:shadow-md
                          transition-all
                          text-left
                          group
                        "
                      >
                        <div className="flex items-start gap-3">
                          {/* 상태 아이콘 */}
                          <div className="mt-1">
                            {statusIcon}
                          </div>

                          {/* KPI 정보 */}
                          <div className="flex-1 min-w-0">
                            {/* KPI 이름을 더 크게 표시 */}
                            <div className="mb-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`
                                  px-2 py-0.5
                                  text-[10px] font-bold
                                  rounded-full
                                  ${getAxisColor(kpi.axis)}
                                `}>
                                  {kpi.axis}
                                </span>
                              </div>
                              <h4 className="font-bold text-base text-gray-900 mb-1 line-clamp-1">
                                {kpi.name || kpi.title || kpi.kpi_name || '목표 시장 검증 수준'}
                              </h4>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {kpi.question}
                              </p>
                            </div>

                            {kpi.hasValue && (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs font-medium text-blue-600">
                                  현재값: {formatKPIValue(kpi.currentValue)}
                                </span>
                                {kpi.timestamp && (
                                  <span className="text-xs text-gray-500">
                                    {formatUpdateTime(kpi.timestamp)}
                                  </span>
                                )}
                                {status.type === 'outdated' || status.type === 'critical' ? (
                                  <span className="text-xs text-yellow-600">
                                    {status.label}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>

                          {/* 즐겨찾기 버튼 - div로 변경하여 중첩 button 방지 */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(kpi.id);
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`${favoriteKPIs.includes(kpi.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(kpi.id);
                              }
                            }}
                            className="
                              p-1 rounded-full
                              hover:bg-gray-100
                              transition-colors
                              mr-1
                              cursor-pointer
                              focus:outline-none
                              focus:ring-2
                              focus:ring-blue-500
                              focus:ring-offset-1
                            "
                          >
                            <Star className={`
                              w-4 h-4 transition-colors
                              ${favoriteKPIs.includes(kpi.id)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-300 hover:text-yellow-400'
                              }
                            `} />
                          </div>

                          {/* 이동 화살표 */}
                          <ChevronLeft className="
                            w-4 h-4 text-gray-400
                            group-hover:text-blue-600
                            group-hover:-translate-x-1
                            transition-all
                            rotate-180
                            mt-1
                          " />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 요약 */}
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-600">
              <div className="flex justify-between items-center">
                <span>{filteredAndSortedKPIs.length}개 KPI 표시 중</span>
                <span className="text-blue-600 font-medium">
                  클릭하여 바로 이동 →
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default QuickKPINavigator;