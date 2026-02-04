/**
 * import-improvdb.mjs
 *
 * Fetches the seed data JSON from the ImprovDB open-source GitHub repository
 * and transforms it into the Exercise format used by Build-a-Jam.
 *
 * ImprovDB (https://improvdb.com) is an open-source project by Dom Gemoli.
 * Source: https://github.com/aberonni/improvdb
 * No explicit LICENSE file was found in the repository. The site describes
 * itself as "open source and free to use."
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/import-improvdb.mjs
 *
 * Output: writes src/data/improvdb-exercises.json
 *
 * Requirements: none beyond Node 18+ (uses native fetch)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/improvdb-exercises.json');

const SEED_URL = 'https://raw.githubusercontent.com/aberonni/improvdb/main/prisma/seedData.json';

const IMPROVDB_BASE = 'https://improvdb.com';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch a URL with retry logic.
 */
async function fetchJson(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn(`  [${res.status}] ${url} (attempt ${attempt})`);
        if (attempt < retries) await sleep(1000 * attempt);
        continue;
      }

      return await res.json();
    } catch (err) {
      console.warn(`  Error fetching ${url}: ${err.message} (attempt ${attempt})`);
      if (attempt < retries) await sleep(1000 * attempt);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

/**
 * Map an ImprovDB resource type to a tag.
 */
function typeToTag(type) {
  switch (type) {
    case 'EXERCISE':
      return 'exercise';
    case 'SHORT_FORM':
      return 'short-form';
    case 'LONG_FORM':
      return 'long-form';
    default:
      return type?.toLowerCase() || 'unknown';
  }
}

/**
 * Strip basic Markdown formatting to produce a plain-text description.
 */
function stripMarkdown(md) {
  if (!md) return '';
  return (
    md
      // Remove headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      // Remove inline code
      .replace(/`([^`]+)`/g, '$1')
      // Collapse multiple blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Transform a single ImprovDB resource into a Build-a-Jam Exercise.
 */
function transformResource(resource) {
  const typeTag = typeToTag(resource.type);

  // Extract category names from the nested categories array
  const categoryTags = (resource.categories || [])
    .map((c) => c.category?.name?.toLowerCase())
    .filter(Boolean);

  const allTags = [...new Set([typeTag, ...categoryTags])];

  // Build a URL to the resource on improvdb.com
  const sourceUrl = `${IMPROVDB_BASE}/resource/${resource.id}`;

  return {
    id: 'improvdb:' + resource.id,
    name: resource.title,
    description: stripMarkdown(resource.description),
    tags: allTags,
    alternativeNames: resource.alternativeNames?.length ? resource.alternativeNames : undefined,
    sourceUrl,
  };
}

/**
 * Extract tag definitions from the seed data's categories array.
 * Each category has { name, description } — we normalise the name to
 * lowercase to match the tags we emit on exercises.
 */
function extractTagDefinitions(seedData) {
  const defs = {};

  // ImprovDB seed data has a top-level "categories" array
  const categories = seedData.categories || [];
  for (const cat of categories) {
    if (cat.name) {
      const tag = cat.name.toLowerCase();
      if (cat.description) {
        defs[tag] = cat.description;
      }
    }
  }

  // Also add the type-derived tags with short descriptions
  defs['exercise'] = defs['exercise'] || 'General improv exercise or drill';
  defs['short-form'] = defs['short-form'] || 'Short-form improv game';
  defs['long-form'] = defs['long-form'] || 'Long-form improv format';

  return defs;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== ImprovDB importer ===\n');
  console.log(`Fetching seed data from GitHub:\n  ${SEED_URL}\n`);

  const seedData = await fetchJson(SEED_URL);
  if (!seedData) {
    console.error('Could not fetch seed data — aborting.');
    process.exit(1);
  }

  // The seed file contains a "resources" array (and possibly "lessonPlans")
  const resources = seedData.resources || seedData;
  if (!Array.isArray(resources)) {
    console.error('Unexpected seed data format — expected an array of resources.');
    console.error('Top-level keys:', Object.keys(seedData));
    process.exit(1);
  }

  console.log(`  Found ${resources.length} resources in seed data.\n`);

  // Filter to published resources only
  const published = resources.filter((r) => r.published !== false);
  console.log(`  ${published.length} are published.\n`);

  const exercises = published.map(transformResource);

  // Extract tag definitions from the categories in the seed data
  const tagDefinitions = extractTagDefinitions(seedData);
  console.log(`  Extracted ${Object.keys(tagDefinitions).length} tag definitions.\n`);

  // Build output with attribution
  const output = {
    attribution: {
      source: 'ImprovDB',
      sourceUrl: 'https://improvdb.com/',
      repository: 'https://github.com/aberonni/improvdb',
      license: null,
      note:
        'This data was imported from the ImprovDB open-source repository ' +
        '(github.com/aberonni/improvdb) by Dom Gemoli. The project describes ' +
        'itself as "open source and free to use" but no explicit LICENSE file ' +
        'was found. Each exercise includes a sourceUrl linking back to ' +
        'improvdb.com for attribution.',
      scrapedAt: new Date().toISOString(),
    },
    tagDefinitions,
    exercises,
  };

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');

  console.log(`Done! Wrote ${exercises.length} exercises to:`);
  console.log(`  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
