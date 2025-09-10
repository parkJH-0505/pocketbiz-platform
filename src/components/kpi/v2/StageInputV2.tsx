import { TrendingUp, Award } from 'lucide-react';

interface StageOption {
  value: string;
  label: string;
  description: string;
  score: number;
}

interface StageInputV2Props {
  stages: StageOption[];
  selectedStage?: string;
  onChange: (value: { stage: string; score: number }) => void;
  weight?: string;
}

export const StageInputV2: React.FC<StageInputV2Props> = ({ 
  stages, 
  selectedStage = '', 
  onChange,
  weight 
}) => {
  const handleSelect = (stage: StageOption) => {
    onChange({ stage: stage.value, score: stage.score });
  };

  // 진행 단계 계산
  const selectedIndex = stages.findIndex(s => s.value === selectedStage);
  const progressPercentage = selectedIndex >= 0 
    ? ((selectedIndex + 1) / stages.length) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* 진행 상태 바 */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-primary-light/10 to-secondary-light/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-primary-main" />
            <span className="text-sm font-medium text-neutral-dark">
              현재 단계
            </span>
          </div>
          {selectedIndex >= 0 && (
            <span className="text-sm font-bold text-primary-main">
              {stages[selectedIndex].score}점
            </span>
          )}
        </div>
        <div className="h-2 bg-neutral-light/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-light to-primary-main
              transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 단계 선택 카드들 */}
      <div className="relative">
        {/* 연결선 */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-neutral-border" />
        
        <div className="space-y-3">
          {stages.map((stage, idx) => {
            const isSelected = selectedStage === stage.value;
            const isPassed = selectedIndex >= idx;
            
            return (
              <button
                key={stage.value}
                onClick={() => handleSelect(stage)}
                className={`
                  relative w-full text-left p-4 pl-14 rounded-xl transition-all duration-300
                  backdrop-blur-sm border
                  ${isSelected ? 
                    'bg-white/90 border-primary-main shadow-lg scale-[1.02]' : 
                    isPassed ?
                    'bg-secondary-light/20 border-secondary-light' :
                    'bg-white/60 border-white/30 hover:bg-white/80 hover:border-primary-light hover:shadow-md'}
                `}
              >
                {/* 단계 인디케이터 */}
                <div className={`
                  absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                  transition-all duration-300 z-10
                  ${isSelected ? 
                    'bg-primary-main ring-4 ring-primary-light/30' : 
                    isPassed ?
                    'bg-secondary-main' :
                    'bg-white border-2 border-neutral-border'}
                `}>
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full bg-primary-main animate-ping" />
                  )}
                </div>
                
                {/* 컨텐츠 */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`
                        text-sm font-semibold transition-colors
                        ${isSelected ? 'text-neutral-dark' : 'text-neutral-gray'}
                      `}>
                        {stage.label}
                      </h4>
                      {isSelected && (
                        <Award size={16} className="text-primary-main animate-slide-up" />
                      )}
                    </div>
                    <p className="text-xs text-neutral-gray">
                      {stage.description}
                    </p>
                  </div>
                  
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-bold
                    ${isSelected ? 
                      'bg-primary-main text-white' : 
                      'bg-neutral-light text-neutral-gray'}
                    transition-all duration-300
                  `}>
                    {stage.score}점
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};