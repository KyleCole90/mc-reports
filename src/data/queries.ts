/** Report-level derivations over the fixture layer. */

import { CLASSROOMS, CURRICULUM_MAPS, OBJECTIVES, type Subject } from './seed'
import {
  ALL_OBJECTIVES, MATERIALS, assessedObjectiveIds, classroomById, itemAnalysis,
  objectiveById, schoolById, standardScore, teacherById,
} from './api'

/* ---------- Report 1: standards mastery heat map ---------- */

export interface HeatMapCell {
  objective_id: string
  score: number | null
}

export interface HeatMapRow {
  classroom_id: string
  title: string
  teacher: string
  school: string
  cells: HeatMapCell[]
  average: number
}

export function heatMap(subject: Subject, schoolId: string | 'all') {
  const objectives = OBJECTIVES.filter((o) => o.subject === subject)
  const classrooms = CLASSROOMS.filter(
    (c) => c.subject === subject && (schoolId === 'all' || c.school_id === schoolId)
  )

  const rows: HeatMapRow[] = classrooms.map((c) => {
    const assessed = new Set(assessedObjectiveIds(c.id))
    const cells = objectives.map((o) => ({
      objective_id: o.id,
      score: assessed.has(o.id) ? standardScore(c.id, o.id) : null,
    }))
    const scored = cells.filter((x) => x.score !== null).map((x) => x.score!)
    return {
      classroom_id: c.id,
      title: c.title,
      teacher: teacherById(c.teacher_id).name,
      school: schoolById(c.school_id).name,
      cells,
      average: Math.round(scored.reduce((a, b) => a + b, 0) / scored.length),
    }
  })

  const columnAverages = objectives.map((_o, i) => {
    const vals = rows.map((r) => r.cells[i].score).filter((v): v is number => v !== null)
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  })

  return { objectives, rows, columnAverages }
}

/* ---------- Report 2: assessment item health ---------- */

export type Severity = 'critical' | 'serious' | 'warning'

export interface Finding {
  severity: Severity
  kind: string
  detail: string
  classroom_id: string
  classroom: string
  material_id: string
  assessment: string
  standard: string
  question_number: number
  item_type: string
  dok: number
  points: number
  percent_correct: number
  /** Mean percent correct of sibling items on the same standard. */
  peer_mean: number
}

export function itemHealth(): Finding[] {
  const findings: Finding[] = []

  for (const c of CLASSROOMS) {
    const rows = itemAnalysis(c.id)
    const byStandard = new Map<string, typeof rows>()
    for (const r of rows) {
      const list = byStandard.get(r.standard) ?? []
      list.push(r)
      byStandard.set(r.standard, list)
    }

    for (const [standard, items] of byStandard) {
      const material = MATERIALS.find(
        (m) => m.classroom_id === c.id && objectiveById(m.objective_id).code === standard
      )!

      for (const it of items) {
        const peers = items.filter((p) => p.question_number !== it.question_number)
        const peerMean = peers.length
          ? Math.round(peers.reduce((a, p) => a + p.percent_correct, 0) / peers.length)
          : it.percent_correct

        const shared = {
          classroom_id: c.id,
          classroom: c.title,
          material_id: material.id,
          assessment: material.title,
          standard,
          question_number: it.question_number,
          item_type: it.item_type,
          dok: it.dok,
          points: it.points,
          percent_correct: it.percent_correct,
          peer_mean: peerMean,
        }

        if (it.percent_correct < 20 && peerMean - it.percent_correct >= 35) {
          findings.push({
            ...shared,
            severity: 'critical',
            kind: 'Possible miskey',
            detail: `${it.percent_correct}% correct against a ${peerMean}% average on the same standard. A gap this wide usually means a wrong answer key, not a hard item.`,
          })
        } else if (it.points >= 4 && it.percent_correct < 35) {
          findings.push({
            ...shared,
            severity: 'serious',
            kind: 'Overweighted and failing',
            detail: `Carries ${it.points} points but only ${it.percent_correct}% correct, so one item is driving the score down more than the standard warrants.`,
          })
        } else if (it.percent_correct >= 95 && it.points >= 3) {
          findings.push({
            ...shared,
            severity: 'warning',
            kind: 'Too easy for its weight',
            detail: `${it.percent_correct}% correct for ${it.points} points. It adds weight without telling you who has mastered the standard.`,
          })
        } else if (it.dok === 1 && it.percent_correct < 30) {
          findings.push({
            ...shared,
            severity: 'serious',
            kind: 'Recall item failing',
            detail: `A depth of knowledge one item at ${it.percent_correct}% correct points to unfamiliar wording or content that was never taught.`,
          })
        }
      }
    }
  }

  const order: Record<Severity, number> = { critical: 0, serious: 1, warning: 2 }
  return findings.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.percent_correct - b.percent_correct
  )
}

/* ---------- Report 4: curriculum map coverage gaps ---------- */

export interface CoverageRow {
  objective_id: string
  code: string
  label: string
  priority: boolean
  /** Trackers that assessed it, out of those teaching the subject. */
  assessed_in: number
  total_classrooms: number
  status: 'covered' | 'partial' | 'never_assessed'
}

export function coverage(subject: Subject) {
  const map = CURRICULUM_MAPS.find((m) => m.subject === subject)!
  const classrooms = CLASSROOMS.filter((c) => c.subject === subject)
  const assessedSets = classrooms.map((c) => new Set(assessedObjectiveIds(c.id)))

  const planned: CoverageRow[] = map.planned.map((id) => {
    const o = objectiveById(id)
    const n = assessedSets.filter((s) => s.has(id)).length
    return {
      objective_id: id,
      code: o.code,
      label: o.label,
      priority: o.priority,
      assessed_in: n,
      total_classrooms: classrooms.length,
      status: n === 0 ? 'never_assessed' : n < classrooms.length ? 'partial' : 'covered',
    }
  })

  /** Assessed somewhere but absent from the map. */
  const offMapIds = new Set<string>()
  for (const s of assessedSets) for (const id of s) if (!map.planned.includes(id)) offMapIds.add(id)

  const offMap = [...offMapIds].map((id) => {
    const o = ALL_OBJECTIVES.find((x) => x.id === id)!
    const n = assessedSets.filter((s) => s.has(id)).length
    return { objective_id: id, code: o.code, label: o.label, assessed_in: n, total_classrooms: classrooms.length }
  })

  const counts = {
    covered: planned.filter((p) => p.status === 'covered').length,
    partial: planned.filter((p) => p.status === 'partial').length,
    never_assessed: planned.filter((p) => p.status === 'never_assessed').length,
  }

  return { map, planned, offMap, counts, classrooms }
}

/* ---------- Shared: district headline numbers ---------- */

export function districtSummary() {
  const allScores = CLASSROOMS.flatMap((c) =>
    assessedObjectiveIds(c.id).map((oid) => standardScore(c.id, oid))
  )
  const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
  const below = allScores.filter((s) => s < 60).length
  return {
    average: avg,
    standards_tracked: new Set(CLASSROOMS.flatMap((c) => assessedObjectiveIds(c.id))).size,
    trackers: CLASSROOMS.length,
    assessments: MATERIALS.length,
    below_mastery_rate: Math.round((below / allScores.length) * 100),
  }
}

export const classroomLabel = (id: string) => classroomById(id).title
