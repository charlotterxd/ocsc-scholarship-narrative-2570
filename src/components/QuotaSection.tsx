import type { Frame, Scopes, Track } from '../types'
import { fmtInt, fmtPct } from '../lib/format'
import { Callout, Card, Caption, SectionHeader, Takeaway } from './Shared'
import { BarList } from './BarList'
import type { BarListItem } from './BarList'
import { token } from '../lib/tokens'

export function QuotaSection({ frame, tracks, scopes }: { frame: Frame; tracks: Track[]; scopes: Scopes }) {
  const funnelItems: BarListItem[] = [
    {
      key: 'approved',
      label: 'อนุมัติ (อ.ก.พ. วิสามัญฯ)',
      value: frame.approved,
      valueLabel: `${fmtInt(frame.approved)} ทุน`,
    },
    {
      key: 'allocated',
      label: 'จัดสรรแล้ว (กรอบปีงบประมาณ 2569)',
      value: frame.allocated,
      valueLabel: `${fmtInt(frame.allocated)} ทุน`,
    },
    {
      key: 'row21',
      label: 'แถว 2.1 ทุนตามความต้องการของส่วนราชการ/หน่วยงานของรัฐ',
      value: frame.row21.allocated,
      valueLabel: `${fmtInt(frame.row21.allocated)} ที่นั่ง`,
      title: frame.row21.name,
    },
    {
      key: 'open',
      label: 'เปิดสอบแข่งขัน (ทุนบุคคลทั่วไป + UIS)',
      value: frame.openSeats,
      valueLabel: `${fmtInt(frame.openSeats)} ที่นั่ง`,
    },
  ]

  const sortedGroups = [...frame.byGroup].sort((a, b) => b.allocated - a.allocated)
  const groupItems: BarListItem[] = sortedGroups.map((g) => ({
    key: `group-${g.groupNo}`,
    label: `${g.groupNo}. ${g.group}`,
    value: g.allocated,
    valueLabel: `${fmtInt(g.allocated)} ที่นั่ง`,
  }))
  const topGroup = sortedGroups[0]

  const openSeatsShare = (frame.openSeats / frame.approved) * 100
  const unopenedSeats = frame.approved - frame.allocated

  return (
    <section id="quota">
      <SectionHeader eyebrow="ส่วนที่ 2" title="กรอบการจัดสรรที่นั่ง: จากอนุมัติสู่เปิดสอบแข่งขัน" />
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-sm font-medium text-ink">ลำดับการจำกัดขอบเขตที่นั่ง</p>
          <div className="mt-3">
            <BarList items={funnelItems} barColor={token.secondary} />
          </div>
          <Takeaway>
            จากกรอบที่อนุมัติ {fmtInt(frame.approved)} ทุน เหลือที่นั่งที่เปิดสอบแข่งขันจริงเพียง {fmtInt(frame.openSeats)} ที่นั่ง (
            {fmtPct(openSeatsShare)}) เพราะที่นั่งส่วนใหญ่ในแถว 2.1 เป็นทุนที่ไม่มีการสอบแข่งขันเปิด
          </Takeaway>
          <Caption>
            กรอบที่อนุมัติ {fmtInt(frame.approved)} ทุน กับที่จัดสรรแล้ว {fmtInt(frame.allocated)} ทุน เป็นคนละจำนวนที่เอกสารระบุไว้เอง ไม่ใช่ความคลาดเคลื่อน
            ส่วนต่าง {fmtInt(unopenedSeats)} ทุนคือที่นั่งที่ยังไม่ได้เปิด
          </Caption>
        </Card>

        <Card>
          <p className="text-sm font-medium text-ink">ที่นั่งจัดสรรแยกตามกลุ่มทุน ({fmtInt(frame.allocated)} ที่นั่ง)</p>
          <div className="mt-3">
            <BarList items={groupItems} barColor={token.secondary} />
          </div>
          <Takeaway>
            ที่นั่งส่วนใหญ่อยู่ในกลุ่มที่ {topGroup.groupNo} ({topGroup.group}) จำนวน {fmtInt(topGroup.allocated)} ที่นั่ง จาก {fmtInt(frame.allocated)}{' '}
            ที่นั่งทั้งหมดในกรอบปีงบประมาณ 2569
          </Takeaway>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracks.map((t) => (
            <Card key={t.track}>
              <p className="text-sm font-medium text-ink" style={{ overflowWrap: 'break-word' }}>
                {t.shortLabel}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                <span>{fmtInt(t.units)} หน่วยทุน</span>
                <span>{fmtInt(t.seats)} ที่นั่ง</span>
                <span>ประกาศรับสมัคร {t.announcementDate}</span>
              </div>
            </Card>
          ))}
        </div>

        <Callout title="ขอบเขตของข้อมูล" tone="amber">
          {scopes.openCompetition}
        </Callout>

        <Card>
          <Caption>
            ที่นั่งในหน้านี้เป็นสถานะ ณ {frame.asOf} ส่วนกรอบที่อนุมัติ {fmtInt(frame.approved)} ทุน อ.ก.พ. วิสามัญเกี่ยวกับการเตรียมกำลังคนคุณภาพเห็นชอบเมื่อ{' '}
            {frame.approvedOn}
          </Caption>
        </Card>
      </div>
    </section>
  )
}
