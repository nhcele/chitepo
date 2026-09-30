# LMS Lesson Engine Improvement Plan

**Status (in-progress update):**
- P0 T0-01, T0-02, T0-03, T0-04, T1-07: completed.
- P1 T1-01, T1-02, T1-03, T1-04, T1-06, T1-08, T1-09: completed.
- P1 T1-05 (Continue Learning endpoint): not yet implemented.
- P0 T0-05 (stale `progress` table): code switch complete — all consumers read `lesson_progress`; backfill migration ready and locally verified; only the production audit + run + eventual table drop remain.
- P2/P3 items remain pending/deferred.

This plan is derived from the `LESSON_ENGINE_AUDIT.md`. Every task references the actual code, table, or API where the issue was observed.

Work is grouped by priority. Tasks marked **BLOCKED** require a product decision, infrastructure credential, or a safe migration strategy before they can start; work on independent items should continue around them.

---

## P0 — Critical

### T0-01: Fix duplicate `Enrollment` entity mapping

- **Problem:** There are two `Enrollment` entity classes mapping to the same `enrollments` table.
- **Evidence:**
  - `backend/src/courses/entities/enrollment.entity.ts`
  - `backend/src/enrollments/entities/enrollment.entity.ts`
  - `backend/src/database/database.module.ts:11` imports `Enrollment` from the `courses` version.
  - `backend/src/courses/courses.module.ts:12` imports `Enrollment` from the `enrollments` version.
  - `backend/src/assessments/assessments.module.ts:16` imports `Enrollment` from the `courses` version.
- **Current behaviour:** TypeORM receives two different classes for the same table. Nest dependency injection may resolve the wrong repository token, and unit tests that mock one repository may fail when a service injects the other.
- **Expected behaviour:** A single source of truth for the `Enrollment` entity.
- **Implementation:**
  1. Delete `backend/src/courses/entities/enrollment.entity.ts`.
  2. Update every import to use `../enrollments/entities/enrollment.entity`.
  3. Update `DatabaseModule` to import `Enrollment` from `../enrollments/entities/enrollment.entity`.
  4. Verify `instructor.service.ts` and `analytics.service.ts` imports.
- **Files affected:**
  - `backend/src/courses/entities/enrollment.entity.ts` (delete)
  - `backend/src/database/database.module.ts`
  - `backend/src/courses/courses.module.ts`
  - `backend/src/assessments/assessments.module.ts`
  - `backend/src/instructor/instructor.service.ts`
  - Any spec files that mocked the deleted entity.
- **Database changes:** None (same table).
- **API changes:** None.
- **Frontend changes:** None.
- **Security considerations:** Prevents repository-resolution confusion that could lead to the wrong authorization checks.
- **Tests:** Run backend unit tests; update any broken mocks.
- **Acceptance criteria:**
  - Only one `Enrollment` entity remains in the codebase.
  - `npm run test` (backend) no longer fails with duplicate/missing repository errors caused by this entity.
- **Dependencies:** None.
- **Risk:** MEDIUM (touches core auth/enrollment module).

### T0-02: Fix erroneous `Course.lessons` relation and align analytics queries

- **Problem:** `Course` declares both `modules` and `lessons`, and `lessons` is typed as `Module[]` and points to the same inverse side.
- **Evidence:**
  - `backend/src/courses/entities/course.entity.ts:99-104`
  - `backend/src/analytics/analytics.service.ts:491-540` reads `e.course.lessons`, expecting modules-with-lessons.
- **Current behaviour:** `course.lessons` is semantically wrong and may return modules or undefined. The analytics `getLearnerProgressMetrics` will likely throw or return empty data because it does not load modules.
- **Expected behaviour:** `Course` has one correct `modules` relation. Analytics uses it explicitly.
- **Implementation:**
  1. Remove the duplicate/wrong `lessons` relation from `Course`.
  2. In `AnalyticsService.getLearnerProgressMetrics`, load `relations: ['course.modules', 'course.modules.lessons']` and compute from `course.modules`.
  3. Compute completed lessons from `lesson_progress` rather than the stale `Progress` table.
- **Files affected:**
  - `backend/src/courses/entities/course.entity.ts`
  - `backend/src/analytics/analytics.service.ts`
- **Database changes:** None.
- **API changes:** Analytics responses may change from broken to correct.
- **Frontend changes:** None.
- **Security considerations:** Ensure analytics endpoints still enforce that a user can only view their own metrics (currently `getLearnerProgressMetrics` accepts any `userId` without ownership check).
- **Tests:** Add/update analytics service unit tests; run backend tests.
- **Acceptance criteria:**
  - No `lessons` relation on `Course`.
  - `getLearnerProgressMetrics` returns plausible totals/completed counts for the authenticated user.
- **Dependencies:** T0-01 (enrollment entity alignment).
- **Risk:** MEDIUM.

### T0-03: Fix broken `CoursesService` unit tests

- **Problem:** `courses.service.spec.ts` fails to compile because `LessonProgressRepository` is not mocked.
- **Evidence:** Test output from `npm run test -- --testPathPattern=courses.service` in `backend/`: `Nest can't resolve dependencies of the CoursesService ... LessonProgressRepository`.
- **Current behaviour:** 14 tests fail at module compilation; regressions in course/lesson progress cannot be caught.
- **Expected behaviour:** Course service tests pass.
- **Implementation:** Add a `mockLessonProgressRepository` to the test module and provide `getRepositoryToken(LessonProgress)`.
- **Files affected:**
  - `backend/src/courses/courses.service.spec.ts`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** None.
- **Security considerations:** None.
- **Tests:** Run the fixed spec.
- **Acceptance criteria:** `npm run test -- --testPathPattern=courses.service` passes.
- **Dependencies:** None.
- **Risk:** LOW.

### T0-04: Enforce ownership/role authorization on mutation endpoints

- **Problem:** Several write endpoints are only protected by `JwtAuthGuard`; any authenticated user can call them.
- **Evidence:**
  - `backend/src/courses/courses.controller.ts:53-62` `PATCH /courses/:id` and `DELETE /courses/:id`
  - `backend/src/courses/lessons.controller.ts:9-24` `PATCH /lessons/:id`, `DELETE /lessons/:id`, `POST /lessons/reorder`
  - `backend/src/courses/modules.controller.ts:19-41` `POST /modules`, `POST /modules/:id/lessons`, `POST /modules/:id/snapshot`
- **Current behaviour:** A learner can update, delete, or reorder any course, module, or lesson if they know the UUID.
- **Expected behaviour:** Only the course owner, an admin, or a super_admin can mutate a course/module/lesson.
- **Implementation:**
  1. Add `RolesGuard` to relevant controllers or call a service-level `ensureCanManageCourse/Module/Lesson(userId, id)` helper.
  2. For course-level endpoints, verify `course.instructorId === userId` or `role` is admin/super_admin.
  3. For lesson/module endpoints, resolve the owning course and apply the same check.
- **Files affected:**
  - `backend/src/courses/courses.controller.ts`
  - `backend/src/courses/lessons.controller.ts`
  - `backend/src/courses/modules.controller.ts`
  - `backend/src/courses/courses.service.ts`
  - `backend/src/auth/guards/roles.guard.ts` (if needed)
- **Database changes:** None.
- **API changes:** Behavior change: unauthorized writes return 403.
- **Frontend changes:** None (UI already assumes instructors only see their content).
- **Security considerations:** This closes IDOR/authorization bypass on course, module, and lesson mutations.
- **Tests:** Add controller tests for non-owner rejection and admin allowance.
- **Acceptance criteria:**
  - A non-owner authenticated user receives 403 on `PATCH /courses/:id`, `DELETE /lessons/:id`, etc.
  - Owners and admins can still mutate their resources.
- **Dependencies:** None.
- **Risk:** MEDIUM.

### T0-05: Reconcile or remove the stale `progress` table

- **Problem:** `assessments/entities/progress.entity.ts` maps to a `progress` table that is read by `AnalyticsService` and `InstructorService`, but authoritative progress is written to `lesson_progress`.
- **Evidence:**
  - `backend/src/assessments/entities/progress.entity.ts`
  - `backend/src/analytics/analytics.service.ts:9,213,498,518`
  - `backend/src/instructor/instructor.service.ts:9,420-444`
- **Current behaviour:** Analytics and instructor dashboards query stale/empty data while the real progress lives in `lesson_progress`.
- **Expected behaviour:** One progress source of truth.
- **Implementation:**
  1. Audit production to confirm whether `progress` has any live rows.
  2. If empty/unused, remove `Progress` entity and all references; update analytics/instructor to use `LessonProgress`.
  3. If rows exist, design a migration to backfill into `lesson_progress`, then drop the table.
- **Files affected:**
  - `backend/src/assessments/entities/progress.entity.ts`
  - `backend/src/analytics/analytics.service.ts`
  - `backend/src/analytics/analytics.module.ts`
  - `backend/src/instructor/instructor.service.ts`
  - `backend/src/instructor/instructor.module.ts`
  - `backend/src/instructor/instructor.service.spec.ts`
- **Database changes:** Drop `progress` table after migration.
- **API changes:** Analytics/instructor progress responses become accurate.
- **Frontend changes:** None.
- **Security considerations:** Ensure the migration does not expose another learner's progress.
- **Tests:** Update analytics/instructor specs; verify no `Progress` repository references.
- **Acceptance criteria:**
  - All progress reads come from `lesson_progress`.
  - `progress` table is removed or clearly deprecated.
- **Dependencies:** T0-01, T0-02.
- **Risk:** HIGH (data migration).
- **Status:** Code switch COMPLETE. All `Progress` consumers now read/write `lesson_progress` (which gained a denormalized `course_id` column and nullable `lesson_id` for course-level SCORM rows). The `Progress` entity file and duplicate `courses/entities/enrollment.entity.ts` were deleted. The backfill migration was renumbered to `20260928182000-MigrateProgressToLessonProgress.ts`, made idempotent and no-op-safe when `progress` does not exist, and verified against a real MySQL instance locally. Remaining: run the production audit (row counts, freshness) then apply migrations in production; dropping the `progress` table itself remains a separate, later destructive step.

---

## P1 — Core Experience

### T1-01: Implement periodic, server-authoritative video progress with resume position

- **Problem:** The video player never sends progress while watching, and it never resumes at the previous position. A learner who leaves at 13:42 starts again at 0:00.
- **Evidence:**
  - `frontend/src/components/LessonPlayer.tsx` only wires `loadedmetadata`, `play`, and `onEnded`.
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:699-707` only calls `saveLessonProgress` with `watchPercent: 100` on video end.
  - `backend/src/courses/entities/lesson-progress.entity.ts` has no `lastPosition` or `watchedSeconds` column.
- **Current behaviour:** Progress is binary (0% or 100%). Returning learners lose their place.
- **Expected behaviour:**
  - Server stores `lastPositionSeconds`, `watchedSeconds`, and `watchPercent`.
  - Player resumes at `lastPositionSeconds` on load.
  - Progress is throttled (e.g., every 10 seconds or on pause/seek/end) and sent to the server.
  - Server clamps values monotonically and validates range.
- **Implementation:**
  1. Migration: add `last_position_seconds` (int, default 0) and `watched_seconds` (int, default 0) to `lesson_progress`.
  2. Extend `POST /courses/lessons/:lessonId/progress` to accept `lastPositionSeconds`, `watchedSeconds`, and `watchPercent`.
  3. Update `CoursesService.updateLessonProgress` to validate and clamp these fields, compute `watchPercent` server-side from duration if possible.
  4. In `LessonPlayer`, add `timeupdate`, `pause`, and `seeked` handlers; throttle saves; call `onProgress({ lastPositionSeconds, watchedSeconds })`.
  5. On mount, seek the video to `lessonProgress.lastPositionSeconds`.
- **Files affected:**
  - `backend/src/database/migrations/...AddLessonProgressPosition.ts` (new)
  - `backend/src/courses/entities/lesson-progress.entity.ts`
  - `backend/src/courses/courses.service.ts`
  - `backend/src/courses/courses.controller.ts`
  - `frontend/src/components/LessonPlayer.tsx`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/lib/api/courses.ts`
- **Database changes:** Add columns to `lesson_progress`.
- **API changes:** `POST /courses/lessons/:lessonId/progress` accepts additional optional numeric fields; response includes them.
- **Frontend changes:** Add progress save/resume wiring to `LessonPlayer` and lesson page.
- **Security considerations:** Never trust client-side progress without clamping; reject values outside 0..duration; ignore attempts to lower watched time.
- **Tests:**
  - Unit: `updateLessonProgress` clamps and rejects invalid values.
  - Integration: progress saved at 30s; reload resumes at 30s.
  - E2E: play video, navigate away, return, verify resume.
- **Acceptance criteria:**
  - A learner who stops at 13:42 resumes within a few seconds of that position after returning.
  - Network failures show a retry toast but do not block playback.
- **Dependencies:** T0-03 (tests must be green before adding new logic).
- **Risk:** MEDIUM.

### T1-02: Add a "Mark Complete" control and fully honour `completionMode`

- **Problem:** `Lesson` supports `completionMode = 'manual'`, but the lesson page has no button to trigger it.
- **Evidence:**
  - `backend/src/courses/entities/lesson.entity.ts:46`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` has no manual completion UI.
- **Current behaviour:** A manual lesson can never be marked complete from the learner UI.
- **Expected behaviour:** When `completionMode === 'manual'`, a primary button lets the learner mark the lesson complete after server validation.
- **Implementation:**
  1. Expose `completionMode` in the normalized lesson response.
  2. Add a "Mark as complete" button for manual lessons.
  3. Call `POST /courses/lessons/:lessonId/progress` with `watchPercent: 100` or a new explicit field; server checks `completionMode === 'manual'` before marking complete.
  4. Prevent spoofing by validating the mode server-side.
- **Files affected:**
  - `backend/src/courses/courses.service.ts`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Database changes:** None.
- **API changes:** None (reuse progress endpoint).
- **Frontend changes:** Add button and status feedback.
- **Security considerations:** Server must only accept manual completion when the lesson is configured as manual.
- **Tests:**
  - Unit: manual mode completes only when requested and authorized.
  - E2E: learner marks manual lesson complete.
- **Acceptance criteria:**
  - Manual lessons show a "Mark Complete" button.
  - Clicking it updates `isCompleted` and refreshes sidebar/course progress.
- **Dependencies:** T1-01 (shared progress infrastructure).
- **Risk:** LOW.

### T1-03: Show real completion and locked state in the course outline sidebar

- **Problem:** `CourseKnowledgeSpine` always shows lessons as `pending` except the current one, and uses `isAuthenticated` as a proxy for enrollment.
- **Evidence:**
  - `frontend/src/components/ui/CourseKnowledgeSpine.tsx:109-165`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:237-253` builds `spineModules` with status `current`/`pending` only.
- **Current behaviour:** Learners cannot see which lessons are completed or locked.
- **Expected behaviour:** Sidebar shows completed (check), current, locked, and pending states based on real enrollment and lesson progress.
- **Implementation:**
  1. Pass `enrollment`, `lessonProgressMap`, and `accessCheck` results into `CourseKnowledgeSpine`.
  2. Compute each lesson status: `completed`, `current`, `locked`, `pending`.
  3. Disable or lock links for lessons the learner cannot access.
- **Files affected:**
  - `frontend/src/components/ui/CourseKnowledgeSpine.tsx`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/pages/courses/[courseId]/index.tsx` (if it uses the spine)
- **Database changes:** None.
- **API changes:** May reuse `GET /courses/:courseId/lessons/:lessonId/access`.
- **Frontend changes:** Update spine props and status logic.
- **Security considerations:** Locking is UI-only; backend still enforces access.
- **Tests:** Component tests for completed/locked/current rendering.
- **Acceptance criteria:**
  - Completed lessons show a green check.
  - Locked lessons show a lock icon and are not clickable.
  - Current lesson is highlighted.
- **Dependencies:** T1-04 (access data needed).
- **Risk:** LOW.

### T1-04: Enforce sequential learning rules on the lesson page

- **Problem:** `CoursesService.checkLessonAccess` exists but the lesson page does not call it before rendering content.
- **Evidence:**
  - `backend/src/courses/courses.service.ts:654-766`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:109-130` loads course and enrollment but never checks access.
- **Current behaviour:** A learner can open any lesson URL and view its content, even if the previous lesson is incomplete.
- **Expected behaviour:** If access is denied, the page shows a clear lock message with a link to the required previous lesson or quiz.
- **Implementation:**
  1. Add `checkLessonAccess` to the page load sequence.
  2. If `hasAccess === false`, render a locked state with the reason and action link (`previousLessonId`, required quiz score, etc.).
  3. Keep the sidebar visible so the learner understands position.
- **Files affected:**
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/lib/api/courses.ts`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Add locked state UI and access check.
- **Security considerations:** Backend access check already exists; this is defence-in-depth UX.
- **Tests:** E2E: incomplete prerequisite blocks lesson; link navigates to required lesson.
- **Acceptance criteria:**
  - Direct URL to a locked lesson shows a locked explanation, not the content.
  - The message includes the title/link of the prerequisite lesson.
- **Dependencies:** T1-03.
- **Risk:** MEDIUM.

### T1-05: Improve "Continue Learning" with actual last position

- **Problem:** `/my-learning` derives the resume lesson from `progressPercent / 100 * totalLessons`, which is inaccurate and ignores video position.
- **Evidence:**
  - `frontend/src/pages/my-learning.tsx:185-207`
- **Current behaviour:** A learner at 90% of lesson 3 may be sent to lesson 4 instead of resuming lesson 3.
- **Expected behaviour:** The system returns the exact last opened lesson and, for video, the last timestamp.
- **Implementation:**
  1. Add backend endpoint `GET /me/enrollments/:id/continue` returning `{ courseId, moduleId, lessonId, lessonTitle, videoPositionSeconds, isCompleted }`.
  2. Query based on `lastLessonSeenAt` (enrollment) and `lesson_progress.last_position_seconds`.
  3. Update `my-learning` to use the endpoint and display "Continue at 13:42 / 28:16".
- **Files affected:**
  - `backend/src/enrollments/enrollments.controller.ts`
  - `backend/src/enrollments/enrollments.service.ts`
  - `frontend/src/pages/my-learning.tsx`
- **Database changes:** None (uses existing columns after T1-01).
- **API changes:** New `GET /me/enrollments/:id/continue` or similar.
- **Frontend changes:** Update `CourseRow` resume link and label.
- **Security considerations:** Endpoint returns only the authenticated user's data.
- **Tests:** Integration and E2E tests for continue-after-restart.
- **Acceptance criteria:**
  - Returning learner sees "Continue Module 3, Lesson 3.3 at 13:42".
  - Clicking navigates to the lesson and resumes video at that timestamp.
- **Dependencies:** T1-01.
- **Risk:** MEDIUM.
- **Status:** Completed. Backend endpoint `GET /me/enrollments/:id/continue` added; `my-learning` now displays the real next lesson, module, and video timestamp.

### T1-06: Add structured observability logs for critical failures

- **Problem:** Failures are logged with `console.error` but not as structured events with the requested names.
- **Evidence:**
  - `backend/src/courses/courses.service.ts:35-42`
  - No occurrences of `progress_save_failed`, `video_progress_sync_failed`, `lesson_completion_validation_failed`, or `assessment_submission_failed`.
- **Current behaviour:** Hard to alert on or trace lesson-engine failures.
- **Expected behaviour:** Critical paths emit structured log lines with a `type`/`event` field and no PII.
- **Implementation:**
  1. Inject `private readonly logger = new Logger(CoursesService.name)` in services.
  2. Replace `console.error` with `logger.error({ event: 'progress_save_failed', ... }, error.message)`.
  3. Add similar events in `AssessmentsService` for submission/grading failures.
  4. Ensure metadata contains IDs, not names/emails/tokens.
- **Files affected:**
  - `backend/src/courses/courses.service.ts`
  - `backend/src/assessments/assessments.service.ts`
  - `backend/src/video/video-processing.service.ts`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Optionally send client-side failure beacons.
- **Security considerations:** Never log passwords, tokens, or private learner data.
- **Tests:** Add tests asserting that thrown errors produce a log with the expected `event`.
- **Acceptance criteria:**
  - Searching logs for `progress_save_failed` returns structured entries.
  - No tokens or passwords appear in those log payloads.
- **Dependencies:** None.
- **Risk:** LOW.

### T1-07: Fix `ILIKE` queries for MySQL compatibility

- **Problem:** `ILIKE` is PostgreSQL-only; the backend uses MySQL.
- **Evidence:**
  - `backend/src/courses/courses.service.ts:644-650` `search(query)`
  - `backend/src/courses/courses.service.ts:193-210` `listModules`
- **Current behaviour:** Search/module listing may throw SQL syntax errors on MySQL.
- **Expected behaviour:** Case-insensitive search works on MySQL.
- **Implementation:** Replace `ILIKE` with `LOWER(col) LIKE LOWER(:query)` or TypeORM `Like('%...%')` with a lowercase wrapper.
- **Files affected:**
  - `backend/src/courses/courses.service.ts`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** None.
- **Security considerations:** Use parameterized queries to avoid SQL injection (already parameterized).
- **Tests:** Add tests that assert the generated query works with MySQL dialect.
- **Acceptance criteria:**
  - `GET /courses/search?q=test` returns results without SQL errors against MySQL.
  - `GET /modules?search=test` does the same.
- **Dependencies:** None.
- **Risk:** LOW.

### T1-08: Render lesson resource links

- **Problem:** Lessons can store `resourceLinks`, but the learner page never displays them.
- **Evidence:**
  - `backend/src/courses/entities/lesson.entity.ts:43`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` has no resource list.
- **Current behaviour:** Resources are invisible to learners.
- **Expected behaviour:** Resource links are listed below content with titles and secure download/open actions.
- **Implementation:**
  1. Add a "Resources" section on the lesson page.
  2. Map `lesson.resourceLinks` to links.
  3. Track `RESOURCE_DOWNLOADED` analytics events.
- **Files affected:**
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Add resource list UI.
- **Security considerations:** Links should open in a new tab with `rel="noopener noreferrer"`; use signed URLs where possible.
- **Tests:** Component test verifying resource list renders.
- **Acceptance criteria:**
  - Resource links appear under the lesson content.
  - Clicking a resource fires a `RESOURCE_DOWNLOADED` analytics event.
- **Dependencies:** None.
- **Risk:** LOW.

### T1-09: Render transcripts with click-to-seek

- **Problem:** `transcript` is stored as plain text but not shown or linked to the video.
- **Evidence:**
  - `backend/src/courses/entities/lesson.entity.ts:40-41`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` does not render the transcript.
- **Current behaviour:** Transcripts are inaccessible.
- **Expected behaviour:** Transcript panel with clickable timestamps that seek the video.
- **Implementation:**
  1. Parse common timestamp formats (`MM:SS`, `HH:MM:SS`) or accept plain paragraphs.
  2. Add a collapsible transcript panel.
  3. Clicking a timestamp seeks the player via a ref callback.
- **Files affected:**
  - `frontend/src/components/learner/TranscriptPanel.tsx` (new)
  - `frontend/src/components/LessonPlayer.tsx` (expose seek method)
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Database changes:** None (store as text; structured WebVTT can be a later migration).
- **API changes:** None.
- **Frontend changes:** Add panel and seek wiring.
- **Security considerations:** Sanitize transcript text before rendering.
- **Tests:** Component tests for timestamp parsing and click-to-seek.
- **Acceptance criteria:**
  - Transcript text is visible.
  - Clicking a timestamp updates the video current time.
- **Dependencies:** T1-01.
- **Risk:** LOW.

---

## P2 — Learning Experience

### T2-01: Add embedded knowledge checks inside lessons

- **Problem:** Quizzes exist only as final assessments; there is no formative in-lesson question.
- **Evidence:**
  - `backend/src/assessments/entities/quiz.entity.ts`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` quiz rendering is a full overlay.
- **Current behaviour:** Learners cannot answer a quick question inside a text/video lesson and get immediate feedback.
- **Expected behaviour:** Instructors can add knowledge-check blocks (one or more questions) within a lesson; learners answer, get explanation, and continue. These can be formative only or optionally contribute to lesson completion.
- **Implementation (Phase 1):**
  1. Reuse the existing `quizzes`/`questions` schema: allow a quiz with `type = 'knowledge_check'` or a new `isFormative` flag.
  2. Render knowledge checks inline in the lesson content flow.
  3. Grade client-side for immediate feedback (answers are not authoritative for formative).
  4. Track `KNOWLEDGE_CHECK_ANSWERED` analytics events.
- **Files affected:**
  - `backend/src/assessments/entities/quiz.entity.ts`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/components/learner/KnowledgeCheck.tsx` (new)
- **Database changes:** Optional `is_formative` column on `quizzes`.
- **API changes:** Optional.
- **Frontend changes:** Inline question rendering.
- **Security considerations:** Formative checks should not expose the final grade path.
- **Tests:** Component and E2E tests.
- **Acceptance criteria:**
  - A formative question renders inline.
  - Learner receives correct/incorrect + explanation immediately.
- **Dependencies:** None.
- **Risk:** MEDIUM.
- **Status:** Completed (server-graded variant). `quizzes.type = 'knowledge_check'` plus `GET/POST /assessments/lessons/:lessonId/knowledge-check*` endpoints; lesson page renders the check and shows immediate feedback. Answers are never sent to the client before submission. Multiple choice, true/false, and short answer are all supported; `knowledge_check_answered` analytics events are wired.

### T2-02: Learner notes with lesson and video timestamp anchors

- **Problem:** No notes feature exists for learners.
- **Evidence:** No `notes` table or note API found.
- **Current behaviour:** Learners cannot take private notes tied to a lesson or video timestamp.
- **Expected behaviour:** Learners can add, edit, delete notes; notes are anchored to a lesson and optional video timestamp; clicking a note returns to that timestamp.
- **Implementation:**
  1. Migration: `notes` table (`id`, `user_id`, `course_id`, `lesson_id`, `video_timestamp_seconds`, `content`, `created_at`, `updated_at`).
  2. CRUD endpoints under `/notes` or `/courses/:courseId/lessons/:lessonId/notes`.
  3. UI panel on the lesson page with "Add note at current time".
- **Files affected:**
  - `backend/src/database/migrations/...CreateNotesTable.ts`
  - `backend/src/notes/` module, controller, service, entity (new)
  - `backend/src/app.module.ts`
  - `frontend/src/components/learner/LessonNotes.tsx` (new)
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Database changes:** New `notes` table.
- **API changes:** New note CRUD endpoints.
- **Frontend changes:** Add notes panel and create/edit UI.
- **Security considerations:** Notes are private; endpoints must enforce `user_id`.
- **Tests:** API authorization tests; CRUD tests; component tests.
- **Acceptance criteria:**
  - Learner can create a note at a video timestamp.
  - Clicking the note seeks the video to that timestamp.
  - Notes are visible only to the owning user.
- **Dependencies:** T1-01 (seek wiring).
- **Risk:** MEDIUM.
- **Status:** Completed. Notes table, CRUD API, and lesson-page panel implemented with ownership enforcement and timestamp seeking.

### T2-03: Accessibility improvements for the lesson page and player

- **Problem:** The lesson page relies on native video controls and lacks custom keyboard/screen-reader affordances.
- **Evidence:**
  - `frontend/src/components/LessonPlayer.tsx:220-245` video is a plain `<video>`.
  - Quiz modal and mobile drawer do not manage focus.
- **Current behaviour:** Keyboard-only users may struggle with the player and quiz modal.
- **Expected behaviour:** Full keyboard navigation, visible focus indicators, ARIA labels, focus trapping in modals/drawers, and semantic headings.
- **Implementation:**
  1. Add `aria-label` and keyboard shortcuts to player controls (if custom controls are added).
  2. Trap focus in the quiz modal and mobile outline drawer.
  3. Ensure heading hierarchy (h1 lesson title, h2 module, etc.).
  4. Add `aria-live` regions for progress/completion announcements.
- **Files affected:**
  - `frontend/src/components/LessonPlayer.tsx`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/components/ui/CourseKnowledgeSpine.tsx`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** ARIA/focus/heading improvements.
- **Security considerations:** None.
- **Tests:** Accessibility/axe tests; keyboard-only navigation E2E.
- **Acceptance criteria:**
  - Lighthouse accessibility score >= 90 on the lesson page.
  - Quiz modal can be closed with Escape and focus returns to the trigger.
- **Dependencies:** None.
- **Risk:** MEDIUM.
- **Status:** Mostly completed. Skip link, outline ARIA, mobile drawer focus trap, body-scroll lock, Escape/overlay close, WebVTT captions track support, `prefers-reduced-motion`, focus-visible styles, and `aria-live` progress announcements are in place. Formal Lighthouse/axe audit remains outstanding.

### T2-04: Mobile UX refinements

- **Problem:** Mobile outline drawer exists but the player and navigation could be better on small screens.
- **Evidence:**
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:766-775,1705-1735`
  - `frontend/src/components/LessonPlayer.tsx:220` plain video player.
- **Current behaviour:** Acceptable but not polished; landscape video may not enter fullscreen cleanly.
- **Expected behaviour:** Clean mobile drawer, fullscreen landscape player, accessible touch targets, sticky progress header.
- **Implementation:**
  1. Ensure the video element uses `playsInline` and supports fullscreen via native controls.
  2. Increase touch-target size for outline and tab buttons.
  3. Collapse lesson status bar gracefully on narrow screens.
- **Files affected:**
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/components/LessonPlayer.tsx`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Tailwind responsive tweaks.
- **Security considerations:** None.
- **Tests:** Visual regression across 320px, 375px, 768px.
- **Acceptance criteria:**
  - Lesson page is usable at 320px.
  - Video enters fullscreen on rotate/lock.
- **Dependencies:** None.
- **Risk:** LOW.

### T2-05: Low-bandwidth and performance optimizations

- **Problem:** No explicit quality selector, images are not optimized, and the lesson page loads the full course payload.
- **Evidence:**
  - `frontend/src/components/LessonPlayer.tsx:72-78` HLS auto level only.
  - No `next/image` usage observed for course/lesson covers.
- **Current behaviour:** Learners on slow networks have no control over video quality; images may be large.
- **Expected behaviour:** Optional low-bandwidth mode, image optimization, lazy loading, smaller API payloads.
- **Implementation:**
  1. Add a quality selector in `LessonPlayer` using HLS levels.
  2. Replace `<img>` with `next/image` where possible.
  3. Lazy-load below-the-fold content.
  4. Consider a "data saver" toggle stored in user preferences.
- **Files affected:**
  - `frontend/src/components/LessonPlayer.tsx`
  - `frontend/src/components/ui/CourseCover.tsx`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Quality selector, image component changes.
- **Security considerations:** None.
- **Tests:** Lighthouse performance audit; throttled network E2E.
- **Acceptance criteria:**
  - Learner can choose 360p/480p/720p/auto.
  - Course cover images are served in next-gen format/sizes.
- **Dependencies:** None.
- **Risk:** LOW.

### T2-06: Active learning time tracking

- **Problem:** There is no accurate "active learning time" measurement.
- **Evidence:** No heartbeat/idle detection found in lesson page or player.
- **Current behaviour:** Time spent is inferred from analytics events, which can be inflated.
- **Expected behaviour:** Track focused, non-idle time on the lesson page and video playback.
- **Implementation:**
  1. Send periodic heartbeats (e.g., every 30s) when the page is visible and not idle.
  2. Track active video watch time server-side in `lesson_progress`.
  3. Pause the timer when the tab is hidden or the learner is idle.
- **Files affected:**
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - `frontend/src/components/LessonPlayer.tsx`
  - `backend/src/courses/entities/lesson-progress.entity.ts`
  - `backend/src/courses/courses.service.ts`
- **Database changes:** Add `active_seconds` to `lesson_progress`.
- **API changes:** Extend progress endpoint or add heartbeat endpoint.
- **Frontend changes:** Heartbeat sender and idle detection.
- **Security considerations:** Clamp active time; ignore large jumps.
- **Tests:** Unit tests for active-time calculation; E2E.
- **Acceptance criteria:**
  - Active seconds increment while the learner interacts/plays video.
  - Idle/tab-hidden time is not counted.
- **Dependencies:** T1-01.
- **Risk:** MEDIUM.
- **Status:** Completed. `active_seconds` is stored on `lesson_progress`, the lesson page sends a 30 s heartbeat only while the tab is visible, and the server clamps each reported delta to wall-clock elapsed since last save + 60 s grace (with a unit test).

---

## P3 — Advanced Capabilities

### T3-01: Ground the AI companion with course content / RAG

- **Problem:** The AI chat can answer questions but has no guaranteed grounding in approved course materials.
- **Evidence:**
  - `frontend/src/components/learner/AILearningCompanion.tsx`
  - `backend/src/ai-companion/ai-companion.service.ts`
- **Current behaviour:** Answers may hallucinate or contradict course content.
- **Expected behaviour:** AI responses cite approved lesson transcripts, resources, and instructor notes.
- **Implementation:**
  1. Chunk transcripts, lesson content, and resources.
  2. Store embeddings in the existing Pinecone vector store.
  3. On each chat request, retrieve relevant chunks and include them in the prompt with citations.
  4. Add cost/rate controls and prompt-injection defences.
- **Files affected:**
  - `backend/src/ai-companion/vector-store.service.ts`
  - `backend/src/ai-companion/ai-companion.service.ts`
  - `frontend/src/components/learner/AILearningCompanion.tsx`
- **Database changes:** Add vector metadata for lessons.
- **API changes:** Possibly none.
- **Frontend changes:** Show citations and source links.
- **Security considerations:** Tenant isolation, cost limits, logging, PII filtering.
- **Tests:** RAG retrieval tests; prompt-injection tests.
- **Acceptance criteria:**
  - AI answers about a lesson cite specific lesson sections.
  - Requests exceeding quota are rejected gracefully.
- **Dependencies:** Pinecone/OpenAI credentials and policy approval.
- **Risk:** HIGH.
- **Status:** BLOCKED pending AI infrastructure and budget approval.

### T3-02: Lesson funnel and drop-off analytics

- **Problem:** Analytics events exist, but there are no pre-built funnel reports for lesson reach/drop-off.
- **Evidence:**
  - `backend/src/analytics/entities/analytics-event.entity.ts`
  - `backend/src/analytics/analytics.service.ts`
- **Current behaviour:** Admins cannot easily see where learners drop off in a lesson.
- **Expected behaviour:** Dashboard reports: started, 25%, 50%, 75%, completed, average watch time, replay events.
- **Implementation:**
  1. Add `VIDEO_PROGRESS` events with `percent` metadata.
  2. Build aggregate queries or a materialized summary table.
  3. Expose an admin/instructor endpoint.
- **Files affected:**
  - `backend/src/analytics/analytics.service.ts`
  - `frontend/src/components/admin/` analytics dashboards
- **Database changes:** Optional summary table.
- **API changes:** New analytics endpoints.
- **Frontend changes:** Add funnel charts.
- **Security considerations:** Instructors see only their courses.
- **Tests:** Analytics service tests.
- **Acceptance criteria:**
  - Instructor can view per-lesson drop-off percentages.
- **Dependencies:** T1-01 (progress events).
- **Risk:** MEDIUM.

### T3-03: Multi-block lesson architecture

- **Problem:** A lesson is a single record with optional video/text/contentUrl. It cannot mix blocks.
- **Evidence:**
  - `backend/src/courses/entities/lesson.entity.ts`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
- **Current behaviour:** Lessons are limited to one primary content type.
- **Expected behaviour:** A lesson is a container of ordered blocks: video, text, image, document, knowledge check, reflection, etc.
- **Implementation:**
  1. Add `lesson_blocks` table (`id`, `lesson_id`, `type`, `sort_order`, `metadata` JSON).
  2. Backfill existing lessons into one block each.
  3. Update API and lesson page to render blocks sequentially.
- **Files affected:**
  - `backend/src/courses/entities/lesson-block.entity.ts` (new)
  - `backend/src/database/migrations/...CreateLessonBlocks.ts`
  - `backend/src/courses/courses.service.ts`
  - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx`
  - Instructor lesson editor.
- **Database changes:** New table; backfill migration.
- **API changes:** Lesson responses include `blocks` array.
- **Frontend changes:** Block renderer.
- **Security considerations:** Validate block types server-side; sanitize HTML.
- **Tests:** Migration tests; block renderer tests.
- **Acceptance criteria:**
  - Existing lessons continue to render unchanged.
  - New lessons can contain multiple block types.
- **Dependencies:** None.
- **Risk:** HIGH.
- **Status:** BLOCKED until a migration plan for existing content is approved.

### T3-04: Offline progress sync / PWA enhancements

- **Problem:** The app is built with `next-pwa` but there is no offline lesson or progress sync strategy.
- **Evidence:**
  - `frontend/public/sw.js` exists.
  - No offline progress queue found.
- **Current behaviour:** A network interruption loses progress that has not yet been saved.
- **Expected behaviour:** Temporary local persistence of progress during outages, with background sync when connectivity returns.
- **Implementation:**
  1. Add an in-memory/IndexedDB queue for progress updates.
  2. Use the service worker to retry queued writes.
  3. Surface a "sync pending" indicator.
- **Files affected:**
  - `frontend/public/sw.js`
  - `frontend/src/lib/offline-queue.ts` (new)
  - `frontend/src/components/LessonPlayer.tsx`
- **Database changes:** None.
- **API changes:** None.
- **Frontend changes:** Offline queue and UI indicator.
- **Security considerations:** Queue must be scoped to the current user; do not store progress in plaintext local storage for shared devices without consideration.
- **Tests:** E2E with network throttling/disconnect.
- **Acceptance criteria:**
  - Progress saved while offline is sent when the connection returns.
  - No duplicate progress records are created.
- **Dependencies:** T1-01.
- **Risk:** HIGH.
- **Status:** BLOCKED pending PWA policy and content-licensing review.

---

## Appendix — Dependency Graph

```text
T0-01 ─┬─> T0-02
       └─> T0-05 (BLOCKED)
T0-03 ──> T1-01
T1-01 ─┬─> T1-02
       ├─> T1-05
       ├─> T1-09
       └─> T2-02
T1-04 ──> T1-03
T1-01 ──> T2-06
T1-01 ──> T3-02
T0-05 ──> T3-02
```

Start with the P0 items that are not blocked, then move to P1 in the order shown above.
