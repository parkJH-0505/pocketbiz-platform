/**
 * Radar Chart Component
 * 5축 레이더 차트 시각화
 */

import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface RadarDataPoint {
  axis: string;
  value: number;
  fullMark: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  compareData?: RadarDataPoint[];
  thirdData?: RadarDataPoint[];
  showComparison?: boolean;
  height?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  compareData,
  thirdData,
  showComparison = false,
  height = 320
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsRadarChart data={data}>
        <PolarGrid 
          gridType="polygon" 
          stroke="#e5e7eb"
          radialLines={true}
        />
        <PolarAngleAxis 
          dataKey="axis" 
          tick={{ fontSize: 12 }}
          className="text-neutral-gray"
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tick={{ fontSize: 10 }}
          tickCount={6}
        />
        
        {/* Main data */}
        <Radar 
          name="우리 회사" 
          dataKey="value" 
          stroke="#6366f1" 
          fill="#6366f1" 
          fillOpacity={0.3}
          strokeWidth={2}
        />
        
        {/* Comparison data */}
        {showComparison && compareData && (
          <Radar 
            name="피어 평균" 
            dataKey="value" 
            data={compareData}
            stroke="#9ca3af" 
            fill="#9ca3af" 
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        )}
        
        {/* Third data (e.g., top 10%) */}
        {showComparison && thirdData && (
          <Radar 
            name="상위 10%" 
            dataKey="value" 
            data={thirdData}
            stroke="#10b981" 
            fill="#10b981" 
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        )}
        
        <Tooltip 
          formatter={(value: number) => `${value.toFixed(1)}점`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '8px'
          }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
};