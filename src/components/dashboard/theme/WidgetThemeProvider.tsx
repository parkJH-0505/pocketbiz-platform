/**
 * Widget Theme Provider
 * 위젯 테마 시스템 및 컨텍스트 제공
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
}

interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  fontWeight: {
    light: number;
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ThemeBorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  full: number;
}

interface WidgetTheme {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'auto';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  customVariables?: Record<string, any>;
}

interface ThemeContextValue {
  currentTheme: WidgetTheme;
  themes: WidgetTheme[];
  setTheme: (themeId: string) => void;
  createTheme: (theme: Partial<WidgetTheme>) => WidgetTheme;
  updateTheme: (themeId: string, updates: Partial<WidgetTheme>) => void;
  deleteTheme: (themeId: string) => void;
  applyThemeToWidget: (widgetId: string, themeId: string) => void;
  getWidgetTheme: (widgetId: string) => WidgetTheme;
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

// 기본 라이트 테마
const defaultLightTheme: WidgetTheme = {
  id: 'default-light',
  name: '기본 라이트',
  mode: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: 11,
      sm: 13,
      md: 14,
      lg: 16,
      xl: 20,
      xxl: 24
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)'
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease'
  }
};

// 기본 다크 테마
const defaultDarkTheme: WidgetTheme = {
  ...defaultLightTheme,
  id: 'default-dark',
  name: '기본 다크',
  mode: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#22d3ee',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.5)'
  }
};

// 프로페셔널 테마
const professionalTheme: WidgetTheme = {
  ...defaultLightTheme,
  id: 'professional',
  name: '프로페셔널',
  mode: 'light',
  colors: {
    ...defaultLightTheme.colors,
    primary: '#2563eb',
    secondary: '#7c3aed',
    background: '#fafafa',
    surface: '#ffffff',
    text: '#111827',
    textSecondary: '#4b5563'
  },
  borderRadius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 6,
    full: 9999
  }
};

// 네온 테마
const neonTheme: WidgetTheme = {
  ...defaultDarkTheme,
  id: 'neon',
  name: '네온',
  mode: 'dark',
  colors: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    success: '#00ff00',
    warning: '#ffff00',
    danger: '#ff0066',
    info: '#00ccff',
    background: '#000814',
    surface: '#001d3d',
    text: '#ffffff',
    textSecondary: '#c9e4ff',
    border: '#003566',
    shadow: 'rgba(0, 255, 255, 0.2)'
  },
  shadows: {
    sm: '0 0 10px rgba(0, 255, 255, 0.2)',
    md: '0 0 20px rgba(0, 255, 255, 0.3)',
    lg: '0 0 30px rgba(0, 255, 255, 0.4)',
    xl: '0 0 40px rgba(0, 255, 255, 0.5)'
  }
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const useWidgetTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useWidgetTheme must be used within WidgetThemeProvider');
  }
  return context;
};

interface WidgetThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
}

export const WidgetThemeProvider: React.FC<WidgetThemeProviderProps> = ({
  children,
  initialTheme = 'default-light'
}) => {
  const [themes, setThemes] = useState<WidgetTheme[]>([
    defaultLightTheme,
    defaultDarkTheme,
    professionalTheme,
    neonTheme
  ]);

  const [currentThemeId, setCurrentThemeId] = useState(initialTheme);
  const [widgetThemes, setWidgetThemes] = useState<Record<string, string>>({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  const currentTheme = themes.find(t => t.id === currentThemeId) || defaultLightTheme;

  // 시스템 다크 모드 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      if (currentTheme.mode === 'auto') {
        setIsDarkMode(e.matches);
      }
    };

    if (currentTheme.mode === 'auto') {
      setIsDarkMode(mediaQuery.matches);
    } else {
      setIsDarkMode(currentTheme.mode === 'dark');
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme.mode]);

  // CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement;
    const theme = isDarkMode && currentTheme.mode === 'auto'
      ? themes.find(t => t.id === 'default-dark') || currentTheme
      : currentTheme;

    // 색상 변수
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--widget-color-${key}`, value);
    });

    // 간격 변수
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--widget-spacing-${key}`, `${value}px`);
    });

    // 모서리 둥글기 변수
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--widget-radius-${key}`, `${value}px`);
    });

    // 그림자 변수
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--widget-shadow-${key}`, value);
    });

    // 폰트 변수
    root.style.setProperty('--widget-font-family', theme.typography.fontFamily);

    // 커스텀 변수
    if (theme.customVariables) {
      Object.entries(theme.customVariables).forEach(([key, value]) => {
        root.style.setProperty(`--widget-custom-${key}`, value);
      });
    }
  }, [currentTheme, isDarkMode, themes]);

  const setTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    localStorage.setItem('widget-theme', themeId);
  };

  const createTheme = (themeData: Partial<WidgetTheme>): WidgetTheme => {
    const baseTheme = themeData.mode === 'dark' ? defaultDarkTheme : defaultLightTheme;
    const newTheme: WidgetTheme = {
      ...baseTheme,
      ...themeData,
      id: themeData.id || `custom-${Date.now()}`,
      name: themeData.name || '커스텀 테마',
      colors: { ...baseTheme.colors, ...(themeData.colors || {}) },
      typography: { ...baseTheme.typography, ...(themeData.typography || {}) },
      spacing: { ...baseTheme.spacing, ...(themeData.spacing || {}) },
      borderRadius: { ...baseTheme.borderRadius, ...(themeData.borderRadius || {}) },
      shadows: { ...baseTheme.shadows, ...(themeData.shadows || {}) },
      transitions: { ...baseTheme.transitions, ...(themeData.transitions || {}) }
    };

    setThemes(prev => [...prev, newTheme]);
    return newTheme;
  };

  const updateTheme = (themeId: string, updates: Partial<WidgetTheme>) => {
    setThemes(prev =>
      prev.map(theme =>
        theme.id === themeId
          ? {
              ...theme,
              ...updates,
              colors: { ...theme.colors, ...(updates.colors || {}) },
              typography: { ...theme.typography, ...(updates.typography || {}) },
              spacing: { ...theme.spacing, ...(updates.spacing || {}) },
              borderRadius: { ...theme.borderRadius, ...(updates.borderRadius || {}) },
              shadows: { ...theme.shadows, ...(updates.shadows || {}) },
              transitions: { ...theme.transitions, ...(updates.transitions || {}) }
            }
          : theme
      )
    );
  };

  const deleteTheme = (themeId: string) => {
    // 기본 테마는 삭제 불가
    if (themeId.startsWith('default')) return;

    setThemes(prev => prev.filter(theme => theme.id !== themeId));

    // 현재 테마가 삭제된 경우 기본 테마로 전환
    if (currentThemeId === themeId) {
      setTheme('default-light');
    }
  };

  const applyThemeToWidget = (widgetId: string, themeId: string) => {
    setWidgetThemes(prev => ({
      ...prev,
      [widgetId]: themeId
    }));
  };

  const getWidgetTheme = (widgetId: string): WidgetTheme => {
    const themeId = widgetThemes[widgetId] || currentThemeId;
    return themes.find(t => t.id === themeId) || defaultLightTheme;
  };

  const toggleDarkMode = () => {
    const newThemeId = isDarkMode ? 'default-light' : 'default-dark';
    setTheme(newThemeId);
  };

  const value: ThemeContextValue = {
    currentTheme,
    themes,
    setTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    applyThemeToWidget,
    getWidgetTheme,
    toggleDarkMode,
    isDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook: 위젯별 테마 사용
 */
export function useWidgetStyles(widgetId: string) {
  const { getWidgetTheme } = useWidgetTheme();
  const theme = getWidgetTheme(widgetId);

  return {
    theme,
    styles: {
      container: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        borderRadius: theme.borderRadius.md,
        fontFamily: theme.typography.fontFamily
      },
      header: {
        backgroundColor: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.md
      },
      body: {
        padding: theme.spacing.md
      },
      text: {
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.md,
        lineHeight: theme.typography.lineHeight.normal
      },
      primaryButton: {
        backgroundColor: theme.colors.primary,
        color: '#ffffff',
        borderRadius: theme.borderRadius.sm,
        padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
        transition: theme.transitions.fast
      }
    }
  };
}

export default WidgetThemeProvider;