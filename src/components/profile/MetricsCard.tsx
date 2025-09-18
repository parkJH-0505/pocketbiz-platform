import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Activity,
  Award,
  ArrowUp,
  ArrowDown,
  Minus,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Info,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  change?: number; // 변화율 (%)
  changeType?: 'increase' | 'decrease' | 'neutral';
  isPrivate?: boolean; // 민감한 정보
  category: 'revenue' | 'users' | 'engagement' | 'growth' | 'custom';
  icon?: React.ElementType;
  description?: string;
  period?: string; // 측정 기간
}

interface MetricsCardProps {
  viewMode: 'public' | 'investors' | 'team' | 'private';
  isEditing?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({ viewMode, isEditing = false }) => {
  const [localEditing, setLocalEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // 메트릭 데이터
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      id: '1',
      label: '월간 활성 사용자',
      value: '15,234',
      unit: '명',
      change: 23.5,
      changeType: 'increase',
      category: 'users',
      icon: Users,
      description: '최근 30일간 서비스를 이용한 고유 사용자 수',
      period: '2024.01'
    },
    {
      id: '2',
      label: '월간 반복 수익',
      value: '₩4.5M',
      unit: 'MRR',
      change: 18.2,
      changeType: 'increase',
      isPrivate: true,
      category: 'revenue',
      icon: DollarSign,
      description: '구독 기반 월간 반복 수익',
      period: '2024.01'
    },
    {
      id: '3',
      label: '고객 유지율',
      value: 92,
      unit: '%',
      change: 2.1,
      changeType: 'increase',
      category: 'engagement',
      icon: Award,
      description: '지난 분기 대비 고객 유지율',
      period: 'Q4 2023'
    },
    {
      id: '4',
      label: '일일 활성 사용자',
      value: '3,421',
      unit: 'DAU',
      change: -5.3,
      changeType: 'decrease',
      category: 'users',
      icon: Activity,
      description: '오늘 서비스를 이용한 고유 사용자 수',
      period: 'Today'
    },
    {
      id: '5',
      label: '평균 세션 시간',
      value: '8:32',
      unit: '분',
      change: 0,
      changeType: 'neutral',
      category: 'engagement',
      icon: Target,
      description: '사용자당 평균 서비스 이용 시간',
      period: '최근 7일'
    },
    {
      id: '6',
      label: '전환율',
      value: 3.8,
      unit: '%',
      change: 12.5,
      changeType: 'increase',
      isPrivate: true,
      category: 'growth',
      icon: TrendingUp,
      description: '방문자 대비 유료 전환 비율',
      period: '2024.01'
    }
  ]);

  const [editingMetrics, setEditingMetrics] = useState<Metric[]>([...metrics]);

  // 보기 모드에 따른 메트릭 필터링
  const getVisibleMetrics = () => {
    if (viewMode === 'public') {
      // 공개 모드: 민감하지 않은 기본 지표만
      return metrics.filter(m => !m.isPrivate && ['users', 'engagement'].includes(m.category));
    } else if (viewMode === 'investors') {
      // 투자자 모드: 성장 지표 포함, 상세 수익 제외
      return metrics.filter(m => !m.isPrivate || m.category === 'growth');
    }
    // 팀/비공개 모드: 모든 지표
    return metrics;
  };

  const visibleMetrics = getVisibleMetrics();

  // 변화율 아이콘 및 색상
  const getChangeIndicator = (metric: Metric) => {
    if (!metric.change) {
      return { icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-50' };
    }
    if (metric.changeType === 'increase') {
      return { icon: ArrowUp, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
    if (metric.changeType === 'decrease') {
      return { icon: ArrowDown, color: 'text-red-600', bgColor: 'bg-red-50' };
    }
    return { icon: Minus, color: 'text-gray-400', bgColor: 'bg-gray-50' };
  };

  // 카테고리별 색상
  const getCategoryColor = (category: string) => {
    const colors = {
      revenue: 'from-green-500 to-emerald-600',
      users: 'from-blue-500 to-indigo-600',
      engagement: 'from-purple-500 to-pink-600',
      growth: 'from-orange-500 to-red-600',
      custom: 'from-gray-500 to-gray-600'
    };
    return colors[category as keyof typeof colors] || colors.custom;
  };

  // 메트릭 업데이트
  const handleMetricUpdate = (id: string, field: keyof Metric, value: any) => {
    setEditingMetrics(prev =>
      prev.map(m => m.id === id ? { ...m, [field]: value } : m)
    );
  };

  // 저장
  const handleSave = () => {
    setMetrics([...editingMetrics]);
    setLocalEditing(false);
  };

  // 취소
  const handleCancel = () => {
    setEditingMetrics([...metrics]);
    setLocalEditing(false);
  };

  // 새 메트릭 추가
  const handleAddMetric = () => {
    const newMetric: Metric = {
      id: Date.now().toString(),
      label: '새 지표',
      value: 0,
      category: 'custom',
      icon: BarChart3
    };
    setEditingMetrics([...editingMetrics, newMetric]);
  };

  // 메트릭 삭제
  const handleRemoveMetric = (id: string) => {
    setEditingMetrics(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">핵심 지표</h3>
              <p className="text-sm text-gray-600">
                {visibleMetrics.length}개 지표 표시 중
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              title={showDetails ? '간단히 보기' : '자세히 보기'}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {localEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="저장"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  title="취소"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setLocalEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                title="편집"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 메트릭 그리드 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(localEditing ? editingMetrics : visibleMetrics).map((metric) => {
            const Icon = metric.icon || BarChart3;
            const changeIndicator = getChangeIndicator(metric);
            const ChangeIcon = changeIndicator.icon;

            return (
              <div
                key={metric.id}
                className={`relative group p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedMetric === metric.id
                    ? 'border-blue-300 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => !localEditing && setSelectedMetric(selectedMetric === metric.id ? null : metric.id)}
              >
                {/* 편집 모드 삭제 버튼 */}
                {localEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMetric(metric.id);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* 카테고리 아이콘 */}
                <div className={`w-10 h-10 bg-gradient-to-br ${getCategoryColor(metric.category)} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                {/* 라벨 */}
                {localEditing ? (
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => handleMetricUpdate(metric.id, 'label', e.target.value)}
                    className="text-xs text-gray-500 bg-transparent border-b border-gray-300 mb-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
                )}

                {/* 값 */}
                <div className="flex items-baseline gap-1 mb-2">
                  {localEditing ? (
                    <input
                      type="text"
                      value={metric.value}
                      onChange={(e) => handleMetricUpdate(metric.id, 'value', e.target.value)}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 w-20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.isPrivate && viewMode === 'public' ? '***' : metric.value}
                    </span>
                  )}
                  {metric.unit && (
                    <span className="text-sm text-gray-500">{metric.unit}</span>
                  )}
                </div>

                {/* 변화율 */}
                {metric.change !== undefined && (
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${changeIndicator.bgColor} ${changeIndicator.color}`}>
                    <ChangeIcon className="w-3 h-3" />
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                )}

                {/* 기간 */}
                {metric.period && (
                  <p className="text-xs text-gray-400 mt-2">{metric.period}</p>
                )}

                {/* 상세 정보 (선택됨 & 상세보기 모드) */}
                {selectedMetric === metric.id && showDetails && metric.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600">{metric.description}</p>
                    </div>
                  </div>
                )}

                {/* 비공개 표시 */}
                {metric.isPrivate && (
                  <div className="absolute top-2 right-2">
                    {viewMode === 'public' ? (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 메트릭 추가 버튼 (편집 모드) */}
          {localEditing && (
            <button
              onClick={handleAddMetric}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-sm text-gray-500">지표 추가</span>
            </button>
          )}
        </div>

        {/* 빈 상태 */}
        {visibleMetrics.length === 0 && !localEditing && (
          <div className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">표시할 지표가 없습니다</p>
            <p className="text-sm text-gray-400 mt-1">
              {viewMode === 'public' ? '공개 모드에서는 제한된 지표만 표시됩니다' : '지표를 추가해주세요'}
            </p>
          </div>
        )}
      </div>

      {/* 푸터 - 요약 통계 (팀/비공개 모드) */}
      {(viewMode === 'team' || viewMode === 'private') && visibleMetrics.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp className="w-3 h-3 text-green-500" />
                상승 {visibleMetrics.filter(m => m.changeType === 'increase').length}개
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown className="w-3 h-3 text-red-500" />
                하락 {visibleMetrics.filter(m => m.changeType === 'decrease').length}개
              </span>
              <span className="flex items-center gap-1">
                <Minus className="w-3 h-3 text-gray-400" />
                유지 {visibleMetrics.filter(m => m.changeType === 'neutral' || !m.changeType).length}개
              </span>
            </div>
            <span className="text-gray-500">
              마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;