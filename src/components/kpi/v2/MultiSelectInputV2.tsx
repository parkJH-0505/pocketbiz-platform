import { Check, Plus } from 'lucide-react';

interface Choice {
  index: number;
  label: string;
  score: number;
}

interface MultiSelectInputV2Props {
  choices: Choice[];
  selectedIndices: number[];
  onChange: (value: { selectedIndices: number[] }) => void;
  weight?: string;
}

export const MultiSelectInputV2: React.FC<MultiSelectInputV2Props> = ({ 
  choices, 
  selectedIndices = [], 
  onChange,
  weight 
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

  // 가중치에 따른 색상
  const getWeightColor = () => {
    switch(weight) {
      case 'x3': return 'from-accent-red/10 to-transparent';
      case 'x2': return 'from-accent-orange/10 to-transparent';
      default: return 'from-primary-light/10 to-transparent';
    }
  };

  return (
    <div className="space-y-4">
      {/* 선택된 항목 수와 총점 */}
      <div className="flex items-center justify-between p-3 rounded-xl
        bg-gradient-to-r from-primary-light/10 to-secondary-light/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-dark">
            선택된 항목
          </span>
          <span className="px-2 py-0.5 bg-primary-main/10 text-primary-main text-xs font-bold rounded-full">
            {selectedIndices.length}개
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-gray">총점:</span>
          <span className="text-lg font-bold text-primary-main">
            {totalScore}점
          </span>
        </div>
      </div>

      {/* 선택 카드들 */}
      <div className="grid gap-2">
        {choices.map((choice, idx) => {
          const isSelected = selectedIndices.includes(idx);
          
          return (
            <button
              key={idx}
              onClick={() => handleToggle(idx)}
              className={`
                relative group text-left p-3 rounded-xl transition-all duration-300
                backdrop-blur-sm border overflow-hidden
                ${isSelected ? 
                  'bg-white/90 border-primary-main shadow-md' : 
                  'bg-white/60 border-white/30 hover:bg-white/80 hover:border-primary-light'}
              `}
            >
              {/* 배경 그라데이션 */}
              <div className={`
                absolute inset-0 bg-gradient-to-r ${getWeightColor()}
                transition-opacity duration-300
                ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
              `} />
              
              {/* 컨텐츠 */}
              <div className="relative flex items-center gap-3">
                {/* 체크박스 */}
                <div className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center
                  transition-all duration-300
                  ${isSelected ? 
                    'bg-primary-main border-primary-main' : 
                    'bg-white/50 border-neutral-border group-hover:border-primary-light'}
                `}>
                  {isSelected ? (
                    <Check size={12} className="text-white animate-check" />
                  ) : (
                    <Plus size={12} className="text-neutral-gray opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                
                {/* 라벨 */}
                <p className={`
                  flex-1 text-sm transition-colors
                  ${isSelected ? 'text-neutral-dark font-medium' : 'text-neutral-gray'}
                `}>
                  {choice.label}
                </p>
                
                {/* 점수 */}
                <span className={`
                  px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-300
                  ${isSelected ? 
                    'bg-primary-main/20 text-primary-main' : 
                    'bg-neutral-light text-neutral-gray'}
                `}>
                  +{choice.score}점
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 점수 프로그레스 바 */}
      <div className="p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-gray">달성도</span>
          <span className="text-xs font-semibold text-primary-main">
            {Math.min(totalScore, 100)}%
          </span>
        </div>
        <div className="h-2 bg-neutral-light rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-light to-primary-main
              transition-all duration-500 ease-out"
            style={{ width: `${Math.min(totalScore, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};