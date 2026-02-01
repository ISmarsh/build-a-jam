# Build-a-Jam

A tool for selecting improv warm-ups and exercises based on tags like "connection", "structure", "heightening", and more. Browse exercises from multiple sources, build session queues, run timed sessions, and save notes.

## About

Build-a-Jam helps improv performers and teachers find the perfect warm-up exercises for their jam sessions. Browse exercises by tags, filter by source or text search, build a session queue with per-exercise durations, and run through your session with a built-in timer.

This project also serves as a learning resource for transitioning from Angular to React. The codebase includes extensive comments comparing Angular patterns to React equivalents.

## Tech Stack

- **React 19** with TypeScript
- **Vite** — build tool and dev server
- **Tailwind CSS** + **shadcn/ui** — styling and component primitives
- **Radix UI** — accessible Dialog, AlertDialog
- **Sonner** — toast notifications
- **React Router** — client-side routing
- **Cheerio** — server-side HTML scraping (dev only)

## Features

- Browse 300+ improv exercises from multiple sources
- Filter by source (learnimprov.com, improwiki.com)
- Filter by tags (warm-up, scene, connection, heightening, energy, focus, listening, and more)
- Full-text search across names, descriptions, and tags
- Favorite exercises and save session templates
- **Prep → Session → Notes** workflow:
  - **Prep**: Build a session queue, set per-exercise durations
  - **Session**: Run through exercises with a countdown timer
  - **Notes**: Write post-session reflections, save to history
- Session history with delete and clear
- Exercise detail modals with full HTML descriptions
- Responsive dark theme
- Data persistence via localStorage

## Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Type-check and build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run scrape   # Run all data scrapers + post-processing
```

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui primitives (Card, Badge, Dialog, etc.)
│   ├── HomePage.tsx           # Exercise browsing (source filter, tag filter, search)
│   ├── PrepPage.tsx           # Session builder (add exercises, set durations)
│   ├── SessionPage.tsx        # Active session (timer, current exercise)
│   ├── NotesPage.tsx          # Post-session reflections
│   ├── HistoryPage.tsx        # Past sessions with save-as-template
│   ├── FavoritesPage.tsx      # Starred exercises and saved templates
│   ├── CreditsPage.tsx        # Licensing and attribution
│   ├── ExerciseCard.tsx       # Exercise card (shadcn Card + Badge)
│   ├── ExerciseList.tsx       # Exercise grid
│   ├── ExerciseDetailModal.tsx # Full exercise detail (Radix Dialog)
│   ├── ConfirmModal.tsx       # Destructive action confirmation (Radix AlertDialog)
│   ├── TagFilter.tsx          # Tag chip filter with "show more"
│   └── Footer.tsx             # Site-wide footer
├── context/
│   └── SessionContext.tsx     # Session state (useReducer + Context)
├── hooks/
│   └── useTemplateSaver.ts    # Shared template-saving logic
├── storage/
│   ├── StorageContext.tsx      # StorageProvider + useStorage hook
│   └── local-storage.ts       # localStorage implementation
├── data/
│   ├── exercises.ts           # Exercise loading, filtering, tag constants
│   ├── learnimprov-exercises.json
│   └── improwiki-exercises.json
├── types.ts                   # Shared TypeScript types
├── App.tsx                    # Layout shell + route definitions
└── main.tsx                   # Entry point (BrowserRouter)

scripts/
├── scrape-all.mjs             # Orchestrator: runs scrapers + post-processing
├── scrape-learnimprov.mjs     # learnimprov.com scraper
├── scrape-improwiki.mjs       # improwiki.com scraper
├── scraper-utils.mjs          # Shared fetch, cache, retry utilities
├── normalize-tags.mjs         # Tag deduplication and filtering
├── cleanup-scraped-data.mjs   # Description cleaning and non-exercise filtering
└── SCRAPING-GUIDE.md          # Full scraper documentation
```

## Data Sources and Licensing

This project uses a **dual-license** structure:

- **Application code**: [MIT License](LICENSE)
- **Exercise data**: sourced from third parties under their own licenses — see [LICENSE-DATA](LICENSE-DATA)

| Source | License | Exercises |
|--------|---------|-----------|
| [learnimprov.com](https://www.learnimprov.com/) | CC BY-SA 4.0 | ~130 |
| [improwiki.com](https://improwiki.com/en) | CC BY-SA 3.0 DE | ~200 |

Run `npm run scrape` to re-fetch exercise data. See [scripts/SCRAPING-GUIDE.md](scripts/SCRAPING-GUIDE.md) for details.

## License

MIT — see [LICENSE](LICENSE) for application code, [LICENSE-DATA](LICENSE-DATA) for exercise data.
