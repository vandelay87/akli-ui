import type { CSSProperties, ElementType, MouseEvent, ReactNode } from 'react'

import interactions from '../../styles/interactions.module.css'
import styles from './Card.module.css'

export interface CardProps {
  as?: ElementType
  /** Surface fill vs page background. @default false */
  fill?: boolean
  /** CSS padding value. */
  padding?: string
  /** CSS border-radius. */
  radius?: string
  /** Subtle hover wash for clickable cards. @default false */
  hover?: boolean
  onClick?: (e: MouseEvent) => void
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

const Card = ({
  as,
  fill = false,
  padding,
  radius,
  hover = false,
  onClick,
  children,
  className: extraClassName,
  style,
}: CardProps) => {
  const Component = as ?? (onClick ? 'button' : 'div')

  const className = [
    styles.card,
    fill && styles.fill,
    hover && styles.hover,
    hover && interactions.surfaceHover,
    Component === 'button' && styles.asButton,
    Component === 'button' && interactions.focusRing,
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Component
      type={Component === 'button' ? 'button' : undefined}
      className={className}
      onClick={onClick}
      style={{ padding, borderRadius: radius, ...style }}
    >
      {children}
    </Component>
  )
}

export default Card
