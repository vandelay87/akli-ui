import styles from './ThemeToggle.module.css'

// Minimal stub: renders an importable button so ThemeToggle.test.tsx can
// mount it, but implements none of issue #5's self-contained-mount logic
// (reading localStorage/prefers-color-scheme, setting data-theme on <html>
// when absent). A react-engineer replaces this with the real implementation
// next — do not add real logic here.
const ThemeToggle = () => {
  return (
    <button type="button" className={styles.toggle} aria-label="Switch to dark mode">
      <span aria-hidden="true">☾</span>
    </button>
  )
}

export default ThemeToggle
