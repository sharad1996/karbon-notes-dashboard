export function NoteCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="border-rule bg-surface flex h-44 flex-col gap-3 rounded-xl border p-5"
    >
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-5/6" />
      <div className="skeleton h-3 w-2/3" />
      <div className="skeleton mt-auto h-3 w-1/3" />
    </div>
  )
}
