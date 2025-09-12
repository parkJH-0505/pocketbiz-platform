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
                    <span className={`text-base font-semibold px-2 py-1 rounded ${getWeightBgColor(choice.weight || 0)} ${getWeightColor(choice.weight || 0)}`}>
                      {choice.weight || 0}점
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 항목 요약 */}
      <div className="mt-3 p-4 rounded-lg bg-neutral-light">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-base text-neutral-gray">선택된 항목</span>
            <span className="text-base font-medium text-neutral-dark">
              {selectedIndices.length}개
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-gray">획득 점수</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getWeightColor(totalScore)}`}>
                {totalScore}점
              </span>
              <span className="text-sm text-neutral-gray">
                / 15점
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-gray">정규화 점수</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-main">
                {Math.round(normalizedScore)}점
              </span>
              {weight !== 'x1' && (
                <span className="text-sm text-neutral-gray">
                  (가중치 {weight} 적용)
                </span>
              )}
            </div>
          </div>
          
          {/* ScoreIndicator 추가 */}
          <div className="mt-2">
            <ScoreIndicator score={Math.round(normalizedScore)} size="sm" showBar={true} />
          </div>
        </div>
      </div>
    </div>
  );
};