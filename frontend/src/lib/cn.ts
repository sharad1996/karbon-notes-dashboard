/** Join class names, skipping falsy values: `cn('a', isOn && 'b')`. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
