import { ReactElement, ReactNode } from 'react'
import styles from './Button.module.css'

export interface ButtonProps {
  onClick?: () => void
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  /** Visual weight. @default 'solid' */
  variant?: 'solid' | 'outline' | 'danger'
  /** Corner treatment. `pill` for marketing CTAs, `rounded` for forms. @default 'rounded' */
  shape?: 'rounded' | 'pill'
  /** @default 'md' */
  size?: 'sm' | 'md'
  /** Tints the `outline` variant's hover state red for destructive-but-secondary actions. Only meaningful combined with `variant="outline"`. @default undefined */
  tone?: 'danger'
  disabled?: boolean
  /** Shows a spinner and blocks interaction. @default false */
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
  ariaLabel?: string
  ariaPressed?: 'true' | 'false'
  ariaDescribedBy?: string
  className?: string
}

const Button = ({
  onClick,
  children,
  type = 'button',
  variant = 'solid',
  shape = 'rounded',
  size = 'md',
  tone,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  fullWidth = false,
  ariaLabel,
  ariaPressed,
  ariaDescribedBy,
  className: extraClassName,
}: ButtonProps): ReactElement => {
  const className = [
    styles.button,
    styles[variant],
    styles[shape],
    styles[size],
    tone === 'danger' && styles.toneDanger,
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      className={className}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading || undefined}
    >
      {loading && (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </>
      )}
      {iconLeft && !loading && (
        <span className={styles.icon} aria-hidden="true">
          {iconLeft}
        </span>
      )}
      <span className={loading ? 'sr-only' : undefined}>{children}</span>
      {iconRight && !loading && (
        <span className={styles.icon} aria-hidden="true">
          {iconRight}
        </span>
      )}
    </button>
  )
}

export default Button
