/**
 * apply-inferred-tags.mjs
 *
 * Applies curated inferred tags to exercises based on content analysis.
 * These tags are NOT from source data — they represent improv concepts
 * (heightening, grounding, game of the scene) that exercises teach but
 * that source sites don't always categorize.
 *
 * Inferred tags are stored in src/data/inferred-tags.json and survive
 * re-scraping. This script merges them into the exercises' `tags` arrays
 * after normalization has run.
 *
 * Run as part of the post-processing pipeline (scrape-all.mjs) or standalone:
 *   node scripts/apply-inferred-tags.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_FILES = [
  resolve(__dirname, '../src/data/learnimprov-exercises.json'),
  resolve(__dirname, '../src/data/improwiki-exercises.json'),
];

const INFERRED_TAGS_FILE = resolve(__dirname, '../src/data/inferred-tags.json');

function loadInferredTags() {
  const data = JSON.parse(readFileSync(INFERRED_TAGS_FILE, 'utf-8'));

  // Build a map: exerciseId → Set of tags to add
  const exerciseTagMap = new Map();

  for (const [tagName, tagDef] of Object.entries(data.tags)) {
    for (const exerciseId of tagDef.exercises) {
      if (!exerciseTagMap.has(exerciseId)) {
        exerciseTagMap.set(exerciseId, new Set());
      }
      exerciseTagMap.get(exerciseId).add(tagName);
    }
  }

  return { exerciseTagMap, tagCount: Object.keys(data.tags).length };
}

function processFile(filePath, exerciseTagMap) {
  console.log(`\nProcessing: ${filePath}`);

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  let appliedCount = 0;
  let missingIds = [];

  // Track which IDs from the mapping were found in this file
  const foundIds = new Set();

  data.exercises.forEach((ex) => {
    const inferredTags = exerciseTagMap.get(ex.id);
    if (!inferredTags) return;

    foundIds.add(ex.id);

    // Merge inferred tags into existing tags (avoid duplicates)
    const existingTags = new Set(ex.tags || []);
    let added = 0;

    for (const tag of inferredTags) {
      if (!existingTags.has(tag)) {
        existingTags.add(tag);
        added++;
      }
    }

    if (added > 0) {
      ex.tags = [...existingTags].sort();
      appliedCount++;
    }
  });

  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  console.log(`  ✓ Applied inferred tags to ${appliedCount} exercises`);

  return foundIds;
}

console.log('=== Apply Inferred Tags ===');

const { exerciseTagMap, tagCount } = loadInferredTags();
console.log(`  Loaded ${tagCount} inferred tag definitions`);
console.log(`  Covering ${exerciseTagMap.size} unique exercises`);

const allFoundIds = new Set();

DATA_FILES.forEach((file) => {
  try {
    const foundIds = processFile(file, exerciseTagMap);
    foundIds.forEach((id) => allFoundIds.add(id));
  } catch (err) {
    console.error(`  Error processing ${file}: ${err.message}`);
  }
});

// Warn about any exercise IDs in the mapping that weren't found in any data file
const missingIds = [...exerciseTagMap.keys()].filter((id) => !allFoundIds.has(id));
if (missingIds.length > 0) {
  console.log(`\n  ⚠ ${missingIds.length} exercise IDs in inferred-tags.json not found in data:`);
  missingIds.forEach((id) => console.log(`    - ${id}`));
}

console.log('\nDone!');
