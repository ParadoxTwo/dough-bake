'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from '@/lib/theme/context'
import { ThemeColors } from '@/lib/theme/types'

interface LogoProps {
  className?: string
  size?: number
}

/**
 * Converts hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  const cleanHex = hex.replace('#', '')
  
  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Generates CSS filter string based on theme colors
 * Uses the accent color to determine the hue rotation and saturation
 */
function generateLogoFilter(colors: ThemeColors): string {
  const hsl = hexToHsl(colors.accent)
  
  // Calculate filter values based on HSL
  // Base sepia for warm tone conversion
  const sepia = 15
  
  // Increase saturation to make colors more vibrant
  // Use theme's saturation as base, but boost it for filter effect
  const saturation = Math.min(150 + (hsl.s * 0.3), 200)
  
  // Use hue for color shifting
  // Adjust hue to account for sepia's yellow tint (around 40deg)
  const hueRotate = hsl.h - 40
  
  // Adjust brightness based on lightness
  // Darker colors need more brightness, lighter colors need less
  const brightness = 0.95 + (hsl.l / 100) * 0.15
  
  return `sepia(${sepia}%) saturate(${saturation}%) hue-rotate(${hueRotate}deg) brightness(${brightness.toFixed(2)})`
}

export default function Logo({ className = '', size = 120 }: LogoProps) {
  const { theme, themeColors, applyLogoFilter } = useTheme()

  // Calculate CSS filter to tint the logo based on theme
  // For baked theme, use natural colors (no filter)
  // For other themes, apply a color tint using the theme's accent color
  // Only apply if applyLogoFilter is true
  const getLogoFilter = () => {
    if (!applyLogoFilter || theme === 'baked') {
      return 'none'
    }

    return generateLogoFilter(themeColors)
  }

  return (
    <div 
      className={className}
      style={{ 
        width: size, 
        height: size,
        position: 'relative',
        display: 'inline-block'
      }}
    >
      <Image
        src="/dough-bake.png"
        alt="Dough & Bake Logo"
        width={size}
        height={size}
        style={{ 
          width: size, 
          height: size,
          filter: getLogoFilter(),
          transition: 'filter 0.3s ease-in-out'
        }}
        priority
      />
      {/* Optional: Add a subtle overlay for more color control */}
      {applyLogoFilter && theme !== 'baked' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            mixBlendMode: 'color',
            backgroundColor: themeColors.accent,
            opacity: 0.15,
            pointerEvents: 'none',
            transition: 'opacity 0.3s ease-in-out, background-color 0.3s ease-in-out'
          }}
        />
      )}
    </div>
  )
}

