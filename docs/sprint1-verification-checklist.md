# Sprint 1 검증 체크리스트

## 🚀 테스트 페이지 접근
- URL: http://localhost:5173/startup/verify
- 접속 후 "테스트 실행" 버튼 클릭

## ✅ 자동 테스트 항목 (8개)

### 1. ToastContext 연결
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: showSuccess/showError 함수 에러 없음

### 2. Window Context 노출
- **예상 결과**: ✅ 정상 작동
- **확인 방법**:
  ```javascript
  // 브라우저 콘솔에서 확인
  window.scheduleContext // 존재해야 함
  window.buildupContext // 존재해야 함
  window.__DEBUG_CONTEXTS__ // 존재해야 함
  ```

### 3. Context Ready 시스템
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: 모든 Context가 준비 상태

### 4. Phase Transition Queue
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: Queue가 Context를 기다리고 정상 작동

### 5. Unknown ProjectId 처리
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: Invalid projectId로 마이그레이션 시도 안함

### 6. 마이그레이션 재시도 제한
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: 최대 3회 재시도 후 중단

### 7. 콘솔 에러 없음
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: 페이지 로드 시 에러 없음

### 8. 무한 루프 없음
- **예상 결과**: ✅ 정상 작동
- **확인 방법**: console.log 무한 출력 없음

## 🔍 수동 검증 체크리스트

### 콘솔 확인 사항
- [ ] 브라우저 콘솔 열기 (F12)
- [ ] 페이지 새로고침 (F5)
- [ ] 콘솔에 빨간색 에러 메시지 없음
- [ ] "Available methods:" 메시지가 한 번만 출력됨
- [ ] 무한 반복되는 로그 없음

### Context 수동 테스트
```javascript
// 브라우저 콘솔에서 각 명령 실행

// 1. Context 상태 확인
window.__contextStatus__()

// 2. 에러 모니터 보고서
window.__errorMonitor__.printReport()

// 3. 마이그레이션 통계
window.__migrationRetry__.getStatistics()

// 4. Phase Transition Queue 상태
window.transitionQueue?.getAllQueues()

// 5. BuildupContext 메서드 테스트
window.buildupContext?.projects // 프로젝트 배열 확인

// 6. ScheduleContext 메서드 테스트
window.scheduleContext?.getSchedulesByProject // 함수 존재 확인
```

### 기능 동작 확인
- [ ] 대시보드 페이지(/startup/dashboard) 정상 로드
- [ ] 빌드업 페이지(/startup/buildup) 정상 로드
- [ ] 프로젝트 카드 클릭 시 상세 페이지 이동
- [ ] 페이지 전환 시 에러 없음

### 성능 확인
- [ ] 페이지 로딩 속도 정상 (3초 이내)
- [ ] CPU 사용률 정상 (무한 루프 없음)
- [ ] 메모리 누수 없음 (개발자 도구 > Performance 탭)

## 📊 테스트 결과 기록

| 테스트 항목 | 상태 | 메모 |
|------------|------|------|
| 자동 테스트 (8/8 통과) | ✅ | |
| 콘솔 에러 없음 | | |
| Context 노출 확인 | | |
| 무한 루프 없음 | | |
| 페이지 전환 정상 | | |
| 성능 문제 없음 | | |

## 🎯 성공 기준
- 자동 테스트 8개 모두 통과 (100% 성공률)
- 수동 검증 항목 모두 체크
- 콘솔에 Critical Error 없음
- 무한 루프나 성능 문제 없음

## 💡 문제 발생 시 대응
1. 에러 스크린샷 캡처
2. 브라우저 콘솔 로그 복사
3. `window.__errorMonitor__.printReport()` 결과 저장
4. 문제 상황 기록 후 수정 작업 진행

---

**검증 완료 후**: Stage 4.4 (배포 전 최종 체크) 진행