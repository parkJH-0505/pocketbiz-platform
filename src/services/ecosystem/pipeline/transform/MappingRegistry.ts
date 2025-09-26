/**
 * Mapping Registry
 * 모든 변환 매핑을 등록하고 관리하는 중앙 레지스트리
 */

import { getV2TransformationMappings } from './mappings/V2ProjectMapping';
import { getCalendarTransformationMappings } from './mappings/CalendarEventMapping';
import { getBuildupTransformationMappings } from './mappings/BuildupProjectMapping';
import type { TransformationMapping, UnifiedEntityType } from './types';

export class MappingRegistry {
  private static instance: MappingRegistry;
  private mappings: Map<string, TransformationMapping> = new Map();
  private mappingsBySource: Map<string, TransformationMapping[]> = new Map();
  private mappingsByTarget: Map<UnifiedEntityType, TransformationMapping[]> = new Map();

  private constructor() {
    this.loadAllMappings();
  }

  static getInstance(): MappingRegistry {
    if (!MappingRegistry.instance) {
      MappingRegistry.instance = new MappingRegistry();
    }
    return MappingRegistry.instance;
  }

  /**
   * 모든 매핑 로드
   */
  private loadAllMappings(): void {
    console.log('[MappingRegistry] Loading transformation mappings...');

    // V2 시스템 매핑
    const v2Mappings = getV2TransformationMappings();
    v2Mappings.forEach(mapping => this.registerMapping(mapping));

    // 캘린더 시스템 매핑
    const calendarMappings = getCalendarTransformationMappings();
    calendarMappings.forEach(mapping => this.registerMapping(mapping));

    // Buildup 시스템 매핑
    const buildupMappings = getBuildupTransformationMappings();
    buildupMappings.forEach(mapping => this.registerMapping(mapping));

    console.log(`[MappingRegistry] Loaded ${this.mappings.size} transformation mappings`);
    this.printMappingSummary();
  }

  /**
   * 매핑 등록
   */
  private registerMapping(mapping: TransformationMapping): void {
    // 기본 매핑 등록
    this.mappings.set(mapping.id, mapping);

    // 소스 타입별 인덱스
    const sourceKey = `${mapping.sourceType}:${mapping.sourceEntityType}`;
    if (!this.mappingsBySource.has(sourceKey)) {
      this.mappingsBySource.set(sourceKey, []);
    }
    this.mappingsBySource.get(sourceKey)!.push(mapping);

    // 타겟 타입별 인덱스
    if (!this.mappingsByTarget.has(mapping.targetEntityType)) {
      this.mappingsByTarget.set(mapping.targetEntityType, []);
    }
    this.mappingsByTarget.get(mapping.targetEntityType)!.push(mapping);

    console.log(`[MappingRegistry] Registered mapping: ${mapping.id}`);
  }

  /**
   * ID로 매핑 조회
   */
  getMapping(id: string): TransformationMapping | undefined {
    return this.mappings.get(id);
  }

  /**
   * 소스 타입으로 매핑 조회
   */
  getMappingsBySource(sourceType: string, sourceEntityType: string): TransformationMapping[] {
    const key = `${sourceType}:${sourceEntityType}`;
    return this.mappingsBySource.get(key) || [];
  }

  /**
   * 타겟 타입으로 매핑 조회
   */
  getMappingsByTarget(targetEntityType: UnifiedEntityType): TransformationMapping[] {
    return this.mappingsByTarget.get(targetEntityType) || [];
  }

  /**
   * 최적 매핑 찾기
   */
  findBestMapping(
    sourceType: string,
    sourceEntityType: string,
    targetEntityType?: UnifiedEntityType
  ): TransformationMapping | null {
    const sourceMappings = this.getMappingsBySource(sourceType, sourceEntityType);

    if (sourceMappings.length === 0) {
      return null;
    }

    // 특정 타겟 타입이 지정된 경우
    if (targetEntityType) {
      const exactMatch = sourceMappings.find(m => m.targetEntityType === targetEntityType);
      if (exactMatch) return exactMatch;
    }

    // 첫 번째 매핑 반환 (우선순위 기반)
    return sourceMappings[0];
  }

  /**
   * 모든 매핑 조회
   */
  getAllMappings(): TransformationMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * 매핑 통계
   */
  getStatistics(): {
    totalMappings: number;
    mappingsBySourceType: Record<string, number>;
    mappingsByTargetType: Record<string, number>;
  } {
    const mappingsBySourceType: Record<string, number> = {};
    const mappingsByTargetType: Record<string, number> = {};

    Array.from(this.mappings.values()).forEach(mapping => {
      // 소스 타입별 카운트
      mappingsBySourceType[mapping.sourceType] = (mappingsBySourceType[mapping.sourceType] || 0) + 1;

      // 타겟 타입별 카운트
      mappingsByTargetType[mapping.targetEntityType] = (mappingsByTargetType[mapping.targetEntityType] || 0) + 1;
    });

    return {
      totalMappings: this.mappings.size,
      mappingsBySourceType,
      mappingsByTargetType
    };
  }

  /**
   * 매핑 검증
   */
  validateMapping(mapping: TransformationMapping): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 기본 필드 검증
    if (!mapping.id) errors.push('Mapping ID is required');
    if (!mapping.sourceType) errors.push('Source type is required');
    if (!mapping.sourceEntityType) errors.push('Source entity type is required');
    if (!mapping.targetEntityType) errors.push('Target entity type is required');

    // 필드 매핑 검증
    if (!mapping.fieldMappings || mapping.fieldMappings.length === 0) {
      errors.push('At least one field mapping is required');
    } else {
      mapping.fieldMappings.forEach((fieldMapping, index) => {
        if (!fieldMapping.sourcePath) {
          errors.push(`Field mapping ${index}: sourcePath is required`);
        }
        if (!fieldMapping.targetPath) {
          errors.push(`Field mapping ${index}: targetPath is required`);
        }
      });
    }

    // 검증 규칙 검증
    if (mapping.validationRules) {
      mapping.validationRules.forEach((rule, index) => {
        if (!rule.field) {
          errors.push(`Validation rule ${index}: field is required`);
        }
        if (!rule.rule) {
          errors.push(`Validation rule ${index}: rule type is required`);
        }
        if (!rule.errorMessage) {
          errors.push(`Validation rule ${index}: error message is required`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 매핑 요약 출력
   */
  private printMappingSummary(): void {
    const stats = this.getStatistics();

    console.log('\n=== Transformation Mapping Summary ===');
    console.log(`Total mappings: ${stats.totalMappings}`);

    console.log('\nBy Source Type:');
    Object.entries(stats.mappingsBySourceType).forEach(([sourceType, count]) => {
      console.log(`  ${sourceType}: ${count} mappings`);
    });

    console.log('\nBy Target Type:');
    Object.entries(stats.mappingsByTargetType).forEach(([targetType, count]) => {
      console.log(`  ${targetType}: ${count} mappings`);
    });

    console.log('=====================================\n');
  }

  /**
   * 동적 매핑 추가
   */
  addMapping(mapping: TransformationMapping): boolean {
    const validation = this.validateMapping(mapping);
    if (!validation.isValid) {
      console.error(`[MappingRegistry] Invalid mapping ${mapping.id}:`, validation.errors);
      return false;
    }

    if (this.mappings.has(mapping.id)) {
      console.warn(`[MappingRegistry] Mapping ${mapping.id} already exists, overwriting`);
    }

    this.registerMapping(mapping);
    return true;
  }

  /**
   * 매핑 제거
   */
  removeMapping(id: string): boolean {
    const mapping = this.mappings.get(id);
    if (!mapping) {
      console.warn(`[MappingRegistry] Mapping ${id} not found`);
      return false;
    }

    // 기본 매핑에서 제거
    this.mappings.delete(id);

    // 인덱스에서 제거
    const sourceKey = `${mapping.sourceType}:${mapping.sourceEntityType}`;
    const sourceMappings = this.mappingsBySource.get(sourceKey);
    if (sourceMappings) {
      const index = sourceMappings.findIndex(m => m.id === id);
      if (index >= 0) {
        sourceMappings.splice(index, 1);
        if (sourceMappings.length === 0) {
          this.mappingsBySource.delete(sourceKey);
        }
      }
    }

    const targetMappings = this.mappingsByTarget.get(mapping.targetEntityType);
    if (targetMappings) {
      const index = targetMappings.findIndex(m => m.id === id);
      if (index >= 0) {
        targetMappings.splice(index, 1);
        if (targetMappings.length === 0) {
          this.mappingsByTarget.delete(mapping.targetEntityType);
        }
      }
    }

    console.log(`[MappingRegistry] Removed mapping: ${id}`);
    return true;
  }

  /**
   * 레지스트리 재로드
   */
  reload(): void {
    console.log('[MappingRegistry] Reloading mappings...');
    this.mappings.clear();
    this.mappingsBySource.clear();
    this.mappingsByTarget.clear();
    this.loadAllMappings();
  }

  /**
   * 정리
   */
  dispose(): void {
    this.mappings.clear();
    this.mappingsBySource.clear();
    this.mappingsByTarget.clear();
    console.log('[MappingRegistry] Disposed');
  }
}