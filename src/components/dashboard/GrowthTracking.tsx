import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { TrendingUp, TrendingDown, Target, Calendar, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../common/Card';
import { useGrowthTracking } from '../../contexts/GrowthTrackingContext';
import type { AxisKey } from '../../types';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const GrowthChart: React.FC = () => {
  const { metrics, growthRate, predictedNextStageDate } = useGrowthTracking();
  const [selectedAxis, setSelectedAxis] = useState<'overall' | AxisKey>('overall');

  // 차트 데이터 준비
  const chartLabels = metrics.map(m =>
    new Date(m.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  );

  const getChartData = () => {
    if (selectedAxis === 'overall') {
      return metrics.map(m => m.overallScore);
    } else {
      return metrics.map(m => m.axisScores[selectedAxis] || 0);
    }
  };

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: selectedAxis === 'overall' ? '종합 점수' : `${selectedAxis} 점수`,
        data: getChartData(),
        borderColor: 'rgb(15, 82, 222)',
        backgroundColor: 'rgba(15, 82, 222, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y.toFixed(1)}점`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const axisOptions = [
    { value: 'overall', label: '종합' },
    { value: 'GO', label: 'GO' },
    { value: 'EC', label: 'EC' },
    { value: 'PT', label: 'PT' },
    { value: 'PF', label: 'PF' },
    { value: 'TO', label: 'TO' },
  ];

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-dark">성장 추이</h3>
          <div className="flex items-center gap-2">
            <select
              value={selectedAxis}
              onChange={(e) => setSelectedAxis(e.target.value as 'overall' | AxisKey)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1"
            >
              {axisOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-64 mb-4">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-500 mb-1">월간 성장률</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-neutral-dark">
                {growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}점
              </span>
              {growthRate > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : growthRate < 0 ? (
                <TrendingDown className="w-4 h-4 text-red-600" />
              ) : (
                <Minus className="w-4 h-4 text-gray-600" />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">다음 단계 예상</p>
            <p className="text-lg font-bold text-neutral-dark">
              {predictedNextStageDate
                ? predictedNextStageDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                  })
                : '데이터 부족'}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

// 목표 트래킹 컴포넌트
export const GoalTracking: React.FC = () => {
  const { goals, updateGoalProgress } = useGrowthTracking();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDaysLeft = (deadline: Date): number => {
    const today = new Date();
    const diff = deadline.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-neutral-dark">목표 관리</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {goals.slice(0, 3).map(goal => {
            const progress = (goal.currentValue / goal.targetValue) * 100;
            const daysLeft = getDaysLeft(goal.deadline);
            const isOverdue = daysLeft < 0;

            return (
              <div key={goal.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-neutral-dark">{goal.description}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(goal.priority)}`}>
                        {goal.priority === 'high' ? '높음' : goal.priority === 'medium' ? '보통' : '낮음'}
                      </span>
                      <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}일 지연` : `D-${daysLeft}`}
                      </span>
                    </div>
                  </div>
                  <Target className="w-5 h-5 text-primary-main" />
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">진행률</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-primary-main rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>현재: {goal.currentValue.toFixed(1)}</span>
                    <span>목표: {goal.targetValue}</span>
                  </div>
                </div>

                {goal.actionItems.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-gray-700 mb-2">액션 아이템</p>
                    <div className="space-y-1">
                      {goal.actionItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-1 h-1 bg-gray-400 rounded-full" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

// 마일스톤 트래킹 컴포넌트
export const MilestoneTracking: React.FC = () => {
  const { milestones, getTimeInCurrentStage, getProgressToNextStage } = useGrowthTracking();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-blue-600 bg-blue-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-neutral-border/50">
      <CardHeader>
        <h3 className="text-lg font-semibold text-neutral-dark">마일스톤</h3>
      </CardHeader>
      <CardBody>
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-dark">다음 단계 진행률</span>
            <span className="text-sm font-bold text-primary-main">
              {getProgressToNextStage().toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-blue-200 rounded-full">
            <div
              className="h-2 bg-primary-main rounded-full transition-all"
              style={{ width: `${getProgressToNextStage()}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            현재 단계 체류: {getTimeInCurrentStage()}일
          </p>
        </div>

        <div className="space-y-3">
          {milestones.map(milestone => (
            <div
              key={milestone.id}
              className={`p-3 border rounded-lg ${
                milestone.status === 'achieved' ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{milestone.icon || '🎯'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-neutral-dark">{milestone.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(milestone.status)}`}>
                      {milestone.status === 'achieved' ? '달성' : milestone.status === 'pending' ? '진행중' : '지연'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">
                      목표: {milestone.targetScore}점
                    </span>
                    <span className="text-xs text-gray-500">
                      기한: {new Date(milestone.targetDate).toLocaleDateString('ko-KR')}
                    </span>
                    {milestone.achievedDate && (
                      <span className="text-xs text-green-600">
                        달성: {new Date(milestone.achievedDate).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};