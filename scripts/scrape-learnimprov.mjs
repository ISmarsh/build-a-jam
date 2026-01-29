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

import * as cheerio from "cheerio";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/data/learnimprov-exercises.json");

const BASE_URL = "https://www.learnimprov.com";

// Categories to scrape — each maps to an index page listing games
const CATEGORIES = [
  { slug: "warm-ups", tag: "warm-up" },
  { slug: "exercises", tag: "exercise" },
  // Uncomment these to also scrape performance handles and long forms:
  // { slug: "handles", tag: "handle" },
  // { slug: "long-forms", tag: "long-form" },
];

// Rate limiting: delay between fetches (ms) to be respectful
const FETCH_DELAY_MS = 500;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugToId(slug) {
  return slug.replace(/^\/|\/$/g, "").replace(/\//g, "-");
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
      console.warn(`  Error fetching ${url}: ${err.message} (attempt ${attempt})`);
      if (attempt < retries) await sleep(1000 * attempt);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a category index page to extract links to individual game pages.
 * Returns an array of { url, slug } objects.
 */
function parseIndex(html, categorySlug) {
  const $ = cheerio.load(html);
  const links = [];

  // learnimprov.com lists games as links within the main content area.
  // We look for <a> tags whose href points to a page on the same domain
  // that is NOT another category index page.
  const skipSlugs = new Set(CATEGORIES.map((c) => c.slug));
  skipSlugs.add("about");
  skipSlugs.add("faq");
  skipSlugs.add("randoms");

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href") || "";

    // Accept both relative (/some-game/) and absolute links
    let path = href;
    if (href.startsWith(BASE_URL)) {
      path = href.slice(BASE_URL.length);
    }

    // Must be a local path like /some-game/
    if (!path.startsWith("/")) return;

    const slug = path.replace(/^\/|\/$/g, "");

    // Skip empty, category indices, non-game pages, and anchors
    if (!slug) return;
    if (slug.includes("/") && !slug.startsWith(categorySlug)) return;
    if (skipSlugs.has(slug)) return;
    if (slug.startsWith("tag/") || slug.startsWith("category/")) return;
    if (slug.startsWith("randoms/")) return;
    if (slug.startsWith("http")) return;
    if (slug.startsWith("#")) return;

    // Avoid duplicates within the same index
    if (!links.find((l) => l.slug === slug)) {
      links.push({ url: `${BASE_URL}/${slug}/`, slug });
    }
  });

  return links;
}

/**
 * Parse an individual game page and extract structured data.
 * Returns an object with title, description, and any extra metadata.
 */
function parseGamePage(html, slug) {
  const $ = cheerio.load(html);

  // Title: usually in the <h1> or <header> within the main content
  const title =
    $("article h1, .entry-title, h1.post-title, h1").first().text().trim() ||
    $("title").text().split("–")[0].trim() ||
    slug;

  // Description: grab the main content paragraphs.
  // learnimprov.com uses WordPress, so content is typically in .entry-content
  const contentEl = $(".entry-content, article, .post-content, main").first();

  // Collect all <p> text within the content area
  const paragraphs = [];
  contentEl.find("p").each((_i, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });

  const description = paragraphs.join("\n\n");

  // Try to extract teaching-point keywords for tags
  const fullText = (title + " " + description).toLowerCase();
  const tagKeywords = {
    listening: ["listen", "listening"],
    energy: ["energy", "energize", "energiser", "blood pumping", "physical"],
    focus: ["focus", "concentration", "concentrate", "attention"],
    connection: ["connection", "trust", "support", "group", "team", "eye contact"],
    characters: ["character", "characters", "endow"],
    storytelling: ["story", "narrative", "storytelling", "once upon"],
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

  return { title, description, derivedTags };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== learnimprov.com scraper ===\n");

  // Map from slug -> exercise data (deduplicates across categories)
  const exerciseMap = new Map();

  for (const category of CATEGORIES) {
    const indexUrl = `${BASE_URL}/${category.slug}/`;
    console.log(`Fetching index: ${indexUrl}`);

    const html = await fetchPage(indexUrl);
    if (!html) {
      console.warn(`  Skipping category "${category.slug}" — could not fetch index.`);
      continue;
    }

    const gameLinks = parseIndex(html, category.slug);
    console.log(`  Found ${gameLinks.length} game links.\n`);

    for (const link of gameLinks) {
      // If we already scraped this game from another category, just add the tag
      if (exerciseMap.has(link.slug)) {
        const existing = exerciseMap.get(link.slug);
        if (!existing.tags.includes(category.tag)) {
          existing.tags.push(category.tag);
        }
        continue;
      }

      await sleep(FETCH_DELAY_MS);
      process.stdout.write(`  Scraping: ${link.slug} ... `);

      const gameHtml = await fetchPage(link.url);
      if (!gameHtml) {
        console.log("FAILED");
        continue;
      }

      const parsed = parseGamePage(gameHtml, link.slug);

      exerciseMap.set(link.slug, {
        id: slugToId(link.slug),
        name: parsed.title,
        category: category.tag === "warm-up" ? "warmup" : "other",
        description: parsed.description,
        tags: [category.tag, ...parsed.derivedTags],
        sourceUrl: link.url,
      });

      console.log(`OK  "${parsed.title}"`);
    }
  }

  // Deduplicate tags within each exercise
  const exercises = [...exerciseMap.values()].map((ex) => ({
    ...ex,
    tags: [...new Set(ex.tags)],
  }));

  // Wrap in an object with CC BY-SA 4.0 attribution metadata
  const output = {
    attribution: {
      source: "learnimprov.com",
      sourceUrl: "https://www.learnimprov.com/",
      license: "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      note:
        "This data was scraped from learnimprov.com. Descriptions have been " +
        "adapted for use in Build-a-Jam. Under CC BY-SA 4.0, you must give " +
        "appropriate credit, link to the license, and indicate if changes " +
        "were made. Any adaptations must be shared under the same license.",
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
