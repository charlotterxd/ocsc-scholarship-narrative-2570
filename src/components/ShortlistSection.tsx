import type { Budget, Scopes, Track } from '../types'
import { fmtBaht, fmtInt, fmtPct } from '../lib/format'
import { Callout, Caption, Card, ChangeBadge, SectionHeader, StatCard, Takeaway } from './Shared'
import { BarList, type BarListItem } from './BarList'
import { token } from '../lib/tokens'

/** null when there are no applicants to divide by — render "—", never NaN. */
function passRateFor(track: Track): number | null {
  return track.stage1.applicants > 0 ? (track.stage2.people / track.stage1.applicants) * 100 : null
}

function TrackShortlistCard({ track, scopes }: { track: Track; scopes: Scopes }) {
  const passRate = passRateFor(track)
  const hasSlotGap = track.stage2.slots !== track.stage2.people

  return (
    <Card>
      <p className="text-sm font-medium text-ink">{track.shortLabel}</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-medium text-muted">ผู้สมัคร</p>
          <p className="text-xl font-semibold tabular-nums text-ink">{fmtInt(track.stage1.applicants)} คน</p>
          {/* Short pointer here; the full scopes.sharedExam text sits once at section level. */}
          {track.stage1.sittingTotal !== null && (
            <Caption>เป็นส่วนย่อยของผู้เข้าสอบร่วม {fmtInt(track.stage1.sittingTotal)} คน</Caption>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-muted">ผู้มีสิทธิเข้ารับการประเมิน (รอบสอง)</p>
          <p className="text-xl font-semibold tabular-nums text-ink">{fmtInt(track.stage2.people)} คน</p>
        </div>
      </div>

      {hasSlotGap ? (
        <>
          <p className="mt-3 text-xs text-muted">
            รายการรายหน่วย (slots) รวม {fmtInt(track.stage2.slots)} รายการ — มากกว่าจำนวนคนจริงเพราะผู้สมัครถูกนับซ้ำในทุกหน่วยที่เลือก
          </p>
          <div className="mt-2">
            <Callout title={`ทำไม ${fmtInt(track.stage2.slots)} รายการจึงไม่ใช่ ${fmtInt(track.stage2.people)} คน`} tone="amber">
              {scopes.uisSlots}
            </Callout>
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted">
          จำนวนคน = จำนวนรายการ ({fmtInt(track.stage2.people)} = {fmtInt(track.stage2.slots)}) ไม่มีการนับซ้ำรายหน่วยในทุนนี้
        </p>
      )}

      <Takeaway>
        {track.shortLabel}: จากผู้สมัคร {fmtInt(track.stage1.applicants)} คน มีผู้ผ่านเข้ารอบสอง {fmtInt(track.stage2.people)} คน
        {passRate !== null && <> (อัตราผ่าน {fmtPct(passRate)})</>} และมีผู้มีสิทธิได้รับทุนในที่สุด {fmtInt(track.stage3.awarded)} คน
      </Takeaway>
    </Card>
  )
}

function AssessmentBudget({ budget, normal, uis }: { budget: Budget; normal?: Track; uis?: Track }) {
  const items: BarListItem[] = budget.assessment.items.map((it) => ({
    key: it.line,
    label: it.lineName,
    value: it.b70,
    valueLabel: fmtBaht(it.b70),
  }))

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">งบ Assessment Center Methods ปีงบประมาณ 2570</p>
          <p className="text-xs text-muted">รวม {fmtBaht(budget.assessment.total70)} จาก 3 รายการงบคัดเลือก (1.1 / 1.2 / 1.3)</p>
        </div>
        <ChangeBadge tone="new">ใหม่ในปี 2570</ChangeBadge>
      </div>

      <div className="mt-3">
        <BarList items={items} barColor={token.secondary} />
      </div>

      <Caption>รายการนี้ตั้งไว้ 0 บาททั้งปีงบประมาณ 2568 และ 2569 ก่อนปรากฏขึ้นครั้งแรกในปีงบประมาณ 2570</Caption>

      <Takeaway>
        งบ {fmtBaht(budget.assessment.total70)} ก้อนนี้มุ่งไปที่ขั้นตอนประเมินรอบสอง — ขั้นตอนที่ทำให้ผู้เข้ารอบสองของ
        {normal?.shortLabel ?? 'ทุนบุคคลทั่วไป'} {fmtInt(normal?.stage2.people)} คน เหลือผู้มีสิทธิได้รับทุน {fmtInt(normal?.stage3.awarded)} คน
        และของ{uis?.shortLabel ?? 'ทุน UIS'} {fmtInt(uis?.stage2.people)} คน เหลือผู้มีสิทธิได้รับทุน {fmtInt(uis?.stage3.awarded)} คน
      </Takeaway>
    </Card>
  )
}

export function ShortlistSection({ tracks, budget, scopes }: { tracks: Track[]; budget: Budget; scopes: Scopes }) {
  const normal = tracks.find((t) => t.track === 'normal')
  const uis = tracks.find((t) => t.track === 'uis')

  return (
    <section id="shortlist">
      <SectionHeader eyebrow="ส่วนที่ 4" title="ผู้มีสิทธิเข้ารับการประเมิน (รอบสอง) กับงบ Assessment Center" />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracks.map((t) => {
            const passRate = passRateFor(t)
            return (
              <StatCard
                key={t.track}
                label={t.shortLabel}
                value={passRate !== null ? fmtPct(passRate) : '—'}
                sub={`ผู้เข้ารอบสอง ${fmtInt(t.stage2.people)} คน จากผู้สมัคร ${fmtInt(t.stage1.applicants)} คน`}
              />
            )
          })}
        </div>

        <Caption>{scopes.sharedExam}</Caption>

        {tracks.map((t) => (
          <TrackShortlistCard key={t.track} track={t} scopes={scopes} />
        ))}

        <AssessmentBudget budget={budget} normal={normal} uis={uis} />
      </div>
    </section>
  )
}
