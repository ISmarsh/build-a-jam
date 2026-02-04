/**
 * scrape-all.mjs
 *
 * Runs data scrapers/importers in sequence for licensed sources:
 *   1. learnimprov.com        (CC BY-SA 4.0)
 *   2. improwiki.com          (CC BY-SA 3.0 DE)
 *
 * The following sources are disabled until licensing is resolved:
 *   - improvencyclopedia.org  (no open license — "free for non-commercial use")
 *   - ImprovDB via GitHub     (no LICENSE file in repo)
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/scrape-all.mjs
 *
 * Each scraper writes its own JSON file into src/data/.
 * See LICENSE-DATA for per-source attribution and licensing details.
 */

import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRAPER_SCRIPTS = [
  { file: 'scrape-learnimprov.mjs', label: 'learnimprov.com' },
  // { file: "scrape-improvencyclopedia.mjs", label: "improvencyclopedia.org" },
  //   ↑ Disabled: no open license. Contact site owner before enabling.
  { file: 'scrape-improwiki.mjs', label: 'improwiki.com' },
  // { file: "import-improvdb.mjs", label: "ImprovDB (GitHub)" },
  //   ↑ Disabled: no LICENSE file in repo. Contact github.com/aberonni before enabling.
  //
  // TODO: Investigate these potential new sources (check licensing before scraping):
  //   - improvdr.com — game libraries with exercises like "Heightening Circle"
  //   - improvdoesbest.com — exercises organized by concept (heightening, game, etc.)
  //   - wiki.improvresourcecenter.com — wiki-style exercise database (IRC Improv Wiki)
  //   - improvgames.io — workshops/exercises organized by skill
  //   - peopleandchairs.com — exercises categorized by scene work, object work, etc.
];

// Post-processing scripts to run after scraping
const POST_PROCESSING_SCRIPTS = [
  { file: 'normalize-tags.mjs', label: 'Normalize tags' },
  { file: 'apply-inferred-tags.mjs', label: 'Apply inferred tags' },
  { file: 'cleanup-scraped-data.mjs', label: 'Clean descriptions' },
];

function run(scriptPath, label) {
  return new Promise((resolvePromise, reject) => {
    const child = execFile('node', [scriptPath], { cwd: resolve(__dirname, '..') });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  console.log('=== Build-a-Jam: scrape all sources ===\n');

  const results = { succeeded: [], failed: [] };

  // Phase 1: Run scrapers
  for (const script of SCRAPER_SCRIPTS) {
    const scriptPath = resolve(__dirname, script.file);
    console.log(`\n--- ${script.label} ---\n`);

    try {
      await run(scriptPath, script.label);
      results.succeeded.push(script.label);
    } catch (err) {
      console.error(`\n  ERROR: ${err.message}\n`);
      results.failed.push(script.label);
    }
  }

  // Phase 2: Run post-processing (only if scrapers succeeded)
  if (results.failed.length === 0) {
    console.log('\n========================================');
    console.log('  Post-processing');
    console.log('========================================\n');

    for (const script of POST_PROCESSING_SCRIPTS) {
      const scriptPath = resolve(__dirname, script.file);
      console.log(`\n--- ${script.label} ---\n`);

      try {
        await run(scriptPath, script.label);
        results.succeeded.push(script.label);
      } catch (err) {
        console.error(`\n  ERROR: ${err.message}\n`);
        results.failed.push(script.label);
      }
    }
  }

  console.log('\n========================================');
  console.log('  Summary');
  console.log('========================================');
  console.log(`  Succeeded: ${results.succeeded.length}`);
  for (const s of results.succeeded) console.log(`    ✓ ${s}`);
  if (results.failed.length) {
    console.log(`  Failed:    ${results.failed.length}`);
    for (const f of results.failed) console.log(`    ✗ ${f}`);
  }
  console.log();

  if (results.failed.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
