'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemePreset, themes } from './types'
import { getThemeSettings } from '@/lib/actions/theme'

interface ThemeContextType {
  theme: ThemePreset
  setTheme: (theme: ThemePreset) => void
  themeColors: typeof themes[ThemePreset]['colors']
  applyLogoFilter: boolean
  setApplyLogoFilter: (apply: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: ThemePreset
  initialApplyLogoFilter?: boolean
  skipClientFetch?: boolean // If true, skip client-side fetch (theme already set server-side)
}

export function ThemeProvider({ 
  children, 
  initialTheme = 'baked',
  initialApplyLogoFilter = true,
  skipClientFetch = false
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemePreset>(initialTheme)
  const [applyLogoFilter, setApplyLogoFilterState] = useState<boolean>(initialApplyLogoFilter)
  const [mounted, setMounted] = useState(!skipClientFetch) // If skipClientFetch, consider mounted immediately

  useEffect(() => {
    // Skip client-side fetch if theme was already set server-side
    if (skipClientFetch) {
      setMounted(true)
      return
    }

    // Fetch theme settings from database on mount (fallback for client-side navigation)
    const loadThemeSettings = async () => {
      try {
        const settings = await getThemeSettings()
        if (settings.theme && themes[settings.theme]) {
          setThemeState(settings.theme)
        }
        setApplyLogoFilterState(settings.applyLogoFilter)
      } catch (error) {
        console.error('Failed to load theme settings:', error)
        // Fallback to initial values
      }
      setMounted(true)
    }

    loadThemeSettings()
  }, [skipClientFetch])

  useEffect(() => {
    if (!mounted) return

    // Only update CSS variables if theme changed from initial (to avoid hydration mismatch)
    // If skipClientFetch is true, the styles are already set server-side via style tag
    if (skipClientFetch && theme === initialTheme) {
      return
    }

    // Apply theme to document root
    const themeColors = themes[theme].colors
    const root = document.documentElement

    root.style.setProperty('--theme-primary', themeColors.primary)
    root.style.setProperty('--theme-secondary', themeColors.secondary)
    root.style.setProperty('--theme-accent', themeColors.accent)
    root.style.setProperty('--theme-tertiary', themeColors.tertiary)
    root.style.setProperty('--theme-quaternary', themeColors.quaternary)
    root.style.setProperty('--theme-background', themeColors.background)
    root.style.setProperty('--theme-surface', themeColors.surface)
    root.style.setProperty('--theme-text', themeColors.text)
    root.style.setProperty('--theme-text-secondary', themeColors.textSecondary)
    root.style.setProperty('--theme-gradient-start', themeColors.gradientStart)
    root.style.setProperty('--theme-gradient-middle', themeColors.gradientMiddle)
    root.style.setProperty('--theme-gradient-end', themeColors.gradientEnd)

  }, [theme, mounted, skipClientFetch, initialTheme])

  const setTheme = (newTheme: ThemePreset) => {
    // Update UI state
    // Note: ThemeSwitcher will handle the actual database update via server action
    setThemeState(newTheme)
  }

  const setApplyLogoFilter = (apply: boolean) => {
    // Update UI state
    // Note: ThemeSwitcher will handle the actual database update via server action
    setApplyLogoFilterState(apply)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themeColors: themes[theme].colors,
        applyLogoFilter,
        setApplyLogoFilter,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

