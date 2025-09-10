import { Check } from 'lucide-react';

interface Choice {
  index: number;
  label: string;
  score: number;
}

interface RubricInputV2Props {
  choices: Choice[];
  selectedIndex?: number;
  onChange: (value: { selectedIndex: number }) => void;
  weight?: string;
}

export const RubricInputV2: React.FC<RubricInputV2Props> = ({ 
  choices, 
  selectedIndex = -1, 
  onChange,
  weight 
}) => {
  const handleSelect = (index: number) => {
    onChange({ selectedIndex: index });
  };

  // 가중치에 따른 색상 계산
  const getWeightColor = () => {
    switch(weight) {
      case 'x3': return 'from-accent-red/20 to-accent-red/5';
      case 'x2': return 'from-accent-orange/20 to-accent-orange/5';
      default: return 'from-primary-light/20 to-primary-light/5';
    }
  };

  return (
    <div className="grid gap-3">
      {choices.map((choice, idx) => {
        const isSelected = selectedIndex === idx;
        const scorePercentage = (choice.score / 100) * 100;
        
        return (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`
              relative group text-left p-4 rounded-xl transition-all duration-300
              backdrop-blur-sm border overflow-hidden
              ${isSelected ? 
                'bg-white/90 border-primary-main shadow-lg scale-[1.02]' : 
                'bg-white/60 border-white/30 hover:bg-white/80 hover:border-primary-light hover:shadow-md'}
            `}
          >
            {/* 배경 그라데이션 */}
            <div className={`
              absolute inset-0 bg-gradient-to-r ${getWeightColor()}
              transition-opacity duration-300
              ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
            `} />
            
            {/* 점수 바 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-light/30">
              <div 
                className={`
                  h-full transition-all duration-500 ease-out
                  ${isSelected ? 'bg-primary-main' : 'bg-neutral-border'}
                `}
                style={{ width: `${scorePercentage}%` }}
              />
            </div>
            
            {/* 컨텐츠 */}
            <div className="relative flex items-start justify-between">
              <div className="flex-1 pr-4">
                <p className={`
                  text-sm font-medium transition-colors
                  ${isSelected ? 'text-neutral-dark' : 'text-neutral-gray'}
                `}>
                  {choice.label}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`
                  text-xs font-bold px-2 py-1 rounded-full
                  ${isSelected ? 
                    'bg-primary-main text-white' : 
                    'bg-neutral-light text-neutral-gray'}
                  transition-all duration-300
                `}>
                  {choice.score}점
                </span>
                
                {isSelected && (
                  <div className="w-5 h-5 bg-primary-main rounded-full flex items-center justify-center
                    animate-slide-up">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};