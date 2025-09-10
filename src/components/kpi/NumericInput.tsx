import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { ScoreIndicator } from '../common/ScoreIndicator';

interface NumericInputProps {
  value?: number;
  onChange: (value: { value: number; unit?: string }) => void;
  minMax?: { min: number; max: number; minScore: number; maxScore: number };
  unit?: string;
  placeholder?: string;

}

export const NumericInput: React.FC<NumericInputProps> = ({ 
  value, 
  onChange, 
  minMax,
  unit = '',
  placeholder = '숫자를 입력하세요'
}) => {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (!newValue) {
      setError(null);
      return;
    }

    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      setError('유효한 숫자를 입력하세요');
      return;
    }

    setError(null);
    onChange({ value: numValue, unit });
  };

  const getHelpText = () => {
    if (!minMax) return null;
    
    return (
      <div className="text-xs text-neutral-gray mt-1">
        <span>0점: {minMax.min.toLocaleString()}{unit} 미만</span>
        <span className="mx-2">|</span>
        <span>100점: {minMax.max.toLocaleString()}{unit} 이상</span>
      </div>
    );
  };

  // 점수 계산 (minMax가 있을 경우)
  const calculateScore = () => {
    if (!minMax || !value) return null;
    
    const { min, max, minScore, maxScore } = minMax;
    if (value <= min) return minScore;
    if (value >= max) return maxScore;
    
    // 선형 보간
    const ratio = (value - min) / (max - min);
    return Math.round(minScore + ratio * (maxScore - minScore));
  };

  const score = calculateScore();

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2 border rounded-lg text-sm transition-all
            ${error 
              ? 'border-accent-red focus:border-accent-red' 
              : 'border-neutral-border focus:border-primary-main'
            } focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-opacity-50`}
        />
        {unit && (
          <span className="flex items-center px-3 text-sm text-neutral-gray bg-neutral-light rounded-lg">
            {unit}
          </span>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-1 text-xs text-accent-red">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
      
      {/* 점수 표시 */}
      {score !== null && (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
          <ScoreIndicator score={score} size="sm" />
        </div>
      )}
      
      {getHelpText()}
    </div>
  );
};
