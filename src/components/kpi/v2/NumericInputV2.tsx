import { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumericInputV2Props {
  value?: number;
  onChange: (value: { value: number; unit?: string }) => void;
  minMax?: { min: number; max: number };
  unit?: string;
  fieldKey?: string;
}

export const NumericInputV2: React.FC<NumericInputV2Props> = ({ 
  value = 0, 
  onChange, 
  minMax,
  unit = ''
}) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isFocused, setIsFocused] = useState(false);
  
  // 슬라이더 위치 계산
  const getSliderPercentage = () => {
    if (!minMax) return 50;
    const { min, max } = minMax;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    
    const numValue = parseFloat(val);
    if (!isNaN(numValue)) {
      onChange({ value: numValue, unit });
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalValue(val.toString());
    onChange({ value: val, unit });
  };

  const handleIncrement = () => {
    const newValue = value + 1;
    setLocalValue(newValue.toString());
    onChange({ value: newValue, unit });
  };

  const handleDecrement = () => {
    const newValue = value - 1;
    setLocalValue(newValue.toString());
    onChange({ value: newValue, unit });
  };

  return (
    <div className="space-y-4">
      {/* 입력 필드 */}
      <div className={`
        relative rounded-xl transition-all duration-300
        ${isFocused ? 'scale-[1.02]' : ''}
      `}>
        <div className={`
          flex items-center gap-2 p-1 rounded-xl
          bg-white/80 backdrop-blur-sm border
          ${isFocused ? 'border-primary-main shadow-lg shadow-primary-light/20' : 'border-white/30'}
          transition-all duration-300
        `}>
          {/* 감소 버튼 */}
          <button
            onClick={handleDecrement}
            className="p-2 hover:bg-primary-light/20 rounded-lg transition-colors"
          >
            <Minus size={18} className="text-neutral-gray" />
          </button>

          {/* 입력 필드 */}
          <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 px-3 py-2 bg-transparent text-center text-lg font-semibold
              focus:outline-none appearance-none"
            style={{ MozAppearance: 'textfield' }}
          />

          {/* 단위 */}
          {unit && (
            <span className="px-3 text-sm text-neutral-gray font-medium">
              {unit}
            </span>
          )}

          {/* 증가 버튼 */}
          <button
            onClick={handleIncrement}
            className="p-2 hover:bg-primary-light/20 rounded-lg transition-colors"
          >
            <Plus size={18} className="text-neutral-gray" />
          </button>
        </div>
      </div>

      {/* 슬라이더 (minMax가 있을 때만) */}
      {minMax && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="range"
              min={minMax.min}
              max={minMax.max}
              value={value}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gradient-to-r from-accent-red via-accent-orange to-secondary-main
                rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  #10B981 0%, 
                  #10B981 ${getSliderPercentage()}%, 
                  #E5E7EB ${getSliderPercentage()}%, 
                  #E5E7EB 100%)`
              }}
            />
          </div>
          
          {/* 범위 라벨 */}
          <div className="flex justify-between text-xs text-neutral-gray">
            <span>{minMax.min}{unit}</span>
            <span className="font-semibold text-primary-main">
              {Math.round(getSliderPercentage())}%
            </span>
            <span>{minMax.max}{unit}</span>
          </div>
        </div>
      )}
    </div>
  );
};