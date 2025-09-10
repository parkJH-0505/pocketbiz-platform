// Visible.vc 테마를 기반으로 한 스타트업 평가 시스템 테마
export const theme = {
  name: "Startup Assessment System Theme",
  version: "1.0.0",
  
  colors: {
    primary: {
      main: "rgb(15, 82, 222)",
      hover: "rgb(12, 66, 178)",
      light: "rgba(15, 82, 222, 0.1)",
      dark: "rgb(10, 54, 146)"
    },
    secondary: {
      main: "rgb(76, 206, 148)",
      light: "rgb(220, 252, 231)",
      dark: "rgb(20, 83, 45)"
    },
    accent: {
      purple: "rgb(112, 46, 220)",
      purpleLight: "rgb(147, 133, 255)",
      blue: "rgb(92, 183, 242)",
      orange: "rgb(251, 146, 60)",
      red: "rgb(239, 68, 68)"
    },
    neutral: {
      black: "rgb(0, 0, 0)",
      dark: "rgb(24, 24, 27)",
      darkGray: "rgb(32, 32, 32)",
      gray: "rgb(82, 82, 91)",
      lightGray: "rgb(113, 113, 122)",
      lighter: "rgb(161, 161, 170)",
      border: "rgb(228, 228, 231)",
      light: "rgb(250, 250, 250)",
      white: "rgb(255, 255, 255)"
    },
    alpha: {
      black65: "rgba(0, 0, 0, 0.65)",
      dark70: "rgba(32, 32, 32, 0.7)",
      white80: "rgba(255, 255, 255, 0.8)"
    },
    // 축별 색상
    axis: {
      GO: { main: "rgb(112, 46, 220)", light: "rgba(112, 46, 220, 0.1)" },
      EC: { main: "rgb(76, 206, 148)", light: "rgba(76, 206, 148, 0.1)" },
      PT: { main: "rgb(251, 146, 60)", light: "rgba(251, 146, 60, 0.1)" },
      PF: { main: "rgb(15, 82, 222)", light: "rgba(15, 82, 222, 0.1)" },
      TO: { main: "rgb(239, 68, 68)", light: "rgba(239, 68, 68, 0.1)" }
    }
  },
  
  typography: {
    fontFamily: {
      primary: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Fira Mono", "Droid Sans Mono", "Courier New", monospace'
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
      "5xl": "48px"
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    }
  },
  
  spacing: {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    8: "32px",
    10: "40px",
    12: "48px",
    16: "64px",
    20: "80px",
    24: "96px",
    32: "128px"
  },
  
  borderRadius: {
    none: "0",
    sm: "4px",
    default: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
    full: "9999px"
  },
  
  boxShadow: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
    default: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)"
  },
  
  transitions: {
    default: "all 0.15s cubic-bezier(0.4, 0, 1, 1)",
    color: "color 0.15s cubic-bezier(0.4, 0, 1, 1)",
    opacity: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
    transform: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "0.1s linear",
    slow: "0.7s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  
  breakpoints: {
    sm: "640px",
    md: "768px", 
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px"
  }
}

export type Theme = typeof theme
export default theme