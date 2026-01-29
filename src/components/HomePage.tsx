/**
 * HomePage Component
 *
 * The main exercise browsing view — tag filtering and exercise list.
 * This was originally the body of App.tsx; it moved here when we added
 * React Router so App could serve as a layout shell.
 *
 * ANGULAR vs REACT:
 * - Angular: this would be a "routed component" declared in a route config
 * - React: it's just a regular component passed as a Route element
 */

import { useState } from 'react';
import ExerciseList from './ExerciseList';
import TagFilter from './TagFilter';
import { exercises } from '../data/exercises';

function HomePage() {
  // STATE: tag selection for filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // COMPUTED VALUE: Derive available tags from exercises
  const availableTags = Array.from(
    new Set(exercises.flatMap((ex) => ex.tags))
  ).sort();

  // COMPUTED VALUE: Filter exercises based on selected tags
  const filteredExercises = selectedTags.length === 0
    ? exercises
    : exercises.filter((exercise) =>
        selectedTags.every((tag) => exercise.tags.includes(tag))
      );

  // EVENT HANDLER: Toggle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      }
      return [...prevTags, tag];
    });
  };

  return (
    <main className="flex flex-col gap-8">
      <TagFilter
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
      />

      <div>
        <h2 className="mb-6 text-2xl font-semibold text-white">
          Exercises
          {selectedTags.length > 0 && ` (${filteredExercises.length})`}
        </h2>
        <ExerciseList exercises={filteredExercises} />
      </div>
    </main>
  );
}

export default HomePage;
