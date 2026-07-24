# Documentation

Documentation for the Herbert Chitepo School of Ideology digital learning platform, organized by topic.

## Structure

| Folder | Contents |
| --- | --- |
| [`overview/`](overview/) | High-level platform guides — complete guide, quick reference, quick start, hybrid training model |
| [`content/`](content/) | Course catalogs, certification pathways, program tracks, and content-authoring templates (lessons, assessments, video) |
| [`features/`](features/) | Feature and architecture documentation — [`ai/`](features/ai/), [`user-groups/`](features/user-groups/), security, progress tracking, color scheme |
| [`deployment/`](deployment/) | Deployment and hosting guides — VPS, simplified single-server setup, hosting comparison |
| [`setup/`](setup/) | Installation, database migration, and seeding instructions |
| [`testing/`](testing/) | Backend and frontend testing framework documentation |
| [`progress/`](progress/) | Implementation progress reports, phase/task completion records, and session summaries |
| [`todos/`](todos/) | Outstanding and historical TODO lists |
| [`pitches/`](pitches/) | Stakeholder and elevator pitches |

## Notes

Some documentation intentionally lives outside this folder, alongside the code or scripts it describes:

- **`deployment/` and `deploy/`** (repo root) — self-contained deployment toolkits; their `README.md`/`INDEX.md` link to sibling scripts.
- **`terraform/README.md`** — infrastructure module documentation.
- **`backend/src/database/seeds/course-content/*.md`** — seed content read at runtime by the seeding scripts; not documentation.
- **`README.md`** (repo root) — the project landing page.
