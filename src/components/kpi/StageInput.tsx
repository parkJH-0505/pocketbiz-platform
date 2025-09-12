import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface StageOption {
  value: string;
  label: string;
  description?: string;
  score: number;
}

interface StageInputProps {
  stages: StageOption[];
  selectedStage?: string;
  onChange: (value: { stage: string; score: number }) => void;
  weight?: string;
}

export const StageInput: React.FC<StageInputProps> = ({ 
  stages, 
  selectedStage, 
  onChange,
  weight = 'x1'
}) => {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const handleSelect = (stage: StageOption) => {
    onChange({ stage: stage.value, score: stage.score });
  };

  const getStageColor = (index: number, isSelected: boolean) => {
    if (!isSelected) return 'border-neutral-border text-neutral-gray';
    
    const colors = [
      'border-accent-red text-accent-red',
      'border-accent-orange text-accent-orange',
      'border-primary-main text-primary-main',
      'border-secondary-main text-secondary-main'
    ];
    
    return colors[index] || colors[0];
  };

  const getStageIcon = (index: number) => {
    const icons = ['🌱', '🚀', '📈', '🎯'];
    return icons[index] || '📊';
  };

  return (
    <div className="space-y-3">
      {/* 가중치 표시 */}
      {weight && weight !== 'x1' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-gray">가중치</span>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            weight === 'x3' ? 'bg-accent-red-light text-accent-red' :
            weight === 'x2' ? 'bg-accent-orange-light text-accent-orange' :
            'bg-neutral-light text-neutral-gray'
          }`}>
            {weight}
          </span>
        </div>
      )}

      {/* Stage 카드 */}
      <div className="grid grid-cols-2 gap-3">
        {stages.map((stage, index) => {
          const isSelected = selectedStage === stage.value;
          const isHovered = hoveredStage === stage.value;
          
          return (
            <button
              key={stage.value}
              onClick={() => handleSelect(stage)}
              onMouseEnter={() => setHoveredStage(stage.value)}
              onMouseLeave={() => setHoveredStage(null)}
              className={`p-4 rounded-lg border-2 text-left transition-all
                ${isSelected 
                  ? `${getStageColor(index, true)} bg-opacity-5` 
                  : isHovered
                  ? 'border-primary-hover bg-neutral-light'
                  : 'border-neutral-border hover:border-neutral-gray'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-dark">
                  {stage.label}
                </span>
                <span className={`text-sm font-bold ${
                  isSelected ? getStageColor(index, true).split(' ')[1] : 'text-neutral-gray'
                }`}>
                  {stage.score}점                </span>
              </div>
              {stage.description && (
                <p className="text-xs text-neutral-gray">
                  {stage.description}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* 선택된 Stage 정보 */}
      {selectedStage && (
        <div className="mt-3 p-4 rounded-lg bg-neutral-light">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-neutral-gray">현재 단계</span>
              <p className="text-base font-semibold text-neutral-dark mt-1">
                {stages.find(s => s.value === selectedStage)?.label}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-neutral-gray">획득 점수</span>
              <p className="text-2xl font-bold text-primary-main mt-1">
                {stages.find(s => s.value === selectedStage)?.score}점                {weight !== 'x1' && (
                  <span className="text-sm text-neutral-gray ml-1">
                    ({weight})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
