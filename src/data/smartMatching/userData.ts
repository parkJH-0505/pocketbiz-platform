import type { Core5Scores } from '../../types/smartMatching';

// Mock 사용자 Core5 점수
export const mockUserScores: Core5Scores = {
  GO: 78,  // 성장기회
  EC: 82,  // 실행역량
  PT: 75,  // 제품기술
  PF: 68,  // 플랫폼
  TO: 73   // 팀조직
};

// 매칭 점수 계산 (89% 알고리즘)
export const calculateMatchingScore = (
  userScores: Core5Scores,
  requiredScores: Core5Scores
): number => {
  const weights = {
    GO: 0.25,
    EC: 0.20,
    PT: 0.20,
    PF: 0.15,
    TO: 0.20
  };

  let totalScore = 0;
  let maxPossibleScore = 0;

  Object.keys(userScores).forEach((key) => {
    const axis = key as keyof Core5Scores;
    const userScore = userScores[axis];
    const requiredScore = requiredScores[axis];
    const weight = weights[axis];

    // 사용자 점수가 요구 점수를 충족하면 100%, 아니면 비율 계산
    const matchRatio = userScore >= requiredScore ? 1 : userScore / requiredScore;
    totalScore += matchRatio * weight * 100;
    maxPossibleScore += weight * 100;
  });

  // 최종 점수를 89% 스케일로 조정
  const rawScore = (totalScore / maxPossibleScore) * 100;
  return Math.min(89, Math.round(rawScore * 0.89));
};

// 매칭 분석 생성
export const generateMatchingAnalysis = (
  userScores: Core5Scores,
  requiredScores: Core5Scores,
  matchingScore: number
) => {
  const gaps = {
    GO: requiredScores.GO - userScores.GO,
    EC: requiredScores.EC - userScores.EC,
    PT: requiredScores.PT - userScores.PT,
    PF: requiredScores.PF - userScores.PF,
    TO: requiredScores.TO - userScores.TO
  };

  const strengths = Object.entries(gaps)
    .filter(([_, gap]) => gap <= 0)
    .map(([axis]) => axis);

  const weaknesses = Object.entries(gaps)
    .filter(([_, gap]) => gap > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([axis]) => axis);

  return {
    matchingScore,
    gaps,
    strengths,
    weaknesses,
    recommendation: matchingScore >= 80
      ? '매우 적합한 프로그램입니다.'
      : matchingScore >= 70
      ? '적합한 프로그램이지만 일부 보완이 필요합니다.'
      : '도전적인 프로그램입니다. 충분한 준비가 필요합니다.'
  };
};