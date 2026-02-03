# Build-a-Jam - Claude Context

## Project Purpose

Build-a-Jam is both a **functional tool** and a **learning project**:
- **Primary goal**: Help improv performers find and organize warm-up exercises
- **Secondary goal**: Serve as a hands-on learning project for transitioning from Angular to React

## Target Platform

**Mobile-first design**: This app is primarily used on phones and tablets during
improv practice sessions. Design decisions should prioritize:
- Touch-friendly tap targets (no hover-dependent interactions as primary UX)
- Vertical space efficiency (every pixel counts on mobile)
- Simple, scannable layouts over information density
- Keyboard shortcuts are nice-to-have, not essential

When evaluating features, ask: "Does this help someone running a session on their phone?"

## Developer Context

**User background**: Experienced Angular developer learning React for job opportunities

**Learning approach**: The user learns best by:
- Building real features (not just reading concepts)
- Seeing Angular vs React pattern comparisons
- Understanding the "why" behind React's design decisions

**Topics covered so far**:
- JSX, components, props, state (`useState`)
- Events, lists, conditional rendering
- Lifting state up pattern
- `useEffect` (side effects, lifecycle, intervals)
- Forms and controlled components
- `useReducer` + Context for shared state management
- Custom hooks (`useTemplateSaver`, `useTheme`, `useExerciseFilter`)
- React Router (routes, params, navigation)
- localStorage persistence via async StorageProvider
- Third-party library integration (shadcn/ui, Radix UI, Sonner)
- Drag-and-drop with @dnd-kit (session queue reordering)
- Deployment pipeline (GitHub Actions → GitHub Pages)

**Next topics to explore**:
- `useRef`, `useMemo`, `useCallback` (performance optimization)
- Testing (React Testing Library, Vitest)

## Code Patterns & Conventions

### Component Structure
- **Functional components only** - no class components
- **TypeScript interfaces** for all props
- **Extensive comments** comparing Angular patterns to React equivalents
- **Descriptive variable names** - prioritize clarity over brevity

### File Organization
```
src/
├── components/
│   ├── ui/                      # shadcn/ui primitives (Button, Card, Badge, Dialog, AlertDialog, Sonner, TagButton)
│   ├── HomePage.tsx             # Exercise browsing (source filter, tag filter, search)
│   ├── PrepPage.tsx             # Session builder (add exercises, set durations, drag-and-drop reorder)
│   ├── SessionPage.tsx          # Active session (timer, current exercise, live queue editing)
│   ├── NotesPage.tsx            # Post-session reflections
│   ├── HistoryPage.tsx          # Past sessions with save-as-template
│   ├── FavoritesPage.tsx        # Starred exercises and saved templates
│   ├── CreditsPage.tsx          # Licensing & attribution display
│   ├── BottomNav.tsx            # Mobile bottom navigation bar
│   ├── Footer.tsx               # Site-wide footer (credits link, GitHub link)
│   ├── ExerciseCard.tsx         # Exercise card (shadcn Card + Badge)
│   ├── ExerciseList.tsx         # Exercise grid
│   ├── ExerciseFilterBar.tsx    # Source, tag, and text search filter controls
│   ├── ExerciseDetailModal.tsx  # Full exercise detail (Radix Dialog)
│   ├── ExerciseFormDialog.tsx   # Create/edit custom exercises (Radix Dialog)
│   ├── ExercisePickerDialog.tsx # Browse & add exercises mid-session (Radix Dialog)
│   ├── SessionQueuePanel.tsx    # Live session queue with drag-and-drop reorder
│   ├── ConfirmModal.tsx         # Destructive action confirmation (Radix AlertDialog)
│   └── TagFilter.tsx            # Tag chip filter with "show more"
├── context/
│   └── SessionContext.tsx       # Session state (useReducer + Context)
├── hooks/
│   ├── useExerciseFilter.ts     # Shared exercise filter pipeline (source, tag, search, sort)
│   ├── useTemplateSaver.ts      # Shared template-saving logic
│   └── useTheme.ts              # Light/dark theme toggle with localStorage
├── lib/
│   └── utils.ts                 # Utility functions (cn for className merging)
├── storage/
│   ├── StorageContext.tsx        # StorageProvider context + useStorage hook
│   └── local-storage.ts         # localStorage implementation
├── data/                        # Exercise data files (JSON + TS module + inferred-tags.json)
├── types.ts                     # Shared TypeScript types
├── App.tsx                      # Layout shell + route definitions + providers
└── main.tsx                     # Entry point (BrowserRouter lives here)
```

### State Management Philosophy
- Component-local state (`useState`) for UI concerns (tag filters, form inputs)
- `useReducer` + Context for shared workflow state (SessionContext)
- Async `StorageProvider` interface for persistence — localStorage today,
  Google Drive or other backends later
- No external state management library (Redux, Zustand) unless needed

### Styling Approach
- Tailwind CSS via `src/index.css` (PostCSS + autoprefixer)
- shadcn/ui for reusable primitives (Card, Badge, Dialog, AlertDialog, Sonner) — components live in `src/components/ui/`
- Light/dark theme via CSS custom properties + `useTheme` hook (`:root` = light, `.dark` = dark)

## Tech Stack Decisions

### Why React 19?
- Latest stable version with new features
- Modern hooks API is the standard
- Server Components available but not needed yet

### Why Vite over Create React App?
- Much faster dev server startup
- Better HMR (Hot Module Replacement)
- Lighter, more modern tooling
- CRA is no longer maintained

### Why TypeScript?
- User already familiar from Angular
- Catches errors early
- Better IDE support
- Industry standard for React apps

### Why Tailwind + shadcn/ui?
- Tailwind: utility-first, fast iteration, no separate CSS files to manage
- shadcn/ui: copy-paste component library (you own the code, can customize freely)
- Good balance of productivity and learning — no magic, just classes

## Development Workflow

### When adding new features:
1. **Explain the concept** - Compare to Angular equivalent
2. **Show the code** - Include inline comments
3. **Run and test** - Let user see it working
4. **Iterate** - Encourage experimentation

### Code comments should:
- Compare Angular patterns to React patterns
- Explain WHY React does things differently
- Link concepts to learning objectives
- Don't over-explain basic JavaScript/TypeScript

### Git commits should:
- Be descriptive about what was learned
- Include "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
- Atomic commits per feature/concept

### GitHub CLI (`gh`) setup

The `gh` CLI should be installed and available in PATH. It's used for
PR management, review comment workflows, and GraphQL API calls.

### Working with PR review comments

**Copilot auto-review**: This repo has GitHub Copilot configured to review PRs
automatically. Copilot comments should be triaged into categories: already
fixed, actionable (make the change), or dismiss with explanation.

**Replying to comments** (`gh api`):
- `POST /repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies` posts a reply
- Replies are attributed to the authenticated user (the repo owner), not a bot
- Replying does **not** resolve the thread — threads stay "unresolved" in the
  GitHub UI

**Resolving threads** (GraphQL):
- Use the `resolveReviewThread` mutation to mark threads as resolved
- First fetch thread IDs from review threads:
  `gh api repos/{owner}/{repo}/pulls/{pr}/threads`
  (thread IDs look like `PRRT_kwDORDVJ7s5sSJ8u`)
- Then resolve: `gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } } }'`
- Multiple threads can be resolved in a single batched mutation using aliases:
  `t1: resolveReviewThread(...) t2: resolveReviewThread(...)`

**Fetching unresolved threads** (GraphQL — preferred over REST):
- Always filter to **unresolved threads only** when checking PR reviews.
  The REST endpoint (`/pulls/{pr}/comments`) returns all comments with no
  resolved/unresolved filter. Use the GraphQL `reviewThreads` query instead:
  ```
  gh api graphql -f query='query {
    repository(owner: "ISmarsh", name: "build-a-jam") {
      pullRequest(number: PR_NUMBER) {
        reviewThreads(first: 100) {
          nodes {
            id isResolved
            comments(first: 1) { nodes { body path line } }
          }
        }
      }
    }
  }'
  ```
- Filter the result for `isResolved: false` to get only unresolved threads.

**Replying to comments — escaping pitfalls**:
- The `-f body=` value is parsed by the shell. Backticks, double quotes,
  backslashes, and `$` all cause issues.
- **Avoid backticks** in reply text. Use plain-English descriptions instead of
  inline code formatting (e.g., "the ring token" not `` `ring` ``).
- To get comment database IDs (needed for the REST reply endpoint), include
  `databaseId` in the GraphQL query on comment nodes.
- Use the GraphQL `comments(first: 1) { nodes { databaseId } }` field to get
  numeric IDs, then reply via
  `gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies -f body="..."`.

**Typical PR review workflow**:
1. Fetch unresolved threads (GraphQL) → triage comments
2. Fix actionable items in code
3. Reply to each comment (explain fix or dismissal reason)
4. Resolve all threads via batched GraphQL mutation
5. Commit and push fixes

### Merging PRs

- **Always use merge commits** (`gh pr merge --merge`), not squash or rebase.
- The user prefers preserving individual commit history in the main branch.
- Never use `--squash` or `--rebase` unless the user explicitly requests it.

### PR wrap-up checklist

**Automated checks (CI handles these):**
- Build, lint, and tests — runs on every push via GitHub Actions
- Accessibility audit — Playwright + axe-core runs in CI, fails on violations

**While CI is running:** Check for Copilot review comments. Copilot typically
posts reviews within a minute of pushing, so triage can happen in parallel
with CI. This is a good use of waiting time.

**If Copilot doesn't review the latest commit:** A ruleset should auto-trigger
Copilot reviews, but it sometimes skips commits (especially smaller changes or
rapid pushes). When checking for reviews, if the latest commit hasn't been
reviewed, **prompt the user** to manually trigger via GitHub UI: PR page →
Reviewers section (right sidebar) → click the gear icon → select
"copilot-pull-request-reviewer". The `gh` CLI doesn't support this.

**Manual checks (ask user before running — expensive in context):**

1. **Triage Copilot review comments** — Copilot auto-reviews PRs. Fetch
   unresolved threads and categorize:
   - **Fix**: Real bugs (logic errors, missing edge cases in new code)
   - **Dismiss**: Stylistic preferences, over-engineering (e.g., "capitalize
     this hardcoded string dynamically"), or suggestions for pre-existing code
     not changed in the PR
   - **Already fixed**: Issues addressed by other commits

   Common dismissals: unnecessary useCallback wrapping, dependency array
   pedantry for stable React setState, suggestions to add complexity for
   hypothetical future cases. See "Working with PR review comments" above.

   **IMPORTANT**: Always read every comment before resolving. Never batch-resolve
   threads without inspection — Copilot occasionally finds real bugs, and skipping
   review risks merging broken code.

   **Present dismissals for approval**: Before posting dismissal replies and
   resolving threads, present the proposed dismissals to the user for review.
   The user may disagree with a dismissal or want to handle it differently.
   Only post replies and resolve after user approval.

2. **Review all markdown** — check README.md, CLAUDE.md, and
   scripts/SCRAPING-GUIDE.md for accuracy. Verify file listings, pipeline
   descriptions, and project structure match the current codebase.
3. **Check for code duplication** — scan for duplicated logic across
   components. Extract when a pattern appears **3+ times** AND reduces actual
   code (strings, logic, boilerplate) — not just semantic renaming. Good:
   `confirmRemove()` consolidates duplicate message strings. Bad: a hook that
   just wraps `useState` with no reduction in code. Don't over-abstract for
   2 instances.
4. **Check for obsolete code** — look for unused imports, dead functions,
   stale comments, or references to removed features.

A simple "Want me to run the wrap-up checks (Copilot review, markdown review,
duplication scan, dead code check)?" is enough before starting these tasks.

## Important Context

### This is a learning project
- **Prioritize educational value** over production optimization
- **Add comments liberally** - they're teaching tools
- **Show alternatives** - mention different ways to solve problems
- **Encourage experimentation** - suggest modifications user could try

### Application flow

The app follows a three-stage **Prep → Session → Notes** structure that mirrors
how an actual improv practice session works.

**Routes:**
| Path | Component | Purpose |
|---|---|---|
| `/` | `HomePage` | Browse/filter exercise library |
| `/prep` | `PrepPage` | Build a session queue |
| `/session/:id` | `SessionPage` | Run through exercises with timer |
| `/notes/:id` | `NotesPage` | Post-session reflections |
| `/favorites` | `FavoritesPage` | Starred exercises and saved templates |
| `/history` | `HistoryPage` | Past completed sessions |
| `/credits` | `CreditsPage` | Licensing & attribution |

**1. Prep Screen** (`/prep`)
- Add exercises from the library to a session queue
- Set duration per exercise (duration lives on `SessionExercise`, not on
  `Exercise` — the same exercise can be 5 min or 15 min depending on context)
- Add breaks between exercises
- Drag-and-drop reorder via @dnd-kit
- See total session time estimate
- Save session as template (reusable from Favorites page)

**2. Session Screen** (`/session/:id`)
- Current exercise name and instructions displayed prominently
- Timer counting up with target duration
- "Next Exercise" button to progress through the queue
- Progress bar (e.g. "Exercise 3 of 7")
- Pause/resume functionality
- Collapsible queue panel with live editing (add, remove, reorder, add breaks)

**3. Notes Screen** (`/notes/:id`)
- List of exercises that were run
- Free-text area for post-session reflections (what worked, what didn't)
- Save to session history (persisted in localStorage)
- Future: star rating, "worked well" / "need to revisit" tags

**State management:** SessionContext (`useReducer` + React Context) holds the
current session, exercise queue, and history. All state persists to localStorage
via an async `StorageProvider` abstraction (can be swapped for Google Drive
or other backends later).

### Data model

See `src/types.ts` for the full type definitions. Key types:

- **`Exercise`** — library item: name, tags, description, optional
  `alternativeNames`, `isCustom` flag. No duration (that's context-dependent).
  IDs are prefixed by source (e.g. `learnimprov:zip-zap-zop`,
  `improwiki:new-choice`, `custom:my-exercise-a1b2`).
- **`SessionExercise`** — an exercise placed in a session queue with a
  duration, order, `slotId` (for drag-and-drop stability), and optional notes.
- **`Session`** — ordered list of `SessionExercise` items. Can be a one-off
  plan or a reusable template (`isTemplate`).
- **`CompletedSession`** — what actually happened, with post-session notes.

### Improv exercise context

Common tags for exercises (from source data, applied by `normalize-tags.mjs`):
- **warm-up** - Ice breakers, energy builders, group focus
- **environment** - Building physical locations/settings (the "Where")
- **object work** - Miming and interacting with individual imaginary objects
- **characters** - Character creation, physicality, voices
- **listening** - Agreement, "yes and", paying attention
- **teamwork** - Ensemble participation, group awareness, trust
- **problem-solving** - Teamwork and lateral thinking
- **accepting** - "Yes, and" — receiving and building on offers
- **focus** - Concentration, attention exercises

Inferred tags (curated in `src/data/inferred-tags.json`, applied by
`apply-inferred-tags.mjs`):
- **heightening** - Sequential amplification of a pattern; "do it again, but more"
- **grounding** - Making scenes feel real, justified, emotionally true; base reality
- **game of the scene** - Finding and playing the emergent comedic pattern (UCB concept)

### Future feature ideas
- Random exercise selector (fun utility feature)
- Import/export exercises (teaches file handling)
- Google Drive sync (teaches OAuth, async storage backends)
- Star ratings on completed exercises (teaches forms, data enrichment)
- "Worked well" / "need to revisit" tags on session notes

## Licensing

The project uses a **dual-license** structure:

- **Application code** (`.ts`, `.tsx`, `.mjs`, `.css`, configs): **MIT License** — see `LICENSE`
- **Exercise data** (`src/data/*.json`): sourced from third parties under their own licenses — see `LICENSE-DATA`

The CC BY-SA ShareAlike obligation applies only to the exercise data, not to
the application code. Displaying CC BY-SA content in an app is a "collection",
not an "adaptation", so the app code stays MIT.

## Scraped Data & Attribution

Exercise data in `src/data/learnimprov-exercises.json` is scraped from
[learnimprov.com](https://www.learnimprov.com/) and licensed under
**[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**.

When working with this data you **must**:
- **Preserve attribution** — keep the `attribution` block in the JSON intact.
  Every exercise also carries a `sourceUrl` back to its original page.
- **Note changes** — each exercise JSON file has a single
  `attribution.modified` string (e.g. `"2026-01-31: Cleaned descriptions,
  normalized tags"`). The cleanup script regenerates this automatically.
  Before committing, review this field to make sure it accurately describes
  the transformations that were applied. If you made additional manual changes
  (e.g. rewrote descriptions, added summaries), update the string to reflect
  that.
- **ShareAlike** — any file that contains adapted material must remain under
  CC BY-SA 4.0 (or a compatible licence). Do not re-licence scraped content
  under a more restrictive terms.
- **Keep `LICENSE-DATA`** — the repo-level `LICENSE-DATA` file documents these
  obligations. Do not remove it.

Exercise data in `src/data/improwiki-exercises.json` is scraped from
[improwiki.com](https://improwiki.com/en) and licensed under
**[CC BY-SA 3.0 DE](https://creativecommons.org/licenses/by-sa/3.0/de/deed.en)**.
The same rules above (preserve attribution, note changes, ShareAlike) apply.
CC BY-SA 3.0 DE is forward-compatible with CC BY-SA 4.0.

**Disabled sources** (scraper scripts exist but are commented out in
`scrape-all.mjs` until licensing is resolved):
- **improvencyclopedia.org** — "free for non-commercial use", not an open
  license. Contact site owner before enabling.
- **ImprovDB** (github.com/aberonni/improvdb) — no LICENSE file in repo.
  Contact developer before enabling.

### Scraper scripts

Run `npm run scrape` to execute active scrapers via `scripts/scrape-all.mjs`.
Individual scrapers can also be run directly with `node scripts/<name>.mjs`.

| Script | Source | Output | Status |
|---|---|---|---|
| `scrape-learnimprov.mjs` | learnimprov.com | `learnimprov-exercises.json` | Active |
| `scrape-improwiki.mjs` | improwiki.com | `improwiki-exercises.json` | Active |
| `scrape-improvencyclopedia.mjs` | improvencyclopedia.org | `improvencyclopedia-exercises.json` | Disabled |
| `import-improvdb.mjs` | ImprovDB (GitHub) | `improvdb-exercises.json` | Disabled |

See `LICENSE-DATA` for full licensing details per source.

### Working with scraped data

See **[scripts/SCRAPING-GUIDE.md](scripts/SCRAPING-GUIDE.md)** for the complete
scraping reference: running scrapers, architecture, tag handling, inferred tags,
data quality checks, and adding new sources.

## Things to Avoid

- Don't add complex state management too early
- Don't over-engineer - keep it simple
- Don't skip explaining concepts that differ from Angular
- Don't use class components (unless specifically teaching them)
- Don't add dependencies without explaining why
- Don't sacrifice clarity for brevity in teaching comments

## Things to Emphasize

- Functional programming concepts
- React's unidirectional data flow
- How React differs from Angular's two-way binding
- Why immutability matters
- Component composition patterns
- Hooks and their rules

## Communication Style

When working with this user:
- Be encouraging but not over-the-top
- Technical and clear
- Compare to Angular when relevant
- Explain design decisions
- Suggest experiments they could try
- Balance teaching with doing

## Questions to Ask

When user requests a feature, consider asking:
- "Would you like me to explain the concept first, or dive straight into code?"
- "Want to see the Angular equivalent of this pattern?"
- "Should we refactor this later, or is it good enough for learning?"

## Success Metrics

User is learning well when they:
- Understand WHY React does things differently from Angular
- Can explain hooks and component patterns
- Feel confident experimenting on their own
- Start thinking in "React patterns"
- Build features independently

This is a journey from Angular to React proficiency. Keep it practical, hands-on, and fun!
