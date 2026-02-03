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
 * 3. XSS PREVENTION:
 *    User-entered text is displayed via dangerouslySetInnerHTML elsewhere
 *    in the app (ExerciseDetailModal). We escape HTML entities before
 *    wrapping in <p> tags to prevent injection.
 */

import { useState } from 'react';
import type { Exercise } from '../types';
import { getCustomExercises } from '../data/exercises';
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

/**
 * Convert plain text to safe HTML.
 * Escapes HTML entities to prevent XSS, then wraps in <p> tags
 * and converts newlines to <br /> for display.
 */
function plainTextToHtml(text: string): string {
  if (!text.trim()) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<p>${escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br />')}</p>`;
}

/**
 * Convert HTML back to plain text for editing.
 * Reverses the plainTextToHtml conversion.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<\/?p>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Parse a comma-separated tag string into a normalized tag array.
 * Lowercase, trimmed, deduplicated, empty strings removed.
 */
function parseTags(input: string): string[] {
  const tags = input
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
  return [...new Set(tags)];
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
  const [name, setName] = useState(existingExercise?.name ?? '');
  const [description, setDescription] = useState(
    existingExercise?.description ? htmlToPlainText(existingExercise.description) : ''
  );
  const [tags, setTags] = useState(existingExercise?.tags.join(', ') ?? '');
  const [summary, setSummary] = useState(existingExercise?.summary ?? '');
  const [error, setError] = useState('');

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
      tags: parseTags(tags),
      description: plainTextToHtml(description),
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
            />
          </div>

          {/* Description (optional) */}
          <div>
            <label htmlFor="exercise-description" className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="exercise-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How to run the exercise, rules, variations..."
              rows={4}
              className="w-full bg-secondary border border-input rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-y"
            />
          </div>

          {/* Tags (comma-separated) */}
          <div>
            <label htmlFor="exercise-tags" className="block text-sm font-medium text-foreground mb-1">
              Tags <span className="text-muted-foreground font-normal">(comma-separated)</span>
            </label>
            <input
              id="exercise-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="warm-up, circle, listening"
              className="w-full bg-secondary border border-input rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors"
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
