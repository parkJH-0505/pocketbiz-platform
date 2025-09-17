import type { Core5Scores, Program, TheOneRecommendation, PreparationTask } from '../../types/smartMatching';
import { mockPrograms, filterProgramsByCategory, sortProgramsByDeadline } from './programs';
import { calculateMatchingScore, generateMatchingAnalysis } from './userData';

// 준비 태스크 생성
export const generatePreparationTasks = (program: Program, userScores: Core5Scores): PreparationTask[] => {
  const tasks: PreparationTask[] = [];
  const gaps = {
    GO: program.requiredScores.GO - userScores.GO,
    EC: program.requiredScores.EC - userScores.EC,
    PT: program.requiredScores.PT - userScores.PT,
    PF: program.requiredScores.PF - userScores.PF,
    TO: program.requiredScores.TO - userScores.TO
  };

  // 가장 부족한 영역 찾기
  const weakestAreas = Object.entries(gaps)
    .filter(([_, gap]) => gap > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // 영역별 태스크 생성
  weakestAreas.forEach(([area, gap]) => {
    switch(area) {
      case 'GO':
        tasks.push({
          id: `task-go-${tasks.length}`,
          title: '시장 분석 보고서 작성',
          description: '목표 시장의 규모와 성장성을 분석한 보고서 준비',
          priority: 'high',
          estimatedTime: '3-5일',
          completed: false,
          relatedArea: 'GO'
        });
        break;
      case 'EC':
        tasks.push({
          id: `task-ec-${tasks.length}`,
          title: '실행 계획서 보완',
          description: '구체적인 마일스톤과 KPI가 포함된 실행 계획 수립',
          priority: gap > 15 ? 'high' : 'medium',
          estimatedTime: '2-3일',
          completed: false,
          relatedArea: 'EC'
        });
        break;
      case 'PT':
        tasks.push({
          id: `task-pt-${tasks.length}`,
          title: '기술 명세서 업데이트',
          description: '핵심 기술의 차별성과 경쟁력을 명확히 기술',
          priority: 'medium',
          estimatedTime: '2일',
          completed: false,
          relatedArea: 'PT'
        });
        break;
      case 'PF':
        tasks.push({
          id: `task-pf-${tasks.length}`,
          title: '플랫폼 확장 전략 수립',
          description: '플랫폼 기반 비즈니스 모델 확장 계획 작성',
          priority: gap > 20 ? 'high' : 'low',
          estimatedTime: '3-4일',
          completed: false,
          relatedArea: 'PF'
        });
        break;
      case 'TO':
        tasks.push({
          id: `task-to-${tasks.length}`,
          title: '팀 역량 보강 계획',
          description: '핵심 인재 채용 계획 및 팀 구성 강화 방안',
          priority: 'medium',
          estimatedTime: '1주일',
          completed: false,
          relatedArea: 'TO'
        });
        break;
    }
  });

  // 공통 필수 태스크
  tasks.push({
    id: 'task-common-1',
    title: '사업계획서 최종 검토',
    description: '지원사업 요구사항에 맞춘 사업계획서 완성도 점검',
    priority: 'high',
    estimatedTime: '1-2일',
    completed: false,
    relatedArea: null
  });

  return tasks;
};

// THE ONE 추천 생성
export const generateTheOneRecommendation = (
  userScores: Core5Scores,
  category?: 'government' | 'investment' | 'accelerator' | 'competition'
): TheOneRecommendation => {
  // 카테고리별 필터링 또는 전체 프로그램
  let candidates = category
    ? filterProgramsByCategory(mockPrograms, category)
    : mockPrograms;

  // 매칭 점수 계산 및 정렬
  const programsWithScores = candidates.map(program => ({
    program,
    matchingScore: calculateMatchingScore(userScores, program.requiredScores)
  }));

  // 매칭 점수로 정렬 (높은 순)
  programsWithScores.sort((a, b) => b.matchingScore - a.matchingScore);

  // THE ONE 선택 (최고 매칭)
  const theOne = programsWithScores[0];

  // 대안 추천 (2-4위)
  const alternatives = programsWithScores.slice(1, 4).map(item => item.program);

  // 준비 태스크 생성
  const preparationTasks = generatePreparationTasks(theOne.program, userScores);

  // 매칭 분석 생성
  const matchingAnalysis = generateMatchingAnalysis(
    userScores,
    theOne.program.requiredScores,
    theOne.matchingScore
  );

  return {
    program: theOne.program,
    matchingScore: theOne.matchingScore,
    matchingAnalysis,
    preparationTasks,
    alternativeRecommendations: alternatives,
    userScores,
    requiredScores: theOne.program.requiredScores,
    averageScores: {
      GO: 65,
      EC: 62,
      PT: 68,
      PF: 55,
      TO: 60
    }
  };
};

// Mock THE ONE 추천 데이터
export const mockTheOneRecommendation: TheOneRecommendation = generateTheOneRecommendation(
  {
    GO: 78,
    EC: 82,
    PT: 75,
    PF: 68,
    TO: 73
  }
);

// 전체 프로그램 목록 (All Opportunities용)
export const getAllPrograms = (): Program[] => {
  return sortProgramsByDeadline(mockPrograms);
};

// 필터링된 프로그램 목록
export const getFilteredPrograms = (
  category?: string,
  minAmount?: number,
  maxAmount?: number,
  difficulty?: 'easy' | 'medium' | 'hard'
): Program[] => {
  let filtered = [...mockPrograms];

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (minAmount !== undefined) {
    filtered = filtered.filter(p => {
      const amount = parseInt(p.supportAmount.replace(/[^0-9]/g, ''));
      return amount >= minAmount;
    });
  }

  if (maxAmount !== undefined) {
    filtered = filtered.filter(p => {
      const amount = parseInt(p.supportAmount.replace(/[^0-9]/g, ''));
      return amount <= maxAmount;
    });
  }

  if (difficulty) {
    filtered = filtered.filter(p => p.difficulty === difficulty);
  }

  return sortProgramsByDeadline(filtered);
};