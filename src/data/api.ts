/** Fixtures shaped exactly like MasteryConnect REST API v2 responses.
 *  Swapping these for live fetch calls is a config change, not a rewrite. */

import { makeRng, hash, clamp, noise, pick } from './prng'
import {
  DISTRICT, SCHOOLS, TEACHERS, CLASSROOMS, OBJECTIVES, CURRICULUM_MAPS,
  ITEM_TYPES, type Subject,
} from './seed'

/** Standards assessed in trackers but absent from the curriculum map. */
export const OFF_MAP_OBJECTIVES = [
  { id: '70301', code: '3.NF.A.1', subject: 'Mathematics' as Subject, label: 'Understand a fraction as a part of a whole (grade 3 review)', base: 58, priority: false },
  { id: '70302', code: '5.NBT.B.5', subject: 'Mathematics' as Subject, label: 'Multiply multi-digit whole numbers (grade 5 preview)', base: 41, priority: false },
  { id: '70303', code: 'RL.4.6', subject: 'English Language Arts' as Subject, label: 'Compare point of view (grade 3 review)', base: 63, priority: false },
]

export const ALL_OBJECTIVES = [...OBJECTIVES, ...OFF_MAP_OBJECTIVES]

export const objectiveById = (id: string) => ALL_OBJECTIVES.find((o) => o.id === id)!
export const classroomById = (id: string) => CLASSROOMS.find((c) => c.id === id)!
export const teacherById = (id: string) => TEACHERS.find((t) => t.id === id)!
export const schoolById = (id: string) => SCHOOLS.find((s) => s.id === id)!

/* ---------- Which standards each tracker actually assessed ---------- */

/** Standards deliberately never assessed, to create real coverage gaps. */
const NEVER_ASSESSED: Record<string, string[]> = {
  '31003': ['70112'],
  '31007': ['70112', '70113'],
  '31011': ['70103'],
  '31008': ['70205'],
  '31010': ['70203'],
  '31012': ['70206'],
}

/** Planned in the map but assessed nowhere in the district. */
const DISTRICT_NEVER_ASSESSED = ['70114', '70208']

const OFF_MAP_BY_CLASSROOM: Record<string, string[]> = {
  '31005': ['70301'],
  '31007': ['70301'],
  '31009': ['70302'],
  '31006': ['70303'],
}

export function assessedObjectiveIds(classroomId: string): string[] {
  const c = classroomById(classroomId)
  const map = CURRICULUM_MAPS.find((m) => m.subject === c.subject)!
  const dropped = [...(NEVER_ASSESSED[classroomId] ?? []), ...DISTRICT_NEVER_ASSESSED]
  const planned = map.planned.filter((id) => !dropped.includes(id))
  return [...planned, ...(OFF_MAP_BY_CLASSROOM[classroomId] ?? [])]
}

/* ---------- The performance signal ---------- */

/** Average percent correct for one tracker on one standard. */
export function standardScore(classroomId: string, objectiveId: string): number {
  const c = classroomById(classroomId)
  const o = objectiveById(objectiveId)
  const t = teacherById(c.teacher_id)
  const s = schoolById(c.school_id)
  const rng = makeRng(hash(`${classroomId}:${objectiveId}`))
  return Math.round(clamp(o.base + t.effect + s.effect + noise(rng) * 7, 12, 98))
}

/* ---------- Materials (assessments) ---------- */

export interface Material {
  id: string
  title: string
  classroom_id: string
  objective_id: string
  subject: Subject
  teacher_id: string
  total_score: number
  draft: boolean
  available: boolean
  privacy_level: number
  created_at: string
  updated_at: string
}

function isoDate(dayOffset: number) {
  const d = new Date(Date.UTC(2026, 7, 24))
  d.setUTCDate(d.getUTCDate() + dayOffset)
  return d.toISOString()
}

export const MATERIALS: Material[] = CLASSROOMS.flatMap((c) =>
  assessedObjectiveIds(c.id).map((oid, i) => {
    const o = objectiveById(oid)
    const rng = makeRng(hash(`mat:${c.id}:${oid}`))
    const items = 4 + Math.floor(rng() * 5)
    return {
      id: `${c.id}${String(i).padStart(2, '0')}`,
      title: `${o.code} — Common Formative`,
      classroom_id: c.id,
      objective_id: oid,
      subject: c.subject as Subject,
      teacher_id: c.teacher_id,
      total_score: items,
      draft: rng() < 0.12,
      available: rng() > 0.18,
      privacy_level: rng() < 0.5 ? 2 : 1,
      created_at: isoDate(Math.floor(rng() * 20)),
      updated_at: isoDate(20 + Math.floor(rng() * 8)),
    }
  })
)

export const materialsFor = (classroomId: string) =>
  MATERIALS.filter((m) => m.classroom_id === classroomId)

/* ---------- Items + the item_analysis report ---------- */

export interface ItemAnalysisRow {
  question_number: number
  item_title: string
  standard: string
  item_type: string
  dok: number
  points: number
  percent_correct: number
}

/** Planted anomalies, so the item health report finds real defects.
 *  Keyed material id -> question number. */
type AnomalyKind = 'miskey' | 'too_easy' | 'overweighted' | 'recall_fail'

const ANOMALIES: Record<string, { q: number; kind: AnomalyKind }> = {
  '3100100': { q: 5, kind: 'overweighted' },
  '3100101': { q: 7, kind: 'miskey' },
  '3100104': { q: 3, kind: 'miskey' },
  '3100106': { q: 2, kind: 'too_easy' },
  '3100109': { q: 6, kind: 'recall_fail' },
  '3100110': { q: 3, kind: 'miskey' },
  '3100201': { q: 5, kind: 'overweighted' },
  '3100203': { q: 4, kind: 'miskey' },
  '3100206': { q: 4, kind: 'too_easy' },
  '3100500': { q: 6, kind: 'miskey' },
  '3100502': { q: 2, kind: 'too_easy' },
  '3100504': { q: 3, kind: 'overweighted' },
  '3100506': { q: 5, kind: 'recall_fail' },
  '3100510': { q: 2, kind: 'miskey' },
  '3100701': { q: 4, kind: 'overweighted' },
  '3100702': { q: 2, kind: 'miskey' },
}

export function itemAnalysis(classroomId: string, assessmentId?: string): ItemAnalysisRow[] {
  const mats = assessmentId
    ? MATERIALS.filter((m) => m.id === assessmentId)
    : materialsFor(classroomId)

  return mats.flatMap((m) => {
    const o = objectiveById(m.objective_id)
    const base = standardScore(classroomId, m.objective_id)
    const rng = makeRng(hash(`items:${m.id}`))
    const anomaly = ANOMALIES[m.id]

    return Array.from({ length: m.total_score }, (_, i) => {
      const q = i + 1
      let dok = 1 + Math.floor(rng() * 3.4)
      const type = pick(rng, ITEM_TYPES)
      let points = type === 'Constructed response' ? 2 : 1
      let pc = Math.round(clamp(base - (dok - 2) * 7 + noise(rng) * 13, 5, 99))

      if (anomaly && anomaly.q === q) {
        if (anomaly.kind === 'miskey') pc = 4 + Math.floor(rng() * 6)
        if (anomaly.kind === 'too_easy') { pc = 98 + Math.floor(rng() * 2); points = 4 }
        if (anomaly.kind === 'overweighted') { points = 5; pc = 18 + Math.floor(rng() * 8) }
        if (anomaly.kind === 'recall_fail') { dok = 1; pc = 19 + Math.floor(rng() * 9) }
      }

      return {
        question_number: q,
        item_title: `${o.code} item ${q}`,
        standard: o.code,
        item_type: type,
        dok,
        points,
        percent_correct: pc,
      }
    })
  })
}

/* ---------- API-shaped response envelopes ---------- */

const envelope = <T>(data: T, meta: Record<string, unknown> = {}) => ({
  data,
  meta: { total: Array.isArray(data) ? data.length : 1, ...meta },
  links: { self: null, next: null },
})

export const getDistrict = () =>
  envelope({ id: DISTRICT.id, type: 'district', attributes: { name: DISTRICT.name, state: DISTRICT.state } })

export const getSchools = () =>
  envelope(SCHOOLS.map((s) => ({
    id: s.id,
    type: 'school',
    attributes: { name: s.name, nces_school_id: s.nces_school_id, level: s.level },
  })))

export const getClassrooms = () =>
  envelope(CLASSROOMS.map((c) => ({
    id: c.id,
    type: 'classroom',
    attributes: { title: c.title, subject: c.subject, archived: false },
    relationships: {
      teacher: { data: { id: c.teacher_id, type: 'teacher' } },
      school: { data: { id: c.school_id, type: 'school' } },
    },
  })))

export const getClassroomObjectives = (classroomId: string) =>
  envelope(assessedObjectiveIds(classroomId).map((id) => {
    const o = objectiveById(id)
    return { id: o.id, type: 'objective', attributes: { name: o.code, description: o.label } }
  }))

export const getReport = (report_name: 'item_analysis', classroomId: string, assessmentId?: string) => ({
  data: {
    report_name,
    columns: ['question_number', 'item_title', 'standard', 'item_type', 'dok', 'points', 'percent_correct'],
    rows: itemAnalysis(classroomId, assessmentId),
  },
  meta: { classroom_id: Number(classroomId), assessment_id: assessmentId ? Number(assessmentId) : null },
})
