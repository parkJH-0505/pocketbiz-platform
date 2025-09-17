import type { Core5Scores, Program, PreparationTask } from './types';

// 타입 가드 함수들 - 런타임에서 타입 체크
export const isCore5Scores = (obj: any): obj is Core5Scores => {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.GO === 'number' &&
    typeof obj.EC === 'number' &&
    typeof obj.PT === 'number' &&
    typeof obj.PF === 'number' &&
    typeof obj.TO === 'number';
};

export const isProgram = (obj: any): obj is Program => {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    isCore5Scores(obj.requiredScores);
};

export const isPreparationTask = (obj: any): obj is PreparationTask => {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.completed === 'boolean';
};

// 기본값 생성 함수들
export const createDefaultCore5Scores = (): Core5Scores => ({
  GO: 70,
  EC: 75,
  PT: 65,
  PF: 60,
  TO: 72
});

export const createEmptyCore5Scores = (): Core5Scores => ({
  GO: 0,
  EC: 0,
  PT: 0,
  PF: 0,
  TO: 0
});