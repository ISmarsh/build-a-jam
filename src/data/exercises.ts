/**
 * Exercise data loader
 *
 * Combines exercises from multiple scraped sources into a single array,
 * and supports runtime registration of custom user-created exercises.
 *
 * ANGULAR vs REACT:
 * - In Angular: you might load JSON via HttpClient in a service
 * - In React: Vite allows direct JSON imports at build time
 * - JSON imports are typed automatically, no need for explicit type assertions
 *
 * DATA STRUCTURE:
 * Each JSON file has: { attribution: {...}, exercises: Exercise[] }
 * We import the files and merge the exercises arrays.
 *
 * BRIDGING REACT STATE ↔ MODULE-LEVEL DATA:
 * Custom exercises live in React state (SessionContext) but many functions
 * here need to include them in results. We use a "registration" pattern:
 * SessionProvider calls registerCustomExercises() whenever custom exercises
 * change, updating a module-level variable that all functions reference.
 *
 * Angular equivalent: a singleton service that holds the canonical list.
 * Here, the module IS the singleton — ES modules are evaluated once and
 * shared across all importers.
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

// ---------------------------------------------------------------------------
// Custom exercise registration (bridges React state → module-level data)
// ---------------------------------------------------------------------------

/**
 * Module-level variable holding user-created exercises.
 *
 * REACT LEARNING NOTE — ESCAPE HATCH:
 * Normally React state is the single source of truth, but these lookup
 * functions (getExerciseById, filterBySource, etc.) are plain functions
 * that don't have access to React hooks. Instead of threading context
 * through every call site, we sync React state → this variable via
 * a useEffect in SessionProvider. It's pragmatic — the tradeoff is
 * that the data is "eventually consistent" (updated after render),
 * which is fine because it happens before the next paint.
 */
let customExercises: Exercise[] = [];

/**
 * Called by SessionProvider whenever custom exercises change.
 * Updates the module-level variable so all functions see them.
 */
export function registerCustomExercises(updated: Exercise[]): void {
  customExercises = updated;
  recomputeSourceCounts();
}

/** Get the current list of custom exercises (read-only snapshot). */
export function getCustomExercises(): readonly Exercise[] {
  return customExercises;
}

/** Get all exercises: static (scraped) + custom (user-created). */
function allExercises(): Exercise[] {
  return [...exercises, ...customExercises];
}

/**
 * Helper to get a single exercise by ID.
 * Returns undefined if not found.
 */
export function getExerciseById(id: string): Exercise | undefined {
  return allExercises().find(ex => ex.id === id);
}

/**
 * Format a duration in seconds as M:SS.
 *
 * Used across SessionPage, NotesPage, and HistoryPage to display
 * elapsed and target times consistently.
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
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
export type SourceFilter = 'all' | 'learnimprov' | 'improwiki' | 'custom';

/**
 * Filter exercises by source prefix.
 */
export function filterBySource(source: SourceFilter): Exercise[] {
  if (source === 'all') return allExercises();
  return allExercises().filter(ex => ex.id.startsWith(`${source}:`));
}

/**
 * Pre-computed counts per source for dropdown labels.
 * Recomputed when custom exercises are registered.
 */
function computeSourceCounts(): Record<SourceFilter, number> {
  const all = allExercises();
  return {
    all: all.length,
    learnimprov: all.filter(ex => ex.id.startsWith('learnimprov:')).length,
    improwiki: all.filter(ex => ex.id.startsWith('improwiki:')).length,
    custom: customExercises.length,
  };
}

export let sourceCounts: Record<SourceFilter, number> = computeSourceCounts();

function recomputeSourceCounts(): void {
  sourceCounts = computeSourceCounts();
}

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
    new Set(allExercises().flatMap(ex => ex.tags))
  ).sort();
}

/**
 * Compute the featured and full tag lists for a given set of exercises.
 * Used by both HomePage and PrepPage when the source filter changes.
 */
export function getTagsForExercises(exerciseList: Exercise[]): {
  featuredTags: string[];
  allTags: string[];
} {
  const tagsInSource = new Set(exerciseList.flatMap((ex) => ex.tags));
  return {
    featuredTags: FEATURED_TAGS.filter((tag) => tagsInSource.has(tag)),
    allTags: Array.from(tagsInSource).sort(),
  };
}

/**
 * Filter exercises by selected tags and search text.
 * Shared by HomePage and PrepPage.
 */
export function filterExercises(
  exerciseList: Exercise[],
  selectedTags: string[],
  searchText: string,
): Exercise[] {
  const hasSearch = searchText.trim() !== '';
  const searchLower = hasSearch ? searchText.toLowerCase() : '';

  return exerciseList.filter((exercise) => {
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => exercise.tags.includes(tag));

    const matchesSearch =
      !hasSearch ||
      exercise.name.toLowerCase().includes(searchLower) ||
      (exercise.summary?.toLowerCase().includes(searchLower) ?? false) ||
      exercise.tags.some((tag) => tag.toLowerCase().includes(searchLower));

    return matchesTags && matchesSearch;
  });
}

/**
 * Sort exercises so favorites appear first.
 */
export function sortByFavorites(
  exerciseList: Exercise[],
  favoriteIds: string[],
): Exercise[] {
  return [...exerciseList].sort((a, b) => {
    const aFav = favoriteIds.includes(a.id) ? 0 : 1;
    const bFav = favoriteIds.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });
}

/**
 * Format an ISO date string as a short readable date (e.g., "Mon, Jan 6").
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string as a short time (e.g., "3:42 PM").
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
