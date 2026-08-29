type ClassValue = string | false | null | undefined

/** Joins truthy class names with a space, dropping `false`/`null`/`undefined`/`''`. */
export const cx = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ')
