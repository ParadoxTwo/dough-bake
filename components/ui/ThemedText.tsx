import type { ComponentType, HTMLAttributes } from 'react'

type ThemedTextTone = 'primary' | 'secondary' | 'accent' | 'danger'
type ThemedTextSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl' | '10xl'
type ThemedTextWeight = 'normal' | 'medium' | 'semibold' | 'bold'
type ThemedTextAs = 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4'

interface ThemedTextProps extends HTMLAttributes<HTMLElement> {
  as?: ThemedTextAs
  tone?: ThemedTextTone
  size?: ThemedTextSize
  weight?: ThemedTextWeight
}

const toneToColor: Record<ThemedTextTone, string> = {
  primary: 'var(--theme-text)',
  secondary: 'var(--theme-text-secondary)',
  accent: 'var(--theme-accent)',
  danger: '#dc2626',
}

const sizeToClassName: Record<ThemedTextSize, string> = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
  '7xl': 'text-7xl',
  '8xl': 'text-8xl',
  '9xl': 'text-9xl',
  '10xl': 'text-10xl',
}

const weightToClassName: Record<ThemedTextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

export default function ThemedText({
  as = 'p',
  tone = 'primary',
  size = 'base',
  weight = 'normal',
  className = '',
  style,
  ...props
}: ThemedTextProps) {
  const Tag = as as keyof HTMLElementTagNameMap | ComponentType<HTMLAttributes<HTMLElement>>

  const sizeClass = sizeToClassName[size]
  const weightClass = weightToClassName[weight]

  return (
    <Tag
      className={`${sizeClass} ${weightClass} ${className}`.trim()}
      style={{ color: toneToColor[tone], ...style }}
      {...props}
    />
  )
}


