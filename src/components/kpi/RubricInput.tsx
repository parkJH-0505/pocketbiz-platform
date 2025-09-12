import { useState } from 'react';
import { Check, Circle } from 'lucide-react';
import type { Choice } from '../../utils/csvParser';
import { ScoreIndicator } from '../common/ScoreIndicator';

interface RubricInputProps {
  choices: Choice[];
  selectedIndex?: number;
  onChange: (value: { selectedIndex: number }) => void;
  weight?: string;
}

export const RubricInput: React.FC<RubricInputProps> = ({ 
  choices, 
  selectedIndex, 
  onChange,
  weight = 'x1'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    onChange({ selectedIndex: index });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-secondary-main';
    if (score >= 50) return 'text-accent-orange';
    if (score >= 25) return 'text-accent-red';
    return 'text-neutral-gray';
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

      {/* 선택지 목록 */}
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isSelected = selectedIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
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
                    <span className="text-base font-medium text-neutral-dark">
                      {choice.label}
                    </span>
                    <span className={`text-base font-semibold ${getScoreColor(choice.score)}`}>
                      {choice.score}점                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 점수 표시 */}
      {selectedIndex !== undefined && choices[selectedIndex] && (
        <div className="mt-3 p-3 rounded-lg bg-neutral-light">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-gray">선택된 점수</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getScoreColor(choices[selectedIndex].score)}`}>
                  {choices[selectedIndex].score}점              </span>
                {weight !== 'x1' && (
                  <span className="text-sm text-neutral-gray">
                    (가중치 {weight} 적용)
                  </span>
                )}
              </div>
            </div>
            {/* ScoreIndicator 추가 */}
            <ScoreIndicator score={choices[selectedIndex].score} size="sm" showBar={true} />
          </div>
        </div>
      )}
    </div>
  );
};
