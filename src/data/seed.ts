/** Domain seed for the sample district. All invented. */

export const DISTRICT = {
  id: '4417',
  name: 'Riverbend Unified School District',
  state: 'OR',
}

export const SCHOOLS = [
  { id: '9101', name: 'Cedar Grove Elementary', nces_school_id: '410297001385', level: 'Elementary', effect: 3 },
  { id: '9102', name: 'Willow Creek Elementary', nces_school_id: '410297001386', level: 'Elementary', effect: -5 },
  { id: '9103', name: 'Northpoint Elementary', nces_school_id: '410297001387', level: 'Elementary', effect: 1 },
] as const

export const TEACHERS = [
  { id: '5201', name: 'A. Okonkwo', school_id: '9101', effect: 6 },
  { id: '5202', name: 'D. Reyes', school_id: '9101', effect: -2 },
  { id: '5203', name: 'M. Thibodeaux', school_id: '9102', effect: 2 },
  { id: '5204', name: 'S. Whitfield', school_id: '9102', effect: -7 },
  { id: '5205', name: 'J. Nakamura', school_id: '9103', effect: 4 },
  { id: '5206', name: 'P. Adeyemi', school_id: '9103', effect: -3 },
] as const

export type Subject = 'Mathematics' | 'English Language Arts'

export const SUBJECTS: { id: string; name: Subject }[] = [
  { id: '11', name: 'Mathematics' },
  { id: '12', name: 'English Language Arts' },
]

/** CCSS grade 4. `base` is the district-wide difficulty signal. */
export const OBJECTIVES = [
  { id: '70101', code: '4.OA.A.1', subject: 'Mathematics', label: 'Interpret multiplication equations as comparisons', base: 74, priority: false },
  { id: '70102', code: '4.OA.A.2', subject: 'Mathematics', label: 'Multiply or divide to solve word problems', base: 66, priority: true },
  { id: '70103', code: '4.OA.A.3', subject: 'Mathematics', label: 'Solve multistep word problems with remainders', base: 48, priority: true },
  { id: '70104', code: '4.OA.B.4', subject: 'Mathematics', label: 'Factors, multiples, prime and composite', base: 71, priority: false },
  { id: '70105', code: '4.NBT.A.2', subject: 'Mathematics', label: 'Compare multi-digit numbers', base: 82, priority: false },
  { id: '70106', code: '4.NBT.B.4', subject: 'Mathematics', label: 'Add and subtract multi-digit whole numbers', base: 79, priority: true },
  { id: '70107', code: '4.NBT.B.5', subject: 'Mathematics', label: 'Multiply up to four digits by one digit', base: 63, priority: true },
  { id: '70108', code: '4.NBT.B.6', subject: 'Mathematics', label: 'Divide with remainders', base: 55, priority: true },
  { id: '70109', code: '4.NF.A.1', subject: 'Mathematics', label: 'Recognize equivalent fractions', base: 61, priority: true },
  { id: '70110', code: '4.NF.A.2', subject: 'Mathematics', label: 'Compare two fractions', base: 57, priority: false },
  { id: '70111', code: '4.NF.B.3', subject: 'Mathematics', label: 'Add and subtract fractions with like denominators', base: 44, priority: true },
  { id: '70112', code: '4.NF.C.6', subject: 'Mathematics', label: 'Use decimal notation for fractions', base: 52, priority: false },
  { id: '70113', code: '4.MD.A.2', subject: 'Mathematics', label: 'Solve measurement word problems', base: 59, priority: false },
  { id: '70114', code: '4.MD.C.5', subject: 'Mathematics', label: 'Recognize angles as geometric shapes', base: 76, priority: false },

  { id: '70201', code: 'RL.4.1', subject: 'English Language Arts', label: 'Refer to details when explaining a text', base: 72, priority: true },
  { id: '70202', code: 'RL.4.2', subject: 'English Language Arts', label: 'Determine theme and summarize', base: 58, priority: true },
  { id: '70203', code: 'RL.4.3', subject: 'English Language Arts', label: 'Describe a character in depth', base: 65, priority: false },
  { id: '70204', code: 'RI.4.2', subject: 'English Language Arts', label: 'Determine main idea and supporting details', base: 61, priority: true },
  { id: '70205', code: 'RI.4.5', subject: 'English Language Arts', label: 'Describe the structure of a text', base: 49, priority: false },
  { id: '70206', code: 'RI.4.8', subject: 'English Language Arts', label: 'Explain how reasons support points', base: 46, priority: true },
  { id: '70207', code: 'L.4.4', subject: 'English Language Arts', label: 'Determine meaning of unknown words', base: 68, priority: false },
  { id: '70208', code: 'W.4.1', subject: 'English Language Arts', label: 'Write opinion pieces with reasons', base: 54, priority: false },
] as const

/** Trackers / classrooms. In Mastery a tracker is the class gradebook. */
export const CLASSROOMS = [
  { id: '31001', title: 'Grade 4 Math — Okonkwo', teacher_id: '5201', school_id: '9101', subject: 'Mathematics' },
  { id: '31002', title: 'Grade 4 ELA — Okonkwo', teacher_id: '5201', school_id: '9101', subject: 'English Language Arts' },
  { id: '31003', title: 'Grade 4 Math — Reyes', teacher_id: '5202', school_id: '9101', subject: 'Mathematics' },
  { id: '31004', title: 'Grade 4 ELA — Reyes', teacher_id: '5202', school_id: '9101', subject: 'English Language Arts' },
  { id: '31005', title: 'Grade 4 Math — Thibodeaux', teacher_id: '5203', school_id: '9102', subject: 'Mathematics' },
  { id: '31006', title: 'Grade 4 ELA — Thibodeaux', teacher_id: '5203', school_id: '9102', subject: 'English Language Arts' },
  { id: '31007', title: 'Grade 4 Math — Whitfield', teacher_id: '5204', school_id: '9102', subject: 'Mathematics' },
  { id: '31008', title: 'Grade 4 ELA — Whitfield', teacher_id: '5204', school_id: '9102', subject: 'English Language Arts' },
  { id: '31009', title: 'Grade 4 Math — Nakamura', teacher_id: '5205', school_id: '9103', subject: 'Mathematics' },
  { id: '31010', title: 'Grade 4 ELA — Nakamura', teacher_id: '5205', school_id: '9103', subject: 'English Language Arts' },
  { id: '31011', title: 'Grade 4 Math — Adeyemi', teacher_id: '5206', school_id: '9103', subject: 'Mathematics' },
  { id: '31012', title: 'Grade 4 ELA — Adeyemi', teacher_id: '5206', school_id: '9103', subject: 'English Language Arts' },
] as const

/** Standards a curriculum map plans for the year, by subject. */
export const CURRICULUM_MAPS = [
  {
    id: '2201',
    name: 'Grade 4 Mathematics — Year Map',
    subject: 'Mathematics' as Subject,
    privacy_level: 2,
    planned: ['70101','70102','70103','70104','70105','70106','70107','70108','70109','70110','70111','70112','70113','70114'],
  },
  {
    id: '2202',
    name: 'Grade 4 ELA — Year Map',
    subject: 'English Language Arts' as Subject,
    privacy_level: 2,
    planned: ['70201','70202','70203','70204','70205','70206','70207','70208'],
  },
]

export const ITEM_TYPES = ['Multiple choice', 'Multi-select', 'Constructed response', 'Technology enhanced'] as const

/** Diverging scale centred on the 75% mastery cut. Ordered high to low. */
export const MASTERY_BANDS = [
  { key: 'exceeds', label: 'Exceeds', min: 90, fill: 'var(--band-exceeds)', ink: 'var(--band-ink-exceeds)' },
  { key: 'mastery', label: 'Mastery', min: 75, fill: 'var(--band-mastery)', ink: 'var(--band-ink-mastery)' },
  { key: 'near', label: 'Near mastery', min: 60, fill: 'var(--band-near)', ink: 'var(--band-ink-near)' },
  { key: 'remediate', label: 'Remediate', min: 0, fill: 'var(--band-remediate)', ink: 'var(--band-ink-remediate)' },
] as const

export type MasteryBand = (typeof MASTERY_BANDS)[number]

export function bandFor(score: number): MasteryBand {
  return MASTERY_BANDS.find((b) => score >= b.min) ?? MASTERY_BANDS[3]
}
