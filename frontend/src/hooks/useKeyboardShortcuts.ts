import { useEffect } from 'react'

import { useUI } from '@/context/UIContext'

/** Typing a "/" or "n" into a field must stay typing. */
function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || target.closest('input, textarea, select') !== null)
  )
}

/** App-wide single-key shortcuts: "/" focuses search, "n" starts a new note. */
export function useKeyboardShortcuts() {
  const { openCreate, searchInputRef } = useUI()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Shift is allowed: some layouts need it to type "/".
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
      if (isEditable(event.target)) return
      // An open dialog makes the page behind it inert; its shortcuts should be too.
      if (document.querySelector('dialog[open]')) return

      if (event.key === '/') {
        // Also stops Firefox's quick find from opening.
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      } else if (event.key === 'n' && !event.repeat) {
        event.preventDefault()
        openCreate()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openCreate, searchInputRef])
}
