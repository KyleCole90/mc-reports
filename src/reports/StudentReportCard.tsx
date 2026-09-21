import { useMemo, useState } from 'react'
import { CLASSROOMS, MASTERY_BANDS, bandFor } from '../data/seed'
import { objectiveById, classroomById, teacherById, schoolById, standardScore } from '../data/api'
import { studentsFor, studentRecord } from '../data/students'
import { DISTRICT } from '../data/seed'
import { Legend, Select, SourceNote, Tooltip } from '../components/ui'

export function StudentReportCard() {
  const [classroomId, setClassroomId] = useState<string>('31001')
  const roster = useMemo(() => studentsFor(classroomId), [classroomId])
  const [studentId, setStudentId] = useState<string>(roster[0].id)

  const student = roster.find((s) => s.id === studentId) ?? roster[0]
  const record = useMemo(() => studentRecord(student), [student])

  const classroom = classroomById(classroomId)
  const teacher = teacherById(classroom.teacher_id)
  const school = schoolById(classroom.school_id)
  const band = bandFor(record.overall)

  const sorted = useMemo(
    () => [...record.scores].sort((a, b) => a.score - b.score),
    [record]
  )
  const needsWork = sorted.filter((s) => s.score < 75)

  function onClassChange(id: string) {
    setClassroomId(id)
    setStudentId(studentsFor(id)[0].id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <header>
        <h1>Student standards report card.</h1>
        <p className="secondary" style={{ margin: '6px 0 0', fontSize: 13.5, maxWidth: 680, lineHeight: 1.55 }}>
          Where does one student stand on every standard the class has assessed? Built to hand to a
          family or bring to an intervention meeting.
        </p>
      </header>

      <div
        className="card"
        style={{ borderLeft: '3px solid var(--status-critical)', padding: '14px 16px' }}
      >
        <h3 style={{ fontSize: 13, marginBottom: 5, color: 'var(--status-critical)' }}>
          Every name and number below is invented.
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: 760 }}>
          No single source can build this report. MasteryConnect REST API v2 carries the standards,
          the trackers, and item-level percent correct, but it has no student endpoint and returns no
          student-level score. The real version joins two sources: per-student results and the roster
          from Canvas Data through the Data Access Platform, and the standards and tracker structure
          from the MasteryConnect API. What you see below is the report shape, drawn on invented data.
          That is what the red Mock tag on this tab means.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }} className="no-print">
        <Select
          label="Tracker"
          value={classroomId}
          onChange={onClassChange}
          options={CLASSROOMS.map((c) => ({ value: c.id, label: c.title }))}
        />
        <Select
          label="Student"
          value={studentId}
          onChange={setStudentId}
          options={roster.map((s) => ({ value: s.id, label: s.name }))}
        />
        <button
          onClick={() => window.print()}
          style={{
            font: 'inherit', fontSize: 12.5, padding: '7px 14px', borderRadius: 7,
            border: '1px solid var(--border)', background: 'var(--surface-1)',
            color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          Print
        </button>
      </div>

      {/* The card itself */}
      <div className="card report-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--baseline)', display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
              {DISTRICT.name}
            </div>
            <h2 style={{ fontSize: 20 }}>{student.name}</h2>
            <div className="secondary" style={{ fontSize: 12.5, marginTop: 4 }}>
              {classroom.title} · {teacher.name} · {school.name}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
              Overall
            </div>
            <div style={{ fontSize: 44, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.025em' }}>
              {record.overall}<span style={{ fontSize: 20, color: 'var(--text-secondary)' }}>%</span>
            </div>
            <div
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
                background: band.fill, color: band.ink,
                padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600,
              }}
            >
              {band.label}
            </div>
          </div>
        </div>

        {needsWork.length > 0 && (
          <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--grid)', background: 'color-mix(in srgb, var(--band-remediate) 7%, transparent)' }}>
            <h3 style={{ fontSize: 12.5, marginBottom: 5 }}>Focus next.</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {needsWork.length} of {record.scores.length} standards sit below the 75% mastery cut. Start
              with{' '}
              {needsWork.slice(0, 3).map((s, i, arr) => (
                <span key={s.objective_id}>
                  <strong style={{ color: 'var(--text-primary)' }}>{objectiveById(s.objective_id).code}</strong> ({s.score}%)
                  {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ', and ' : ''}
                </span>
              ))}
              .
            </p>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Standard</th>
              <th>Description</th>
              <th className="col-student" style={{ width: 210 }}>Student</th>
              <th style={{ textAlign: 'right' }}>Class avg</th>
              <th>Band</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s) => {
              const o = objectiveById(s.objective_id)
              const b = bandFor(s.score)
              const classAvg = standardScore(classroomId, s.objective_id)
              const delta = s.score - classAvg
              return (
                <tr key={s.objective_id}>
                  <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {o.code}
                    {o.priority && <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}> · priority</span>}
                  </td>
                  <td className="secondary" style={{ fontSize: 12.5 }}>{o.label}</td>
                  <td>
                    <Tooltip
                      content={<>{s.score}% · {b.label} · class average {classAvg}%</>}
                      label={`${o.code}: ${s.score}%, ${b.label}, class average ${classAvg}%`}
                      style={{ display: 'flex', width: '100%' }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: '100%' }}>
                        <span
                          aria-hidden
                          style={{
                            position: 'relative', flex: 1, height: 10, minWidth: 90,
                            background: 'var(--grid)', borderRadius: 5, overflow: 'hidden', cursor: 'default',
                          }}
                        >
                          <span style={{ position: 'absolute', inset: '0 auto 0 0', width: `${s.score}%`, background: b.fill, borderRadius: 5 }} />
                          {/* mastery cut marker - must read on the bare track and on any fill */}
                          <span style={{ position: 'absolute', left: '75%', top: -1, bottom: -1, width: 2, background: 'var(--text-primary)', opacity: 0.55 }} />
                        </span>
                        <span className="tnum" style={{ fontSize: 12.5, fontWeight: 600, minWidth: 34, textAlign: 'right' }}>{s.score}%</span>
                      </span>
                    </Tooltip>
                  </td>
                  <td className="tnum" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {classAvg}%
                    <span style={{ fontSize: 11, marginLeft: 6, color: delta === 0 ? 'var(--text-muted)' : delta > 0 ? 'var(--status-good)' : 'var(--band-remediate)' }}>
                      {delta === 0 ? '±0' : `${delta > 0 ? '+' : '\u2212'}${Math.abs(delta)}`}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
                      <span aria-hidden style={{ width: 11, height: 11, borderRadius: 3, background: b.fill, boxShadow: 'inset 0 0 0 1px var(--border)' }} />
                      {b.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--baseline)', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Legend title="Mastery band" items={MASTERY_BANDS.map((b) => ({ label: b.label, fill: b.fill }))} />
          <span className="muted" style={{ fontSize: 11 }}>
            The vertical line marks the 75% mastery cut. Sample data.
          </span>
        </div>
      </div>

      <SourceNote
        endpoints={['GET /api/v2/classrooms', 'GET /api/v2/classrooms/{id}/objectives']}
        invented="Student names, per-student scores, and the class roster. These come from Canvas Data through the Data Access Platform, joined to the API on classroom and student."
      />
    </div>
  )
}
