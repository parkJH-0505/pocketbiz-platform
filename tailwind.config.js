import { theme } from './src/lib/theme.ts'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 기본 색상 완전히 교체 (oklab/oklch 제거)
    colors: {
      // 기본 색상들을 RGB로 정의
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      // Gray scale (RGB)
      gray: {
        50: 'rgb(249, 250, 251)',
        100: 'rgb(243, 244, 246)',
        200: 'rgb(229, 231, 235)',
        300: 'rgb(209, 213, 219)',
        400: 'rgb(156, 163, 175)',
        500: 'rgb(107, 114, 128)',
        600: 'rgb(75, 85, 99)',
        700: 'rgb(55, 65, 81)',
        800: 'rgb(31, 41, 55)',
        900: 'rgb(17, 24, 39)',
        950: 'rgb(3, 7, 18)',
      },

      // 기본 색상들
      red: {
        50: 'rgb(254, 242, 242)',
        100: 'rgb(254, 226, 226)',
        200: 'rgb(254, 202, 202)',
        300: 'rgb(252, 165, 165)',
        400: 'rgb(248, 113, 113)',
        500: 'rgb(239, 68, 68)',
        600: 'rgb(220, 38, 38)',
        700: 'rgb(185, 28, 28)',
        800: 'rgb(153, 27, 27)',
        900: 'rgb(127, 29, 29)',
        950: 'rgb(69, 10, 10)',
      },

      blue: {
        50: 'rgb(239, 246, 255)',
        100: 'rgb(219, 234, 254)',
        200: 'rgb(191, 219, 254)',
        300: 'rgb(147, 197, 253)',
        400: 'rgb(96, 165, 250)',
        500: 'rgb(59, 130, 246)',
        600: 'rgb(37, 99, 235)',
        700: 'rgb(29, 78, 216)',
        800: 'rgb(30, 64, 175)',
        900: 'rgb(30, 58, 138)',
        950: 'rgb(23, 37, 84)',
      },

      green: {
        50: 'rgb(240, 253, 244)',
        100: 'rgb(220, 252, 231)',
        200: 'rgb(187, 247, 208)',
        300: 'rgb(134, 239, 172)',
        400: 'rgb(74, 222, 128)',
        500: 'rgb(34, 197, 94)',
        600: 'rgb(22, 163, 74)',
        700: 'rgb(21, 128, 61)',
        800: 'rgb(22, 101, 52)',
        900: 'rgb(20, 83, 45)',
        950: 'rgb(5, 46, 22)',
      },

      yellow: {
        50: 'rgb(254, 252, 232)',
        100: 'rgb(254, 249, 195)',
        200: 'rgb(254, 240, 138)',
        300: 'rgb(253, 224, 71)',
        400: 'rgb(250, 204, 21)',
        500: 'rgb(234, 179, 8)',
        600: 'rgb(202, 138, 4)',
        700: 'rgb(161, 98, 7)',
        800: 'rgb(133, 77, 14)',
        900: 'rgb(113, 63, 18)',
        950: 'rgb(66, 32, 6)',
      },

      indigo: {
        50: 'rgb(238, 242, 255)',
        100: 'rgb(224, 231, 255)',
        200: 'rgb(199, 210, 254)',
        300: 'rgb(165, 180, 252)',
        400: 'rgb(129, 140, 248)',
        500: 'rgb(99, 102, 241)',
        600: 'rgb(79, 70, 229)',
        700: 'rgb(67, 56, 202)',
        800: 'rgb(55, 48, 163)',
        900: 'rgb(49, 46, 129)',
        950: 'rgb(30, 27, 75)',
      },

      purple: {
        50: 'rgb(250, 245, 255)',
        100: 'rgb(243, 232, 255)',
        200: 'rgb(233, 213, 255)',
        300: 'rgb(216, 180, 254)',
        400: 'rgb(192, 132, 252)',
        500: 'rgb(168, 85, 247)',
        600: 'rgb(147, 51, 234)',
        700: 'rgb(126, 34, 206)',
        800: 'rgb(107, 33, 168)',
        900: 'rgb(88, 28, 135)',
        950: 'rgb(59, 7, 100)',
      },

      orange: {
        50: 'rgb(255, 247, 237)',
        100: 'rgb(255, 237, 213)',
        200: 'rgb(254, 215, 170)',
        300: 'rgb(253, 186, 116)',
        400: 'rgb(251, 146, 60)',
        500: 'rgb(249, 115, 22)',
        600: 'rgb(234, 88, 12)',
        700: 'rgb(194, 65, 12)',
        800: 'rgb(154, 52, 18)',
        900: 'rgb(124, 45, 18)',
        950: 'rgb(67, 20, 7)',
      },

      // 커스텀 테마 색상
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      neutral: theme.colors.neutral,
      axis: theme.colors.axis
    },
    extend: {
      fontFamily: {
        sans: theme.typography.fontFamily.primary.split(','),
        mono: theme.typography.fontFamily.mono.split(',')
      },
      fontSize: theme.typography.fontSize,
      fontWeight: theme.typography.fontWeight,
      borderRadius: theme.borderRadius,
      boxShadow: theme.boxShadow,
      spacing: theme.spacing,
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'check': 'check 0.3s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'glow': 'glow 2s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        check: {
          '0%': { transform: 'scale(0) rotate(45deg)' },
          '100%': { transform: 'scale(1) rotate(45deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(147, 97, 253, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(147, 97, 253, 0.8)' }
        }
      }
    },
  },
  plugins: [],
}