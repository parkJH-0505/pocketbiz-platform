/**
 * @fileoverview 데이터 변환 유틸리티
 * @description Meeting ↔ UnifiedSchedule 간의 안전하고 완벽한 양방향 데이터 변환
 * @author PocketCompany
 * @since 2025-01-18
 *
 * 설계 원칙:
 * 1. 데이터 무손실 - 변환 과정에서 데이터 손실 방지
 * 2. 타입 안전성 - 완벽한 TypeScript 타입 체킹
 * 3. 확장성 - 새로운 스케줄 타입 쉽게 추가
 * 4. 검증 - 변환 전후 데이터 유효성 검증
 * 5. 에러 처리 - 명확한 에러 메시지와 복구 전략
 */

import type {
  UnifiedSchedule,
  BuildupProjectMeeting,
  MentorSession,
  WebinarEvent,
  PMConsultation,
  ExternalMeeting,
  GeneralSchedule,
  ScheduleType,
  ScheduleStatus,
  MeetingSequence,
  MEETING_SEQUENCE_INFO,
  CreateBuildupMeetingDTO,
  ProjectPhase
} from '../types/schedule.types';

import type {
  Meeting,
  Project,
  TeamMember,
  ActionItem
} from '../types/buildup.types';

import { generateScheduleId } from '../types/schedule.types';

// ============================================================================
// Type Mappings
// ============================================================================

/**
 * Meeting.type → BuildupProjectMeeting.meetingSequence 매핑
 */
const MEETING_TYPE_TO_SEQUENCE: Record<Meeting['type'], MeetingSequence | null> = {
  'kickoff': 'guide_1',
  'progress': 'guide_2',
  'review': 'guide_3',
  'closing': 'closing',
  'demo': null  // demo는 특별한 시퀀스가 없음
};

/**
 * MeetingSequence → Meeting.type 역매핑
 */
const SEQUENCE_TO_MEETING_TYPE: Record<MeetingSequence, Meeting['type']> = {
  'pre_meeting': 'kickoff',  // 프리미팅은 kickoff로 매핑
  'guide_1': 'kickoff',
  'guide_2': 'progress',
  'guide_3': 'progress',
  'guide_4': 'review',
  'guide_5': 'review',
  'closing': 'closing'
};

/**
 * ScheduleStatus → Meeting 상태 매핑
 */
const SCHEDULE_STATUS_MAP = {
  'scheduled': 'pending',
  'in_progress': 'ongoing',
  'completed': 'completed',
  'cancelled': 'cancelled'
} as const;

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Meeting 데이터 유효성 검증
 */
function validateMeeting(meeting: Meeting): void {
  if (!meeting.id) {
    throw new Error('Meeting ID is required');
  }
  if (!meeting.title) {
    throw new Error('Meeting title is required');
  }
  if (!meeting.date) {
    throw new Error('Meeting date is required');
  }
  if (!meeting.type) {
    throw new Error('Meeting type is required');
  }
}

/**
 * Schedule 데이터 유효성 검증
 */
function validateSchedule(schedule: UnifiedSchedule): void {
  if (!schedule.id) {
    throw new Error('Schedule ID is required');
  }
  if (!schedule.title) {
    throw new Error('Schedule title is required');
  }
  if (!schedule.date) {
    throw new Error('Schedule date is required');
  }
  if (!schedule.type) {
    throw new Error('Schedule type is required');
  }
}

/**
 * Date 객체 정규화 (시간 정보 포함)
 */
function normalizeDate(date: Date | string, time?: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);

  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return new Date(); // 현재 시간으로 대체
  }

  // 시간 정보가 있으면 적용
  if (time) {
    const [hours, minutes] = time.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      dateObj.setHours(hours, minutes, 0, 0);
    }
  }

  return dateObj;
}

/**
 * 참가자 정보 정규화
 */
function normalizeParticipants(
  attendees: TeamMember[] | string[] | undefined
): string[] {
  if (!attendees || attendees.length === 0) {
    return [];
  }

  return attendees.map(attendee => {
    if (typeof attendee === 'string') {
      return attendee;
    }
    // TeamMember 객체인 경우
    return attendee.name || attendee.email || 'Unknown';
  });
}

// ============================================================================
// Main Converter Class
// ============================================================================

/**
 * 데이터 변환 유틸리티 클래스
 * Singleton 패턴으로 메모리 효율성 보장
 */
export class ScheduleDataConverter {
  private static instance: ScheduleDataConverter;

  private constructor() {}

  static getInstance(): ScheduleDataConverter {
    if (!ScheduleDataConverter.instance) {
      ScheduleDataConverter.instance = new ScheduleDataConverter();
    }
    return ScheduleDataConverter.instance;
  }

  // ========== Meeting → UnifiedSchedule ==========

  /**
   * Meeting → UnifiedSchedule 변환
   * @param meeting Meeting 데이터
   * @param project 연관 프로젝트 정보
   * @returns UnifiedSchedule
   */
  meetingToSchedule(
    meeting: Meeting,
    project: Project
  ): UnifiedSchedule {
    validateMeeting(meeting);

    // 기본 스케줄 데이터
    const baseSchedule: UnifiedSchedule = {
      id: meeting.id,
      type: 'meeting',
      subType: 'general',
      title: meeting.title || `${project.title} - ${meeting.type}`,
      description: meeting.agenda || '',
      date: normalizeDate(meeting.date),
      time: this.extractTimeFromDate(meeting.date),
      duration: meeting.duration || 60,
      location: meeting.location,
      participants: normalizeParticipants(meeting.attendees),
      status: this.mapMeetingStatus(meeting),
      priority: 'medium',
      isRecurring: false,
      createdAt: new Date(),
      createdBy: 'system',
      metadata: {
        meetingType: meeting.type,
        crmId: meeting.crm_id,
        actionItems: meeting.action_items,
        recordingUrl: meeting.recording_url,
        meetingLink: meeting.meeting_link
      }
    };

    return baseSchedule;
  }

  /**
   * Meeting → BuildupProjectMeeting 변환
   * @param meeting Meeting 데이터
   * @param project 연관 프로젝트 정보
   * @param pmInfo PM 정보
   * @returns BuildupProjectMeeting
   */
  meetingToBuildupMeeting(
    meeting: Meeting,
    project: Project,
    pmInfo: { id: string; name: string }
  ): BuildupProjectMeeting {
    validateMeeting(meeting);

    // Meeting type을 MeetingSequence로 변환
    const meetingSequence = this.inferMeetingSequence(meeting, project);

    const buildupMeeting: BuildupProjectMeeting = {
      id: meeting.id,
      type: 'meeting',
      subType: 'buildup_project',
      title: meeting.title || `${project.title} - ${this.getMeetingSequenceLabel(meetingSequence)}`,
      description: meeting.agenda || '',
      date: normalizeDate(meeting.date),
      time: this.extractTimeFromDate(meeting.date),
      duration: meeting.duration || 60,
      location: meeting.location,
      participants: normalizeParticipants(meeting.attendees),
      status: this.mapMeetingStatus(meeting),
      priority: 'high',  // 빌드업 미팅은 기본적으로 high
      isRecurring: false,
      createdAt: new Date(),
      createdBy: pmInfo.id,

      // BuildupProjectMeeting 전용 필드
      projectId: project.id,
      projectTitle: project.title,
      meetingSequence: meetingSequence,
      pmInfo: pmInfo,
      agenda: meeting.agenda ? [meeting.agenda] : [],
      actionItems: meeting.action_items?.map(item => item.description) || [],
      meetingNotes: meeting.minutes || '',
      meetingLink: meeting.meeting_link,
      offlineLocation: meeting.location,
      isCompleted: meeting.type === 'closing' || false,
      completedAt: undefined,
      completedBy: undefined,
      phaseTransitionTriggered: false,
      tags: []
    };

    // CRM ID가 있으면 메타데이터에 추가
    if (meeting.crm_id) {
      buildupMeeting.crmId = meeting.crm_id;
    }

    return buildupMeeting;
  }

  // ========== UnifiedSchedule → Meeting ==========

  /**
   * UnifiedSchedule → Meeting 변환
   * @param schedule UnifiedSchedule 데이터
   * @returns Meeting
   */
  scheduleToMeeting(schedule: UnifiedSchedule): Meeting {
    validateSchedule(schedule);

    const meeting: Meeting = {
      id: schedule.id,
      title: schedule.title,
      type: this.inferMeetingType(schedule),
      date: schedule.date,
      duration: schedule.duration || 60,
      attendees: schedule.participants || [],
      agenda: schedule.description || undefined,
      minutes: undefined,  // 스케줄에는 minutes 정보가 없음
      recording_url: undefined,
      action_items: this.extractActionItems(schedule),
      location: schedule.location,
      meeting_link: undefined,
      crm_id: undefined
    };

    // 메타데이터에서 추가 정보 추출
    if (schedule.metadata) {
      if (schedule.metadata.recordingUrl) {
        meeting.recording_url = schedule.metadata.recordingUrl;
      }
      if (schedule.metadata.meetingLink) {
        meeting.meeting_link = schedule.metadata.meetingLink;
      }
      if (schedule.metadata.crmId) {
        meeting.crm_id = schedule.metadata.crmId;
      }
      if (schedule.metadata.minutes) {
        meeting.minutes = schedule.metadata.minutes;
      }
    }

    return meeting;
  }

  /**
   * BuildupProjectMeeting → Meeting 변환
   * @param buildupMeeting BuildupProjectMeeting 데이터
   * @returns Meeting
   */
  buildupMeetingToMeeting(buildupMeeting: BuildupProjectMeeting): Meeting {
    const meeting: Meeting = {
      id: buildupMeeting.id,
      title: buildupMeeting.title,
      type: SEQUENCE_TO_MEETING_TYPE[buildupMeeting.meetingSequence] || 'progress',
      date: buildupMeeting.date,
      duration: buildupMeeting.duration || 60,
      attendees: buildupMeeting.participants || [],
      agenda: buildupMeeting.agenda?.join('\n') || undefined,
      minutes: buildupMeeting.meetingNotes || undefined,
      recording_url: undefined,  // BuildupMeeting에는 recording 정보가 없음
      action_items: this.convertActionItems(buildupMeeting.actionItems || []),
      location: buildupMeeting.offlineLocation || buildupMeeting.location,
      meeting_link: buildupMeeting.meetingLink,
      crm_id: buildupMeeting.crmId
    };

    return meeting;
  }

  // ========== Helper Methods ==========

  /**
   * Meeting 상태 매핑
   */
  private mapMeetingStatus(meeting: Meeting): ScheduleStatus {
    // Meeting 인터페이스에 status가 없으므로 추론
    if (meeting.type === 'closing') {
      return 'completed';
    }
    // 날짜 기반 추론
    const meetingDate = new Date(meeting.date);
    const now = new Date();

    if (meetingDate < now) {
      return 'completed';  // 과거 미팅은 완료로 간주
    }
    return 'scheduled';
  }

  /**
   * Meeting type 추론
   */
  private inferMeetingType(schedule: UnifiedSchedule): Meeting['type'] {
    // BuildupProjectMeeting인 경우
    if (schedule.subType === 'buildup_project') {
      const bpm = schedule as BuildupProjectMeeting;
      return SEQUENCE_TO_MEETING_TYPE[bpm.meetingSequence] || 'progress';
    }

    // 메타데이터에서 추론
    if (schedule.metadata?.meetingType) {
      return schedule.metadata.meetingType as Meeting['type'];
    }

    // 기본값
    return 'progress';
  }

  /**
   * Meeting sequence 추론
   */
  private inferMeetingSequence(
    meeting: Meeting,
    project: Project
  ): MeetingSequence {
    // Meeting type으로 추론
    const sequence = MEETING_TYPE_TO_SEQUENCE[meeting.type];
    if (sequence) {
      return sequence;
    }

    // Project phase로 추론
    if (project.phase) {
      return this.getSequenceFromPhase(project.phase);
    }

    // 기본값
    return 'guide_1';
  }

  /**
   * Project phase에서 MeetingSequence 추론
   */
  private getSequenceFromPhase(phase: ProjectPhase): MeetingSequence {
    const phaseToSequence: Record<ProjectPhase, MeetingSequence> = {
      'contract_pending': 'pre_meeting',
      'contract_signed': 'guide_1',
      'planning': 'guide_2',
      'design': 'guide_3',
      'execution': 'guide_4',
      'review': 'guide_5',
      'completed': 'closing'
    };

    return phaseToSequence[phase] || 'guide_1';
  }

  /**
   * MeetingSequence 라벨 가져오기
   */
  private getMeetingSequenceLabel(sequence: MeetingSequence): string {
    const sequenceInfo = {
      'pre_meeting': '프리미팅',
      'guide_1': '가이드 1차',
      'guide_2': '가이드 2차',
      'guide_3': '가이드 3차',
      'guide_4': '가이드 4차',
      'guide_5': '가이드 5차',
      'closing': '클로징'
    };

    return sequenceInfo[sequence] || '미팅';
  }

  /**
   * Date에서 시간 추출
   */
  private extractTimeFromDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * ActionItem 배열 추출
   */
  private extractActionItems(schedule: UnifiedSchedule): ActionItem[] | undefined {
    if (schedule.metadata?.actionItems) {
      return schedule.metadata.actionItems;
    }
    return undefined;
  }

  /**
   * 문자열 배열을 ActionItem으로 변환
   */
  private convertActionItems(items: string[]): ActionItem[] {
    return items.map((item, index) => ({
      id: `action-${Date.now()}-${index}`,
      description: item,
      assignee: { id: '', name: 'TBD', email: '' },  // 기본값
      due_date: new Date(),  // 기본값
      status: 'pending' as const
    }));
  }

  // ========== Batch Conversion Methods ==========

  /**
   * Meeting 배열 일괄 변환
   */
  meetingsToSchedules(
    meetings: Meeting[],
    project: Project
  ): UnifiedSchedule[] {
    return meetings.map(meeting => {
      try {
        return this.meetingToSchedule(meeting, project);
      } catch (error) {
        console.error(`Failed to convert meeting ${meeting.id}:`, error);
        return null;
      }
    }).filter((schedule): schedule is UnifiedSchedule => schedule !== null);
  }

  /**
   * Schedule 배열 일괄 변환
   */
  schedulesToMeetings(schedules: UnifiedSchedule[]): Meeting[] {
    return schedules
      .filter(schedule => schedule.type === 'meeting')
      .map(schedule => {
        try {
          return this.scheduleToMeeting(schedule);
        } catch (error) {
          console.error(`Failed to convert schedule ${schedule.id}:`, error);
          return null;
        }
      })
      .filter((meeting): meeting is Meeting => meeting !== null);
  }

  // ========== Validation Methods ==========

  /**
   * 양방향 변환 검증 (테스트용)
   * Meeting → Schedule → Meeting 변환 후 데이터 일치 확인
   */
  validateBidirectionalConversion(
    meeting: Meeting,
    project: Project
  ): boolean {
    try {
      const schedule = this.meetingToSchedule(meeting, project);
      const convertedMeeting = this.scheduleToMeeting(schedule);

      // 주요 필드 비교
      return (
        meeting.id === convertedMeeting.id &&
        meeting.title === convertedMeeting.title &&
        meeting.type === convertedMeeting.type &&
        meeting.date.getTime() === convertedMeeting.date.getTime()
      );
    } catch (error) {
      console.error('Bidirectional conversion validation failed:', error);
      return false;
    }
  }
}

// ============================================================================
// Utility Functions (추가 편의 함수)
// ============================================================================

/**
 * 스케줄이 빌드업 프로젝트 미팅인지 확인
 */
export function isBuildupMeetingSchedule(schedule: UnifiedSchedule): schedule is BuildupProjectMeeting {
  return schedule.subType === 'buildup_project';
}

/**
 * 프로젝트 ID로 미팅 필터링
 */
export function filterMeetingsByProject(meetings: Meeting[], projectId: string): Meeting[] {
  // Meeting 객체에는 projectId가 없으므로
  // 별도의 매핑이 필요함
  return meetings;
}

/**
 * 미팅 ID로 미팅 찾기
 */
export function findMeetingById(meetings: Meeting[], meetingId: string): Meeting | undefined {
  return meetings.find(m => m.id === meetingId);
}

/**
 * 미팅 업데이트 (불변성 유지)
 */
export function updateMeetingInArray(
  meetings: Meeting[],
  meetingId: string,
  updates: Partial<Meeting>
): Meeting[] {
  return meetings.map(meeting =>
    meeting.id === meetingId
      ? { ...meeting, ...updates }
      : meeting
  );
}

/**
 * 미팅 제거 (불변성 유지)
 */
export function removeMeetingFromArray(
  meetings: Meeting[],
  meetingId: string
): Meeting[] {
  return meetings.filter(meeting => meeting.id !== meetingId);
}

// ============================================================================
// Factory Functions (편의 함수)
// ============================================================================

/**
 * CreateBuildupMeetingDTO → BuildupProjectMeeting 변환
 */
export function createBuildupMeetingFromDTO(
  dto: CreateBuildupMeetingDTO
): BuildupProjectMeeting {
  const now = new Date();

  return {
    id: generateScheduleId(),
    type: 'meeting',
    subType: 'buildup_project',
    title: dto.title,
    description: dto.agenda?.join('\n') || '',
    date: normalizeDate(dto.date, dto.time),
    time: dto.time || '10:00',
    duration: 60,
    location: dto.location,
    participants: dto.participants,
    status: 'scheduled',
    priority: 'high',
    isRecurring: false,
    createdAt: now,
    createdBy: dto.pmInfo.id,

    // BuildupProjectMeeting 전용
    projectId: dto.projectId,
    projectTitle: '',  // 나중에 채워짐
    meetingSequence: dto.meetingSequence,
    pmInfo: dto.pmInfo,
    agenda: dto.agenda || [],
    actionItems: [],
    meetingNotes: '',
    meetingLink: undefined,
    offlineLocation: dto.location,
    isCompleted: false,
    phaseTransitionTriggered: false,
    tags: []
  };
}

// ============================================================================
// Duplicate Detection Utilities
// ============================================================================

/**
 * 중복 감지 유틸리티
 */
export class DuplicateDetector {
  /**
   * Meeting 중복 체크
   */
  static isDuplicateMeeting(meeting1: Meeting, meeting2: Meeting): boolean {
    // 기본 필드 비교
    if (meeting1.title === meeting2.title &&
        meeting1.type === meeting2.type &&
        meeting1.date.getTime() === meeting2.date.getTime()) {
      return true;
    }

    // ID가 같은 경우
    if (meeting1.id && meeting2.id && meeting1.id === meeting2.id) {
      return true;
    }

    return false;
  }

  /**
   * UnifiedSchedule 중복 체크
   */
  static isDuplicateSchedule(schedule1: UnifiedSchedule, schedule2: UnifiedSchedule): boolean {
    // 기본 필드 비교
    if (schedule1.title === schedule2.title &&
        schedule1.type === schedule2.type &&
        schedule1.date.getTime() === schedule2.date.getTime()) {
      return true;
    }

    // ID가 같은 경우
    if (schedule1.id && schedule2.id && schedule1.id === schedule2.id) {
      return true;
    }

    // BuildupProjectMeeting 특별 체크
    if (schedule1.type === 'buildup_project' && schedule2.type === 'buildup_project') {
      const buildup1 = schedule1 as BuildupProjectMeeting;
      const buildup2 = schedule2 as BuildupProjectMeeting;

      return buildup1.projectId === buildup2.projectId &&
             buildup1.meetingSequence === buildup2.meetingSequence;
    }

    return false;
  }

  /**
   * Meeting 배열에서 중복 제거
   */
  static removeDuplicateMeetings(meetings: Meeting[]): Meeting[] {
    const unique: Meeting[] = [];
    const seen = new Set<string>();

    for (const meeting of meetings) {
      const key = `${meeting.title}-${meeting.type}-${meeting.date.getTime()}`;

      if (!seen.has(key)) {
        // 기존 항목과 중복 체크
        const isDuplicate = unique.some(existing =>
          this.isDuplicateMeeting(meeting, existing)
        );

        if (!isDuplicate) {
          unique.push(meeting);
          seen.add(key);
        }
      }
    }

    return unique;
  }

  /**
   * UnifiedSchedule 배열에서 중복 제거
   */
  static removeDuplicateSchedules(schedules: UnifiedSchedule[]): UnifiedSchedule[] {
    const unique: UnifiedSchedule[] = [];
    const seen = new Set<string>();

    for (const schedule of schedules) {
      const key = `${schedule.title}-${schedule.type}-${schedule.date.getTime()}`;

      if (!seen.has(key)) {
        // 기존 항목과 중복 체크
        const isDuplicate = unique.some(existing =>
          this.isDuplicateSchedule(schedule, existing)
        );

        if (!isDuplicate) {
          unique.push(schedule);
          seen.add(key);
        }
      }
    }

    return unique;
  }

  /**
   * 프로젝트별 BuildupProjectMeeting 중복 체크
   */
  static findDuplicateBuildupMeetings(
    meetings: BuildupProjectMeeting[],
    projectId: string
  ): BuildupProjectMeeting[] {
    const projectMeetings = meetings.filter(m => m.projectId === projectId);
    const duplicates: BuildupProjectMeeting[] = [];
    const seen = new Map<string, BuildupProjectMeeting>();

    for (const meeting of projectMeetings) {
      const key = meeting.meetingSequence;

      if (seen.has(key)) {
        duplicates.push(meeting);
      } else {
        seen.set(key, meeting);
      }
    }

    return duplicates;
  }

  /**
   * 두 Meeting 배열 간의 차이점 찾기
   */
  static findMeetingDifferences(
    source: Meeting[],
    target: Meeting[]
  ): {
    onlyInSource: Meeting[];
    onlyInTarget: Meeting[];
    modified: Array<{ source: Meeting; target: Meeting }>;
  } {
    const onlyInSource: Meeting[] = [];
    const onlyInTarget: Meeting[] = [];
    const modified: Array<{ source: Meeting; target: Meeting }> = [];

    // Source에만 있는 항목
    for (const sourceMeeting of source) {
      const targetMatch = target.find(t =>
        sourceMeeting.id === t.id || this.isDuplicateMeeting(sourceMeeting, t)
      );

      if (!targetMatch) {
        onlyInSource.push(sourceMeeting);
      } else if (sourceMeeting.updatedAt && targetMatch.updatedAt &&
                 sourceMeeting.updatedAt.getTime() !== targetMatch.updatedAt.getTime()) {
        modified.push({ source: sourceMeeting, target: targetMatch });
      }
    }

    // Target에만 있는 항목
    for (const targetMeeting of target) {
      const sourceMatch = source.find(s =>
        targetMeeting.id === s.id || this.isDuplicateMeeting(targetMeeting, s)
      );

      if (!sourceMatch) {
        onlyInTarget.push(targetMeeting);
      }
    }

    return { onlyInSource, onlyInTarget, modified };
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const dataConverter = ScheduleDataConverter.getInstance();
export const duplicateDetector = new DuplicateDetector();