/**
 * V2 Project Transformation Mappings
 * V2 시나리오를 통합 프로젝트 엔터티로 변환하는 매핑 설정
 */

import type { TransformationMapping, PostProcessor } from '../types';
import type { AxisKey } from '../../../../../types/buildup.types';

/**
 * V2 시나리오 -> 통합 프로젝트 매핑
 */
export const V2ProjectMapping: TransformationMapping = {
  id: 'v2:scenario:project',
  sourceType: 'v2',
  sourceEntityType: 'scenario',
  targetEntityType: 'project',

  // 필드 매핑 규칙
  fieldMappings: [
    // 기본 정보
    {
      sourcePath: 'title',
      targetPath: 'title',
      required: true
    },
    {
      sourcePath: 'description',
      targetPath: 'description',
      defaultValue: ''
    },
    {
      sourcePath: 'status',
      targetPath: 'status',
      transform: 'mapStatus',
      defaultValue: 'draft'
    },
    {
      sourcePath: 'priority',
      targetPath: 'priority',
      transform: 'mapPriority',
      defaultValue: 'medium'
    },

    // 프로젝트 고유 필드
    {
      sourcePath: 'phase',
      targetPath: 'phase',
      defaultValue: 'planning'
    },
    {
      sourcePath: 'progress',
      targetPath: 'progress',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'startDate',
      targetPath: 'startDate',
      transform: 'parseDate',
      required: true
    },
    {
      sourcePath: 'endDate',
      targetPath: 'endDate',
      transform: 'parseDate'
    },
    {
      sourcePath: 'budget',
      targetPath: 'budget',
      transform: 'parseNumber'
    },

    // 팀 정보
    {
      sourcePath: 'pmId',
      targetPath: 'team.pmId',
      required: true
    },
    {
      sourcePath: 'pmName',
      targetPath: 'team.pmName',
      required: true
    },
    {
      sourcePath: 'teamMembers',
      targetPath: 'team.memberIds',
      defaultValue: []
    },
    {
      sourcePath: 'stakeholders',
      targetPath: 'team.stakeholderIds',
      defaultValue: []
    },

    // KPI 영향도 - V2 시뮬레이션 결과에서 추출
    {
      sourcePath: 'projectedScores.GO',
      targetPath: 'kpiImpact.GO',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'projectedScores.EC',
      targetPath: 'kpiImpact.EC',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'projectedScores.PT',
      targetPath: 'kpiImpact.PT',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'projectedScores.PF',
      targetPath: 'kpiImpact.PF',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'projectedScores.TO',
      targetPath: 'kpiImpact.TO',
      transform: 'parseNumber',
      defaultValue: 0
    },

    // 예상 결과
    {
      sourcePath: 'expectedOutcomes',
      targetPath: 'expectedOutcomes',
      defaultValue: []
    },

    // 예측 데이터
    {
      sourcePath: 'projectedScores',
      targetPath: 'projectedScores',
      transform: 'normalizeKPI'
    },
    {
      sourcePath: 'riskFactors',
      targetPath: 'riskFactors',
      defaultValue: []
    },
    {
      sourcePath: 'successFactors',
      targetPath: 'successFactors',
      defaultValue: []
    },

    // 태그 처리
    {
      sourcePath: 'tags',
      targetPath: 'tags',
      transform: 'extractTags',
      defaultValue: []
    }
  ],

  // 조건부 변환 - V2 시나리오만 처리
  conditions: [
    {
      field: 'type',
      operator: 'equals',
      value: 'scenario'
    },
    {
      field: 'title',
      operator: 'exists',
      value: true
    }
  ],

  // 후처리 함수들
  postProcessors: [
    {
      name: 'generateConnectedEntities',
      function: async (entity, context) => {
        // 연결된 엔터티 ID 생성
        const projectId = entity.id;

        // 관련 이벤트 ID 추출 (캘린더 연동)
        entity.relatedEvents = context.sourceRecord.data.relatedEvents || [];

        // 관련 작업 ID 추출 (산출물 연동)
        entity.relatedTasks = context.sourceRecord.data.relatedTasks || [];

        // 마일스톤 생성
        entity.relatedMilestones = context.sourceRecord.data.milestones?.map((m: any) =>
          `milestone_${projectId}_${m.id || Date.now()}`
        ) || [];

        return entity;
      },
      priority: 1
    },
    {
      name: 'enrichMetadata',
      function: async (entity, context) => {
        // 메타데이터 보강
        entity.metadata = {
          ...entity.metadata,
          v2ScenarioId: context.sourceRecord.sourceId,
          transformationSource: 'v2-system',
          hasProjectedScores: !!context.sourceRecord.data.projectedScores,
          teamSize: entity.team?.memberIds?.length || 0,
          estimatedDuration: context.sourceRecord.data.estimatedDuration,
          complexityLevel: context.sourceRecord.data.complexity || 'medium'
        };

        return entity;
      },
      priority: 2
    },
    {
      name: 'calculateHealthScore',
      function: async (entity, context) => {
        // 프로젝트 건강도 점수 계산
        let healthScore = 100;

        // 팀 구성 체크
        if (!entity.team?.pmId) healthScore -= 20;
        if ((entity.team?.memberIds?.length || 0) === 0) healthScore -= 15;

        // 일정 체크
        if (!entity.startDate) healthScore -= 15;
        if (!entity.endDate) healthScore -= 10;

        // KPI 영향도 체크
        const hasKpiImpact = Object.values(entity.kpiImpact || {}).some(score => score > 0);
        if (!hasKpiImpact) healthScore -= 10;

        // 리스크 체크
        const riskCount = entity.riskFactors?.length || 0;
        healthScore -= Math.min(riskCount * 5, 20);

        entity.metadata.healthScore = Math.max(0, healthScore);

        return entity;
      },
      priority: 3
    }
  ],

  // 검증 규칙
  validationRules: [
    {
      field: 'title',
      rule: 'required',
      errorMessage: 'Project title is required'
    },
    {
      field: 'team.pmId',
      rule: 'required',
      errorMessage: 'Project manager ID is required'
    },
    {
      field: 'team.pmName',
      rule: 'required',
      errorMessage: 'Project manager name is required'
    },
    {
      field: 'startDate',
      rule: 'required',
      errorMessage: 'Project start date is required'
    },
    {
      field: 'progress',
      rule: 'numberRange',
      params: { min: 0, max: 100 },
      errorMessage: 'Progress must be between 0 and 100'
    },
    {
      field: 'phase',
      rule: 'pattern',
      params: { pattern: '^(planning|execution|monitoring|closing)$' },
      errorMessage: 'Invalid project phase'
    }
  ]
};

/**
 * V2 추천사항 -> 통합 추천사항 매핑
 */
export const V2RecommendationMapping: TransformationMapping = {
  id: 'v2:recommendation:recommendation',
  sourceType: 'v2',
  sourceEntityType: 'recommendation',
  targetEntityType: 'recommendation',

  fieldMappings: [
    // 기본 정보
    {
      sourcePath: 'title',
      targetPath: 'title',
      required: true
    },
    {
      sourcePath: 'description',
      targetPath: 'description',
      required: true
    },
    {
      sourcePath: 'priority',
      targetPath: 'priority',
      transform: 'mapPriority',
      defaultValue: 'medium'
    },

    // 추천사항 고유 필드
    {
      sourcePath: 'targetAxis',
      targetPath: 'targetAxis',
      required: true
    },
    {
      sourcePath: 'expectedImpact',
      targetPath: 'expectedImpact',
      transform: 'parseNumber',
      required: true
    },
    {
      sourcePath: 'confidence',
      targetPath: 'confidence',
      transform: 'parseNumber',
      required: true
    },
    {
      sourcePath: 'timeframe',
      targetPath: 'timeframe',
      defaultValue: 'medium'
    },
    {
      sourcePath: 'estimatedEffort',
      targetPath: 'estimatedEffort',
      transform: 'parseNumber',
      defaultValue: 5
    },
    {
      sourcePath: 'implementationCost',
      targetPath: 'implementationCost',
      transform: 'parseNumber'
    },

    // 액션 아이템
    {
      sourcePath: 'actionItems',
      targetPath: 'actionItems',
      defaultValue: []
    },

    // 리스크 및 전제조건
    {
      sourcePath: 'risks',
      targetPath: 'risks',
      defaultValue: []
    },
    {
      sourcePath: 'prerequisites',
      targetPath: 'prerequisites',
      defaultValue: []
    },
    {
      sourcePath: 'successCriteria',
      targetPath: 'successCriteria',
      defaultValue: []
    },

    // 생성 정보
    {
      sourcePath: 'generatedBy',
      targetPath: 'generatedBy',
      defaultValue: 'ai'
    },
    {
      sourcePath: 'basedOnData',
      targetPath: 'basedOnData',
      defaultValue: []
    }
  ],

  conditions: [
    {
      field: 'type',
      operator: 'equals',
      value: 'recommendation'
    },
    {
      field: 'targetAxis',
      operator: 'exists',
      value: true
    }
  ],

  postProcessors: [
    {
      name: 'validateTargetAxis',
      function: async (entity, context) => {
        const validAxes: AxisKey[] = ['GO', 'EC', 'PT', 'PF', 'TO'];
        if (!validAxes.includes(entity.targetAxis as AxisKey)) {
          entity.targetAxis = 'GO' as AxisKey;
        }
        return entity;
      },
      priority: 1
    },
    {
      name: 'enrichRecommendationMetadata',
      function: async (entity, context) => {
        entity.metadata = {
          ...entity.metadata,
          v2RecommendationId: context.sourceRecord.sourceId,
          analysisContext: context.sourceRecord.data.analysisContext,
          dataPoints: context.sourceRecord.data.dataPoints || [],
          algorithmVersion: context.sourceRecord.data.algorithmVersion || '1.0'
        };
        return entity;
      },
      priority: 2
    }
  ],

  validationRules: [
    {
      field: 'title',
      rule: 'required',
      errorMessage: 'Recommendation title is required'
    },
    {
      field: 'targetAxis',
      rule: 'required',
      errorMessage: 'Target KPI axis is required'
    },
    {
      field: 'expectedImpact',
      rule: 'numberRange',
      params: { min: -100, max: 100 },
      errorMessage: 'Expected impact must be between -100 and 100'
    },
    {
      field: 'confidence',
      rule: 'numberRange',
      params: { min: 0, max: 1 },
      errorMessage: 'Confidence must be between 0 and 1'
    }
  ]
};

/**
 * 모든 V2 매핑들을 반환
 */
export function getV2TransformationMappings(): TransformationMapping[] {
  return [
    V2ProjectMapping,
    V2RecommendationMapping
  ];
}