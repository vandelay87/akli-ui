/** `isExternalHref('https://example.com')` -> `true`; `isExternalHref('/apps')` -> `false`. */
export const isExternalHref = (href: string): boolean =>
  /^https?:\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
