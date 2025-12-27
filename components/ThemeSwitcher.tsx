'use client'

import { useTheme } from '@/lib/theme/context'
import { ThemePreset, themes } from '@/lib/theme/types'
import { updateTheme, updateLogoFilter } from '@/lib/actions/theme'
import { useState } from 'react'
import Button from './ui/Button'
import ToggleSwitch from './ui/ToggleSwitch'

export default function ThemeSwitcher() {
  const { theme, setTheme, applyLogoFilter, setApplyLogoFilter } = useTheme()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleThemeChange = async (newTheme: ThemePreset) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateTheme(newTheme)
      setTheme(newTheme)
    } catch (error) {
      console.error('Failed to update theme:', error)
      alert('Failed to update theme. Only admins can change the theme.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleLogoFilterChange = async (apply: boolean) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await updateLogoFilter(apply)
      setApplyLogoFilter(apply)
    } catch (error) {
      console.error('Failed to update logo filter:', error)
      alert('Failed to update logo filter setting. Only admins can change this.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h3 
        className="text-lg font-semibold"
        style={{ color: 'var(--theme-text)' }}
      >
        Theme Settings
      </h3>
      <p 
        className="text-sm"
        style={{ color: 'var(--theme-text-secondary)' }}
      >
        Choose a theme preset to customize the appearance of the site
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(themes) as ThemePreset[]).map((themeKey) => {
          const themeData = themes[themeKey]
          const isActive = theme === themeKey

          return (
            <Button
              key={themeKey}
              onClick={() => handleThemeChange(themeKey)}
              disabled={isUpdating}
              variant="ghost"
              fullWidth={false}
              className={`relative p-4 h-auto border-2 transition-all ${
                isActive
                  ? 'border-theme-accent ring-2 ring-theme-accent ring-opacity-50'
                  : 'border-gray-200 hover:border-theme-primary'
              }`}
              style={{
                background: `radial-gradient(circle at top left, ${themeData.colors.gradientStart}, ${themeData.colors.gradientMiddle}, ${themeData.colors.gradientEnd})`,
              }}
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span
                    className="font-medium"
                    style={{ color: themeData.colors.text }}
                  >
                    {themeData.displayName}
                  </span>
                  {isActive && (
                    <svg
                      className="w-5 h-5"
                      style={{ color: themeData.colors.accent }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: themeData.colors.primary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: themeData.colors.secondary }}
                  />
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: themeData.colors.accent }}
                  />
                </div>
              </div>
            </Button>
          )
        })}
      </div>
      
      <div className="pt-4 border-t" style={{ borderColor: 'var(--theme-secondary)' }}>
        <ToggleSwitch
          checked={applyLogoFilter}
          onChange={handleLogoFilterChange}
          disabled={isUpdating}
          label="Apply theme on logo"
          description="Tint the logo colors to match the selected theme"
        />
      </div>
    </div>
  )
}

