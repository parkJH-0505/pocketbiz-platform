/**
 * migrationValidator.ts
 *
 * 마이그레이션 유효성 검증 유틸리티
 * Unknown projectId 문제 방지 및 안전한 마이그레이션 보장
 */

import type { Project } from '../types/buildup.types';
import type { Meeting } from '../types/buildup.types';

/**
 * 마이그레이션 검증 결과
 */
export interface MigrationValidation {
  canMigrate: boolean;
  reason?: string;
  requirements?: string[];
  validProjectId?: string;
}

/**
 * 마이그레이션 전제 조건 검증
 */
export function validateMigrationPrerequisites(
  projects: Project[],
  meetings: Meeting[]
): MigrationValidation {
  // 1. 프로젝트 존재 여부 체크
  if (!projects || projects.length === 0) {
    return {
      canMigrate: false,
      reason: 'No projects available for migration',
      requirements: ['At least one project must exist before migration']
    };
  }

  // 2. 미팅 존재 여부 체크
  if (!meetings || meetings.length === 0) {
    return {
      canMigrate: false,
      reason: 'No meetings to migrate',
      requirements: ['At least one meeting must exist to perform migration']
    };
  }

  // 3. 유효한 projectId 확인
  const validProjects = projects.filter(p =>
    p.id &&
    p.id !== 'unknown' &&
    p.id !== '' &&
    p.id !== 'undefined'
  );

  if (validProjects.length === 0) {
    return {
      canMigrate: false,
      reason: 'No valid project IDs found',
      requirements: ['Projects must have valid, non-empty IDs']
    };
  }

  // 4. 기본 프로젝트 선택
  const defaultProject = projects.find(p => p.isDefault) || validProjects[0];

  return {
    canMigrate: true,
    validProjectId: defaultProject.id
  };
}

/**
 * ProjectId 유효성 체크
 */
export function isValidProjectId(projectId: string | undefined): boolean {
  return !!(
    projectId &&
    projectId !== 'unknown' &&
    projectId !== '' &&
    projectId !== 'undefined' &&
    projectId !== 'null'
  );
}

/**
 * 안전한 ProjectId 가져오기
 */
export function getSafeProjectId(
  projects: Project[],
  preferredId?: string
): string | null {
  // 1. 선호 ID가 유효하면 사용
  if (preferredId && isValidProjectId(preferredId)) {
    const exists = projects.some(p => p.id === preferredId);
    if (exists) {
      return preferredId;
    }
  }

  // 2. 기본 프로젝트 찾기
  const defaultProject = projects.find(p => p.isDefault);
  if (defaultProject && isValidProjectId(defaultProject.id)) {
    return defaultProject.id;
  }

  // 3. 첫 번째 유효한 프로젝트
  const validProject = projects.find(p => isValidProjectId(p.id));
  if (validProject) {
    return validProject.id;
  }

  // 4. 유효한 프로젝트가 없음
  return null;
}

/**
 * 마이그레이션 가능 여부 간단 체크
 */
export function canMigrate(projects: Project[], meetings: Meeting[]): boolean {
  const validation = validateMigrationPrerequisites(projects, meetings);
  return validation.canMigrate;
}

/**
 * 마이그레이션 지연 여부 결정
 */
export function shouldDelayMigration(
  projects: Project[],
  meetings: Meeting[]
): { delay: boolean; reason?: string; retryAfter?: number } {
  // 프로젝트가 없으면 지연
  if (!projects || projects.length === 0) {
    return {
      delay: true,
      reason: 'Waiting for projects to be loaded',
      retryAfter: 5000 // 5초 후 재시도
    };
  }

  // 미팅이 없으면 마이그레이션 불필요
  if (!meetings || meetings.length === 0) {
    return {
      delay: false, // 지연이 아닌 스킵
      reason: 'No meetings to migrate'
    };
  }

  // 유효한 projectId가 없으면 지연
  const hasValidProject = projects.some(p => isValidProjectId(p.id));
  if (!hasValidProject) {
    return {
      delay: true,
      reason: 'Waiting for valid project IDs',
      retryAfter: 3000 // 3초 후 재시도
    };
  }

  return { delay: false };
}