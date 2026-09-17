import type { Budget, Scopes, Track } from '../types'
import { fmtBaht, fmtInt, fmtPct, pctChange } from '../lib/format'
import { Callout, Caption, Card, ChangeBadge, SectionHeader, StatCard, Takeaway } from './Shared'
import { token } from '../lib/tokens'

function findSelectionLine(budget: Budget, budgetLine: string) {
  return budget.selection.find((l) => l.name.startsWith(budgetLine))
}

/** 2568 → 2569 → 2570 horizontal bars for one budget selection line. */
function YearBars({ b68, b69, b70 }: { b68: number; b69: number; b70: number }) {
  const max = Math.max(b68, b69, b70, 1)
  const rows: { label: string; value: number; color: string }[] = [
    { label: '2568', value: b68, color: token.neutral },
    { label: '2569', value: b69, color: token.secondary },
    { label: '2570', value: b70, color: token.primary },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-xs text-muted">{r.label}</span>
          <div className="h-2 flex-1 rounded-full bg-hairline">
            <div
              className="h-2 rounded-full"
              style={{ width: `${Math.max((r.value / max) * 100, r.value > 0 ? 1.5 : 0)}%`, backgroundColor: r.color }}
            />
          </div>
          <span className="w-28 shrink-0 whitespace-nowrap text-right text-xs font-medium tabular-nums text-ink">
            {fmtBaht(r.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

/** pctChange returns null when `from` is 0 — render "ใหม่" instead of NaN/Infinity. */
function LineChangeBadge({ from, to }: { from: number; to: number }) {
  const pct = pctChange(from, to)
  if (pct === null) {
    return <ChangeBadge tone="new">{from === 0 && to > 0 ? 'ใหม่' : '—'}</ChangeBadge>
  }
  return <ChangeBadge tone={pct < 0 ? 'cut' : pct > 0 ? 'increase' : 'neutral'}>{fmtPct(pct, { signed: true })}</ChangeBadge>
}

function TrackApplicantCard({ track, budget }: { track: Track; budget: Budget }) {
  const line = findSelectionLine(budget, track.budgetLine)
  const ratio = track.seats > 0 ? track.stage1.applicants / track.seats : null

  /* The budget line pays for the whole sitting, not for this track's subset of it.
     Dividing by stage1.applicants (the subset who chose a unit of this track) would
     overstate the per-head cost — for ทุนบุคคลทั่วไป by 20%. Use the sitting size
     wherever the exam is shared, and label the denominator so the scope is visible. */
  const paidFor = track.stage1.sittingTotal ?? track.stage1.applicants
  const costPerApplicant = line && line.b69 > 0 ? line.b69 / paidFor : null

  return (
    <Card>
      <p className="text-sm font-medium text-ink">{track.shortLabel}</p>
      <p className="text-xs text-muted">งบคัดเลือกที่เกี่ยวข้อง: {track.budgetLineName}</p>

      {line ? (
        <>
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-medium text-muted">งบรายการ {line.name} — 2568 → 2569 → 2570</p>
            <YearBars b68={line.b68} b69={line.b69} b70={line.b70} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted">2568 → 2569</span>
                <LineChangeBadge from={line.b68} to={line.b69} />
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-muted">2569 → 2570</span>
                <LineChangeBadge from={line.b69} to={line.b70} />
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-hairline bg-canvas p-3">
            <p className="text-xs font-medium text-muted">ต้นทุนคัดเลือกโดยประมาณต่อผู้เข้าสอบ 1 คน (งบปี 2569)</p>
            {costPerApplicant !== null ? (
              <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
                {fmtBaht(line.b69)} ÷ {fmtInt(paidFor)} คน ≈ {fmtBaht(costPerApplicant)} ต่อคน
              </p>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-ink">
                — คำนวณไม่ได้ งบรายการนี้ในปีงบประมาณ 2569 อยู่ที่ 0 บาท แม้จะมีผู้สมัคร {fmtInt(track.stage1.applicants)} คนในปีนั้น
              </p>
            )}
            <Caption>
              ตัวหารคือจำนวนผู้เข้าสอบทั้งชุดที่งบรายการนี้รองรับ ({fmtInt(paidFor)} คน)
              {track.stage1.sittingTotal !== null && <> ไม่ใช่ {fmtInt(track.stage1.applicants)} คนที่เลือกหน่วยทุนของทุนนี้</>} เพราะงบรายการ{' '}
              {track.budgetLineName} ไม่ได้แยกไว้เฉพาะทุนนี้ทุนเดียว และครอบคลุมขอบเขตกว้างกว่าที่นั่ง {fmtInt(track.seats)} ที่ที่แสดงในหน้านี้
              ตัวเลขนี้จึงเป็นการประมาณต้นทุนเฉลี่ยเท่านั้น ไม่ใช่ต้นทุนจริงต่อคน
            </Caption>
          </div>
        </>
      ) : (
        <Caption>ไม่พบรายการงบคัดเลือกที่จับคู่กับทุนนี้ในชุดข้อมูล</Caption>
      )}

      <Takeaway>
        {track.shortLabel}: ผู้สมัคร {fmtInt(track.stage1.applicants)} คน ต่อที่นั่งเปิดสอบ {fmtInt(track.seats)} ที่
        {ratio !== null && <> (ประมาณ {fmtInt(Math.round(ratio))} คนต่อ 1 ที่นั่ง)</>}
        {line && line.b68 === 0 && line.b69 === 0 && (
          <>
            {' '}
            งบคัดเลือก{track.budgetLineName}ยังเป็น 0 บาททั้งปี 2568 และ 2569 ก่อนเริ่มมีงบครั้งแรก {fmtBaht(line.b70)} ในปี 2570
          </>
        )}
        {line && !(line.b68 === 0 && line.b69 === 0) && (
          <>
            {' '}
            ปีเดียวกับที่งบคัดเลือก{track.budgetLineName}เปลี่ยนจาก {fmtBaht(line.b68)} เป็น {fmtBaht(line.b69)}
          </>
        )}
      </Takeaway>
    </Card>
  )
}

export function ApplicantsSection({ tracks, budget, scopes }: { tracks: Track[]; budget: Budget; scopes: Scopes }) {
  return (
    <section id="applicants">
      <SectionHeader eyebrow="ส่วนที่ 3" title="ผู้สมัครกับงบคัดเลือกที่จ่ายค่าสนามสอบ" />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracks.map((t) => {
            const ratio = t.seats > 0 ? t.stage1.applicants / t.seats : null
            const sub =
              t.stage1.sittingTotal !== null
                ? `ผู้สมัคร ${fmtInt(t.stage1.applicants)} คน (จากผู้เข้าสอบร่วม ${fmtInt(t.stage1.sittingTotal)} คน) ต่อที่นั่ง ${fmtInt(t.seats)} ที่`
                : `ผู้สมัคร ${fmtInt(t.stage1.applicants)} คน ต่อที่นั่ง ${fmtInt(t.seats)} ที่`
            return (
              <StatCard
                key={t.track}
                label={t.shortLabel}
                value={ratio !== null ? `≈ ${fmtInt(Math.round(ratio))} : 1` : '—'}
                sub={sub}
              />
            )
          })}
        </div>

        <Caption>{scopes.noSumApplicants}</Caption>

        <Callout title="ขอบเขตของผู้เข้าสอบร่วม" tone="amber">
          {scopes.sharedExam}
          {/* This is the page's first and only mention of the track sharing the sitting.
              Without scopes.science the reader meets it here and is never told why none of
              its figures appear anywhere in the report. */}
          <Caption>{scopes.science}</Caption>
        </Callout>

        {tracks.map((t) => (
          <TrackApplicantCard key={t.track} track={t} budget={budget} />
        ))}
      </div>
    </section>
  )
}
