import type { ChangeEvent, KeyboardEvent, ReactNode, Ref } from 'react'
import { cx } from '../../utils/cx'
import styles from './Input.module.css'

export interface InputProps {
  type?: string
  value?: string
  placeholder?: string
  /** Error border + `aria-invalid`. @default false */
  invalid?: boolean
  disabled?: boolean
  /** Leading icon (e.g. search). */
  prefixIcon?: ReactNode
  /** Trailing node (e.g. clear button). */
  suffix?: ReactNode
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  id?: string
  name?: string
  required?: boolean
  autoComplete?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
  ref?: Ref<HTMLInputElement>
}

const Input = ({
  type = 'text',
  value,
  placeholder,
  invalid = false,
  disabled = false,
  prefixIcon,
  suffix,
  onChange,
  onKeyDown,
  id,
  name,
  required,
  autoComplete,
  ariaLabel,
  ariaDescribedBy,
  className: extraClassName,
  ref,
}: InputProps) => {
  const fieldClassName = cx(styles.field, invalid && styles.invalid, extraClassName)

  return (
    <div className={styles.wrapper}>
      {prefixIcon && (
        <span className={styles.prefixIcon} aria-hidden="true">
          {prefixIcon}
        </span>
      )}
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        onChange={onChange}
        onKeyDown={onKeyDown}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={fieldClassName}
      />
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  )
}

export default Input
