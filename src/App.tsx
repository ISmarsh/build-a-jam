/**
 * App Component - Main container
 *
 * LEARNING NOTES - STATE WITH HOOKS:
 *
 * 1. STATE MANAGEMENT:
 *    Angular: class properties with change detection
 *    React: useState hook
 *
 * 2. useState HOOK:
 *    - Returns [currentValue, setterFunction]
 *    - Array destructuring to name them
 *    - Calling setter triggers re-render
 *
 * 3. COMPUTED VALUES:
 *    Angular: getter methods or pipes
 *    React: just regular variables that recalculate on render
 *
 * 4. WHY HOOKS?
 *    - Simpler than class components (no 'this' keyword confusion)
 *    - Easy to share logic (custom hooks)
 *    - More functional programming style
 *
 * 5. LIFTING STATE UP:
 *    State lives in parent (App)
 *    Passed down as props to children
 *    Children call callbacks to modify parent state
 *    This is a core React pattern!
 */

import { useState } from 'react';
import ExerciseList from './components/ExerciseList';
import TagFilter from './components/TagFilter';
import { exercises } from './data/exercises';
import './App.css';

function App() {
  // STATE: useState hook - this is like a class property in Angular
  // useState returns [currentValue, setterFunction]
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // COMPUTED VALUE: Derive available tags from exercises
  // This recalculates on every render (like a getter in Angular)
  // For expensive calculations, you'd use useMemo (we'll learn that later)
  const availableTags = Array.from(
    new Set(exercises.flatMap((ex) => ex.tags))
  ).sort();

  // COMPUTED VALUE: Filter exercises based on selected tags
  const filteredExercises = selectedTags.length === 0
    ? exercises // No filters, show all
    : exercises.filter((exercise) =>
        // Exercise must have ALL selected tags
        selectedTags.every((tag) => exercise.tags.includes(tag))
      );

  // EVENT HANDLER: Toggle tag selection
  // This function will be passed down to TagFilter component
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      // If tag is already selected, remove it
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      }
      // Otherwise, add it
      return [...prevTags, tag];
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Build-a-Jam</h1>
        <p className="subtitle">
          Improv Exercise Repository - Find the perfect warm-up for your jam!
        </p>
      </header>

      <main className="app-main">
        {/* Child component receives state as props */}
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle} // Pass callback down
        />

        <div className="results-section">
          <h2>
            Exercises
            {selectedTags.length > 0 && ` (${filteredExercises.length})`}
          </h2>
          <ExerciseList exercises={filteredExercises} />
        </div>
      </main>
    </div>
  );
}

export default App;
