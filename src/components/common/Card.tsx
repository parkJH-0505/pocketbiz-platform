import type { HTMLAttributes, ReactNode } from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'glass'
  padding?: 'none' | 'small' | 'medium' | 'large'
  hoverEffect?: boolean
}

const paddingClasses = {
  none: 'p-0',
  small: 'p-4',
  medium: 'p-6',
  large: 'p-8'
}

const variantClasses = {
  default: `
    bg-white rounded-lg
    shadow-default
    border border-neutral-border
  `,
  bordered: `
    bg-white rounded-lg
    border-2 border-neutral-border
    transition-all duration-300
  `,
  elevated: `
    bg-white rounded-lg
    shadow-lg
    transition-all duration-300
  `,
  glass: `
    bg-white bg-opacity-80 backdrop-blur-lg rounded-lg
    border border-white border-opacity-20
    shadow-xl
    transition-all duration-300
  `
}

export const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  hoverEffect = false,
  className = '',
  ...props
}: CardProps) => {
  const baseStyles = variantClasses[variant]
  const paddingStyles = paddingClasses[padding]
  const hoverStyles = hoverEffect 
    ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer transform' 
    : ''
  
  const combinedStyles = `
    ${baseStyles}
    ${paddingStyles}
    ${hoverStyles}
    transition-all duration-200
    ${className}
  `.trim()
  
  return (
    <div className={combinedStyles} {...props}>
      {children}
    </div>
  )
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  action?: ReactNode
}

export const CardHeader = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) => {
  return (
    <div className={`mb-6 ${className}`} {...props}>
      {(title || subtitle || action) ? (
        <div className="flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-2xl font-semibold text-neutral-dark">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-neutral-gray">
                {subtitle}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4">
              {action}
            </div>
          )}
        </div>
      ) : children}
    </div>
  )
}

export const CardBody = ({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`text-neutral-dark ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardFooter = ({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={`mt-6 pt-6 border-t border-neutral-border ${className}`} {...props}>
      {children}
    </div>
  )
}