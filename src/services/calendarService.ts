/**
 * 캘린더 서비스
 * 백엔드 API를 모방한 더미데이터 생성 및 관리
 * LocalStorage를 통한 데이터 영속성 제공
 */

import type { CalendarEvent } from '../types/calendar.types';
import type { EnhancedMeetingData, MeetingType } from '../types/meeting.types';
import type { Project } from '../types/buildup.types';

// PM 풀
const PM_POOL = [
  { id: 'pm-001', name: '김철수', title: 'Senior PM', expertise: '스타트업 전략' },
  { id: 'pm-002', name: '이영희', title: 'Lead PM', expertise: 'IT/개발' },
  { id: 'pm-003', name: '박민수', title: 'PM', expertise: '마케팅/그로스' },
  { id: 'pm-004', name: '정수진', title: 'Senior PM', expertise: '투자/IR' }
];

// 온라인 강의 강사 풀
const INSTRUCTOR_POOL = [
  { id: 'instructor-001', name: '최기업', title: 'VC 파트너', company: '포켓벤처스', topic: '투자 유치 전략' },
  { id: 'instructor-002', name: '강스타트', title: '대표이사', company: '유니콘테크', topic: '스타트업 성장 전략' },
  { id: 'instructor-003', name: '윤개발', title: 'CTO', company: '테크스타트업', topic: '기술 아키텍처 설계' },
  { id: 'instructor-004', name: '한마케팅', title: 'CMO', company: '그로스컴퍼니', topic: '그로스 마케팅' }
];

// 웨비나 주제
const WEBINAR_TOPICS = [
  { title: '스타트업 투자 유치 전략', speaker: '김투자', company: 'ABC벤처캐피탈' },
  { title: 'AI 시대의 비즈니스 모델', speaker: '이인공', company: 'AI연구소' },
  { title: '글로벌 진출 케이스 스터디', speaker: '박글로벌', company: '글로벌스타트업' },
  { title: 'B2B 세일즈 마스터클래스', speaker: '정세일즈', company: '엔터프라이즈솔루션' }
];

// 외부 미팅 목록
const EXTERNAL_MEETINGS = [
  { company: '네이버', purpose: '클라우드 파트너십 논의' },
  { company: '카카오벤처스', purpose: '시드 투자 미팅' },
  { company: '삼성전자', purpose: '협업 프로젝트 제안' },
  { company: 'AWS', purpose: '스타트업 프로그램 설명회' }
];

/**
 * 캘린더 이벤트 생성 클래스
 */
export class CalendarService {
  private static events: CalendarEvent[] = [];
  private static initialized = false;
  private static readonly STORAGE_KEY = 'pocketbuildup_calendar_events';
  private static readonly STORAGE_VERSION = '1.1'; // Bumped version to regenerate data

  /**
   * LocalStorage에서 데이터 로드
   */
  private static loadFromStorage(): CalendarEvent[] | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // 버전 체크
      if (parsed.version !== this.STORAGE_VERSION) {
        console.warn('Calendar data version mismatch, regenerating...');
        return null;
      }

      // Date 객체 복원
      const events = parsed.events.map((e: any) => ({
        ...e,
        date: new Date(e.date),
        meetingData: e.meetingData ? {
          ...e.meetingData,
          날짜: new Date(e.meetingData.날짜),
          createdAt: e.meetingData.createdAt ? new Date(e.meetingData.createdAt) : undefined,
          updatedAt: e.meetingData.updatedAt ? new Date(e.meetingData.updatedAt) : undefined
        } : undefined,
        createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
        updatedAt: e.updatedAt ? new Date(e.updatedAt) : undefined
      }));

      return events;
    } catch (error) {
      console.error('Failed to load calendar data from storage:', error);
      return null;
    }
  }

  /**
   * LocalStorage에 데이터 저장
   */
  private static saveToStorage(): void {
    try {
      const data = {
        version: this.STORAGE_VERSION,
        events: this.events,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save calendar data to storage:', error);
    }
  }

  /**
   * 초기화 (한 번만 실행)
   */
  static initialize(projects: Project[]): CalendarEvent[] {
    if (this.initialized) return this.events;

    // LocalStorage에서 먼저 로드 시도
    const storedEvents = this.loadFromStorage();

    if (storedEvents && storedEvents.length > 0) {
      this.events = storedEvents;
      console.log(`Loaded ${storedEvents.length} events from LocalStorage`);
    } else {
      // 저장된 데이터가 없으면 새로 생성
      this.events = [];
      this.generateEvents(projects);
      this.saveToStorage(); // 생성된 데이터 저장
      console.log(`Generated ${this.events.length} new events`);
    }

    this.initialized = true;
    return this.events;
  }

  /**
   * 이벤트 생성 (2025년 8월 말 ~ 9월 말)
   */
  private static generateEvents(projects: Project[]): void {
    const startDate = new Date('2025-08-25'); // 8월 마지막 주
    const endDate = new Date('2025-09-30');   // 9월 말

    let eventIdCounter = 1;
    let currentDate = new Date(startDate);

    // 1. 프로젝트별 PM 미팅 생성 (월 1회)
    projects.forEach((project, projectIndex) => {
      const pm = PM_POOL[projectIndex % PM_POOL.length];
      let sessionCount = 1;

      // 매월 첫째 주 화요일 PM 미팅
      let meetingDate = new Date(startDate);
      meetingDate.setDate(1); // 월초로 설정
      meetingDate.setDate(meetingDate.getDate() + ((2 - meetingDate.getDay() + 7) % 7)); // 첫째 주 화요일

      while (meetingDate <= endDate) {
        this.events.push(this.createPMMeeting(
          `evt-${eventIdCounter++}`,
          project,
          pm,
          new Date(meetingDate),
          sessionCount++
        ));

        // 다음 달로 이동
        meetingDate.setMonth(meetingDate.getMonth() + 1);
        meetingDate.setDate(1);
        meetingDate.setDate(meetingDate.getDate() + ((2 - meetingDate.getDay() + 7) % 7)); // 첫째 주 화요일
      }

      // 2. 프로젝트 진행 미팅 (주 1회, 목요일)
      let projectMeetingDate = new Date(startDate);
      projectMeetingDate.setDate(projectMeetingDate.getDate() + ((4 - projectMeetingDate.getDay() + 7) % 7));
      let projectSessionCount = 1;

      while (projectMeetingDate <= endDate) {
        const meetingPurpose = projectSessionCount === 1 ? 'kickoff' :
                               projectSessionCount <= 3 ? 'progress' :
                               projectSessionCount <= 5 ? 'review' : 'progress';

        this.events.push(this.createProjectMeeting(
          `evt-${eventIdCounter++}`,
          project,
          pm,
          new Date(projectMeetingDate),
          meetingPurpose as any
        ));

        projectMeetingDate.setDate(projectMeetingDate.getDate() + 7); // 1주 후
        projectSessionCount++;
      }
    });

    // 3. 포켓멘토 온라인 강의 (매주 수요일)
    let lectureDate = new Date(startDate);
    lectureDate.setDate(lectureDate.getDate() + ((3 - lectureDate.getDay() + 7) % 7));
    let lectureSessionCount = 1;

    while (lectureDate <= endDate && projects.length > 0) {
      const instructor = INSTRUCTOR_POOL[lectureSessionCount % INSTRUCTOR_POOL.length];
      const projectIndex = lectureSessionCount % projects.length;

      this.events.push(this.createOnlineLecture(
        `evt-${eventIdCounter++}`,
        projects[projectIndex],
        instructor,
        new Date(lectureDate),
        lectureSessionCount
      ));

      lectureDate.setDate(lectureDate.getDate() + 7);
      lectureSessionCount++;
    }

    // 4. 포켓 웨비나 (격주 금요일)
    let webinarDate = new Date(startDate);
    webinarDate.setDate(webinarDate.getDate() + ((5 - webinarDate.getDay() + 7) % 7));
    let webinarIndex = 0;

    while (webinarDate <= endDate && webinarIndex < WEBINAR_TOPICS.length) {
      const webinar = WEBINAR_TOPICS[webinarIndex];

      this.events.push(this.createWebinar(
        `evt-${eventIdCounter++}`,
        webinar,
        new Date(webinarDate)
      ));

      webinarDate.setDate(webinarDate.getDate() + 14); // 격주
      webinarIndex++;
    }

    // 5. 외부 미팅 (랜덤하게 배치)
    const externalDates = [
      new Date('2025-08-29'),
      new Date('2025-09-05'),
      new Date('2025-09-12'),
      new Date('2025-09-19')
    ];

    externalDates.forEach((date, index) => {
      if (index < EXTERNAL_MEETINGS.length && projects.length > 0) {
        const external = EXTERNAL_MEETINGS[index];
        const project = projects[index % projects.length];

        this.events.push(this.createExternalMeeting(
          `evt-${eventIdCounter++}`,
          project,
          external,
          date
        ));
      }
    });

    // 날짜순 정렬
    this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * PM 정기 미팅 생성
   */
  private static createPMMeeting(
    id: string,
    project: Project,
    pm: typeof PM_POOL[0],
    date: Date,
    sessionCount: number
  ): CalendarEvent {
    const meetingData: EnhancedMeetingData = {
      meetingType: 'pm_meeting',
      title: `${sessionCount}차 PM 월례미팅`,
      날짜: date,
      시작시간: '14:00',
      종료시간: '15:00',
      location: 'online',
      meetingLink: `https://zoom.us/j/${Math.random().toString(36).substr(2, 9)}`,
      status: date < new Date() ? 'completed' : 'scheduled',
      pmMeetingData: {
        담당PM: pm.name,
        PM직함: pm.title,
        세션회차: sessionCount,
        아젠다: `${sessionCount}월차 진행상황 점검 및 월간 목표 설정`
      },
      createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000), // 일주일 전 생성
      updatedAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
      createdBy: pm.id,
      updatedBy: pm.id
    };

    return {
      id,
      title: `[PM미팅] ${project.title}`,
      type: 'meeting',
      date,
      time: '14:00',
      duration: 60,
      projectId: project.id,
      projectTitle: project.title,
      projectPhase: project.phase,
      pmId: pm.id,
      pmName: pm.name,
      status: meetingData.status,
      priority: 'high',
      meetingData,
      actionHistory: [],
      createdAt: meetingData.createdAt,
      updatedAt: meetingData.updatedAt,
      createdBy: pm.id,
      updatedBy: pm.id
    };
  }

  /**
   * 빌드업 프로젝트 미팅 생성
   */
  private static createProjectMeeting(
    id: string,
    project: Project,
    pm: typeof PM_POOL[0],
    date: Date,
    purpose: 'kickoff' | 'progress' | 'review' | 'closing'
  ): CalendarEvent {
    const purposeLabels = {
      kickoff: '킥오프',
      progress: '진행점검',
      review: '중간리뷰',
      closing: '마무리'
    };

    const meetingData: EnhancedMeetingData = {
      meetingType: 'buildup_project',
      title: `${project.title} ${purposeLabels[purpose]} 미팅`,
      날짜: date,
      시작시간: '10:00',
      종료시간: '11:30',
      location: purpose === 'kickoff' ? 'offline' : 'online',
      offlineLocation: purpose === 'kickoff' ? '역삼 위워크 회의실 3A' : undefined,
      meetingLink: purpose !== 'kickoff' ? `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}` : undefined,
      status: date < new Date() ? 'completed' : 'scheduled',
      buildupProjectData: {
        프로젝트명: project.title,
        프로젝트ID: project.id,
        미팅목적: purpose,
        PM명: pm.name,
        참여자목록: project.team?.members?.map(m => m.name) || [],
        아젠다: `프로젝트 ${purposeLabels[purpose]} 및 다음 단계 논의`
      },
      createdAt: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000),
      createdBy: pm.id,
      updatedBy: pm.id
    };

    return {
      id,
      title: `[${purposeLabels[purpose]}] ${project.title}`,
      type: 'meeting',
      date,
      time: '10:00',
      duration: 90,
      projectId: project.id,
      projectTitle: project.title,
      projectPhase: project.phase,
      pmId: pm.id,
      pmName: pm.name,
      status: meetingData.status,
      priority: purpose === 'kickoff' ? 'critical' : 'medium',
      meetingData,
      actionHistory: [],
      createdAt: meetingData.createdAt,
      updatedAt: meetingData.updatedAt,
      createdBy: pm.id,
      updatedBy: pm.id
    };
  }

  /**
   * 포켓멘토 온라인 강의 생성
   */
  private static createOnlineLecture(
    id: string,
    project: Project,
    instructor: typeof INSTRUCTOR_POOL[0],
    date: Date,
    sessionCount: number
  ): CalendarEvent {
    const meetingData: EnhancedMeetingData = {
      meetingType: 'pocket_mentor',
      title: `포켓멘토 ${sessionCount}주차 온라인 강의`,
      날짜: date,
      시작시간: '19:00',
      종료시간: '21:00',
      location: 'online',
      meetingLink: `https://edu.pocketbiz.com/lecture/${sessionCount}`,
      status: date < new Date() ? 'completed' : 'scheduled',
      pocketMentorData: {
        멘토명: instructor.name,
        멘토직함: instructor.title,
        세션주제: instructor.topic,
        세션회차: sessionCount,
        강의자료: `https://edu.pocketbiz.com/materials/week${sessionCount}`,
        과제: sessionCount < 4 ? `${sessionCount + 1}주차 사전 학습 자료 검토` : undefined
      },
      createdAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000),
      createdBy: 'system',
      updatedBy: 'system'
    };

    return {
      id,
      title: `[온라인강의] ${instructor.topic}`,
      type: 'meeting',
      date,
      time: '19:00',
      duration: 120,
      projectId: project.id,
      projectTitle: project.title,
      projectPhase: project.phase,
      pmId: 'system',
      pmName: '포켓비즈',
      status: meetingData.status,
      priority: 'low',
      meetingData,
      actionHistory: [],
      createdAt: meetingData.createdAt,
      updatedAt: meetingData.updatedAt,
      createdBy: 'system',
      updatedBy: 'system'
    };
  }

  /**
   * 포켓 웨비나 생성
   */
  private static createWebinar(
    id: string,
    webinar: typeof WEBINAR_TOPICS[0],
    date: Date
  ): CalendarEvent {
    const meetingData: EnhancedMeetingData = {
      meetingType: 'pocket_webinar',
      title: webinar.title,
      날짜: date,
      시작시간: '19:00',
      종료시간: '21:00',
      location: 'online',
      meetingLink: 'https://youtube.com/live/xxxxx',
      status: date < new Date() ? 'completed' : 'scheduled',
      pocketWebinarData: {
        웨비나제목: webinar.title,
        발표자: webinar.speaker,
        발표자소속: webinar.company,
        예상참여자수: 100,
        실제참여자수: date < new Date() ? Math.floor(Math.random() * 50) + 50 : undefined,
        웨비나링크: 'https://youtube.com/live/xxxxx',
        발표자료: date < new Date() ? 'https://slides.com/webinar' : undefined
      },
      createdAt: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000), // 2주 전 공지
      updatedAt: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000),
      createdBy: 'system',
      updatedBy: 'system'
    };

    return {
      id,
      title: `[웨비나] ${webinar.title}`,
      type: 'meeting',
      date,
      time: '19:00',
      duration: 120,
      projectId: 'all', // 모든 프로젝트 대상
      projectTitle: '전체',
      projectPhase: 'planning',
      pmId: 'system',
      pmName: '포켓비즈',
      status: meetingData.status,
      priority: 'low',
      meetingData,
      actionHistory: [],
      tags: ['웨비나', '교육', '온라인'],
      createdAt: meetingData.createdAt,
      updatedAt: meetingData.updatedAt,
      createdBy: 'system',
      updatedBy: 'system'
    };
  }

  /**
   * 외부 미팅 생성
   */
  private static createExternalMeeting(
    id: string,
    project: Project,
    external: typeof EXTERNAL_MEETINGS[0],
    date: Date
  ): CalendarEvent {
    const meetingData: EnhancedMeetingData = {
      meetingType: 'external',
      title: `${external.company} 미팅`,
      날짜: date,
      시작시간: '15:00',
      종료시간: '16:00',
      location: 'offline',
      offlineLocation: `${external.company} 본사`,
      status: date < new Date() ? 'completed' : 'scheduled',
      externalMeetingData: {
        미팅제목: `${external.company} ${external.purpose}`,
        회사명: external.company,
        담당자명: `${external.company} 담당자`,
        미팅목적: external.purpose,
        장소: `${external.company} 본사 회의실`
      },
      createdAt: new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(date.getTime() - 2 * 24 * 60 * 60 * 1000),
      createdBy: project.team?.pm?.id || 'system',
      updatedBy: project.team?.pm?.id || 'system'
    };

    return {
      id,
      title: `[외부] ${external.company}`,
      type: 'meeting',
      date,
      time: '15:00',
      duration: 60,
      projectId: project.id,
      projectTitle: project.title,
      projectPhase: project.phase,
      pmId: project.team?.pm?.id || 'system',
      pmName: project.team?.pm?.name || '담당PM',
      status: meetingData.status,
      priority: 'high',
      meetingData,
      actionHistory: [],
      tags: ['외부미팅', external.company],
      createdAt: meetingData.createdAt,
      updatedAt: meetingData.updatedAt,
      createdBy: project.team?.pm?.id || 'system',
      updatedBy: project.team?.pm?.id || 'system'
    };
  }

  /**
   * 모든 이벤트 가져오기
   */
  static getAllEvents(): CalendarEvent[] {
    return this.events;
  }

  /**
   * 프로젝트별 이벤트 가져오기
   */
  static getEventsByProject(projectId: string): CalendarEvent[] {
    return this.events.filter(e => e.projectId === projectId || e.projectId === 'all');
  }

  /**
   * 날짜 범위별 이벤트 가져오기
   */
  static getEventsByDateRange(startDate: Date, endDate: Date): CalendarEvent[] {
    return this.events.filter(e => e.date >= startDate && e.date <= endDate);
  }

  /**
   * 미팅 타입별 이벤트 가져오기
   */
  static getEventsByMeetingType(meetingType: MeetingType): CalendarEvent[] {
    return this.events.filter(e => {
      const meetingData = e.meetingData as EnhancedMeetingData;
      return meetingData.meetingType === meetingType;
    });
  }

  /**
   * 이벤트 추가 (POST /api/meetings)
   */
  static addEvent(event: CalendarEvent): CalendarEvent {
    this.events.push(event);
    this.events.sort((a, b) => a.date.getTime() - b.date.getTime());
    this.saveToStorage(); // LocalStorage에 저장
    return event;
  }

  /**
   * 이벤트 업데이트 (PUT /api/meetings/:id)
   */
  static updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return null;

    this.events[index] = { ...this.events[index], ...updates };
    this.saveToStorage(); // LocalStorage에 저장
    return this.events[index];
  }

  /**
   * 이벤트 삭제 (DELETE /api/meetings/:id)
   */
  static deleteEvent(id: string): boolean {
    const index = this.events.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.events.splice(index, 1);
    this.saveToStorage(); // LocalStorage에 저장
    return true;
  }

  /**
   * 통계 데이터 가져오기
   */
  static getStatistics() {
    const total = this.events.length;
    const completed = this.events.filter(e => e.status === 'completed').length;
    const scheduled = this.events.filter(e => e.status === 'scheduled').length;
    const cancelled = this.events.filter(e => e.status === 'cancelled').length;

    const byType: Record<MeetingType, number> = {
      pm_meeting: 0,
      pocket_mentor: 0,
      buildup_project: 0,
      pocket_webinar: 0,
      external: 0
    };

    this.events.forEach(event => {
      const meetingData = event.meetingData as EnhancedMeetingData;
      if (meetingData.meetingType) {
        byType[meetingData.meetingType]++;
      }
    });

    return {
      total,
      completed,
      scheduled,
      cancelled,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      byType
    };
  }

  /**
   * 데이터 리셋 (개발용)
   */
  static reset(): void {
    this.events = [];
    this.initialized = false;
    localStorage.removeItem(this.STORAGE_KEY); // LocalStorage 클리어
  }

  /**
   * LocalStorage 데이터 클리어 (캐시 클리어용)
   */
  static clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Calendar data cleared from LocalStorage');
  }

  /**
   * 강제로 LocalStorage에 현재 상태 저장
   */
  static forceSave(): void {
    this.saveToStorage();
    console.log('Calendar data force saved to LocalStorage');
  }
}