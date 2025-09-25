import React, { useMemo } from 'react';
import { useKPIDiagnosis } from '../../contexts/KPIDiagnosisContext';
import RadarChart from './RadarChart';
import type { Core5Scores } from '../../types/smartMatching';

interface RadarChartWithDataProps {
  requiredScores?: Core5Scores | null;
  showAverage?: boolean;
  size?: number;
  className?: string;
}

const RadarChartWithData: React.FC<RadarChartWithDataProps> = ({
  requiredScores = null,
  showAverage = true,
  size = 300,
  className = ''
}) => {
  const { axisScores } = useKPIDiagnosis();

  // KPI Context의 axisScores를 Core5Scores 형식으로 변환
  const userScores = useMemo<Core5Scores>(() => {
    // 기본값 설정 (KPI 진단을 아직 안한 경우)
    const defaultScores = {
      GO: 70,
      EC: 75,
      PT: 65,
      PF: 60,
      TO: 72
    };

    // axisScores가 있고 유효한 점수가 있는지 확인
    if (axisScores && Object.keys(axisScores).length > 0) {
      const hasValidScores = Object.values(axisScores).some(score => score > 0);
      if (hasValidScores) {
        return {
          GO: axisScores.GO || 0,
          EC: axisScores.EC || 0,
          PT: axisScores.PT || 0,
          PF: axisScores.PF || 0,
          TO: axisScores.TO || 0
        };
      }
    }

    // 모든 값이 0이거나 데이터가 없으면 기본값 사용
    return defaultScores;
  }, [axisScores]);

  return (
    <RadarChart
      userScores={userScores}
      requiredScores={requiredScores}
      showAverage={showAverage}
      size={size}
      className={className}
    />
  );
};

export default RadarChartWithData;