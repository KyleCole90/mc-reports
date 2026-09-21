import { useState, type ReactNode } from 'react'

/* ---------- Hover tooltip ---------- */

export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'contents' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 40,
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--text-primary)',
            color: 'var(--surface-1)',
            padding: '8px 10px',
            borderRadius: 6,
            fontSize: 12,
            lineHeight: 1.45,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}

/* ---------- Legend ---------- */

export interface LegendItem {
  label: string
  fill: string
  note?: string
}

export function Legend({ items, title }: { items: LegendItem[]; title?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      {title && <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{title}</span>}
      {items.map((it) => (
        <span key={it.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <span
            aria-hidden
            style={{
              width: 11, height: 11, borderRadius: 3, background: it.fill,
              boxShadow: 'inset 0 0 0 1px var(--border)', flexShrink: 0,
            }}
          />
          {it.label}
          {it.note && <span className="muted">{it.note}</span>}
        </span>
      ))}
    </div>
  )
}

/* ---------- Stat tile ---------- */

export function StatTile({ label, value, unit, note }: { label: string; value: string | number; unit?: string; note?: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
        {value}
        {unit && <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginLeft: 2 }}>{unit}</span>}
      </div>
      {note && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 5 }}>{note}</div>}
    </div>
  )
}

/* ---------- Severity badge: icon + label, never color alone ---------- */

const SEVERITY: Record<string, { fill: string; glyph: string; label: string }> = {
  critical: { fill: 'var(--status-critical)', glyph: '✕', label: 'Critical' },
  serious: { fill: 'var(--status-serious)', glyph: '▲', label: 'Serious' },
  warning: { fill: 'var(--status-warning)', glyph: '●', label: 'Review' },
  good: { fill: 'var(--status-good)', glyph: '✓', label: 'Healthy' },
}

export function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY[severity] ?? SEVERITY.warning
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      <span
        aria-hidden
        style={{
          width: 16, height: 16, borderRadius: '50%', background: s.fill, color: '#fff',
          fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {s.glyph}
      </span>
      {s.label}
    </span>
  )
}

/* ---------- Meter: single ratio against a limit, same-ramp track ---------- */

export function Meter({ value, max = 100, fill }: { value: number; max?: number; fill: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <span
        aria-hidden
        style={{
          position: 'relative', flex: 1, height: 8, minWidth: 48,
          background: 'var(--grid)', borderRadius: 4, overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute', inset: '0 auto 0 0', width: `${pct}%`,
            background: fill, borderRadius: 4,
          }}
        />
      </span>
      <span className="tnum" style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
        {value}%
      </span>
    </span>
  )
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</span>
      <div role="group" aria-label={label} style={{ display: 'inline-flex', background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 7, padding: 2, gap: 2 }}>
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              style={{
                border: 0, cursor: 'pointer', font: 'inherit', fontSize: 12.5,
                padding: '5px 11px', borderRadius: 5,
                background: active ? 'var(--text-primary)' : 'transparent',
                color: active ? 'var(--surface-1)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Select ---------- */

export function Select<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <label style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          font: 'inherit', fontSize: 12.5, padding: '6px 10px', borderRadius: 7,
          border: '1px solid var(--border)', background: 'var(--surface-1)',
          color: 'var(--text-primary)', minWidth: 180,
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

/* ---------- Source note: what is real, what is invented ---------- */

export function SourceNote({ endpoints, invented }: { endpoints: string[]; invented?: string }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
      <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Data source. </strong>
      {endpoints.map((e, i) => (
        <span key={e}>
          <code style={{ fontSize: 11.5, background: 'var(--grid)', padding: '1px 5px', borderRadius: 4 }}>{e}</code>
          {i < endpoints.length - 1 ? ' ' : ''}
        </span>
      ))}
      {invented && (
        <div style={{ marginTop: 6 }}>
          <strong style={{ color: 'var(--status-critical)', fontWeight: 600 }}>Not in the API. </strong>
          {invented}
        </div>
      )}
    </div>
  )
}
