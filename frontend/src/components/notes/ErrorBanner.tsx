import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type ErrorBannerProps = {
  message: string
  onRetry: () => void
  retrying: boolean
}

export function ErrorBanner({ message, onRetry, retrying }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="border-danger-rule bg-danger-soft animate-fade-in flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-danger-ink font-semibold">Couldn’t load your notes</p>
        <p className="text-ink mt-0.5 text-sm">{message}</p>
      </div>
      <Button onClick={onRetry} disabled={retrying}>
        {retrying && <Spinner />}
        {retrying ? 'Retrying…' : 'Retry'}
      </Button>
    </div>
  )
}
