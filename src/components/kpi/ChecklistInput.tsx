import { Check } from 'lucide-react';
import type { Choice } from '../../utils/csvParser';

interface ChecklistInputProps {
  choices: Choice[];
  selectedIndices?: number[];
  onChange: (value: { selectedIndices: number[] }) => void;
  weight?: string;
}

export const ChecklistInput: React.FC<ChecklistInputProps> = ({ 
  choices, 
  selectedIndices = [], 
  onChange,
  weight = 'x1'
}) => {
  const handleToggle = (index: number) => {
    const newIndices = selectedIndices.includes(index)
      ? selectedIndices.filter(i => i !== index)
      : [...selectedIndices, index];
    onChange({ selectedIndices: newIndices });
  };

  const totalScore = selectedIndices.reduce((sum, idx) => {
    const choice = choices[idx];
    return sum + (choice?.score || 0);
  }, 0);

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

      {/* 체크리스트 항목 */}
      <div className="space-y-2">
        {choices.map((choice, index) => {
          const isChecked = selectedIndices.includes(index);
          
          return (
            <label
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${isChecked 
                  ? 'border-primary-main bg-primary-light bg-opacity-10' 
                  : 'border-neutral-border hover:border-neutral-gray bg-white'
                }`}
            >
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggle(index)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                  ${isChecked 
                    ? 'bg-primary-main border-primary-main' 
                    : 'bg-white border-neutral-border'
                  }`}
                >
                  {isChecked && <Check size={12} className="text-white" />}
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-dark">
                  {choice.label}
                </span>
                <span className={`text-sm font-semibold ${getScoreColor(choice.score)}`}>
                  {choice.score}점
                </span>
              </div>
            </label>
          );
        })}
      </div>

      {/* 총점 표시 */}
      <div className="mt-3 p-3 rounded-lg bg-neutral-light">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-gray">체크된 항목 점수</span>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${getScoreColor(totalScore)}`}>
              {totalScore}점
            </span>
            {weight !== 'x1' && (
              <span className="text-sm text-neutral-gray">
                (가중치 {weight} 적용)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};