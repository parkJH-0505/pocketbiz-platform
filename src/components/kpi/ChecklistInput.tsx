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
              </div>
            </label>
          );
        })}
      </div>

    </div>
  );
};