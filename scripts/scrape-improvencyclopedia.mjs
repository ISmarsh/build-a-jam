/**
 * scrape-improvencyclopedia.mjs
 *
 * Scrapes improv exercises from improvencyclopedia.org and outputs JSON
 * matching the Exercise interface used in Build-a-Jam.
 *
 * No specific license was found on improvencyclopedia.org. We link back
 * to every source page for attribution and do not claim ownership of the
 * original descriptions.
 *
 * Usage:
 *   npm run scrape
 *   # or directly:
 *   node scripts/scrape-improvencyclopedia.mjs
 *
 * Output: writes src/data/improvencyclopedia-exercises.json
 *
 * Requirements:
 *   npm install cheerio
 */

import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(
  __dirname,
  "../src/data/improvencyclopedia-exercises.json",
);

const BASE_URL = "https://improvencyclopedia.org";

// Rate limiting: delay between fetches (ms) to be respectful
const FETCH_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Turn a game filename like "Alphabet_Game.html" into a kebab-case id.
 */
function filenameToId(filename) {
  return "improvencyclopedia:" + filename
    .replace(/\.html$/, "")
    .replace(/_/g, "-")
    .toLowerCase();
}

/**
 * Fetch a URL with basic retry logic and a browser-like User-Agent.
 * Returns the HTML string, or null on failure.
 */
async function fetchPage(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!res.ok) {
        console.warn(`  [${res.status}] ${url} (attempt ${attempt})`);
        if (attempt < retries) await sleep(1000 * attempt);
        continue;
      }

      return await res.text();
    } catch (err) {
      console.warn(
        `  Error fetching ${url}: ${err.message} (attempt ${attempt})`,
      );
      if (attempt < retries) await sleep(1000 * attempt);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 1 — Scrape the categories index to build a category-name lookup
// ---------------------------------------------------------------------------

/**
 * Fetch /categories/ and return a Map of category slug -> category name.
 * The categories page lists links like /categories/Accepting.html
 */
async function fetchCategories() {
  const url = `${BASE_URL}/categories/`;
  console.log(`Fetching categories index: ${url}`);

  const html = await fetchPage(url);
  if (!html) {
    console.warn("  Could not fetch categories index — continuing without.");
    return new Map();
  }

  const $ = cheerio.load(html);
  const categories = new Map();

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href") || "";
    // Match links like /categories/Accepting.html or Accepting.html
    const match = href.match(/(?:\/categories\/)?([A-Za-z0-9_%-]+)\.html$/);
    if (!match) return;

    const slug = decodeURIComponent(match[1]);
    const name = $(el).text().trim();
    if (name && !categories.has(slug)) {
      categories.set(slug, name);
    }
  });

  console.log(`  Found ${categories.size} categories.\n`);
  return categories;
}

// ---------------------------------------------------------------------------
// Step 2 — Scrape the games index to get all game links
// ---------------------------------------------------------------------------

/**
 * Fetch /games/ and return an array of { filename, url, linkText } for each
 * game found. Games are linked as /games/Game_Name.html.
 */
async function fetchGameIndex() {
  const url = `${BASE_URL}/games/`;
  console.log(`Fetching games index: ${url}`);

  const html = await fetchPage(url);
  if (!html) {
    console.error("  Could not fetch games index — aborting.");
    process.exit(1);
  }

  const $ = cheerio.load(html);
  const games = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href") || "";
    // Match links to individual game pages
    const match = href.match(/(?:\/games\/)?([A-Za-z0-9_%-]+)\.html$/);
    if (!match) return;

    const filename = decodeURIComponent(match[1]) + ".html";

    // Skip non-game pages (index, etc.)
    if (filename === "index.html") return;

    const linkText = $(el).text().trim();
    if (!linkText) return;

    if (!games.find((g) => g.filename === filename)) {
      games.push({
        filename,
        url: `${BASE_URL}/games/${encodeURIComponent(filename).replace(/%2F/g, "/")}`,
        linkText,
      });
    }
  });

  console.log(`  Found ${games.length} game links.\n`);
  return games;
}

// ---------------------------------------------------------------------------
// Step 3 — Parse individual game pages
// ---------------------------------------------------------------------------

/**
 * Parse a single game page and extract title, description, and categories.
 *
 * improvencyclopedia.org is a static HTML site. Individual game pages
 * typically contain:
 *   - An <h1> or <title> with the game name
 *   - Paragraph(s) describing the game
 *   - Links or labels for the categories the game belongs to
 */
function parseGamePage(html, fallbackTitle) {
  const $ = cheerio.load(html);

  // Title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().split("-")[0].split("|")[0].trim() ||
    fallbackTitle;

  // Description — gather all <p> text from the page body
  const paragraphs = [];
  $("p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });
  const description = paragraphs.join("\n\n");

  // Categories — look for links pointing to /categories/*.html
  const categories = [];
  $('a[href*="categories/"]').each((_i, el) => {
    const catName = $(el).text().trim();
    if (catName && !categories.includes(catName)) {
      categories.push(catName);
    }
  });

  // Derive additional tags from keywords in the text
  const fullText = (title + " " + description).toLowerCase();
  const tagKeywords = {
    listening: ["listen", "listening"],
    energy: ["energy", "energize", "energiser", "blood pumping", "physical"],
    focus: ["focus", "concentration", "concentrate", "attention"],
    connection: ["connection", "trust", "support", "group", "team", "eye contact"],
    characters: ["character", "characters", "endow"],
    storytelling: ["story", "narrative", "storytelling"],
    structure: ["structure", "format", "scene work"],
    heightening: ["heighten", "escalat", "build on", "yes and"],
  };

  const derivedTags = [];
  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some((kw) => fullText.includes(kw))) {
      derivedTags.push(tag);
    }
  }

  return { title, description, categories, derivedTags };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== improvencyclopedia.org scraper ===\n");

  // 1. Fetch the master game list
  const gameLinks = await fetchGameIndex();

  // 2. Scrape each game page
  const exercises = [];

  for (const game of gameLinks) {
    await sleep(FETCH_DELAY_MS);
    process.stdout.write(`  Scraping: ${game.filename} ... `);

    const html = await fetchPage(game.url);
    if (!html) {
      console.log("FAILED");
      continue;
    }

    const parsed = parseGamePage(html, game.linkText);

    // Merge site categories (lowercased) with keyword-derived tags
    const siteTags = parsed.categories.map((c) => c.toLowerCase());
    const allTags = [...new Set([...siteTags, ...parsed.derivedTags])];

    exercises.push({
      id: filenameToId(game.filename),
      name: parsed.title,
      description: parsed.description,
      tags: allTags,
      sourceUrl: game.url,
    });

    console.log(`OK  "${parsed.title}"`);
  }

  // 4. Build output with attribution
  const output = {
    attribution: {
      source: "improvencyclopedia.org",
      sourceUrl: "https://improvencyclopedia.org/",
      license: null,
      note:
        "This data was scraped from improvencyclopedia.org. No specific " +
        "license was found on the site. Each exercise includes a sourceUrl " +
        "linking back to the original page for attribution.",
      scrapedAt: new Date().toISOString(),
    },
    exercises,
  };

  // 5. Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");

  console.log(`\nDone! Wrote ${exercises.length} exercises to:`);
  console.log(`  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
