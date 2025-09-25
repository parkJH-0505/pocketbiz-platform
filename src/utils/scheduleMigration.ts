/**
 * Schedule Migration Utility
 * 기존 일정들을 2025년 9월로 이동시키는 유틸리티
 */

interface ScheduleData {
  id: string;
  title: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
  [key: string]: any;
}

/**
 * 일정을 2025년 9월로 이동
 */
export function migrateSchedulesToSeptember2025() {

  try {
    // ScheduleContext 데이터 마이그레이션
    const scheduleStorageKey = 'pocket_biz_schedules';
    const schedulesData = localStorage.getItem(scheduleStorageKey);

    if (schedulesData) {
      const schedules: ScheduleData[] = JSON.parse(schedulesData);

      const migratedSchedules = schedules.map(schedule => {
        const originalStart = new Date(schedule.startDateTime);
        const originalEnd = new Date(schedule.endDateTime);

        // 유효한 날짜인지 확인
        if (isNaN(originalStart.getTime()) || isNaN(originalEnd.getTime())) {
          console.warn('⚠️ Invalid date found, skipping:', schedule);
          return schedule;
        }

        // 2025년 9월로 이동 (원래 일자를 유지하면서 연월만 변경)
        const newStart = new Date(2025, 8, originalStart.getDate(), originalStart.getHours(), originalStart.getMinutes());
        const newEnd = new Date(2025, 8, originalEnd.getDate(), originalEnd.getHours(), originalEnd.getMinutes());

        // 9월 31일이 없으므로 30일로 조정
        if (newStart.getDate() > 30) {
          newStart.setDate(30);
        }
        if (newEnd.getDate() > 30) {
          newEnd.setDate(30);
        }

        const updatedSchedule = {
          ...schedule,
          startDateTime: newStart.toISOString(),
          endDateTime: newEnd.toISOString(),
          date: newStart, // 캘린더에서 사용하는 date 필드도 업데이트
          updatedAt: new Date().toISOString()
        };

        return updatedSchedule;
      });

      // 업데이트된 데이터 저장
      localStorage.setItem(scheduleStorageKey, JSON.stringify(migratedSchedules));
    }

    // CalendarContext 데이터 마이그레이션 (만약 있다면)
    const calendarStorageKey = 'calendarEvents';
    const calendarData = localStorage.getItem(calendarStorageKey);

    if (calendarData) {
      const events = JSON.parse(calendarData);

      const migratedEvents = events.map((event: any) => {
        if (event.date) {
          const originalDate = new Date(event.date);
          if (!isNaN(originalDate.getTime())) {
            const newDate = new Date(2025, 8, originalDate.getDate(), originalDate.getHours(), originalDate.getMinutes());
            if (newDate.getDate() > 30) {
              newDate.setDate(30);
            }

            return {
              ...event,
              date: newDate.toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        }
        return event;
      });

      localStorage.setItem(calendarStorageKey, JSON.stringify(migratedEvents));
    }

    // 마지막 동기화 시간 업데이트
    localStorage.setItem('pocket_biz_schedules_last_sync', new Date().toISOString());


    // ScheduleContext에 새로고침 이벤트 발생
    const finalSchedulesData = localStorage.getItem('pocket_biz_schedules');
    const migratedCount = finalSchedulesData ? JSON.parse(finalSchedulesData).length : 0;

    const refreshEvent = new CustomEvent('schedule:migration_completed', {
      detail: {
        migratedCount: migratedCount,
        timestamp: new Date()
      }
    });
    window.dispatchEvent(refreshEvent);

  } catch (error) {
    console.error('❌ Schedule migration failed:', error);
    alert('일정 마이그레이션 중 오류가 발생했습니다: ' + error.message);
  }
}

/**
 * 프로젝트 미팅들을 2025년 9월로 마이그레이션
 */
export function migrateProjectMeetingsToSeptember2025() {

  try {
    // BuildupContext의 projects 데이터에서 미팅 날짜 업데이트
    const projectsStorageKey = 'buildup_projects';
    const projectsData = localStorage.getItem(projectsStorageKey);

    if (projectsData) {
      const projects = JSON.parse(projectsData);

      let totalMigratedMeetings = 0;

      const updatedProjects = projects.map((project: any) => {
        if (project.meetings && project.meetings.length > 0) {

          const migratedMeetings = project.meetings.map((meeting: any) => {
            const originalDate = new Date(meeting.date);
            if (isNaN(originalDate.getTime())) {
              console.warn('⚠️ Invalid meeting date found, skipping:', meeting);
              return meeting;
            }

            // 2025년 9월로 이동 (원래 일자를 유지하면서 연월만 변경)
            const newDate = new Date(2025, 8, originalDate.getDate(), originalDate.getHours(), originalDate.getMinutes());

            // 9월 31일이 없으므로 30일로 조정
            if (newDate.getDate() > 30) {
              newDate.setDate(30);
            }

            totalMigratedMeetings++;

            return {
              ...meeting,
              date: newDate,
              updatedAt: new Date().toISOString()
            };
          });

          return {
            ...project,
            meetings: migratedMeetings,
            updatedAt: new Date().toISOString()
          };
        }

        return project;
      });

      // 업데이트된 프로젝트 데이터 저장
      localStorage.setItem(projectsStorageKey, JSON.stringify(updatedProjects));
    }

    // 완료 이벤트 발송
    const migrationEvent = new CustomEvent('project:meetings_migrated', {
      detail: {
        timestamp: new Date()
      }
    });
    window.dispatchEvent(migrationEvent);

    alert(`프로젝트 미팅 마이그레이션이 완료되었습니다!\n페이지를 새로고침하여 변경사항을 확인하세요.`);

    // 페이지 새로고침
    window.location.reload();

  } catch (error) {
    console.error('❌ Project meetings migration failed:', error);
    alert('프로젝트 미팅 마이그레이션 중 오류가 발생했습니다: ' + (error as Error).message);
  }
}

/**
 * 특정 날짜 범위의 일정들을 9월로 스케줄링
 */
export function createSampleSchedulesForSeptember() {

  const sampleSchedules = [
    {
      id: `schedule_${Date.now()}_1`,
      type: 'buildup_project',
      title: '빌드업 프로젝트 킥오프 미팅',
      description: '프로젝트 시작을 위한 킥오프 미팅',
      startDateTime: new Date(2025, 8, 20, 10, 0).toISOString(), // 9월 20일 오전 10시
      endDateTime: new Date(2025, 8, 20, 11, 30).toISOString(),
      location: '온라인',
      isOnline: true,
      onlineLink: 'https://meet.google.com/abc-def-ghi',
      status: 'scheduled',
      priority: 'high',
      participants: ['PM팀', '개발팀'],
      tags: ['빌드업', '킥오프'],
      projectId: 'project_1',
      meetingSequence: {
        type: 'guide_1',
        sequenceNumber: 1,
        totalSequences: 5
      },
      pmName: '김프로매니저',
      pmInfo: {
        id: 'pm_1',
        name: '김프로매니저',
        email: 'pm@example.com',
        phone: '010-1234-5678'
      },
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    },
    {
      id: `schedule_${Date.now()}_2`,
      type: 'mentor_session',
      title: '포켓멘토 세션 - 마케팅 전략',
      description: '마케팅 전략 멘토링',
      startDateTime: new Date(2025, 8, 23, 14, 0).toISOString(), // 9월 23일 오후 2시
      endDateTime: new Date(2025, 8, 23, 15, 30).toISOString(),
      location: '온라인',
      isOnline: true,
      status: 'scheduled',
      priority: 'medium',
      participants: ['멘토', '멘티'],
      tags: ['멘토링', '마케팅'],
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    },
    {
      id: `schedule_${Date.now()}_3`,
      type: 'webinar',
      title: '스타트업 투자 유치 웨비나',
      description: '투자 유치 전략과 IR 자료 작성법',
      startDateTime: new Date(2025, 8, 25, 19, 0).toISOString(), // 9월 25일 오후 7시
      endDateTime: new Date(2025, 8, 25, 20, 30).toISOString(),
      location: '온라인',
      isOnline: true,
      status: 'scheduled',
      priority: 'medium',
      participants: ['강연자', '참석자들'],
      tags: ['웨비나', '투자'],
      createdAt: new Date().toISOString(),
      createdBy: 'system'
    }
  ];

  // 기존 스케줄에 추가
  const existingSchedules = JSON.parse(localStorage.getItem('pocket_biz_schedules') || '[]');
  const allSchedules = [...existingSchedules, ...sampleSchedules];

  localStorage.setItem('pocket_biz_schedules', JSON.stringify(allSchedules));
  localStorage.setItem('pocket_biz_schedules_last_sync', new Date().toISOString());


  // 페이지 새로고침으로 변경사항 적용
  window.location.reload();
}

// 전역에서 사용할 수 있도록 등록
if (typeof window !== 'undefined') {
  (window as any).scheduleMigration = {
    migrateToSeptember2025: migrateSchedulesToSeptember2025,
    migrateProjectMeetings: migrateProjectMeetingsToSeptember2025,
    createSampleSchedules: createSampleSchedulesForSeptember
  };
}