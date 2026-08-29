import { useId, type FC, type ReactNode } from 'react'

import { cx } from '../../utils/cx'
import styles from './Callout.module.css'

export interface CalloutProps {
  type: 'tip' | 'warning' | 'info'
  children: ReactNode
}

const indicators: Record<CalloutProps['type'], { emoji: string; label: string }> = {
  tip: { emoji: '💡', label: 'Tip' },
  warning: { emoji: '⚠️', label: 'Warning' },
  info: { emoji: 'ℹ️', label: 'Info' },
}

const Callout: FC<CalloutProps> = ({ type, children }) => {
  const labelId = useId()

  return (
    <div className={cx(styles.callout, styles[type])} role="note" aria-labelledby={labelId}>
      <div className={styles.header}>
        <span className={styles.emoji} aria-hidden="true">{indicators[type].emoji}</span>
        <div id={labelId} className={styles.label}>{indicators[type].label}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

export default Callout
