# Mastery reports — sample data.

Four sample K12 reports built against the MasteryConnect REST API v2 OpenAPI spec.

**Every name and number in this site is invented.** No real district, school,
teacher, student, or score appears anywhere. The fixtures are shaped like real v2
responses (`data` / `attributes` / `relationships` / `meta` envelopes), so swapping
them for live calls is a config change rather than a rewrite.

Live: https://kylecole90.github.io/mc-reports/

## The four reports.

| Report | Backed by | Question it answers |
|---|---|---|
| Standards mastery heat map | `GET /api/v2/classrooms`, `/classrooms/{id}/objectives`, `/reports/item_analysis` | Which standards are weak, and is it one teacher or the whole district? |
| Assessment item health | `GET /api/v2/reports/item_analysis`, `/materials/{id}/items` | Which items are broken, not just hard? |
| Curriculum map coverage gaps | `GET /api/v2/curriculum_maps`, `/classrooms/{id}/objectives` | What did we plan to teach but never assess? |
| Student standards report card | **Not API-backed** | Where does one student stand on every standard? |

The report card is labeled MOCK throughout. MasteryConnect REST API v2 has no
student endpoint and returns no student-level score, so that report shows the
shape only. A real version joins two sources: per-student results and the roster
from Canvas Data through the Data Access Platform, and the standards and tracker
structure from the MasteryConnect API.

## Run it locally.

```
npm install
npm run dev
```

## Design.

Colors come from a validated palette. The heat map and report card use a
**diverging** ramp centered on the 75% mastery cut, because the reader's job is
polarity, not magnitude. Coverage states use the reserved status palette with an
icon on every segment. Both modes were validated against their own surface, and
dark mode has its own steps rather than a flipped light ramp.
