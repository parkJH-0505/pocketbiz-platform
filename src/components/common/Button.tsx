import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

const variantClasses = {
  primary: `
    bg-primary-main text-white
    hover:bg-primary-hover active:bg-primary-dark
    focus:outline-none focus:ring-2 focus:ring-primary-main focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  secondary: `
    bg-white text-neutral-dark border border-neutral-border
    hover:bg-neutral-light hover:border-neutral-gray
    focus:outline-none focus:ring-2 focus:ring-neutral-border focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  ghost: `
    bg-transparent text-neutral-gray
    hover:text-neutral-dark hover:bg-neutral-light
    focus:outline-none focus:ring-2 focus:ring-neutral-border focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  danger: `
    bg-accent-red text-white
    hover:bg-red-700 active:bg-red-800
    focus:outline-none focus:ring-2 focus:ring-accent-red focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `
}

const sizeClasses = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base'
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = variantClasses[variant]
  const sizeStyles = sizeClasses[size]
  const widthStyles = fullWidth ? 'w-full' : ''
  
  const combinedStyles = `
    ${baseStyles}
    ${sizeStyles}
    ${widthStyles}
    inline-flex items-center justify-center gap-2
    font-medium rounded-default
    transition-all duration-150
    ${className}
  `.trim()
  
  return (
    <button
      className={combinedStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}