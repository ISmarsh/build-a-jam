/**
 * scrape-improwiki.mjs
 *
 * Scrapes improv exercises and games from improwiki.com and outputs JSON
 * matching the Exercise interface used in Build-a-Jam.
 *
 * Content on improwiki.com is licensed under Creative Commons
 * Attribution-ShareAlike 3.0 Germany (CC BY-SA 3.0 DE).
 * See: https://creativecommons.org/licenses/by-sa/3.0/de/deed.en
 *
 * This script embeds the required attribution metadata in the output JSON.
 * Any adaptations of the scraped data must also be shared under CC BY-SA 3.0 DE
 * (or a compatible license such as CC BY-SA 4.0).
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/scrape-improwiki.mjs
 *
 * Output: writes src/data/improwiki-exercises.json
 *
 * Requirements:
 *   npm install cheerio
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sleep, fetchPage } from './scraper-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/improwiki-exercises.json');
const HTML_CACHE_FILE = 'improwiki-html.json';

const BASE_URL = 'https://improwiki.com';

// Index pages to scrape — each yields a list of game/exercise links
const INDEX_PAGES = [
  { url: '/en/improv-exercises', defaultTag: 'exercise' },
  { url: '/en/improv-games', defaultTag: 'game' },
];

// Rate limiting: delay between fetches (ms) to be respectful
const FETCH_DELAY_MS = 500;

// Parse command-line flags
const args = process.argv.slice(2);
const FORCE_REFETCH = args.includes('--force');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pathToId(path) {
  return (
    'improwiki:' +
    path
      .replace(/^\/en\/wiki\/improv\//, '')
      .replace(/^\/en\//, '')
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  );
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse an index page (/en/improv-exercises or /en/improv-games) and return
 * an array of { path, name } for each linked game/exercise.
 *
 * improwiki.com lists items as links within the main content, typically
 * pointing to /en/wiki/improv/GameName.
 */
function parseIndex(html) {
  const $ = cheerio.load(html);
  const links = [];

  const skipPrefixes = [
    '/en/improv-exercises',
    '/en/improv-games',
    '/en/wiki/improv/special',
    '/en/wikis',
    '/en/about',
    '/en/contact',
    '/en/groups',
    '/en/shows',
  ];

  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') || '';

    // We want links to individual wiki pages: /en/wiki/improv/SomeName
    if (!href.startsWith('/en/wiki/improv/')) return;
    if (skipPrefixes.some((p) => href.startsWith(p))) return;
    if (href.includes('special/')) return;

    const name = $(el).text().trim();
    if (!name) return;

    if (!links.find((l) => l.path === href)) {
      links.push({ path: href, name });
    }
  });

  return links;
}

/**
 * Parse an individual game/exercise page and extract structured data.
 * Uses structure-aware parsing: improwiki.com uses h3 headings to mark sections
 * (Rules, Notes, Variations, etc.). We extract content intelligently based on
 * these sections.
 *
 * Returns an object with title, description, categories, and alternativeNames (if found).
 */
function parseGamePage(html, fallbackTitle) {
  const $ = cheerio.load(html);

  // Title
  // Extract title from h1 or fall back to <title> tag.
  // Use lastIndexOf(" - ") to strip site suffix (e.g. "Game Name - improwiki")
  // without truncating legitimate hyphens in names (e.g. "Self-Awareness Exercise").
  let title = $('h1').first().text().trim();
  if (!title) {
    const raw = $('title').text().split('|')[0];
    const sepIndex = raw.lastIndexOf(' - ');
    title = (sepIndex !== -1 ? raw.substring(0, sepIndex) : raw).trim() || fallbackTitle;
  }

  const contentEl = $('.wikiarticle, .node-content, .field-body, article, .content, main').first();

  // Store raw HTML for reprocessing capability
  const description_raw = contentEl.html() || '';

  // Categories — look for links to category pages or category labels (kept for tag extraction)
  const categories = [];
  $('a[href*="/en/wiki/improv/"]').each((_i, el) => {
    const href = $(el).attr('href') || '';
    // Category links often appear in sidebar or tag areas
    if (href.includes('category') || href.includes('Category')) {
      const catName = $(el).text().trim();
      if (catName && !categories.includes(catName)) {
        categories.push(catName);
      }
    }
  });

  // Also look for explicit category/tag markup
  $('.field-tags a, .taxonomy a, .tags a').each((_i, el) => {
    const catName = $(el).text().trim();
    if (catName && !categories.includes(catName)) {
      categories.push(catName);
    }
  });

  return { title, description_raw, categories };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== improwiki.com scraper ===\n');

  // Map from path -> exercise (deduplicates across index pages)
  const exerciseMap = new Map();

  for (const index of INDEX_PAGES) {
    const url = `${BASE_URL}${index.url}`;
    console.log(`Fetching index: ${url}`);

    const html = await fetchPage(url, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);
    if (!html) {
      console.warn(`  Skipping index "${index.url}" — could not fetch.`);
      continue;
    }

    const gameLinks = parseIndex(html);
    console.log(`  Found ${gameLinks.length} links.\n`);

    for (const link of gameLinks) {
      // If already scraped from another index, just add the default tag
      if (exerciseMap.has(link.path)) {
        const existing = exerciseMap.get(link.path);
        if (!existing.tags.includes(index.defaultTag)) {
          existing.tags.push(index.defaultTag);
        }
        continue;
      }

      await sleep(FETCH_DELAY_MS);
      process.stdout.write(`  Scraping: ${link.path} ... `);

      const pageUrl = `${BASE_URL}${link.path}`;
      const gameHtml = await fetchPage(pageUrl, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);
      if (!gameHtml) {
        console.log('FAILED');
        continue;
      }

      const parsed = parseGamePage(gameHtml, link.name);

      const siteTags = parsed.categories.map((c) => c.toLowerCase());
      const allTags = [index.defaultTag, ...siteTags]; // Just use source categories

      exerciseMap.set(link.path, {
        id: pathToId(link.path),
        name: parsed.title,
        description: '', // Will be populated by cleanup-scraped-data.mjs from description_raw
        description_raw: parsed.description_raw,
        rawTags: [...allTags], // Original tags before normalization
        tags: allTags, // Will be normalized in post-processing
        sourceUrl: pageUrl,
      });

      console.log(`OK  "${parsed.title}"`);
    }
  }

  // Non-exercise filtering (groups, theaters, glossary) is handled by
  // cleanup-scraped-data.mjs in the post-processing pipeline.
  const exercises = [...exerciseMap.values()];

  // Build output with attribution
  const output = {
    attribution: {
      source: 'improwiki.com',
      sourceUrl: 'https://improwiki.com/en',
      license: 'Creative Commons Attribution-ShareAlike 3.0 Germany (CC BY-SA 3.0 DE)',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/de/deed.en',
      note:
        'This data was scraped from improwiki.com. Descriptions have been ' +
        'adapted for use in Build-a-Jam. Under CC BY-SA 3.0 DE, you must ' +
        'give appropriate credit, link to the license, and indicate if ' +
        'changes were made. Any adaptations must be shared under the same ' +
        'or a compatible license (e.g. CC BY-SA 4.0).',
      scrapedAt: new Date().toISOString(),
    },
    exercises,
  };

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + '\n');

  console.log(`\nDone! Wrote ${exercises.length} exercises to:`);
  console.log(`  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
