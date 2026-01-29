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
 *   npm run scrape:improwiki
 *   # or directly:
 *   node scripts/scrape-improwiki.mjs
 *
 * Output: writes src/data/improwiki-exercises.json
 *
 * Requirements:
 *   npm install cheerio
 */

import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/data/improwiki-exercises.json");

const BASE_URL = "https://improwiki.com";

// Index pages to scrape — each yields a list of game/exercise links
const INDEX_PAGES = [
  { url: "/en/improv-exercises", defaultTag: "exercise" },
  { url: "/en/improv-games", defaultTag: "game" },
];

// Rate limiting: delay between fetches (ms) to be respectful
const FETCH_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pathToId(path) {
  return "improwiki:" + path
    .replace(/^\/en\/wiki\/improv\//, "")
    .replace(/^\/en\//, "")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
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
    "/en/improv-exercises",
    "/en/improv-games",
    "/en/wiki/improv/special",
    "/en/wikis",
    "/en/about",
    "/en/contact",
    "/en/groups",
    "/en/shows",
  ];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href") || "";

    // We want links to individual wiki pages: /en/wiki/improv/SomeName
    if (!href.startsWith("/en/wiki/improv/")) return;
    if (skipPrefixes.some((p) => href.startsWith(p))) return;
    if (href.includes("special/")) return;

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
 */
function parseGamePage(html, fallbackTitle) {
  const $ = cheerio.load(html);

  // Title
  const title =
    $("h1").first().text().trim() ||
    $("title").text().split("|")[0].split("-")[0].trim() ||
    fallbackTitle;

  // Description — grab paragraphs from the main content area
  const contentEl = $(".node-content, .field-body, article, .content, main").first();
  const paragraphs = [];

  const target = contentEl.length ? contentEl : $("body");
  target.find("p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });

  const description = paragraphs.join("\n\n");

  // Categories — look for links to category pages or category labels
  const categories = [];
  $('a[href*="/en/wiki/improv/"]').each((_i, el) => {
    const href = $(el).attr("href") || "";
    // Category links often appear in sidebar or tag areas
    if (href.includes("category") || href.includes("Category")) {
      const catName = $(el).text().trim();
      if (catName && !categories.includes(catName)) {
        categories.push(catName);
      }
    }
  });

  // Also look for explicit category/tag markup
  $(".field-tags a, .taxonomy a, .tags a").each((_i, el) => {
    const catName = $(el).text().trim();
    if (catName && !categories.includes(catName)) {
      categories.push(catName);
    }
  });

  // Derive additional tags from keywords
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
    acceptance: ["accept", "agree", "yes and"],
    association: ["associat", "free associat", "word"],
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
  console.log("=== improwiki.com scraper ===\n");

  // Map from path -> exercise (deduplicates across index pages)
  const exerciseMap = new Map();

  for (const index of INDEX_PAGES) {
    const url = `${BASE_URL}${index.url}`;
    console.log(`Fetching index: ${url}`);

    const html = await fetchPage(url);
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
      const gameHtml = await fetchPage(pageUrl);
      if (!gameHtml) {
        console.log("FAILED");
        continue;
      }

      const parsed = parseGamePage(gameHtml, link.name);

      const siteTags = parsed.categories.map((c) => c.toLowerCase());
      const allTags = [index.defaultTag, ...siteTags, ...parsed.derivedTags];

      exerciseMap.set(link.path, {
        id: pathToId(link.path),
        name: parsed.title,
        description: parsed.description,
        tags: allTags,
        sourceUrl: pageUrl,
      });

      console.log(`OK  "${parsed.title}"`);
    }
  }

  // Deduplicate tags
  const exercises = [...exerciseMap.values()].map((ex) => ({
    ...ex,
    tags: [...new Set(ex.tags)],
  }));

  // Build output with attribution
  const output = {
    attribution: {
      source: "improwiki.com",
      sourceUrl: "https://improwiki.com/en",
      license:
        "Creative Commons Attribution-ShareAlike 3.0 Germany (CC BY-SA 3.0 DE)",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/de/deed.en",
      note:
        "This data was scraped from improwiki.com. Descriptions have been " +
        "adapted for use in Build-a-Jam. Under CC BY-SA 3.0 DE, you must " +
        "give appropriate credit, link to the license, and indicate if " +
        "changes were made. Any adaptations must be shared under the same " +
        "or a compatible license (e.g. CC BY-SA 4.0).",
      scrapedAt: new Date().toISOString(),
    },
    exercises,
  };

  // Write output
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");

  console.log(`\nDone! Wrote ${exercises.length} exercises to:`);
  console.log(`  ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
