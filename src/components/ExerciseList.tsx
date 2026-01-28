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
 */

import { Exercise } from '../types';
import ExerciseCard from './ExerciseCard';

interface ExerciseListProps {
  exercises: Exercise[];
}

function ExerciseList({ exercises }: ExerciseListProps) {
  // Early return pattern - like *ngIf but at component level
  if (exercises.length === 0) {
    return (
      <div className="empty-state">
        <p>No exercises found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="exercise-list">
      {/* Map over array to render list - like *ngFor */}
      {exercises.map((exercise) => (
        // Key is REQUIRED - React uses it to track which items changed
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );
}

export default ExerciseList;
