/**
 * scrape-all.mjs
 *
 * Runs all four data scrapers/importers in sequence:
 *   1. learnimprov.com        (CC BY-SA 4.0)
 *   2. improvencyclopedia.org (no license found)
 *   3. improwiki.com          (CC BY-SA 3.0 DE)
 *   4. ImprovDB via GitHub    (open source, no LICENSE file)
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/scrape-all.mjs
 *
 * Each scraper writes its own JSON file into src/data/.
 * See LICENSE-DATA for per-source attribution and licensing details.
 */

import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCRIPTS = [
  { file: "scrape-learnimprov.mjs", label: "learnimprov.com" },
  { file: "scrape-improvencyclopedia.mjs", label: "improvencyclopedia.org" },
  { file: "scrape-improwiki.mjs", label: "improwiki.com" },
  { file: "import-improvdb.mjs", label: "ImprovDB (GitHub)" },
];

function run(scriptPath, label) {
  return new Promise((resolvePromise, reject) => {
    const child = execFile("node", [scriptPath], { cwd: resolve(__dirname, "..") });

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        reject(new Error(`${label} exited with code ${code}`));
      }
    });

    child.on("error", reject);
  });
}

async function main() {
  console.log("=== Build-a-Jam: scrape all sources ===\n");

  const results = { succeeded: [], failed: [] };

  for (const script of SCRIPTS) {
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

  console.log("\n========================================");
  console.log("  Summary");
  console.log("========================================");
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
  console.error("Fatal error:", err);
  process.exit(1);
});
