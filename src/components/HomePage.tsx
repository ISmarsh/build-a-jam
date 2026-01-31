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
import ExerciseList from './ExerciseList';
import TagFilter from './TagFilter';
import { exercises, FEATURED_TAGS } from '../data/exercises';

// Source options for the dropdown
type SourceFilter = 'all' | 'learnimprov' | 'improwiki';

function HomePage() {
  // STATE: tag selection for filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // STATE: source selection (new - shows one source at a time)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');

  // STATE: text search filter
  const [searchText, setSearchText] = useState('');

  // COMPUTED VALUE: Filter by source first
  const sourceFilteredExercises = exercises.filter(ex => {
    if (selectedSource === 'all') return true;
    if (selectedSource === 'learnimprov') return ex.id.startsWith('learnimprov:');
    if (selectedSource === 'improwiki') return ex.id.startsWith('improwiki:');
    return true;
  });

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
            <option value="all">All Sources ({exercises.length})</option>
            <option value="learnimprov">learnimprov.com ({exercises.filter(ex => ex.id.startsWith('learnimprov:')).length})</option>
            <option value="improwiki">improwiki.com ({exercises.filter(ex => ex.id.startsWith('improwiki:')).length})</option>
          </select>
        </div>

        <Link
          to="/prep"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-5 rounded-lg transition-colors"
        >
          Build a Session
        </Link>
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
        <h2 className="mb-6 text-2xl font-semibold text-white flex-shrink-0">
          Exercises
          {` (${filteredExercises.length})`}
        </h2>
        <div className="overflow-y-auto">
          <ExerciseList exercises={filteredExercises} />
        </div>
      </div>
    </main>
  );
}

export default HomePage;
