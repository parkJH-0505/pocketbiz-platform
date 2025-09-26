/**
 * Buildup Project Transformation Mappings
 * Buildup 시스템의 데이터를 통합 엔터티로 변환하는 매핑 설정
 */

import type { TransformationMapping } from '../types';

/**
 * Buildup 프로젝트 -> 통합 프로젝트 매핑
 */
export const BuildupProjectMapping: TransformationMapping = {
  id: 'buildup:project:project',
  sourceType: 'buildup',
  sourceEntityType: 'project',
  targetEntityType: 'project',

  fieldMappings: [
    // 기본 정보
    {
      sourcePath: 'name',
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
      defaultValue: 'active'
    },
    {
      sourcePath: 'priority',
      targetPath: 'priority',
      transform: 'mapPriority',
      defaultValue: 'medium'
    },

    // 프로젝트 고유 정보
    {
      sourcePath: 'phase',
      targetPath: 'phase',
      defaultValue: 'execution'
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
      sourcePath: 'targetDate',
      targetPath: 'endDate',
      transform: 'parseDate'
    },
    {
      sourcePath: 'budget',
      targetPath: 'budget',
      transform: 'parseNumber'
    },

    // 팀 정보 - Buildup은 단순한 구조
    {
      sourcePath: 'ownerId',
      targetPath: 'team.pmId',
      required: true
    },
    {
      sourcePath: 'ownerName',
      targetPath: 'team.pmName',
      required: true
    },
    {
      sourcePath: 'collaborators',
      targetPath: 'team.memberIds',
      defaultValue: []
    },
    {
      sourcePath: 'stakeholders',
      targetPath: 'team.stakeholderIds',
      defaultValue: []
    },

    // KPI 영향도 - Buildup의 예상 효과
    {
      sourcePath: 'expectedResults.GO',
      targetPath: 'kpiImpact.GO',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'expectedResults.EC',
      targetPath: 'kpiImpact.EC',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'expectedResults.PT',
      targetPath: 'kpiImpact.PT',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'expectedResults.PF',
      targetPath: 'kpiImpact.PF',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'expectedResults.TO',
      targetPath: 'kpiImpact.TO',
      transform: 'parseNumber',
      defaultValue: 0
    },

    // 예상 결과
    {
      sourcePath: 'outcomes',
      targetPath: 'expectedOutcomes',
      defaultValue: []
    },

    // 리스크 및 성공 요인
    {
      sourcePath: 'risks',
      targetPath: 'riskFactors',
      defaultValue: []
    },
    {
      sourcePath: 'successFactors',
      targetPath: 'successFactors',
      defaultValue: []
    },

    // 태그
    {
      sourcePath: 'tags',
      targetPath: 'tags',
      transform: 'extractTags',
      defaultValue: []
    }
  ],

  conditions: [
    {
      field: 'type',
      operator: 'equals',
      value: 'project'
    },
    {
      field: 'name',
      operator: 'exists',
      value: true
    }
  ],

  postProcessors: [
    {
      name: 'linkBuildupEntities',
      function: async (entity, context) => {
        const projectId = entity.id;
        const sourceData = context.sourceRecord.data;

        // Buildup 시스템의 연결된 엔터티들
        entity.relatedTasks = sourceData.tasks?.map((t: any) =>
          `task_buildup_${t.id || Date.now()}`
        ) || [];

        entity.relatedMilestones = sourceData.milestones?.map((m: any) =>
          `milestone_buildup_${m.id || Date.now()}`
        ) || [];

        // Buildup의 검토 프로세스를 이벤트로 변환
        entity.relatedEvents = sourceData.reviews?.map((r: any) =>
          `event_buildup_review_${r.id || Date.now()}`
        ) || [];

        return entity;
      },
      priority: 1
    },
    {
      name: 'calculateBuildupMetrics',
      function: async (entity, context) => {
        const sourceData = context.sourceRecord.data;

        // Buildup 특화 메트릭 계산
        const taskCount = sourceData.tasks?.length || 0;
        const completedTasks = sourceData.tasks?.filter((t: any) => t.completed).length || 0;
        const progressFromTasks = taskCount > 0 ? (completedTasks / taskCount) * 100 : 0;

        // 실제 진행률이 없으면 작업 기반으로 계산
        if (entity.progress === 0 && progressFromTasks > 0) {
          entity.progress = progressFromTasks;
        }

        entity.metadata = {
          ...entity.metadata,
          buildupProjectId: context.sourceRecord.sourceId,
          taskBasedProgress: progressFromTasks,
          totalTasks: taskCount,
          completedTasks,
          hasExpectedResults: !!sourceData.expectedResults,
          buildupPhase: sourceData.buildupPhase || 'active'
        };

        return entity;
      },
      priority: 2
    },
    {
      name: 'assessProjectViability',
      function: async (entity, context) => {
        let viabilityScore = 100;

        // 기본 정보 완성도
        if (!entity.description || entity.description.length < 20) viabilityScore -= 15;
        if (!entity.endDate) viabilityScore -= 10;
        if (!entity.budget) viabilityScore -= 5;

        // 팀 구성
        const teamSize = (entity.team?.memberIds?.length || 0) + 1; // PM 포함
        if (teamSize < 2) viabilityScore -= 20;

        // KPI 영향도
        const totalImpact = Object.values(entity.kpiImpact || {})
          .reduce((sum, score) => sum + (score || 0), 0);
        if (totalImpact === 0) viabilityScore -= 15;

        // 리스크 분석
        const riskCount = entity.riskFactors?.length || 0;
        if (riskCount === 0) viabilityScore -= 10; // 리스크 식별 안됨
        else if (riskCount > 5) viabilityScore -= (riskCount - 5) * 3; // 너무 많은 리스크

        entity.metadata.viabilityScore = Math.max(0, viabilityScore);

        return entity;
      },
      priority: 3
    }
  ],

  validationRules: [
    {
      field: 'title',
      rule: 'required',
      errorMessage: 'Project name is required'
    },
    {
      field: 'team.pmId',
      rule: 'required',
      errorMessage: 'Project owner is required'
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
    }
  ]
};

/**
 * Buildup KPI -> 통합 KPI 매핑
 */
export const BuildupKPIMapping: TransformationMapping = {
  id: 'buildup:kpi:kpi',
  sourceType: 'buildup',
  sourceEntityType: 'kpi',
  targetEntityType: 'kpi',

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
      defaultValue: 'Buildup KPI measurement'
    },

    // KPI 점수
    {
      sourcePath: 'scores',
      targetPath: 'scores',
      transform: 'normalizeKPI',
      required: true
    },
    {
      sourcePath: 'previousScores',
      targetPath: 'previousScores',
      transform: 'normalizeKPI'
    },

    // 측정 정보
    {
      sourcePath: 'measuredAt',
      targetPath: 'measuredAt',
      transform: 'parseDate',
      required: true
    },
    {
      sourcePath: 'period',
      targetPath: 'measurementPeriod',
      defaultValue: 'daily'
    },
    {
      sourcePath: 'source',
      targetPath: 'dataSource',
      defaultValue: 'buildup-system'
    },
    {
      sourcePath: 'confidence',
      targetPath: 'confidence',
      transform: 'parseNumber',
      defaultValue: 0.8
    },

    // 트리거 및 외부 요인
    {
      sourcePath: 'triggers',
      targetPath: 'triggers',
      defaultValue: []
    },
    {
      sourcePath: 'externalFactors',
      targetPath: 'externalFactors',
      defaultValue: []
    },

    // 목표 및 예측
    {
      sourcePath: 'targets',
      targetPath: 'targetScores',
      transform: 'normalizeKPI'
    },
    {
      sourcePath: 'projections',
      targetPath: 'projectedScores',
      transform: 'normalizeKPI'
    },

    // 관련 엔터티
    {
      sourcePath: 'relatedProjects',
      targetPath: 'relatedProjects',
      defaultValue: []
    },
    {
      sourcePath: 'impactingEvents',
      targetPath: 'impactingEvents',
      defaultValue: []
    }
  ],

  conditions: [
    {
      field: 'type',
      operator: 'equals',
      value: 'kpi'
    },
    {
      field: 'scores',
      operator: 'exists',
      value: true
    }
  ],

  postProcessors: [
    {
      name: 'calculateKPIChanges',
      function: async (entity, context) => {
        if (entity.scores && entity.previousScores) {
          const changes: Record<string, number> = {};
          Object.keys(entity.scores).forEach(axis => {
            const current = entity.scores[axis] || 0;
            const previous = entity.previousScores?.[axis] || 0;
            changes[axis] = current - previous;
          });
          entity.changes = changes;
        }
        return entity;
      },
      priority: 1
    },
    {
      name: 'calculateVariance',
      function: async (entity, context) => {
        if (entity.scores && entity.targetScores) {
          const variance: Record<string, number> = {};
          Object.keys(entity.scores).forEach(axis => {
            const actual = entity.scores[axis] || 0;
            const target = entity.targetScores?.[axis] || 0;
            variance[axis] = target > 0 ? ((actual - target) / target) * 100 : 0;
          });
          entity.variance = variance;
        }
        return entity;
      },
      priority: 2
    },
    {
      name: 'enrichKPIMetadata',
      function: async (entity, context) => {
        const sourceData = context.sourceRecord.data;

        entity.metadata = {
          ...entity.metadata,
          buildupKPIId: context.sourceRecord.sourceId,
          measurementMethod: sourceData.method || 'automatic',
          aggregationPeriod: sourceData.aggregation || 'daily',
          lastCalculated: new Date(),
          dataPointCount: sourceData.dataPoints?.length || 0,
          qualityIndicators: sourceData.quality || {}
        };

        return entity;
      },
      priority: 3
    }
  ],

  validationRules: [
    {
      field: 'scores',
      rule: 'required',
      errorMessage: 'KPI scores are required'
    },
    {
      field: 'measuredAt',
      rule: 'required',
      errorMessage: 'Measurement date is required'
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
 * 모든 Buildup 매핑들을 반환
 */
export function getBuildupTransformationMappings(): TransformationMapping[] {
  return [
    BuildupProjectMapping,
    BuildupKPIMapping
  ];
}