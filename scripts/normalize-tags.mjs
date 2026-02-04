/**
 * normalize-tags.mjs
 *
 * Post-processing script to normalize exercise tags:
 * - Clean tags (remove hashtags, whitespace, normalize to lowercase)
 * - Apply tag normalizations (consolidate variations, rename categories)
 * - Filter out low-frequency tags (< 3 uses across all exercises)
 * - Remove blacklisted generic tags (exercise, game, other)
 *
 * IMPORTANT: Research improv terminology before blacklisting tags - many seemingly
 * generic terms are actually legitimate pedagogical categories.
 * See CLAUDE.md "Working with exercise tags" for research methodology.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_FILES = [
  resolve(__dirname, '../src/data/learnimprov-exercises.json'),
  resolve(__dirname, '../src/data/improwiki-exercises.json'),
];

// Tag normalization map (consolidate singular/plural variations, rename categories)
// Based on research of improv terminology - see commit history for investigation details
const TAG_NORMALIZATIONS = {
  character: 'characters',
  problem: 'problem-solving', // learnimprov.com category for ensemble/teamwork exercises
  less: 'restraint', // learnimprov.com category for minimalist/simplicity-focused exercises

  // Merge group-related tags into "teamwork"
  ensemble: 'teamwork',
  group: 'teamwork',
  support: 'teamwork',
  trust: 'teamwork',

  // Normalize place/space tags into "environment"
  environments: 'environment',
  setting: 'environment',
  'mime environment': 'environment',

  // Merge mime tags into "object work"
  mime: 'object work',
  'mime object': 'object work',
};

// Minimum number of times a tag must appear across all exercises to be kept
const MIN_TAG_FREQUENCY = 3;

function normalizeTag(tag) {
  // Remove leading hashtag and whitespace
  let cleaned = tag
    .replace(/^#\s*/, '') // Remove leading hashtag and whitespace
    .replace(/\s+/g, ' ') // Collapse all whitespace (including newlines)
    .trim() // Trim edges
    .toLowerCase(); // Normalize to lowercase

  // Skip empty tags
  if (!cleaned) return '';

  // Apply tag normalizations (e.g., "problem" → "problem-solving")
  if (TAG_NORMALIZATIONS[cleaned]) {
    cleaned = TAG_NORMALIZATIONS[cleaned];
  }

  return cleaned;
}

function processFile(filePath) {
  console.log(`\nProcessing: ${filePath}`);

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  // Count tag usage from rawTags (if available) or tags (fallback)
  const tagCounts = new Map();
  data.exercises.forEach((ex) => {
    const sourceTags = ex.rawTags || ex.tags; // Prefer rawTags
    sourceTags.forEach((tag) => {
      const normalized = normalizeTag(tag);
      tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
    });
  });

  // Blacklist of unhelpful tags (removed after research)
  // These tags are removed from exercises, but the exercises are kept
  // IMPORTANT: Tags should only be blacklisted after research - see CLAUDE.md
  const BLACKLISTED_TAGS = new Set([
    'exercise', // Too generic, almost everything is an exercise
    'game', // Redundant - if not warm-up, it's implicitly a game
    'other', // Not descriptive
    // NOTE: "group", "ensemble", "support", "trust" are now normalized to "teamwork"
    // NOTE: "problem", "less" were investigated and are now normalized to meaningful categories
  ]);

  // Filter out tags with < MIN_TAG_FREQUENCY uses AND blacklisted tags
  const validTags = new Set(
    [...tagCounts.entries()]
      .filter(([tag, count]) => count >= MIN_TAG_FREQUENCY && !BLACKLISTED_TAGS.has(tag))
      .map(([tag]) => tag),
  );

  const lowFreqCount = [...tagCounts.entries()].filter(
    ([_, count]) => count < MIN_TAG_FREQUENCY,
  ).length;
  const blacklistedCount = [...tagCounts.keys()].filter((tag) => BLACKLISTED_TAGS.has(tag)).length;

  console.log(`  Total unique tags before: ${tagCounts.size}`);
  console.log(`  Tags with >= ${MIN_TAG_FREQUENCY} uses: ${validTags.size}`);
  console.log(`  Filtered out ${lowFreqCount} low-frequency tags (< ${MIN_TAG_FREQUENCY} uses)`);
  console.log(`  Filtered out ${blacklistedCount} blacklisted tags`);

  // Normalize tags in all exercises (from rawTags if available)
  let normalizedCount = 0;
  data.exercises.forEach((ex) => {
    const sourceTags = ex.rawTags || ex.tags; // Prefer rawTags
    const originalTags = [...ex.tags];

    ex.tags = [
      ...new Set(
        sourceTags.map(normalizeTag).filter((tag) => tag.length > 0 && validTags.has(tag)), // Filter out empty tags
      ),
    ].sort();

    // Keep rawTags intact if it exists
    if (JSON.stringify(originalTags) !== JSON.stringify(ex.tags)) {
      normalizedCount++;
    }
  });

  // Note: modified field is updated by cleanup-scraped-data.mjs
  // This script is run as part of the data processing pipeline

  // Write back
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ Updated ${normalizedCount} exercises`);
}

console.log('=== Tag Normalization ===');

DATA_FILES.forEach((file) => {
  try {
    processFile(file);
  } catch (err) {
    console.error(`  Error processing ${file}: ${err.message}`);
  }
});

console.log('\nDone!');
