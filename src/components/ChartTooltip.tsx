interface TooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

interface CustomTooltipProps {
  active?: boolean
  label?: string | number
  payload?: TooltipPayloadItem[]
  formatter?: (value: number, name: string | undefined, key: string | number | undefined) => string
  labelFormatter?: (label: string | number | undefined) => string
}

/** Thai-styled Recharts tooltip. Pass `formatter` to route values through src/lib/format.ts. */
export function ChartTooltip({ active, label, payload, formatter, labelFormatter }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-sm">
      {label !== undefined && (
        <p className="mb-1 text-xs font-semibold text-ink">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <div className="flex flex-col gap-0.5">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            {item.color && (
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            {item.name && <span className="text-muted">{item.name}</span>}
            <span className="ml-auto font-medium tabular-nums text-ink">
              {formatter && typeof item.value === 'number'
                ? formatter(item.value, item.name, item.dataKey)
                : String(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
