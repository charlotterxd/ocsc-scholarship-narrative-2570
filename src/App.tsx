import narrativeJson from './data/narrative.json'
import type { NarrativeData } from './types'
import { Header } from './components/Header'
import { KpiRow } from './components/KpiRow'
import { BudgetSection } from './components/BudgetSection'
import { QuotaSection } from './components/QuotaSection'
import { ApplicantsSection } from './components/ApplicantsSection'
import { ShortlistSection } from './components/ShortlistSection'
import { AwardsSection } from './components/AwardsSection'
import { ObservationsSection } from './components/ObservationsSection'
import { RecommendationsSection } from './components/RecommendationsSection'
import { Footer } from './components/Footer'

/*
 * Typed import + a runtime shape guard, deliberately NOT `as unknown as NarrativeData`.
 * The double cast silences tsc entirely, so an ETL change that drops a field ships a
 * blank panel instead of failing. This keeps the structural check and adds a cheap
 * assertion for the invariants the UI copy depends on.
 */
const data = narrativeJson as NarrativeData

function guard() {
  const { tracks, totals, frame, budget, observations } = data

  if (!tracks?.length) throw new Error('narrative.json: tracks is empty')
  if (tracks.length !== 2) throw new Error(`narrative.json: expected 2 in-frame tracks, got ${tracks.length}`)
  // Sections look tracks up by name; a rename would otherwise render "—" in silence.
  for (const name of ['normal', 'uis'] as const) {
    if (!tracks.some((t) => t.track === name)) throw new Error(`narrative.json: missing track "${name}"`)
  }
  if (!observations?.length) throw new Error('narrative.json: observations is empty')
  // ส่วนที่ 7 is conditional advice: without the caveat it reads as unconditional, so the
  // caveat is as load-bearing as the items themselves.
  const recs = data.recommendations
  if (!recs?.items?.length) throw new Error('narrative.json: recommendations is empty')
  if (!recs.caveat) throw new Error('narrative.json: recommendations.caveat is missing')
  for (const r of recs.items) {
    if (!r.basis) throw new Error(`narrative.json: recommendation "${r.id}" has no basis`)
  }
  if (!budget?.subsidy?.length) throw new Error('narrative.json: budget.subsidy is empty')

  // Seats and awards may be summed across tracks; applicants may not (different exams,
  // no names kept). Check the two that may be.
  const seats = tracks.reduce((n, t) => n + t.seats, 0)
  const awarded = tracks.reduce((n, t) => n + t.awarded, 0)
  if (seats !== totals.seats) throw new Error(`narrative.json: track seats ${seats} != totals.seats ${totals.seats}`)
  if (awarded !== totals.awarded) throw new Error(`narrative.json: track awards ${awarded} != totals.awarded ${totals.awarded}`)
  if (seats + frame.otherInRow21 !== frame.row21.allocated) {
    throw new Error('narrative.json: open seats + other do not cross-foot to row 2.1')
  }

  // slots >= people is what makes the UIS per-unit caption true.
  for (const t of tracks) {
    if (t.stage2.slots < t.stage2.people) {
      throw new Error(`narrative.json: ${t.track} stage2.slots < stage2.people`)
    }
    if (t.sharedExam && t.stage1.sittingTotal === null) {
      throw new Error(`narrative.json: ${t.track} shares a sitting but has no sittingTotal`)
    }
  }
}

guard()

function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <Header meta={data.meta} />

      <main className="mx-auto max-w-content px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-12">
          <KpiRow budget={data.budget} frame={data.frame} totals={data.totals} />

          <BudgetSection budget={data.budget} />

          <QuotaSection frame={data.frame} tracks={data.tracks} scopes={data.scopes} />

          <ApplicantsSection tracks={data.tracks} budget={data.budget} scopes={data.scopes} />

          <ShortlistSection tracks={data.tracks} budget={data.budget} scopes={data.scopes} />

          <AwardsSection tracks={data.tracks} totals={data.totals} scopes={data.scopes} />

          <ObservationsSection observations={data.observations} meta={data.meta} />

          <RecommendationsSection recommendations={data.recommendations} />
        </div>
      </main>

      <Footer meta={data.meta} />
    </div>
  )
}

export default App
