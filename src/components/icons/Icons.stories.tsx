import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  isValidElement,
  type FC,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react'

import Typography from '../Typography/Typography'
import styles from './Icons.stories.module.css'
import * as icons from '.'
import type { SizedIconProps } from '.'

// Enumerated from the barrel so a new icon shows up here without touching
// this file. Glyphs are exported as ready-made elements, Sized icons as
// components.
const entries = Object.entries(icons)
const glyphs = entries.filter(
  (entry): entry is [string, ReactElement<SVGProps<SVGSVGElement>>] =>
    isValidElement(entry[1])
)
const sizedIcons = entries.filter(
  (entry): entry is [string, FC<SizedIconProps>] =>
    typeof entry[1] === 'function'
)

const Tile: FC<{ name: string; sizing: string; children: ReactNode }> = ({
  name,
  sizing,
  children,
}) => (
  <li className={styles.tile}>
    {children}
    <code className={styles.name}>{name}</code>
    <Typography variant="caption">{sizing}</Typography>
  </li>
)

const IconGallery: FC = () => (
  <div className={styles.gallery}>
    <section>
      <Typography variant="heading3" as="h2">
        Glyphs
      </Typography>
      <ul className={styles.grid}>
        {glyphs.map(([name, glyph]) => (
          <Tile
            key={name}
            name={name}
            sizing={
              glyph.props.width ? `${glyph.props.width}px` : 'consumer-sized'
            }
          >
            {glyph}
          </Tile>
        ))}
      </ul>
    </section>
    <section>
      <Typography variant="heading3" as="h2">
        Sized icons
      </Typography>
      <ul className={styles.grid}>
        {sizedIcons.map(([name, Icon]) => (
          <Tile key={name} name={name} sizing="size prop">
            <Icon size={24} />
          </Tile>
        ))}
      </ul>
    </section>
  </div>
)

const meta = {
  title: 'Components/Icons',
  component: IconGallery,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof IconGallery>

export default meta

type Story = StoryObj<typeof meta>

export const Gallery: Story = {}
