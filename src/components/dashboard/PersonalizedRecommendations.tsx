import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  ChevronRight,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { useRecommendation } from '../../contexts/RecommendationContext';
import type { RecommendationType, RecommendationPriority } from '../../contexts/RecommendationContext';

export const SmartRecommendations: React.FC = () => {
  const {
    recommendations,
    loading,
    dismissRecommendation,
    markAsCompleted,
    refreshRecommendations
  } = useRecommendation();

  const [filter, setFilter] = useState<RecommendationType | 'all'>('all');

  const filteredRecommendations = filter === 'all'
    ? recommendations
    : recommendations.filter(rec => rec.type === filter);

  const getTypeIcon = (type: RecommendationType) => {
    switch (type) {
      case 'action':
        return <Zap className="w-4 h-4" />;
      case 'program':
        return <Target className="w-4 h-4" />;
      case 'buildup':
        return <TrendingUp className="w-4 h-4" />;
      case 'investment':
        return <DollarSign className="w-4 h-4" />;
      case 'networking':
        return <Users className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: RecommendationType) => {
    switch (type) {
      case 'action':
        return '액션';
      case 'program':
        return '프로그램';
      case 'buildup':
        return '빌드업';
      case 'investment':
        return '투자';
      case 'networking':
        return '네트워킹';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">맞춤 추천</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as RecommendationType | 'all')}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              <option value="all">전체</option>
              <option value="action">액션</option>
              <option value="program">프로그램</option>
              <option value="buildup">빌드업</option>
              <option value="investment">투자</option>
              <option value="networking">네트워킹</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardBody>
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            추천을 생성하는 중...
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="space-y-4">
            {filteredRecommendations.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className={`p-4 border rounded-lg ${getPriorityColor(rec.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rec.type)}
                    <span className="text-xs font-medium">
                      {getTypeLabel(rec.type)}
                    </span>
                    <span className="text-xs font-bold">
                      {rec.matchScore}% 매칭
                    </span>
                  </div>
                  <button
                    onClick={() => dismissRecommendation(rec.id)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <h4 className="font-semibold text-neutral-dark mb-1">
                  {rec.title}
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  {rec.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  {rec.expectedImpact?.scoreIncrease && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{rec.expectedImpact.scoreIncrease}점
                    </span>
                  )}
                  {rec.expectedImpact?.timeframe && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.expectedImpact.timeframe}
                    </span>
                  )}
                  {rec.cost?.amount && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {(rec.cost.amount / 10000).toFixed(0)}만원
                    </span>
                  )}
                </div>

                <div className="bg-white/50 p-2 rounded mb-3">
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">추천 이유:</span> {rec.reason}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {rec.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white/50 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {rec.actionUrl && (
                    <Link
                      to={rec.actionUrl}
                      className="flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      시작하기
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            추천 항목이 없습니다
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// 인사이트 패널
export const PersonalizedInsights: React.FC = () => {
  const { insights } = useRecommendation();

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength':
        return '💪';
      case 'weakness':
        return '⚠️';
      case 'opportunity':
        return '🎯';
      case 'threat':
        return '🚨';
      default:
        return '💡';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength':
        return 'bg-green-50 border-green-200';
      case 'weakness':
        return 'bg-orange-50 border-orange-200';
      case 'opportunity':
        return 'bg-blue-50 border-blue-200';
      case 'threat':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-neutral-dark">개인화 인사이트</h3>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-neutral-dark mb-1">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-gray-700 mb-3">
                    {insight.description}
                  </p>
                  {insight.actionItems.length > 0 && (
                    <div className="space-y-1">
                      {insight.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="w-3 h-3 text-gray-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};