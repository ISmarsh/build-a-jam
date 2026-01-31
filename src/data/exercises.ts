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
 * Curated tags shown in the filter UI.
 *
 * We have 57 unique tags in the data, but showing all of them is overwhelming.
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
  "scene work",
  "accepting",
  "object work",
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
