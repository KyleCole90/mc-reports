import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/* ---------- Hover tooltip ---------- */

export function Tooltip({ content, children, label, style }: {
  content: ReactNode
  children: ReactNode
  /** When set, the wrapper is keyboard-focusable and announces this text. */
  label?: string
  style?: CSSProperties
}) {
  const [open, setOpen] = useState(false)
  return (
    <span
      className="tip"
      tabIndex={label ? 0 : undefined}
      aria-label={label}
      style={{ position: 'relative', display: 'inline-flex', flexShrink: 0, ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
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

/* ---------- Method badge: how a number is calculated, and which endpoints feed it ---------- */

export interface Method {
  /** Plain-language steps, one per line. */
  steps: string[]
  /** API calls that feed the number. */
  endpoints: string[]
  /** Set when part of the input is not in the API. */
  invented?: string
  /** Set when the sample fixture takes a shortcut a live build would not. */
  sample?: string
}

const POPOVER_WIDTH = 340
const POPOVER_GAP = 6
const VIEWPORT_MARGIN = 8

const SECTION_LABEL: CSSProperties = {
  fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: 4,
}

export function MethodBadge({ method, title }: { method: Method; title: string }) {
  /* Hover or focus shows the popover. Click pins it until the next click, an outside click, blur, or Escape. */
  const [pinned, setPinned] = useState(false)
  const [hover, setHover] = useState(false)
  const [box, setBox] = useState<{ top: number; left: number; width: number; maxHeight?: number }>({ top: 0, left: 0, width: POPOVER_WIDTH })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const leaveTimer = useRef<number | undefined>(undefined)
  const popoverId = useId()
  const open = pinned || hover

  function closeAll() {
    setPinned(false)
    setHover(false)
  }

  /* A short grace period so the pointer can cross the gap into the popover. */
  function enter() {
    window.clearTimeout(leaveTimer.current)
    setHover(true)
  }
  function leave() {
    window.clearTimeout(leaveTimer.current)
    leaveTimer.current = window.setTimeout(() => setHover(false), 180)
  }

  useLayoutEffect(() => {
    if (!open) return

    function place() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
      /* Natural height, ignoring any max-height already applied. The 2 is the top and bottom border. */
      const height = popoverRef.current ? popoverRef.current.scrollHeight + 2 : 0
      const below = rect.bottom + POPOVER_GAP
      const roomBelow = window.innerHeight - VIEWPORT_MARGIN - below
      const roomAbove = rect.top - POPOVER_GAP - VIEWPORT_MARGIN
      let top = below
      let maxHeight = roomBelow
      if (height > roomBelow && roomAbove > roomBelow) {
        /* Above the badge when there is more room there. It scrolls rather than cover the badge. */
        maxHeight = roomAbove
        top = rect.top - POPOVER_GAP - Math.min(height, roomAbove)
      }
      const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN))
      setBox({ top, left, width, maxHeight })
    }

    place()
    const onMouseDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.method-popover, .method-badge')) closeAll()
    }
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    /* Layout shifts elsewhere on the page move the badge, so follow it. */
    const observer = new ResizeObserver(place)
    observer.observe(document.body)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      observer.disconnect()
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(leaveTimer.current), [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="method-badge no-print"
        aria-label={`How ${title} is calculated`}
        aria-describedby={open ? popoverId : undefined}
        onClick={() => (pinned ? closeAll() : setPinned(true))}
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={closeAll}
        style={{
          font: 'inherit', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 3, cursor: 'help',
          border: '1px solid var(--border)', background: 'transparent',
          color: open ? 'var(--text-primary)' : 'var(--text-muted)',
          display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 1.4, flexShrink: 0,
        }}
      >
        <span aria-hidden style={{ fontSize: 10 }}>&#8505;</span>
        Method
      </button>
      {open && createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          className="method-popover"
          onMouseEnter={enter}
          onMouseLeave={leave}
          /* Keep focus on the badge so a click inside does not blur it closed. */
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: 'fixed', top: box.top, left: box.left, width: box.width, zIndex: 50,
            background: 'var(--surface-1)', color: 'var(--text-primary)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontSize: 12, lineHeight: 1.5, textAlign: 'left',
            maxHeight: box.maxHeight, overflowY: 'auto',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
          <div style={SECTION_LABEL}>Calculation</div>
          <ol style={{ margin: '0 0 10px', paddingLeft: 18, color: 'var(--text-secondary)' }}>
            {method.steps.map((step, i) => <li key={i} style={{ marginBottom: 2 }}>{step}</li>)}
          </ol>
          <div style={SECTION_LABEL}>Endpoints</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {method.endpoints.map((e) => (
              <code key={e} style={{ fontSize: 11, background: 'var(--grid)', padding: '2px 6px', borderRadius: 4, wordBreak: 'break-all', alignSelf: 'flex-start' }}>{e}</code>
            ))}
          </div>
          {method.sample && (
            <div style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--status-warning)', fontWeight: 600 }}>Sample data. </strong>
              {method.sample}
            </div>
          )}
          {method.invented && (
            <div style={{ marginTop: 10, color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--status-critical)', fontWeight: 600 }}>Not in the API. </strong>
              {method.invented}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

/* ---------- Heading row with a method badge on the right ---------- */

export function MethodHeading({ method, title, children }: { method: Method; title: string; children?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: children ? 'space-between' : 'flex-end', alignItems: 'center', gap: 10 }}>
      {children}
      <MethodBadge method={method} title={title} />
    </div>
  )
}

/* ---------- Stat tile ---------- */

export function StatTile({ label, value, unit, note, method }: {
  label: string; value: string | number; unit?: string; note?: string; method?: Method
}) {
  return (
    <div className="card" style={{ padding: '14px 16px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
          {label}
        </div>
        {method && <MethodBadge method={method} title={label} />}
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
