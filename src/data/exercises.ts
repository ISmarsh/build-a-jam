/**
 * Exercise data loader
 *
 * Combines exercises from multiple scraped sources into a single array.
 *
 * ANGULAR vs REACT:
 * - In Angular: you might load JSON via HttpClient in a service
 * - In React: Vite allows direct JSON imports at build time
 * - JSON imports are typed automatically, no need for explicit type assertions
 *
 * DATA STRUCTURE:
 * Each JSON file has: { attribution: {...}, exercises: Exercise[] }
 * We import the files and merge the exercises arrays.
 */

import type { Exercise } from '../types';

// Import scraped exercise data
// Vite handles these as static imports and includes them in the bundle
import learnimprovData from './learnimprov-exercises.json';
import improwikiData from './improwiki-exercises.json';

/**
 * All exercises from all sources, merged into a single array.
 *
 * REACT LEARNING NOTE:
 * This is a simple array that gets imported by components. In Angular,
 * you might use a service with @Injectable and Observable streams.
 * In React, plain data imports work great for static data like this.
 * Later we can add filtering, search, and other transformations.
 */
export const exercises: Exercise[] = [
  // Spread operator (...) unpacks arrays - like concat but cleaner
  ...learnimprovData.exercises,
  ...improwikiData.exercises,
];

/**
 * Helper to get a single exercise by ID.
 * Returns undefined if not found.
 */
export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find(ex => ex.id === id);
}

/**
 * Format a duration in seconds as M:SS.
 *
 * Used across SessionPage, NotesPage, and HistoryPage to display
 * elapsed and target times consistently.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Source filter type — used by HomePage and PrepPage dropdowns.
 *
 * REACT LEARNING NOTE:
 * Extracting shared types to a central location avoids duplication
 * across components. In Angular you'd put this in a shared module
 * or a service interface — same idea, different mechanism.
 */
export type SourceFilter = 'all' | 'learnimprov' | 'improwiki';

/**
 * Filter exercises by source prefix.
 */
export function filterBySource(source: SourceFilter): Exercise[] {
  if (source === 'all') return exercises;
  return exercises.filter(ex => ex.id.startsWith(`${source}:`));
}

/**
 * Pre-computed counts per source for dropdown labels.
 * Avoids recalculating .filter().length on every render.
 */
export const sourceCounts: Record<SourceFilter, number> = {
  all: exercises.length,
  learnimprov: exercises.filter(ex => ex.id.startsWith('learnimprov:')).length,
  improwiki: exercises.filter(ex => ex.id.startsWith('improwiki:')).length,
};

/**
 * Curated tags shown in the filter UI.
 *
 * We have 60 unique tags in the data, but showing all of them is overwhelming.
 * This hand-picked list covers the most useful categories for browsing.
 * Edit this list to add/remove tags from the filter UI — the full tag data
 * stays on every exercise for search and future use.
 */
export const FEATURED_TAGS: string[] = [
  "warm-up",
  "circle",
  "listening",
  "characters",
  "problem-solving",
  "teamwork",
  "environment",
  "accepting",
  "object work",
  "heightening",
  "grounding",
  "game of the scene",
  "storytelling",
  "ice breaker",
  "pairs",
  "focus",
];

/**
 * Helper to get all unique tags across all exercises, sorted alphabetically.
 * This is useful for building tag filter UI.
 */
export function getAllTags(): string[] {
  // flatMap is like map + flatten - extracts all tags into a flat array
  // Set automatically deduplicates
  // Array.from converts Set back to array so we can sort it
  return Array.from(
    new Set(exercises.flatMap(ex => ex.tags))
  ).sort();
}
