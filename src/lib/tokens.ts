/**
 * Palette as literal hex, for SVG/Recharts props.
 *
 * These must NOT be `var(--color-*)`: CSS custom properties only resolve inside
 * CSS declarations, never inside a presentation attribute like <rect fill="…">.
 * Passing a var() to a Recharts `fill`/`stroke` prop paints nothing at all.
 * Keep these values in sync with the --color-* tokens in index.css.
 *
 * Semantic convention used across every chart in this app:
 *   primary (teal)     -> ทุนเดิม / realized-actual / "in progress"
 *   secondary (indigo) -> ทุนใหม่ / planned-budget
 *   amber              -> cuts, warnings, unresolved / "อยู่ระหว่างดำเนินการ"
 *   neutral (slate)     -> not-yet-started / no data / de-emphasis
 */
export const token = {
  ink: '#0f172a',
  muted: '#64748b',
  hairline: '#e2e8f0',
  canvas: '#f8fafc',
  surface: '#ffffff',
  primary: '#0f766e',
  secondary: '#1e3a8a',
  amber: '#b45309',
  neutral: '#94a3b8',
} as const
