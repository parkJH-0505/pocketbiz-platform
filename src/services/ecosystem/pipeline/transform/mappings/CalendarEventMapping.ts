/**
 * Calendar Event Transformation Mappings
 * 캘린더 이벤트를 통합 이벤트 엔터티로 변환하는 매핑 설정
 */

import type { TransformationMapping } from '../types';

/**
 * 캘린더 이벤트 -> 통합 이벤트 매핑
 */
export const CalendarEventMapping: TransformationMapping = {
  id: 'calendar:event:event',
  sourceType: 'calendar',
  sourceEntityType: 'event',
  targetEntityType: 'event',

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
      defaultValue: 'scheduled'
    },
    {
      sourcePath: 'priority',
      targetPath: 'priority',
      transform: 'mapPriority',
      defaultValue: 'medium'
    },

    // 시간 정보
    {
      sourcePath: 'startTime',
      targetPath: 'startTime',
      transform: 'parseDate',
      required: true
    },
    {
      sourcePath: 'endTime',
      targetPath: 'endTime',
      transform: 'parseDate',
      required: true
    },
    {
      sourcePath: 'timezone',
      targetPath: 'timezone',
      defaultValue: 'Asia/Seoul'
    },

    // 이벤트 타입
    {
      sourcePath: 'eventType',
      targetPath: 'eventType',
      defaultValue: 'meeting'
    },

    // 참여자 정보
    {
      sourcePath: 'attendees',
      targetPath: 'participants',
      defaultValue: []
    },

    // 위치 정보
    {
      sourcePath: 'location',
      targetPath: 'location'
    },
    {
      sourcePath: 'meetingUrl',
      targetPath: 'meetingLink'
    },
    {
      sourcePath: 'conferenceLink',
      targetPath: 'meetingLink'
    },

    // 연결된 프로젝트
    {
      sourcePath: 'projectId',
      targetPath: 'projectId'
    },
    {
      sourcePath: 'projectTitle',
      targetPath: 'projectTitle'
    },

    // 미팅 관련
    {
      sourcePath: 'agenda',
      targetPath: 'agenda'
    },
    {
      sourcePath: 'notes',
      targetPath: 'notes'
    },
    {
      sourcePath: 'actionItems',
      targetPath: 'actionItems',
      defaultValue: []
    },
    {
      sourcePath: 'decisions',
      targetPath: 'decisions',
      defaultValue: []
    },

    // 반복 정보
    {
      sourcePath: 'isRecurring',
      targetPath: 'isRecurring',
      defaultValue: false
    },
    {
      sourcePath: 'recurrence',
      targetPath: 'recurrencePattern'
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
      value: 'event'
    },
    {
      field: 'startTime',
      operator: 'exists',
      value: true
    }
  ],

  postProcessors: [
    {
      name: 'calculateDuration',
      function: async (entity, context) => {
        if (entity.startTime && entity.endTime) {
          const start = new Date(entity.startTime);
          const end = new Date(entity.endTime);
          entity.duration = Math.max(0, end.getTime() - start.getTime()) / (1000 * 60); // minutes
        } else {
          entity.duration = 60; // default 1 hour
        }
        return entity;
      },
      priority: 1
    },
    {
      name: 'processParticipants',
      function: async (entity, context) => {
        const attendees = context.sourceRecord.data.attendees || [];
        entity.participants = attendees.map((attendee: any) => ({
          id: attendee.id || attendee.email || `attendee_${Date.now()}`,
          name: attendee.name || attendee.displayName || attendee.email || 'Unknown',
          role: attendee.role || (attendee.organizer ? 'host' : 'required'),
          confirmed: attendee.responseStatus === 'accepted' || attendee.confirmed || false
        }));
        return entity;
      },
      priority: 2
    },
    {
      name: 'determineEventType',
      function: async (entity, context) => {
        const title = entity.title?.toLowerCase() || '';
        const description = entity.description?.toLowerCase() || '';

        if (title.includes('deadline') || title.includes('due')) {
          entity.eventType = 'deadline';
        } else if (title.includes('milestone')) {
          entity.eventType = 'milestone';
        } else if (title.includes('review') || title.includes('retrospective')) {
          entity.eventType = 'review';
        } else if (title.includes('planning') || title.includes('plan')) {
          entity.eventType = 'planning';
        } else if (description.includes('meeting') || entity.participants.length > 1) {
          entity.eventType = 'meeting';
        }

        return entity;
      },
      priority: 3
    },
    {
      name: 'enrichEventMetadata',
      function: async (entity, context) => {
        entity.metadata = {
          ...entity.metadata,
          calendarId: context.sourceRecord.sourceId,
          calendarSystem: context.sourceRecord.data.calendarSystem || 'unknown',
          organizer: context.sourceRecord.data.organizer,
          createdBy: context.sourceRecord.data.creator?.email || entity.createdBy,
          lastModified: context.sourceRecord.data.updated ? new Date(context.sourceRecord.data.updated) : entity.updatedAt,
          attendeeCount: entity.participants.length,
          isOnline: !!entity.meetingLink,
          hasLocation: !!entity.location
        };
        return entity;
      },
      priority: 4
    }
  ],

  validationRules: [
    {
      field: 'title',
      rule: 'required',
      errorMessage: 'Event title is required'
    },
    {
      field: 'startTime',
      rule: 'required',
      errorMessage: 'Event start time is required'
    },
    {
      field: 'endTime',
      rule: 'required',
      errorMessage: 'Event end time is required'
    },
    {
      field: 'startTime',
      rule: 'dateRange',
      params: {
        min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1년 전
        max: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2년 후
      },
      errorMessage: 'Event start time must be within reasonable range'
    }
  ]
};

/**
 * 캘린더 작업 -> 통합 작업 매핑
 */
export const CalendarTaskMapping: TransformationMapping = {
  id: 'calendar:task:task',
  sourceType: 'calendar',
  sourceEntityType: 'task',
  targetEntityType: 'task',

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
      defaultValue: 'active'
    },
    {
      sourcePath: 'priority',
      targetPath: 'priority',
      transform: 'mapPriority',
      defaultValue: 'medium'
    },

    // 작업 정보
    {
      sourcePath: 'assignee',
      targetPath: 'assigneeId',
      required: true
    },
    {
      sourcePath: 'assigneeName',
      targetPath: 'assigneeName',
      required: true
    },
    {
      sourcePath: 'reviewer',
      targetPath: 'reviewerId'
    },
    {
      sourcePath: 'reviewerName',
      targetPath: 'reviewerName'
    },

    // 일정 정보
    {
      sourcePath: 'dueDate',
      targetPath: 'dueDate',
      transform: 'parseDate',
      required: true
    },
    {
      sourcePath: 'estimatedHours',
      targetPath: 'estimatedHours',
      transform: 'parseNumber'
    },
    {
      sourcePath: 'actualHours',
      targetPath: 'actualHours',
      transform: 'parseNumber'
    },
    {
      sourcePath: 'completedAt',
      targetPath: 'completedAt',
      transform: 'parseDate'
    },

    // 의존성
    {
      sourcePath: 'dependencies',
      targetPath: 'dependencies',
      defaultValue: []
    },
    {
      sourcePath: 'blockers',
      targetPath: 'blockedBy',
      defaultValue: []
    },

    // 프로젝트 연결
    {
      sourcePath: 'projectId',
      targetPath: 'projectId',
      required: true
    },
    {
      sourcePath: 'projectTitle',
      targetPath: 'projectTitle',
      required: true
    },

    // 진행 상황
    {
      sourcePath: 'progress',
      targetPath: 'progressPercentage',
      transform: 'parseNumber',
      defaultValue: 0
    },
    {
      sourcePath: 'subtasks',
      targetPath: 'subtasks',
      defaultValue: []
    },

    // 산출물
    {
      sourcePath: 'deliverables',
      targetPath: 'deliverables',
      defaultValue: []
    }
  ],

  conditions: [
    {
      field: 'type',
      operator: 'equals',
      value: 'task'
    },
    {
      field: 'assignee',
      operator: 'exists',
      value: true
    }
  ],

  postProcessors: [
    {
      name: 'calculateTaskHealth',
      function: async (entity, context) => {
        let healthScore = 100;
        const now = new Date();

        // 기한 체크
        if (entity.dueDate && new Date(entity.dueDate) < now && entity.status !== 'completed') {
          healthScore -= 30; // 연체
        }

        // 진행률 체크
        if (entity.progressPercentage < 50 && entity.status === 'in_progress') {
          healthScore -= 20; // 진행 부족
        }

        // 의존성 체크
        const blockedCount = entity.blockedBy?.length || 0;
        healthScore -= blockedCount * 10;

        entity.metadata.healthScore = Math.max(0, healthScore);

        return entity;
      },
      priority: 1
    },
    {
      name: 'enrichTaskMetadata',
      function: async (entity, context) => {
        entity.metadata = {
          ...entity.metadata,
          calendarTaskId: context.sourceRecord.sourceId,
          isOverdue: entity.dueDate ? new Date(entity.dueDate) < new Date() : false,
          hasDeliverables: (entity.deliverables?.length || 0) > 0,
          hasSubtasks: (entity.subtasks?.length || 0) > 0,
          completionRate: entity.progressPercentage / 100
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
      errorMessage: 'Task title is required'
    },
    {
      field: 'assigneeId',
      rule: 'required',
      errorMessage: 'Task assignee is required'
    },
    {
      field: 'projectId',
      rule: 'required',
      errorMessage: 'Project ID is required'
    },
    {
      field: 'dueDate',
      rule: 'required',
      errorMessage: 'Task due date is required'
    },
    {
      field: 'progressPercentage',
      rule: 'numberRange',
      params: { min: 0, max: 100 },
      errorMessage: 'Progress percentage must be between 0 and 100'
    }
  ]
};

/**
 * 모든 캘린더 매핑들을 반환
 */
export function getCalendarTransformationMappings(): TransformationMapping[] {
  return [
    CalendarEventMapping,
    CalendarTaskMapping
  ];
}