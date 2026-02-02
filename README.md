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
- [GitHub CLI](https://cli.github.com/) (`gh`) — optional but recommended for PR workflows

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

| Directory | Contents |
|-----------|----------|
| `src/components/` | Page components and UI (React + shadcn/ui) |
| `src/components/ui/` | shadcn/ui primitives (Card, Badge, Dialog, etc.) |
| `src/context/` | Session state management (useReducer + Context) |
| `src/hooks/` | Custom React hooks |
| `src/storage/` | Persistence layer (localStorage, swappable) |
| `src/data/` | Exercise JSON data and loader module |
| `scripts/` | Data scrapers and post-processing pipeline |

See [CLAUDE.md](CLAUDE.md) for detailed file-by-file documentation.

## Data Sources and Licensing

This project uses a **dual-license** structure:

- **Application code**: [MIT License](LICENSE)
- **Exercise data**: sourced from third parties under their own licenses — see [LICENSE-DATA](LICENSE-DATA)

| Source | License | Exercises |
|--------|---------|-----------|
| [learnimprov.com](https://www.learnimprov.com/) | CC BY-SA 4.0 | ~130 |
| [improwiki.com](https://improwiki.com/en) | CC BY-SA 3.0 DE | ~200 |

Run `npm run scrape` to re-fetch exercise data. See [scripts/SCRAPING-GUIDE.md](scripts/SCRAPING-GUIDE.md) for details.

## Developing with Claude Code

This project is developed with [Claude Code](https://claude.com/claude-code). Project-specific context lives in [CLAUDE.md](CLAUDE.md).

**CLI tool availability**: Claude Code's bash shell may not inherit your full
system PATH. Use a `SessionStart` hook to add missing tools automatically:

1. Create `~/.claude/hooks/setup-path.sh`:

```bash
#!/bin/bash
if [ -n "$CLAUDE_ENV_FILE" ]; then
  # Add any CLI tools not found in Claude Code's default PATH
  if [ -d "/c/Program Files/GitHub CLI" ]; then
    echo 'export PATH="$PATH:/c/Program Files/GitHub CLI"' >> "$CLAUDE_ENV_FILE"
  fi
fi
exit 0
```

2. Register it in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/setup-path.sh"
          }
        ]
      }
    ]
  }
}
```

Tools added to `CLAUDE_ENV_FILE` persist for the entire session.

## License

MIT — see [LICENSE](LICENSE) for application code, [LICENSE-DATA](LICENSE-DATA) for exercise data.
