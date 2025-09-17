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

    </div>
  );
};
