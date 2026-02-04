/**
 * Exercise utility function tests
 *
 * LEARNING NOTES - TESTING PURE FUNCTIONS:
 *
 * 1. Pure functions are the easiest to test:
 *    - No side effects, no external dependencies
 *    - Given input X, always returns output Y
 *    - No need for mocks, contexts, or DOM setup
 *
 * 2. These utilities transform data:
 *    - formatDuration: seconds → "M:SS" string
 *    - filterExercises: list + filters → filtered list
 *    - sortByFavorites: list + favorites → sorted list
 *    - getTagsForExercises: list → { featuredTags, allTags }
 *
 * 3. Test structure:
 *    - Normal cases (happy path)
 *    - Edge cases (empty input, zero values)
 *    - Boundary conditions (exactly at thresholds)
 */

import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  filterExercises,
  sortByFavorites,
  getTagsForExercises,
  FEATURED_TAGS,
} from './exercises';
import type { Exercise } from '../types';

// Helper to create mock exercises
function mockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test:exercise-1',
    name: 'Test Exercise',
    tags: ['warm-up'],
    description: '<p>Test description</p>',
    sourceUrl: 'https://example.com',
    ...overrides,
  };
}

// =============================================================================
// formatDuration
// =============================================================================
describe('formatDuration', () => {
  it('formats seconds as M:SS', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(59)).toBe('0:59');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(61)).toBe('1:01');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(600)).toBe('10:00');
  });

  it('handles edge cases', () => {
    expect(formatDuration(NaN)).toBe('0:00');
    expect(formatDuration(Infinity)).toBe('0:00');
    expect(formatDuration(-Infinity)).toBe('0:00');
  });
});

// =============================================================================
// filterExercises
// =============================================================================
describe('filterExercises', () => {
  const exercises: Exercise[] = [
    mockExercise({ id: 'test:ex1', name: 'Zip Zap Zop', tags: ['warm-up', 'circle'] }),
    mockExercise({ id: 'test:ex2', name: 'New Choice', tags: ['listening', 'characters'] }),
    mockExercise({
      id: 'test:ex3',
      name: 'Environment',
      tags: ['environment'],
      summary: 'Build a space together',
    }),
  ];

  describe('tag filtering', () => {
    it('returns all exercises when no tags selected', () => {
      const result = filterExercises(exercises, [], '');
      expect(result).toHaveLength(3);
    });

    it('filters by a single tag', () => {
      const result = filterExercises(exercises, ['warm-up'], '');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Zip Zap Zop');
    });

    it('filters by multiple tags (AND logic)', () => {
      const result = filterExercises(exercises, ['warm-up', 'circle'], '');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Zip Zap Zop');
    });

    it('returns empty when no exercises match all tags', () => {
      const result = filterExercises(exercises, ['warm-up', 'characters'], '');
      expect(result).toHaveLength(0);
    });
  });

  describe('text search', () => {
    it('searches by name (case-insensitive)', () => {
      const result = filterExercises(exercises, [], 'zip');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Zip Zap Zop');
    });

    it('searches by summary', () => {
      const result = filterExercises(exercises, [], 'space');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Environment');
    });

    it('searches by tag', () => {
      const result = filterExercises(exercises, [], 'listen');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('New Choice');
    });

    it('returns all when search is whitespace', () => {
      const result = filterExercises(exercises, [], '   ');
      expect(result).toHaveLength(3);
    });
  });

  describe('combined filters', () => {
    it('applies both tag and text filters', () => {
      // Add another warm-up exercise
      const extendedList = [
        ...exercises,
        mockExercise({ id: 'test:ex4', name: 'Energy Pass', tags: ['warm-up', 'circle'] }),
      ];
      const result = filterExercises(extendedList, ['warm-up'], 'zip');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Zip Zap Zop');
    });
  });
});

// =============================================================================
// sortByFavorites
// =============================================================================
describe('sortByFavorites', () => {
  const exercises: Exercise[] = [
    mockExercise({ id: 'test:ex1', name: 'Alpha' }),
    mockExercise({ id: 'test:ex2', name: 'Beta' }),
    mockExercise({ id: 'test:ex3', name: 'Gamma' }),
  ];

  it('moves favorited exercises to the front', () => {
    const result = sortByFavorites(exercises, ['test:ex3']);
    expect(result[0].name).toBe('Gamma');
  });

  it('preserves relative order among favorites', () => {
    const result = sortByFavorites(exercises, ['test:ex3', 'test:ex1']);
    // Both are favorites, original order preserved within favorites
    expect(result[0].name).toBe('Alpha');
    expect(result[1].name).toBe('Gamma');
    expect(result[2].name).toBe('Beta');
  });

  it('preserves relative order among non-favorites', () => {
    const result = sortByFavorites(exercises, ['test:ex2']);
    expect(result[0].name).toBe('Beta');
    expect(result[1].name).toBe('Alpha');
    expect(result[2].name).toBe('Gamma');
  });

  it('handles empty favorites list', () => {
    const result = sortByFavorites(exercises, []);
    expect(result.map((e) => e.name)).toEqual(['Alpha', 'Beta', 'Gamma']);
  });

  it('does not mutate the original array', () => {
    const original = [...exercises];
    sortByFavorites(exercises, ['test:ex3']);
    expect(exercises).toEqual(original);
  });
});

// =============================================================================
// getTagsForExercises
// =============================================================================
describe('getTagsForExercises', () => {
  it('returns featured tags that exist in the exercise list', () => {
    const exercises: Exercise[] = [
      mockExercise({ tags: ['warm-up', 'circle', 'rare-tag'] }),
      mockExercise({ tags: ['listening', 'characters'] }),
    ];

    const { featuredTags } = getTagsForExercises(exercises);

    // Only featured tags that are present in exercises
    expect(featuredTags).toContain('warm-up');
    expect(featuredTags).toContain('circle'); // circle IS in FEATURED_TAGS
    expect(featuredTags).toContain('listening');
    expect(featuredTags).toContain('characters');
    // Non-featured tags should not be in featuredTags
    expect(featuredTags).not.toContain('rare-tag');
  });

  it('returns all unique tags sorted alphabetically', () => {
    const exercises: Exercise[] = [
      mockExercise({ tags: ['warm-up', 'zebra'] }),
      mockExercise({ tags: ['alpha', 'warm-up'] }),
    ];

    const { allTags } = getTagsForExercises(exercises);

    expect(allTags).toEqual(['alpha', 'warm-up', 'zebra']);
  });

  it('handles empty exercise list', () => {
    const { featuredTags, allTags } = getTagsForExercises([]);

    expect(featuredTags).toEqual([]);
    expect(allTags).toEqual([]);
  });

  it('maintains FEATURED_TAGS order', () => {
    // Create exercises with tags in reverse order of FEATURED_TAGS
    const exercises: Exercise[] = [mockExercise({ tags: ['focus', 'warm-up', 'listening'] })];

    const { featuredTags } = getTagsForExercises(exercises);

    // Order should match FEATURED_TAGS, not alphabetical or exercise order
    const featuredOrder = featuredTags.map((t) => FEATURED_TAGS.indexOf(t));
    const isSorted = featuredOrder.every((val, i, arr) => !i || arr[i - 1] <= val);
    expect(isSorted).toBe(true);
  });
});
