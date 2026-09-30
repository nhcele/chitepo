# Chitepo LMS — Product Design Redirection

> Senior product-design audit, information-architecture proposal, and design-system direction for the Chitepo School of Ideology / Mindelta learning platform.
>
> Status: Phases 1–3 + design-system foundation. Implementation is gated on approval of this document.

---

## 1. How to read this document

This is not a visual mock-up hand-off. It is a product-design strategy that defines:

1. What is wrong with the current experience and why it feels generic/AI-generated.
2. Who the users are and what they actually need to do.
3. A new information architecture organised around intent, not database tables.
4. A distinctive design language, type system, colour system, spacing system, and component grammar.
5. A screen-by-screen redesign concept.
6. A phased implementation plan that preserves existing functionality.

Nothing here is final pixel art. Every decision is open for discussion, but every decision has a reason.

---

## 2. Current application snapshot

### 2.1 Tech stack

- **Frontend**: Next.js 14 (pages router), React 18, TypeScript.
- **Styling**: Tailwind CSS 3.3, `@tailwindcss/forms`, `aspect-ratio`, `typography`.
- **Animation**: Framer Motion.
- **Icons**: Heroicons + Lucide.
- **Charts**: Chart.js via `react-chartjs-2`.
- **State/HTTP**: React Query, Axios.
- **Backend**: NestJS (`/backend/src`), shared DTOs in `/shared`.
- **Base path**: The app is deployed under a sub-path; raw `fetch('/api/...')` is patched in `_app.tsx`.

### 2.2 Existing surface area (screens that exist today)

| Area | File(s) | Notes |
|------|---------|-------|
| Auth | `pages/auth/login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`, `verify-email.tsx` | Generic Tailwind form card. |
| Marketing | `pages/index.tsx`, `about.tsx`, `blog.tsx`, `careers.tsx`, `contact.tsx`, `cookies.tsx`, `diaspora.tsx`, `enterprise.tsx`, `pricing.tsx`, etc. | Not inspected in depth for this audit. |
| Learner dashboard | `pages/dashboard.tsx`, `components/learner/LearningDashboard.tsx` | Two competing dashboard implementations. |
| Course catalogue | `pages/courses/index.tsx` | Heavy filtering, pathways, emoji categories. |
| Course detail | `pages/courses/[courseId]/index.tsx` | Not inspected in depth. |
| Course player | `pages/courses/[courseId]/learn.tsx`, `components/learner/CoursePlayer.tsx` | Dark video-player shell, generic controls. |
| Lesson page | `pages/courses/[courseId]/lessons/[lessonId].tsx` | Stand-alone lesson view. |
| Quizzes | `components/learner/QuizPlayer.tsx`, `components/instructor/QuizSystem.tsx` | Standard quiz UI. |
| Certificates | `components/learner/CertificateManagement.tsx`, `components/certifications/CertificationProgressTracker.tsx` | Certificate list + tracker. |
| Forums | `components/forums/*` | Forum list, thread, post views. |
| Instructor | `pages/instructor/dashboard.tsx` + many components | Analytics, course editor, lesson editor, student mgmt. |
| Admin | `pages/admin/*` (analytics, users, courses, settings, approvals, exports, etc.) | Admin shell + many CRUD screens. |
| Messaging | `components/messaging/MessagingInterface.tsx` | Chat-like interface. |
| Live classroom | `components/trainer/*`, `pages/classroom/join.tsx` | Trainer dashboard, presenter mode, live monitor. |
| RPL | `components/rpl/RPLApplicationForm.tsx` | Recognition of prior learning form. |
| Teams/enterprise | `components/teams/*` | Bulk license purchase, team registration. |
| AI companion | `components/learner/AILearningCompanion.tsx` | AI tutor/chat helper. |

### 2.3 Critical observation: two dashboards

`pages/dashboard.tsx` renders a simple stats grid + `TrackWidgets`, while `components/learner/LearningDashboard.tsx` is a tabbed (`overview`/`progress`/`achievements`/`ai-insights`) dashboard. They appear to target the same user and the same intent. This duplication is a design and maintenance risk. Consolidation is recommended.

---

## 3. Phase 1 — UX / UI audit

### 3.1 Executive diagnosis

The current interface looks AI-generated/template-driven because it relies almost entirely on off-the-shelf Tailwind patterns without a unifying point of view. The same visual formula is repeated regardless of content, hierarchy, or user intent.

### 3.2 Concrete evidence from the codebase

| Pattern | Frequency | Why it feels generic |
|---------|-----------|---------------------|
| `bg-white rounded-xl shadow-sm border border-gray-200 p-6` | 14 files | The default “white card with shadow” is the single most common AI-dashboard trope. Every section becomes a card, which flattens hierarchy. |
| `bg-white rounded-lg shadow p-6` | 52 files | Older variant of the same trope, used interchangeably with the `rounded-xl` version. Inconsistent radius scale. |
| `text-gray-900/700/600/500/400` | ~2,600 occurrences | The entire interface is painted in Tailwind’s default gray ramp. No ownable tonal range. |
| `font-family: 'Inter', system-ui, sans-serif` | Global default | Inter is a safe, invisible typeface. Safe is not distinctive. The brand currently has no typographic voice. |
| `bg-gradient-to-r from-... to-...` on categories/pathways | Course catalogue | Gradients are used decoratively on every category chip, pathway banner, and carbon badge. They compete rather than communicate. |
| `AcademicCapIcon`, `TrophyIcon`, `FireIcon`, `ClockIcon`, etc. | Every screen | Heroicons are used literally everywhere. Icons become visual noise because there is no iconography system or hierarchy. |
| `rounded-md` / `rounded-lg` / `rounded-xl` | Ubiquitous | Every interactive surface is rounded. There is no contrast between primary containers, buttons, and inputs. |

### 3.3 Screen-by-screen problems

#### Auth (`pages/auth/login.tsx`)

- **Generic structure**: centered card, logo, heading, form, social-login split, footer link.
- **Template copy**: “Sign in to your account”, “Or create a new account”, “Remember me”, “Forgot your password?” — language from a starter kit, not the product.
- **Visual flatness**: white card on gray-50 background, primary-600 button, gray-400 input icons. Identical to thousands of SaaS login pages.
- **Accessibility note**: the `Layout` component wraps the page, so the login screen still renders the public `Header` and `Footer`. On a focused task like authentication this adds distraction and escape routes that should be deliberately available but visually quiet.

#### Header (`components/Header.tsx`)

- **Navigation is product-centric, not task-centric**: Courses, My Courses, Instructors, Enterprise. It answers “where are the sections of the app?” not “what do I need to do next?”.
- **Visual inconsistency**: desktop nav uses `text-sm font-semibold`, mobile nav uses `text-base font-semibold` on rounded-lg rows — two different spatial languages.
- **Generic mobile drawer**: right-side slide-in with stacked links. No differentiated primary/secondary actions.

#### Footer (`components/Footer.tsx`)

- **Five-column link grid** is a standard marketing footer. Inside a learning application it is overkill and pushes the learning context off-screen.
- **Mixed metaphors**: `AcademicCapIcon` + “Chitepo” wordmark, then Twitter/LinkedIn/GitHub social links. GitHub is irrelevant for this product.

#### Dashboard (`pages/dashboard.tsx` + `components/learner/LearningDashboard.tsx`)

- **Card grid of four stats** is the textbook generic dashboard pattern. The numbers are not contextualised: “Total Events” is a backend metric, not a learning insight.
- **Duplicate course cards**: the same card pattern appears in Continue Courses, Recommended, and Recent Activity. The only difference is the button label.
- **Hidden hierarchy**: “Continue learning” — the single most important action — is buried inside a card grid instead of being the hero of the screen.
- **Progress as decoration**: a thin progress bar is dropped at the bottom of every card. It does not communicate momentum or next step.
- **AI-insights tab**: loaded on demand, but the tab label itself promises intelligence without defining what the learner should do with it.

#### Course catalogue (`pages/courses/index.tsx`)

- **Category chips use emoji + gradients**: each category is given a random gradient and emoji. This looks like a no-code template.
- **Information overload on first view**: categories, pathways, filters, search, tabs, benefits, and course grid all compete for attention.
- **Pathways are structured as long vertical curriculum lists**: the page shows every level of every pathway simultaneously, creating an intimidating wall of text.
- **Course cards repeat the same formula**: thumbnail, title, instructor, rating, students, button.

#### Course player (`components/learner/CoursePlayer.tsx`)

- **Dark video-player shell is the strongest existing screen**, but the controls are generic: play/pause, volume, speed, fullscreen, bookmark, share, settings — all visible at once.
- **Sidebar content is dense**: every module and every lesson is visible, with tiny icons, tiny text, and nested progress bars.
- **No reflection or next-step moment**: when a lesson finishes, the learner is left at the same screen.
- **Typography is too small for a learning context**: `text-xs` and `text-sm` dominate the sidebar.

#### Buttons (`components/ui/Button.tsx`)

- **Five variants** (primary, secondary, outline, ghost, danger) use a single `rounded-lg` shape. There is no visual grammar distinguishing a primary action, a destructive action, and a low-emphasis action beyond colour.
- **Focus ring is generic**: `focus:ring-2 focus:ring-offset-2` — Tailwind default.

### 3.4 Summary: why it feels AI-generated

1. **Repetitive card infection**: every piece of information is placed inside a white rounded card. Cards are used as a lazy grouping device rather than a meaningful container.
2. **Default Tailwind gray palette**: the interface borrows Tailwind’s neutral scale instead of owning a colour identity.
3. **Inter + rounded everything + heroicons**: the three cheapest signals of a modern SaaS template.
4. **Database-driven navigation and labels**: the IA mirrors backend entities (Courses, Lessons, Assessments) rather than learner verbs (Continue, Explore, Practice, Achieve).
5. **Decorative gradients and emoji**: colour is used to “make it look designed” instead of to communicate state or importance.
6. **No signature interaction or signature component**: nothing makes a learner think “this is Chitepo” after five minutes of use.

---

## 4. Phase 2 — Information architecture

### 4.1 User intents (task-based)

#### Learner intents

| Intent | Question the interface must answer | Current location | Proposed primary location |
|--------|--------------------------------------|------------------|---------------------------|
| Resume | “Where did I leave off?” | Dashboard | Dashboard hero |
| Discover | “What should I learn next?” | Courses page | Explore / pathways |
| Orient | “What is this course about and why should I care?” | Course detail | Course detail (editorial) |
| Focus | “How do I learn without distraction?” | Course player | Learning theatre |
| Check understanding | “Do I know this?” | Quiz player | Embedded knowledge checks + assessments |
| Reflect | “What did I just learn?” | Missing | Lesson completion moment |
| Prove | “What have I achieved?” | Certificates | Achievements / certificates |
| Connect | “Who can help me?” | Forums / messaging | Community |

#### Instructor intents

| Intent | Current | Proposed |
|--------|---------|----------|
| Create / update content | Course editor, lesson editor, quiz system | Studio |
| Understand learner progress | Analytics, student management | Learners |
| Engage | Messaging, forums, live classroom | Community / live sessions |
| Publish / review | Course publish workflow | Studio → Review |

#### Administrator intents

| Intent | Current | Proposed |
|--------|---------|----------|
| Manage users and roles | Users, role management | People |
| Ensure quality | Approval queue, compliance monitoring | Quality |
| Monitor platform health | Analytics, success metrics | Insights |
| Configure | Settings, document library | Settings |

### 4.2 New top-level navigation model

A single primary navigation bar organised by verbs, not nouns. Secondary items collapse into a “More” or account-based menu on desktop, and bottom navigation on mobile.

#### Learner nav (primary)

1. **Home** — personal dashboard, continue learning, today’s focus.
2. **Explore** — catalogue, pathways, search, recommendations.
3. **Learn** — current course(s) and lesson player (deep-link from Home/Explore).
4. **Achieve** — progress, certificates, badges, portfolio.
5. **Community** — forums, cohorts, messages, live sessions.

#### Instructor nav (primary)

1. **Home** — instructor dashboard, recent activity, to-dos.
2. **Studio** — course / module / lesson / quiz / assessment creation.
3. **Learners** — progress, submissions, communications.
4. **Community** — forums, live sessions, announcements.
5. **Analytics** — course performance, cohort insights.

#### Admin nav (primary)

1. **Overview** — platform health, urgent actions.
2. **People** — users, roles, cohorts, instructors.
3. **Content** — courses, approvals, document library.
4. **Quality** — compliance, monitoring, exports.
5. **Insights** — analytics, success metrics.
6. **Settings** — configuration, branding, integrations.

### 4.3 Consolidation decisions

- **Merge `pages/dashboard.tsx` and `components/learner/LearningDashboard.tsx` into a single Home screen**.
- **Move marketing pages (About, Blog, Careers, Contact) out of the authenticated app chrome** where possible, or demote them to footer-only on learning surfaces.
- **Unify course player and lesson page**: the standalone lesson page and the course player should share one “learning theatre” component.
- **Collapse multiple instructor analytics charts into a single Analytics hub** with tabbed context rather than separate cards for every metric.

---

## 5. Phase 3 — Design direction

### 5.1 Brand personality

The Chitepo platform teaches ideology, governance, leadership, and civic engagement. It must feel:

- **Authoritative but not authoritarian** — credible, well-researched, institution-grade.
- **Warm but not casual** — learning is serious, but the interface should be encouraging.
- **African and global** — locally rooted, internationally credible.
- **Adult** — not a game, not a startup dashboard.
- **Focused** — every screen has a clear primary intent.

### 5.2 Visual keywords

`editorial` · `institutional` · `warm` · `focused` · `structured` · `contemporary african` · `confident` · `clean`

### 5.3 Design principles (Do / Don’t)

| Do | Don’t |
|----|-------|
| Use colour to communicate state, hierarchy, and achievement. | Use colour purely for decoration. |
| Group related information with whitespace, alignment, and type hierarchy before reaching for a card. | Put every section inside a card. |
| Use one or two distinctive typefaces deliberately. | Default to Inter/Roboto everywhere. |
| Make progress visible and meaningful. | Show thin decorative progress bars on every card. |
| Design for the learner’s next action. | Mirror the database schema in navigation. |
| Use motion to communicate state, orientation, and progress. | Add bounce, fade, or slide “for delight”. |
| Surface empty states that explain what is missing and what to do. | Show “No data found.” |
| Use imagery and illustration with local context. | Use random Unsplash photos or stereotypical patterns. |
| Maintain strong contrast and focus states. | Rely on colour alone for meaning. |

### 5.4 Signature design language (3–5 recognisable characteristics)

1. **The Knowledge Spine** — a vertical connected rail that runs through course detail, module lists, lesson player, and learner progress. It makes the learning journey feel continuous and gives the product a unique spatial identity.
2. **Editorial type pairing** — a humanist or transitional serif for headings (knowledge, authority) paired with a clean sans-serif for UI and data. This is unusual for an LMS and immediately separates Chitepo from generic dashboards.
3. **Chamfered corners on primary containers, pill buttons only for primary CTAs** — instead of every element being rounded, the design uses subtle chamfered (clipped) corners on large surfaces and restrained rounding on buttons. This creates a crafted, institutional feel.
4. **Warm ink-on-dark learning theatre** — the lesson player uses a deep green/charcoal environment with warm gold/ochre accents for focus. This reduces eye strain, creates immersion, and makes the brand memorable.
5. **Achievement marks as typographic stamps** — certificates and milestones are rendered as clean typographic “stamps” or seals rather than generic badge cards.

### 5.5 Reference analysis (what to absorb, what to avoid)

#### From the XtraMile screenshots provided

**What to absorb:**

- **Singular dark environment for learning** — the deep green background unifies the hero, player, and lesson screens into one continuous product.
- **Large, editorial typography** — the hero mixes a high-contrast display treatment with restrained body copy. Hierarchy is unmistakable.
- **Custom container language** — the browser mock-up uses a distinctive curved top edge; the lesson screen uses a dashed “add content” panel. These are ownable shapes, not generic cards.
- **Focused lesson split** — left side = prompt/reflection, right side = action. This is a clear learning-psychology pattern.
- **Stats as bold singular numbers** — “98 % Completion Rates” is more impactful than a four-card stats grid.

**What to avoid:**

- The 3D mascot character. Chitepo’s context (adult political/ideological education) does not need a cartoon companion.
- Heavy reliance on gradient hero backgrounds for marketing sections.
- The “AI-driven” visual clichés (glowing particles, futuristic sheen).

#### From the Edulink / Green Moon references

- Use them as reminders that **asymmetric layouts, careful spacing, and unusual corner treatments** can make an educational site feel designed rather than assembled.
- Avoid copying specific hero compositions or colour palettes literally.

---

## 6. Phase 4 — Typography

### 6.1 Strategy

Typography must communicate authority and readability. The current `Inter` default will be replaced with a pairing that is still web-performant but ownable.

### 6.2 Options

#### Option A — Editorial (recommended)

- **Display / headings**: `Source Serif 4` (Google Fonts) or `Newsreader`.
- **Body / paragraphs**: `Spline Sans` or `DM Sans`.
- **UI / labels / data**: `DM Sans` or system-ui fallback.
- **Why**: A serif headline signals editorial quality and institutional credibility. The combination is contemporary and works for long reading sessions.

#### Option B — Modern institutional

- **Display / headings**: `Space Grotesk`.
- **Body / UI**: `Inter` but tightly configured (tighter tracking, stricter weights).
- **Why**: Geometric authority without being cold. Still widely legible.

#### Option C — Distinctive contemporary

- **Display / headings**: `Instrument Serif`.
- **Body / UI**: `Geist` or `Bricolage Grotesque`.
- **Why**: High personality; risk is that it can feel too fashionable for an ideological institution.

### 6.3 Recommendation

**Adopt Option A: Source Serif 4 + DM Sans.**

Reasons:

1. Serif headings are rare in LMS products — immediate differentiation.
2. Source Serif 4 is open-source, has excellent Latin character support, and renders well at display and subhead sizes.
3. DM Sans is warm, slightly geometric, and highly legible for UI text and body copy.
4. The pairing feels like a contemporary journal or policy publication, which matches the ideological/governance content.

### 6.4 Type scale (draft tokens)

All sizes in rem. Use a 1.25 major-third scale for display and 1.125 minor-third scale for UI.

| Token | Size | Line height | Letter spacing | Usage |
|-------|------|-------------|----------------|-------|
| `--font-display` | 3.5rem (56px) | 1.05 | -0.02em | Marketing hero, course purpose statement |
| `--font-title-1` | 2.5rem (40px) | 1.1 | -0.01em | Page titles, course name |
| `--font-title-2` | 2rem (32px) | 1.15 | -0.01em | Section headings |
| `--font-title-3` | 1.5rem (24px) | 1.25 | 0 | Card / panel titles |
| `--font-body-large` | 1.125rem (18px) | 1.6 | 0 | Lead paragraphs, lesson body |
| `--font-body` | 1rem (16px) | 1.6 | 0 | Default body text |
| `--font-body-small` | 0.875rem (14px) | 1.5 | 0 | Secondary descriptions, metadata |
| `--font-caption` | 0.75rem (12px) | 1.4 | 0.01em | Labels, timestamps, badges |
| `--font-ui` | 0.875rem (14px) | 1 | 0.01em | Buttons, tabs, navigation |

### 6.5 Responsive type

- Display drops from 3.5rem → 2.5rem → 2rem across desktop / tablet / mobile.
- Body remains 1rem on mobile for readability.
- Maximum paragraph width: `65ch` for body, `55ch` for lead text.

---

## 7. Phase 5 — Colour system

### 7.1 Current palette critique

The existing palette uses `#16a34a` (Tailwind green-600), `#FFC72C` (bright gold), `#DC2626` (Tailwind red-600), and `#1A1A1A`. These colours are taken directly from the Chitepo School of Ideology logo, but they are applied as generic Tailwind defaults rather than as a deliberate, ownable palette.

Issues:

- Green-600 is the most common “success” colour on the web; used everywhere it flattens hierarchy.
- Bright logo gold against white fails contrast for small text and feels decorative rather than purposeful.
- Red is used both for accents and errors — it cannot do both jobs.
- There is no dark surface scale; the player uses arbitrary `bg-gray-800`/`bg-gray-900` values.

### 7.2 Logo-informed palette

The new palette is anchored in the Chitepo logo colours — black, green, gold/yellow, and red — but refined so each colour has a single, clear job. The goal is to feel locally rooted (the logo) and globally credible (restrained, institutional).

| Logo colour | Refined UI role | Why |
|-------------|-----------------|-----|
| Black silhouette | Deep ink backgrounds + primary text | Authority, focus, contrast. |
| Green | Primary action, progress, success | Growth, learning, continuity. |
| Gold/yellow | Achievement, focus moments, accents | Excellence without decoration. |
| Red | Errors, urgent alerts only | Reserved so it carries weight. |

The refined values move away from Tailwind defaults while staying recognisably connected to the brand.

#### Primitives

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-ink-950` | `#0B1A13` | Deepest background, learning theatre |
| `--color-ink-900` | `#132921` | Elevated surfaces on dark mode |
| `--color-ink-800` | `#1C3830` | Secondary dark surfaces |
| `--color-forest-700` | `#1B5E3B` | Primary dark green (logo green, deepened) |
| `--color-forest-600` | `#227A4D` | Primary action, links |
| `--color-forest-500` | `#2E9A67` | Hover / emphasis |
| `--color-sage-400` | `#7FB8A8` | Muted accents |
| `--color-sage-200` | `#C5DDD5` | Borders, disabled |
| `--color-sage-100` | `#E6F1EE` | Light mode subtle backgrounds |
| `--color-cream-50` | `#FAF9F6` | Light mode page background |
| `--color-paper` | `#FFFFFF` | Cards / surfaces on light mode |
| `--color-ochre-500` | `#B8860B` | Primary accent / achievement (logo gold, muted) |
| `--color-ochre-400` | `#D4A020` | Hover / highlights |
| `--color-terracotta-600` | `#9C341F` | Urgency / errors (logo red, deepened) |
| `--color-terracotta-500` | `#B83D25` | Error actions |
| `--color-charcoal` | `#1A1A1A` | Primary text on light surfaces |
| `--color-stone` | `#5E5E5E` | Secondary text |
| `--color-pewter` | `#8A8A8A` | Muted text / placeholders |

#### Semantic colours

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-primary` | forest-600 | Primary actions, active navigation, progress |
| `--color-primary-hover` | forest-500 | Hover state |
| `--color-accent` | ochre-500 | Achievement, focus moments, premium labels |
| `--color-accent-hover` | ochre-400 | Hover on accent |
| `--color-success` | forest-600 | Completion, success states |
| `--color-warning` | ochre-400 | Attention, pending |
| `--color-error` | terracotta-600 | Errors, destructive actions |
| `--color-info` | sage-400 | Informational highlights |
| `--color-background` | cream-50 (light) / ink-950 (dark) |
| `--color-surface` | paper (light) / ink-900 (dark) |
| `--color-elevated` | sage-100 (light) / ink-800 (dark) |
| `--color-text` | charcoal (light) / cream-50 (dark) |
| `--color-text-muted` | stone (light) / sage-200 (dark) |
| `--color-border` | sage-200 (light) / ink-800 (dark) |

### 7.3 Light and dark mode

- **Marketing and catalogue screens** use the light palette (cream/paper) for openness and discovery.
- **Learning theatre** (course player, assessments, reading) defaults to the dark palette (ink/forest) to reduce eye strain and maintain focus.
- Users can toggle; system preference is respected.

### 7.4 Accessibility notes

- All text/background pairs must meet WCAG 2.1 AA (4.5:1 for body, 3:1 for large text).
- Ochre on cream is checked carefully; at small sizes it may need forest-700 instead.
- Error states are never communicated by colour alone; icons and text accompany them.

---

## 8. Phase 6 — Design system

### 8.1 Spacing system

Use a 4px base grid with a deliberately limited set of tokens to create rhythm.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight internal gaps, icon padding |
| `--space-2` | 8px | Inline icon + text pairs, compact rows |
| `--space-3` | 12px | Small component internal spacing |
| `--space-4` | 16px | Default component padding |
| `--space-5` | 24px | Section internal spacing |
| `--space-6` | 32px | Medium section gaps |
| `--space-7` | 48px | Major section breaks |
| `--space-8` | 64px | Page-section spacing |
| `--space-9` | 96px | Hero / landing section spacing |

### 8.2 Grid system

| Breakpoint | Width | Columns | Gutters | Notes |
|--------------|-------|---------|---------|-------|
| Desktop | 1280px max | 12 columns | 24px | Main app layout |
| Tablet | 768px–1279px | 8 columns | 24px | Sidebars collapse or stack |
| Mobile | < 768px | 4 columns | 16px | Single-column primary content |
| Reading column | 720px max | N/A | N/A | Lesson text, long-form content |
| Dashboard | 1024px max | 12 columns | 24px | Personalised home |

### 8.3 Radius system

Reduce the current “everything rounded” approach.

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0 | Tables, data rows, full-width containers |
| `--radius-small` | 4px | Inputs, small chips, tags |
| `--radius-medium` | 8px | Buttons, cards (when used), badges |
| `--radius-large` | 16px | Primary panels, modals |
| `--radius-chamfer` | custom clip-path | Hero surfaces, primary containers |

### 8.4 Shadow system

Shadows are used sparingly for elevation, not for every card.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | Default surfaces on cream/paper |
| `--shadow-small` | 0 1px 2px rgba(0,0,0,0.04) | Dropdowns, menus |
| `--shadow-medium` | 0 4px 12px rgba(0,0,0,0.08) | Modals, floating panels |
| `--shadow-large` | 0 12px 32px rgba(0,0,0,0.12) | Full-screen overlays, player chrome |

### 8.5 Component grammar

#### Navigation

- **Desktop**: horizontal verb-based tabs, active state = forest-600 underline + semibold, no background pill.
- **Mobile**: bottom tab bar with icons + labels for the four primary intents; “More” opens an account/secondary sheet.

#### Buttons

Reduce variants and give each one a clear job.

| Variant | Style | Use |
|---------|-------|-----|
| Primary | forest-600 fill, cream text, radius-medium | The one main action on a screen |
| Secondary | charcoal text, sage-200 border, transparent fill | Supporting actions |
| Text | forest-600 text, no border | Tertiary actions, inline links |
| Destructive | terracotta-600 fill, cream text | Delete, unenroll, irreversible |
| Accent (achievement) | ochre-500 fill, ink text | Certificate download, milestone |

#### Cards (use sparingly)

Cards are allowed only when:

- The content is a discrete object (a course, a certificate).
- The card will be reordered, filtered, or compared.
- There is a clear hover/focus interaction.

Default card: 1px border in `--color-border`, no shadow, radius-medium. Hover: subtle border colour shift, not lift-and-shadow.

#### Progress indicators

- **Knowledge Spine**: vertical line with nodes; completed = filled forest, current = filled ochre with pulse, future = empty sage-200.
- **Progress bar**: 4px height, forest-600 fill, sage-200 track. Used only inside the spine or compact rows.
- **Circular completion**: reserved for assessment/certificate moments, not dashboard stats.

#### Inputs

- Remove the left-side icon inside every input. It adds noise and reduces usable width.
- Use floating or top-left labels, 12px spacing, 8px radius.
- Error state = terracotta-600 border + inline text, not just red ring.

#### Badges

- Filled badges for statuses: `Active` (forest), `Pending` (ochre), `Completed` (forest), `Locked` (pewter on sage-100).
- No gradients, no emoji.

#### Empty states

Every empty state must contain:

1. What is missing (concrete).
2. Why it matters (motivation).
3. The primary action to fix it.

Example:

> **No certificates yet.**
> Complete a course to earn your first nationally recognised certificate.
> [Explore courses]

### 8.6 Iconography

- Replace the mixed Heroicons/Lucide set with a single, coherent set.
- **Recommendation**: `Lucide` for UI (clean, consistent stroke) + a small custom set for learning-specific concepts (module, assessment, reflection, certificate).
- Default stroke width: 1.5px.
- Use icons to reinforce, not replace, labels. No icon-only buttons except where standard (close, search toggle).

---

## 9. Screen-by-screen redesign concepts

### 9.1 Auth

**Current problem**: generic centered card on gray background.

**Redesign concept**:

- Split layout: left pane shows the product promise and a rotating contextual statement (e.g., “Continue your leadership journey”), right pane holds the form.
- Remove header/footer chrome from auth screens; keep a minimal logo and a link back to marketing.
- Form uses top-aligned labels, no leading icons, clear error messaging.
- Microcopy: “Welcome back” instead of “Sign in to your account”; “Start learning” instead of “Sign up”.

### 9.2 Learner Home (dashboard)

**Current problem**: competing dashboards, stats-card grid, buried continue action.

**Redesign concept**:

- **Hero zone**: greeting + one primary “Continue” block showing the active course, module, lesson, and exact next step. This is the single largest element on the screen.
- **Today’s focus**: if the learner has no active course, show a personalised recommendation with a clear CTA.
- **Learning spine summary**: a compact vertical rail showing the last three modules/lessons touched across all courses.
- **Secondary zones** (stacked vertically, not cards): Upcoming deadlines, Recent achievements, Recommended next.
- Remove the four-stat grid. Replace with one meaningful number if needed (e.g., “12 hours this month” or “3 lessons to your next certificate”).

### 9.3 Explore (course catalogue)

**Current problem**: emoji gradients, pathway wall, card overload.

**Redesign concept**:

- **Purpose statement at the top**: one sentence explaining what learners can find here.
- **Pathway switcher**: horizontal, minimal tabs for General, Officials, Diaspora, Youth, Women. Selecting a pathway filters the catalogue and reveals a concise “Pathway at a glance” panel.
- **Course list**: editorial rows instead of thumbnail grids for desktop. Each row = title, short outcome statement, duration, difficulty, progress if enrolled. Thumbnail only on hover/focus.
- **Search**: prominent but not dominant; search results replace the list with clear filtering chips.
- Remove emoji. Replace category icons with a single colour dot + label.

### 9.4 Course detail

**Current problem**: likely mirrors catalogue card patterns (not deeply inspected, but inferred from codebase consistency).

**Redesign concept**:

- **Course purpose header**: large title, one-line outcome, instructor, duration, difficulty.
- **Knowledge Spine in full**: vertical timeline of modules and lessons. Each node shows completion state, type icon, duration.
- **Outcome list**: 4–6 bullet outcomes, not a long description.
- **Requirements panel**: certificate eligibility, assessment rules, prerequisites — presented as a compact checklist.
- **Resources**: collapsible list, not a card grid.

### 9.5 Learning theatre (course player / lesson)

**Current problem**: generic controls, dense sidebar, no reflection moment.

**Redesign concept**:

- **Immersive dark mode** by default.
- **Left rail (collapsible)**: Knowledge Spine with current module/lesson highlighted.
- **Main stage**: content-first. For video, a clean custom player with progressive disclosure of controls (play/pause, progress, volume, captions, speed, fullscreen). Controls fade after inactivity.
- **Right contextual panel** (collapsible on tablet/mobile): notes, transcript, resources, discussion. Only one open at a time.
- **Lesson completion moment**: when the learner finishes, the screen transitions to a reflection prompt or knowledge check before unlocking the next lesson. This answers “What did I just learn?” and creates a natural pause.

### 9.6 Assessments / quizzes

**Current problem**: standard quiz player.

**Redesign concept**:

- One question per screen, full focus.
- Clear progress position: “Question 3 of 12” + Knowledge Spine mini-rail.
- Feedback is contextual: correct answers reinforce with a brief explanation; incorrect answers explain why and link to the relevant lesson.
- Results screen shows strengths, gaps, and a recommended review path, not just a score.

### 9.7 Certificates / achievements

**Current problem**: certificate list as a bordered card with download buttons.

**Redesign concept**:

- **Certificate as a typographic seal**: large preview, title, issue date, serial number, verification link.
- **Achievement wall**: grid of earned marks, each rendered as a stamp with a short story (“Completed first course”, “Maintained a 7-day streak”).
- **Share action**: secondary, non-intrusive.

### 9.8 Community / forums

**Current problem**: standard forum list.

**Redesign concept**:

- **Conversations, not forums**: surface active cohort discussions, instructor announcements, and Q&A threads.
- Thread list shows avatars, topic, last reply, and reply count as a clean timeline, not card rows.
- Post view uses a reading-width column with nested replies indented via the Knowledge Spine visual language.

### 9.9 Instructor Studio

**Current problem**: multiple separate editors (course, lesson, quiz) and many stat cards.

**Redesign concept**:

- **Studio as a single editing environment** with a clear left sidebar: Content (courses/modules/lessons), Assessments, Learners, Analytics.
- **Editor uses progressive disclosure**: start with course purpose/outcomes, then add modules, then lessons, then assessments.
- **Analytics hub**: one primary chart per view, with context, not a grid of four charts.

### 9.10 Admin

**Current problem**: many separate admin pages that mirror backend tables.

**Redesign concept**:

- **Overview first**: what needs attention today (pending approvals, at-risk learners, system alerts).
- **Task-oriented hubs**: People, Content, Quality, Insights, Settings.
- **Tables**: clean, zebra-free, with clear row actions and batch selection.

---

## 10. Phase 8 — Interaction and motion principles

### 10.1 Animation rules

- **Default duration**: 200ms for micro-interactions, 300ms for panel transitions.
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` for standard transitions; `cubic-bezier(0.34, 1.56, 0.64, 1)` only for achievement moments.
- **No arbitrary entrance animations** on scroll. Content should be stable.
- **Respect `prefers-reduced-motion`** (already present in `_app.tsx` via `MotionConfig reducedMotion="user"`).

### 10.2 Purposeful interactions

| Moment | Motion | Purpose |
|--------|--------|---------|
| Lesson completion | Ochre node fills on Knowledge Spine; next node pulses gently. | Communicate progress and unlock. |
| Module transition | Main stage slides 16px horizontally; spine updates. | Maintain orientation in the journey. |
| Continue hover | Button fill shifts; subtle arrow translates 4px right. | Indicate forward momentum. |
| Search open | Overlay fades in; search bar scales from top. | Focus attention on search. |
| Achievement earned | Stamp scales up with slight bounce, then settles. | Celebrate without distraction. |
| Tab switch | Underline slides to active tab. | Show relationship. |
| Skeleton loading | Subtle shimmer on content area, not bouncing cards. | Reduce perceived wait. |

---

## 11. Mobile strategy

### 11.1 Navigation

- Bottom tab bar for Home, Explore, Learn, Achieve, Community.
- Account and secondary actions move to a top-right sheet.
- No hamburger drawer for primary navigation.

### 11.2 Course player

- Full-screen video by default; rotate to landscape auto-expands.
- Knowledge Spine becomes a bottom sheet accessed via a “Contents” button.
- Controls are thumb-reachable: play/pause and progress centred bottom, captions and speed in an overflow menu.

### 11.3 Quizzes

- One question per screen, swipe-able.
- Large touch targets for options (min 48px).
- Submit button fixed at bottom.

### 11.4 Offline considerations

- Indicate downloadable content with a clear icon.
- Show offline state in the player rather than a generic error.

---

## 12. African / local design integration

### 12.1 Approach

The product is Zimbabwean. The design should feel locally rooted without using stereotypical patterns or decorative “Africanisation”.

### 12.2 Direction

- **Colour**: the deep forest green and ochre gold echo Zimbabwean landscapes (miombo woodlands, savanna grasslands, soil) and are globally credible.
- **Typography**: consider commissioning or licensing a contemporary African typeface for display use later (e.g., a typeface designed by an African foundry). Until then, Source Serif 4 + DM Sans provides a neutral, high-quality foundation.
- **Imagery**: use locally shot photography of learners, educators, and institutions. Avoid generic Unsplash office stock.
- **Language**: allow Shona and Ndebele localisation paths in the design system from day one (rtl/translation-safe spacing, no fixed widths on buttons).
- **Narrative**: frame achievements in terms of contribution to community and nation, not just individual gamification.

### 12.3 What to avoid

- Generic “tribal” geometric patterns as background decoration.
- Earth-tone clichés.
- Safari animals or drums as metaphor.
- Maps as decoration.

---

## 13. Accessibility requirements

1. **Contrast**: all text/background combinations meet WCAG AA. Ochre on light surfaces checked carefully.
2. **Keyboard**: full keyboard navigation through the Knowledge Spine, tab bars, and modal traps.
3. **Focus**: visible 2px outline in `--color-ochre-500` on dark surfaces and `--color-forest-600` on light surfaces.
4. **Screen readers**: landmark regions, headings in logical order, aria-current for active spine node, aria-live for achievement announcements.
5. **Touch targets**: minimum 44×44dp, ideally 48×48dp.
6. **Video**: captions toggle, transcript panel, playback speed, keyboard shortcuts.
7. **Reduced motion**: honour system preference; no autoplaying decorative motion.
8. **Forms**: associate labels, inline errors, no colour-only error indication.

---

## 14. Implementation plan (Phase 9)

### 14.1 Preserve functionality

Before writing new components, map every existing user-facing function to its redesigned location.

| Current function | Current location | User | Redesigned location | Redesigned experience |
|------------------|------------------|------|---------------------|------------------------|
| Sign in / sign up | `auth/login.tsx`, `auth/register.tsx` | Public | Split auth screen | Form + product promise side-by-side. |
| View learner dashboard | `dashboard.tsx`, `LearningDashboard.tsx` | Learner | Home | Unified, action-first dashboard. |
| Browse courses | `courses/index.tsx` | Learner | Explore | Editorial list, pathway switcher. |
| View course detail | `courses/[courseId]/index.tsx` | Learner | Course detail | Knowledge Spine, outcomes, requirements. |
| Play lesson | `courses/[courseId]/learn.tsx`, `CoursePlayer.tsx`, `lessons/[lessonId].tsx` | Learner | Learning theatre | Single immersive player, reflection moment. |
| Take quiz | `QuizPlayer.tsx` | Learner | Assessment | One question per screen, contextual feedback. |
| View certificates | `CertificateManagement.tsx` | Learner | Achieve | Seal-based certificate view. |
| Create course | `CourseEditor.tsx` | Instructor | Studio → Content | Progressive course builder. |
| Create lesson | `LessonEditor.tsx` | Instructor | Studio → Content | Inline lesson authoring. |
| Create quiz | `QuizSystem.tsx` | Instructor | Studio → Assessments | Question builder. |
| View analytics | `AnalyticsChart.tsx`, `CoursePerformanceChart.tsx`, `InstructorStatsCard.tsx` | Instructor / Admin | Analytics hub | One primary chart per view. |
| Manage users | `admin/users.tsx`, `role-management.tsx` | Admin | People hub | Task-oriented user management. |
| Approve content | `admin/approval-queue.tsx` | Admin | Quality hub | Approval checklist. |
| Forums | `forums/*` | All | Community | Conversation-first timeline. |
| Messaging | `MessagingInterface.tsx` | All | Community → Messages | Integrated messaging. |
| Live classroom | `trainer/*` | Instructor / Learner | Community → Live | Presenter + learner views. |

### 14.2 Token-first implementation order

1. **Design tokens** (`frontend/src/styles/tokens.css` or extend Tailwind theme):
   - Colours, typography, spacing, radius, shadows.
2. **Global styles**: replace `globals.css` defaults; remove generic `.course-card` and `.carbon-savings` gradients.
3. **Typography**: load Source Serif 4 + DM Sans via `next/font/google`.
4. **Primitive components** (in `components/ui/`):
   - Button, Input, TextArea, Select, Badge, Spinner, Skeleton, Alert.
5. **Navigation components**:
   - TopNav, BottomNav, KnowledgeSpine, Breadcrumbs.
6. **Composite screens** (one at a time):
   - Auth → Home → Explore → Course detail → Learning theatre → Assessment → Achievements.
7. **Instructor / Admin** after learner surfaces are stable.

### 14.3 Technical guardrails

- No page-specific CSS hacks. All styling flows from tokens + utility classes.
- Use `clsx`/`tailwind-merge` consistently for conditional classes.
- Keep backend/API compatibility. Visual changes only; no API rewrites unless explicitly requested.
- Add or update tests for every redesigned component.
- Maintain existing base-path support.

---

## 15. Priority roadmap

### Critical (do first)

1. Consolidate the two learner dashboards into a single Home screen.
2. Establish design tokens and replace the default Tailwind gray palette.
3. Replace Inter with Source Serif 4 + DM Sans.
4. Redesign auth screens to remove generic card pattern.
5. Introduce the Knowledge Spine component and use it on course detail + player.

### High

6. Redesign the course catalogue (Explore) with editorial rows and pathway switcher.
7. Refactor course player into the Learning Theatre (dark mode, progressive controls, reflection moment).
8. Redesign primary button set and remove rounded-everywhere.
9. Implement accessible focus states and colour-contrast fixes.
10. Replace decorative gradients and emoji in categories/pathways.

### Medium

11. Redesign quiz/assessment experience.
12. Redesign certificates and achievements as stamps.
13. Refactor instructor Studio around progressive disclosure.
14. Refactor admin hubs around task-oriented navigation.
15. Standardise iconography on Lucide + a small custom learning set.

### Low

16. Custom chamfered-corner containers on marketing surfaces.
17. Local photography direction and asset production.
18. Commission or license a custom African display typeface.
19. Advanced micro-interactions (lesson transitions, achievement bounces).
20. Dark-mode marketing pages.

---

## 16. What I need from you before implementation

1. **Confirm the design direction** — particularly the dark learning theatre and the editorial serif choice.
2. **Confirm brand colour constraints** — must the existing green/gold/red be preserved exactly, or can we move to the proposed forest/ochre/terracotta family?
3. **Prioritise a starting screen** — recommended: Home (dashboard) + Knowledge Spine, but I can start with auth if login is the highest-friction entry point.
4. **Localisation scope** — is Shona/Ndebele support required in this phase?
5. **Approval to create the token/component foundation** — I will not touch existing screens until the token layer is approved.

No code will be changed until you confirm direction and priority.
