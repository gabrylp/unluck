import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-white/90 hover:bg-white text-black font-medium',
  secondary: 'glass glass-hover text-white/80',
  ghost: 'hover:bg-white/5 text-white/50',
  danger: 'bg-red-500/80 hover:bg-red-500 text-white',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-none',
  md: 'px-4 py-2 text-sm rounded-none',
  lg: 'px-6 py-3 text-base rounded-none',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium transition-all disabled:opacity-30 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  )
}
