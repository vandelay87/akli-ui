import { CSSProperties, FC, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import interactions from '../../styles/interactions.module.css'
import { cx } from '../../utils/cx'
import { isExternalHref } from './isExternalHref'
import styles from './Link.module.css'

export interface LinkProps {
  children: ReactNode
  to: string
  underline?: boolean
  /** @default 'inherit' */
  tone?: 'inherit' | 'muted' | 'accent'
  /** Optional icon (chevron/arrow) that animates on hover. */
  icon?: ReactNode
  /** @default 'right' */
  iconSide?: 'left' | 'right'
  /** Direction the icon nudges on hover. @default 'right' */
  nudge?: 'left' | 'right' | 'up-right' | 'none'
  /** Rotates the icon 45deg clockwise, independent of the hover nudge direction. @default false */
  rotateIcon?: boolean
  /** Button/pill shape. Omit for a plain link (default, unchanged). */
  variant?: 'ghost' | 'solid'
  ariaLabel?: string
  className?: string
}

const NUDGE_CLASSES: Record<NonNullable<LinkProps['nudge']>, string | undefined> = {
  left: interactions.nudgeLeft,
  right: interactions.nudgeRight,
  'up-right': interactions.nudgeUpRight,
  none: undefined,
}

const Link: FC<LinkProps> = ({
  children,
  to,
  underline = false,
  tone = 'inherit',
  icon,
  iconSide = 'right',
  nudge = 'right',
  rotateIcon = false,
  variant,
  ariaLabel,
  className: externalClassName,
}) => {
  const isExternal = isExternalHref(to)

  const className = cx(
    styles.link,
    interactions.focusRing,
    // Tone and variant are mutually exclusive color sources: tone is a
    // plain-link text color, variant is a button shape with its own
    // definitive colors. When variant is set it fully owns color, so the
    // tone class is skipped to avoid it clobbering the variant's color.
    variant ? undefined : styles[tone],
    underline ? styles.underline : '',
    // Nudge class goes on the link itself, not the icon — the CSS is a
    // `.nudgeX:hover .linkIcon` ancestor/descendant rule (see Link.module.css),
    // so hovering anywhere on the link (not just the tiny icon glyph) has to
    // trigger the icon's transform.
    NUDGE_CLASSES[nudge],
    variant && styles[variant],
    // No icon to lay out and no button shape to fill — drop inline-flex
    // for a glyph-height box instead (see Link.module.css's .textOnly).
    !icon && !variant && styles.textOnly,
    externalClassName
  )

  // --link-icon-rotate is consumed by .linkIcon itself (interactions.module.css)
  // rather than a separate class, so the existing nudge/reduced-motion rules
  // apply unchanged whether or not rotateIcon is set.
  const iconStyle = rotateIcon ? ({ '--link-icon-rotate': '45deg' } as CSSProperties) : undefined

  const content = icon ? (
    <>
      {iconSide === 'left' && (
        <span className={interactions.linkIcon} style={iconStyle} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {iconSide === 'right' && (
        <span className={interactions.linkIcon} style={iconStyle} aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  ) : (
    children
  )

  if (isExternal) {
    return (
      <a
        href={to}
        className={className}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    )
  }

  return (
    <RouterLink to={to} className={className} aria-label={ariaLabel}>
      {content}
    </RouterLink>
  )
}

export default Link
