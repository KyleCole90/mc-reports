import { useMemo, useState } from 'react'
import { heatMap } from '../data/queries'
import { MASTERY_BANDS, bandFor, SCHOOLS, type Subject } from '../data/seed'
import { Legend, MethodHeading, Segmented, Select, StatTile, Tooltip, SourceNote, type Method } from '../components/ui'
import { ENDPOINTS } from '../data/endpoints'
import { PAIR_SAMPLE_NOTE, PRIORITY_NOTE } from '../data/methodNotes'

const CELL = 58
const LABEL_W = 232

const PAIR_ENDPOINTS = [ENDPOINTS.classrooms, ENDPOINTS.schools, ENDPOINTS.classroomObjectives, ENDPOINTS.itemAnalysis]

/* One tracker-standard pair = one tracker's average percent correct on one standard. */
const PAIR_STEPS = [
  'List trackers for the chosen subject, filtered to the chosen school through the classroom\u2019s school relationship.',
  'For each tracker, list the standards it has assessed.',
  'For each tracker-standard pair, pull the item analysis rows for that standard and average percent_correct across the items, rounded. That is the pair score.',
]

const BAND_STEP = 'Band cuts: 90 and up Exceeds, 75 to 89 Mastery, 60 to 74 Near mastery, under 60 Remediate.'

const METHODS = {
  average: {
    steps: [...PAIR_STEPS, 'Average each tracker\u2019s pair scores to get a tracker average, rounded.', 'Average the tracker averages, rounded. Standards a tracker never assessed are left out.'],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
  },
  below: {
    steps: [...PAIR_STEPS, 'Count pairs with a score under 75, the mastery cut.', 'Divide by the number of scored pairs and round to a percent.'],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
  },
  weakest: {
    steps: [...PAIR_STEPS, 'For each standard, average the pair scores of every tracker that assessed it and round. That is the column average.', 'Sort standards by rounded column average and show the lowest.'],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
  },
  gaps: {
    steps: ['List trackers for the chosen subject and school.', 'For each tracker, list the standards it has assessed.', 'Count the standards in the subject that are missing from each tracker\u2019s list, and add those counts up.'],
    endpoints: [ENDPOINTS.classrooms, ENDPOINTS.schools, ENDPOINTS.classroomObjectives],
  },
  readFirst: {
    steps: [...PAIR_STEPS, 'Average each standard\u2019s pair scores and round. Sort ascending and take the three lowest.',
      'Check every tracker that assessed those three. If all of them score under 75, the note calls it a curriculum or pacing problem. If any tracker is at or above 75, it says to check the rows.'],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
  },
  grid: {
    steps: [...PAIR_STEPS, BAND_STEP, 'A hatched dash means the tracker never assessed that standard.',
      'Tracker avg is the mean of that row\u2019s scored cells. District average is the mean of that column\u2019s scored cells. Both are rounded.',
      'Clicking a cell opens Item health filtered to that tracker and standard.'],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
    invented: PRIORITY_NOTE,
  },
  table: {
    steps: [...PAIR_STEPS,
      'District avg is the mean of the pair scores from every tracker that assessed the standard, rounded.',
      'Trackers assessed counts trackers whose standards list includes it, out of all trackers in the filter.',
      `Band applies the cuts to the district average. ${BAND_STEP}`],
    endpoints: PAIR_ENDPOINTS,
    sample: PAIR_SAMPLE_NOTE,
    invented: PRIORITY_NOTE,
  },
} satisfies Record<string, Method>

export function MasteryHeatMap() {
  const [subject, setSubject] = useState<Subject>('Mathematics')
  const [schoolId, setSchoolId] = useState<string>('all')
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const { objectives, rows, columnAverages } = useMemo(
    () => heatMap(subject, schoolId),
    [subject, schoolId]
  )

  const weakest = useMemo(
    () =>
      objectives
        .map((o, i) => ({ o, avg: columnAverages[i] }))
        .filter((x): x is { o: typeof objectives[number]; avg: number } => x.avg !== null)
        .sort((a, b) => a.avg - b.avg)
        .slice(0, 3),
    [objectives, columnAverages]
  )

  /* True when every tracker that assessed the standard sits under the cut. */
  const everywhereLow = weakest.every(({ o }) => {
    const i = objectives.indexOf(o)
    return rows.every((r) => r.cells[i].score === null || r.cells[i].score < 75)
  })
  const scope = schoolId === 'all' ? 'district' : 'school'

  const overall = Math.round(rows.reduce((a, r) => a + r.average, 0) / rows.length)
  const belowCut = rows.flatMap((r) => r.cells).filter((c) => c.score !== null && c.score < 75).length
  const scored = rows.flatMap((r) => r.cells).filter((c) => c.score !== null).length
  const gaps = rows.flatMap((r) => r.cells).filter((c) => c.score === null).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header>
        <h1>Standards mastery heat map.</h1>
        <p className="secondary" style={{ margin: '6px 0 0', fontSize: 13.5, maxWidth: 680, lineHeight: 1.55 }}>
          Which standards are we failing, and is it district-wide or just a few classrooms? Color
          shows each tracker's average percent correct against the 75% mastery cut.
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
        <Select
          label="School"
          value={schoolId}
          onChange={setSchoolId}
          options={[{ value: 'all', label: 'All schools' }, ...SCHOOLS.map((s) => ({ value: s.id, label: s.name }))]}
        />
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[{ value: 'grid', label: 'Heat map' }, { value: 'table', label: 'Table' }]}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <StatTile label="Average percent correct" value={overall} unit="%" note={`Across ${scored} tracker-standard pairs`} method={METHODS.average} />
        <StatTile label="Below the mastery cut" value={Math.round((belowCut / scored) * 100)} unit="%" note={`${belowCut} of ${scored} pairs under 75%`} method={METHODS.below} />
        <StatTile label="Weakest standard" value={weakest[0]?.o.code ?? '—'} note={`${weakest[0]?.avg ?? 0}% ${scope} average`} method={METHODS.weakest} />
        <StatTile label="Coverage gaps" value={gaps} note="Tracker-standard pairs never assessed" method={METHODS.gaps} />
      </div>

      {weakest.length > 0 && (
        <div className="card" style={{ padding: '14px 16px', borderLeft: '3px solid var(--band-remediate)' }}>
          <MethodHeading method={METHODS.readFirst} title="Read this first">
            <h3 style={{ fontSize: 13 }}>Read this first.</h3>
          </MethodHeading>
          <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            The three weakest standards are{' '}
            {weakest.map((w, i) => (
              <span key={w.o.id}>
                <strong style={{ color: 'var(--text-primary)' }}>{w.o.code}</strong> ({w.avg}%)
                {i < weakest.length - 2 ? ', ' : i === weakest.length - 2 ? ', and ' : ''}
              </span>
            ))}
            .{' '}
            {everywhereLow
              ? 'Every tracker that assessed them is under the cut, so they read as a curriculum or pacing problem rather than a single-classroom problem.'
              : 'At least one tracker is at or above the cut on them, so check the rows before calling it a curriculum problem.'}
            {' '}Click any cell to see its flagged items.
          </p>
        </div>
      )}

      {view === 'grid' ? (
        <div className="card" style={{ padding: 16, overflowX: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <MethodHeading method={METHODS.grid} title="Heat map">
              <h2 style={{ fontSize: 14 }}>Trackers by standard.</h2>
            </MethodHeading>
          </div>
          <div style={{ minWidth: LABEL_W + objectives.length * (CELL + 2) + 90 }}>
            {/* column headers */}
            <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
              <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
                Tracker
              </div>
              {objectives.map((o) => (
                <Tooltip key={o.id} content={<><strong>{o.code}</strong> — {o.label}</>} label={`${o.code}: ${o.label}`}>
                  <div
                    style={{
                      width: CELL, flexShrink: 0, fontSize: 10, lineHeight: 1.25,
                      color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600,
                      cursor: 'default', position: 'relative',
                    }}
                  >
                    {o.code.replace(/^4\./, '').replace(/^RL\.4\.|^RI\.4\.|^L\.4\.|^W\.4\./, (m) => m.slice(0, -3) + ' ')}
                    {o.priority && <div style={{ color: 'var(--text-primary)', fontSize: 9, opacity: 0.55 }}>priority</div>}
                  </div>
                </Tooltip>
              ))}
              <div style={{ width: 86, flexShrink: 0, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                Tracker avg
              </div>
            </div>

            {/* rows */}
            {rows.map((r) => (
              <div key={r.classroom_id} style={{ display: 'flex', gap: 2, marginBottom: 2, alignItems: 'stretch' }}>
                <div style={{ width: LABEL_W, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.teacher}</div>
                  <div className="muted" style={{ fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.school}</div>
                </div>
                {r.cells.map((c, i) => {
                  const o = objectives[i]
                  if (c.score === null) {
                    return (
                      <Tooltip key={o.id} content={<><strong>{r.teacher}</strong> · {o.code} — never assessed</>} label={`${r.teacher}, ${o.code}: never assessed`}>
                        <div
                          style={{
                            width: CELL, height: 36, flexShrink: 0, borderRadius: 4,
                            background: 'var(--band-none)', color: 'var(--band-ink-none)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, cursor: 'default',
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent 0 4px, var(--border) 4px 5px)',
                          }}
                        >
                          —
                        </div>
                      </Tooltip>
                    )
                  }
                  const band = bandFor(c.score)
                  return (
                    <Tooltip
                      key={o.id}
                      content={<><strong>{r.teacher}</strong> · {o.code}<br />{c.score}% correct · {band.label}<br /><span style={{ opacity: 0.7 }}>Click for flagged items</span></>}
                    >
                      <a
                        className="tnum heat-cell"
                        href={`#items?tracker=${r.classroom_id}&standard=${encodeURIComponent(o.code)}`}
                        aria-label={`${r.teacher}, ${o.code}: ${c.score}% correct, ${band.label}. Open item health for this cell.`}
                        style={{
                          width: CELL, height: 36, flexShrink: 0, borderRadius: 4,
                          background: band.fill, color: band.ink, textDecoration: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 500,
                        }}
                      >
                        {c.score}
                      </a>
                    </Tooltip>
                  )
                })}
                <div
                  className="tnum"
                  style={{
                    width: 86, flexShrink: 0, height: 36, borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600,
                    boxShadow: 'inset 0 0 0 1px var(--border)',
                  }}
                >
                  {r.average}%
                </div>
              </div>
            ))}

            {/* column averages */}
            <div style={{ display: 'flex', gap: 2, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--baseline)' }}>
              <div style={{ width: LABEL_W, flexShrink: 0, fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                District average
              </div>
              {columnAverages.map((avg, i) => (
                <div
                  key={objectives[i].id}
                  className="tnum"
                  style={{
                    width: CELL, flexShrink: 0, textAlign: 'center', fontSize: 12.5, fontWeight: 600,
                    color: avg === null ? 'var(--text-muted)' : avg < 60 ? 'var(--band-remediate)' : 'var(--text-primary)',
                  }}
                >
                  {avg === null ? '—' : `${avg}%`}
                </div>
              ))}
              <div style={{ width: 86, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px 4px' }}>
            <MethodHeading method={METHODS.table} title="Standards table" />
          </div>
          <table>
            <thead>
              <tr>
                <th>Standard</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>District avg</th>
                <th style={{ textAlign: 'right' }}>Trackers assessed</th>
                <th>Band</th>
              </tr>
            </thead>
            <tbody>
              {objectives.map((o, i) => {
                const avg = columnAverages[i]
                const n = rows.filter((r) => r.cells[i].score !== null).length
                const band = avg === null ? null : bandFor(avg)
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {o.code}
                      {o.priority && <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}> · priority</span>}
                    </td>
                    <td className="secondary">{o.label}</td>
                    <td className="tnum" style={{ textAlign: 'right', fontWeight: 600 }}>{avg === null ? '—' : `${avg}%`}</td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{n} of {rows.length}</td>
                    <td>
                      {band ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: band.fill, boxShadow: 'inset 0 0 0 1px var(--border)' }} />
                          {band.label}
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: 12 }}>Never assessed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Legend
          title="Mastery band"
          items={[
            ...MASTERY_BANDS.map((b) => ({ label: b.label, fill: b.fill })),
            { label: 'Never assessed', fill: 'var(--band-none)' },
          ]}
        />
      </div>

      <SourceNote endpoints={PAIR_ENDPOINTS} />
    </div>
  )
}
