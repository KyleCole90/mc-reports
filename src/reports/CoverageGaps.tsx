import { useMemo, useState } from 'react'
import { coverage } from '../data/queries'
import { assessedObjectiveIds } from '../data/api'
import { teacherById } from '../data/api'
import type { Subject } from '../data/seed'
import { Legend, MethodHeading, Segmented, StatTile, SourceNote, Tooltip, type Method } from '../components/ui'
import { ENDPOINTS } from '../data/endpoints'
import { PRIORITY_NOTE } from '../data/methodNotes'

/* Coverage state is an ordered severity, not series identity, so it takes the
   reserved status palette. Each segment ships a number and a labelled legend
   entry, so color never carries the meaning alone. */
const STATE = {
  covered: { fill: 'var(--status-good)', ink: '#0b0b0b', glyph: '\u2713' },
  partial: { fill: 'var(--status-warning)', ink: '#0b0b0b', glyph: '\u25CF' },
  never: { fill: 'var(--status-critical)', ink: '#ffffff', glyph: '\u2715' },
}

const MAP_ENDPOINTS = [ENDPOINTS.curriculumMaps, ENDPOINTS.curriculumMapObjectives]
const MATCH_ENDPOINTS = [...MAP_ENDPOINTS, ENDPOINTS.classrooms, ENDPOINTS.classroomObjectives]

const MATCH_STEPS = [
  'Find the curriculum map for the chosen subject and list its planned standards.',
  'List every tracker in the subject, then list the standards each one has assessed.',
  'For each planned standard, count how many trackers assessed it.',
]

const METHODS = {
  total: {
    steps: [MATCH_STEPS[0], 'Count the planned standards.'],
    endpoints: MAP_ENDPOINTS,
  },
  covered: {
    steps: [...MATCH_STEPS, 'Count planned standards assessed by every tracker.', 'Divide by standards in the map for the percent.'],
    endpoints: MATCH_ENDPOINTS,
  },
  partial: {
    steps: [...MATCH_STEPS, 'Count planned standards assessed by at least one tracker but not all of them.'],
    endpoints: MATCH_ENDPOINTS,
  },
  offMap: {
    steps: [MATCH_STEPS[0], MATCH_STEPS[1], 'Take every standard any tracker assessed and drop the ones that are in the map.', 'Count what is left.'],
    endpoints: MATCH_ENDPOINTS,
  },
  coverageBar: {
    steps: [...MATCH_STEPS,
      'Bucket each planned standard: every tracker is Assessed everywhere, some trackers is Assessed in some trackers, zero trackers is Never assessed.',
      'Each segment\u2019s width is its count over the standards in the map.'],
    endpoints: MATCH_ENDPOINTS,
  },
  neverAssessedTable: {
    steps: [...MATCH_STEPS, 'Keep planned standards with a count of zero.'],
    endpoints: MATCH_ENDPOINTS,
    invented: PRIORITY_NOTE,
  },
  partlyAssessedTable: {
    steps: [...MATCH_STEPS, 'Keep planned standards with a count above zero but below the tracker total.',
      'Coverage is that count over the trackers in the subject. Missing from names the teacher of each tracker whose list lacks the standard.'],
    endpoints: [...MATCH_ENDPOINTS, ENDPOINTS.teacher],
    invented: PRIORITY_NOTE,
  },
  offMapTable: {
    steps: [MATCH_STEPS[0], MATCH_STEPS[1], 'Keep standards that a tracker assessed but the map never planned.', 'Trackers is how many trackers assessed it over the trackers in the subject.'],
    endpoints: MATCH_ENDPOINTS,
  },
} satisfies Record<string, Method>

export function CoverageGaps() {
  const [subject, setSubject] = useState<Subject>('Mathematics')
  const c = useMemo(() => coverage(subject), [subject])

  const total = c.planned.length
  const neverAssessed = c.planned.filter((p) => p.status === 'never_assessed')
  const partial = c.planned.filter((p) => p.status === 'partial')

  const segments = [
    { key: 'covered', label: 'Assessed everywhere', n: c.counts.covered, ...STATE.covered },
    { key: 'partial', label: 'Assessed in some trackers', n: c.counts.partial, ...STATE.partial },
    { key: 'never', label: 'Never assessed', n: c.counts.never_assessed, ...STATE.never },
  ].filter((s) => s.n > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header>
        <h1>Curriculum map coverage gaps.</h1>
        <p className="secondary" style={{ margin: '6px 0 0', fontSize: 13.5, maxWidth: 680, lineHeight: 1.55 }}>
          What did we plan but never assess? Standards in the year map are matched against standards
          that actually appear in tracker assessments, in both directions.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Segmented
          label="Subject"
          value={subject}
          onChange={setSubject}
          options={[
            { value: 'Mathematics', label: 'Mathematics' },
            { value: 'English Language Arts', label: 'ELA' },
          ]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12 }}>
        <StatTile label="Standards in the map" value={total} note={c.map.name} method={METHODS.total} />
        <StatTile label="Assessed everywhere" value={c.counts.covered} note={`${Math.round((c.counts.covered / total) * 100)}% of the map`} method={METHODS.covered} />
        <StatTile label="Partly assessed" value={c.counts.partial} note="Some trackers skipped them" method={METHODS.partial} />
        <StatTile label="Off the map" value={c.offMap.length} note="Assessed but never planned" method={METHODS.offMap} />
      </div>

      {/* Stacked bar: part-to-whole with direct labels */}
      <div className="card">
        <MethodHeading method={METHODS.coverageBar} title="Map coverage">
          <h2 style={{ fontSize: 14 }}>Map coverage.</h2>
        </MethodHeading>
        <p className="muted" style={{ fontSize: 12, margin: '4px 0 14px' }}>
          {total} planned standards across {c.classrooms.length} trackers.
        </p>
        <div style={{ display: 'flex', gap: 2, height: 44 }}>
          {segments.map((s, i) => (
            <Tooltip
              key={s.key}
              content={<><strong>{s.n}</strong> {s.n === 1 ? 'standard' : 'standards'} — {s.label}</>}
              label={`${s.n} ${s.n === 1 ? 'standard' : 'standards'}: ${s.label}`}
              style={{ flex: s.n, minWidth: 34 }}
            >
              <div
                style={{
                  flex: 1,
                  background: s.fill,
                  borderRadius:
                    segments.length === 1 ? 4
                    : i === 0 ? '4px 0 0 4px'
                    : i === segments.length - 1 ? '0 4px 4px 0'
                    : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  color: s.ink, fontSize: 13, fontWeight: 600, cursor: 'default',
                  minWidth: 34,
                }}
                className="tnum"
              >
                <span aria-hidden style={{ fontSize: 10 }}>{s.glyph}</span>
                {s.n}
              </div>
            </Tooltip>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Legend items={segments.map((s) => ({ label: `${s.glyph} ${s.label}`, fill: s.fill, note: `(${s.n})` }))} />
        </div>
      </div>

      {/* The headline gap */}
      {neverAssessed.length > 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--status-critical)' }}>
          <MethodHeading method={METHODS.neverAssessedTable} title="Planned, but assessed nowhere">
            <h2 style={{ fontSize: 14 }}>Planned, but assessed nowhere.</h2>
          </MethodHeading>
          <p className="secondary" style={{ fontSize: 12.5, margin: '4px 0 12px', lineHeight: 1.55 }}>
            Not one tracker in the district assessed these. There is no data to tell you whether
            students learned them.
          </p>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Description</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {neverAssessed.map((p) => (
                <tr key={p.objective_id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{p.code}</td>
                  <td className="secondary">{p.label}</td>
                  <td>{p.priority ? <strong style={{ color: 'var(--status-critical)' }}>Priority</strong> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Partial coverage */}
      {partial.length > 0 && (
        <div className="card">
          <MethodHeading method={METHODS.partlyAssessedTable} title="Assessed in some trackers only">
            <h2 style={{ fontSize: 14 }}>Assessed in some trackers only.</h2>
          </MethodHeading>
          <p className="secondary" style={{ fontSize: 12.5, margin: '4px 0 12px', lineHeight: 1.55 }}>
            Comparing these standards across the district is unsafe, because some classrooms have no
            result at all.
          </p>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Coverage</th>
                <th>Missing from</th>
              </tr>
            </thead>
            <tbody>
              {partial.map((p) => {
                const missing = c.classrooms
                  .filter((cl) => !assessedObjectiveIds(cl.id).includes(p.objective_id))
                  .map((cl) => teacherById(cl.teacher_id).name)
                return (
                  <tr key={p.objective_id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {p.code}
                      {p.priority && <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}> · priority</span>}
                    </td>
                    <td className="secondary">{p.label}</td>
                    <td className="tnum" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {p.assessed_in} of {p.total_classrooms}
                    </td>
                    <td className="secondary" style={{ fontSize: 12.5 }}>{missing.join(', ')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Off-map */}
      {c.offMap.length > 0 && (
        <div className="card" style={{ borderLeft: '3px solid var(--status-warning)' }}>
          <MethodHeading method={METHODS.offMapTable} title="Assessed, but not in the map">
            <h2 style={{ fontSize: 14 }}>Assessed, but not in the map.</h2>
          </MethodHeading>
          <p className="secondary" style={{ fontSize: 12.5, margin: '4px 0 12px', lineHeight: 1.55 }}>
            Teachers built assessments for standards the year map never planned. Usually that means
            filling a prerequisite gap, which is worth knowing before you revise the map.
          </p>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Trackers</th>
              </tr>
            </thead>
            <tbody>
              {c.offMap.map((o) => (
                <tr key={o.objective_id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{o.code}</td>
                  <td className="secondary">{o.label}</td>
                  <td className="tnum" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {o.assessed_in} of {o.total_classrooms}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SourceNote endpoints={MATCH_ENDPOINTS} />
    </div>
  )
}
