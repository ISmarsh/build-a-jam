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
 * 4. CLEANER CODE:
 *    Compare this to the previous version - much more readable!
 *    The Button component handles all the styling complexity
 */

import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void; // Like @Output() in Angular
}

function TagFilter({ availableTags, selectedTags, onTagToggle }: TagFilterProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Filter by Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);

            return (
              <Button
                key={tag}
                variant="tag"
                active={isSelected}
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </Button>
            );
          })}
        </div>

        {selectedTags.length > 0 && (
          <p className="text-gray-400 text-sm italic">
            Filtering by: {selectedTags.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default TagFilter;
