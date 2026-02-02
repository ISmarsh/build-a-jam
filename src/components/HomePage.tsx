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
import { Star, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import ExerciseList from './ExerciseList';
import TagFilter from './TagFilter';
import { Button } from './ui/button';
import { filterBySource, getTagsForExercises, filterExercises, sortByFavorites, sourceCounts } from '../data/exercises';
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

  // COMPUTED VALUES: source filtering → tag computation → text/tag filtering → sort
  const sourceFilteredExercises = filterBySource(selectedSource);
  const { featuredTags, allTags } = getTagsForExercises(sourceFilteredExercises);
  const filteredExercises = filterExercises(sourceFilteredExercises, selectedTags, searchText);
  const sortedExercises = sortByFavorites(filteredExercises, favoriteIds);

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
          <Button asChild>
            <Link to="/prep">
              <span className="sm:hidden">Build!</span>
              <span className="hidden sm:inline">Build a jam!</span>
            </Link>
          </Button>
          {/* Favorites & History — hidden on mobile, available via BottomNav menu */}
          <Button variant="secondary" size="icon" className="hidden sm:flex" asChild>
            <Link to="/favorites" aria-label="Favorites" title="Favorites">
              <Star className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="secondary" size="icon" className="hidden sm:flex" asChild>
            <Link to="/history" aria-label="Session history" title="Session history">
              <Clock className="w-5 h-5" />
            </Link>
          </Button>
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-2"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
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
