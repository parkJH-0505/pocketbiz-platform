# Sprint 2: Context Bridge 구현 상세 계획

## 🎯 목표
모든 Context를 중앙에서 관리하는 GlobalContextManager를 구축하여 Context 간 통신을 체계화

## 📊 현재 상황
- ✅ Sprint 1 완료: Window 객체를 통한 임시 Bridge 구현
- ⚠️ 문제점: 각 Context가 개별적으로 window에 노출 (비체계적)
- 🎯 목표: 중앙 관리 시스템으로 통합

## 🔧 4단계 구현 계획

### Stage 1: Global Context Manager 설계 및 기초 구현
**목표**: 중앙 관리자 역할을 하는 Manager 구조 설계

#### Step 1.1: GlobalContextManager 인터페이스 설계
```typescript
// 어떤 기능이 필요한가?
- Context 등록/해제
- Context 조회
- Context 간 통신
- 상태 모니터링
```

#### Step 1.2: 기본 Manager 클래스 생성
- `src/utils/globalContextManager.ts` 파일 생성
- 싱글톤 패턴 구현 (전체 앱에서 하나만 존재)
- 기본 메서드 구조 정의

#### Step 1.3: Context 타입 정의
- 모든 Context의 공통 인터페이스 정의
- TypeScript 타입 안정성 확보

### Stage 2: Context Registry 구현
**목표**: 모든 Context를 등록하고 관리하는 시스템 구축

#### Step 2.1: Registry 시스템 구현
```typescript
// Context 저장소
- Map 구조로 Context 저장
- 이름으로 Context 접근
- 중복 등록 방지
```

#### Step 2.2: 자동 등록 메커니즘
- 각 Context가 마운트될 때 자동 등록
- unmount 시 자동 해제
- React Hook 활용 (useContextRegistration)

#### Step 2.3: Context 메타데이터 관리
- Context 이름, 버전, 의존성 정보
- 준비 상태 추적
- 에러 상태 관리

### Stage 3: Bridge 통합 및 마이그레이션
**목표**: 기존 Context들을 새 시스템으로 마이그레이션

#### Step 3.1: 주요 Context 마이그레이션
순서별 마이그레이션:
1. ToastContext (가장 단순)
2. ScheduleContext
3. BuildupContext
4. ChatContext
5. 나머지 Context들

#### Step 3.2: Window Bridge 교체
- 기존 window.xxxContext 제거
- GlobalContextManager로 통합
- 하위 호환성 유지 (임시)

#### Step 3.3: Cross-Context 통신 구현
- Context 간 메시지 전달
- 이벤트 기반 통신
- 타입 안전 보장

### Stage 4: 검증 및 테스트
**목표**: 새 시스템이 안정적으로 작동하는지 확인

#### Step 4.1: 단위 테스트
- Manager 기능 테스트
- Registry 동작 테스트
- 통신 메커니즘 테스트

#### Step 4.2: 통합 테스트
- 실제 Context 등록/해제
- Context 간 통신 테스트
- 에러 처리 테스트

#### Step 4.3: 시각화 도구 구현
- Context 상태 대시보드
- 실시간 모니터링
- 디버깅 도구

#### Step 4.4: 문서화 및 마무리
- 사용 가이드 작성
- API 문서화
- 마이그레이션 가이드

## 📈 예상 효과

### Before (현재)
```javascript
// 각자 따로 노출
window.scheduleContext = {...}
window.buildupContext = {...}
window.chatContext = {...}
// 관리가 어려움
```

### After (개선 후)
```javascript
// 중앙 관리
const manager = GlobalContextManager.getInstance();
manager.register('schedule', scheduleContext);
manager.get('schedule').createSchedule(...);
manager.communicate('schedule', 'buildup', data);
```

## 🚦 체크포인트

### Stage 1 완료 조건 ✅
- [x] GlobalContextManager 클래스 생성
- [x] 기본 메서드 구현
- [x] TypeScript 타입 정의

### Stage 2 완료 조건 ✅
- [x] Registry 시스템 작동
- [x] 자동 등록 Hook 구현
- [x] 메타데이터 관리 가능

### Stage 3 완료 조건 ✅
- [x] 3개 Context 마이그레이션 (Toast, Schedule, Buildup)
- [x] Window bridge 제거
- [x] Cross-context 통신 작동

### Stage 4 완료 조건 ⏳
- [ ] 모든 테스트 통과
- [ ] 시각화 도구 작동
- [ ] 문서화 완료

## ✅ 완료 현황 (2025-01-23)

### 구현 완료된 기능
1. **GlobalContextManager** (`src/utils/globalContextManager.ts`)
   - 싱글톤 패턴 구현
   - Context Registry 시스템
   - 메시지 전송 및 이벤트 시스템
   - 메트릭 수집 기능

2. **Context Registration Hook** (`src/hooks/useContextRegistration.ts`)
   - 자동 등록/해제
   - 의존성 대기 메커니즘
   - 생명주기 관리

3. **Context Metadata System** (`src/utils/contextMetadata.ts`)
   - 의존성 그래프
   - 초기화 순서 계산
   - 순환 의존성 검사

4. **Context Bridge** (`src/utils/contextBridge.ts`)
   - Context 간 안전한 통신
   - 메서드 호출 및 상태 조회
   - 브로드캐스트 기능

5. **Context 마이그레이션**
   - ToastContext ✅
   - ScheduleContext ✅
   - BuildupContext ✅

### 테스트 페이지
- `/startup/context-test` - Stage 1 테스트
- `/startup/registry-test` - Stage 2 테스트
- `/startup/bridge-test` - Stage 3 통합 테스트

## 💡 비개발자를 위한 설명

### 현재 상황 (Sprint 1 후)
- 각 부서(Context)가 게시판(window)에 연락처를 붙여놓은 상태
- 찾기는 가능하지만 체계적이지 않음

### Sprint 2 목표
- **중앙 전화번호부** 만들기 (GlobalContextManager)
- 모든 부서를 **한 곳에서 관리**
- 부서 간 **공식 소통 채널** 구축

### 예시
- **Before**: "영업팀 어디 있지?" → 게시판 뒤지기
- **After**: "관리자님, 영업팀 연결해주세요" → 즉시 연결

## ⏰ 예상 소요 시간
- Stage 1: 2-3시간
- Stage 2: 3-4시간
- Stage 3: 4-5시간
- Stage 4: 2-3시간
- **총 예상**: 11-15시간 (Day 3-4)

## 🚀 시작 준비
1. Sprint 1 검증 완료 확인
2. 개발 환경 정상 작동
3. Stage 1부터 순차 진행