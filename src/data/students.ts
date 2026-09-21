/** NOT API-BACKED.
 *  MasteryConnect REST API v2 exposes no student endpoint and no student-level
 *  score. Everything in this file is invented to demonstrate the report shape.
 *  A real build joins two sources: per-student results and the roster from
 *  Canvas Data through the Data Access Platform, and the standards and tracker
 *  structure from the MasteryConnect API. */

import { makeRng, hash, clamp, noise } from './prng'
import { CLASSROOMS } from './seed'
import { assessedObjectiveIds, standardScore } from './api'

const FIRST = ['Amara','Beatriz','Caleb','Dashiell','Elowen','Ferran','Gemma','Hiroshi','Imani','Jonas',
  'Kaia','Leandro','Maeve','Nikolai','Oona','Priya','Quinn','Rafael','Saoirse','Tobias','Uma','Vidal',
  'Wren','Xiomara','Yusuf','Zadie','Anika','Bodhi']
const LAST = ['Achebe','Bergström','Castellanos','Dagher','Eriksen','Fontaine','Gallagher','Haddad',
  'Ibarra','Jovanović','Kilpatrick','Lindqvist','Moreau','Nwachukwu','Oyelaran','Petrakis','Quintero',
  'Rasmussen','Sandoval','Tanaka','Ubeda','Vasquez','Whitmore','Yamamoto']

export interface Student {
  id: string
  name: string
  classroom_id: string
  /** Overall ability offset, in percentage points. */
  effect: number
}

export const STUDENTS: Student[] = CLASSROOMS.flatMap((c) => {
  const rng = makeRng(hash(`roster:${c.id}`))
  const n = 22 + Math.floor(rng() * 5)
  return Array.from({ length: n }, (_, i) => {
    const first = FIRST[Math.floor(rng() * FIRST.length)]
    const last = LAST[Math.floor(rng() * LAST.length)]
    return {
      id: `${c.id}-${String(i + 1).padStart(2, '0')}`,
      name: `${last}, ${first}`,
      classroom_id: c.id,
      effect: Math.round(noise(rng) * 20),
    }
  })
})

export const studentsFor = (classroomId: string) =>
  STUDENTS.filter((s) => s.classroom_id === classroomId).sort((a, b) => a.name.localeCompare(b.name))

/** Per-student score on one standard, centred on the tracker average. */
export function studentStandardScore(student: Student, objectiveId: string): number {
  const rng = makeRng(hash(`sss:${student.id}:${objectiveId}`))
  const classAvg = standardScore(student.classroom_id, objectiveId)
  return Math.round(clamp(classAvg + student.effect + noise(rng) * 9, 5, 100))
}

export function studentRecord(student: Student) {
  const objectiveIds = assessedObjectiveIds(student.classroom_id)
  const scores = objectiveIds.map((oid) => ({
    objective_id: oid,
    score: studentStandardScore(student, oid),
  }))
  const overall = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)
  return { student, scores, overall }
}
