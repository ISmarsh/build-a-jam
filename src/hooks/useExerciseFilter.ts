/**
 * useExerciseFilter — Shared hook for the exercise filter pipeline
 *
 * LEARNING NOTES - CUSTOM HOOKS FOR SHARED LOGIC:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you'd put reusable logic in a service (@Injectable) and inject it
 *    into multiple components via DI. The service holds state and provides methods.
 *    React: custom hooks extract reusable stateful logic. Each component that
 *    calls the hook gets its own independent copy of the state — unlike Angular
 *    services which are singletons by default.
 *
 * 2. WHY THIS HOOK:
 *    HomePage, PrepPage, and ExercisePickerDialog all use the exact same filter
 *    pipeline: source filter → tag computation → tag/text filter → favorites sort.
 *    Extracting this into a hook eliminates three copies of identical code while
 *    keeping each component's filter state independent (changing filters on the
 *    home page doesn't affect the session picker dialog).
 *
 * 3. THE PIPELINE:
 *    filterBySource(selectedSource)    → all exercises for chosen source
 *    getTagsForExercises(...)          → available tags for the tag filter UI
 *    filterExercises(..., tags, text)  → exercises matching current filters
 *    sortByFavorites(..., favoriteIds) → favorites float to the top
 */

import { useState } from 'react';
import { useSession } from '../context/SessionContext';
import {
  filterBySource,
  getTagsForExercises,
  filterExercises,
  sortByFavorites,
} from '../data/exercises';
import type { SourceFilter } from '../data/exercises';

export function useExerciseFilter() {
  const { state } = useSession();
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');

  // The pipeline: source → tags → filter → sort
  const sourceFiltered = filterBySource(selectedSource);
  const { featuredTags, allTags } = getTagsForExercises(sourceFiltered);
  const filtered = filterExercises(sourceFiltered, selectedTags, searchText);
  const sorted = sortByFavorites(filtered, state.favoriteExerciseIds);

  function handleSourceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedSource(event.target.value as SourceFilter);
    // Clear tag selections when changing source — tags differ between sources
    setSelectedTags([]);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return {
    selectedSource,
    handleSourceChange,
    selectedTags,
    handleTagToggle,
    searchText,
    setSearchText,
    featuredTags,
    allTags,
    filtered,
    sorted,
  };
}
