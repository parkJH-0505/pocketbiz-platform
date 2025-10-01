/**
 * @fileoverview ClassNames Utility - 클래스명 조합 유틸리티
 * @description 조건부 클래스명 결합과 중복 제거를 위한 유틸리티
 * @author PocketCompany
 * @since 2025-01-20
 */

import type {
  ClassNameValue,
  ClassNameArray,
  ClassNameObject,
  ClassNameArg
} from '../types/design-system.types';

/**
 * 클래스명 값을 문자열로 변환
 */
function toValue(value: ClassNameValue): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

/**
 * 배열 형태의 클래스명 처리
 */
function processArray(array: ClassNameArray): string {
  const result: string[] = [];

  for (const item of array) {
    if (!item) continue;

    if (typeof item === 'string' || typeof item === 'number') {
      result.push(toValue(item));
    } else if (Array.isArray(item)) {
      const processed = processArray(item);
      if (processed) result.push(processed);
    } else if (typeof item === 'object') {
      const processed = processObject(item as ClassNameObject);
      if (processed) result.push(processed);
    }
  }

  return result.filter(Boolean).join(' ');
}

/**
 * 객체 형태의 클래스명 처리
 */
function processObject(object: ClassNameObject): string {
  const result: string[] = [];

  for (const [key, value] of Object.entries(object)) {
    if (!value) continue;

    if (value === true) {
      result.push(key);
    } else if (typeof value === 'string' || typeof value === 'number') {
      // 값이 문자열/숫자인 경우 키-값 쌍으로 처리
      result.push(`${key}-${value}`);
    }
  }

  return result.filter(Boolean).join(' ');
}

/**
 * 클래스명 조합 메인 함수
 *
 * @example
 * ```ts
 * cn('btn', 'btn-primary'); // 'btn btn-primary'
 * cn('btn', { active: true, disabled: false }); // 'btn active'
 * cn(['btn', 'btn-primary'], { active: true }); // 'btn btn-primary active'
 * cn('btn', undefined, null, false, 'btn-primary'); // 'btn btn-primary'
 * ```
 */
export function cn(...args: ClassNameArg[]): string {
  const result: string[] = [];

  for (const arg of args) {
    if (!arg) continue;

    if (typeof arg === 'string' || typeof arg === 'number') {
      result.push(toValue(arg));
    } else if (Array.isArray(arg)) {
      const processed = processArray(arg);
      if (processed) result.push(processed);
    } else if (typeof arg === 'object') {
      const processed = processObject(arg as ClassNameObject);
      if (processed) result.push(processed);
    }
  }

  // 중복 제거하고 공백으로 결합
  return [...new Set(result.join(' ').split(/\s+/))].filter(Boolean).join(' ');
}

/**
 * 조건부 클래스명 헬퍼
 */
export function conditionalClass(
  condition: boolean,
  trueClass: string,
  falseClass: string = ''
): string {
  return condition ? trueClass : falseClass;
}

/**
 * 변형(variant) 클래스 생성 헬퍼
 */
export function variantClass<T extends string>(
  variant: T,
  variants: Record<T, string>
): string {
  return variants[variant] || '';
}

/**
 * 반응형 클래스 생성 헬퍼
 */
export function responsiveClass(
  baseClass: string,
  breakpoints: Partial<Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string>>
): string {
  const classes = [baseClass];

  for (const [breakpoint, value] of Object.entries(breakpoints)) {
    if (value) {
      classes.push(`${breakpoint}:${value}`);
    }
  }

  return classes.join(' ');
}

/**
 * 테마 기반 클래스 생성 헬퍼
 */
export function themedClass(
  lightClass: string,
  darkClass: string
): string {
  return `${lightClass} dark:${darkClass}`;
}

/**
 * 상태 기반 클래스 생성 헬퍼
 */
export function stateClass(
  states: Partial<{
    default: string;
    hover: string;
    focus: string;
    active: string;
    disabled: string;
    loading: string;
  }>
): string {
  const classes: string[] = [];

  if (states.default) classes.push(states.default);
  if (states.hover) classes.push(`hover:${states.hover}`);
  if (states.focus) classes.push(`focus:${states.focus}`);
  if (states.active) classes.push(`active:${states.active}`);
  if (states.disabled) classes.push(`disabled:${states.disabled}`);
  if (states.loading) classes.push(`loading:${states.loading}`);

  return classes.join(' ');
}

/**
 * 애니메이션 클래스 생성 헬퍼
 */
export function animationClass(
  animation: string,
  duration?: string,
  easing?: string,
  delay?: string
): string {
  const classes = [`animate-${animation}`];

  if (duration) classes.push(`duration-${duration}`);
  if (easing) classes.push(`ease-${easing}`);
  if (delay) classes.push(`delay-${delay}`);

  return classes.join(' ');
}

/**
 * 그리드 클래스 생성 헬퍼
 */
export function gridClass(
  cols: number | Record<string, number>,
  gap?: number | string
): string {
  const classes: string[] = ['grid'];

  if (typeof cols === 'number') {
    classes.push(`grid-cols-${cols}`);
  } else {
    for (const [breakpoint, value] of Object.entries(cols)) {
      if (breakpoint === 'default') {
        classes.push(`grid-cols-${value}`);
      } else {
        classes.push(`${breakpoint}:grid-cols-${value}`);
      }
    }
  }

  if (gap) {
    classes.push(`gap-${gap}`);
  }

  return classes.join(' ');
}

/**
 * Flexbox 클래스 생성 헬퍼
 */
export function flexClass(options: {
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  wrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: number | string;
}): string {
  const classes = ['flex'];

  if (options.direction) classes.push(`flex-${options.direction}`);
  if (options.wrap) classes.push(`flex-${options.wrap}`);
  if (options.justify) classes.push(`justify-${options.justify}`);
  if (options.align) classes.push(`items-${options.align}`);
  if (options.gap) classes.push(`gap-${options.gap}`);

  return classes.join(' ');
}

/**
 * 트랜지션 클래스 생성 헬퍼
 */
export function transitionClass(
  properties: string | string[] = 'all',
  duration: string = '200',
  easing: string = 'ease-in-out'
): string {
  const props = Array.isArray(properties) ? properties.join('-') : properties;
  return `transition-${props} duration-${duration} ${easing}`;
}

/**
 * 그림자 클래스 생성 헬퍼
 */
export function shadowClass(
  size: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl',
  color?: string
): string {
  const classes = [`shadow-${size}`];

  if (color) {
    classes.push(`shadow-${color}`);
  }

  return classes.join(' ');
}

/**
 * 테두리 클래스 생성 헬퍼
 */
export function borderClass(options: {
  width?: string | number;
  style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color?: string;
  radius?: string | number;
  sides?: ('top' | 'right' | 'bottom' | 'left')[];
}): string {
  const classes: string[] = [];

  if (options.width !== undefined) {
    if (options.sides) {
      options.sides.forEach(side => {
        classes.push(`border-${side[0]}-${options.width}`);
      });
    } else {
      classes.push(`border-${options.width}`);
    }
  } else {
    classes.push('border');
  }

  if (options.style) classes.push(`border-${options.style}`);
  if (options.color) classes.push(`border-${options.color}`);
  if (options.radius) classes.push(`rounded-${options.radius}`);

  return classes.join(' ');
}

// 기본 내보내기
export default cn;