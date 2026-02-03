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
2. **Review all markdown** — check README.md, CLAUDE.md, and
   scripts/SCRAPING-GUIDE.md for accuracy. Verify file listings, pipeline
   descriptions, and project structure match the current codebase.
3. **Check for code duplication** — scan for duplicated logic across
   components that should be extracted into shared helpers or hooks.
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

### Working with exercise tags

**CRITICAL PRINCIPLE**: Always research domain-specific improv terminology before
making decisions about tags. Many terms that seem generic or meaningless are
actually established pedagogical categories.

**Before removing or renaming tags:**
1. **Research first** — Use WebSearch/WebFetch to look up the tag in context
   - Search: `improv "[tag]" exercises learnimprov improwiki`
   - Check: learnimprov.com, improwiki.com, improvencyclopedia.org
2. **Verify meaning** — Determine if it's a legitimate category or truly generic
3. **Document findings** — Add comments in cleanup scripts explaining the decision

**Examples of tags that seemed generic but were actually legitimate:**
- **"problem"** → "problem-solving" (learnimprov category for ensemble/teamwork exercises)
- **"less"** → "restraint" (learnimprov category for minimalist/simplicity-focused exercises)
- **"group"** → Keep as-is (ImprovWiki/Encyclopedia category for ensemble participation)

**Truly generic tags to remove:**
- **"exercise"** — Too broad, applies to almost everything
- **"game"** — Redundant (anything not tagged "warm-up" is implicitly a game)
- **"other"** — Not descriptive

**Tag normalizations** (consolidate variations):
- Singular/plural: prefer the form most commonly used in the data
- Verify both forms aren't distinct categories before consolidating

### Inferred tags

Some tags can't come from source data — they represent improv concepts that
exercises teach but that source sites don't categorize. These are curated in
`src/data/inferred-tags.json` and applied by `scripts/apply-inferred-tags.mjs`
as part of the post-processing pipeline.

**Current inferred tags:**
- **heightening** — Sequential amplification of a pattern. Indicators: each
  player amplifies the previous contribution, emotional intensity scaling,
  progressive escalation, "build on what came before" mechanics.
- **grounding** — Making scenes feel real and justified. Indicators: establishing
  base reality, justifying unusual choices, emotional truth, character depth,
  detailed physical environment creation.
- **game of the scene** — Finding and playing the emergent comedic pattern (UCB
  concept). Distinct from short-form "games" where rules are given externally.
  Indicators: pattern-building, "if this is true what else is true", organic
  emergence of comedy from base reality.

**Adding new inferred tags:**
1. Research the concept thoroughly (see heightening/grounding research above)
2. Define clear indicators and counter-indicators
3. Classify exercises by reading descriptions and summaries
4. Add the tag definition and exercise IDs to `inferred-tags.json`
5. Run `node scripts/apply-inferred-tags.mjs` to apply

**Inferred tags survive re-scraping** — they live in a separate file and are
merged into exercises after normalization runs. If an exercise ID is removed
from the data (e.g., filtered as non-exercise), the script warns about
missing IDs.

### Scraping architecture: raw data vs. processed data

**IMPORTANT**: Scrapers should cache raw HTML locally to avoid repeatedly hitting source sites during development and data processing.

**Two-phase approach:**

1. **Phase 1: Fetch raw HTML**
   - Cache raw HTML responses in a local directory (e.g., `scripts/.cache/`)
   - Store with timestamped filenames (e.g., `learnimprov-2026-01-31.html`)
   - Check cache before fetching from network
   - This allows re-processing data without re-scraping

2. **Phase 2: Extract and process**
   - Parse cached HTML to extract exercise data
   - Transform HTML structure to desired format (HTML or markdown)
   - Apply cleaning, normalization, and filtering
   - Output to `src/data/*.json`

**Benefits:**
- Respectful to source sites (fewer requests)
- Faster iteration when tweaking extraction logic
- Ability to compare different processing approaches
- Historical snapshots of source data

**Implementation notes:**
- Use conditional fetching: check if cache exists and is recent (e.g., < 24 hours old)
- Add `--force-refetch` flag to bypass cache when needed
- Include cache directory in `.gitignore` (raw HTML shouldn't be committed)
- Document cache location and format in scraper comments

**Approach: Store both raw and cleaned HTML**
- `description_raw`: Complete original HTML from source page (preserve everything)
- `description`: Cleaned HTML - remove scripts, dangerous attributes, license footers, navigation
- Render cleaned HTML with safe HTML renderer (dangerouslySetInnerHTML + sanitization, or DOMPurify)
- Do NOT convert to markdown or plain text - preserve HTML structure
- This allows re-processing without re-scraping, and avoids HTML→markdown→HTML roundtrip

### Post-scraping workflow

The scraping workflow is fully automated via `scripts/scrape-all.mjs`:

1. **Run all scrapers**: `npm run scrape`
   - Fetches (or uses cached) HTML from source sites
   - Extracts exercise data and writes to `src/data/*.json`
   - Automatically runs post-processing scripts:
     - `normalize-tags.mjs` — removes whitespace, deduplicates, filters low-use tags
     - `apply-inferred-tags.mjs` — merges curated tags from `inferred-tags.json`
     - `cleanup-scraped-data.mjs` — removes noise sections, license footers;
       reports how many exercises are missing summaries

2. **Commit changes**: Document what was scraped/updated in the commit message

**Individual scripts** can be run separately during development:
- `node scripts/scrape-learnimprov.mjs` — scrape learnimprov.com
- `node scripts/scrape-improwiki.mjs` — scrape improwiki.com
- `node scripts/normalize-tags.mjs` — re-normalize tags from `rawTags`
- `node scripts/apply-inferred-tags.mjs` — apply inferred tags
- `node scripts/cleanup-scraped-data.mjs` — re-clean descriptions

**Summaries:** Generated on-demand by Claude, not by a script. After scraping,
the cleanup script reports how many exercises are missing summaries. To fill
them in, ask Claude to read the exercise JSON files and populate empty `summary`
fields. Summaries should be 1-2 sentences (max ~150 characters), focus on what
the exercise does (not how), and use active, descriptive language.
- Good: "Fast-paced name game building focus and energy through rapid-fire pointing"
- Bad: "A game where you point at people and say names"

### Data quality checks

When reviewing scraped data, watch for:

**Non-exercise content (EXCLUDE ENTIRE ENTRY):**
- Improv groups, theaters, or organizations (not exercises at all)
- Tutorial articles or blog posts
- General improv theory/philosophy
- **Action:** Filter out by checking tags like "improv groups", "theater", "theatre"
- **Where:** `scrape-improwiki.mjs` filters entire entries before adding to dataset

**Unhelpful tags (REMOVE TAG ONLY, KEEP EXERCISE):**
- "other" — too generic to be useful for filtering
- "exercise" — redundant (everything is an exercise)
- "game" — too broad (use more specific tags instead)
- Tags used by fewer than 3 exercises (noise)
- **Action:** Strip these tags from exercises, but keep the exercises themselves
- **Where:** `normalize-tags.mjs` removes blacklisted tags + low-usage tags

**Missing or low-quality content:**
- Empty descriptions
- Descriptions that are just the title repeated
- License footers or site navigation scraped as content
- **Filter in cleanup-scraped-data.mjs** (removes noise sections)

**Duplicates:**
- Same exercise under different names
- Check `alternativeNames` field for known synonyms
- **Handle manually** if discovered (merge entries, update IDs)

### Scraper Documentation

See **[scripts/SCRAPING-GUIDE.md](scripts/SCRAPING-GUIDE.md)** for the
complete reference: how to run scrapers, architecture, adding new sources,
and the full pipeline.

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

## Current State

**What's built**:
- Exercise browsing with source filtering, tag filtering, and text search
- Exercise detail modals (Radix Dialog) with full HTML descriptions
- Custom exercise creation, editing, and deletion (persisted in localStorage)
- Prep → Session → Notes workflow with countdown timer
- Drag-and-drop session queue reordering via @dnd-kit (Prep and Session pages)
- Break items in session queues (Coffee icon, separate from exercise numbering)
- Live session queue editing (add/remove/reorder exercises mid-session)
- Favorites: star exercises, save session templates
- Session history with delete, clear, and save-as-template
- Confirmation modals (Radix AlertDialog) for destructive actions
- Toast notifications (Sonner) for user feedback
- Custom hooks (`useTemplateSaver`, `useTheme`, `useExerciseFilter`) for shared logic
- `useReducer` + Context for session state management
- localStorage persistence via async StorageProvider
- Scraped exercise data from learnimprov.com and improwiki.com
- Post-processing pipeline (tag normalization, description cleanup)
- Dual licensing: MIT for code, CC BY-SA for data
- Light/dark theme toggle with localStorage persistence via `useTheme` hook
- Responsive design, deployed to GitHub Pages via GitHub Actions (`deploy.yml`)
- Accessibility audit script (Playwright + axe-core, 28 page/theme/viewport combos)

**What's next**:
- Performance optimization (`useMemo`, `useCallback`)
- Testing (React Testing Library)

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
