import { Check } from 'lucide-react';
import type { Choice } from '../../../utils/csvParser';

interface ChecklistInputV2Props {
  choices: Choice[];
  selectedIndices?: number[];
  onChange: (value: { selectedIndices: number[] }) => void;
  weight?: string;
}

export const ChecklistInputV2: React.FC<ChecklistInputV2Props> = ({ 
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

  const maxScore = choices.reduce((sum, choice) => sum + choice.score, 0);
  const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* 가중치 배지 */}
      {weight && weight !== 'x1' && (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary-light/20 rounded-full">
          <span className="text-xs text-primary-main font-medium">가중치 {weight}</span>
        </div>
      )}

      {/* 체크리스트 항목 */}
      <div className="space-y-1.5">
        {choices.map((choice, index) => {
          const isChecked = selectedIndices.includes(index);
          
          return (
            <label
              key={index}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all
                ${isChecked 
                  ? 'bg-primary-main/5 border border-primary-main/20' 
                  : 'bg-white hover:bg-neutral-light border border-transparent'
                }`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors
                ${isChecked 
                  ? 'bg-primary-main' 
                  : 'bg-white border-2 border-neutral-border'
                }`}
              >
                {isChecked && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              
              <span className={`flex-1 text-sm ${isChecked ? 'font-medium' : ''}`}>
                {choice.label}
              </span>
              
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded
                ${isChecked 
                  ? 'bg-primary-main/10 text-primary-main' 
                  : 'text-neutral-gray'
                }`}
              >
                {choice.score}점
              </span>
            </label>
          );
        })}
      </div>

      {/* 점수 요약 */}
      <div className="flex items-center justify-between pt-2 border-t border-neutral-border">
        <span className="text-xs text-neutral-gray">
          {selectedIndices.length}/{choices.length} 항목 선택
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-gray">총점</span>
            <span className="text-sm font-bold text-primary-main">
              {totalScore}/{maxScore}
            </span>
          </div>
          <div className="w-16 h-1.5 bg-neutral-lighter rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-main transition-all duration-300"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};