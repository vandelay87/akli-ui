import type { FC } from 'react'
import interactions from '../../styles/interactions.module.css'
import { cx } from '../../utils/cx'
import styles from './Loading.module.css'

export interface LoadingProps {
  label?: string
}

const Loading: FC<LoadingProps> = ({ label = 'Loading…' }) => {
  return (
    <span role="status" aria-live="polite" aria-label={label} className={styles.container}>
      <span className={cx(interactions.spinner, styles.spinner)} aria-hidden="true" />
      <span className={styles.label} aria-hidden="true">
        {label}
      </span>
    </span>
  )
}

export default Loading
