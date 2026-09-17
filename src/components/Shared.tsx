import type { ReactNode } from 'react'

/** Section wrapper: eyebrow label + title + hairline rule, consistent across the report. */
export function SectionHeader({ eyebrow, title, id }: { eyebrow: string; title: string; id?: string }) {
  return (
    <div id={id} className="mb-6 scroll-mt-6">
      <p className="text-xs font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{title}</h2>
      <div className="mt-3 h-px w-full bg-hairline" />
    </div>
  )
}

/** White card surface: hairline border, rounded, no heavy shadow. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-hairline bg-surface p-5 ${className}`}>{children}</div>
}

/** One-line Thai takeaway sentence that must sit next to every chart. */
export function Takeaway({ children }: { children: ReactNode }) {
  return <p className="mt-3 border-l-2 border-primary/40 pl-3 text-sm leading-relaxed text-ink">{children}</p>
}

/** Small muted caption text, used for methodology / comparability notes. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-muted">{children}</p>
}

export type BadgeTone = 'cut' | 'increase' | 'neutral' | 'new'

/** Direction badge for value changes. Cut = teal (favourable in scrutiny framing), increase = amber. */
export function ChangeBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const toneClasses: Record<BadgeTone, string> = {
    cut: 'bg-primary/10 text-primary',
    increase: 'bg-amber/10 text-amber',
    neutral: 'bg-slate-100 text-muted',
    new: 'bg-secondary/10 text-secondary',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium tabular-nums ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}

/** KPI stat card used in the top row. */
export function StatCard({
  label,
  value,
  sub,
  badge,
}: {
  label: string
  value: string
  sub?: string
  badge?: ReactNode
}) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="text-xl font-semibold text-ink tabular-nums sm:text-2xl">{value}</p>
      {(sub || badge) && (
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {badge}
          {sub && <span className="text-xs text-muted">{sub}</span>}
        </div>
      )}
    </Card>
  )
}

export function Callout({
  title,
  children,
  tone = 'amber',
}: {
  title: string
  children: ReactNode
  tone?: 'amber' | 'primary'
}) {
  const toneClasses = tone === 'amber' ? 'border-amber/30 bg-amber/5' : 'border-primary/30 bg-primary/5'
  const titleClasses = tone === 'amber' ? 'text-amber' : 'text-primary'
  return (
    <div className={`rounded-xl border p-5 ${toneClasses}`}>
      <p className={`text-sm font-semibold ${titleClasses}`}>{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-ink">{children}</div>
    </div>
  )
}

/** Small legend swatch + label, used above HTML bar lists that carry >= 2 series. */
export function LegendRow({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

/** Expandable Thai-labelled details row (used for department/item breakdowns). */
export function ExpandRow({ summary, children }: { summary: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-hairline p-3 open:pb-3">
      <summary className="flex list-none items-center justify-between gap-3 text-sm text-ink marker:content-none">
        {summary}
        <span className="shrink-0 text-xs text-muted transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  )
}
