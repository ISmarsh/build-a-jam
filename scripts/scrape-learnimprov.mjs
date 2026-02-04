/**
 * scrape-learnimprov.mjs
 *
 * Scrapes improv exercises from learnimprov.com and outputs JSON
 * matching the Exercise interface used in Build-a-Jam.
 *
 * The content on learnimprov.com is licensed under the Creative Commons
 * Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).
 * See: https://creativecommons.org/licenses/by-sa/4.0/
 *
 * This script embeds the required attribution metadata in the output JSON.
 * Any adaptations of the scraped data must also be shared under CC BY-SA 4.0
 * or a compatible license.
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/scrape-learnimprov.mjs
 *
 * Output: writes src/data/learnimprov-exercises.json
 *
 * Requirements:
 *   npm install cheerio
 */

import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sleep,
  fetchPage,
  loadCache,
  saveCache,
  loadExistingData,
  clearCache,
} from './scraper-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../src/data/learnimprov-exercises.json');
const HTML_CACHE_FILE = 'learnimprov-html.json';

const BASE_URL = 'https://www.learnimprov.com';

// Categories to scrape — uses WordPress category slugs (singular)
const CATEGORIES = [
  { slug: 'warm-up', tag: 'warm-up' },
  { slug: 'exercise', tag: 'exercise' },
  // Uncomment these to also scrape performance handles and long forms:
  // { slug: "handle", tag: "handle" },
  // { slug: "long-form", tag: "long-form" },
];

// Rate limiting: delay between fetches (ms) to be respectful
const FETCH_DELAY_MS = 1000;

// Parse command-line flags
const args = process.argv.slice(2);
const FORCE_REFETCH = args.includes('--force');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugToId(slug) {
  return 'learnimprov:' + slug.replace(/^\/|\/$/g, '').replace(/\//g, '-');
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse an individual game page and extract structured data.
 * Uses structure-aware parsing: learnimprov.com uses h3 headings to mark sections
 * (Synonyms, Introduction, Description, Gimmicks). We extract only the Description
 * section for the main content, and Synonyms for alternative names.
 *
 * Returns an object with title, description, and alternativeNames (if found).
 */
function parseGamePage(html, slug) {
  /** Normalize text by removing extra whitespace and newlines. */
  function normalizeText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  const $ = cheerio.load(html);

  // Title: usually in the <h1> or <header> within the main content
  const title =
    $('article h1, .entry-title, h1.post-title, h1').first().text().trim() ||
    $('title').text().split(/[–-]/)[0].trim() ||
    slug;

  const contentEl = $('.entry-content, article, .post-content, main').first();

  // Store raw HTML for reprocessing capability
  const description_raw = contentEl.html() || '';

  // Extract alternative names from Synonyms section
  let alternativeNames = [];
  const h3Elements = contentEl.find('h3');

  h3Elements.each((_i, h3) => {
    const heading = $(h3).text().trim();

    if (heading === 'Synonyms') {
      // Collect paragraphs between this h3 and the next h3
      const paragraphs = [];
      let current = $(h3).next();

      while (current.length && current.prop('tagName') !== 'H3') {
        if (current.prop('tagName') === 'P') {
          const text = normalizeText(current.text());
          if (text) paragraphs.push(text);
        }
        current = current.next();
      }

      const synonymText = paragraphs.join(' ');
      if (synonymText && synonymText !== 'None.') {
        alternativeNames = synonymText
          .split(/,|\n/)
          .map((name) => name.trim())
          .filter((name) => name && name !== 'None.');
      }
    }
  });

  return {
    title,
    description_raw,
    alternativeNames: alternativeNames.length > 0 ? alternativeNames : undefined,
  };
}

/**
 * Fetch all categories and tags from WordPress to create ID->name mappings.
 * Returns { categories: Map<id, name>, tags: Map<id, name> }
 */
async function fetchCategoryAndTagMappings() {
  const mappings = { categories: new Map(), tags: new Map() };
  const perPage = 100;

  // Fetch all categories (paginated)
  let page = 1;
  while (true) {
    const url = `${BASE_URL}/wp-json/wp/v2/categories?per_page=${perPage}&page=${page}`;
    const html = await fetchPage(url, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);
    if (!html) break;

    const items = JSON.parse(html);
    if (items.length === 0) break;

    items.forEach((item) => mappings.categories.set(item.id, item.name));

    if (items.length < perPage) break;
    page++;
  }

  // Fetch all tags (paginated)
  page = 1;
  while (true) {
    const url = `${BASE_URL}/wp-json/wp/v2/tags?per_page=${perPage}&page=${page}`;
    const html = await fetchPage(url, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);
    if (!html) break;

    const items = JSON.parse(html);
    if (items.length === 0) break;

    items.forEach((item) => mappings.tags.set(item.id, item.name));

    if (items.length < perPage) break;
    page++;
  }

  console.log(`  Loaded ${mappings.categories.size} categories and ${mappings.tags.size} tags\n`);
  return mappings;
}

/**
 * Fetch all posts from a WordPress category via REST API.
 * Returns array of { id, link, slug, title, categoryIds, tagIds } objects.
 */
async function fetchWordPressCategory(categorySlug) {
  // First, get the category ID
  const categoriesUrl = `${BASE_URL}/wp-json/wp/v2/categories?slug=${categorySlug}`;
  const categoriesHtml = await fetchPage(categoriesUrl, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);

  if (!categoriesHtml) {
    console.warn(`  Could not fetch category info for "${categorySlug}"`);
    return [];
  }

  const categories = JSON.parse(categoriesHtml);
  if (categories.length === 0) {
    console.warn(`  Category "${categorySlug}" not found`);
    return [];
  }

  const categoryId = categories[0].id;
  const categoryCount = categories[0].count;

  console.log(`  Category "${categorySlug}" has ${categoryCount} posts`);

  // Fetch all posts in this category (paginated)
  const posts = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const postsUrl = `${BASE_URL}/wp-json/wp/v2/posts?categories=${categoryId}&per_page=${perPage}&page=${page}`;
    const postsHtml = await fetchPage(postsUrl, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);

    if (!postsHtml) break;

    const pagePosts = JSON.parse(postsHtml);
    if (pagePosts.length === 0) break;

    posts.push(...pagePosts);

    // Check if there are more pages
    if (pagePosts.length < perPage) break;
    page++;

    await sleep(FETCH_DELAY_MS / 2); // Shorter delay for API calls
  }

  // Convert to our format - include both categories and tags from the API
  return posts.map((post) => {
    const url = post.link;
    const path = url.replace(BASE_URL, '');
    const slug = path.replace(/^\/|\/$/g, '');

    return {
      id: post.id,
      url,
      slug,
      title: post.title.rendered,
      categoryIds: post.categories || [], // Array of category IDs
      tagIds: post.tags || [], // Array of tag IDs
    };
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== learnimprov.com scraper ===\n');

  // Load existing data and cache for incremental/resume support
  const existingData = loadExistingData(OUTPUT_PATH);
  const cache = loadCache('learnimprov-progress.json');

  if (cache.size > 0) {
    console.log(`Loaded ${cache.size} exercises from cache (resume mode)`);
  }
  if (existingData) {
    console.log(`Loaded ${existingData.exercises.length} existing exercises (incremental mode)\n`);
  }

  // Fetch all categories and tags to create ID->name mappings
  console.log('Fetching WordPress categories and tags...');
  const mappings = await fetchCategoryAndTagMappings();

  // Map from slug -> exercise data (deduplicates across categories)
  const exerciseMap = new Map(cache);

  for (const category of CATEGORIES) {
    console.log(`Fetching category via API: ${category.slug}`);

    // Use WordPress REST API to get all posts in this category
    const gameLinks = await fetchWordPressCategory(category.slug);

    if (gameLinks.length === 0) {
      console.warn(`  No posts found in category "${category.slug}"`);
      continue;
    }

    console.log(`  Found ${gameLinks.length} exercises.\n`);

    let scraped = 0;
    let skipped = 0;

    for (const link of gameLinks) {
      // If we already scraped this game from another category, merge tags
      if (exerciseMap.has(link.slug)) {
        const existing = exerciseMap.get(link.slug);
        // Merge in any new categories/tags from this occurrence
        const newTags = [
          ...link.categoryIds.map((id) => mappings.categories.get(id)).filter(Boolean),
          ...link.tagIds.map((id) => mappings.tags.get(id)).filter(Boolean),
        ];
        existing.tags.push(...newTags);
        skipped++;
        continue;
      }

      await sleep(FETCH_DELAY_MS);
      process.stdout.write(`  Scraping: ${link.slug} ... `);

      const gameHtml = await fetchPage(link.url, 3, {}, HTML_CACHE_FILE, FORCE_REFETCH);
      if (!gameHtml) {
        console.log('FAILED');
        continue;
      }

      const parsed = parseGamePage(gameHtml, link.slug);

      // Merge categories and tags into a single tags array
      const allTags = [
        ...link.categoryIds.map((id) => mappings.categories.get(id)).filter(Boolean),
        ...link.tagIds.map((id) => mappings.tags.get(id)).filter(Boolean),
      ];

      const exercise = {
        id: slugToId(link.slug),
        name: parsed.title,
        description: '', // Will be populated by cleanup-scraped-data.mjs from description_raw
        description_raw: parsed.description_raw,
        rawTags: [...allTags], // Original tags before normalization
        tags: allTags, // Will be normalized in post-processing
        sourceUrl: link.url,
      };

      // Include alternativeNames if found
      if (parsed.alternativeNames) {
        exercise.alternativeNames = parsed.alternativeNames;
      }

      exerciseMap.set(link.slug, exercise);

      console.log(`OK  "${parsed.title}"`);
      scraped++;

      // Save cache every 10 exercises
      if (scraped % 10 === 0) {
        saveCache('learnimprov-progress.json', exerciseMap);
      }
    }

    if (skipped > 0) {
      console.log(`  Skipped ${skipped} already-scraped exercises`);
    }
  }

  // Save final cache
  saveCache('learnimprov-progress.json', exerciseMap);

  // Tag normalization is handled by normalize-tags.mjs in post-processing
  const exercises = [...exerciseMap.values()];

  // Wrap in an object with CC BY-SA 4.0 attribution metadata
  const output = {
    attribution: {
      source: 'learnimprov.com',
      sourceUrl: 'https://www.learnimprov.com/',
      license: 'Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      note:
        'This data was scraped from learnimprov.com. Descriptions have been ' +
        'adapted for use in Build-a-Jam. Under CC BY-SA 4.0, you must give ' +
        'appropriate credit, link to the license, and indicate if changes ' +
        'were made. Any adaptations must be shared under the same license.',
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

// Check for --clear-cache flag
if (args.includes('--clear-cache')) {
  console.log('Clearing cache...');
  clearCache('learnimprov-progress.json');
  console.log('Cache cleared.\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
