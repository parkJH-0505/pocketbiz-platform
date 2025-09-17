import React, { useState } from 'react';
import { Code2, Eye, EyeOff, Bug, Database, Calculator } from 'lucide-react';
import type { KPIDefinition } from '../../types';
import type { StageRule } from '../../utils/csvParser';

interface DevDebugPanelProps {
  kpi: KPIDefinition;
  stageRule?: StageRule;
  currentValue?: any;
  calculatedScore?: number;
  className?: string;
}

// 개발/기획 단계에서만 표시되는 디버그 정보
export const DevDebugPanel: React.FC<DevDebugPanelProps> = ({
  kpi,
  stageRule,
  currentValue,
  calculatedScore,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  // 프로덕션에서는 완전히 숨김
  const isDev = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEBUG === 'true';
  if (!isDev) return null;

  const debugInfo = {
    // 비즈니스 로직
    weight: stageRule?.weight || 'x1',
    rawScore: calculatedScore || 0,
    normalizedScore: calculatedScore ? Math.round(calculatedScore * 100) / 100 : 0,
    
    // 메타데이터
    kpiId: kpi.kpi_id,
    inputType: kpi.input_type,
    formula: kpi.formula,
    axis: kpi.axis,
    
    // 선택지 정보
    choices: stageRule?.choices?.map(choice => ({
      label: choice.label,
      score: choice.score,
      index: choice.index
    })),
    
    // 현재 상태
    currentValue: JSON.stringify(currentValue, null, 2),
    stageApplicable: !!stageRule
  };

  return (
    <div className={`relative ${className}`}>
      {/* 디버그 트리거 아이콘 */}
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="opacity-20 hover:opacity-100 transition-opacity duration-200 p-1 rounded"
        title="개발자 디버그 정보"
      >
        <Code2 size={14} className="text-purple-600" />
      </button>

      {/* 디버그 정보 패널 */}
      {isVisible && (
        <div className="absolute right-0 top-6 z-[999] w-80 max-h-96 overflow-y-auto
          bg-gray-900 text-green-400 rounded-lg shadow-2xl border border-gray-700
          font-mono text-xs p-4 animate-fade-in">
          
          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
            <Bug size={16} className="text-purple-400" />
            <span className="text-purple-400 font-semibold">KPI Debug Panel</span>
          </div>

          {/* 비즈니스 로직 */}
          <div className="space-y-3">
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1 flex items-center gap-1">
                <Calculator size={12} />
                비즈니스 로직
              </h4>
              <div className="bg-gray-800 p-2 rounded space-y-1">
                <div>가중치: <span className="text-red-400">{debugInfo.weight}</span></div>
                <div>원점수: <span className="text-blue-400">{debugInfo.rawScore}</span></div>
                <div>정규화: <span className="text-green-400">{debugInfo.normalizedScore}</span></div>
                <div>축: <span className="text-purple-400">{debugInfo.axis}</span></div>
              </div>
            </div>

            {/* 메타데이터 */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1 flex items-center gap-1">
                <Database size={12} />
                메타데이터
              </h4>
              <div className="bg-gray-800 p-2 rounded space-y-1">
                <div>KPI ID: <span className="text-cyan-400">{debugInfo.kpiId}</span></div>
                <div>타입: <span className="text-orange-400">{debugInfo.inputType}</span></div>
                <div>적용가능: <span className={debugInfo.stageApplicable ? 'text-green-400' : 'text-red-400'}>
                  {debugInfo.stageApplicable ? 'YES' : 'NO'}
                </span></div>
              </div>
            </div>

            {/* 계산식 */}
            {debugInfo.formula && (
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">계산식</h4>
                <div className="bg-gray-800 p-2 rounded text-xs">
                  <code className="text-cyan-300">{debugInfo.formula}</code>
                </div>
              </div>
            )}

            {/* 선택지 정보 */}
            {debugInfo.choices && debugInfo.choices.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-semibold mb-1">선택지 점수표</h4>
                <div className="bg-gray-800 p-2 rounded space-y-1 max-h-24 overflow-y-auto">
                  {debugInfo.choices.map((choice, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="text-gray-400">[{choice.index}]</span>{' '}
                      <span className="text-white">{choice.label}</span>{' '}
                      <span className="text-green-400">→ {choice.score}점</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 현재 값 */}
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1">현재 입력값</h4>
              <div className="bg-gray-800 p-2 rounded">
                <pre className="text-xs text-cyan-300 whitespace-pre-wrap">
                  {debugInfo.currentValue}
                </pre>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="mt-3 pt-2 border-t border-gray-700 text-center">
            <span className="text-gray-500 text-xs">개발용 - 프로덕션에서 숨겨짐</span>
          </div>
        </div>
      )}
    </div>
  );
};