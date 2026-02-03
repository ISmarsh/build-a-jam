/**
 * ExerciseFormDialog — Create or edit a custom user-created exercise
 *
 * LEARNING NOTES - CONTROLLED FORMS + VALIDATION:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: Reactive Forms with FormControl, FormGroup, and built-in
 *    Validators (Validators.required, Validators.minLength, etc.).
 *    React: "Controlled components" — each input's value is tied to state,
 *    and validation is just regular JavaScript in the submit handler.
 *    Simpler but less structured; Angular gives you a form object you
 *    can inspect (.valid, .dirty, .errors) while React is ad-hoc.
 *
 * 2. SLUG GENERATION:
 *    IDs are generated once at creation time and never change, even if
 *    the user later edits the name. This prevents breaking references
 *    in session queues, templates, and favorites. Same pattern used by
 *    scraped exercises (IDs are source-based, not name-based).
 *
 * 3. TIPTAP INTEGRATION:
 *    We use Tiptap (a headless rich text editor built on ProseMirror) for
 *    the description field. Tiptap works directly with HTML, so we no longer
 *    need to convert between plain text and HTML — the editor accepts HTML
 *    as input and outputs HTML when content changes. This provides a true
 *    WYSIWYG experience where users see formatting as they type.
 */

import { useState, useMemo } from 'react';
import type { Exercise } from '../types';
import { getCustomExercises, filterBySource, getTagsForExercises } from '../data/exercises';
import RichTextEditor from './RichTextEditor';
import TagInput from './TagInput';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface ExerciseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (exercise: Exercise) => void;
  /** If provided, we're editing this exercise (pre-fill fields) */
  existingExercise?: Exercise;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a URL-friendly slug from a name.
 * E.g., "My Cool Exercise!" → "my-cool-exercise"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique ID for a custom exercise.
 * Appends a short random suffix to avoid collisions when names are similar.
 */
function generateCustomId(name: string): string {
  const slug = slugify(name) || 'exercise';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `custom:${slug}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ExerciseFormDialog({
  open,
  onClose,
  onSave,
  existingExercise,
}: ExerciseFormDialogProps) {
  const isEditing = !!existingExercise;

  // Pre-fill from existing exercise when editing
  // Note: description is now stored as HTML directly (Tiptap handles it natively)
  const [name, setName] = useState(existingExercise?.name ?? '');
  const [description, setDescription] = useState(existingExercise?.description ?? '');
  const [tags, setTags] = useState<string[]>(existingExercise?.tags ?? []);
  const [summary, setSummary] = useState(existingExercise?.summary ?? '');
  const [error, setError] = useState('');

  // Get all available tags from the exercise library for autocomplete
  const availableTags = useMemo(() => {
    const allExercises = filterBySource('all');
    const { allTags } = getTagsForExercises(allExercises);
    return allTags;
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    // Check for duplicate names among custom exercises (by slug comparison).
    // Only check for new exercises, or if the name changed during editing.
    if (!isEditing || trimmedName !== existingExercise?.name) {
      const newSlug = slugify(trimmedName);
      const duplicate = getCustomExercises().find(ex =>
        ex.id !== existingExercise?.id && slugify(ex.name) === newSlug
      );
      if (duplicate) {
        setError('An exercise with a similar name already exists.');
        return;
      }
    }

    const exercise: Exercise = {
      id: existingExercise?.id ?? generateCustomId(trimmedName),
      name: trimmedName,
      tags, // Already an array from TagInput
      description, // Tiptap outputs HTML directly
      summary: summary.trim() || undefined,
      isCustom: true,
    };

    onSave(exercise);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-card max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? 'Edit Exercise' : 'Create Exercise'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update your custom exercise.'
              : 'Add your own exercise to the library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (required) */}
          <div>
            <label htmlFor="exercise-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              id="exercise-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., Zip Zap Zop"
              className="w-full bg-secondary border border-input rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              autoComplete="off"
              autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- dialog just opened
            />
          </div>

          {/* Summary (optional) */}
          <div>
            <label htmlFor="exercise-summary" className="block text-sm font-medium text-foreground mb-1">
              Summary <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              id="exercise-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief one-liner about what the exercise does"
              className="w-full bg-secondary border border-input rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              autoComplete="off"
            />
          </div>

          {/* Description (optional) with Tiptap WYSIWYG editor */}
          <div>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="How to run the exercise, rules, variations..."
            >
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </RichTextEditor>
          </div>

          {/* Tags with autocomplete */}
          <div>
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- TagInput uses aria-labelledby */}
            <label id="exercise-tags-label" className="block text-sm font-medium text-foreground mb-1">
              Tags <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={availableTags}
              placeholder="Add tags..."
              labelId="exercise-tags-label"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ExerciseFormDialog;
