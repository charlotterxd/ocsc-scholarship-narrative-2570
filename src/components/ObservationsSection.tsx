import type { Meta, Observation } from '../types'
import { Card, Caption, ChangeBadge, SectionHeader, type BadgeTone } from './Shared'

const KIND_LABEL: Record<Observation['kind'], string> = {
  finding: 'ข้อค้นพบ',
  discrepancy: 'ข้อมูลไม่ตรงกัน',
  observation: 'ข้อสังเกต',
}

const KIND_TONE: Record<Observation['kind'], BadgeTone> = {
  finding: 'cut',
  discrepancy: 'increase',
  observation: 'neutral',
}

const KIND_ORDER: Observation['kind'][] = ['finding', 'discrepancy', 'observation']

function ObservationCard({ observation }: { observation: Observation }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-relaxed text-ink">{observation.title}</p>
        <ChangeBadge tone={KIND_TONE[observation.kind]}>{KIND_LABEL[observation.kind]}</ChangeBadge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-ink">{observation.body}</p>
      <Caption>ที่มา: {observation.source}</Caption>
    </Card>
  )
}

export function ObservationsSection({ observations, meta }: { observations: Observation[]; meta: Meta }) {
  const groups = KIND_ORDER.map((kind) => ({
    kind,
    items: observations.filter((o) => o.kind === kind),
  })).filter((g) => g.items.length > 0)

  return (
    <section id="observations">
      <SectionHeader eyebrow="ส่วนที่ 6" title="ข้อสังเกต" />
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <div key={g.kind} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <ChangeBadge tone={KIND_TONE[g.kind]}>{KIND_LABEL[g.kind]}</ChangeBadge>
              <span className="text-xs text-muted">{g.items.length} รายการ</span>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {g.items.map((o) => (
                <ObservationCard key={o.id} observation={o} />
              ))}
            </div>
          </div>
        ))}

        <Card>
          <Caption>{meta.note}</Caption>
          <Caption>{meta.privacy}</Caption>
        </Card>
      </div>
    </section>
  )
}
