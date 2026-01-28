/**
 * ExerciseCard Component
 *
 * LEARNING NOTES - USING SHADCN/UI COMPONENTS:
 *
 * 1. SHADCN/UI PHILOSOPHY:
 *    - Components are COPIED into your project (you own them)
 *    - Not installed from node_modules like MUI or Chakra
 *    - Can customize them however you want
 *
 * 2. CARD COMPONENT:
 *    shadcn Card is a composable component:
 *    - Card (container)
 *    - CardHeader, CardTitle, CardDescription (optional)
 *    - CardContent (main content)
 *    - CardFooter (optional)
 *
 * 3. BADGE COMPONENT:
 *    Perfect for tags - semantic HTML (not clickable)
 *    Has variants: default, secondary, destructive, outline
 *
 * 4. HYBRID APPROACH:
 *    - Use shadcn for generic components (Card, Badge)
 *    - Keep custom components when needed (our Button)
 *    - This is a practical React pattern
 */

import type { Exercise } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// Props interface - like defining @Input() properties in Angular
interface ExerciseCardProps {
  exercise: Exercise;
}

// Functional component - using shadcn components
function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:border-indigo-500 bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-indigo-500">{exercise.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300 leading-relaxed">{exercise.description}</p>

        {/* Conditional rendering - like *ngIf in Angular */}
        {exercise.duration && (
          <p className="text-gray-400 text-sm italic">
            Duration: {exercise.duration} minutes
          </p>
        )}

        {/* List rendering with Badge component */}
        <div className="flex flex-wrap gap-2">
          {exercise.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="bg-gray-700 text-indigo-400 border-gray-600"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ExerciseCard;
