export interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  animated?: boolean
  className?: string
}

const variantClasses = {
  default: 'bg-primary-main',
  success: 'bg-secondary-main',
  warning: 'bg-accent-orange',
  error: 'bg-accent-red'
}

const sizeClasses = {
  small: 'h-1',
  medium: 'h-2',
  large: 'h-4'
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'medium',
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-neutral-dark">{label}</span>}
          {showValue && <span className="text-sm text-neutral-gray">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-neutral-border rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            rounded-full
            transition-all duration-300 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'primary' | 'white'
  className?: string
}

const spinnerSizeClasses = {
  small: 'w-4 h-4 border-2',
  medium: 'w-8 h-8 border-[3px]',
  large: 'w-12 h-12 border-4'
}

const spinnerVariantClasses = {
  default: 'border-neutral-gray border-t-transparent',
  primary: 'border-primary-light border-t-primary-main',
  white: 'border-neutral-white/30 border-t-neutral-white'
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  variant = 'default',
  className = ''
}) => {
  return (
    <div
      className={`
        rounded-full
        animate-spin
        ${spinnerSizeClasses[size]}
        ${spinnerVariantClasses[variant]}
        ${className}
      `}
    />
  )
}