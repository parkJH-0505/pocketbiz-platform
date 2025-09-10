# 컴포넌트 가이드

## 🎨 디자인 시스템 참조
모든 컴포넌트는 visible-vc 디자인 시스템을 기반으로 합니다.
- 📍 **원본 위치**: `C:\Users\포켓컴퍼니\OneDrive\Desktop\박준홍 자료\visible-vc-project\components\`
- 📋 **가이드**: `/docs/DESIGN_SYSTEM.md`

## 📁 폴더 구조
```
components/
├── common/          # 공통 컴포넌트
│   ├── Button.tsx   ✅ (visible-vc 기반)
│   ├── Card.tsx     ✅ (visible-vc 기반)
│   ├── KPICard.tsx  ✅ (포켓비즈 전용)
│   ├── RadarChart.tsx ✅ (포켓비즈 전용)
│   └── Navigation.tsx ✅ (포켓비즈 전용)
│
├── startup/         # 스타트업 전용
├── admin/          # 관리자 전용
└── partner/        # 파트너 전용
```

## 🚀 새 컴포넌트 추가 시

1. **visible-vc에서 유사 컴포넌트 확인**
   - `visible-vc-project/components/` 폴더 확인
   - 재사용 가능한 패턴 찾기

2. **테마 시스템 활용**
   ```typescript
   import { theme } from '../../lib/theme';
   ```

3. **일관된 Props 인터페이스**
   ```typescript
   export interface ComponentProps {
     variant?: 'primary' | 'secondary';
     size?: 'small' | 'medium' | 'large';
     // ...
   }
   ```

## ✅ 구현된 컴포넌트

### Button
- Variants: primary, secondary, ghost, danger
- Sizes: small, medium, large
- Loading 상태 지원

### Card
- Variants: default, bordered, elevated, glass
- Header, Body, Footer 구성
- 호버 효과 옵션

### KPICard
- 6가지 입력 타입 지원
- 실시간 검증
- NA 처리

### RadarChart
- 5축 시각화
- 오버레이 비교
- 반응형 디자인

## 📝 다음 구현 예정

- [ ] Table (Sprint 7, 9)
- [ ] Modal (Sprint 7)
- [ ] Input (Sprint 3)
- [ ] Progress (Sprint 4)
- [ ] Toast/Alert (Sprint 10)