// Central number/currency formatting helpers.
// Always use these — never inline toLocaleString elsewhere in the app.
// Locale is th-TH but digits stay Arabic (0-9), never Thai numerals.
// Every money figure in scholarship.json is raw บาท (not pre-divided into millions).

const LOCALE = 'th-TH'

function isNil(n: unknown): n is null | undefined {
  return n === null || n === undefined || Number.isNaN(n)
}

/** Format a raw baht value in ล้านบาท, e.g. 800000000 -> "800.00 ล้านบาท" */
export function fmtMB(n: number | null | undefined, digits = 2): string {
  if (isNil(n)) return '—'
  const mb = n / 1_000_000
  return (
    mb.toLocaleString(LOCALE, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + ' ล้านบาท'
  )
}

/** Format a raw baht value, e.g. 950000000 -> "950,000,000 บาท" */
export function fmtBaht(n: number | null | undefined): string {
  if (isNil(n)) return '—'
  return n.toLocaleString(LOCALE, { maximumFractionDigits: 0 }) + ' บาท'
}

/** Format a raw baht value, auto-switching to ล้านบาท when >= 1,000,000 */
export function fmtBahtShort(n: number | null | undefined): string {
  if (isNil(n)) return '—'
  if (Math.abs(n) >= 1_000_000) {
    return fmtMB(n, 2)
  }
  return fmtBaht(n)
}

/** Format a percentage value, e.g. 60.88 -> "60.88%" */
export function fmtPct(n: number | null | undefined, opts?: { signed?: boolean; digits?: number }): string {
  if (isNil(n)) return '—'
  const digits = opts?.digits ?? 1
  const sign = opts?.signed && n > 0 ? '+' : ''
  return (
    sign +
    n.toLocaleString(LOCALE, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) +
    '%'
  )
}

/** Format an integer count, e.g. 1129 -> "1,129" */
export function fmtInt(n: number | null | undefined): string {
  if (isNil(n)) return '—'
  return n.toLocaleString(LOCALE, { maximumFractionDigits: 0 })
}

/** Format a plain decimal number with a fixed number of digits. */
export function fmtNum(n: number | null | undefined, digits = 2): string {
  if (isNil(n)) return '—'
  return n.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** Format a raw baht value as a bare millions-of-baht number for chart axis ticks/labels, e.g. 800000000 -> "800" */
export function fmtAxisMB(n: number | null | undefined): string {
  if (isNil(n)) return '—'
  return (n / 1_000_000).toLocaleString(LOCALE, { maximumFractionDigits: 0 })
}

/**
 * Percent change from `from` to `to`. Returns null (never Infinity/NaN) when
 * `from` is 0/null/undefined — callers must render null as "—" or a "ใหม่" badge,
 * never divide-by-zero silently.
 */
export function pctChange(from: number | null | undefined, to: number | null | undefined): number | null {
  if (isNil(from) || isNil(to) || from === 0) return null
  return ((to - from) / from) * 100
}
