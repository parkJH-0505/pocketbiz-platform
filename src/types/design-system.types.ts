/**
 * @fileoverview Design System TypeScript Types
 * @description 디자인 시스템의 타입 안전성을 보장하는 타입 정의
 * @author PocketCompany
 * @since 2025-01-20
 */

// ============================================================================
// COLOR SYSTEM TYPES
// ============================================================================

/**
 * 브랜드 색상 팔레트 키
 */
export type ColorScale = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

/**
 * 색상 계열 타입
 */
export type ColorFamily = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';

/**
 * 의미론적 색상 타입
 */
export type SemanticColor =
  | 'bg-primary' | 'bg-secondary' | 'bg-tertiary' | 'bg-card' | 'bg-modal' | 'bg-overlay'
  | 'text-primary' | 'text-secondary' | 'text-tertiary' | 'text-muted' | 'text-inverse'
  | 'border-primary' | 'border-secondary' | 'border-focus' | 'border-error'
  | 'state-completed' | 'state-active' | 'state-pending' | 'state-urgent';

/**
 * 완전한 색상 토큰 타입
 */
export type ColorToken = `color-${ColorFamily}-${ColorScale}` | SemanticColor;

// ============================================================================
// TYPOGRAPHY SYSTEM TYPES
// ============================================================================

/**
 * 폰트 패밀리 타입
 */
export type FontFamily = 'primary' | 'display' | 'mono';

/**
 * 폰트 웨이트 타입
 */
export type FontWeight = 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';

/**
 * 폰트 크기 타입
 */
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/**
 * 라인 하이트 타입
 */
export type LineHeight = 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

/**
 * 레터 스페이싱 타입
 */
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';

/**
 * 타이포그래피 설정 인터페이스
 */
export interface TypographyConfig {
  family: FontFamily;
  size: FontSize;
  weight: FontWeight;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
}

/**
 * 텍스트 변형 타입
 */
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

/**
 * 텍스트 정렬 타입
 */
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

// ============================================================================
// SPACING SYSTEM TYPES
// ============================================================================

/**
 * 스페이싱 크기 타입
 */
export type SpacingSize =
  | 'px' | '0' | '0.5' | '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '14' | '16' | '20' | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60'
  | '64' | '72' | '80' | '96';

/**
 * 스페이싱 토큰 타입
 */
export type SpacingToken = `space-${SpacingSize}`;

// ============================================================================
// SHADOW SYSTEM TYPES
// ============================================================================

/**
 * 그림자 크기 타입
 */
export type ShadowSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner';

/**
 * 컬러 그림자 타입
 */
export type ColoredShadow = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

/**
 * 그림자 토큰 타입
 */
export type ShadowToken = `shadow-${ShadowSize}` | `shadow-${ColoredShadow}`;

// ============================================================================
// BORDER RADIUS TYPES
// ============================================================================

/**
 * 보더 반지름 타입
 */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';

/**
 * 보더 반지름 토큰 타입
 */
export type RadiusToken = `radius-${BorderRadius}`;

// ============================================================================
// Z-INDEX TYPES
// ============================================================================

/**
 * Z-인덱스 레벨 타입
 */
export type ZIndex = 'auto' | '0' | '10' | '20' | '30' | '40' | '50' | 'max';

/**
 * Z-인덱스 토큰 타입
 */
export type ZIndexToken = `z-${ZIndex}`;

// ============================================================================
// ANIMATION TYPES
// ============================================================================

/**
 * 애니메이션 지속시간 타입
 */
export type AnimationDuration = '75' | '100' | '150' | '200' | '300' | '500' | '700' | '1000';

/**
 * 이징 함수 타입
 */
export type EasingFunction = 'linear' | 'in' | 'out' | 'in-out' | 'elegant' | 'smooth' | 'bounce';

/**
 * 애니메이션 설정 인터페이스
 */
export interface AnimationConfig {
  duration: AnimationDuration;
  easing: EasingFunction;
  delay?: AnimationDuration;
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
}

// ============================================================================
// BREAKPOINT TYPES
// ============================================================================

/**
 * 브레이크포인트 타입
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * 반응형 값 타입
 */
export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

// ============================================================================
// COMPONENT VARIANT TYPES
// ============================================================================

/**
 * 컴포넌트 크기 타입
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 컴포넌트 변형 타입
 */
export type ComponentVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'outline';

/**
 * 컴포넌트 상태 타입
 */
export type ComponentState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading';

// ============================================================================
// TIMELINE SPECIFIC TYPES
// ============================================================================

/**
 * 타임라인 활동 타입
 */
export type ActivityType = 'file' | 'meeting' | 'project' | 'comment';

/**
 * 활동 상태 타입
 */
export type ActivityStatus = 'completed' | 'active' | 'pending';

/**
 * 활동 우선순위 타입
 */
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * 브랜치 레벨 타입
 */
export type BranchLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * 타임라인 테마 설정
 */
export interface TimelineTheme {
  axisColor: ColorToken;
  axisWidth: number;
  nodeSize: number;
  branchStrokeWidth: number;
  branchGlowWidth: number;
  activityColors: Record<ActivityType, ColorToken>;
  statusColors: Record<ActivityStatus, ColorToken>;
  priorityColors: Record<ActivityPriority, ColorToken>;
}

// ============================================================================
// DESIGN TOKEN UTILITIES
// ============================================================================

/**
 * CSS 변수 이름 생성 유틸리티 타입
 */
export type CSSVariable<T extends string> = `--${T}`;

/**
 * 토큰 값 추출 유틸리티 타입
 */
export type TokenValue<T> = T extends `${string}-${infer U}` ? U : never;

/**
 * 디자인 토큰 맵 타입
 */
export interface DesignTokenMap {
  colors: Record<ColorToken, string>;
  spacing: Record<SpacingToken, string>;
  typography: {
    families: Record<FontFamily, string>;
    sizes: Record<FontSize, string>;
    weights: Record<FontWeight, number>;
    lineHeights: Record<LineHeight, number>;
    letterSpacings: Record<LetterSpacing, string>;
  };
  shadows: Record<ShadowToken, string>;
  radii: Record<RadiusToken, string>;
  zIndices: Record<ZIndexToken, number>;
  animations: {
    durations: Record<AnimationDuration, string>;
    easings: Record<EasingFunction, string>;
  };
  breakpoints: Record<Breakpoint, string>;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * 기본 스타일 props 인터페이스
 */
export interface BaseStyleProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 색상 관련 props
 */
export interface ColorProps {
  color?: ColorToken;
  backgroundColor?: ColorToken;
  borderColor?: ColorToken;
}

/**
 * 스페이싱 관련 props
 */
export interface SpacingProps {
  margin?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginTop?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginRight?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginBottom?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginLeft?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginX?: SpacingToken | ResponsiveValue<SpacingToken>;
  marginY?: SpacingToken | ResponsiveValue<SpacingToken>;

  padding?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingTop?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingRight?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingBottom?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingLeft?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingX?: SpacingToken | ResponsiveValue<SpacingToken>;
  paddingY?: SpacingToken | ResponsiveValue<SpacingToken>;
}

/**
 * 타이포그래피 관련 props
 */
export interface TypographyProps {
  fontFamily?: FontFamily;
  fontSize?: FontSize | ResponsiveValue<FontSize>;
  fontWeight?: FontWeight;
  lineHeight?: LineHeight;
  letterSpacing?: LetterSpacing;
  textAlign?: TextAlign | ResponsiveValue<TextAlign>;
  textTransform?: TextTransform;
}

/**
 * 레이아웃 관련 props
 */
export interface LayoutProps {
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none';
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
}

/**
 * 시각적 효과 props
 */
export interface EffectProps {
  shadow?: ShadowToken;
  borderRadius?: RadiusToken;
  opacity?: number;
  zIndex?: ZIndexToken;
}

/**
 * 종합 스타일 props
 */
export interface StyleSystemProps
  extends BaseStyleProps,
          ColorProps,
          SpacingProps,
          TypographyProps,
          LayoutProps,
          EffectProps {}

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * 테마 모드 타입
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * 테마 설정 인터페이스
 */
export interface ThemeConfig {
  mode: ThemeMode;
  tokens: DesignTokenMap;
  components: {
    timeline: TimelineTheme;
    // 추후 다른 컴포넌트 테마 추가
  };
}

/**
 * 테마 컨텍스트 타입
 */
export interface ThemeContextValue {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  toggleMode: () => void;
  getToken: <T extends keyof DesignTokenMap>(category: T, token: keyof DesignTokenMap[T]) => string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * 스타일 객체 타입
 */
export type StyleObject = Record<string, string | number>;

/**
 * 클래스명 값 타입
 */
export type ClassNameValue = string | number | boolean | undefined | null;

/**
 * 클래스명 배열 타입
 */
export type ClassNameArray = ClassNameValue[];

/**
 * 클래스명 객체 타입
 */
export type ClassNameObject = Record<string, ClassNameValue>;

/**
 * 클래스명 인수 타입
 */
export type ClassNameArg = ClassNameValue | ClassNameArray | ClassNameObject;

/**
 * 미디어 쿼리 타입
 */
export type MediaQuery = `@media (min-width: ${string})` | `@media (max-width: ${string})`;

/**
 * CSS-in-JS 스타일 타입
 */
export type CSSInJSStyle = StyleObject & {
  [key: MediaQuery]: StyleObject;
} & {
  [key: `&:${string}`]: StyleObject; // 가상 선택자
} & {
  [key: `& ${string}`]: StyleObject; // 중첩 선택자
};

export default {};