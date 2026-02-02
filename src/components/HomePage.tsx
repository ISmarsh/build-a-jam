/**
 * HomePage Component
 *
 * The main exercise browsing view — source filtering, tag filtering,
 * text search, and exercise list.
 *
 * ANGULAR vs REACT:
 * - Angular: this would be a "routed component" declared in a route config
 * - React: it's just a regular component passed as a Route element
 *
 * LEARNING NOTES:
 * - CONTROLLED INPUTS: The search input is a "controlled component" where
 *   React state is the single source of truth. The input's value comes from
 *   state, and onChange updates that state. This is different from Angular's
 *   two-way binding [(ngModel)] but achieves the same result with explicit
 *   one-way data flow.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import ExerciseList from './ExerciseList';
import TagFilter from './TagFilter';
import { FEATURED_TAGS, filterBySource, sourceCounts } from '../data/exercises';
import type { SourceFilter } from '../data/exercises';

function HomePage() {
  // SESSION CONTEXT: access favorite exercise IDs
  const { state, dispatch } = useSession();
  const favoriteIds = state.favoriteExerciseIds;

  // STATE: tag selection for filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // STATE: source selection (new - shows one source at a time)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');

  // STATE: text search filter
  const [searchText, setSearchText] = useState('');

  // COMPUTED VALUE: Filter by source first (shared logic in exercises.ts)
  const sourceFilteredExercises = filterBySource(selectedSource);

  // COMPUTED VALUE: Tags available in the current source
  // Featured tags are shown by default; all tags available via "show more"
  const tagsInSource = new Set(sourceFilteredExercises.flatMap((ex) => ex.tags));
  const featuredTags = FEATURED_TAGS.filter((tag) => tagsInSource.has(tag));
  const allTags = Array.from(tagsInSource).sort();

  // COMPUTED VALUE: Filter exercises based on source, selected tags, AND search text
  const filteredExercises = sourceFilteredExercises.filter((exercise) => {
    // Tag filter: if tags are selected, exercise must have all of them
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every((tag) => exercise.tags.includes(tag));

    // Text filter: if search text exists, check name, summary, and tags
    const matchesSearch = searchText.trim() === '' || (() => {
      const searchLower = searchText.toLowerCase();
      const nameMatch = exercise.name.toLowerCase().includes(searchLower);
      const summaryMatch = exercise.summary?.toLowerCase().includes(searchLower) || false;
      const tagsMatch = exercise.tags.some(tag => tag.toLowerCase().includes(searchLower));
      return nameMatch || summaryMatch || tagsMatch;
    })();

    return matchesTags && matchesSearch;
  });

  // SORTING: Favorited exercises float to the top of the list
  const sortedExercises = [...filteredExercises].sort((a, b) => {
    const aFav = favoriteIds.includes(a.id) ? 0 : 1;
    const bFav = favoriteIds.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  // EVENT HANDLER: Toggle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      }
      return [...prevTags, tag];
    });
  };

  // EVENT HANDLER: Change source filter
  const handleSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(event.target.value as SourceFilter);
    // Clear tag selections when changing source
    setSelectedTags([]);
  };

  return (
    <main className="flex flex-col gap-8">
      {/* Top bar with source filter and session builder button */}
      <div className="flex justify-between items-center gap-4">
        {/* Source filter dropdown */}
        <div className="flex items-center gap-3">
          <label htmlFor="source-filter" className="text-gray-300 font-medium">
            Source:
          </label>
          <select
            id="source-filter"
            value={selectedSource}
            onChange={handleSourceChange}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Sources ({sourceCounts.all})</option>
            <option value="learnimprov">learnimprov.com ({sourceCounts.learnimprov})</option>
            <option value="improwiki">improwiki.com ({sourceCounts.improwiki})</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/prep"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
          >
            <span className="sm:hidden">Build!</span>
            <span className="hidden sm:inline">Build a jam!</span>
          </Link>
          {/* Favorites & History — hidden on mobile, available via BottomNav menu */}
          <Link
            to="/favorites"
            className="hidden sm:flex bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded-lg transition-colors"
            aria-label="Favorites"
            title="Favorites"
          >
            {/* Star icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </Link>
          <Link
            to="/history"
            className="hidden sm:flex bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white p-2 rounded-lg transition-colors"
            aria-label="Session history"
            title="Session history"
          >
            {/* Clock/history icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </Link>
        </div>
      </div>

      <TagFilter
        featuredTags={featuredTags}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
      />

      {/* Text search input with clear button */}
      <div className="flex flex-col gap-2">
        <label htmlFor="search-text" className="text-gray-300 font-medium">
          Search exercises:
        </label>
        <div className="relative">
          <input
            id="search-text"
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by name, description, or tags..."
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
          {/* Clear button - only show when there's text */}
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xl leading-none px-2"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col min-h-0">
        <h2 className="mb-3 text-2xl font-semibold text-white flex-shrink-0">
          Exercises
          {` (${filteredExercises.length})`}
        </h2>
        <div className="pt-3 overflow-y-auto">
          <ExerciseList
            exercises={sortedExercises}
            favoriteIds={favoriteIds}
            onToggleFavorite={(id) => {
              const wasFavorite = favoriteIds.includes(id);
              dispatch({ type: 'TOGGLE_FAVORITE_EXERCISE', exerciseId: id });
              toast(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
            }}
          />
        </div>
      </div>
    </main>
  );
}

export default HomePage;
