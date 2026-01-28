/**
 * TagFilter Component
 *
 * LEARNING NOTES - EVENTS & STATE:
 *
 * 1. EVENTS:
 *    Angular: (click)="handleClick()"
 *    React: onClick={handleClick}
 *    Note: React uses camelCase (onClick, onChange, onSubmit)
 *
 * 2. EVENT HANDLERS:
 *    Angular: methods in the component class
 *    React: functions inside the component (or inline)
 *
 * 3. PASSING CALLBACKS:
 *    Similar to Angular's @Output() EventEmitter
 *    React: just pass functions as props
 *
 * 4. CSS CLASSES:
 *    Angular: [class.active]="isActive"
 *    React: className={isActive ? 'active' : ''}
 *    Note: Use 'className' not 'class' in JSX
 */

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void; // Like @Output() in Angular
}

function TagFilter({ availableTags, selectedTags, onTagToggle }: TagFilterProps) {
  return (
    <div className="tag-filter">
      <h2>Filter by Tags</h2>
      <div className="tag-buttons">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <button
              key={tag}
              // Dynamic className - like [class.active] in Angular
              className={`tag-button ${isSelected ? 'active' : ''}`}
              // Event handler - calls parent's function (lifted state pattern)
              onClick={() => onTagToggle(tag)}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {selectedTags.length > 0 && (
        <p className="filter-count">
          Filtering by: {selectedTags.join(', ')}
        </p>
      )}
    </div>
  );
}

export default TagFilter;
