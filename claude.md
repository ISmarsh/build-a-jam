# Build-a-Jam - Claude Context

## Project Purpose

Build-a-Jam is both a **functional tool** and a **learning project**:
- **Primary goal**: Help improv performers find and organize warm-up exercises
- **Secondary goal**: Serve as a hands-on learning project for transitioning from Angular to React

## Developer Context

**User background**: Experienced Angular developer learning React for job opportunities

**Learning approach**: The user learns best by:
- Building real features (not just reading concepts)
- Seeing Angular vs React pattern comparisons
- Understanding the "why" behind React's design decisions

**Current learning stage**: Just learned core React fundamentals:
- JSX, components, props, state
- Events, lists, conditional rendering
- `useState` hook
- Lifting state up pattern

**Next topics to cover**:
- `useEffect` (side effects, lifecycle)
- Forms and controlled components
- `useRef`, `useMemo`, `useCallback`
- Custom hooks
- React Router
- State management patterns
- Building portfolio-worthy features

## Code Patterns & Conventions

### Component Structure
- **Functional components only** - no class components
- **TypeScript interfaces** for all props
- **Extensive comments** comparing Angular patterns to React equivalents
- **Descriptive variable names** - prioritize clarity over brevity

### File Organization
```
src/
├── components/     # Presentational components
├── data/          # Data files (will move to API/storage later)
├── types.ts       # Shared TypeScript types
└── App.tsx        # Container component with state
```

### State Management Philosophy
- Start simple with component state (`useState`)
- Lift state up to common parent when needed
- Introduce Context API when prop drilling becomes painful
- Only add external state management (Redux, Zustand) if truly needed

### Styling Approach
- Plain CSS for now (in component-adjacent .css files)
- May migrate to CSS Modules or Tailwind later
- Prioritize learning React concepts over styling complexity

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

### Why not using CSS frameworks yet?
- Focus on React learning, not styling
- Can add Tailwind/MUI/styled-components later
- Plain CSS is good enough for learning

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
- Include "Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
- Atomic commits per feature/concept

## Important Context

### This is a learning project
- **Prioritize educational value** over production optimization
- **Add comments liberally** - they're teaching tools
- **Show alternatives** - mention different ways to solve problems
- **Encourage experimentation** - suggest modifications user could try

### Application flow

The app follows a three-stage **Prep → Session → Notes** structure that mirrors
how an actual improv practice session works.

**1. Prep Screen**
- Browse/filter exercises by tags
- Build a session by adding exercises to a queue
- Set duration for each exercise in the queue (duration lives on
  `SessionExercise`, not on `Exercise` — the same exercise can be 5 min or 15
  min depending on context)
- See total session time estimate
- Option to save/load session templates for recurring practices

**2. Session Screen**
- Current exercise name and instructions displayed prominently
- Timer counting down (or up, depending on preference)
- "Next Exercise" button to progress through the queue
- Progress indicator (e.g. "3 of 7 exercises")
- Pause/resume functionality
- Optional: quick notes field to jot observations mid-exercise

**3. Notes Screen**
- List of exercises that were run
- Free-text area for post-session reflections (what worked, what didn't)
- Optional: star rating or checkboxes for "worked well" / "need to revisit"
- Save notes for future reference

### Data model

See `src/types.ts` for the full type definitions. Key types:

- **`Exercise`** — library item: name, tags, description. No duration
  (that's context-dependent).
- **`SessionExercise`** — an exercise placed in a session queue with a
  duration and order.
- **`Session`** — ordered list of `SessionExercise` items. Can be a one-off
  plan or a reusable template (`isTemplate`).
- **`CompletedSession`** — what actually happened, with post-session notes.

### Improv exercise context

Common tags for exercises:
- **warmup** - Ice breakers, energy builders, group focus
- **scene** - Scene work, environment, object work, characters
- **game** - Short-form games, handles, performance structures
- **exercise** - General exercises, drills
- **connection** - Building ensemble, group awareness
- **structure** - Scene structure, narrative, game
- **heightening** - Escalating patterns, raising stakes
- **energy** - Physical warmth, pacing
- **focus** - Concentration, object work
- **listening** - Agreement, "yes and", paying attention

### Future feature ideas
- Session builder (teaches forms, controlled components, drag-and-drop)
- Search bar (teaches filtering, debouncing)
- Favorites (teaches localStorage, useEffect)
- Random selector (fun utility feature)
- Session timer (teaches useEffect, intervals)
- Templates/playlists (teaches data organization)
- Import/export exercises (teaches file handling)
- Post-session notes (teaches forms, persistence)

## Scraped Data & Licensing

Exercise data in `src/data/learnimprov-exercises.json` is scraped from
[learnimprov.com](https://www.learnimprov.com/) and licensed under
**[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**.

When working with this data you **must**:
- **Preserve attribution** — keep the `attribution` block in the JSON intact.
  Every exercise also carries a `sourceUrl` back to its original page.
- **Note changes** — if you edit, rewrite, or summarise a description, that
  counts as an adaptation. Add a note (e.g. `"modified": true`) so downstream
  consumers know the text has been changed.
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

Exercise data in `src/data/improvencyclopedia-exercises.json` is scraped from
[improvencyclopedia.org](https://improvencyclopedia.org/). No specific license
was found on the site. Each exercise entry includes a `sourceUrl` linking back
to the original page for attribution. If a license is later identified, update
`LICENSE-DATA` and the `attribution` block in the JSON accordingly.

Exercise data in `src/data/improvdb-exercises.json` is imported from the
[ImprovDB](https://improvdb.com/) open-source repository
([GitHub](https://github.com/aberonni/improvdb)) by Dom Gemoli. The project
describes itself as "open source and free to use" but no explicit LICENSE file
was found. Each entry includes a `sourceUrl` back to improvdb.com. If a license
is later identified, update `LICENSE-DATA` and the JSON `attribution` block.

### Scraper scripts

Run `npm run scrape` to execute all scrapers via `scripts/scrape-all.mjs`.
Individual scrapers can also be run directly with `node scripts/<name>.mjs`.

| Script | Source | Output |
|---|---|---|
| `scrape-learnimprov.mjs` | learnimprov.com | `learnimprov-exercises.json` |
| `scrape-improvencyclopedia.mjs` | improvencyclopedia.org | `improvencyclopedia-exercises.json` |
| `scrape-improwiki.mjs` | improwiki.com | `improwiki-exercises.json` |
| `import-improvdb.mjs` | ImprovDB (GitHub) | `improvdb-exercises.json` |

See `LICENSE-DATA` for full licensing details per source.

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
- Basic exercise display (ExerciseCard, ExerciseList)
- Tag filtering (TagFilter component)
- State management with useState
- Hardcoded exercise data
- Responsive CSS styling

**What's next** (in priority order):
1. Forms - Add new exercise functionality
2. useEffect - Lifecycle, side effects
3. localStorage - Persist data
4. Search - Text filtering
5. React Router - Multi-page navigation
6. Custom hooks - Reusable logic

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
