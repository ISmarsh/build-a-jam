/**
 * TagFilter Component
 *
 * LEARNING NOTES - COMPONENT COMPOSITION:
 *
 * 1. COMPOSITION OVER DUPLICATION:
 *    Instead of repeating button styles, we extract a Button component
 *    This is a core React pattern - build UIs from small, reusable pieces
 *
 * 2. EVENTS:
 *    Angular: (click)="handleClick()"
 *    React: onClick={handleClick}
 *    Note: React uses camelCase (onClick, onChange, onSubmit)
 *
 * 3. PASSING CALLBACKS:
 *    Similar to Angular's @Output() EventEmitter
 *    React: just pass functions as props
 *
 * 4. LOCAL STATE:
 *    The "show all" toggle is local UI state — it doesn't affect
 *    filtering logic, just which tags are visible. This is a good
 *    example of keeping state where it belongs.
 */

import { useState } from 'react';
import Button from './ui/TagButton';

interface TagFilterProps {
  featuredTags: string[]; // Curated subset shown by default
  allTags: string[]; // Every tag in the current source
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

function TagFilter({ featuredTags, allTags, selectedTags, onTagToggle }: TagFilterProps) {
  // Local state: whether to show all tags or just featured ones
  const [showAll, setShowAll] = useState(false);

  const displayedTags = showAll ? allTags : featuredTags;
  const hasMore = allTags.length > featuredTags.length;

  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Filter by tags">
      <span className="font-medium text-secondary-foreground">Filter by tags:</span>
      <div className="flex flex-wrap gap-2">
        {displayedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <Button key={tag} variant="tag" active={isSelected} onClick={() => onTagToggle(tag)}>
              {tag}
            </Button>
          );
        })}

        {/* Show more/less toggle */}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-2 py-1 text-sm text-primary transition-colors hover:text-primary-hover"
          >
            {showAll ? 'show less' : `+${allTags.length - featuredTags.length} more`}
          </button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <p className="text-sm italic text-muted-foreground">
          Filtering by: {selectedTags.join(', ')}
        </p>
      )}
    </div>
  );
}

export default TagFilter;
