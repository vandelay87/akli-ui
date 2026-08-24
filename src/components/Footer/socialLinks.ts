export type SocialLinkName = 'GitHub' | 'LinkedIn' | 'Email'

export interface SocialLink {
  name: SocialLinkName
  href: string
}

const EMAIL_ADDRESS = 'akliaissat@outlook.com'

/** GitHub/LinkedIn/Email link data shared by Footer. */
export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'GitHub', href: 'https://github.com/vandelay87' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/in/akli-aissat-b08119115/' },
  { name: 'Email', href: `mailto:${EMAIL_ADDRESS}` },
]
