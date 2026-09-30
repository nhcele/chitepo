# Lesson Engine Audit

## Executive Summary

The Mindelta/Chitepo LMS has a functional core: a server-authoritative course/module/lesson hierarchy, a solid assessment engine with attempt snapshots and server-side grading, HLS video delivery, enrollment-based progress, and analytics event ingestion. However, the learner-facing **lesson experience is currently incomplete** in the areas that define a world-class learning environment:

- **Video progress is not saved while watching** and there is **no resume position**.
- The **course outline does not show completed or locked lessons**.
- **Sequential access rules exist on the backend but are not enforced in the UI**.
- **Manual completion mode** is supported by the data model but has no UI control.
- **Transcripts and resource links** are stored but not rendered.
- There are **duplicate entity definitions** (`Enrollment`, `Progress`) that create confusion and test failures.
- Several **write endpoints lack ownership/role authorization**.
- The **`Course` entity has a duplicate/wrong `lessons` relation** that breaks analytics expectations.

The good news is that the underlying data model already supports many of the required concepts (completion mode, minimum watch percent, minimum quiz score, module reuse, question bank, AI provenance). The recommended strategy is to **extend the existing architecture**, not rewrite it.

This audit covers the full lesson lifecycle, video player, progress engine, assessments, mobile/accessibility, analytics, performance, security, and database design. All major findings reference actual code paths.

---

## 1. Technology Stack

### 1.1 Frontend

- **Framework:** Next.js 14.2.35, React 18.3.1, TypeScript
- **Styling:** Tailwind CSS
- **State / Data:** React Query, Axios (wrapped in `ApiClient`), React Context (`AuthContext`, `ThemeContext`)
- **Video:** `hls.js`, native `<video>` (no `react-player` in the active lesson page; an unused `CoursePlayer.tsx` uses `react-player`)
- **Motion:** Framer Motion (`MotionConfig reducedMotion="user"`)
- **Notifications:** `react-hot-toast`
- **Testing:** Jest, React Testing Library (few tests)

### 1.2 Backend

- **Runtime / Framework:** Node.js, NestJS 10.3.0, TypeScript
- **ORM:** TypeORM 0.3.17
- **Database:** MySQL via `mysql2`
- **Cache / Queues:** Redis/cache-manager, Bull
- **Auth:** JWT, Passport local/JWT/Google OAuth
- **Rate limiting:** NestJS Throttler
- **Video:** AWS S3, AWS Elemental MediaConvert, CloudFront (configured in `FilesService` and `VideoProcessingService`)
- **AI:** OpenAI, Pinecone vector store
- **Testing:** Jest, Supertest

### 1.3 Shared package

- `@mindelta/shared` contains TypeScript types, enums, and DTOs using `class-validator`.

---

## 2. LMS Architecture

### 2.1 Actual hierarchy

```text
Course
├── Module
│   └── Lesson
│       ├── Video URL
│       ├── Text/HTML content
│       ├── Transcript
│       ├── Resource links
│       ├── Completion mode
│       ├── Minimum watch percent
│       ├── Minimum quiz score
│       └── Quiz (one-to-one-ish via assessments.quizzes.lesson_id)
│           ├── Question
│           └── QuizAttempt
│               └── AttemptItem
├── Enrollment
└── LessonProgress
```

There is also a `course_modules` join table for reusable modules, but it is not used by the course-detail loader.

### 2.2 Important relations

- `backend/src/courses/entities/course.entity.ts:99-104` — `Course` has both `modules: Module[]` and a duplicate `lessons: Module[]` relation typed as `Module[]`. This is a bug.
- `backend/src/courses/entities/lesson.entity.ts:84-85` — `Lesson` has a one-to-many relation to `Quiz`.
- `backend/src/courses/entities/lesson-progress.entity.ts` — authoritative per-user, per-lesson progress.
- `backend/src/assessments/entities/progress.entity.ts` — a second, mostly-unused progress table read by analytics/instructor dashboards.

---

## 3. Relevant Files

### 3.1 Frontend

| Path | Responsibility |
|------|----------------|
| `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx` | Main lesson page: loads course, enrollment, progress, renders player, quiz, outline |
| `frontend/src/components/LessonPlayer.tsx` | HLS/MP4 video player, AI companion overlay, analytics events |
| `frontend/src/components/ui/CourseKnowledgeSpine.tsx` | Course outline sidebar used on lesson page |
| `frontend/src/components/learner/AILearningCompanion.tsx` | Floating AI companion on lesson page |
| `frontend/src/components/learner/CoursePlayer.tsx` | Legacy/unused player with local bookmarks |
| `frontend/src/pages/my-learning.tsx` | Learner dashboard with "Continue" links |
| `frontend/src/lib/api/courses.ts` | Course/lesson/progress API client |
| `frontend/src/lib/api/assessments.ts` | Quiz/attempt API client |
| `frontend/src/lib/api/analytics.ts` | Analytics event client |
| `frontend/src/lib/api/ai.ts` | AI companion client |

### 3.2 Backend

| Path | Responsibility |
|------|----------------|
| `backend/src/courses/entities/*.ts` | Course, Module, Lesson, LessonProgress, Enrollment, CourseModule |
| `backend/src/courses/courses.service.ts` | CRUD, access control, progress, completion, recalculation |
| `backend/src/courses/courses.controller.ts` | Course and lesson-progress endpoints |
| `backend/src/courses/lessons.controller.ts` | Lesson mutation endpoints |
| `backend/src/assessments/assessments.service.ts` | Quiz, attempts, grading, lesson progress linkage |
| `backend/src/assessments/assessments.controller.ts` | Assessment endpoints |
| `backend/src/enrollments/enrollments.service.ts` | Enrollment and course-level progress |
| `backend/src/analytics/analytics.service.ts` | Event ingestion and dashboard summaries |
| `backend/src/files/files.service.ts` | Document uploads, OCR, video transcoding |
| `backend/src/video/video-processing.service.ts` | AWS MediaConvert orchestration |

### 3.3 Database migrations

- `backend/src/database/migrations/1600000000000-initial-schema.ts`
- `backend/src/database/migrations/1723710740-course-modules-and-module-reuse.ts`
- `backend/src/database/migrations/1732500000000-add-missing-entity-columns.ts`
- `backend/src/database/migrations/20260518122014-AddLessonMetadata.ts`
- `backend/src/database/migrations/20260518130000-CreateLessonProgress.ts`
- `backend/src/database/migrations/20260923000000-AddAssessmentAttemptFoundation.ts`
- `backend/src/database/migrations/20260924000000-AddQuizProvenance.ts`
- `backend/src/database/migrations/20260924001000-AddQuestionBankAndObjectives.ts`
- `backend/src/database/migrations/1740000000001-CreateDocumentResources.ts`
- `backend/src/database/migrations/1740000000006-AddLessonSettingsFields.ts`
- `backend/src/database/migrations/1741300000001-AddQuizSettingsFields.ts`

---

## 4. Relevant Database Tables

| Table | Purpose | Primary Key | Foreign Keys | Indexes | Issues |
|-------|---------|-------------|--------------|---------|--------|
| `users` | Learners/instructors/admins | `id` UUID | — | `email`, `role`, `google_id` | — |
| `courses` | Courses | `id` UUID | `instructor_id -> users` | `instructor_id`, `status`, `difficulty`, `price` | `Course.lessons` relation is wrong |
| `modules` | Modules | `id` UUID | `course_id -> courses` (nullable), `author_id -> users` | `course_id`, `author_id`, `visibility` | Reuse goes through `course_modules`, but loader still uses `course_id` |
| `course_modules` | Reusable module join | `id` UUID | `course_id`, `module_id` | Unique `(course_id, module_id)` | Not loaded in course detail query |
| `lessons` | Lessons | `id` UUID | `module_id -> modules` | `module_id`, `(module_id, order_index)` | Single-record model; blocks not supported |
| `quizzes` | Quizzes | `id` UUID | `lesson_id -> lessons` | `lesson_id` | — |
| `questions` | Quiz questions | `id` UUID | `quiz_id -> quizzes`, `objective_id`, `bank_item_id` | `quiz_id`, `(quiz_id, order_index)`, `objective_id`, `bank_item_id` | — |
| `quiz_attempts` | Quiz attempts | `id` UUID | `quiz_id`, `user_id` | `quiz_id`, `user_id` | — |
| `attempt_items` | Snapshot of attempt questions | `id` UUID | `attempt_id`, `question_id` | — | (table created in migration) |
| `learning_objectives` | Learning objectives | `id` UUID | `course_id -> courses` | `course_id` | — |
| `question_bank_items` | Reusable question bank | `id` UUID | `course_id`, `objective_id` | `course_id`, `objective_id` | — |
| `enrollments` | User-course enrollment | `id` UUID | `course_id`, `user_id` | `(course_id, user_id)` unique, `course_id`, `user_id` | Two entity classes map to this table |
| `lesson_progress` | Authoritative per-user lesson progress | `id` UUID | `user_id`, `lesson_id` | `user_id`, `lesson_id`, unique `(user_id, lesson_id)` | Missing `last_position_seconds`, `watched_seconds` |
| `progress` | Stale/unused second progress table | `id` UUID | `user_id`, `course_id`, `lesson_id` | — | Read by analytics/instructor but never written by current flow |
| `analytics_events` | Learning events | `id` UUID | `user_id -> users` | `user_id`, `event_type`, `created_at`, `(user_id, event_type, created_at)` | Event volume could grow large |
| `certificates` | Certificates | `id` UUID | `course_id`, `user_id` | `course_id`, `user_id` | — |
| `document_resources` | Uploaded documents | `id` UUID | `owner_id` | `tenant_id+state+created_at`, `tenant_id+owner_id+created_at` | `tags` search uses `FIND_IN_SET` on text |

---

## 5. Current Lesson Lifecycle

1. **Page load**
   - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:109-130` calls `getCourse(courseId)` and `getMyEnrollmentForCourse(courseId)`.
   - It does **not** call `checkLessonAccess` before rendering.
2. **Progress load**
   - `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:141-156` calls `getLessonProgress(lessonId)`.
3. **Video lesson**
   - `frontend/src/components/LessonPlayer.tsx` loads HLS or MP4.
   - On first play, it fires `LESSON_STARTED` analytics event.
   - On video end, it fires `LESSON_COMPLETED` and `handleLessonEnded` posts `watchPercent: 100`.
   - **No intermediate progress is saved**, so partial watch and resume are unsupported.
4. **Text / HTML / download lesson**
   - Content is rendered directly. No progress is recorded unless the learner finishes a quiz.
5. **Quiz**
   - The lesson page tries to load a persisted quiz (`getQuizByLesson`) and starts an attempt via the assessment API.
   - Answers are autosaved. Submission is server-graded.
   - `AssessmentsService` calls `CoursesService.recordAssessmentResult`, which updates `lesson_progress` and recalculates enrollment progress.
6. **Completion**
   - `backend/src/courses/courses.service.ts:768-811` validates watch percent and completion mode before marking `isCompleted`.
   - `recalculateEnrollmentProgress` counts completed lessons and updates the enrollment record.
7. **Next lesson**
   - The page computes `prevNext` from ordered lessons and always renders Next/Previous links.
   - It does not disable Next if the current lesson is incomplete or the next lesson is locked.

---

## 6. Existing Features

### 6.1 Working features

- **Course/module/lesson CRUD** with module reuse join table.
- **Enrollment and course progress recalculation** from `lesson_progress`.
- **Assessment engine:** quiz creation, attempt snapshots, server grading, manual grading, deadlines, max attempts, retake cooldowns, question bank, learning objectives, AI provenance.
- **Answer-key hiding:** `AssessmentsService.normalizeQuiz()` strips `correctAnswer` and explanations from learner payloads by default.
- **HLS video playback** with `hls.js`, native fallback, and carbon-aware quality capping.
- **Analytics event ingestion** with a broad set of event types.
- **AI companion** chat with usage quota.
- **Document resources** with OCR queue and access-role filtering.
- **Responsive mobile outline drawer** on the lesson page.
- **Reduced-motion support** via `MotionConfig reducedMotion="user"`.

### 6.2 Partially working features

| Feature | What works | What is missing/broken |
|---------|------------|------------------------|
| Continue learning | `/my-learning` lists enrolled courses | Resume lesson is computed from `progressPercent`, not actual last position |
| Sequential access | `checkLessonAccess` exists on backend | Not called by lesson page; locks not shown |
| Course outline | Drawer exists, modules/lessons listed | Does not show completed/locked status; `isEnrolled` uses `isAuthenticated` |
| Manual completion | Data model supports `completionMode='manual'` | No UI button |
| Transcript | `transcript` column exists | Not rendered or clickable |
| Resources | `resourceLinks` stored | Not rendered |
| Module reuse | `course_modules` table exists | `findOne` loads modules via `modules.course_id`, ignoring join table |
| Progress persistence | 100% saved on video end | No partial progress, no resume timestamp |
| Low bandwidth | HLS auto-level | No explicit quality selector, no image optimization |

### 6.3 Missing features

- Periodic, throttled video progress saves.
- Resume video position (`last_position_seconds`).
- Embedded knowledge checks with immediate feedback.
- Learner notes anchored to lesson/video timestamp.
- Configurable multi-condition completion rules.
- Explicit learning states (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `LOCKED`, etc.).
- Active learning time / heartbeat tracking.
- Offline progress sync.
- Lesson funnel/drop-off analytics.
- RAG-grounded AI responses with citations.

---

## 7. UX Findings

### 7.1 Navigation and orientation

- **Good:** Breadcrumbs show Course / Module / Lesson title (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:810-823`).
- **Bad:** The sidebar shows every lesson as `pending` except the current one. A learner cannot see completed or locked lessons (`frontend/src/components/ui/CourseKnowledgeSpine.tsx:109-165` and `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:237-253`).
- **Bad:** The progress bar in the lesson header is computed from the linear index of the current lesson, not actual completion (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:205-220`).
- **Bad:** Next/Previous links are always enabled; there is no indication that the next lesson is locked (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:974-991`).

### 7.2 Lesson content

- Text/HTML content is rendered with a custom HTML sanitizer (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:310-329`), which removes scripts, event handlers, and `data:text/html` URLs.
- Content blocks inside a single lesson are parsed from JSON only if the content is stored as a JSON array; otherwise the whole field is treated as one block. This is a partial, ad-hoc block implementation.

### 7.3 Loading, empty, and error states

- The page shows a spinner while loading and an error banner for API failures (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:777-804`).
- Video missing state is handled (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:874-883`).
- Quiz loading/generating states exist.

---

## 8. Video Findings

### 8.1 Playback capabilities

- Play/pause, seek, volume, fullscreen, and picture-in-picture are provided by native `<video controls>`.
- **No playback speed selector** in the active player.
- **No caption/track support** (`<track>` elements are not used).
- **No explicit quality selector**; HLS auto-level is used, capped to 480p in high-carbon regions.

### 8.2 Progress and resume

- **Critical gap:** Only `onEnded` triggers a progress save (`watchPercent: 100`).
- `LessonPlayer` does not emit `onProgress`, `onTimeUpdate`, or `onSeek` callbacks to the parent page.
- `lesson_progress` has no `last_position_seconds` or `watched_seconds` column.
- Returning learners always restart from the beginning.

### 8.3 HLS implementation

- `hls.js` is configured with `maxBufferLength: 30`, `backBufferLength: 30`, `enableWorker: true`, and `capLevelToPlayerSize: true` (`frontend/src/components/LessonPlayer.tsx:72-78`).
- Fatal network errors trigger `hls.startLoad()`; media errors call `recoverMediaError()`; other fatal errors fall back to native video (`frontend/src/components/LessonPlayer.tsx:102-121`).
- `getCarbonIntensity()` is fetched to cap quality in high-carbon regions.

---

## 9. Progress Engine Findings

### 9.1 How progress is recorded

- Endpoint: `POST /courses/lessons/:lessonId/progress` (`backend/src/courses/courses.controller.ts:124-136`).
- Service: `CoursesService.updateLessonProgress` (`backend/src/courses/courses.service.ts:768-811`).
- It clamps `watchPercent` to `[0, 100]` and uses the maximum of the existing and incoming value (`backend/src/courses/courses.service.ts:789`).
- It marks `isCompleted = true` only if:
  - the lesson does not require a quiz,
  - `completionMode !== 'manual'`, and
  - `watchPercent >= minimumWatchPercent` (`backend/src/courses/courses.service.ts:797-802`).

### 9.2 Quiz-driven completion

- `AssessmentsService` finalizes attempts and calls `recordAssessmentResult` (`backend/src/courses/courses.service.ts:819-863`).
- It updates `bestQuizScore`, increments `quizAttempts`, and marks complete if `passed` and `watchPercent >= minimumWatchPercent`.
- This is server-authoritative and correct.

### 9.3 Enrollment recalculation

- `recalculateEnrollmentProgress` counts completed `lesson_progress` rows for the course and updates `enrollment.progressPercent` (`backend/src/courses/courses.service.ts:865-888`).
- It uses `Math.max` to keep progress monotonic.
- Potential bug: `lessonProgressRepo.count({ where: lessons.map(...) })` may not generate the intended OR query in MySQL/TypeORM; this should be verified.

### 9.4 Gaps and risks

- No enrollment check before writing `lesson_progress`; any authenticated user can create a progress row for any lesson.
- No `last_position_seconds` means no resume.
- `minimumWatchPercent` default differs between `updateLessonProgress` (`100`) and `recordAssessmentResult` (`0`).
- The `progress` table is a duplicate/unused data source that analytics still reads.

---

## 10. Assessment Findings

### 10.1 Strengths

- `AssessmentsService.normalizeQuiz()` removes `correctAnswer` and `explanation` from learner payloads by default (`backend/src/assessments/assessments.service.ts`).
- Attempts use item snapshots so later question edits do not alter an in-flight attempt.
- Server-side grading, manual grading, attempt deadlines, max attempts, retake cooldowns, and idempotency keys are implemented.
- Question bank and learning objectives are present.
- AI-generated quiz provenance is stored (`source`, `aiProvider`, `aiModel`, `aiGeneratedAt`).

### 10.2 Security findings

- The generic `/assessments/grade` endpoint is restricted to instructors/admins who own the questions (`backend/src/assessments/assessments.controller.ts:466-497`).
- The controller enforces ownership checks for quiz upsert, publish, grading, and summaries.

### 10.3 Gaps

- The lesson page's AI-generated fallback quiz grades client-side and includes `correctAnswer` from the API (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:1616-1637`). This is acceptable for practice but should not count toward lesson completion.
- There is no embedded formative "knowledge check" concept; quizzes are only final assessments or AI practice.

---

## 11. Mobile Findings

- The mobile outline drawer is present and closable via backdrop or close button (`frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:1705-1735`).
- The layout stacks to a single column on small screens (`lg:grid-cols-12` with `lg:col-span-8` and `lg:col-span-4`).
- The video player uses `playsInline` and native controls, which generally support fullscreen on rotate.
- Touch targets for outline tabs and quiz options appear adequate but could be larger.
- **Gap:** There is no explicit landscape/fullscreen orchestration or quality selector for mobile.

---

## 12. Accessibility Findings

- `MotionConfig reducedMotion="user"` respects OS motion preferences.
- Headings and semantic HTML are mostly reasonable, but:
  - The quiz modal and mobile drawer do not manage focus (no focus trap or return focus).
  - The video player relies solely on native controls; keyboard shortcuts and transcript access are limited.
  - No `aria-live` region announces completion/progress changes.
- **Gap:** The transcript is not exposed to screen-reader users or as a text alternative.

---

## 13. Analytics Findings

- Analytics events are ingested at `/analytics/events` and stored in `analytics_events`.
- Event types include `LESSON_STARTED`, `LESSON_COMPLETED`, `QUIZ_STARTED`, `QUIZ_COMPLETED`, etc. (`shared/src/types/analytics.types.ts:1-25`).
- `LessonPlayer` fires `LESSON_STARTED` and `LESSON_COMPLETED`.
- **Gap:** There are no `VIDEO_PROGRESS` events at 25/50/75/complete, no `VIDEO_SEEK`, no `KNOWLEDGE_CHECK_*` events, and no funnel queries.
- **Critical bug:** `AnalyticsService.getLearnerProgressMetrics` reads from the stale `Progress` table and uses `e.course.lessons`, which is a wrong/missing relation (`backend/src/analytics/analytics.service.ts:491-540`). This dashboard is likely broken.

---

## 14. Performance Findings

- Course detail loads the entire course tree (instructor + modules + lessons) in one query. Acceptable for small courses; will not scale.
- `AnalyticsService.getCourseAnalytics` loads all events for a course into memory.
- `listDocuments` uses `FIND_IN_SET` on a JSON/text column instead of a normalized tag table or full-text index.
- `search` and `listModules` use `ILIKE`, which is PostgreSQL-specific and will fail on MySQL.
- No image optimization (`next/image`) observed for course/lesson covers.

### 14.1 Recommended indexes

- `lesson_progress(user_id, lesson_id, is_completed)` (covering index).
- `analytics_events(course_id, event_type, created_at)` for funnel queries.
- `quizzes(lesson_id, is_published)` (currently only `lesson_id`).

---

## 15. Security Findings

### 15.1 Confirmed issues

- **Authorization bypass on mutations:** `PATCH /courses/:id`, `DELETE /courses/:id`, `PATCH /lessons/:id`, `DELETE /lessons/:id`, `POST /lessons/reorder`, `POST /modules`, and `POST /modules/:id/lessons` only require a valid JWT; they do not verify ownership or role (`backend/src/courses/courses.controller.ts:53-62`, `backend/src/courses/lessons.controller.ts:9-24`, `backend/src/courses/modules.controller.ts:19-41`).
- **Duplicate `Enrollment` entity classes** can cause repository resolution bugs (`backend/src/courses/entities/enrollment.entity.ts`, `backend/src/enrollments/entities/enrollment.entity.ts`).
- **Wrong `Course.lessons` relation** may cause analytics and instructor queries to return incorrect data (`backend/src/courses/entities/course.entity.ts:99-104`).
- **Stale `progress` table** used by analytics/instructor dashboards while authoritative progress lives in `lesson_progress` (`backend/src/assessments/entities/progress.entity.ts`).
- **Lesson page does not call `checkLessonAccess`** before rendering content, so sequential rules are not enforced in the UI.
- **Progress endpoint does not verify enrollment** before creating a `lesson_progress` row.
- **SQL dialect bug:** `ILIKE` in MySQL queries (`backend/src/courses/courses.service.ts:644-650`, `backend/src/courses/courses.service.ts:193-210`).

### 15.2 Mitigated strengths

- Assessment answer keys are stripped from learner payloads.
- `LessonProgress` updates are clamped monotonically on the server.
- `recalculateEnrollmentProgress` recomputes course percent from completed lesson rows.
- `checkLessonAccess` correctly validates prerequisites on the backend.
- JWT auth is applied globally to sensitive endpoints.

---

## 16. Database Findings

- Two `Enrollment` entity classes map to the same `enrollments` table.
- Two progress tables exist: authoritative `lesson_progress` and unused `progress`.
- `Course.lessons` relation is typed as `Module[]` and duplicates `Course.modules`.
- `course_modules` join table is created but not loaded by the course-detail query.
- `lesson_progress` lacks position/resume columns.
- `quizzes` has no composite index on `(lesson_id, is_published)`.
- `analytics_events.course_id` is nullable and was added later.

---

## 17. API Findings

| Endpoint | Auth | AuthZ | Validation | Risk |
|----------|------|-------|------------|------|
| `GET /courses` | None | N/A | None | Public catalog; fine |
| `GET /courses/:id` | None | N/A | UUID validated | Fine |
| `POST /courses` | JWT | Missing | DTO | Any user can create courses |
| `PATCH /courses/:id` | JWT | Missing | DTO | Any user can update any course |
| `DELETE /courses/:id` | JWT | Missing | UUID | Any user can delete any course |
| `GET /courses/:courseId/lessons/:lessonId/access` | JWT | Enrollment/prereq | UUID | Good |
| `POST /courses/lessons/:lessonId/progress` | JWT | User only | watchPercent range | Does not verify enrollment |
| `GET /courses/lessons/:lessonId/progress` | JWT | User only | UUID | Good |
| `PATCH /lessons/:id` | JWT | Missing | Partial | Any user can edit lessons |
| `DELETE /lessons/:id` | JWT | Missing | UUID | Any user can delete lessons |
| `POST /lessons/reorder` | JWT | Missing | Body | Any user can reorder lessons |
| `POST /modules` | JWT | Missing | Body | Any user can create modules |
| `POST /modules/:id/lessons` | JWT | Missing | Body | Any user can add lessons |
| Assessment endpoints | JWT | Ownership checked | DTO | Good |

---

## 18. AI Readiness

- The AI companion chat exists and is throttled (`30 req/min`) (`backend/src/ai-companion/ai-companion.controller.ts:62-63`).
- Vector-store service and Pinecone integration exist (`backend/src/ai-companion/vector-store.service.ts`).
- **Gap:** The current chat does not retrieve lesson-specific context before answering; responses are not grounded in approved course content.
- **Gap:** No source citations or cost controls beyond a usage quota.
- Recommendation: implement RAG over transcripts, lesson content, and approved resources before expanding AI capabilities.

---

## 19. Benchmark Matrix

| Capability | Current LMS | Implementation Quality | Gap | Priority |
|------------|-------------|------------------------|-----|----------|
| Lesson navigation | Sidebar + prev/next | PARTIAL | No completed/locked state | P1 |
| Video player | Native + hls.js | PARTIAL | No resume, no progress sync, no speed/captions | P0 |
| Resume playback | None | MISSING | No `last_position_seconds` | P0 |
| Progress tracking | Server-authoritative on video end | PARTIAL | No partial progress, no throttling | P0 |
| Completion rules | Fields exist, manual unsupported | PARTIAL | UI missing for manual; no multi-condition | P1 |
| Knowledge checks | None embedded | MISSING | Only final/AI quizzes | P2 |
| Transcript | Stored but not shown | PARTIAL | No render, no click-to-seek | P1 |
| Notes | None | MISSING | No table, no UI | P2 |
| Resources | Stored but not shown | PARTIAL | Not rendered | P1 |
| Continue learning | /my-learning page | PARTIAL | Resume uses inaccurate heuristic | P1 |
| Prerequisites | Backend logic exists | PARTIAL | Not enforced in UI | P1 |
| Mobile | Responsive + drawer | GOOD | Could improve player/quality | P2 |
| Accessibility | Basic semantic HTML | PARTIAL | Focus, captions, ARIA gaps | P2 |
| Low bandwidth | HLS auto + carbon cap | PARTIAL | No quality selector, no image opt | P2 |
| Analytics | Events ingestion | PARTIAL | No funnel, broken learner metrics | P2 |
| Time tracking | None | MISSING | No heartbeat/idle detection | P2 |
| AI readiness | Chat + vector store | PARTIAL | Not RAG-grounded | P3 |
| Performance | Acceptable for small catalogs | PARTIAL | Scaling issues, ILIKE bug | P2 |
| Security | JWT + answer hiding | PARTIAL | Authorization bypasses, duplicate entities | P0 |
| Error recovery | Generic toasts | PARTIAL | No structured logs or retry UX | P1 |

---

## 20. Recommended Target Architecture

See `LESSON_ENGINE_ARCHITECTURE.md` for the full target architecture, data flows, and migration plan.

Summary:

- Keep `Course → Module → Lesson`.
- Make `Lesson` a container of ordered `LearningBlock`s (backfilled from existing lessons).
- Introduce `CompletionRule` per lesson.
- Extend `lesson_progress` with `last_position_seconds`, `watched_seconds`, `active_seconds`.
- Add `LearnerNote` table.
- Consolidate progress reads on `lesson_progress`; remove the stale `progress` table after data audit.
- Remove the duplicate `Enrollment` entity and the wrong `Course.lessons` relation.

---

## 21. Prioritized Roadmap

See `TODO.md` for detailed tasks. High-level order:

1. **P0 — Stabilize:** fix duplicate `Enrollment`, wrong `Course.lessons`, broken `CoursesService` tests, and mutation authorization.
2. **P0/P1 — Progress reliability:** add throttled video progress saves and resume position.
3. **P1 — Learner orientation:** enforce sequential access, show real sidebar state, improve "Continue Learning".
4. **P1 — Complete the loop:** manual completion button, render resources/transcripts, add observability logs.
5. **P2 — Enhance learning:** knowledge checks, notes, accessibility, mobile polish, low-bandwidth mode, active time.
6. **P3 — Advanced:** RAG-grounded AI, funnel analytics, multi-block lessons, offline sync (blocked items).

---

## 22. Risks

- **Data migration risk:** Dropping the `progress` table or moving to `lesson_blocks` could lose data if not backfilled.
- **Authorization risk:** Until mutation endpoints are fixed, any authenticated user can modify courses/lessons.
- **Learner trust risk:** Lack of resume/partial progress can make learners abandon the platform.
- **Analytics reliability risk:** The `Progress` table and broken `Course.lessons` relation produce misleading dashboards.
- **AI risk:** Ungrounded AI answers can mislead learners.

---

## 23. Technical Debt

- Duplicate `Enrollment` entity classes.
- Duplicate `Progress` table.
- Wrong `Course.lessons` relation.
- `ILIKE` queries incompatible with MySQL.
- Dead/legacy `CoursePlayer.tsx` using `react-player`.
- `console.error` instead of structured logging.
- Sparse frontend test coverage.
- Courses service tests failing due to missing mock.

---

## 24. Quick Wins

1. Add a `LessonProgressRepository` mock to fix `courses.service.spec.ts`.
2. Add ownership checks to course/lesson/module mutation endpoints.
3. Render `resourceLinks` and `transcript` on the lesson page.
4. Call `checkLessonAccess` on lesson page load and show a locked state.
5. Add structured logging for progress/assessment failures.
6. Replace `ILIKE` with MySQL-compatible case-insensitive `LIKE`.

---

## 25. Evidence & Baseline Tests

- **Frontend type-check:** `npm run type-check` in `frontend/` passes (exit code 0).
- **Backend tests:** `npm run test -- --testPathPattern="(courses\.service|assessments\.service|assessments\.controller)"` — assessments pass, courses service fails with 14 errors due to missing `LessonProgressRepository` mock.
- **No `last_position_seconds`:** confirmed by reading `backend/src/courses/entities/lesson-progress.entity.ts`.
- **No periodic progress save:** confirmed by reading `frontend/src/components/LessonPlayer.tsx` and `frontend/src/pages/courses/[courseId]/lessons/[lessonId].tsx:699-707`.
- **Sidebar not using real progress:** confirmed by reading `frontend/src/components/ui/CourseKnowledgeSpine.tsx:109-165`.
- **Duplicate entities:** confirmed by reading `backend/src/courses/entities/enrollment.entity.ts` and `backend/src/enrollments/entities/enrollment.entity.ts`.
- **Authorization gaps:** confirmed by reading `backend/src/courses/courses.controller.ts:53-62`, `backend/src/courses/lessons.controller.ts`, `backend/src/courses/modules.controller.ts`.
