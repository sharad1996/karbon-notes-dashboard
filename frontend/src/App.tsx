import { NoteFormModal } from '@/components/notes/NoteFormModal'
import { NoteGrid } from '@/components/notes/NoteGrid'
import { SearchBar } from '@/components/notes/SearchBar'
import { Button } from '@/components/ui/Button'
import { Toaster } from '@/components/ui/Toaster'
import { useUI } from '@/context/UIContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export default function App() {
  const { openCreate } = useUI()
  useKeyboardShortcuts()

  return (
    <div className="min-h-dvh">
      <header className="border-rule bg-paper/90 sticky top-0 z-10 border-b backdrop-blur">
        {/* Phones: title and button on one row, search full width below. Wider: one row. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 sm:flex-nowrap sm:px-6">
          <h1 className="mr-auto text-3xl leading-none font-bold tracking-[-0.03em]">Notes</h1>
          <SearchBar className="order-last basis-full sm:order-none sm:max-w-sm sm:flex-1 sm:basis-auto" />
          <Button variant="primary" onClick={openCreate} aria-keyshortcuts="n" title="New note (N)">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="-ml-1 size-4"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            New note
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <NoteGrid />
      </main>
      <NoteFormModal />
      <Toaster />
    </div>
  )
}
