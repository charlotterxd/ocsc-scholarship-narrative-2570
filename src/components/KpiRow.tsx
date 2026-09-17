import type { Budget, Frame, Totals } from '../types'
import { fmtInt, fmtMB, fmtPct, pctChange } from '../lib/format'
import { ChangeBadge, StatCard } from './Shared'

export function KpiRow({ budget, frame, totals }: { budget: Budget; frame: Frame; totals: Totals }) {
  const y2568 = budget.subsidy.find((s) => s.year === 2568)!
  const y2570 = budget.subsidy.find((s) => s.year === 2570)!
  const subsidyChangePct = pctChange(y2568.budget, y2570.budget)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="เงินอุดหนุนปี 2570"
        value={fmtMB(y2570.budget, 0)}
        sub={`ลดจาก ${fmtMB(y2568.budget, 0)} สองปีก่อนหน้า`}
        badge={<ChangeBadge tone="cut">{fmtPct(subsidyChangePct, { signed: true })} เทียบปี 2568</ChangeBadge>}
      />
      <StatCard
        label="กรอบจัดสรรปี 2569"
        value={`${fmtInt(frame.allocated)} ที่นั่ง`}
        sub={`จากกรอบที่อนุมัติ ${fmtInt(frame.approved)} ทุน`}
      />
      <StatCard
        label="ที่นั่งที่เปิดสอบแข่งขัน"
        value={`${fmtInt(frame.openSeats)} ที่นั่ง`}
        sub={`จาก ${fmtInt(frame.row21.allocated)} ที่นั่งในแถว 2.1`}
      />
      <StatCard
        label="ผู้มีสิทธิได้รับทุน"
        value={`${fmtInt(totals.awarded)} / ${fmtInt(totals.seats)} ที่นั่ง`}
        sub={`${fmtPct(totals.fillPct)} ของที่นั่งที่เปิดสอบแข่งขัน`}
      />
    </div>
  )
}
