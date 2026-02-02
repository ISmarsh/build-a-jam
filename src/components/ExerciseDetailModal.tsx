/**
 * ExerciseDetailModal — Shows full exercise details in a Dialog overlay
 *
 * LEARNING NOTES - RADIX DIALOG:
 *
 * 1. ANGULAR vs REACT (LIBRARY):
 *    Angular: inject MatDialog service, call dialog.open(Component, config).
 *    React (Radix): compose Dialog primitives declaratively in JSX.
 *    Both handle focus trapping, Escape key, and backdrop click automatically.
 *
 * 2. WHAT RADIX DIALOG GIVES US (that our custom version didn't):
 *    - Focus trap: Tab cycles through focusable elements inside the dialog
 *    - Scroll lock: Body scroll is locked automatically (no manual useEffect)
 *    - Escape key: Built-in close handler (no manual keydown listener)
 *    - Portal: Content renders outside the DOM tree (avoids z-index wars)
 *    - ARIA: role="dialog", aria-describedby, aria-labelledby set for you
 *
 * 3. THE PATTERN:
 *    Parents still control visibility with `{exercise && <ExerciseDetailModal />}`.
 *    We render with `open={true}` and listen to `onOpenChange` to call `onClose`.
 *    This keeps the same interface — zero consumer changes needed.
 */

import { ExternalLink, X } from 'lucide-react';
import type { Exercise } from '../types';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="bg-card max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-dark p-0 gap-0"
      >
        {/* Header — title and close share a flex row for natural alignment */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-2xl font-bold text-primary">
              {exercise.name}
            </DialogTitle>
            <DialogClose className="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ring-offset-background">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          {exercise.alternativeNames && exercise.alternativeNames.length > 0 && (
            <DialogDescription className="text-muted-foreground text-sm mt-1">
              Also known as: {exercise.alternativeNames.join(', ')}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="p-6">
          {exercise.summary && (
            <p className="text-secondary-foreground text-base mb-4 italic">{exercise.summary}</p>
          )}

          {exercise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {exercise.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-primary border-input text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {exercise.description ? (
            <div
              className="text-secondary-foreground leading-relaxed prose-exercise max-w-none"
              dangerouslySetInnerHTML={{ __html: exercise.description }}
            />
          ) : (
            <p className="text-muted-foreground italic">No description available.</p>
          )}
        </div>

        {/* Footer — always horizontal: source link left, close button right */}
        <DialogFooter className="flex flex-row items-center justify-between px-6 py-3 border-t border-border">
          {exercise.sourceUrl ? (
            <a
              href={exercise.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-sm transition-colors"
            >
              Source <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <span />
          )}
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseDetailModal;
