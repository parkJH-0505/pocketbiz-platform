import React from 'react';
import PersonalGreeting from './PersonalGreeting';
import MomentumIndicator from './MomentumIndicator';
import DailySurprise from './DailySurprise';

interface AmbientStatusBarProps {
  className?: string;
}

const AmbientStatusBar: React.FC<AmbientStatusBarProps> = ({
  className = ""
}) => {
  return (
    <div className={`w-full h-12 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100/50 ${className}`}>
      <div className="flex items-center justify-between px-6 h-full max-w-7xl mx-auto">
        {/* 좌측: 개인화 인사 */}
        <div className="flex-1 min-w-0">
          <PersonalGreeting />
        </div>

        {/* 중앙: 모멘텀 인디케이터 */}
        <div className="flex-shrink-0 mx-8">
          <MomentumIndicator />
        </div>

        {/* 우측: 일일 서프라이즈 */}
        <div className="flex-1 min-w-0 flex justify-end">
          <DailySurprise />
        </div>
      </div>
    </div>
  );
};

export default AmbientStatusBar;