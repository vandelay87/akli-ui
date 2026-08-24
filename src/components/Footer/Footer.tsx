import Link from '@components/Link'
import { useId, type FC } from 'react'
import styles from './Footer.module.css'
import { SOCIAL_LINKS } from './socialLinks'

export interface FooterProps {
  /** @default 'public' */
  variant?: 'public' | 'admin'
  /** Admin: shown as "Signed in as {email}". */
  email?: string
  className?: string
}

const Footer: FC<FooterProps> = ({ variant = 'public', email, className: extraClassName }) => {
  const className = [styles.footer, extraClassName].filter(Boolean).join(' ')
  const elsewhereLabelId = useId()

  return (
    <footer className={className}>
      <div className={styles.inner}>
        {variant === 'admin' ? (
          <>
            <span className={styles.adminLabel}>akli.dev admin</span>
            {email && <span className={styles.signedIn}>Signed in as {email}</span>}
          </>
        ) : (
          <>
            <nav aria-labelledby={elsewhereLabelId} className={styles.elsewhere}>
              <span id={elsewhereLabelId} className={styles.elsewhereLabel}>
                Find me elsewhere
              </span>
              <ul className={styles.linkList}>
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href}>{link.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <span className={styles.brand}>akli.dev</span>
          </>
        )}
      </div>
    </footer>
  )
}

export default Footer
