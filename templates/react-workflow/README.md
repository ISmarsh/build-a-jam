# React Workflow Templates

CI/CD workflows and scripts for React + Vite projects.

## Files

```
.github/workflows/
├── ci.yml      — Lint, test, build, and accessibility audit
└── deploy.yml  — GitHub Pages deployment

scripts/
└── audit-a11y.mjs  — Playwright + axe-core accessibility auditor
```

## Usage

### GitHub Actions Workflows

Copy workflows to your `.github/workflows/` directory:

```bash
cp templates/react-workflow/.github/workflows/*.yml .github/workflows/
```

The CI workflow expects these npm scripts:
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run audit:a11y`

### Accessibility Audit Script

1. Copy to your scripts directory:

```bash
cp templates/react-workflow/scripts/audit-a11y.mjs scripts/
```

2. Install dependencies:

```bash
npm install -D playwright @axe-core/playwright
npx playwright install chromium
```

3. Add npm script to package.json:

```json
{
  "scripts": {
    "audit:a11y": "node scripts/audit-a11y.mjs"
  }
}
```

4. Configure routes in `audit-a11y.mjs`:

```javascript
const CONFIG = {
  port: 5174,
  themeStorageKey: 'my-app-theme', // or null if no theming
  themes: ['light', 'dark'],
  staticRoutes: [
    { path: '/', name: 'Home' },
    { path: '/about', name: 'About' },
  ],
  // Optional: dynamic flow for testing stateful routes
  dynamicFlow: async (page, runAxe) => {
    // Navigate through your app, return audit results
  },
};
```

## Features

### CI Workflow

- Runs on PRs and pushes to main
- Skips for docs-only changes (`.md`, `LICENSE`, etc.)
- Parallel jobs: test + a11y audit
- Uploads audit results as artifact

### Accessibility Audit

- Tests all configured routes
- Multiple viewports (mobile + desktop)
- Multiple themes (if configured)
- Dynamic flow support for stateful pages
- JSON output for CI integration
- Exits with error on violations (fails CI)
