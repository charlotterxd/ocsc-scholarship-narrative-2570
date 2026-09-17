// Plain-HTML horizontal bar list. Used instead of an SVG bar chart wherever
// category labels are long Thai strings that Recharts' SVG <text> ticks
// cannot wrap — CSS handles Thai line-wrapping correctly, SVG tspans do not.

export interface BarListItem {
  key: string
  label: string
  value: number
  valueLabel: string
  sub?: string
  muted?: boolean
  title?: string
}

export function BarList({
  items,
  barColor,
  mutedColor = '#94a3b8',
}: {
  items: BarListItem[]
  barColor: string
  mutedColor?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const pct = Math.max((item.value / max) * 100, item.value > 0 ? 1.5 : 0)
        return (
          <li key={item.key} title={item.title} className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-3">
              <span className={`text-xs leading-snug ${item.muted ? 'text-muted' : 'text-ink'}`} style={{ overflowWrap: 'break-word' }}>
                {item.label}
                {item.sub && <span className="ml-1.5 text-muted">{item.sub}</span>}
              </span>
              <span className="shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-ink">{item.valueLabel}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-hairline">
              <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: item.muted ? mutedColor : barColor }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** One row with two comparable bars sharing one scale (existing vs fresh, etc.). */
export interface DualBarRow {
  key: string
  label: string
  sub?: string
  a: number | null // null = no data (render "no data" note, never a 0-width bar)
  aLabel: string
  b: number | null
  bLabel: string
  title?: string
}

export function DualBarList({
  rows,
  colorA,
  colorB,
  legendA,
  legendB,
}: {
  rows: DualBarRow[]
  colorA: string
  colorB: string
  legendA: string
  legendB: string
}) {
  const max = Math.max(...rows.flatMap((r) => [r.a ?? 0, r.b ?? 0]), 1)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colorA }} />
          {legendA}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colorB }} />
          {legendB}
        </span>
      </div>
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.key} title={row.title} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium leading-snug text-ink" style={{ overflowWrap: 'break-word' }}>
                {row.label}
                {row.sub && <span className="ml-1.5 font-normal text-muted">{row.sub}</span>}
              </span>
            </div>
            <BarLine value={row.a} max={max} color={colorA} valueLabel={row.aLabel} />
            <BarLine value={row.b} max={max} color={colorB} valueLabel={row.bLabel} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarLine({ value, max, color, valueLabel }: { value: number | null; max: number; color: string; valueLabel: string }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-hairline/60" />
        <span className="w-32 shrink-0 whitespace-nowrap text-xs text-muted">{valueLabel}</span>
      </div>
    )
  }
  const pct = Math.max((value / max) * 100, value > 0 ? 1.5 : 0)
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-hairline">
        <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-32 shrink-0 whitespace-nowrap text-xs font-medium tabular-nums text-ink">{valueLabel}</span>
    </div>
  )
}
