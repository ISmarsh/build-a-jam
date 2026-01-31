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
 *
 * 6. RENDERING HTML:
 *    - Using dangerouslySetInnerHTML to render HTML from scraped sources
 *    - @tailwindcss/typography's 'prose' classes automatically style HTML nicely
 *    - Similar to Angular's [innerHTML] binding but requires explicit opt-in
 */

import { useState } from 'react';
import type { Exercise } from '../types';
import ExerciseCard from './ExerciseCard';
import { Badge } from './ui/badge';

interface ExerciseListProps {
  exercises: Exercise[];
}

function ExerciseList({ exercises }: ExerciseListProps) {
  // STATE: Track which exercise is open in modal (null = no modal)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Early return pattern - like *ngIf but at component level
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-lg">
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
          />
        ))}
      </div>

      {/* MODAL: Conditional rendering - only shows when exercise selected */}
      {selectedExercise && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedExercise(null)}
        >
          {/* Stop propagation prevents closing when clicking modal content */}
          <div
            className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-indigo-500">
                  {selectedExercise.name}
                </h2>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedExercise.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-gray-700 text-indigo-400 border-gray-600"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Render description as HTML with custom prose styles from index.css */}
              <div
                className="prose prose-invert max-w-none prose-exercise"
                dangerouslySetInnerHTML={{ __html: selectedExercise.description }}
              />

              {selectedExercise.sourceUrl && (
                <div className="pt-4 border-t border-gray-700">
                  <a
                    href={selectedExercise.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline text-sm"
                  >
                    View original source →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExerciseList;
