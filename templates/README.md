# Reusable Project Templates

Generic, ready-to-use utilities and guidance that can be extracted as Git
submodules for use across projects.

## Contents

| Directory | Purpose |
|-----------|---------|
| `claude-guidance/` | AI assistant guidance (Claude, Copilot) |
| `scraper-utils/` | Web scraping utilities and best practices |
| `react-workflow/` | CI/CD workflows and accessibility auditing |

## Extraction as Submodules

Each directory is designed to become a standalone repository:

```bash
# Create new repos, then in a fresh project:
git submodule add https://github.com/YOU/claude-guidance .claude-guidance
git submodule add https://github.com/YOU/scraper-utils scripts/scraper-utils
git submodule add https://github.com/YOU/react-workflow .react-workflow

# Copy/symlink what you need
cp .react-workflow/.github/workflows/ci.yml .github/workflows/
```

## Design Principles

1. **Ready to use** — No blanks to fill in. Files work immediately.
2. **Domain-agnostic** — No project-specific content.
3. **Composable** — Project-specific files can extend or reference these.
4. **Self-documenting** — Each directory has its own README.
