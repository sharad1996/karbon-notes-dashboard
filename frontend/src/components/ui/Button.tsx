import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'md' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent shadow-md shadow-accent-glow hover:bg-accent-hover',
  secondary: 'border border-rule bg-surface text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
}

const SIZES: Record<Size, string> = {
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  icon: 'size-8 rounded-lg',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium transition-colors active:scale-[0.98]',
        'focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}
