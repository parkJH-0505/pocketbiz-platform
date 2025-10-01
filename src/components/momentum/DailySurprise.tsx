import React, { useState, useEffect, useMemo } from 'react';
import { useBuildupContext } from '../../contexts/BuildupContext';
// import { useKPIDiagnosisContext } from '../../contexts/KPIDiagnosisContext'; // TODO: Context export 필요

type SurpriseType = 'discovery' | 'insight' | 'celebration' | 'tip' | 'milestone';

interface SurpriseContent {
  type: SurpriseType;
  title: string;
  message: string;
  emoji: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: number; // 높을수록 우선
}

interface DailySurpriseProps {
  className?: string;
}

// 임시 데이터를 컴포넌트 외부로 이동 (매번 새로 생성되는 것을 방지)
const TEMP_SCORES = { kpi1: 72, kpi2: 85, kpi3: 68 };

const DailySurprise: React.FC<DailySurpriseProps> = ({
  className = ""
}) => {
  const { projects, services } = useBuildupContext();
  // const { scores } = useKPIDiagnosisContext(); // TODO: Context export 필요
  const scores = TEMP_SCORES; // 임시 하드코딩 (안정된 참조)
  const [showDetails, setShowDetails] = useState(false);

  // 서프라이즈 콘텐츠 생성
  const generateSurpriseContent = useMemo((): SurpriseContent[] => {
    const contents: SurpriseContent[] = [];
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));

    // 1. Celebration (가장 높은 우선순위)
    const averageScore = scores && Object.keys(scores).length > 0
      ? Object.values(scores).reduce((sum, score) => sum + (score || 0), 0) / Object.keys(scores).length
      : 0;

    if (averageScore >= 80) {
      contents.push({
        type: 'celebration',
        title: 'Outstanding!',
        message: `KPI 평균 ${Math.round(averageScore)}점 달성! 🎉`,
        emoji: '🏆',
        priority: 100,
        action: {
          label: '성과 보기',
          onClick: () => console.log('Navigate to KPI details')
        }
      });
    }

    // 연속 접속일 체크
    const loginStreak = parseInt(localStorage.getItem('login-streak') || '1');
    if (loginStreak >= 7 && loginStreak % 7 === 0) {
      contents.push({
        type: 'celebration',
        title: `${loginStreak}일 연속!`,
        message: '꾸준함이 성공의 열쇠예요 🔥',
        emoji: '🔥',
        priority: 90
      });
    }

    // 2. Discovery (새로운 발견)
    const potentialServices = services.filter(service => {
      // 추천 서비스 중 아직 확인하지 않은 것들
      return service.target_axis && service.target_axis.length > 0;
    });

    if (potentialServices.length >= 3) {
      contents.push({
        type: 'discovery',
        title: '숨겨진 기회',
        message: `새로운 성장 기회 ${potentialServices.length}개 발견!`,
        emoji: '🔍',
        priority: 70,
        action: {
          label: '확인하기',
          onClick: () => console.log('Navigate to services')
        }
      });
    }

    // 3. Insight (데이터 인사이트)
    const activeProjects = projects.filter(p => p.status === 'in_progress');
    if (activeProjects.length > 0) {
      const progressSum = activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0);
      const avgProgress = progressSum / activeProjects.length;

      if (avgProgress >= 75) {
        contents.push({
          type: 'insight',
          title: '프로젝트 순항 중',
          message: `평균 진행률 ${Math.round(avgProgress)}% 달성!`,
          emoji: '📊',
          priority: 60
        });
      }
    }

    // 4. Milestone (마일스톤)
    const startupDays = dayOfYear; // 임시 계산
    const milestones = [100, 200, 365, 500, 730, 1000];
    const nextMilestone = milestones.find(m => m > startupDays);

    if (nextMilestone && (nextMilestone - startupDays) <= 7) {
      contents.push({
        type: 'milestone',
        title: '마일스톤 임박',
        message: `창업 ${nextMilestone}일까지 ${nextMilestone - startupDays}일!`,
        emoji: '🎯',
        priority: 80
      });
    }

    // 5. Daily Tips (기본 팁)
    const tips = [
      { message: 'KPI는 오전에 입력하면 하루가 더 체계적이에요', emoji: '☀️' },
      { message: '작은 승리도 기록해보세요. 쌓이면 큰 힘이 됩니다', emoji: '📝' },
      { message: '동료 CEO들과의 네트워킹이 성장의 지름길이에요', emoji: '🤝' },
      { message: '데이터 기반 의사결정이 스타트업 성공의 핵심입니다', emoji: '📈' },
      { message: '꾸준함이 재능을 이긴다는 말, 정말 맞아요', emoji: '🌱' }
    ];

    const todayTip = tips[dayOfYear % tips.length];
    contents.push({
      type: 'tip',
      title: '오늘의 팁',
      message: todayTip.message,
      emoji: todayTip.emoji,
      priority: 30
    });

    return contents;
  }, [projects, services, scores]);

  // 최고 우선순위 콘텐츠 선택 - useMemo로 직접 계산 (useEffect 제거)
  const surprise = useMemo(() => {
    const contents = generateSurpriseContent;
    if (contents.length > 0) {
      return contents.reduce((prev, current) =>
        current.priority > prev.priority ? current : prev
      );
    }
    return null;
  }, [generateSurpriseContent]);

  if (!surprise) {
    return (
      <div className={`text-gray-400 text-sm ${className}`}>
        <span>🌟 오늘의 발견</span>
      </div>
    );
  }

  const typeStyles = {
    discovery: 'bg-blue-100 text-blue-800 border-blue-200',
    insight: 'bg-purple-100 text-purple-800 border-purple-200',
    celebration: 'bg-orange-100 text-orange-800 border-orange-200',
    tip: 'bg-green-100 text-green-800 border-green-200',
    milestone: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center space-x-2 cursor-pointer group"
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="text-lg">{surprise.emoji}</span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">
            {surprise.title}
          </div>
          <div className="text-xs text-gray-600 truncate">
            {surprise.message}
          </div>
        </div>

        {/* 펼치기 아이콘 */}
        <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 상세 정보 패널 */}
      {showDetails && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className={`p-4 rounded-t-lg border-l-4 ${typeStyles[surprise.type]}`}>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{surprise.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{surprise.title}</h3>
                <p className="text-sm mt-1 leading-relaxed">{surprise.message}</p>

                {surprise.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      surprise.action!.onClick();
                      setShowDetails(false);
                    }}
                    className="mt-3 px-3 py-1.5 bg-white/50 hover:bg-white/80 rounded-md text-sm font-medium transition-colors"
                  >
                    {surprise.action.label}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 다른 서프라이즈 미리보기 */}
          {generateSurpriseContent.length > 1 && (
            <div className="p-3 border-t bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500 mb-2">다른 소식들</div>
              <div className="space-y-1">
                {generateSurpriseContent
                  .filter(content => content.type !== surprise.type)
                  .slice(0, 2)
                  .map((content, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                      <span>{content.emoji}</span>
                      <span className="truncate">{content.message}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-2 right-2 w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 배경 클릭 시 닫기 */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </div>
  );
};

export default DailySurprise;