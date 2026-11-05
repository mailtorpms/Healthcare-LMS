import { emCardiologyAssessment } from './clinicalAssessment.js'

/** Demo identities used by the role switcher. */
export const DEMO_IDENTITIES = {
  admin: 'u-001',
  course_admin: 'u-002',
  learner: 'u-101',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  course_admin: 'Course Admin',
  learner: 'Learner',
}

export const PROFESSIONS = ['Physician', 'Resident', 'Nurse', 'Nurse Practitioner', 'Pharmacist']

const users = [
  { id: 'u-001', name: 'Dr. Helena Marsh', email: 'h.marsh@stmarys.example', role: 'admin', profession: 'Physician', specialty: 'Medical Education', status: 'active' },
  { id: 'u-002', name: 'Dr. Samuel Osei', email: 's.osei@stmarys.example', role: 'course_admin', profession: 'Physician', specialty: 'Emergency Medicine', status: 'active' },
  { id: 'u-003', name: 'Rachel Kim, RN, MSN', email: 'r.kim@stmarys.example', role: 'course_admin', profession: 'Nurse', specialty: 'Critical Care Nursing', status: 'active' },
  { id: 'u-101', name: 'Dr. Priya Raman', email: 'p.raman@stmarys.example', role: 'learner', profession: 'Resident', specialty: 'Emergency Medicine (PGY-2)', status: 'active' },
  { id: 'u-102', name: 'Dr. Marcus Bell', email: 'm.bell@stmarys.example', role: 'learner', profession: 'Resident', specialty: 'Emergency Medicine (PGY-1)', status: 'active' },
  { id: 'u-103', name: 'Dr. Aisha Noor', email: 'a.noor@stmarys.example', role: 'learner', profession: 'Resident', specialty: 'Internal Medicine (PGY-2)', status: 'active' },
  { id: 'u-104', name: 'Tomás Rivera, RN', email: 't.rivera@stmarys.example', role: 'learner', profession: 'Nurse', specialty: 'Cardiac ICU', status: 'active' },
  { id: 'u-105', name: 'Grace Liu, RN', email: 'g.liu@stmarys.example', role: 'learner', profession: 'Nurse', specialty: 'Cardiac ICU', status: 'active' },
  { id: 'u-106', name: 'Daniel Okoro, NP', email: 'd.okoro@stmarys.example', role: 'learner', profession: 'Nurse Practitioner', specialty: 'Cardiology', status: 'active' },
  { id: 'u-107', name: 'Dr. Elena Petrova', email: 'e.petrova@stmarys.example', role: 'learner', profession: 'Physician', specialty: 'Hospital Medicine', status: 'active' },
  { id: 'u-108', name: 'Dr. James Whitfield', email: 'j.whitfield@stmarys.example', role: 'learner', profession: 'Physician', specialty: 'Hospital Medicine', status: 'suspended' },
  { id: 'u-109', name: 'Hannah Brooks, RN', email: 'h.brooks@stmarys.example', role: 'learner', profession: 'Nurse', specialty: 'Emergency Department', status: 'active' },
  { id: 'u-110', name: 'Dr. Kenji Watanabe', email: 'k.watanabe@stmarys.example', role: 'learner', profession: 'Resident', specialty: 'Emergency Medicine (PGY-3)', status: 'active' },
]

const cohorts = [
  { id: 'c-em-res', name: 'EM Residents 2026', description: 'PGY-1 to PGY-3 emergency medicine residents', specialty: 'Emergency Medicine', memberIds: ['u-101', 'u-102', 'u-110', 'u-103'], createdBy: 'u-002', createdAt: '2026-07-01T09:00:00Z' },
  { id: 'c-cicu', name: 'Cardiac ICU Nursing', description: 'CICU and step-down nursing staff', specialty: 'Cardiology', memberIds: ['u-104', 'u-105', 'u-106', 'u-109'], createdBy: 'u-003', createdAt: '2026-07-15T14:30:00Z' },
  { id: 'c-hosp', name: 'Hospitalist Group', description: 'Attending hospitalists – annual competency', specialty: 'Hospital Medicine', memberIds: ['u-107', 'u-108'], createdBy: 'u-002', createdAt: '2026-08-02T11:15:00Z' },
]

const courses = [
  {
    id: 'crs-acs',
    title: 'Acute Coronary Syndromes & ACLS Essentials',
    specialty: 'Emergency Medicine / Cardiology',
    description: 'STEMI recognition, reperfusion strategy, fibrinolytic eligibility and ACLS pharmacology.',
    cmeCredits: 4,
    cohortIds: ['c-em-res', 'c-cicu'],
    assessmentId: 'asm-em-cardio',
    createdBy: 'u-002',
    modules: [
      { id: 'm-acs-1', title: 'ECG localisation of STEMI', durationMin: 25 },
      { id: 'm-acs-2', title: 'Reperfusion: PCI vs fibrinolysis', durationMin: 30 },
      { id: 'm-acs-3', title: 'ACLS algorithms for shockable rhythms', durationMin: 35 },
      { id: 'm-acs-4', title: 'Tachyarrhythmia pharmacology', durationMin: 20 },
    ],
  },
  {
    id: 'crs-sepsis',
    title: 'Sepsis Recognition & the Hour-1 Bundle',
    specialty: 'Emergency / Critical Care',
    description: 'Early identification, lactate-guided resuscitation, cultures and timely antimicrobials.',
    cmeCredits: 2.5,
    cohortIds: ['c-em-res', 'c-hosp', 'c-cicu'],
    assessmentId: null,
    createdBy: 'u-003',
    modules: [
      { id: 'm-sep-1', title: 'Screening tools and qSOFA limitations', durationMin: 20 },
      { id: 'm-sep-2', title: 'Fluid resuscitation and vasopressors', durationMin: 25 },
      { id: 'm-sep-3', title: 'Antimicrobial stewardship in sepsis', durationMin: 20 },
    ],
  },
  {
    id: 'crs-ecg',
    title: '12-Lead ECG Interpretation Bootcamp',
    specialty: 'Cardiology',
    description: 'Systematic ECG reading, STEMI equivalents, and high-risk patterns.',
    cmeCredits: 3,
    cohortIds: ['c-em-res'],
    assessmentId: null,
    createdBy: 'u-002',
    modules: [
      { id: 'm-ecg-1', title: 'A systematic approach', durationMin: 30 },
      { id: 'm-ecg-2', title: 'STEMI equivalents (Wellens, de Winter, posterior MI)', durationMin: 30 },
    ],
  },
  {
    id: 'crs-stroke',
    title: 'Acute Stroke: Door-to-Needle',
    specialty: 'Neurology / Emergency',
    description: 'Stroke alert workflow, NIHSS, thrombolysis eligibility and thrombectomy referral.',
    cmeCredits: 3,
    cohortIds: ['c-hosp'],
    assessmentId: null,
    createdBy: 'u-003',
    modules: [
      { id: 'm-str-1', title: 'Stroke alert & NIHSS', durationMin: 25 },
      { id: 'm-str-2', title: 'Thrombolysis eligibility', durationMin: 25 },
    ],
  },
]

/** progress[userId][courseId] = completed module ids */
const progress = {
  'u-101': { 'crs-acs': ['m-acs-1', 'm-acs-2'], 'crs-sepsis': ['m-sep-1', 'm-sep-2', 'm-sep-3'] },
  'u-102': { 'crs-acs': ['m-acs-1', 'm-acs-2', 'm-acs-3', 'm-acs-4'], 'crs-ecg': ['m-ecg-1'] },
  'u-103': { 'crs-acs': ['m-acs-1'] },
  'u-104': { 'crs-acs': ['m-acs-1', 'm-acs-2', 'm-acs-3', 'm-acs-4'], 'crs-sepsis': ['m-sep-1'] },
  'u-105': { 'crs-acs': ['m-acs-1', 'm-acs-2', 'm-acs-3'] },
  'u-106': { 'crs-acs': ['m-acs-1', 'm-acs-2', 'm-acs-3', 'm-acs-4'], 'crs-sepsis': ['m-sep-1', 'm-sep-2', 'm-sep-3'] },
  'u-107': { 'crs-stroke': ['m-str-1', 'm-str-2'], 'crs-sepsis': ['m-sep-1', 'm-sep-2'] },
  'u-110': { 'crs-acs': ['m-acs-1', 'm-acs-2', 'm-acs-3', 'm-acs-4'], 'crs-ecg': ['m-ecg-1', 'm-ecg-2'] },
}

const attempts = [
  { id: 'att-1', userId: 'u-102', assessmentId: 'asm-em-cardio', score: 72, passed: false, submittedAt: '2026-10-02T15:12:00Z' },
  { id: 'att-2', userId: 'u-102', assessmentId: 'asm-em-cardio', score: 88, passed: true, submittedAt: '2026-10-09T10:40:00Z' },
  { id: 'att-3', userId: 'u-104', assessmentId: 'asm-em-cardio', score: 92, passed: true, submittedAt: '2026-10-11T19:03:00Z' },
  { id: 'att-4', userId: 'u-106', assessmentId: 'asm-em-cardio', score: 100, passed: true, submittedAt: '2026-10-14T08:22:00Z' },
  { id: 'att-5', userId: 'u-110', assessmentId: 'asm-em-cardio', score: 84, passed: true, submittedAt: '2026-10-20T13:55:00Z' },
  { id: 'att-6', userId: 'u-105', assessmentId: 'asm-em-cardio', score: 64, passed: false, submittedAt: '2026-10-27T21:10:00Z' },
]

const auditLog = [
  { id: 'log-1', at: '2026-07-01T09:00:00Z', actorId: 'u-002', action: 'cohort.created', target: 'EM Residents 2026' },
  { id: 'log-2', at: '2026-07-15T14:30:00Z', actorId: 'u-003', action: 'cohort.created', target: 'Cardiac ICU Nursing' },
  { id: 'log-3', at: '2026-08-02T11:15:00Z', actorId: 'u-002', action: 'cohort.created', target: 'Hospitalist Group' },
  { id: 'log-4', at: '2026-09-10T16:45:00Z', actorId: 'u-001', action: 'user.suspended', target: 'Dr. James Whitfield' },
]

/** Returns a fresh deep copy so "Reset demo data" never shares references. */
export function createSeedState() {
  return structuredClone({
    users,
    cohorts,
    courses,
    assessments: [emCardiologyAssessment],
    progress,
    attempts,
    auditLog,
    externalCmeCredits: { 'u-101': 14.5 },
  })
}

export const CME_ANNUAL_GOAL = 50
