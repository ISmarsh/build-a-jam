/**
 * ExerciseCard Component
 *
 * LEARNING NOTES (Angular → React):
 *
 * 1. COMPONENTS:
 *    Angular: @Component decorator with template/templateUrl
 *    React: Just a function that returns JSX
 *
 * 2. PROPS (like Angular @Input):
 *    Angular: @Input() exercise!: Exercise;
 *    React: Props interface + function parameter
 *
 * 3. NO CLASS NEEDED:
 *    React functional components are just functions
 *    No constructor, lifecycle methods at class level
 *
 * 4. JSX:
 *    Similar to Angular templates, but JavaScript expressions
 *    Use {} for dynamic values (like {{ }} in Angular)
 */

import { Exercise } from '../types';

// Props interface - like defining @Input() properties in Angular
interface ExerciseCardProps {
  exercise: Exercise;
}

// Functional component - just a function that returns JSX
function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <div className="exercise-card">
      <h3>{exercise.title}</h3>
      <p className="description">{exercise.description}</p>

      {/* Conditional rendering - like *ngIf in Angular */}
      {exercise.duration && (
        <p className="duration">Duration: {exercise.duration} minutes</p>
      )}

      {/* List rendering - like *ngFor in Angular */}
      <div className="tags">
        {exercise.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ExerciseCard;
