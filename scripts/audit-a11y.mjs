/**
 * Accessibility audit script — Playwright + axe-core
 *
 * Starts a Vite dev server, visits every page in both themes
 * (light + dark) at mobile and desktop widths, runs axe-core,
 * and outputs a JSON report.
 *
 * Usage:  npm run audit:a11y
 *    or:  node scripts/audit-a11y.mjs
 *
 * Output: C:/temp/axe-audit.json
 *
 * Prerequisites:
 *   npm install -D playwright @axe-core/playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'fs';
import { createServer } from 'vite';

const PORT = 5174;
const BASE = `http://localhost:${PORT}`;
// CI writes to working directory; local dev writes to C:/temp
const OUTPUT = process.env.CI ? 'axe-audit.json' : 'C:/temp/axe-audit.json';

const THEME_KEY = 'build-a-jam-theme';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

// Routes that need no pre-existing state
const STATIC_ROUTES = [
  { path: '/', name: 'Home' },
  { path: '/prep', name: 'Prep' },
  { path: '/favorites', name: 'Favorites' },
  { path: '/history', name: 'History' },
  { path: '/credits', name: 'Credits' },
];

/** Run axe-core on the current page and return a clean result object. */
async function runAxe(page) {
  const results = await new AxeBuilder({ page }).analyze();
  return {
    violations: results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes.length,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(' '),
        html: n.html.substring(0, 200),
        failureSummary: n.failureSummary,
      })),
    })),
    violationCount: results.violations.length,
    passCount: results.passes.length,
    incompleteCount: results.incomplete.length,
  };
}

function logResult(name, theme, viewport, result) {
  const icon = result.violationCount === 0 ? '\u2713' : '\u2717';
  console.log(
    `  ${icon} ${name} [${theme}, ${viewport}]: ` +
      `${result.violationCount} violations, ${result.passCount} passes`
  );
}

async function main() {
  // ── Start Vite dev server ──────────────────────────────────
  console.log('Starting Vite dev server...');
  const server = await createServer({
    server: { port: PORT, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  console.log(`Dev server running at ${BASE}\n`);

  const browser = await chromium.launch();
  const allResults = [];

  for (const theme of ['light', 'dark']) {
    for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
      console.log(`--- ${theme.toUpperCase()} / ${vpName.toUpperCase()} ---`);

      const context = await browser.newContext({ viewport: vpSize });
      const page = await context.newPage();

      // Pre-set theme in localStorage before any navigation
      await page.addInitScript(
        ([key, value]) => localStorage.setItem(key, value),
        [THEME_KEY, theme]
      );

      // ── Static routes ──────────────────────────────────────
      for (const route of STATIC_ROUTES) {
        await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
        const result = await runAxe(page);
        allResults.push({
          page: route.name,
          path: route.path,
          theme,
          viewport: vpName,
          ...result,
        });
        logResult(route.name, theme, vpName, result);
      }

      // ── Session flow: prep → session → notes ──────────────
      try {
        await page.goto(`${BASE}/prep`, { waitUntil: 'networkidle' });

        // Add the first exercise to the queue
        const addButton = page.locator('button:has-text("+ Add")').first();
        await addButton.click();
        await page.waitForTimeout(300);

        // Start session
        const startButton = page.locator('button:has-text("Start Session")');
        await startButton.click();
        await page.waitForURL(/\/session\//, { timeout: 5000 });
        await page.waitForLoadState('networkidle');

        // Audit the session page
        const sessionResult = await runAxe(page);
        const sessionPath = new URL(page.url()).pathname;
        allResults.push({
          page: 'Session',
          path: sessionPath,
          theme,
          viewport: vpName,
          ...sessionResult,
        });
        logResult('Session', theme, vpName, sessionResult);

        // Click "Wrap Up" (shown when there's only 1 exercise) to reach notes
        const wrapUpButton = page.locator('button:has-text("Wrap Up")');
        await wrapUpButton.click();
        await page.waitForURL(/\/notes\//, { timeout: 5000 });
        await page.waitForLoadState('networkidle');

        // Audit the notes page
        const notesResult = await runAxe(page);
        const notesPath = new URL(page.url()).pathname;
        allResults.push({
          page: 'Notes',
          path: notesPath,
          theme,
          viewport: vpName,
          ...notesResult,
        });
        logResult('Notes', theme, vpName, notesResult);
      } catch (e) {
        console.log(`  \u26A0 Session/Notes audit failed: ${e.message}`);
      }

      // Clear all app state so the next iteration starts fresh
      await page.evaluate(() => localStorage.clear());
      await context.close();
    }
  }

  await browser.close();
  await server.close();

  // ── Write report ───────────────────────────────────────────
  writeFileSync(OUTPUT, JSON.stringify(allResults, null, 2));
  console.log(`\nResults written to ${OUTPUT}`);

  // ── Summary ────────────────────────────────────────────────
  const totalViolations = allResults.reduce(
    (sum, r) => sum + r.violationCount,
    0
  );
  const uniqueIds = new Set(
    allResults.flatMap((r) => r.violations.map((v) => v.id))
  );
  console.log(
    `\nSummary: ${allResults.length} audits, ` +
      `${totalViolations} total violations (${uniqueIds.size} unique rules)`
  );

  if (uniqueIds.size > 0) {
    console.log('\nUnique violations across all pages:');
    for (const id of uniqueIds) {
      const affected = allResults.filter((r) =>
        r.violations.some((v) => v.id === id)
      );
      const first = affected[0].violations.find((v) => v.id === id);
      console.log(`  - ${id} (${first.impact}): ${first.help}`);
      console.log(
        `    Affected: ${affected.map((r) => `${r.page} [${r.theme}/${r.viewport}]`).join(', ')}`
      );
    }
  }

  // Exit with error if any violations found (for CI)
  return totalViolations > 0 ? 1 : 0;
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
