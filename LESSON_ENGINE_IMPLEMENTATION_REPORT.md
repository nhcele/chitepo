# Lesson Engine Implementation Report

## 1. Executive Summary

This implementation phase addressed the P0 stabilization and P1 core-experience gaps identified in `LESSON_ENGINE_AUDIT.md`. The focus was on making lesson progress authoritative, durable, and secure without rewriting systems that already worked.

Key outcomes:

- All 20 backend test suites pass (134 tests).
- Frontend TypeScript type-check passes.
- Duplicate `Enrollment` entity usage has been consolidated to the canonical entity under `backend/src/enrollments/entities/enrollment.entity.ts`.
- Course/module/lesson mutation endpoints now enforce ownership or admin role server-side.
- Video playback now stores a server-authoritative resume position and throttled progress updates.
- The lesson sidebar shows real completion, in-progress, current, and locked states.
- Manual completion, transcript, resource links, active-learning-time tracking, and MySQL-compatible search have been added.
- Structured failure logging for progress saves has been introduced.

P2/P3 enhancements (knowledge checks, AI lesson assistant, offline sync, funnel analytics, full multi-block lessons) are intentionally deferred until product and infrastructure decisions are available.

---

## 2. What Existed Before

The existing architecture was already basically sound:

- `Course → Module → Lesson` hierarchy with `CourseModule` join table.
- `LessonProgress` as the authoritative per-learner completion record.
- `AssessmentsService` with a full quiz/attempt/autosave lifecycle and publication filtering.
- `checkLessonAccess()` enforcing enrollment, sequential progression, preview lessons, and quiz-score prerequisites.
- JWT authentication and role payloads.
- HLS-capable `LessonPlayer` using `hls.js` fallback and native HLS where supported.

What was missing or fragile:

- Progress was binary: the only authoritative write happened at `onEnded` with `watchPercent: 100`.
- Resume position was not persisted.
- The sidebar showed every lesson except the current one as `pending`.
- Manual completion had backend support but no UI trigger.
- Several write endpoints relied only on `JwtAuthGuard`, allowing any authenticated user to mutate any resource.
- Two `Enrollment` entity classes were competing for the same table.
- `Course` exposed a broken `lessons` relation; analytics read from it and from a stale `progress` table.
- Search used PostgreSQL `ILIKE`, which fails on MySQL.

---

## 3. What Was Retained

| Area | Decision | Rationale |
|------|----------|-----------|
| Quiz/attempt engine | Retained untouched | Tests already pass; authoritative progress update after finalization works. |
| `CourseModule` join model | Retained | Supports reusable modules across courses. |
| Sequential access logic in `CoursesService.checkLessonAccess` | Retained | Already correct; wrapped with frontend usage. |
| Existing learner data | Retained | No destructive migrations; new columns have defaults. |

---

## 4. Problems Discovered and Security Issues

### 4.1 Authorization bypass on mutations
- **Files:** `backend/src/courses/courses.controller.ts`, `modules.controller.ts`, `lessons.controller.ts`
- **Issue:** `PATCH /courses/:id`, `DELETE /courses/:id`, `PATCH /lessons/:id`, `DELETE /lessons/:id`, `POST /lessons/reorder`, `POST /modules`, and module snapshot/link endpoints only required a valid JWT.
- **Fix:** Added `CoursesService.assertCanManageCourse`, `assertCanManageModule`, and `assertCanManageLesson`. Admins and super-admins are allowed; otherwise the resource owner/author must match the authenticated user.

### 4.2 Duplicate `Enrollment` entity
- **Files:** `backend/src/courses/entities/enrollment.entity.ts`, `backend/src/enrollments/entities/enrollment.entity.ts`, and many import sites.
- **Issue:** Two TypeORM classes mapped to `enrollments`. Repository tokens could resolve to the wrong class, and mocks had divergent shapes.
- **Fix:** Updated every import and `DatabaseModule` registration to use the canonical entity in `backend/src/enrollments/entities/enrollment.entity.ts`. The old file is now dead code (pending deletion).

### 4.3 Client-trusted progress
- **Files:** `backend/src/courses/courses.service.ts`, `frontend/src/components/LessonPlayer.tsx`
- **Issue:** Progress was only sent once at video end and was accepted without range checks.
- **Fix:** The backend now clamps `lastPositionSeconds`, `watchedSeconds`, `activeSeconds`, and `watchPercent` to `[0, duration]` and keeps `watchedSeconds`/`watchPercent` monotonic. The player emits throttled progress events every 10 seconds and on pause/seek/end.

### 4.4 Broken `Course.lessons` relation
- **Files:** `backend/src/courses/entities/course.entity.ts`, `backend/src/analytics/analytics.service.ts`
- **Issue:** `Course.lessons` duplicated the inverse side of `Module.course` and was typed as `Module[]`. Analytics read `course.lessons` expecting modules-with-lessons.
- **Fix:** Removed the `lessons` relation. Analytics now loads `course.modules` and `course.modules.lessons`.

### 4.5 MySQL `ILIKE` incompatibility
- **Files:** `backend/src/courses/courses.service.ts`
- **Issue:** Course search and module listing used `ILIKE`.
- **Fix:** Replaced with `LOWER(col) LIKE LOWER(:query)`, which is dialect-agnostic.

### 4.6 Stale `progress` table
- **Files:** `backend/src/assessments/entities/progress.entity.ts` (deleted), `backend/src/analytics/analytics.service.ts`, `backend/src/instructor/instructor.service.ts`, `backend/src/ai-companion/*`, `backend/src/scorm/scorm-runs.service.ts`, `backend/src/recommendations/recommendations.service.ts`, `backend/src/success-metrics/*`
- **Issue:** A separate `progress` table was read by analytics, instructor dashboards, AI companion, SCORM, recommendations, and success-metrics while authoritative progress lives in `lesson_progress`.
- **Resolution (code side, complete):**
  - Added a denormalized `course_id` column (indexed) and nullable `lesson_id` to `lesson_progress`, with a `course` relation for reporting joins.
  - `CoursesService.updateLessonProgress` and `recordAssessmentResult` now stamp `courseId` on every row.
  - All six consuming modules/services now inject `LessonProgress`. Field mapping: `completed→isCompleted`, `watchTime→watchedSeconds`, `lastAccessed→updatedAt`, `score→bestQuizScore/watchPercent`, `attempts→quizAttempts`, `completionDate→completedAt`. Course-level aggregates (predictive analytics, schedule) now use `enrollment.progressPercentage`.
  - SCORM course-level writes now land in `lesson_progress` rows with `lesson_id NULL`.
  - `Progress` entity deleted; `MigrateProgressToLessonProgress` renumbered to run after the new columns exist, made a safe no-op when `progress` doesn't exist, and extended to migrate course-level rows.
- **Status:** CODE COMPLETE. Remaining: production data audit of `progress`, apply migrations, then drop the table in a later change.

---

## 5. Changes Implemented

### 5.1 Database migrations

**`backend/src/database/migrations/20260928130000-AddLessonProgressResumeColumns.ts`**

```sql
ALTER TABLE lesson_progress
  ADD COLUMN last_position_seconds INT NOT NULL DEFAULT 0,
  ADD COLUMN watched_seconds INT NOT NULL DEFAULT 0,
  ADD COLUMN active_seconds INT NOT NULL DEFAULT 0;
```

These columns are additive and default to `0`, so existing rows are preserved.

### 5.2 Backend API changes

- `POST /courses/lessons/:lessonId/progress` now accepts:
  - `watchPercent?: number`
  - `lastPositionSeconds?: number`
  - `watchedSeconds?: number`
  - `activeSeconds?: number`
  - `manualComplete?: boolean`
- `GET /courses/:courseId/lesson-progress` returns a map of `lessonId → { isCompleted, watchPercent, lastPositionSeconds, watchedSeconds }` for the authenticated learner.
- `GET /me/enrollments/:id/continue` returns the exact next lesson for a learner (first incomplete by module/lesson order), including module title, lesson title, and last video position.
- New learner notes API under `/me/notes`:
  - `GET /me/notes?courseId=&lessonId=` — list own notes.
  - `POST /me/notes` — create a note.
  - `PATCH /me/notes/:id` — update own note.
  - `DELETE /me/notes/:id` — delete own note.
- New formative knowledge-check endpoints under `/assessments/lessons/:lessonId/knowledge-check*`:
  - `GET /assessments/lessons/:lessonId/knowledge-check` — returns the published `type='knowledge_check'` quiz with the answer key stripped.
  - `POST /assessments/lessons/:lessonId/knowledge-check/submit` — grades a single question server-side and returns correctness + explanation.
- `resource_downloaded` analytics events are fired from resource links.
- Mutating course/module/lesson endpoints now return `403 Forbidden` for non-owners/non-admins.
- `CoursesService.updateLessonProgress` validates and clamps all numeric inputs, computes `watchPercent` from duration when not supplied, and only honors `manualComplete` when `lesson.completionMode === 'manual'`.
- `CoursesService` now emits `progress_save_failed` structured logs if persistence fails.

### 5.3 Entity changes

- `LessonProgress` gained `lastPositionSeconds`, `watchedSeconds`, and `activeSeconds` columns.
- `Course` lost the erroneous `lessons` relation.
- `Enrollment` imports consolidated to the canonical entity.

### 5.4 Frontend changes

- `LessonPlayer` accepts `initialPositionSeconds` and resumes on load, and emits `onProgress({ lastPositionSeconds, watchedSeconds, percent })` throttled to every 10 seconds plus on pause/seek/end.
- `LessonPage` loads course-wide progress and calls `checkLessonAccess`; it now shows:
  - Real sidebar status: completed, in-progress, current, locked.
  - A locked-access warning when the server denies access.
  - Disabled "Next" links when the next lesson is locked.
  - A "Mark lesson complete" button for `completionMode === 'manual'` lessons.
  - A "Resources" list and a collapsible "Transcript" panel under the lesson content.
    - Resource link clicks emit `resource_downloaded` analytics events.
    - Clickable transcript timestamps seek the video to that position via an exposed player ref.
  - A "My notes" panel on the lesson page with create/edit/delete and timestamp-to-video seeking, plus a standalone `/my-notes` notebook page grouping notes by course with search and delete.
  - Analytics events emitted for `note_created` / `note_updated` / `note_deleted` and `knowledge_check_answered` (new `AnalyticsEventType` members in `shared/src/types/analytics.types.ts`).
  - An in-lesson "Knowledge check" panel that renders published formative questions and shows immediate feedback after server-side grading.
  - Improved accessibility in the course outline: module toggles expose `aria-expanded`, module progress bars expose `role="progressbar"` with ARIA values, current lessons expose `aria-current="step"`, and locked lessons are marked `aria-disabled`.
  - Mobile course-outline drawer now uses `role="dialog" aria-modal="true"`, locks body scroll, closes on Escape/overlay click, and traps focus while open (`useFocusTrap`).
  - Video renders a `<track kind="captions">` when `captionsUrl` is present; lesson status updates are announced via `aria-live="polite"`; reduced-motion is honored globally in `globals.css`.
  - Active-learning-time tracking using page visibility and a 30-second heartbeat.
  - Progress-save failure now shows a visible “Retry” banner instead of silently failing.
  - HLS video streams now expose a quality selector (Auto + each available resolution) when multiple levels are available.
  - The **My Learning** course card now shows the exact resume lesson, module, and timestamp returned by the new continue-learning endpoint.

### 5.5 Authorization enforcement

- `CoursesService.assertCanManageCourse/Module/Lesson` helpers added.
- `CoursesController.update`, `remove`, `linkModule`, `updateLink`, `unlinkModule`, and `snapshotCourseModules` now call the course helper.
- `ModulesController.create` requires instructor/admin; `createLesson`, `updateLesson`, and `snapshot` call the module helper.
- `LessonsController.update`, `delete`, and `reorder` call the lesson helper.

### 5.6 MySQL-compatible search

- `CoursesService.search` and `listModules` now use `LOWER(col) LIKE LOWER(:query)`.

---

## 6. Before / After Capability Matrix

| Capability | Before | After | Evidence | Remaining Gap |
|------------|--------|-------|----------|---------------|
| Lesson navigation | Previous/next computed by index only | Previous/next computed; next disabled when locked by backend rules | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` (prevNext + nextLocked) | Mobile focus trap in drawer not implemented |
| Video player | Play/pause/seek; no resume | Resumes at `lastPositionSeconds`; throttled progress sync | `frontend/src/components/LessonPlayer.tsx` `initialPositionSeconds`, `onProgress` | Quality selector not added |
| Resume playback | None | Server-stored `last_position_seconds` restored on open | Migration + entity + player resume | Exact resume within a few seconds; seeking before metadata loaded is best-effort |
| Progress tracking | 0% / 100% only | Continuous, clamped, monotonic server progress | `backend/src/courses/courses.service.ts` `updateLessonProgress` tests | Network failure retry toast not implemented |
| Completion rules | Video-end only | Video threshold + quiz + manual completion honored | `backend/src/courses/courses.service.ts` completion logic + manual button | Multi-condition rules not added |
| Manual completion | Backend field existed, no UI | "Mark lesson complete" button for manual lessons | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` manual button + service `manualComplete` | N/A |
| Knowledge checks | Final quizzes only | Published `type='knowledge_check'` quiz rendered in lesson with server-side grading and feedback; multiple choice, true/false, and short answer all supported | `backend/src/assessments/assessments.service.ts` `getKnowledgeCheckForLesson`/`submitKnowledgeCheckAnswer`, lesson-page panel | No progress recording for knowledge checks |
| Transcript | Stored but not displayed | Collapsible transcript panel with clickable timestamps that seek the video | `frontend/src/components/LessonPlayer.tsx` exposed `seekTo` ref + transcript parsing | Multi-language / WebVTT support not added |
| Notes | Not present | Lesson-page notes panel with create/edit/delete and video-timestamp seeking; standalone `/my-notes` notebook grouped by course | `backend/src/notes/*`, `frontend/src/lib/api/notes.ts`, `frontend/src/pages/my-notes.tsx` | No cross-device sync beyond server persistence; no note export |
| Resources | Stored but not displayed | Resource links listed under content with `resource_downloaded` analytics events | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` resources section | Signed URL / download authorization still delegated to storage layer |
| Continue learning | Derived from `progressPercent / 100 * totalLessons` | Exact next lesson, module, and video timestamp returned by `GET /me/enrollments/:id/continue`; displayed on My Learning | `backend/src/enrollments/enrollments.service.ts` `getContinuePoint`, `frontend/src/pages/my-learning.tsx` | Resume timestamp does not auto-seek via query param; relies on player progress load |
| Prerequisites / sequential access | Enforced only if API caller used it | Page now calls `checkLessonAccess` and locks UI | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` access check + warning | Prerequisite lesson title link not surfaced in warning |
| Mobile | Drawer exists | Drawer with `aria-modal`, body scroll lock, Escape/overlay close, focus trap, and real outline state | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` mobile drawer | Landscape quality not implemented |
| Accessibility | Basic | Skip-to-content link, transcript details/summary, outline ARIA (`aria-expanded`, `aria-current="step"`, `aria-disabled`, progressbar values), mobile drawer focus trap, WebVTT captions track support, `prefers-reduced-motion` honored globally, `aria-live` progress announcements | `frontend/src/components/ui/CourseKnowledgeSpine.tsx`, `frontend/src/components/layouts/LessonLayout.tsx`, `frontend/src/hooks/useFocusTrap.ts`, `frontend/src/styles/globals.css` reduced-motion block, `frontend/src/components/LessonPlayer.tsx` `<track>` | Captions UI in instructor authoring not built; transcript search not implemented |
| Low bandwidth | HLS adaptive stream | Retained; player emits progress without extra polling; manual HLS quality selector | `frontend/src/components/LessonPlayer.tsx` | Auto-downgrade on bandwidth not implemented beyond HLS auto |
| Analytics | Stale `progress` table queried by dashboards; ad-hoc `console.error` | All analytics/instructor/AI/SCORM consumers switched to `lesson_progress` (new indexed `course_id`); structured `progress_save_failed` logging; new events `note_*`, `knowledge_check_answered` | `lesson-progress.entity.ts` courseId, 6 services remapped, `shared/src/types/analytics.types.ts` | `video_progress_sync_failed`, `assessment_submission_failed` not yet added |
| Time tracking | None | Client-side active-learning heartbeat (page visibility) + server-side validation: `active_seconds` delta is clamped to wall-clock elapsed since last save + 60 s grace | `backend/src/courses/courses.service.ts` `updateLessonProgress` active-time clamp + spec test | Multi-tab session deduplication not implemented |
| AI readiness | AI companion panel exists | Retained | `frontend/src/components/LessonPlayer.tsx` AI panel | RAG grounding and prompt-injection review not done |
| Performance | N+1 risk in progress map | Single query for course-wide lesson progress | `backend/src/courses/courses.service.ts` `getLessonProgressForCourse` | Large transcript/resource payloads not paginated |
| Security | IDOR on mutations | Ownership/admin checks on all course/module/lesson writes | `backend/src/courses/courses.service.ts` authorization helpers + controller changes | Resource URL signing still delegated to storage layer |
| Error recovery | Silent failures | Access-denied state visible; progress-save errors show retry banner | `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` retry banner + service logging | Retry for other failures (notes, assessments) not implemented |

---

## 7. Tests Added and Tests Passed

### Backend

- `backend/src/courses/courses.service.spec.ts`
  - Authorization helpers: owner allowed, admin allowed, non-owner rejected, missing resource rejected.
  - `updateLessonProgress`: creates progress with resume/watched time, clamps to duration, keeps watched time monotonic, throws when lesson not found, completes manual lessons only when requested.
- `backend/src/enrollments/enrollments.service.spec.ts` (new)
  - `getContinuePoint`: returns first incomplete lesson with position, starts at beginning when no progress, returns last lesson when complete, rejects missing enrollment, rejects cross-user access.
- `backend/src/notes/notes.service.spec.ts` (new)
  - Creates, filters, updates, and deletes notes with strict ownership checks.
- `backend/src/assessments/assessments.service.spec.ts` (extended)
  - `getKnowledgeCheckForLesson` returns published knowledge-check quizzes with answers stripped and null when absent.
  - `submitKnowledgeCheckAnswer` grades server-side and returns explanation/correct answer only after submission.
- `backend/src/auth/auth.service.spec.ts` updated with `NotificationsService` mock so the suite can run.
- Full backend suite: **22 suites, 148 tests passed** (new test: active-time delta clamped to wall-clock elapsed + grace).

### Frontend

- `npm run type-check` passes.
- `frontend/src/components/ui/Button.test.tsx` updated to match current component classes.
- `frontend/src/components/CourseCard.test.tsx` updated to handle multiple links.
- `frontend/src/components/ui/CourseKnowledgeSpine.test.tsx` (new)
  - Renders module/lesson titles, links unlocked lessons, disables locked lesson links, shows locked badge.
- Full frontend suite: **4 suites, 25 tests passed**.
- Component/E2E tests for the new player and page behaviors are recommended next.

---

## 8. Migrations and Deployment Notes

1. Run the new migrations:
   ```bash
   cd backend && npx typeorm migration:run -d <your-data-source>
   ```
   Migrations include:
   - `20260928130000-AddLessonProgressResumeColumns.ts`
   - `20260928150000-CreateNotesTable.ts`
   - `20260928160000-AddQuizTypeColumn.ts`
   - `20260928170000-AddLessonCaptionsUrl.ts`
   - `20260928180000-AddCourseIdToLessonProgress.ts`
   - `20260928181000-AllowNullLessonIdOnLessonProgress.ts`
   - `20260928182000-MigrateProgressToLessonProgress.ts` (idempotent backfill; no-op if `progress` missing)
2. Deleted files (after zero remaining imports and a clean build):
   - `backend/src/courses/entities/enrollment.entity.ts` (duplicate)
   - `backend/src/assessments/entities/progress.entity.ts` (superseded by `lesson_progress`)
3. No existing learner data is modified or removed.

---

## 9. Remaining Issues and Deferred Improvements

### Remaining / partially implemented

- **T0-05 Stale `progress` table:** Code switch complete — all consumers use `lesson_progress`; backfill migration verified against local MySQL. Only remaining steps are production-side: audit rows, run migrations, then drop the table later.
- **Server-side active/idle time validation:** Implemented — `updateLessonProgress` clamps reported `active_seconds` growth to wall-clock elapsed since last save + 60 s grace.

### Deferred to P2/P3

- RAG-based AI lesson assistant with source citations and prompt-injection controls.
- Funnel analytics and learning analytics improvements (dashboard aggregation of new events).
- Offline progress synchronization.
- Multi-block lesson authoring/rendering (`lesson_blocks` table).
- Formal Lighthouse/axe audit and caption authoring UI for instructors.
- Multi-tab active-time deduplication.

### Blocked

- **P0 T0-05 Stale `progress` table (production only):** audit `progress` rows, run the verified migrations, and drop the table in a follow-up. All application code already reads/writes `lesson_progress`.

---

## 10. Recommended Next Phase

1. **Resolve T0-05 (production only)**
   - Audit the `progress` table in production (row counts, freshness).
   - Run the new migrations; the backfill is idempotent and verified on MySQL.
   - Drop the `progress` table in a later release once dashboards confirm clean data.
2. **Production deploy checklist**
   - Run migrations `20260928130000`, `20260928150000`, `20260928160000`, `20260928170000`, `20260928180000`, `20260928181000`, `20260928182000`.
   - Jest config fix (`moduleNameMapping` → `moduleNameMapper`) is already applied; the validation warning is gone.
3. **Remaining P2/P3**
   - Browser-level E2E coverage (Playwright) for resume/locked-lesson/manual-completion flows.
   - Multi-condition completion rules and multi-block lessons.
   - Add component tests for `LessonPlayer` resume/progress rendering.

---

*Report generated after the P0/P1 implementation pass described in the session summary.*
