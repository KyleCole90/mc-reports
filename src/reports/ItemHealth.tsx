import { useEffect, useMemo, useState } from 'react'
import { itemHealth, type Finding, type Severity } from '../data/queries'
import { CLASSROOMS } from '../data/seed'
import { MATERIALS } from '../data/api'
import { Meter, MethodHeading, SeverityBadge, Select, StatTile, SourceNote, Legend, type Method } from '../components/ui'
import { ENDPOINTS } from '../data/endpoints'

const SEV_ORDER: Severity[] = ['critical', 'serious', 'warning']

const SEV_FILL: Record<Severity, string> = {
  critical: 'var(--status-critical)',
  serious: 'var(--status-serious)',
  warning: 'var(--status-warning)',
}

/* Same names the badge and legend use. */
const SEV_LABEL: Record<Severity, string> = { critical: 'Critical', serious: 'Serious', warning: 'Review' }

const WEIGHTING_KINDS = new Set(['Overweighted and failing', 'Too easy for its weight'])

const ANALYSIS_ENDPOINTS = [ENDPOINTS.classrooms, ENDPOINTS.itemAnalysis]

/* Peer mean = mean percent_correct of the other items on the same standard in the same tracker. */
const PEER_STEPS = [
  'For every tracker, pull the item analysis rows and group them by standard.',
  'For each item, average percent_correct across the other items in its group and round. That is the peer mean. An item with no siblings uses its own percent_correct, so the miskey rule can never fire on it.',
]

const RULES = [
  'Critical, possible miskey: percent_correct under 20 and at least 35 points below the peer mean.',
  'Serious, overweighted and failing: 4 or more points and percent_correct under 35.',
  'Review, too easy for its weight: percent_correct 95 or higher and 3 or more points.',
  'Serious, recall item failing: DOK 1 and percent_correct under 30.',
  'Rules run in that order and an item takes the first one it matches.',
]

const UNFILTERED = 'The tracker, standard, and severity filters on this page do not change this number.'

const METHODS = {
  scanned: {
    steps: ['List every assessment in every tracker.', 'Add up each assessment\u2019s item count.', UNFILTERED],
    endpoints: [ENDPOINTS.classrooms, ENDPOINTS.materials, ENDPOINTS.materialItems],
  },
  fix: {
    steps: [...PEER_STEPS, 'Count items that match any of the four rules below.', ...RULES, 'Divide by items scanned for the percent.', UNFILTERED],
    endpoints: [...ANALYSIS_ENDPOINTS, ENDPOINTS.materialItems],
  },
  miskey: {
    steps: [...PEER_STEPS, RULES[0], UNFILTERED],
    endpoints: ANALYSIS_ENDPOINTS,
  },
  weighting: {
    steps: [...PEER_STEPS, 'Count items that match either rule:', RULES[1], RULES[2], UNFILTERED],
    endpoints: [...ANALYSIS_ENDPOINTS, ENDPOINTS.materialItems],
  },
  cards: {
    steps: [...PEER_STEPS, ...RULES,
      'Apply the tracker, standard, and severity filters, then sort by severity and by percent_correct from lowest to highest.',
      'The two meters show this item\u2019s percent_correct and the peer mean. The gap is the difference between them in percentage points, shown without a sign and labeled Harder or Easier than peers.'],
    endpoints: [ENDPOINTS.classrooms, ENDPOINTS.materials, ENDPOINTS.itemAnalysis, ENDPOINTS.materialItems],
  },
} satisfies Record<string, Method>

/* The heat map links here as #items?tracker=ID&standard=CODE. */
function readParams() {
  const q = window.location.hash.split('?')[1] ?? ''
  const p = new URLSearchParams(q)
  return { tracker: p.get('tracker') ?? 'all', standard: p.get('standard') ?? 'all' }
}

export function ItemHealth() {
  const [classroomId, setClassroomId] = useState<string>(() => readParams().tracker)
  const [standard, setStandard] = useState<string>(() => readParams().standard)
  const [severity, setSeverity] = useState<string>('all')

  useEffect(() => {
    const onHash = () => {
      const p = readParams()
      setClassroomId(p.tracker)
      setStandard(p.standard)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const all = useMemo(() => itemHealth(), [])
  const standards = useMemo(() => [...new Set(all.map((f) => f.standard))].sort(), [all])

  const findings = useMemo(
    () =>
      all.filter(
        (f) =>
          (classroomId === 'all' || f.classroom_id === classroomId) &&
          (standard === 'all' || f.standard === standard) &&
          (severity === 'all' || f.severity === severity)
      ),
    [all, classroomId, standard, severity]
  )

  const filtered = classroomId !== 'all' || standard !== 'all' || severity !== 'all'
  function clearFilters() {
    setClassroomId('all')
    setStandard('all')
    setSeverity('all')
    if (window.location.hash.includes('?')) window.location.hash = 'items'
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, serious: 0, warning: 0 }
    for (const f of all) c[f.severity]++
    return c
  }, [all])
  const weighting = all.filter((f) => WEIGHTING_KINDS.has(f.kind)).length

  const totalItems = MATERIALS.reduce((a, m) => a + m.total_score, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header>
        <h1>Assessment item health.</h1>
        <p className="secondary" style={{ margin: '6px 0 0', fontSize: 13.5, maxWidth: 680, lineHeight: 1.55 }}>
          Which items are broken, not just hard? Each item's percent correct is compared against the
          other items on the same standard in the same tracker. A wide gap means the item is the
          problem, not the student.
        </p>
      </header>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Select
          label="Tracker"
          value={classroomId}
          onChange={setClassroomId}
          options={[{ value: 'all', label: 'All trackers' }, ...CLASSROOMS.map((c) => ({ value: c.id, label: c.title }))]}
        />
        <Select
          label="Standard"
          value={standard}
          onChange={setStandard}
          options={[{ value: 'all', label: 'All standards' }, ...standards.map((s) => ({ value: s, label: s }))]}
        />
        <Select
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={[
            { value: 'all', label: 'All severities' },
            ...SEV_ORDER.map((s) => ({ value: s as string, label: SEV_LABEL[s] })),
          ]}
        />
        {filtered && (
          <button
            onClick={clearFilters}
            style={{
              font: 'inherit', fontSize: 12.5, padding: '7px 12px', borderRadius: 7,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12 }}>
        <StatTile label="Items scanned" value={totalItems.toLocaleString()} note={`${MATERIALS.length} assessments across ${CLASSROOMS.length} trackers`} method={METHODS.scanned} />
        <StatTile label="Needs a fix" value={all.length} note={`${((all.length / totalItems) * 100).toFixed(1)}% of all items`} method={METHODS.fix} />
        <StatTile label="Likely miskeyed" value={counts.critical} note="Fix before the next window" method={METHODS.miskey} />
        <StatTile label="Weighting problems" value={weighting} note="Points do not match difficulty" method={METHODS.weighting} />
      </div>

      <MethodHeading method={METHODS.cards} title="Flagged items" />

      {findings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 44, color: 'var(--text-secondary)' }}>
          No items flagged for this filter.{' '}
          <button
            onClick={clearFilters}
            style={{ font: 'inherit', fontSize: 13, border: 0, background: 'none', color: 'var(--series-1)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {findings.map((f) => (
            <FindingCard key={`${f.material_id}-${f.question_number}`} f={f} />
          ))}
        </div>
      )}

      <Legend
        title="Severity"
        items={[
          { label: 'Critical — likely miskeyed', fill: 'var(--status-critical)' },
          { label: 'Serious — weighting or coverage', fill: 'var(--status-serious)' },
          { label: 'Review — low information', fill: 'var(--status-warning)' },
        ]}
      />

      <SourceNote endpoints={[ENDPOINTS.itemAnalysis, ENDPOINTS.materialItems]} />
    </div>
  )
}

function FindingCard({ f }: { f: Finding }) {
  const gap = f.peer_mean - f.percent_correct
  return (
    <div
      className="card"
      style={{ padding: '14px 16px', borderLeft: `3px solid ${SEV_FILL[f.severity]}`, display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <SeverityBadge severity={f.severity} />
        <h3 style={{ fontSize: 13.5 }}>{f.kind}</h3>
        <span className="muted" style={{ fontSize: 12 }}>
          {f.standard} · question {f.question_number} · {f.item_type} · DOK {f.dok} · {f.points} {f.points === 1 ? 'point' : 'points'}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 760 }}>
        {f.detail}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 4 }}>
            This item
          </div>
          <Meter value={f.percent_correct} fill={SEV_FILL[f.severity]} />
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 4 }}>
            Other items, same standard
          </div>
          <Meter value={f.peer_mean} fill="var(--series-1)" />
        </div>
        <div>
          <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 4 }}>
            {gap > 0 ? 'Harder than peers' : 'Easier than peers'}
          </div>
          <div className="tnum" style={{ fontSize: 17, fontWeight: 600, color: gap > 0 ? SEV_FILL[f.severity] : 'var(--text-secondary)' }}>
            {Math.abs(gap)} pts
          </div>
        </div>
      </div>

      <div className="muted" style={{ fontSize: 11.5, borderTop: '1px solid var(--grid)', paddingTop: 9 }}>
        {f.classroom} · {f.assessment}
      </div>
    </div>
  )
}
