import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Budget, SelectionLine } from '../types'
import { fmtAxisMB, fmtBaht, fmtMB, fmtPct, pctChange } from '../lib/format'
import { Card, Caption, ExpandRow, SectionHeader, Takeaway } from './Shared'
import { ChartTooltip } from './ChartTooltip'
import { token } from '../lib/tokens'

function SelectionItemsTable({ line }: { line: SelectionLine }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-xs">
        <caption className="sr-only">รายการย่อยของ {line.name}</caption>
        <thead>
          <tr className="border-b border-hairline text-left text-muted">
            <th scope="col" className="py-1.5 pr-3 font-medium">รายการ</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-medium">จำนวน/อัตรา</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-medium">2568</th>
            <th scope="col" className="py-1.5 pr-3 text-right font-medium">2569</th>
            <th scope="col" className="py-1.5 text-right font-medium">2570</th>
          </tr>
        </thead>
        <tbody>
          {line.items.map((item, idx) => (
            <tr key={`${line.name}-${idx}`} className="border-b border-hairline/60 last:border-0">
              <td className="py-1.5 pr-3 text-ink" style={{ overflowWrap: 'break-word' }}>
                {item.name}
              </td>
              <td className="py-1.5 pr-3 text-right tabular-nums text-muted">
                {item.qty ?? '—'}
                {item.rate > 0 ? ` × ${fmtBaht(item.rate)}` : ''}
              </td>
              <td className="py-1.5 pr-3 text-right tabular-nums text-ink">{fmtBaht(item.b68)}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums text-ink">{fmtBaht(item.b69)}</td>
              <td className="py-1.5 text-right tabular-nums text-ink">{fmtBaht(item.b70)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BudgetSection({ budget }: { budget: Budget }) {
  const y2568 = budget.subsidy.find((s) => s.year === 2568)!
  const y2569 = budget.subsidy.find((s) => s.year === 2569)!
  const y2570 = budget.subsidy.find((s) => s.year === 2570)!

  const chartData: { year: string; budgetVal: number; actualVal: number | undefined }[] = budget.subsidy.map((s) => ({
    year: `ปี ${s.year}`,
    budgetVal: s.budget,
    actualVal: s.actual ?? undefined,
  }))

  const subsidyCutPct = pctChange(y2569.budget, y2570.budget)

  const maxLine = [...budget.selection].sort((a, b) => b.b70 - a.b70)[0]
  const totalSelectionB70 = budget.selection.reduce((sum, line) => sum + line.b70, 0)
  const subsidyToSelectionPct = (maxLine.b70 / y2570.budget) * 100

  return (
    <section id="budget">
      <SectionHeader eyebrow="ส่วนที่ 1" title="งบประมาณ: เงินอุดหนุนทุนรัฐบาลกับงบดำเนินการคัดเลือก" />
      <div className="flex flex-col gap-5">
        <Card>
          <p className="text-sm font-medium text-ink">เงินอุดหนุนทุนรัฐบาล ก.พ. เทียบผลเบิกจ่ายจริงรายปี</p>
          <div style={{ width: '100%', height: 280 }} className="mt-2">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 24, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke={token.hairline} />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={fmtAxisMB}
                  tick={{ fontSize: 12 }}
                  width={40}
                  domain={[0, 'dataMax']}
                  label={{ value: 'ล้านบาท', position: 'insideTopLeft', fontSize: 11, fill: token.muted }}
                />
                <Tooltip cursor={{ fill: 'rgba(15,23,42,0.04)' }} content={<ChartTooltip formatter={(v) => fmtBaht(v)} />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar isAnimationActive={false} dataKey="budgetVal" name="งบประมาณที่ตั้งไว้" fill={token.secondary} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar isAnimationActive={false} dataKey="actualVal" name="ผลเบิกจ่ายจริง" fill={token.primary} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Takeaway>
            งบอุดหนุนทรงตัวที่ {fmtMB(y2568.budget, 0)} ในปี 2568–2569 ก่อนถูกปรับลดเหลือ {fmtMB(y2570.budget, 0)} ในปี 2570 (
            {fmtPct(subsidyCutPct, { signed: true })} เทียบปี 2569) ปี 2570 ยังไม่มีผลเบิกจ่ายเพราะยังไม่เริ่มปีงบประมาณ
          </Takeaway>
          <Caption>{budget.subsidyNote}</Caption>
        </Card>

        <Card>
          <p className="text-sm font-medium text-ink">งบดำเนินงานคัดเลือกทุน (รายการ 1.1–1.3)</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <caption className="sr-only">งบดำเนินงานคัดเลือกทุน เปรียบเทียบปี 2568–2570</caption>
              <thead>
                <tr className="border-b border-hairline text-left text-xs text-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">รายการ</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">2568</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">2569</th>
                  <th scope="col" className="py-2 text-right font-medium">2570</th>
                </tr>
              </thead>
              <tbody>
                {budget.selection.map((line) => (
                  <tr key={line.name} className="border-b border-hairline/60 last:border-0">
                    <td className="py-2 pr-3 text-ink" style={{ overflowWrap: 'break-word' }}>
                      {line.name}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtBaht(line.b68)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-ink">{fmtBaht(line.b69)}</td>
                    <td className="py-2 text-right tabular-nums text-ink">{fmtBaht(line.b70)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {budget.selection.map((line) => (
              <ExpandRow
                key={line.name}
                summary={<span className="text-sm text-ink">{line.name} — รายการย่อย ({line.items.length} รายการ)</span>}
              >
                <SelectionItemsTable line={line} />
              </ExpandRow>
            ))}
          </div>

          <Takeaway>
            งบดำเนินงานคัดเลือกทั้งสามรายการ (1.1–1.3) ปี 2570 รวมกันเพียง {fmtBaht(totalSelectionB70)} เป็นงบที่ใช้จัดสอบแข่งขันเพื่อคัดคนเข้าสู่เงินอุดหนุน{' '}
            {fmtMB(y2570.budget, 0)} ก้อนใหญ่ด้านบน รายการที่ตั้งไว้สูงสุดคือ {maxLine.name} เพียง {fmtBaht(maxLine.b70)} หรือประมาณ{' '}
            {fmtPct(subsidyToSelectionPct, { digits: 3 })} ของเงินอุดหนุนที่รายการนี้เป็นเงื่อนไขให้จัดสรร
          </Takeaway>
          <Caption>ตัวเลขทุกรายการเป็นงบดำเนินงานคัดเลือก ไม่ใช่เงินอุดหนุนที่มอบให้ผู้รับทุน คนละก้อนกับกราฟด้านบน</Caption>
        </Card>
      </div>
    </section>
  )
}
