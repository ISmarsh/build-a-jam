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

import { ArrowRight } from 'lucide-react';
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

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="bg-gray-800 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-dark p-0 gap-0"
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-700">
          <DialogTitle className="text-2xl font-bold text-white">
            {exercise.name}
          </DialogTitle>
          {exercise.alternativeNames && exercise.alternativeNames.length > 0 && (
            <DialogDescription className="text-gray-400 text-sm mt-1">
              Also known as: {exercise.alternativeNames.join(', ')}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="p-6">
          {exercise.summary && (
            <p className="text-gray-300 text-base mb-4 italic">{exercise.summary}</p>
          )}

          {exercise.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {exercise.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-gray-700 text-indigo-400 border-gray-600 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {exercise.description ? (
            <div
              className="text-gray-300 leading-relaxed prose-exercise max-w-none"
              dangerouslySetInnerHTML={{ __html: exercise.description }}
            />
          ) : (
            <p className="text-gray-500 italic">No description available.</p>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex items-center justify-between p-6 pt-4 border-t border-gray-700 sm:justify-between">
          {exercise.sourceUrl ? (
            <a
              href={exercise.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              View on source site <ArrowRight className="w-4 h-4 inline" />
            </a>
          ) : (
            <span />
          )}
          <DialogClose asChild>
            <button className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Close
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseDetailModal;
