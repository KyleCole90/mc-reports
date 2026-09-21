import { useMemo, useState } from 'react'
import { itemHealth, type Finding, type Severity } from '../data/queries'
import { CLASSROOMS } from '../data/seed'
import { MATERIALS } from '../data/api'
import { Meter, SeverityBadge, Select, StatTile, SourceNote, Legend } from '../components/ui'

const SEV_ORDER: Severity[] = ['critical', 'serious', 'warning']

const SEV_FILL: Record<Severity, string> = {
  critical: 'var(--status-critical)',
  serious: 'var(--status-serious)',
  warning: 'var(--status-warning)',
}

export function ItemHealth() {
  const [classroomId, setClassroomId] = useState<string>('all')
  const [severity, setSeverity] = useState<string>('all')

  const all = useMemo(() => itemHealth(), [])

  const findings = useMemo(
    () =>
      all.filter(
        (f) =>
          (classroomId === 'all' || f.classroom_id === classroomId) &&
          (severity === 'all' || f.severity === severity)
      ),
    [all, classroomId, severity]
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, serious: 0, warning: 0 }
    for (const f of all) c[f.severity]++
    return c
  }, [all])

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12 }}>
        <StatTile label="Items scanned" value={totalItems.toLocaleString()} note={`${MATERIALS.length} assessments across ${CLASSROOMS.length} trackers`} />
        <StatTile label="Needs a fix" value={all.length} note={`${((all.length / totalItems) * 100).toFixed(1)}% of all items`} />
        <StatTile label="Likely miskeyed" value={counts.critical} note="Fix before the next window" />
        <StatTile label="Weighting problems" value={counts.serious + counts.warning} note="Points do not match difficulty" />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Select
          label="Tracker"
          value={classroomId}
          onChange={setClassroomId}
          options={[{ value: 'all', label: 'All trackers' }, ...CLASSROOMS.map((c) => ({ value: c.id, label: c.title }))]}
        />
        <Select
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={[
            { value: 'all', label: 'All severities' },
            ...SEV_ORDER.map((s) => ({ value: s as string, label: s[0].toUpperCase() + s.slice(1) })),
          ]}
        />
      </div>

      {findings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 44, color: 'var(--text-secondary)' }}>
          No items flagged for this filter.
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

      <SourceNote endpoints={['GET /api/v2/reports/item_analysis', 'GET /api/v2/materials/{id}/items']} />
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
