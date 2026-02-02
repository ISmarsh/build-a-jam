/**
 * ExerciseFilterBar — Shared filter controls for exercise browsing
 *
 * Used by both HomePage and PrepPage. Combines source dropdown, tag filter,
 * and search input into a consistent, reusable filter bar.
 *
 * LEARNING NOTES - COMPONENT EXTRACTION:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you'd create a shared module with the component, export it
 *    React: just create the component file and import it — no module boilerplate
 *
 * 2. WHEN TO EXTRACT:
 *    When two components share the same UI pattern with the same props shape,
 *    that's a good signal to extract. Here, HomePage and PrepPage both had
 *    source dropdown + tag filter + search input with identical behaviour.
 *
 * 3. COMPOSITION WITH children:
 *    The component accepts optional children rendered in the header row.
 *    This lets each page add its own action buttons (e.g. "Build a jam!")
 *    without the filter bar needing to know about them.
 */

import { X } from 'lucide-react';
import TagFilter from './TagFilter';
import { sourceCounts } from '../data/exercises';
import type { SourceFilter } from '../data/exercises';

interface ExerciseFilterBarProps {
  /** Current source selection */
  selectedSource: SourceFilter;
  onSourceChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;

  /** Tag filter state */
  featuredTags: string[];
  allTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;

  /** Text search state */
  searchText: string;
  onSearchChange: (text: string) => void;

  /** Unique prefix for HTML ids (avoids duplicate ids when two instances exist) */
  idPrefix?: string;

  /** Optional content rendered to the right of the source dropdown (action buttons, etc.) */
  children?: React.ReactNode;
}

function ExerciseFilterBar({
  selectedSource,
  onSourceChange,
  featuredTags,
  allTags,
  selectedTags,
  onTagToggle,
  searchText,
  onSearchChange,
  idPrefix = 'filter',
  children,
}: ExerciseFilterBarProps) {
  const sourceId = `${idPrefix}-source`;
  const searchId = `${idPrefix}-search`;

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: source dropdown (left) + optional actions (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <label htmlFor={sourceId} className="text-secondary-foreground font-medium shrink-0">
            Source:
          </label>
          <select
            id={sourceId}
            value={selectedSource}
            onChange={onSourceChange}
            className="bg-card text-white border rounded-lg px-3 py-2 text-sm sm:text-base sm:px-4 focus:outline-none focus:ring-2 focus:ring-ring min-w-0"
          >
            <option value="all">All Sources ({sourceCounts.all})</option>
            <option value="learnimprov">learnimprov.com ({sourceCounts.learnimprov})</option>
            <option value="improwiki">improwiki.com ({sourceCounts.improwiki})</option>
          </select>
        </div>
        {children}
      </div>

      {/* Tag filter */}
      <TagFilter
        featuredTags={featuredTags}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
      />

      {/* Search input */}
      <div className="flex flex-col gap-1">
        <label htmlFor={searchId} className="text-secondary-foreground font-medium">
          Search exercises:
        </label>
        <div className="relative">
          <input
            id={searchId}
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, description, or tags..."
            className="bg-card text-white border rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-ring placeholder-gray-500"
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white px-2"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExerciseFilterBar;
