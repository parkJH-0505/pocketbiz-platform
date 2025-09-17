import { useState } from 'react';
import { Square, CheckSquare, Info } from 'lucide-react';
import type { Choice } from '../../utils/csvParser';
import { ScoreIndicator } from '../common/ScoreIndicator';

interface MultiSelectInputProps {
  choices: Choice[];
  selectedIndices?: number[];
  onChange: (value: { selectedIndices: number[] }) => void;
  weight?: string;
}

export const MultiSelectInput: React.FC<MultiSelectInputProps> = ({ 
  choices, 
  selectedIndices = [], 
  onChange,
  weight = 'x1'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    const newIndices = selectedIndices.includes(index)
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index];
    
    onChange({ selectedIndices: newIndices });
  };

  const calculateTotalScore = () => {
    return selectedIndices.reduce((sum, index) => {
      const choice = choices[index];
      return sum + (choice?.weight || 0);
    }, 0);
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 10) return 'text-secondary-main';
    if (weight >= 5) return 'text-accent-orange';
    return 'text-neutral-gray';
  };

  const getWeightBgColor = (weight: number) => {
    if (weight >= 10) return 'bg-secondary-light';
    if (weight >= 5) return 'bg-accent-orange-light';
    return 'bg-neutral-light';
  };

  const totalScore = calculateTotalScore();
  const normalizedScore = Math.min((totalScore / 15) * 100, 100); // 최대 15점 기준 정규화

  return (
    <div className="space-y-3">

      {/* 안내 메시지 */}
      <div className="flex items-start gap-2 p-3 bg-primary-light bg-opacity-20 rounded-lg">
        <Info size={16} className="text-primary-main mt-0.5" />
        <p className="text-sm text-neutral-gray">
          해당되는 항목을 모두 선택하세요. 각 항목별로 가중치가 다르게 적용됩니다.
        </p>
      </div>

      {/* 선택지 목록 */}
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isSelected = selectedIndices.includes(index);
          const isHovered = hoveredIndex === index;
          const isLast = choice.label.includes('해당 없음');
          
          return (
            <button
              key={index}
              onClick={() => handleToggle(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              disabled={isLast && selectedIndices.length > 0 && !isSelected}
              className={`w-full text-left p-4 rounded-lg border transition-all
                ${isSelected 
                  ? 'border-primary-main bg-primary-light bg-opacity-10' 
                  : isHovered
                  ? 'border-primary-hover bg-neutral-light'
                  : 'border-neutral-border hover:border-neutral-gray'
                }
                ${isLast && selectedIndices.length > 0 && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isSelected ? (
                    <CheckSquare size={20} className="text-primary-main" />
                  ) : (
                    <Square size={20} className="text-neutral-lighter" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-medium text-neutral-dark">
                      {choice.label}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 항목 요약 */}
      {selectedIndices.length > 0 && (
        <div className="mt-3 p-4 rounded-lg bg-neutral-light">
          <div className="flex items-center justify-between">
            <span className="text-base text-neutral-gray">선택된 항목</span>
            <span className="text-base font-medium text-neutral-dark">
              {selectedIndices.length}개
            </span>
          </div>
        </div>
      )}
    </div>
  );
};