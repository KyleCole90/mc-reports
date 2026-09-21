import { useEffect, useState } from 'react'
import { MasteryHeatMap } from './reports/MasteryHeatMap'
import { ItemHealth } from './reports/ItemHealth'
import { CoverageGaps } from './reports/CoverageGaps'
import { StudentReportCard } from './reports/StudentReportCard'
import { DISTRICT } from './data/seed'

const REPORTS = [
  { id: 'heatmap', label: 'Standards mastery', backed: true, Component: MasteryHeatMap },
  { id: 'items', label: 'Item health', backed: true, Component: ItemHealth },
  { id: 'coverage', label: 'Coverage gaps', backed: true, Component: CoverageGaps },
  { id: 'card', label: 'Student report card', backed: false, Component: StudentReportCard },
] as const

type ReportId = (typeof REPORTS)[number]['id']

function readHash(): ReportId {
  const h = window.location.hash.replace('#', '')
  return REPORTS.some((r) => r.id === h) ? (h as ReportId) : 'heatmap'
}

export function App() {
  const [active, setActive] = useState<ReportId>(readHash)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const onHash = () => setActive(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const Current = REPORTS.find((r) => r.id === active)!.Component

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sample-data banner */}
      <div
        className="no-print"
        style={{
          background: 'var(--status-warning)', color: '#0b0b0b',
          padding: '7px 20px', fontSize: 12.5, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', textAlign: 'center',
        }}
      >
        <span aria-hidden>&#9888;</span>
        Sample data. Not a shipping feature, and not a real district — every name and number here is invented.
      </div>

      <header
        className="no-print"
        style={{
          borderBottom: '1px solid var(--border)', background: 'var(--surface-1)',
          padding: '14px 20px 0',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>Mastery reports</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {DISTRICT.name} · built on MasteryConnect REST API v2
              </div>
            </div>
            <button
              onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle colour theme"
              style={{
                font: 'inherit', fontSize: 12, padding: '5px 11px', borderRadius: 7,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-secondary)', cursor: 'pointer',
              }}
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
          </div>

          <nav style={{ display: 'flex', gap: 2, marginTop: 14, flexWrap: 'wrap' }}>
            {REPORTS.map((r) => {
              const on = r.id === active
              return (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  style={{
                    padding: '9px 13px', fontSize: 13, textDecoration: 'none',
                    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: on ? 600 : 400,
                    borderBottom: `2px solid ${on ? 'var(--series-1)' : 'transparent'}`,
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                  }}
                >
                  {r.label}
                  {!r.backed && (
                    <span
                      title="Not backed by the API"
                      style={{
                        fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.04em', padding: '2px 5px', borderRadius: 3,
                        background: 'var(--status-critical)', color: '#fff',
                      }}
                    >
                      Mock
                    </span>
                  )}
                </a>
              )
            })}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '24px 20px 56px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <Current />
        </div>
      </main>

      <footer
        className="no-print"
        style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', fontSize: 11.5, color: 'var(--text-muted)' }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', lineHeight: 1.6 }}>
          Sample reports built against the MasteryConnect REST API v2 OpenAPI spec. Fixtures are shaped
          like real API responses, so swapping them for live calls is a config change. No real student
          data appears anywhere in this site.
        </div>
      </footer>
    </div>
  )
}
