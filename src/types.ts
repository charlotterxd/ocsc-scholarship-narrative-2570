/**
 * Shape of src/data/narrative.json, produced by etl/build_narrative.py.
 *
 * This file is the contract between the ETL and the UI. Do not widen a field to
 * `any` or add an optional to silence tsc — if a field is missing at runtime the
 * ETL is what changed, and the ETL is the authority.
 *
 * SCOPE RULES this data encodes, which the UI must not collapse:
 *  - ทุนวิทยาศาสตร์ฯ (science) is excluded from this dataset entirely.
 *  - `tracks[normal].stage1.applicants` (1,389) is a SUBSET of `sittingTotal`
 *    (1,671), not a per-track applicant count. The exam cannot be split per track.
 *  - `stage2.slots` >= `stage2.people`. For UIS they differ (49 vs 33): a candidate
 *    is shortlisted under each unit they chose. Per-unit views show slots; the
 *    headline figure is people.
 *  - applicant counts are NEVER summed across tracks (different exams, no names kept).
 */

export interface Meta {
  title: string
  agency: string
  ministry: string
  fiscalYear: number
  hearingDate: string
  sources: string[]
  note: string
  privacy: string
}

export interface Scopes {
  science: string
  sharedExam: string
  noSumApplicants: string
  openCompetition: string
  uisSlots: string
  eligible: string
}

export interface SubsidyYear {
  year: number
  budget: number
  actual: number | null
  asOf: string | null
  final: boolean
  execPct: number | null
}

export interface SelectionItem {
  name: string
  b68: number
  b69: number
  b70: number
  qty: string | null
  rate: number
}

export interface SelectionLine {
  name: string
  b68: number
  b69: number
  b70: number
  items: SelectionItem[]
}

export interface Budget {
  subsidy: SubsidyYear[]
  subsidyNote: string
  selection: SelectionLine[]
  assessment: {
    items: { line: string; lineName: string; b70: number }[]
    total70: number
  }
}

export interface Frame {
  approved: number
  allocated: number
  takenTotal: number
  row21: { name: string; allocated: number; taken: number; takenNote: string | null }
  openSeats: number
  otherInRow21: number
  asOf: string
  approvedOn: string
  byGroup: { groupNo: number; group: string; allocated: number }[]
}

/** One quota unit (หน่วยทุน) with its figures at every stage. */
export interface UnitRow {
  unitCode: string
  agency: string
  position: string | null
  field: string | null
  level: string | null
  seats: number
  applicants: number
  shortlisted: number
  awarded: number
}

export type EmptyCause = 'noApplicants' | 'noneShortlisted' | 'shortlistedNotAwarded'

export interface EmptyUnitRow extends UnitRow {
  cause: EmptyCause
}

export interface Track {
  track: 'normal' | 'uis'
  label: string
  shortLabel: string
  budgetLine: string
  budgetLineName: string
  announcementDate: string
  units: number
  seats: number
  awarded: number
  fillPct: number
  unfilledSeats: number
  /** true when this track shares one sitting with a track excluded from this app. */
  sharedExam: boolean
  stage1: {
    /** applicants who chose >= 1 unit of THIS track. A subset when sharedExam. */
    applicants: number
    choices: number
    /** total sitting size; null when the exam is this track's alone. */
    sittingTotal: number | null
  }
  /** people = distinct candidates; slots = per-unit rows. slots >= people. */
  stage2: { people: number; slots: number }
  stage3: { awarded: number }
  emptyUnits: {
    total: number
    noApplicants: number
    noneShortlisted: number
    shortlistedNotAwarded: number
    units: EmptyUnitRow[]
  }
  topDemand: UnitRow[]
  byAgency: { name: string; seats: number; awarded: number; units: number; fillPct: number }[]
  diagnostics: Diagnostics
}

/** Derived measures that ส่วนที่ 7's recommendations rest on. */
export interface Diagnostics {
  medianApplicantsPerUnit: number
  /** applicant counts of the units where nobody cleared the written exam */
  gate1EmptyApplicants: number[]
  /** distinct shortlisted people per seat (not slots) */
  shortlistPeoplePerSeat: number
  /** units that reached assessment with shortlist <= seats, i.e. no spare candidate */
  noReserveUnits: number
  noReserveEndedEmpty: number
  /** applicants who named more than one unit OF THIS TRACK. 0 for normal — see README. */
  inTrackSecondChoice: number
  clearedNotAwarded: number
  top5DemandShare: number
}

export interface Totals {
  seats: number
  awarded: number
  fillPct: number
  emptyUnits: number
  gates: { noApplicants: number; noneShortlisted: number; shortlistedNotAwarded: number }
}

export interface Observation {
  id: string
  title: string
  body: string
  source: string
  kind: 'finding' | 'discrepancy' | 'observation'
}

/**
 * ส่วนที่ 7. Unlike Observation, this is the analyst's judgement rather than a restatement
 * of the source, so every item carries `basis` — the figures it rests on — and the block
 * carries `caveat`, the question the data cannot settle. Render all three; dropping the
 * caveat turns a conditional recommendation into an unconditional one.
 */
export interface Recommendation {
  id: string
  title: string
  body: string
  basis: string
  theme: string
}

export interface Recommendations {
  items: Recommendation[]
  caveat: string
  note: string
}

export interface NarrativeData {
  meta: Meta
  scopes: Scopes
  budget: Budget
  frame: Frame
  tracks: Track[]
  totals: Totals
  observations: Observation[]
  recommendations: Recommendations
}
