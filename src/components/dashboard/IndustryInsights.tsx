import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { useIndustryIntel } from '../../contexts/IndustryIntelContext';
import { useCluster } from '../../contexts/ClusterContext';

export const IndustryInsights: React.FC = () => {
  const { trends, competitors, loading, refreshTrends, getRelevantTrends } = useIndustryIntel();
  const { cluster } = useCluster();

  // 가장 관련성 높은 트렌드 3개
  const topTrends = getRelevantTrends(3);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'negative':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'investment':
        return 'bg-blue-100 text-blue-700';
      case 'competitor':
        return 'bg-orange-100 text-orange-700';
      case 'regulation':
        return 'bg-purple-100 text-purple-700';
      case 'opportunity':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'investment':
        return '투자';
      case 'competitor':
        return '경쟁사';
      case 'regulation':
        return '규제';
      case 'opportunity':
        return '기회';
      case 'trend':
        return '트렌드';
      default:
        return category;
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">업계 인사이트</h3>
          <button
            onClick={() => refreshTrends()}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>

      <CardBody>
        {loading && (
          <div className="text-center py-4 text-gray-500">
            업계 동향을 불러오는 중...
          </div>
        )}

        {!loading && topTrends.length > 0 && (
          <div className="space-y-4">
            {topTrends.map((trend) => (
              <div
                key={trend.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getImpactIcon(trend.impact)}
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(trend.category)}`}>
                      {getCategoryLabel(trend.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(trend.publishedAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-primary-main">
                    관련도 {trend.relevanceScore}%
                  </span>
                </div>

                <h4 className="font-medium text-neutral-dark mb-2">
                  {trend.title}
                </h4>

                <p className="text-sm text-gray-600 mb-3">
                  {trend.summary}
                </p>

                {trend.actionItems && trend.actionItems.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">추천 액션</p>
                    <div className="flex flex-wrap gap-2">
                      {trend.actionItems.map((action, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    출처: {trend.source}
                  </span>
                  {trend.sourceUrl && (
                    <a
                      href={trend.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      자세히 보기
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && topTrends.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            관련 업계 동향이 없습니다.
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Link
            to="/startup/intelligence"
            className="text-sm text-primary-main hover:text-primary-dark flex items-center justify-center gap-2"
          >
            모든 인사이트 보기
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </CardBody>
    </Card>
  );
};

// 경쟁사 업데이트 컴포넌트
export const CompetitorUpdates: React.FC = () => {
  const { competitors, getCompetitorUpdates } = useIndustryIntel();
  const { cluster } = useCluster();

  const relevantCompetitors = getCompetitorUpdates(cluster.sector, cluster.stage);

  const getUpdateTypeIcon = (type: string) => {
    switch (type) {
      case 'funding':
        return '💰';
      case 'product':
        return '🚀';
      case 'partnership':
        return '🤝';
      case 'team':
        return '👥';
      case 'pivot':
        return '🔄';
      default:
        return '📰';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (relevantCompetitors.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-neutral-dark">경쟁사 동향</h3>
      </CardHeader>

      <CardBody>
        <div className="space-y-3">
          {relevantCompetitors.slice(0, 3).map((update) => (
            <div
              key={update.id}
              className="p-3 border border-gray-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getUpdateTypeIcon(update.updateType)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-neutral-dark">
                      {update.companyName}
                    </h4>
                    <span className={`text-xs font-semibold ${getImpactColor(update.impact)}`}>
                      {update.impact === 'high' ? '중요' : update.impact === 'medium' ? '보통' : '참고'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium mb-1">
                    {update.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {update.details}
                  </p>
                  {update.amount && (
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      {(update.amount / 100000000).toFixed(0)}억원
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(update.date).toLocaleDateString('ko-KR')} · {update.source}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};