/**
 * 캘린더 LocalStorage 테스트 유틸리티
 * 브라우저 콘솔에서 실행할 수 있는 테스트 함수들
 */

import { CalendarService } from '../services/calendarService';

/**
 * LocalStorage 데이터 확인
 */
export function checkStorageData() {
  const storageKey = 'pocketbuildup_calendar_events';
  const data = localStorage.getItem(storageKey);

  if (data) {
    const parsed = JSON.parse(data);
    console.log(`- Version: ${parsed.version}`);
    console.log(`- Events Count: ${parsed.events?.length || 0}`);
    console.log(`- Last Updated: ${parsed.lastUpdated}`);

    if (parsed.events && parsed.events.length > 0) {
      parsed.events.slice(0, 3).forEach((e: any, i: number) => {
        console.log(`  ${i + 1}. ${e.title} - ${new Date(e.date).toLocaleDateString('ko-KR')}`);
      });
    }

    return parsed;
  } else {
    return null;
  }
}

/**
 * 테스트용 이벤트 추가
 */
export function addTestEvent() {
  const testEvent = {
    id: `test-${Date.now()}`,
    title: `[테스트] LocalStorage 테스트 이벤트`,
    type: 'meeting' as const,
    date: new Date(),
    time: '15:00',
    duration: 60,
    projectId: 'test-project',
    projectTitle: '테스트 프로젝트',
    projectPhase: 'planning' as const,
    pmId: 'test-pm',
    pmName: '테스트 PM',
    status: 'scheduled' as const,
    priority: 'high' as const,
    meetingData: {
      meetingType: 'pm_meeting' as const,
      title: '테스트 미팅',
      날짜: new Date(),
      시작시간: '15:00',
      종료시간: '16:00',
      location: 'online' as const,
      meetingLink: 'https://test.com',
      status: 'scheduled' as const,
      pmMeetingData: {
        담당PM: '테스트 PM',
        PM직함: 'Test PM',
        세션회차: 1,
        아젠다: 'LocalStorage 테스트'
      }
    },
    actionHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'test-user',
    updatedBy: 'test-user'
  };

  const addedEvent = CalendarService.addEvent(testEvent);

  return addedEvent;
}

/**
 * LocalStorage 클리어 테스트
 */
export function clearStorageTest() {
  CalendarService.clearStorage();
  checkStorageData();
}

/**
 * 강제 저장 테스트
 */
export function forceSaveTest() {
  CalendarService.forceSave();
  checkStorageData();
}

/**
 * 데이터 영속성 테스트 (페이지 리프레시 전후 비교)
 */
export function persistenceTest() {
  const before = checkStorageData();

  if (!before) {
    return;
  }

  const testEvent = addTestEvent();

  const after = checkStorageData();

  console.log(`Before: ${before.events?.length || 0} events`);
  console.log(`After: ${after?.events?.length || 0} events`);

  return { before, after, testEvent };
}

// 브라우저 콘솔에서 쉽게 접근할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).calendarStorage = {
    check: checkStorageData,
    addTest: addTestEvent,
    clear: clearStorageTest,
    forceSave: forceSaveTest,
    testPersistence: persistenceTest
  };

}