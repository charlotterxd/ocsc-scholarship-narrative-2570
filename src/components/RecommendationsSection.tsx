import type { Recommendation, Recommendations } from '../types'
import { Callout, Card, Caption, SectionHeader } from './Shared'

function RecommendationCard({ index, item }: { index: number; item: Recommendation }) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold tabular-nums text-primary">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-relaxed text-ink">{item.title}</p>
          </div>
          <span className="mt-1.5 inline-flex items-center rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
            {item.theme}
          </span>
          <p className="mt-2 text-sm leading-relaxed text-ink">{item.body}</p>
          <Caption>ฐานข้อมูลที่ใช้: {item.basis}</Caption>
        </div>
      </div>
    </Card>
  )
}

export function RecommendationsSection({ recommendations }: { recommendations: Recommendations }) {
  return (
    <section id="recommendations">
      <SectionHeader eyebrow="ส่วนที่ 7" title="ข้อเสนอเชิงนโยบาย" />
      <div className="flex flex-col gap-5">
        <Callout title="ข้อจำกัดของข้อเสนอชุดนี้" tone="amber">
          {recommendations.caveat}
        </Callout>

        <div className="flex flex-col gap-4">
          {recommendations.items.map((item, i) => (
            <RecommendationCard key={item.id} index={i + 1} item={item} />
          ))}
        </div>

        <Card>
          <Caption>{recommendations.note}</Caption>
        </Card>
      </div>
    </section>
  )
}
