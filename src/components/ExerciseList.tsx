/**
 * ExerciseList Component
 *
 * LEARNING NOTES:
 *
 * 1. LIST RENDERING:
 *    Angular: *ngFor="let exercise of exercises"
 *    React: exercises.map((exercise) => ...)
 *
 * 2. KEY PROP:
 *    Angular: trackBy function (optional but recommended)
 *    React: key prop (REQUIRED for lists, React uses it for reconciliation)
 *
 * 3. CONDITIONAL RENDERING:
 *    Angular: *ngIf
 *    React: && operator or ternary
 *
 * 4. COMPONENT COMPOSITION:
 *    Similar to Angular, just import and use like <ExerciseCard />
 *
 * 5. MODAL STATE MANAGEMENT:
 *    - Modal state lives in this component (lifted state pattern)
 *    - ExerciseCard receives onClick prop to trigger modal
 *    - Modal renders conditionally when selectedExercise is not null
 *    - We reuse ExerciseDetailModal rather than duplicating modal markup
 */

import { useState } from 'react';
import type { Exercise } from '../types';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailModal from './ExerciseDetailModal';

interface ExerciseListProps {
  exercises: Exercise[];
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

function ExerciseList({ exercises, favoriteIds, onToggleFavorite }: ExerciseListProps) {
  // STATE: Track which exercise is open in modal (null = no modal)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Early return pattern - like *ngIf but at component level
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-lg">
        <p>No exercises found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Map over array to render list - like *ngFor */}
        {exercises.map((exercise) => (
          // Key is REQUIRED - React uses it to track which items changed
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onClick={() => setSelectedExercise(exercise)}
            isFavorite={favoriteIds?.includes(exercise.id)}
            onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(exercise.id) : undefined}
          />
        ))}
      </div>

      {/* MODAL: Reuses ExerciseDetailModal (Escape key, scroll lock, alt names) */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </>
  );
}

export default ExerciseList;
