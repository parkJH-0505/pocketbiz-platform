# 포켓비즈 디자인 시스템 가이드

## 📍 참조 경로
**Visible.vc 프로젝트 위치**: `C:\Users\포켓컴퍼니\OneDrive\Desktop\박준홍 자료\visible-vc-project\`

## 🎨 테마 시스템

### 기본 테마 파일
- **원본**: `visible-vc-project/lib/theme.ts`
- **적용**: `src/lib/theme.ts`

### 색상 팔레트
```typescript
// Primary (파란색 계열)
primary: {
  main: "rgb(15, 82, 222)",
  hover: "rgb(12, 66, 178)",
  light: "rgba(15, 82, 222, 0.1)",
  dark: "rgb(10, 54, 146)"
}

// 축별 색상
axis: {
  GO: { main: "rgb(112, 46, 220)", light: "rgba(112, 46, 220, 0.1)" }, // 보라
  EC: { main: "rgb(76, 206, 148)", light: "rgba(76, 206, 148, 0.1)" }, // 초록
  PT: { main: "rgb(251, 146, 60)", light: "rgba(251, 146, 60, 0.1)" }, // 주황
  PF: { main: "rgb(15, 82, 222)", light: "rgba(15, 82, 222, 0.1)" }, // 파랑
  TO: { main: "rgb(239, 68, 68)", light: "rgba(239, 68, 68, 0.1)" }   // 빨강
}
```

## 🧩 컴포넌트 라이브러리

### 이미 적용된 컴포넌트 ✅
1. **Button** (`components/Button.tsx`)
2. **Card** (`components/Card.tsx`)

### 활용 가능한 컴포넌트 📦

#### Form 컴포넌트
- **Input** (`components/Input.tsx`) - 텍스트 입력
- **FormComponents** (`components/FormComponents.tsx`) - 폼 관련 고급 컴포넌트

#### 데이터 표시
- **Table** (`components/Table.tsx`) - 데이터 테이블
- **Charts** (`components/Charts.tsx`) - 차트 컴포넌트
- **DataComponents** (`components/DataComponents.tsx`) - 데이터 시각화

#### 피드백 & 상태
- **Progress** (`components/Progress.tsx`) - 진행률 표시
- **FeedbackComponents** (`components/FeedbackComponents.tsx`) - 알림, 토스트 등

#### 레이아웃
- **Navigation** (`components/Navigation.tsx`) - 네비게이션
- **LayoutComponents** (`components/LayoutComponents.tsx`) - 레이아웃 구성
- **FooterNavbar** (`components/FooterNavbar.tsx`) - 푸터/하단 네비

#### 오버레이
- **Modal** (`components/Modal.tsx`) - 모달 다이얼로그
- **Overlay** (`components/Overlay.tsx`) - 오버레이 효과
- **OverlayComponents** (`components/OverlayComponents.tsx`) - 고급 오버레이

#### UI 요소
- **Avatar** (`components/Avatar.tsx`) - 사용자 아바타
- **Typography** (`components/Typography.tsx`) - 타이포그래피
- **UIComponents** (`components/UIComponents.tsx`) - 기타 UI 요소

## 📋 컴포넌트 사용 예시

### 새 컴포넌트 가져오기 템플릿
```typescript
// 1. visible-vc 컴포넌트 확인
// 경로: visible-vc-project/components/[컴포넌트명].tsx

// 2. 포켓비즈에 맞게 수정
// - import 경로 수정
// - 테마 참조 업데이트 (@/lib/theme → ../../lib/theme)
// - 한글 레이블 적용
// - 불필요한 속성 제거

// 3. 적용 예시
import { theme } from '../../lib/theme';

export const NewComponent = () => {
  // visible-vc 스타일 유지하면서 포켓비즈에 최적화
};
```

## 🔧 개발 시 참고사항

### Sprint별 권장 컴포넌트

#### Sprint 1-2 (백엔드 구축)
- Input 컴포넌트 활용하여 설정 폼 구현

#### Sprint 3 (인증 시스템)
- FormComponents 활용하여 회원가입/로그인 폼 구현
- FeedbackComponents로 인증 상태 피드백

#### Sprint 7 (프로그램 관리)
- Table 컴포넌트로 프로그램 목록 표시
- Modal 컴포넌트로 프로그램 상세 정보

#### Sprint 9 (Admin Console)
- DataComponents로 통계 대시보드
- Table 컴포넌트로 KPI 관리 테이블

## 💡 Pro Tips

1. **일관성 유지**: 새 컴포넌트 생성 시 visible-vc 스타일 가이드 준수
2. **테마 활용**: 하드코딩된 색상 대신 theme 객체 참조
3. **반응형 설계**: 모든 컴포넌트는 모바일 우선 설계
4. **접근성**: ARIA 레이블과 키보드 네비게이션 지원

## 🚀 빠른 시작

새 기능 개발 시:
1. 이 문서에서 필요한 컴포넌트 확인
2. visible-vc-project에서 해당 컴포넌트 코드 참조
3. 포켓비즈 프로젝트에 맞게 수정하여 적용
4. 이 문서에 적용 완료 표시 (✅)

---

**Note**: 이 문서는 개발 진행에 따라 지속적으로 업데이트됩니다.