/**
 * cleanup-scraped-data.mjs
 *
 * Post-processing script to clean up scraped exercise data:
 * - Extract specific content sections from raw HTML
 * - Build clean, semantic HTML descriptions (preserving hyperlinks)
 * - Filter out non-exercise entries (promotional pages, groups, theaters, glossary)
 *
 * Philosophy: Parse and extract what we want, rather than removing what we don't.
 *
 * NOTE: Tag normalization is handled by scripts/normalize-tags.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_FILES = [
  resolve(__dirname, "../src/data/learnimprov-exercises.json"),
  resolve(__dirname, "../src/data/improwiki-exercises.json"),
];

// Tags that indicate non-exercise content (promotional pages, groups, theaters, etc.)
// These cause the entire exercise to be filtered out (not just the tag removed).
const NON_EXERCISE_TAGS = [
  "improv groups",
  "improv group",
  "theater",
  "theatre",
  "improv glossary",
];

/**
 * Strip all HTML attributes from elements (class, id, style, etc.)
 * Keeps only the semantic tags and their content.
 * Preserves href attributes on links.
 */
function stripHtmlAttributes(html) {
  if (!html) return "";
  const $ = cheerio.load(html);

  // Remove all attributes from all elements except href on <a> tags
  $("*").each((i, el) => {
    const $el = $(el);
    const tagName = el.tagName?.toLowerCase();
    const attrs = Object.keys(el.attribs || {});

    attrs.forEach(attr => {
      // Preserve href on anchor tags
      if (tagName === 'a' && attr === 'href') {
        return;
      }
      $el.removeAttr(attr);
    });
  });

  return $("body").html() || "";
}

/**
 * Check if a paragraph element is a bold-only "heading" like <p><strong>Description</strong></p>.
 * Some learnimprov pages use this pattern instead of actual <h3> tags.
 */
function isBoldHeading($, el) {
  const $el = $(el);
  if ($el.prop("tagName") !== "P") return null;

  const bold = $el.find("b, strong").first();
  if (bold.length && bold.text().trim() === $el.text().trim()) {
    return bold.text().trim();
  }
  return null;
}

/**
 * Extract and build clean HTML for learnimprov exercises.
 * Extracts sections: Introduction, Description, Gimmicks, Variations.
 *
 * Handles two page formats:
 *   1. Sections marked with <h3> tags (older posts)
 *   2. Sections marked with <p><strong>Title</strong></p> (newer/block-editor posts)
 */
function cleanLearnimprovDescription(rawHtml) {
  if (!rawHtml || rawHtml.trim() === "") return "";

  const $ = cheerio.load(rawHtml);
  const parts = [];

  // Find .entry-content container
  const content = $(".entry-content").first();
  if (!content.length) return "";

  const SKIP_SECTIONS = new Set(["Synonyms", "Credits"]);

  // Detect which format: real <h3> tags or bold-paragraph headings
  const hasH3 = content.find("h3").length > 0;

  // Build a list of "heading" elements regardless of format
  const headings = [];

  if (hasH3) {
    content.find("h3").each((i, el) => {
      headings.push({ el, title: $(el).text().trim() });
    });
  } else {
    // Scan for bold-only paragraphs acting as headings
    content.children().each((i, el) => {
      const title = isBoldHeading($, el);
      if (title) {
        headings.push({ el, title });
      }
    });
  }

  for (const { el, title } of headings) {
    if (SKIP_SECTIONS.has(title)) continue;

    // Collect content until next heading or end
    const sectionContent = [];
    let $current = $(el).next();

    while ($current.length) {
      const tag = $current.prop("tagName");

      // Stop at next heading (h3 or bold paragraph)
      if (tag === "H3") break;
      if (isBoldHeading($, $current[0])) break;

      // Only include semantic content elements
      if (["P", "UL", "OL", "BLOCKQUOTE", "PRE"].includes(tag)) {
        sectionContent.push($.html($current));
      }

      $current = $current.next();
    }

    if (sectionContent.length > 0) {
      parts.push(`<h3>${title}</h3>`);
      parts.push(sectionContent.join(""));
    }
  }

  // Strip all HTML attributes (class, id, style, etc.)
  return stripHtmlAttributes(parts.join(""));
}

/**
 * Extract and build clean HTML for improwiki exercises.
 * Extracts main content paragraphs and sections.
 */
function cleanImprowikiDescription(rawHtml) {
  if (!rawHtml || rawHtml.trim() === "") return "";

  const $ = cheerio.load(rawHtml);
  const parts = [];

  // Find the content column
  const content = $(".col-lg-9").first();
  if (!content.length) return "";

  // Extract paragraphs, lists, and h2 sections
  content.children().each((i, el) => {
    const $el = $(el);
    const tag = $el.prop("tagName");
    const text = $el.text().trim();

    // Skip empty elements
    if (!text) return;

    // Skip license/UI noise
    if (text.includes("Text is available under CC BY-SA")) return;
    if (text.includes("You can also create collections")) return;
    if (text.includes("To overview")) return;

    // Include semantic content
    if (["P", "UL", "OL", "H2", "H3", "BLOCKQUOTE", "PRE"].includes(tag)) {
      // Convert paragraphs that contain only bold text to h3 headers
      if (tag === "P") {
        const boldText = $el.find("b, strong").first();
        // If paragraph has a bold element and the bold text matches the paragraph text
        // (meaning the whole paragraph is just bold), convert to h3
        if (boldText.length && boldText.text().trim() === text) {
          parts.push(`<h3>${text}</h3>`);
          return;
        }
      }

      parts.push($.html($el));
    }
  });

  // Strip all HTML attributes (class, id, style, etc.)
  return stripHtmlAttributes(parts.join(""));
}

/**
 * Clean description based on source.
 */
function cleanHtmlDescription(rawHtml, source) {
  if (source === "learnimprov") {
    return cleanLearnimprovDescription(rawHtml);
  } else if (source === "improwiki") {
    return cleanImprowikiDescription(rawHtml);
  }
  return "";
}

function processFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  const source = data.attribution.source.includes("improwiki") ? "improwiki" : "learnimprov";

  let cleanedCount = 0;
  let filteredNonExercises = 0;

  // First pass: clean descriptions
  data.exercises.forEach(ex => {
    // Process description_raw into cleaned description
    if (ex.description_raw && ex.description_raw.trim() !== "") {
      const cleaned = cleanHtmlDescription(ex.description_raw, source);
      if (cleaned !== ex.description) {
        ex.description = cleaned;
        cleanedCount++;
      }
    }
  });

  // Second pass: filter out non-exercise content (promotional pages, groups, theaters)
  const originalCount = data.exercises.length;
  data.exercises = data.exercises.filter(ex => {
    // Check if exercise has any non-exercise tags
    const hasNonExerciseTag = ex.tags.some(tag =>
      NON_EXERCISE_TAGS.includes(tag.toLowerCase())
    );
    if (hasNonExerciseTag) {
      filteredNonExercises++;
      return false;
    }
    return true;
  });

  // Count exercises missing summaries
  const missingSummaries = data.exercises.filter(ex => !ex.summary || ex.summary === "").length;

  // Update modified field to document transformations
  const today = new Date().toISOString().split("T")[0];
  data.attribution.modified = `${today}: Cleaned descriptions, normalized tags`;

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  console.log(`  ✓ Cleaned ${cleanedCount} descriptions`);
  console.log(`  ✓ Filtered out ${filteredNonExercises} non-exercise entries`);
  console.log(`  ✓ Final count: ${data.exercises.length} exercises`);

  return missingSummaries;
}

console.log("=== Cleanup Scraped Data ===");

let totalMissing = 0;

DATA_FILES.forEach(file => {
  try {
    totalMissing += processFile(file);
  } catch (err) {
    console.error(`  Error processing ${file}: ${err.message}`);
  }
});

if (totalMissing > 0) {
  console.log(`\n  ⚠ ${totalMissing} exercises are missing summaries.`);
  console.log("    To generate them, ask Claude to read the exercise JSON files");
  console.log("    and fill in empty summary fields.");
}

console.log("\nDone!");
