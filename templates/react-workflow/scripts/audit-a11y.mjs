/**
 * Accessibility audit script — Playwright + axe-core
 *
 * Starts a Vite dev server, visits configured routes at multiple viewports
 * and themes, runs axe-core, and outputs a JSON report.
 *
 * Usage:  npm run audit:a11y
 *    or:  node scripts/audit-a11y.mjs
 *
 * Prerequisites:
 *   npm install -D playwright @axe-core/playwright
 *   npx playwright install chromium
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'fs';
import { createServer } from 'vite';

// =============================================================================
// CONFIGURATION — Customize these for your project
// =============================================================================

const CONFIG = {
  // Server settings
  port: 5174,

  // Output path (CI uses working directory, local dev can use temp)
  outputPath: process.env.CI ? 'axe-audit.json' : 'axe-audit.json',

  // localStorage key for theme (set to null if no theme switching)
  themeStorageKey: null, // e.g., 'my-app-theme'

  // Themes to test (ignored if themeStorageKey is null)
  themes: ['light', 'dark'],

  // Viewports to test
  viewports: {
    mobile: { width: 375, height: 812 },
    desktop: { width: 1280, height: 800 },
  },

  // Routes that need no pre-existing state
  staticRoutes: [
    { path: '/', name: 'Home' },
    // Add your routes here:
    // { path: '/about', name: 'About' },
    // { path: '/settings', name: 'Settings' },
  ],

  // Dynamic flow function (optional) — for testing routes that require setup
  // Return an array of { name, path, result } objects
  // Set to null to skip dynamic testing
  dynamicFlow: null,
  // Example:
  // dynamicFlow: async (page, runAxe) => {
  //   await page.goto('/start');
  //   await page.click('button:has-text("Begin")');
  //   await page.waitForURL(/\/step-1/);
  //   const result = await runAxe(page);
  //   return [{ name: 'Step 1', path: '/step-1', ...result }];
  // },
};

// =============================================================================
// IMPLEMENTATION — Generally no need to modify below this line
// =============================================================================

const BASE = `http://localhost:${CONFIG.port}`;

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
  const themeStr = theme ? `, ${theme}` : '';
  console.log(
    `  ${icon} ${name} [${viewport}${themeStr}]: ` +
      `${result.violationCount} violations, ${result.passCount} passes`
  );
}

async function auditWithContext(browser, theme, vpName, vpSize, allResults) {
  const themeStr = theme ? theme.toUpperCase() + ' / ' : '';
  console.log(`--- ${themeStr}${vpName.toUpperCase()} ---`);

  const context = await browser.newContext({ viewport: vpSize });
  const page = await context.newPage();

  // Pre-set theme in localStorage if configured
  if (CONFIG.themeStorageKey && theme) {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [CONFIG.themeStorageKey, theme]
    );
  }

  // Static routes
  for (const route of CONFIG.staticRoutes) {
    await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle' });
    const result = await runAxe(page);
    allResults.push({
      page: route.name,
      path: route.path,
      theme: theme || 'default',
      viewport: vpName,
      ...result,
    });
    logResult(route.name, theme, vpName, result);
  }

  // Dynamic flow (if configured)
  if (CONFIG.dynamicFlow) {
    try {
      const dynamicResults = await CONFIG.dynamicFlow(page, runAxe);
      for (const dr of dynamicResults) {
        allResults.push({
          ...dr,
          theme: theme || 'default',
          viewport: vpName,
        });
        logResult(dr.name, theme, vpName, dr);
      }
    } catch (e) {
      console.log(`  \u26A0 Dynamic flow failed: ${e.message}`);
    }
  }

  // Clear state for next iteration
  await page.evaluate(() => localStorage.clear());
  await context.close();
}

async function main() {
  console.log('Starting Vite dev server...');
  const server = await createServer({
    server: { port: CONFIG.port, strictPort: true },
    logLevel: 'error',
  });
  await server.listen();
  console.log(`Dev server running at ${BASE}\n`);

  const browser = await chromium.launch();
  const allResults = [];

  const themes = CONFIG.themeStorageKey ? CONFIG.themes : [null];

  for (const theme of themes) {
    for (const [vpName, vpSize] of Object.entries(CONFIG.viewports)) {
      await auditWithContext(browser, theme, vpName, vpSize, allResults);
    }
  }

  await browser.close();
  await server.close();

  // Write report
  writeFileSync(CONFIG.outputPath, JSON.stringify(allResults, null, 2));
  console.log(`\nResults written to ${CONFIG.outputPath}`);

  // Summary
  const totalViolations = allResults.reduce((sum, r) => sum + r.violationCount, 0);
  const uniqueIds = new Set(allResults.flatMap((r) => r.violations.map((v) => v.id)));

  console.log(
    `\nSummary: ${allResults.length} audits, ` +
      `${totalViolations} total violations (${uniqueIds.size} unique rules)`
  );

  if (uniqueIds.size > 0) {
    console.log('\nUnique violations across all pages:');
    for (const id of uniqueIds) {
      const affected = allResults.filter((r) => r.violations.some((v) => v.id === id));
      const first = affected[0].violations.find((v) => v.id === id);
      console.log(`  - ${id} (${first.impact}): ${first.help}`);
      console.log(
        `    Affected: ${affected.map((r) => `${r.page} [${r.theme}/${r.viewport}]`).join(', ')}`
      );
    }
  }

  // Exit with error if violations found (for CI)
  return totalViolations > 0 ? 1 : 0;
}

main()
  .then((exitCode) => process.exit(exitCode))
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  });
