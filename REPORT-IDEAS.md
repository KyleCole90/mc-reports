# Mastery report ideas.

Source: `MasteryConnect REST API v2` (`mc-openapi.yaml`, pulled September 21, 2026).
Read-only, district-scoped, OAuth 2.0 client credentials.

## What the API actually exposes.

Structure and metadata are rich. Performance data is thin.

| Entity | Useful fields |
|---|---|
| `districts`, `districts/{id}/schools` | district and school records, `nces_school_id` |
| `teachers`, `sections`, `classrooms` | filter by `school_id`, `teacher_id`, `archived` |
| `classrooms/{id}/objectives`, `class_objectives` | standards attached to a class, `class_objective_type`, `available` |
| `trackers/{id}/assessments` | tree of tracker → standards → assessments → items, with `subject`, `teacher`, `school`, `archived` |
| `materials`, `materials/{id}/items` | `title`, `total_score`, `draft`, `available`, `privacy_level`, `subject`, `objective`, `teacher`, `created_at`, `updated_at` |
| `banks`, `banks/{id}/questions`, `banks/{id}/passages` | `bank_type`, `name` |
| `curriculum_maps/{id}/objectives`, `/materials` | planned standards and resources per map |
| `reports/item_analysis` | `question_number`, `item_title`, `standard`, `item_type`, `dok`, `points`, `percent_correct` — filtered by `classroom_id`, optional `assessment_id` |

**The gap:** there is no student endpoint and no student-level score anywhere in v2. The only
performance number is `percent_correct`, aggregated per item per classroom. No roster, no
demographics, no scores over time, no mastery levels per student.

That splits the ideas into two tiers.

## Tier one: reports this API can genuinely power.

### 1. Standards mastery heat map.
Classrooms down the rows, standards across the columns, cell color from average `percent_correct`.
Roll up to school and subject. Answers "which standards are we failing district-wide, and is it
everywhere or just three classrooms?"
Data: `reports/item_analysis` + `classrooms` + `classrooms/{id}/objectives`.

### 2. Assessment item health.
Flags items that look broken, not just hard. Very low `percent_correct` on a standard that's
strong elsewhere, items near 100% that carry real `points`, and point weight that doesn't match
difficulty. Gives assessment coordinators a fix list before the next window.
Data: `reports/item_analysis` + `materials/{id}/items`.

### 3. Rigor audit by depth of knowledge.
`dok` distribution across subjects, grades, and schools, plotted against `percent_correct`. Shows
districts that only ever assess DOK one and two, and where rigor rises without scores collapsing.
Data: `reports/item_analysis` + `materials`.

### 4. Curriculum map coverage gaps.
Standards planned in a curriculum map versus standards actually assessed in trackers. Two lists
that matter: planned but never assessed, and assessed but not in the map.
Data: `curriculum_maps/{id}/objectives` + `trackers/{id}/assessments` + `class_objectives`.

### 5. Assessment inventory and adoption.
Counts of `draft` versus `available` materials, staleness from `updated_at`, sharing behavior from
`privacy_level`, and build-versus-reuse patterns by school and teacher. This is the report a
district admin uses to justify the renewal.
Data: `materials` + `teachers` + `classrooms` + `districts/{id}/schools`.

### 6. Item bank utilization.
Which banks feed real assessments, which sit orphaned, and how often passages get reused.
Data: `banks` + `banks/{id}/questions` + `banks/{id}/passages` + `materials/{id}/items`.

## Tier two: needs data beyond v2.

These are the reports K12 leaders ask for first, and they all need student-level scores the API
doesn't return. Worth building as dummy data, but we'd flag the extra source needed (Canvas,
Data Access Platform, or a v2 expansion).

### 7. Student standards report card.
Per-student mastery level on every standard in a course, with a printable family-facing version.

### 8. Intervention watch list.
Students below mastery on priority standards, ranked by how many standards and how far below.
Feeds MTSS meetings directly.

### 9. Growth across assessment windows.
Fall, winter, and spring on the same standard, per student and per class, with movement between
mastery bands.

### 10. Subgroup gap analysis.
Mastery by standard split across student groups. Needs demographics, which v2 has none of.

## Build approach.

One static React app. All data lives in a fixture layer shaped exactly like the real API
responses, so swapping fixtures for live calls later is a config change, not a rewrite.
