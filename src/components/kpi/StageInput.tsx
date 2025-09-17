import { useState } from 'react';
import { Check, Circle } from 'lucide-react';

interface StageInputProps {
  stages: { value: string; label: string; description?: string }[];
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelect = (index: number, stage: any) => {
    onChange({ stage: stage.value, score: 0 }); // score는 내부에서 계산
  };

  return (
    <div className="space-y-3">
      {/* 선택지 목록 */}
      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isSelected = selectedStage === stage.value;
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={index}
              onClick={() => handleSelect(index, stage)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`w-full text-left p-4 rounded-lg border transition-all
                ${isSelected
                  ? 'border-primary-main bg-primary-light bg-opacity-10'
                  : isHovered
                  ? 'border-primary-hover bg-neutral-light'
                  : 'border-neutral-border hover:border-neutral-gray'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-primary-main flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  ) : (
                    <Circle size={20} className="text-neutral-lighter" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-base font-medium text-neutral-dark">
                        {stage.label}
                      </span>
                      {stage.description && (
                        <p className="text-sm text-neutral-gray mt-1">
                          {stage.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};