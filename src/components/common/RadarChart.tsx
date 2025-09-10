import { useState } from 'react';
import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Share2, Info } from 'lucide-react';
import type { RadarData, AxisKey, AxisScore } from '../../types';

interface RadarChartProps {
  data: RadarData;
  onAxisClick?: (axis: AxisKey) => void;
  showOverlays?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, onAxisClick, showOverlays = true }) => {
  const [selectedOverlay, setSelectedOverlay] = useState<'prev' | 'peer_avg' | 'target' | null>(null);

  // Transform data for recharts
  const chartData = data.axis_scores.map(score => ({
    axis: score.axis,
    current: score.score,
    prev: data.overlays?.prev?.[score.axis] || 0,
    peer_avg: data.overlays?.peer_avg?.[score.axis] || 0,
    target: data.overlays?.target?.[score.axis] || 0,
  }));

  const handleExport = (format: 'pdf' | 'png') => {
    // Export logic
    console.log(`Exporting as ${format}`);
  };

  const handleShare = () => {
    // Share logic
    console.log('Sharing...');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">평가 결과</h2>
          <span className="text-sm text-gray-500">
            {data.cluster.sector} · {data.cluster.stage} · v{data.run_id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="PDF로 내보내기"
          >
            <Download size={18} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="공유하기"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadar data={chartData}>
            <PolarGrid strokeDasharray="3 3" />
            <PolarAngleAxis dataKey="axis" />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tickCount={6}
            />
            
            {/* Current Score */}
            <Radar
              name="현재 점수"
              dataKey="current"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
              strokeWidth={2}
            />
            
            {/* Overlays */}
            {showOverlays && selectedOverlay === 'prev' && data.overlays?.prev && (
              <Radar
                name="이전 회차"
                dataKey="prev"
                stroke="#9CA3AF"
                fill="#9CA3AF"
                fillOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}
            
            {showOverlays && selectedOverlay === 'peer_avg' && data.overlays?.peer_avg && (
              <Radar
                name="동종 평균"
                dataKey="peer_avg"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}
            
            {showOverlays && selectedOverlay === 'target' && data.overlays?.target && (
              <Radar
                name="목표치"
                dataKey="target"
                stroke="#F59E0B"
                fill="#F59E0B"
                fillOpacity={0.2}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            )}
            
            <Tooltip 
              content={<CustomTooltip axisScores={data.axis_scores} />}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* Overlay Controls */}
      {showOverlays && data.overlays && (
        <div className="flex items-center justify-center gap-4 mt-4 border-t pt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOverlay === 'prev'}
              onChange={(e) => setSelectedOverlay(e.target.checked ? 'prev' : null)}
              className="rounded"
            />
            이전 회차
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOverlay === 'peer_avg'}
              onChange={(e) => setSelectedOverlay(e.target.checked ? 'peer_avg' : null)}
              className="rounded"
            />
            동종 평균
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selectedOverlay === 'target'}
              onChange={(e) => setSelectedOverlay(e.target.checked ? 'target' : null)}
              className="rounded"
            />
            목표치
          </label>
        </div>
      )}

      {/* Axis Summary */}
      <div className="grid grid-cols-5 gap-4 mt-6">
        {data.axis_scores.map(score => (
          <AxisCard
            key={score.axis}
            score={score}
            onClick={() => onAxisClick?.(score.axis)}
          />
        ))}
      </div>

      {/* Insights Panel */}
      <InsightsPanel data={data} />
    </div>
  );
};

// Axis Summary Card
const AxisCard: React.FC<{
  score: AxisScore;
  onClick?: () => void;
}> = ({ score, onClick }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDeltaIcon = (delta?: number) => {
    if (!delta) return '';
    if (delta > 0) return '↑';
    if (delta < 0) return '↓';
    return '→';
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-shadow p-4 rounded-lg border"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{score.axis}</span>
        {score.flags && score.flags.length > 0 && (
          <span className="text-yellow-500">⚠</span>
        )}
      </div>
      
      <div className={`text-2xl font-bold rounded p-2 text-center ${getScoreColor(score.score)}`}>
        {score.score}
      </div>
      
      {score.delta !== undefined && (
        <div className={`text-sm mt-2 text-center ${score.delta > 0 ? 'text-green-600' : score.delta < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {getDeltaIcon(score.delta)} {Math.abs(score.delta)}
        </div>
      )}
      
      {score.kpi_top && score.kpi_top.length > 0 && (
        <div className="mt-3 space-y-1">
          {score.kpi_top.slice(0, 3).map((kpi, idx) => (
            <div key={kpi.kpi_id} className="text-xs text-gray-600 truncate">
              {idx + 1}. {kpi.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Tooltip
const CustomTooltip: React.FC<any> = ({ active, payload, axisScores }) => {
  if (!active || !payload || !payload[0]) return null;

  const axis = payload[0].payload.axis;
  const score = axisScores.find((s: AxisScore) => s.axis === axis);

  return (
    <div className="bg-white p-3 shadow-lg rounded-lg border">
      <p className="font-medium">{axis} 축</p>
      <p className="text-lg font-bold text-blue-600">{payload[0].value}점</p>
      {score?.kpi_top && score.kpi_top.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          <p className="font-medium">주요 기여 KPI:</p>
          {score.kpi_top.slice(0, 3).map((kpi: any) => (
            <p key={kpi.kpi_id}>• {kpi.name} ({kpi.contrib}%)</p>
          ))}
        </div>
      )}
    </div>
  );
};

// Insights Panel
const InsightsPanel: React.FC<{ data: RadarData }> = ({ data }) => {
  // Calculate insights based on data
  const insights: Array<{ type: string; message: string }> = [];
  
  // Low scores
  data.axis_scores.forEach(score => {
    if (score.score < 40) {
      insights.push({
        type: 'warning',
        message: `${score.axis} 축이 40점 미만입니다. 개선이 필요합니다.`,
      });
    }
  });

  // High improvements
  data.axis_scores.forEach(score => {
    if (score.delta && score.delta >= 10) {
      insights.push({
        type: 'success',
        message: `${score.axis} 축이 전회차 대비 ${score.delta}점 상승했습니다!`,
      });
    }
  });

  if (insights.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <Info size={18} className="text-gray-600" />
        <h3 className="font-medium">주요 인사이트</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 text-sm ${
              insight.type === 'warning' ? 'text-yellow-700' : 
              insight.type === 'success' ? 'text-green-700' : 
              'text-gray-700'
            }`}
          >
            <span>•</span>
            <span>{insight.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};