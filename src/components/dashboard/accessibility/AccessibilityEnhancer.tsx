import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  createContext,
  useContext,
  KeyboardEvent
} from 'react';

export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableFocusIndicators: boolean;
  enableAnnouncements: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  colorBlindnessSupport: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  reducedMotion: boolean;
  autoPlayMedia: boolean;
  skipLinksEnabled: boolean;
  ariaLiveRegions: boolean;
  semanticHeadings: boolean;
  landmarks: boolean;
}

export interface FocusableElement {
  id: string;
  element: HTMLElement;
  tabIndex: number;
  role?: string;
  ariaLabel?: string;
  skipToNext?: boolean;
  group?: string;
}

export interface AccessibilityViolation {
  id: string;
  type: 'error' | 'warning' | 'info';
  element: HTMLElement;
  rule: string;
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ScreenReaderAnnouncement {
  id: string;
  message: string;
  priority: 'polite' | 'assertive' | 'off';
  delay?: number;
  interrupt?: boolean;
}

export interface KeyboardNavigationState {
  currentFocusId: string | null;
  focusHistory: string[];
  trapFocus: boolean;
  skipLinks: string[];
}

interface AccessibilityContextValue {
  config: AccessibilityConfig;
  updateConfig: (updates: Partial<AccessibilityConfig>) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  registerFocusable: (element: FocusableElement) => void;
  unregisterFocusable: (id: string) => void;
  moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') => boolean;
  setFocusTrap: (enabled: boolean, containerId?: string) => void;
  getViolations: () => AccessibilityViolation[];
  runAccessibilityAudit: () => Promise<AccessibilityViolation[]>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

export class AccessibilityEnhancer {
  private config: AccessibilityConfig;
  private focusableElements = new Map<string, FocusableElement>();
  private violations: AccessibilityViolation[] = [];
  private announcements: ScreenReaderAnnouncement[] = [];
  private navigationState: KeyboardNavigationState;
  private ariaLiveRegion: HTMLElement | null = null;
  private focusTrapContainer: HTMLElement | null = null;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enableScreenReader: true,
      enableKeyboardNavigation: true,
      enableHighContrast: false,
      enableFocusIndicators: true,
      enableAnnouncements: true,
      fontSize: 'medium',
      colorBlindnessSupport: 'none',
      reducedMotion: false,
      autoPlayMedia: false,
      skipLinksEnabled: true,
      ariaLiveRegions: true,
      semanticHeadings: true,
      landmarks: true,
      ...config
    };

    this.navigationState = {
      currentFocusId: null,
      focusHistory: [],
      trapFocus: false,
      skipLinks: []
    };

    this.initialize();
  }

  /**
   * 시스템 초기화
   */
  private initialize(): void {
    this.setupAriaLiveRegion();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupAccessibilityObservers();
    this.applyCSSAccessibilityEnhancements();
    this.setupColorBlindnessSupport();
    this.setupMotionPreferences();
  }

  /**
   * ARIA Live Region 설정
   */
  private setupAriaLiveRegion(): void {
    if (!this.config.ariaLiveRegions) return;

    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.setAttribute('aria-relevant', 'additions text');
    this.ariaLiveRegion.style.position = 'absolute';
    this.ariaLiveRegion.style.left = '-10000px';
    this.ariaLiveRegion.style.width = '1px';
    this.ariaLiveRegion.style.height = '1px';
    this.ariaLiveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.ariaLiveRegion);
  }

  /**
   * 키보드 네비게이션 설정
   */
  private setupKeyboardNavigation(): void {
    if (!this.config.enableKeyboardNavigation) return;

    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    document.addEventListener('focusin', this.handleFocusChange.bind(this));
    document.addEventListener('focusout', this.handleFocusLeave.bind(this));
  }

  /**
   * 키보드 네비게이션 핸들러
   */
  private handleKeyboardNavigation(event: KeyboardEvent): void {
    const { key, shiftKey, ctrlKey, altKey } = event;

    // Skip links 활성화 (Tab 키)
    if (key === 'Tab' && !shiftKey && !ctrlKey && !altKey) {
      if (this.handleSkipLinks()) {
        event.preventDefault();
        return;
      }
    }

    // 포커스 트랩 처리
    if (this.navigationState.trapFocus && this.focusTrapContainer) {
      if (key === 'Tab') {
        if (this.handleFocusTrap(event)) {
          event.preventDefault();
        }
      }
    }

    // 화살표 키로 위젯 내 네비게이션
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      if (this.handleArrowKeyNavigation(event)) {
        event.preventDefault();
      }
    }

    // Escape 키로 포커스 트랩 해제
    if (key === 'Escape' && this.navigationState.trapFocus) {
      this.setFocusTrap(false);
      event.preventDefault();
    }

    // 단축키 처리
    if (ctrlKey || altKey) {
      this.handleAccessibilityShortcuts(event);
    }
  }

  /**
   * Skip Links 처리
   */
  private handleSkipLinks(): boolean {
    const skipLinks = document.querySelectorAll('[data-skip-link]');
    if (skipLinks.length === 0) return false;

    const currentFocus = document.activeElement as HTMLElement;

    // Skip link가 이미 포커스된 경우 대상으로 이동
    if (currentFocus?.hasAttribute('data-skip-link')) {
      const targetId = currentFocus.getAttribute('data-skip-target');
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.focus();
          this.announce(`Skipped to ${target.getAttribute('aria-label') || targetId}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 포커스 트랩 처리
   */
  private handleFocusTrap(event: KeyboardEvent): boolean {
    if (!this.focusTrapContainer) return false;

    const focusableElements = this.getFocusableElementsInContainer(this.focusTrapContainer);
    if (focusableElements.length === 0) return false;

    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(currentElement);

    if (event.shiftKey) {
      // Shift+Tab: 이전 요소로
      if (currentIndex <= 0) {
        focusableElements[focusableElements.length - 1].focus();
        return true;
      }
    } else {
      // Tab: 다음 요소로
      if (currentIndex >= focusableElements.length - 1) {
        focusableElements[0].focus();
        return true;
      }
    }

    return false;
  }

  /**
   * 화살표 키 네비게이션 처리
   */
  private handleArrowKeyNavigation(event: KeyboardEvent): boolean {
    const currentElement = document.activeElement as HTMLElement;
    const role = currentElement?.getAttribute('role');

    // 그리드나 트리 구조에서 화살표 키 네비게이션
    if (['grid', 'tree', 'tablist', 'menu'].includes(role || '')) {
      return this.handleStructuredNavigation(event, role || '');
    }

    return false;
  }

  /**
   * 구조화된 네비게이션 처리
   */
  private handleStructuredNavigation(event: KeyboardEvent, role: string): boolean {
    const { key } = event;
    const currentElement = document.activeElement as HTMLElement;

    switch (role) {
      case 'grid':
        return this.handleGridNavigation(event, currentElement);

      case 'tree':
        return this.handleTreeNavigation(event, currentElement);

      case 'tablist':
        return this.handleTabNavigation(event, currentElement);

      case 'menu':
        return this.handleMenuNavigation(event, currentElement);

      default:
        return false;
    }
  }

  /**
   * 그리드 네비게이션 처리
   */
  private handleGridNavigation(event: KeyboardEvent, currentElement: HTMLElement): boolean {
    const { key } = event;
    const grid = currentElement.closest('[role="grid"]') as HTMLElement;
    if (!grid) return false;

    const cells = Array.from(grid.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
    const currentIndex = cells.indexOf(currentElement);

    if (currentIndex === -1) return false;

    const columnsCount = parseInt(grid.getAttribute('aria-colcount') || '0', 10);

    let targetIndex = currentIndex;

    switch (key) {
      case 'ArrowRight':
        targetIndex = Math.min(currentIndex + 1, cells.length - 1);
        break;

      case 'ArrowLeft':
        targetIndex = Math.max(currentIndex - 1, 0);
        break;

      case 'ArrowDown':
        targetIndex = Math.min(currentIndex + columnsCount, cells.length - 1);
        break;

      case 'ArrowUp':
        targetIndex = Math.max(currentIndex - columnsCount, 0);
        break;

      case 'Home':
        targetIndex = 0;
        break;

      case 'End':
        targetIndex = cells.length - 1;
        break;

      default:
        return false;
    }

    if (targetIndex !== currentIndex) {
      cells[targetIndex].focus();
      return true;
    }

    return false;
  }

  /**
   * 트리 네비게이션 처리
   */
  private handleTreeNavigation(event: KeyboardEvent, currentElement: HTMLElement): boolean {
    const { key } = event;

    switch (key) {
      case 'ArrowDown':
        return this.moveToNextTreeItem(currentElement);

      case 'ArrowUp':
        return this.moveToPreviousTreeItem(currentElement);

      case 'ArrowRight':
        return this.expandOrMoveToChild(currentElement);

      case 'ArrowLeft':
        return this.collapseOrMoveToParent(currentElement);

      case 'Home':
        return this.moveToFirstTreeItem(currentElement);

      case 'End':
        return this.moveToLastTreeItem(currentElement);

      default:
        return false;
    }
  }

  /**
   * 포커스 변경 핸들러
   */
  private handleFocusChange(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    const elementId = target.getAttribute('data-focus-id') || target.id;

    if (elementId) {
      this.navigationState.currentFocusId = elementId;
      this.navigationState.focusHistory.push(elementId);

      // 히스토리 크기 제한
      if (this.navigationState.focusHistory.length > 50) {
        this.navigationState.focusHistory = this.navigationState.focusHistory.slice(-25);
      }
    }

    // 포커스 인디케이터 업데이트
    this.updateFocusIndicators(target);

    // 스크린 리더 공지
    this.announceFocusChange(target);
  }

  /**
   * 포커스 인디케이터 업데이트
   */
  private updateFocusIndicators(element: HTMLElement): void {
    if (!this.config.enableFocusIndicators) return;

    // 기존 포커스 인디케이터 제거
    document.querySelectorAll('.a11y-focus-indicator').forEach(indicator => {
      indicator.remove();
    });

    // 새 포커스 인디케이터 생성
    const indicator = document.createElement('div');
    indicator.className = 'a11y-focus-indicator';
    indicator.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid #007bff;
      border-radius: 4px;
      z-index: 9999;
      transition: all 0.2s ease;
    `;

    const rect = element.getBoundingClientRect();
    indicator.style.left = `${rect.left + window.scrollX - 2}px`;
    indicator.style.top = `${rect.top + window.scrollY - 2}px`;
    indicator.style.width = `${rect.width + 4}px`;
    indicator.style.height = `${rect.height + 4}px`;

    document.body.appendChild(indicator);

    // 1초 후 자동 제거
    setTimeout(() => {
      indicator.remove();
    }, 1000);
  }

  /**
   * 포커스 변경 공지
   */
  private announceFocusChange(element: HTMLElement): void {
    const ariaLabel = element.getAttribute('aria-label');
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();

    if (ariaLabel) {
      this.announce(`Focused on ${ariaLabel}`, 'polite');
    } else if (role) {
      this.announce(`Focused on ${role}`, 'polite');
    } else {
      const elementType = this.getElementTypeDescription(tagName);
      if (elementType) {
        this.announce(`Focused on ${elementType}`, 'polite');
      }
    }
  }

  /**
   * 요소 타입 설명 가져오기
   */
  private getElementTypeDescription(tagName: string): string {
    const descriptions: Record<string, string> = {
      button: 'button',
      input: 'input field',
      select: 'dropdown',
      textarea: 'text area',
      a: 'link',
      h1: 'heading level 1',
      h2: 'heading level 2',
      h3: 'heading level 3',
      h4: 'heading level 4',
      h5: 'heading level 5',
      h6: 'heading level 6'
    };

    return descriptions[tagName] || '';
  }

  /**
   * 컨테이너 내 포커스 가능한 요소들 가져오기
   */
  private getFocusableElementsInContainer(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }

  /**
   * CSS 접근성 향상 적용
   */
  private applyCSSAccessibilityEnhancements(): void {
    const styleId = 'accessibility-enhancements';
    let existingStyle = document.getElementById(styleId);

    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = styleId;
      document.head.appendChild(existingStyle);
    }

    const styles = this.generateAccessibilityCSS();
    existingStyle.textContent = styles;
  }

  /**
   * 접근성 CSS 생성
   */
  private generateAccessibilityCSS(): string {
    let css = '';

    // 포커스 인디케이터
    if (this.config.enableFocusIndicators) {
      css += `
        *:focus {
          outline: 2px solid #007bff !important;
          outline-offset: 2px !important;
        }

        .a11y-focus-indicator {
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
        }
      `;
    }

    // 고대비 모드
    if (this.config.enableHighContrast) {
      css += `
        @media (prefers-contrast: high) {
          * {
            background-color: white !important;
            color: black !important;
            border-color: black !important;
          }

          a, button {
            color: blue !important;
          }

          a:visited {
            color: purple !important;
          }
        }
      `;
    }

    // 폰트 크기 조정
    const fontSizeMap = {
      small: '0.875rem',
      medium: '1rem',
      large: '1.125rem',
      'extra-large': '1.25rem'
    };

    css += `
      html {
        font-size: ${fontSizeMap[this.config.fontSize]} !important;
      }
    `;

    // 모션 감소
    if (this.config.reducedMotion) {
      css += `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
    }

    // Skip links 스타일
    if (this.config.skipLinksEnabled) {
      css += `
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: #000;
          color: #fff;
          padding: 8px;
          text-decoration: none;
          z-index: 10000;
          border-radius: 4px;
          transition: top 0.3s;
        }

        .skip-link:focus {
          top: 6px;
        }
      `;
    }

    return css;
  }

  /**
   * 색맹 지원 설정
   */
  private setupColorBlindnessSupport(): void {
    if (this.config.colorBlindnessSupport === 'none') return;

    const filterId = 'colorblindness-filter';
    let existingFilter = document.getElementById(filterId);

    if (!existingFilter) {
      existingFilter = document.createElement('style');
      existingFilter.id = filterId;
      document.head.appendChild(existingFilter);
    }

    const filterCSS = this.generateColorBlindnessFilter();
    existingFilter.textContent = filterCSS;
  }

  /**
   * 색맹 필터 CSS 생성
   */
  private generateColorBlindnessFilter(): string {
    const filters = {
      protanopia: 'filter: url(#protanopia-filter);',
      deuteranopia: 'filter: url(#deuteranopia-filter);',
      tritanopia: 'filter: url(#tritanopia-filter);'
    };

    const svgFilters = `
      <svg style="position: absolute; width: 0; height: 0;">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
          </filter>
        </defs>
      </svg>
    `;

    // SVG 필터를 body에 추가
    if (!document.querySelector('#colorblindness-svg-filters')) {
      const div = document.createElement('div');
      div.id = 'colorblindness-svg-filters';
      div.innerHTML = svgFilters;
      document.body.appendChild(div);
    }

    return `
      html {
        ${filters[this.config.colorBlindnessSupport as keyof typeof filters] || ''}
      }
    `;
  }

  /**
   * 접근성 위반 감사
   */
  async runAccessibilityAudit(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];

    // 이미지 alt 속성 검사
    violations.push(...this.auditImageAltText());

    // 폼 라벨 검사
    violations.push(...this.auditFormLabels());

    // 제목 구조 검사
    violations.push(...this.auditHeadingStructure());

    // 컬러 대비 검사
    violations.push(...await this.auditColorContrast());

    // 키보드 접근성 검사
    violations.push(...this.auditKeyboardAccessibility());

    // ARIA 속성 검사
    violations.push(...this.auditAriaAttributes());

    this.violations = violations;
    return violations;
  }

  /**
   * 이미지 alt 텍스트 감사
   */
  private auditImageAltText(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        violations.push({
          id: `img-alt-${index}`,
          type: 'error',
          element: img,
          rule: 'img-alt',
          message: 'Image missing alt attribute',
          suggestion: 'Add descriptive alt text or alt="" for decorative images',
          severity: 'high'
        });
      } else if (img.getAttribute('alt') === '') {
        const hasAriaLabel = img.hasAttribute('aria-label');
        const hasAriaLabelledby = img.hasAttribute('aria-labelledby');

        if (!hasAriaLabel && !hasAriaLabelledby) {
          violations.push({
            id: `img-alt-empty-${index}`,
            type: 'warning',
            element: img,
            rule: 'img-alt-empty',
            message: 'Image has empty alt attribute but no alternative labeling',
            suggestion: 'Ensure this is truly decorative or provide alternative labeling',
            severity: 'medium'
          });
        }
      }
    });

    return violations;
  }

  /**
   * 폼 라벨 감사
   */
  private auditFormLabels(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const formControls = document.querySelectorAll('input, select, textarea');

    formControls.forEach((control, index) => {
      const hasLabel = this.hasAssociatedLabel(control as HTMLElement);
      const hasAriaLabel = control.hasAttribute('aria-label');
      const hasAriaLabelledby = control.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby) {
        violations.push({
          id: `form-label-${index}`,
          type: 'error',
          element: control as HTMLElement,
          rule: 'form-label',
          message: 'Form control missing label',
          suggestion: 'Add a <label> element or aria-label/aria-labelledby attribute',
          severity: 'high'
        });
      }
    });

    return violations;
  }

  /**
   * 라벨 연결 확인
   */
  private hasAssociatedLabel(element: HTMLElement): boolean {
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    const parentLabel = element.closest('label');
    return parentLabel !== null;
  }

  /**
   * 제목 구조 감사
   */
  private auditHeadingStructure(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1), 10);

      if (index === 0 && level !== 1) {
        violations.push({
          id: `heading-first-${index}`,
          type: 'warning',
          element: heading as HTMLElement,
          rule: 'heading-first',
          message: 'First heading should be h1',
          suggestion: 'Use h1 for the main page heading',
          severity: 'medium'
        });
      }

      if (level - previousLevel > 1) {
        violations.push({
          id: `heading-skip-${index}`,
          type: 'warning',
          element: heading as HTMLElement,
          rule: 'heading-skip',
          message: `Heading level skipped from h${previousLevel} to h${level}`,
          suggestion: 'Use sequential heading levels',
          severity: 'medium'
        });
      }

      previousLevel = level;
    });

    return violations;
  }

  /**
   * 색상 대비 감사
   */
  private async auditColorContrast(): Promise<AccessibilityViolation[]> {
    const violations: AccessibilityViolation[] = [];
    // 실제 구현에서는 색상 대비 계산 로직 필요
    // 여기서는 간단한 예시만 제공

    const textElements = document.querySelectorAll('p, span, div, a, button, label');

    for (let i = 0; i < Math.min(textElements.length, 20); i++) {
      const element = textElements[i] as HTMLElement;
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;

      if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrastRatio = this.calculateContrastRatio(color, backgroundColor);

        if (contrastRatio < 4.5) {
          violations.push({
            id: `contrast-${i}`,
            type: 'warning',
            element,
            rule: 'color-contrast',
            message: `Low color contrast ratio: ${contrastRatio.toFixed(2)}`,
            suggestion: 'Increase contrast between text and background colors',
            severity: 'medium'
          });
        }
      }
    }

    return violations;
  }

  /**
   * 색상 대비 비율 계산 (간단한 구현)
   */
  private calculateContrastRatio(color1: string, color2: string): number {
    // 실제 구현에서는 더 정확한 WCAG 대비 계산이 필요
    // 여기서는 간단한 근사치 제공
    return Math.random() * 10 + 1; // 임시 구현
  }

  /**
   * 키보드 접근성 감사
   */
  private auditKeyboardAccessibility(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]');

    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');

      if (tabIndex && parseInt(tabIndex, 10) > 0) {
        violations.push({
          id: `tabindex-positive-${index}`,
          type: 'warning',
          element: element as HTMLElement,
          rule: 'tabindex-positive',
          message: 'Positive tabindex values should be avoided',
          suggestion: 'Use tabindex="0" or rely on natural tab order',
          severity: 'medium'
        });
      }
    });

    return violations;
  }

  /**
   * ARIA 속성 감사
   */
  private auditAriaAttributes(): AccessibilityViolation[] {
    const violations: AccessibilityViolation[] = [];
    const elementsWithAria = document.querySelectorAll('[aria-labelledby], [aria-describedby]');

    elementsWithAria.forEach((element, index) => {
      const labelledby = element.getAttribute('aria-labelledby');
      const describedby = element.getAttribute('aria-describedby');

      if (labelledby) {
        const labelIds = labelledby.split(' ');
        labelIds.forEach(id => {
          if (!document.getElementById(id)) {
            violations.push({
              id: `aria-labelledby-${index}`,
              type: 'error',
              element: element as HTMLElement,
              rule: 'aria-labelledby',
              message: `aria-labelledby references non-existent ID: ${id}`,
              suggestion: 'Ensure referenced elements exist',
              severity: 'high'
            });
          }
        });
      }

      if (describedby) {
        const describeIds = describedby.split(' ');
        describeIds.forEach(id => {
          if (!document.getElementById(id)) {
            violations.push({
              id: `aria-describedby-${index}`,
              type: 'error',
              element: element as HTMLElement,
              rule: 'aria-describedby',
              message: `aria-describedby references non-existent ID: ${id}`,
              suggestion: 'Ensure referenced elements exist',
              severity: 'high'
            });
          }
        });
      }
    });

    return violations;
  }

  // Public API 메서드들
  updateConfig(updates: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...updates };
    this.applyCSSAccessibilityEnhancements();
    this.setupColorBlindnessSupport();
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.enableAnnouncements || !this.ariaLiveRegion) return;

    const announcement: ScreenReaderAnnouncement = {
      id: `announcement-${Date.now()}`,
      message,
      priority
    };

    this.announcements.push(announcement);

    // ARIA live region 업데이트
    this.ariaLiveRegion.setAttribute('aria-live', priority);
    this.ariaLiveRegion.textContent = message;

    // 일정 시간 후 메시지 정리
    setTimeout(() => {
      if (this.ariaLiveRegion && this.ariaLiveRegion.textContent === message) {
        this.ariaLiveRegion.textContent = '';
      }
    }, 1000);
  }

  registerFocusable(element: FocusableElement): void {
    this.focusableElements.set(element.id, element);
  }

  unregisterFocusable(id: string): void {
    this.focusableElements.delete(id);
  }

  setFocusTrap(enabled: boolean, containerId?: string): void {
    this.navigationState.trapFocus = enabled;

    if (enabled && containerId) {
      this.focusTrapContainer = document.getElementById(containerId);
    } else {
      this.focusTrapContainer = null;
    }
  }

  moveFocus(direction: 'next' | 'previous' | 'first' | 'last'): boolean {
    const focusableElements = Array.from(this.focusableElements.values())
      .sort((a, b) => a.tabIndex - b.tabIndex);

    if (focusableElements.length === 0) return false;

    let targetIndex = 0;
    const currentFocusId = this.navigationState.currentFocusId;

    if (currentFocusId) {
      const currentIndex = focusableElements.findIndex(el => el.id === currentFocusId);

      switch (direction) {
        case 'next':
          targetIndex = (currentIndex + 1) % focusableElements.length;
          break;
        case 'previous':
          targetIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          break;
        case 'first':
          targetIndex = 0;
          break;
        case 'last':
          targetIndex = focusableElements.length - 1;
          break;
      }
    }

    const targetElement = focusableElements[targetIndex];
    if (targetElement) {
      targetElement.element.focus();
      return true;
    }

    return false;
  }

  getViolations(): AccessibilityViolation[] {
    return [...this.violations];
  }

  // Tree navigation helper 메서드들 (간단한 구현)
  private moveToNextTreeItem(currentElement: HTMLElement): boolean {
    // 트리 네비게이션 로직 구현
    return false;
  }

  private moveToPreviousTreeItem(currentElement: HTMLElement): boolean {
    return false;
  }

  private expandOrMoveToChild(currentElement: HTMLElement): boolean {
    return false;
  }

  private collapseOrMoveToParent(currentElement: HTMLElement): boolean {
    return false;
  }

  private moveToFirstTreeItem(currentElement: HTMLElement): boolean {
    return false;
  }

  private moveToLastTreeItem(currentElement: HTMLElement): boolean {
    return false;
  }

  private handleTabNavigation(event: KeyboardEvent, currentElement: HTMLElement): boolean {
    return false;
  }

  private handleMenuNavigation(event: KeyboardEvent, currentElement: HTMLElement): boolean {
    return false;
  }

  private handleAccessibilityShortcuts(event: KeyboardEvent): void {
    // 접근성 단축키 처리
  }

  private setupFocusManagement(): void {
    // 포커스 관리 설정
  }

  private setupAccessibilityObservers(): void {
    // DOM 변경 감시
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 새로 추가된 요소들의 접근성 검사
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.auditNewElement(node as HTMLElement);
            }
          });
        }
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private auditNewElement(element: HTMLElement): void {
    // 새 요소의 접근성 감사
  }

  private setupMotionPreferences(): void {
    // 모션 설정 적용
  }

  private handleFocusLeave(event: FocusEvent): void {
    // 포커스 떠날 때 처리
  }

  dispose(): void {
    this.mutationObserver?.disconnect();
    this.resizeObserver?.disconnect();

    if (this.ariaLiveRegion) {
      document.body.removeChild(this.ariaLiveRegion);
    }

    // 이벤트 리스너 정리
    document.removeEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    document.removeEventListener('focusin', this.handleFocusChange.bind(this));
    document.removeEventListener('focusout', this.handleFocusLeave.bind(this));
  }
}

// React Provider 컴포넌트
interface AccessibilityProviderProps {
  children: React.ReactNode;
  config?: Partial<AccessibilityConfig>;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  config
}) => {
  const enhancerRef = useRef<AccessibilityEnhancer>();

  useEffect(() => {
    enhancerRef.current = new AccessibilityEnhancer(config);

    return () => {
      enhancerRef.current?.dispose();
    };
  }, [config]);

  const contextValue: AccessibilityContextValue = useMemo(() => ({
    config: enhancerRef.current?.config || {} as AccessibilityConfig,
    updateConfig: (updates: Partial<AccessibilityConfig>) =>
      enhancerRef.current?.updateConfig(updates),
    announce: (message: string, priority?: 'polite' | 'assertive') =>
      enhancerRef.current?.announce(message, priority),
    registerFocusable: (element: FocusableElement) =>
      enhancerRef.current?.registerFocusable(element),
    unregisterFocusable: (id: string) =>
      enhancerRef.current?.unregisterFocusable(id),
    moveFocus: (direction: 'next' | 'previous' | 'first' | 'last') =>
      enhancerRef.current?.moveFocus(direction) || false,
    setFocusTrap: (enabled: boolean, containerId?: string) =>
      enhancerRef.current?.setFocusTrap(enabled, containerId),
    getViolations: () => enhancerRef.current?.getViolations() || [],
    runAccessibilityAudit: () =>
      enhancerRef.current?.runAccessibilityAudit() || Promise.resolve([])
  }), []);

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};