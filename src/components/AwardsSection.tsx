import type { Scopes, Totals, Track, UnitRow } from '../types'
import { fmtInt, fmtPct } from '../lib/format'
import { Card, Caption, ExpandRow, SectionHeader, StatCard, Takeaway } from './Shared'
import { BarList, type BarListItem } from './BarList'
import { token } from '../lib/tokens'

const TOP_DEMAND_VISIBLE = 5
const AGENCY_VISIBLE = 8

/** Combined + per-track cause breakdown for the empty-unit table. */
function causeRows(tracks: Track[]) {
  const rows = tracks.map((t) => ({
    key: t.track,
    label: t.shortLabel,
    noApplicants: t.emptyUnits.noApplicants,
    noneShortlisted: t.emptyUnits.noneShortlisted,
    shortlistedNotAwarded: t.emptyUnits.shortlistedNotAwarded,
    total: t.emptyUnits.total,
  }))
  const combined = rows.reduce(
    (acc, r) => ({
      noApplicants: acc.noApplicants + r.noApplicants,
      noneShortlisted: acc.noneShortlisted + r.noneShortlisted,
      shortlistedNotAwarded: acc.shortlistedNotAwarded + r.shortlistedNotAwarded,
      total: acc.total + r.total,
    }),
    { noApplicants: 0, noneShortlisted: 0, shortlistedNotAwarded: 0, total: 0 },
  )
  return { rows, combined }
}

/**
 * Every per-track card carries this. Six agencies hold seats in BOTH tracks and four of
 * them fill at opposite rates (e.g. กรมสรรพากร 4/4 here, 0/2 there), so the same agency
 * name legitimately appears twice in this section with contradictory-looking numbers.
 * A plain heading was not enough to tell the two cards apart while scrolling.
 */
function TrackChip({ track }: { track: Track }) {
  return (
    <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
      {track.shortLabel}
    </span>
  )
}

/** Agencies holding seats in more than one track — the reason the caveat above is needed. */
function agenciesInBothTracks(tracks: Track[]): string[] {
  const seen = new Map<string, number>()
  for (const t of tracks) {
    for (const a of t.byAgency) seen.set(a.name, (seen.get(a.name) ?? 0) + 1)
  }
  return [...seen.entries()].filter(([, n]) => n > 1).map(([name]) => name)
}

function unitLabel(u: UnitRow): { label: string; sub: string } {
  const parts = [u.position, u.field, u.level].filter((v): v is string => Boolean(v))
  return { label: u.agency, sub: parts.length > 0 ? parts.join(' · ') : '' }
}

function DemandTable({ track }: { track: Track }) {
  const visible = track.topDemand.slice(0, TOP_DEMAND_VISIBLE)
  const rest = track.topDemand.slice(TOP_DEMAND_VISIBLE)
  const top = track.topDemand[0]

  const renderRows = (rows: UnitRow[]) => (
    <table className="w-full min-w-[520px] border-collapse text-sm">
      <caption className="sr-only">หน่วยทุนที่มีผู้สมัครมากที่สุด — {track.shortLabel}</caption>
      <thead>
        <tr className="border-b border-hairline text-left text-xs text-muted">
          <th scope="col" className="py-2 pr-3 font-medium">หน่วยทุน / ตำแหน่ง</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ที่นั่ง</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ผู้สมัคร</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ผ่านเข้ารอบสอง</th>
          <th scope="col" className="py-2 text-right font-medium">ได้รับทุน</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((u) => {
          const { label, sub } = unitLabel(u)
          return (
            <tr key={u.unitCode} className="border-b border-hairline/60 last:border-0">
              <td className="py-2 pr-3 text-ink" style={{ overflowWrap: 'break-word' }}>
                {label}
                {sub && <span className="mt-0.5 block text-xs text-muted">{sub}</span>}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(u.seats)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(u.applicants)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(u.shortlisted)}</td>
              <td className="py-2 text-right tabular-nums text-ink">{fmtInt(u.awarded)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  return (
    <Card>
      <TrackChip track={track} />
      <div className="mt-3 overflow-x-auto">{renderRows(visible)}</div>
      {rest.length > 0 && (
        <div className="mt-3">
          <ExpandRow summary={<span className="text-xs text-muted">ดูอีก {fmtInt(rest.length)} หน่วยทุน</span>}>
            <div className="overflow-x-auto">{renderRows(rest)}</div>
          </ExpandRow>
        </div>
      )}
      {top && (
        <Takeaway>
          หน่วยทุน {top.unitCode} ({top.agency}) มีผู้สมัครมากที่สุดในทุนนี้ {fmtInt(top.applicants)} คน ต่อ {fmtInt(top.seats)} ที่นั่ง
          ผ่านเข้ารอบสอง {fmtInt(top.shortlisted)} คน ได้รับทุน {fmtInt(top.awarded)} คน
        </Takeaway>
      )}
    </Card>
  )
}

function agencyRows(agencies: Track['byAgency']) {
  return [...agencies].sort((a, b) => a.fillPct - b.fillPct || b.seats - a.seats)
}

function AgencyFillTable({ rows, track }: { rows: ReturnType<typeof agencyRows>; track: Track }) {
  return (
    <table className="w-full min-w-[560px] border-collapse text-sm">
      <caption className="sr-only">อัตราเติมที่นั่งรายหน่วยงาน — {track.shortLabel}</caption>
      <thead>
        <tr className="border-b border-hairline text-left text-xs text-muted">
          <th scope="col" className="py-2 pr-3 font-medium">หน่วยงาน</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">หน่วยทุน</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ที่นั่ง</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ได้รับทุน</th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">ว่าง</th>
          <th scope="col" className="py-2 text-right font-medium">อัตราเติม</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((a) => {
          const vacant = a.seats - a.awarded
          return (
            <tr key={a.name} className="border-b border-hairline/60 last:border-0">
              <td className="py-2 pr-3 text-ink" style={{ overflowWrap: 'break-word' }}>
                {a.name}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(a.units)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(a.seats)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(a.awarded)}</td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(vacant)}</td>
              <td className={`py-2 text-right tabular-nums ${a.fillPct === 0 ? 'text-amber' : 'text-ink'}`}>
                {fmtPct(a.fillPct)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function AgencyFillCard({ track }: { track: Track }) {
  const rows = agencyRows(track.byAgency)
  const worst = rows.slice(0, AGENCY_VISIBLE)
  const rest = rows.slice(AGENCY_VISIBLE)
  const worstAgency = rows[0]

  return (
    <Card>
      <TrackChip track={track} />
      <Caption>เรียงจากหน่วยงานที่เติมที่นั่งได้น้อยที่สุดไปมากที่สุด</Caption>
      <div className="mt-3 overflow-x-auto">
        <AgencyFillTable rows={worst} track={track} />
      </div>
      {rest.length > 0 && (
        <div className="mt-3">
          <ExpandRow summary={<span className="text-xs text-muted">ดูอีก {fmtInt(rest.length)} หน่วยงาน (เติมที่นั่งได้มากกว่า)</span>}>
            <div className="overflow-x-auto">
              <AgencyFillTable rows={rest} track={track} />
            </div>
          </ExpandRow>
        </div>
      )}
      {worstAgency && (
        <Takeaway>
          {worstAgency.name} เติมที่นั่งได้น้อยที่สุดในทุนนี้ที่ {fmtPct(worstAgency.fillPct)} ({fmtInt(worstAgency.awarded)} จาก{' '}
          {fmtInt(worstAgency.seats)} ที่นั่ง)
        </Takeaway>
      )}
    </Card>
  )
}

export function AwardsSection({ tracks, totals, scopes }: { tracks: Track[]; totals: Totals; scopes: Scopes }) {
  const { rows: causeByTrack, combined } = causeRows(tracks)

  /* The single most over-subscribed unit across both tracks, derived rather than named:
     the contrast it carries (heavy demand alongside units that cleared nobody) is the
     point of this section, and a hard-coded unit code would go stale in silence. */
  const peak = tracks
    .flatMap((t) => t.topDemand.map((u) => ({ unit: u, track: t })))
    .reduce((best, cur) => (cur.unit.applicants > best.unit.applicants ? cur : best))

  const sharedAgencies = agenciesInBothTracks(tracks)

  const causeItems: BarListItem[] = [
    {
      key: 'noApplicants',
      label: 'ไม่มีผู้สมัครเลย',
      value: combined.noApplicants,
      valueLabel: `${fmtInt(combined.noApplicants)} หน่วย`,
      muted: true,
    },
    {
      key: 'noneShortlisted',
      label: 'มีผู้สมัคร แต่ไม่มีใครผ่านเข้ารอบสอง',
      value: combined.noneShortlisted,
      valueLabel: `${fmtInt(combined.noneShortlisted)} หน่วย`,
    },
    {
      key: 'shortlistedNotAwarded',
      label: 'เข้ารอบสองแล้ว แต่ไม่มีใครได้รับทุน',
      value: combined.shortlistedNotAwarded,
      valueLabel: `${fmtInt(combined.shortlistedNotAwarded)} หน่วย`,
    },
  ]

  return (
    <section id="awards">
      <SectionHeader eyebrow="ส่วนที่ 5" title="ผู้มีสิทธิได้รับทุน และที่นั่งที่ไม่มีผู้รับ" />
      <div className="flex flex-col gap-5">
        <Card>
          <Takeaway>
            จาก {fmtInt(totals.seats)} ที่นั่งที่เปิดสอบแข่งขัน มีผู้มีสิทธิได้รับทุน {fmtInt(totals.awarded)} คน ({fmtPct(totals.fillPct)}) และมี{' '}
            {fmtInt(totals.emptyUnits)} หน่วยทุนที่ไม่มีผู้ได้รับทุนเลย
          </Takeaway>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="รวมทั้งสองทุน"
            value={`${fmtInt(totals.awarded)} / ${fmtInt(totals.seats)} ที่นั่ง`}
            sub={`${fmtPct(totals.fillPct)} · หน่วยทุนว่าง ${fmtInt(totals.emptyUnits)} หน่วย`}
          />
          {tracks.map((t) => (
            <StatCard
              key={t.track}
              label={t.shortLabel}
              value={`${fmtInt(t.awarded)} / ${fmtInt(t.seats)} ที่นั่ง`}
              sub={`${fmtPct(t.fillPct)} · หน่วยทุนว่าง ${fmtInt(t.emptyUnits.total)} หน่วย`}
            />
          ))}
        </div>

        <Card>
          <p className="text-sm font-medium text-ink">สาเหตุที่หน่วยทุนไม่มีผู้ได้รับทุน ({fmtInt(combined.total)} หน่วย รวมสองทุน)</p>
          <div className="mt-3">
            <BarList items={causeItems} barColor={token.amber} mutedColor={token.neutral} />
          </div>
          <Takeaway>
            มีเพียง {fmtInt(combined.noApplicants)} หน่วยจาก {fmtInt(combined.total)} หน่วยที่ไม่มีผู้สมัครเลย ส่วนที่เหลืออีก{' '}
            {fmtInt(combined.noneShortlisted + combined.shortlistedNotAwarded)} หน่วยมีผู้สมัคร แต่ตกที่ด่านคัดเลือก — อุปสงค์ไม่ใช่ข้อจำกัดของที่นั่งว่าง
          </Takeaway>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <caption className="sr-only">สาเหตุหน่วยทุนว่าง แยกตามทุนและรวม</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">ทุน</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">ไม่มีผู้สมัครเลย</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">ไม่ผ่านเข้ารอบสอง</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">เข้ารอบสองไม่ได้รับทุน</th>
                  <th scope="col" className="py-2 text-right font-medium">รวม</th>
                </tr>
              </thead>
              <tbody>
                {causeByTrack.map((r) => (
                  <tr key={r.key} className="border-b border-hairline/60 last:border-0">
                    <td className="py-2 pr-3 text-ink">{r.label}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(r.noApplicants)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(r.noneShortlisted)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(r.shortlistedNotAwarded)}</td>
                    <td className="py-2 text-right tabular-nums text-ink">{fmtInt(r.total)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td className="py-2 pr-3 text-ink">รวม</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(combined.noApplicants)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(combined.noneShortlisted)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtInt(combined.shortlistedNotAwarded)}</td>
                  <td className="py-2 text-right tabular-nums text-ink">{fmtInt(combined.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink">หน่วยทุนที่มีผู้สมัครมากที่สุด (10 อันดับแรกต่อทุน)</p>
          {tracks.map((t) => (
            <DemandTable key={t.track} track={t} />
          ))}
          <Card>
            <Takeaway>
              หน่วยทุน {peak.unit.unitCode} ({peak.unit.agency}) ใน{peak.track.shortLabel} มีผู้สมัคร {fmtInt(peak.unit.applicants)} คน ต่อ{' '}
              {fmtInt(peak.unit.seats)} ที่นั่ง ขณะที่ในทุนเดียวกันมีอีก {fmtInt(peak.track.emptyUnits.noneShortlisted)}{' '}
              หน่วยที่มีผู้สมัคร แต่ไม่มีผู้สมัครรายใดผ่านเข้ารอบสองเลย
            </Takeaway>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-ink">อัตราเติมที่นั่งรายหน่วยงาน</p>
          {sharedAgencies.length > 0 && (
            <Caption>
              ตัวเลขในหัวข้อนี้แยกตามทุน ไม่ใช่ตามหน่วยงาน มี {fmtInt(sharedAgencies.length)} หน่วยงานที่มีที่นั่งอยู่ทั้งสองทุน
              จึงปรากฏสองครั้งด้วยอัตราเติมที่นั่งคนละค่า เช่น {sharedAgencies[0]} ให้ดูป้ายชื่อทุนบนการ์ดแต่ละใบประกอบเสมอ
            </Caption>
          )}
          {tracks.map((t) => (
            <AgencyFillCard key={t.track} track={t} />
          ))}
        </div>

        <Card>
          <Caption>{scopes.eligible}</Caption>
          <Caption>{scopes.uisSlots}</Caption>
        </Card>
      </div>
    </section>
  )
}
