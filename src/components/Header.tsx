import type { Meta } from '../types'

/** Report masthead. Sober government-report tone — agency, title, fiscal year, hearing date. */
export function Header({ meta }: { meta: Meta }) {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <p className="text-xs font-medium text-muted">
          {meta.ministry} · {meta.agency}
        </p>
        <h1 className="mt-2 text-lg font-semibold leading-snug text-ink sm:text-2xl" style={{ overflowWrap: 'break-word' }}>
          {meta.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>ปีงบประมาณ {meta.fiscalYear}</span>
          <span className="h-1 w-1 rounded-full bg-hairline" aria-hidden="true" />
          <span>วันที่ชี้แจงงบประมาณ {meta.hearingDate}</span>
        </div>
      </div>
    </header>
  )
}
