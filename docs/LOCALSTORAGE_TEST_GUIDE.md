# 📦 캘린더 LocalStorage 영속성 테스트 가이드

## 개요
캘린더 이벤트가 LocalStorage에 자동으로 저장되어, 페이지 새로고침 후에도 데이터가 유지됩니다.

## 테스트 방법

### 1. 브라우저 콘솔 열기
- Chrome: F12 → Console 탭
- 개발 서버 실행 중: http://localhost:5181/

### 2. 사용 가능한 테스트 명령어

```javascript
// 현재 저장된 데이터 확인
calendarStorage.check()

// 테스트 이벤트 추가
calendarStorage.addTest()

// 데이터 영속성 테스트
calendarStorage.testPersistence()

// 저장소 클리어
calendarStorage.clear()

// 강제 저장
calendarStorage.forceSave()
```

### 3. 영속성 검증 시나리오

#### 시나리오 1: 기본 저장 테스트
1. `calendarStorage.check()` 실행 → 현재 이벤트 개수 확인
2. `calendarStorage.addTest()` 실행 → 테스트 이벤트 추가
3. 페이지 새로고침 (F5)
4. `calendarStorage.check()` 다시 실행 → 이벤트가 유지되는지 확인

#### 시나리오 2: 캘린더에서 직접 추가
1. 빌드업 대시보드 → 빌드업 캘린더 탭 이동
2. "일정 추가" 버튼 클릭
3. 새 미팅 정보 입력 후 저장
4. 페이지 새로고침
5. 추가한 일정이 유지되는지 확인

#### 시나리오 3: 이벤트 수정/삭제
1. 캘린더에서 기존 이벤트 수정
2. 페이지 새로고침
3. 수정사항이 유지되는지 확인

### 4. LocalStorage 직접 확인
브라우저 개발자 도구에서:
1. Application 탭 → Storage → Local Storage
2. `pocketbuildup_calendar_events` 키 확인
3. 저장된 JSON 데이터 구조 확인

## 저장 구조

```json
{
  "version": "1.0",
  "events": [
    {
      "id": "evt-001",
      "title": "[PM미팅] AI 스타트업 플랫폼",
      "type": "meeting",
      "date": "2025-09-16T00:00:00.000Z",
      "meetingData": {
        "meetingType": "pm_meeting",
        "담당PM": "김철수",
        "세션회차": 3
        // ...
      }
    }
    // ...
  ],
  "lastUpdated": "2025-09-16T15:00:00.000Z"
}
```

## 주요 기능

### 자동 저장
- 이벤트 추가 시 자동 저장
- 이벤트 수정 시 자동 저장
- 이벤트 삭제 시 자동 저장

### 데이터 로드
- 페이지 로드 시 LocalStorage에서 데이터 복원
- 버전 체크로 호환성 유지
- Date 객체 자동 복원

### 데이터 초기화
- LocalStorage에 데이터 없을 경우 더미데이터 생성
- 버전 불일치 시 재생성

## 트러블슈팅

### 데이터가 저장되지 않는 경우
1. 브라우저 LocalStorage 용량 확인 (5MB 제한)
2. 시크릿 모드 확인 (LocalStorage 제한)
3. 콘솔 에러 확인

### 데이터 초기화가 필요한 경우
```javascript
// 완전 초기화
calendarStorage.clear()
// 페이지 새로고침으로 새 데이터 생성
location.reload()
```

## 개발자 노트
- LocalStorage 키: `pocketbuildup_calendar_events`
- 버전: `1.0`
- 최대 저장 가능 이벤트: 약 1000개 (5MB 제한 내)