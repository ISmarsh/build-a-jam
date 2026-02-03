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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  return (
    <Card
      className="transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/30 hover:border-primary flex flex-col cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-primary truncate hover:underline">{exercise.name}</CardTitle>
            {exercise.isCustom && (
              <Badge variant="secondary" className="text-xs shrink-0">Custom</Badge>
            )}
          </div>
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
                <Star className="w-5 h-5 text-star fill-star" />
              ) : (
                <Star className="w-5 h-5 text-muted-foreground hover:text-star" />
              )}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <p className="text-secondary-foreground leading-relaxed">
          {exercise.summary}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {exercise.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-primary border-input"
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
