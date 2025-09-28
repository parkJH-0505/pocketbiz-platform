import React, { useState, useEffect, useMemo } from 'react';
import { useBuildupContext } from '../../contexts/BuildupContext';
import { useKPIDiagnosisContext } from '../../contexts/KPIDiagnosisContext';

interface PersonalGreetingProps {
  userName?: string;
}

type MoodType = 'energetic' | 'calm' | 'focused' | 'celebratory';

interface GreetingMessage {
  main: string;
  sub?: string;
  mood: MoodType;
  emoji: string;
}

const PersonalGreeting: React.FC<PersonalGreetingProps> = ({
  userName = "대표님"
}) => {
  const { projects } = useBuildupContext();
  const { scores } = useKPIDiagnosisContext();
  const [startupDays, setStartupDays] = useState<number>(0);

  // 창업일수 계산 (임시로 로컬스토리지 사용)
  useEffect(() => {
    const calculateStartupDays = () => {
      const savedStartDate = localStorage.getItem('startup-start-date');
      const startDate = savedStartDate
        ? new Date(savedStartDate)
        : new Date('2024-02-01'); // 기본값

      const today = new Date();
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      setStartupDays(diffDays);
    };

    calculateStartupDays();
  }, []);

  // 메시지 생성 로직
  const greetingMessage = useMemo((): GreetingMessage => {
    const hour = new Date().getHours();
    const isWeekend = [0, 6].includes(new Date().getDay());

    // 현재 상황 분석
    const recentProjects = projects.filter(p => p.status === 'in_progress').length;
    const averageScore = scores && Object.keys(scores).length > 0
      ? Math.round(Object.values(scores).reduce((sum, score) => sum + (score || 0), 0) / Object.keys(scores).length)
      : 0;

    // 시간대별 기본 인사
    const timeGreeting = hour < 12
      ? "좋은 아침이에요!"
      : hour < 18
        ? "오후에도 화이팅이에요!"
        : "오늘 하루도 수고하셨어요!";

    // 상황별 메시지 생성
    if (averageScore >= 80) {
      return {
        main: `${userName}, 현재 기세가 정말 좋아요!`,
        sub: `창업 ${startupDays}일째, 이 속도라면 목표 달성이 곧이에요`,
        mood: 'celebratory',
        emoji: '🚀'
      };
    }

    if (recentProjects >= 3) {
      return {
        main: `${userName}, ${timeGreeting}`,
        sub: `진행중인 프로젝트 ${recentProjects}개가 탄력받고 있네요`,
        mood: 'energetic',
        emoji: '💪'
      };
    }

    if (averageScore >= 60) {
      return {
        main: `${userName}, 꾸준히 성장하고 계시네요`,
        sub: `창업 ${startupDays}일째, 한 걸음씩 전진 중이에요`,
        mood: 'focused',
        emoji: '📈'
      };
    }

    if (isWeekend) {
      return {
        main: `${userName}, 주말에도 고생이 많으세요`,
        sub: `휴식도 성장의 일부라는 걸 잊지 마세요`,
        mood: 'calm',
        emoji: '🌱'
      };
    }

    // 기본 격려 메시지
    return {
      main: `${userName}, ${timeGreeting}`,
      sub: `오늘도 작은 것부터 차근차근 시작해볼까요?`,
      mood: 'calm',
      emoji: '☀️'
    };
  }, [userName, projects, scores, startupDays]);

  const moodStyles = {
    energetic: 'text-blue-700',
    calm: 'text-green-700',
    focused: 'text-purple-700',
    celebratory: 'text-orange-700'
  };

  return (
    <div className="flex items-center space-x-3">
      <span className="text-lg">{greetingMessage.emoji}</span>
      <div className="min-w-0">
        <div className={`font-medium text-sm ${moodStyles[greetingMessage.mood]} truncate`}>
          {greetingMessage.main}
        </div>
        {greetingMessage.sub && (
          <div className="text-xs text-gray-600 truncate">
            {greetingMessage.sub}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalGreeting;