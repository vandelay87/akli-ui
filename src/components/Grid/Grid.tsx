import List, { ListItem } from '@components/List'
import { CSSProperties, FC, ReactNode } from 'react'
import styles from './Grid.module.css'

interface GridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  minWidth?: 'sm' | 'md'
  className?: string
}

const columnClassMap: Record<NonNullable<GridProps['columns']>, string> = {
  1: styles.cols1,
  2: styles.cols2,
  3: styles.cols3,
  4: styles.cols4,
}

const minWidthVarMap: Record<NonNullable<GridProps['minWidth']>, string> = {
  sm: 'var(--grid-min-sm)',
  md: 'var(--grid-min-md)',
}

const Grid: FC<GridProps> = ({
  children,
  columns = 3,
  minWidth,
  className: extraClassName,
}) => {
  const gridClassName = [
    styles.grid,
    minWidth ? styles.autoFit : columnClassMap[columns],
    extraClassName,
  ]
    .filter(Boolean)
    .join(' ')

  const gridStyle = minWidth
    ? ({ '--grid-min-width': minWidthVarMap[minWidth] } as CSSProperties)
    : undefined

  return (
    <List className={gridClassName} style={gridStyle}>
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <ListItem key={index} className={styles.item}>
            {child}
          </ListItem>
        ))
      ) : (
        <ListItem className={styles.item}>{children}</ListItem>
      )}
    </List>
  )
}

export default Grid
