# ClinicalEd: Healthcare LMS

An interactive learning management system for physicians, residents, and nurses. Built with **Vite + React 19**, **Tailwind CSS 3**, and **lucide-react**. It ships with a Supabase PostgreSQL schema that uses Row-Level Security.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run lint
```

Demo state is kept in `localStorage`. Use **Reset demo** in the top banner to restore the seed data.

## Roles (switch them in the top banner)

| Role | What you can do |
| --- | --- |
| **Admin** | See global KPIs (learners, average score, pass rate) and a cohort performance table. Change user roles and suspend or reactivate accounts. Review group audit summaries with compliance flags, plus the audit log. |
| **Course Admin** | Create cohorts in a modal. Assign learners and courses to cohorts. Build courses (modules, CME credits, target cohorts). Author and publish assessments with all 3 question types, with a preview. |
| **Learner** | See assigned courses with module checklists and progress bars, a CME credit tracker toward the annual goal, a quiz launcher, and attempt history. |

## Clinical assessment engine

`src/components/assessment/` runs the **EM / Cardiology: ACS & Resuscitation** assessment. The pass threshold is 80%.

1. **Single best answer** (radio): inferior STEMI with RV infarction; avoiding nitrates in RV infarction.
2. **Multiple response** (checkboxes): absolute contraindications to fibrinolysis. Each question uses either `partial` scoring (wrong picks cancel right picks, floored at 0) or `all_or_nothing` scoring.
3. **Dosage protocol** (drag-and-drop **or** click-a-token-then-click-a-blank): ACLS VF/pVT epinephrine and amiodarone dosing, and adenosine for SVT. Each blank earns partial credit.

After submission you see the score, PASS or NOT YET PASSED, a per-question review (correct, partial, or incorrect), clinical rationales, and guideline citations (ACC/AHA STEMI & ACS, AHA ACLS, ACC/AHA/HRS SVT).

Scoring logic is pure and lives in `src/lib/scoring.js`. The same algorithm is mirrored server-side in `submit_quiz_attempt()`.

## Project layout

```
src/
  App.jsx                     role routing + assessment runner
  data/                       seed data + clinical question bank
  lib/                        scoring, stats, state actions, formatting
  hooks/usePersistentState.js
  components/
    ui/                       Card, Badge, Modal, ProgressBar, StatCard, …
    layout/                   RoleBanner, PageHeader
    admin/                    AdminDashboard, CohortPerformanceTable, UserManagement, GroupAudit
    course-admin/             CourseAdminDashboard, CohortModal, CohortAssignment, CourseBuilder, AssessmentBuilder
    learner/                  LearnerDashboard, CourseCard, CmeTracker
    assessment/               AssessmentRunner, question renderers, AssessmentResults
supabase/schema.sql           PostgreSQL schema + RLS
```

## Database (`supabase/schema.sql`)

Tables: `profiles`, `cohorts`, `cohort_members`, `courses`, `course_cohorts`, `modules`, `module_progress`, `questions` (with a JSONB `payload` checked by a shape constraint per question type), and `quiz_attempts`.

- RLS is enabled on every table. Helper functions (`is_admin`, `is_staff`, `manages_cohort`, `can_access_course`, `manages_learner`) are `SECURITY DEFINER` to avoid recursive policies.
- Answer keys stay hidden from learners. Learners query `questions_public`, which strips `correctId` / `correctIds` / `answers`. Only staff can read the base `questions` table.
- `submit_quiz_attempt(attempt_id, responses)` scores attempts on the server, so clients can't forge `score` or `passed`.
- A trigger stops non-admins from changing their own `role` or `status` through the API.
- `cohort_performance` is a reporting view that respects the caller's RLS.
- The script is idempotent, so it is safe to re-run.

> Educational content only. It is not a substitute for clinical judgement or current institutional protocols.
