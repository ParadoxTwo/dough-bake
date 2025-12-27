export type ThemePreset = 'blossom' | 'ocean' | 'sunset' | 'forest' | 'lavender' | 'classic' | 'baked'

export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  tertiary: string
  quaternary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  gradientStart: string
  gradientMiddle: string
  gradientEnd: string
}

export interface Theme {
  name: string
  displayName: string
  colors: ThemeColors
}

export const themes: Record<ThemePreset, Theme> = {
  blossom: {
    name: 'blossom',
    displayName: 'Blossom Pink',
    colors: {
      primary: '#f8b4d9',
      secondary: '#ffd6e8',
      accent: '#ff6b9d',
      tertiary: '#4dd0e1',
      quaternary: '#aed581',
      background: '#ffffff',
      surface: '#fff5f9',
      text: '#2d1b2e',
      textSecondary: '#6b4c5a',
      gradientStart: '#ffd6e8',
      gradientMiddle: '#ffffff',
      gradientEnd: '#f8b4d9',
    },
  },
  ocean: {
    name: 'ocean',
    displayName: 'Ocean Breeze',
    colors: {
      primary: '#4fc3f7',
      secondary: '#b3e5fc',
      accent: '#0288d1',
      tertiary: '#ffd54f',
      quaternary: '#f06292',
      background: '#ffffff',
      surface: '#e0f7fa',
      text: '#004d40',
      textSecondary: '#00695c',
      gradientStart: '#b3e5fc',
      gradientMiddle: '#ffffff',
      gradientEnd: '#81d4fa',
    },
  },
  sunset: {
    name: 'sunset',
    displayName: 'Sunset Glow',
    colors: {
      primary: '#ffb74d',
      secondary: '#ffe0b2',
      accent: '#ff9800',
      tertiary: '#66bb6a',
      quaternary: '#9575cd',
      background: '#ffffff',
      surface: '#fff3e0',
      text: '#3e2723',
      textSecondary: '#5d4037',
      gradientStart: '#ffe0b2',
      gradientMiddle: '#ffffff',
      gradientEnd: '#ffcc80',
    },
  },
  forest: {
    name: 'forest',
    displayName: 'Forest Green',
    colors: {
      primary: '#81c784',
      secondary: '#c8e6c9',
      accent: '#4caf50',
      tertiary: '#ba68c8',
      quaternary: '#ff8a65',
      background: '#ffffff',
      surface: '#f1f8e9',
      text: '#1b5e20',
      textSecondary: '#2e7d32',
      gradientStart: '#c8e6c9',
      gradientMiddle: '#ffffff',
      gradientEnd: '#a5d6a7',
    },
  },
  lavender: {
    name: 'lavender',
    displayName: 'Lavender Dream',
    colors: {
      primary: '#ba68c8',
      secondary: '#e1bee7',
      accent: '#9c27b0',
      tertiary: '#ffd54f',
      quaternary: '#4dd0e1',
      background: '#ffffff',
      surface: '#f3e5f5',
      text: '#4a148c',
      textSecondary: '#6a1b9a',
      gradientStart: '#e1bee7',
      gradientMiddle: '#ffffff',
      gradientEnd: '#ce93d8',
    },
  },
  classic: {
    name: 'classic',
    displayName: 'Classic Amber',
    colors: {
      primary: '#ffb300',
      secondary: '#ffe082',
      accent: '#ffa000',
      tertiary: '#42a5f5',
      quaternary: '#ec407a',
      background: '#ffffff',
      surface: '#fff8e1',
      text: '#171717',
      textSecondary: '#424242',
      gradientStart: '#fff3c4',
      gradientMiddle: '#ffffff',
      gradientEnd: '#ffe082',
    },
  },
  'baked': {
    name: 'baked',
    displayName: 'Baked Dough',
    colors: {
      primary: '#D4AF37',
      secondary: '#E8D9C8',
      accent: '#8B4513',
      tertiary: '#42a5f5',
      quaternary: '#ec407a',
      background: '#FFFFFF',
      surface: '#F5E7D6',
      text: '#5A3A2B',
      textSecondary: '#6B3E26',
      gradientStart: '#F5E7D6',
      gradientMiddle: '#FFFFFF',
      gradientEnd: '#E0D8C8',
    },
  },
}

