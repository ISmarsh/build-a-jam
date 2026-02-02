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

import { Star } from 'lucide-react';
import type { Exercise } from '../types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// Props interface - like defining @Input() properties in Angular
interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;        // Optional click handler - passed from parent
  isFavorite?: boolean;        // Whether this exercise is starred
  onToggleFavorite?: () => void;  // Toggle star on/off
}

// Functional component - using shadcn components
function ExerciseCard({ exercise, onClick, isFavorite, onToggleFavorite }: ExerciseCardProps) {
  // Only show summary if it exists - don't fall back to description (it's HTML now)
  const displayText = exercise.summary;

  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:border-indigo-500 bg-gray-800 border-gray-700 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-indigo-500">{exercise.name}</CardTitle>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="text-lg shrink-0 ml-2 transition-colors"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? (
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ) : (
                <Star className="w-5 h-5 text-gray-500 hover:text-yellow-400" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <p className="text-gray-300 leading-relaxed">
          {displayText}
        </p>

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

      {/* CardFooter with action button - clearer CTA than inline text */}
      <CardFooter className="pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-semibold py-2 px-4 rounded-lg transition-colors border border-indigo-600/30"
        >
          View Details
        </button>
      </CardFooter>
    </Card>
  );
}

export default ExerciseCard;
