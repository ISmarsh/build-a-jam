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

import { useState, useRef } from 'react';
import { Bold, List, ListOrdered } from 'lucide-react';
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
 * Convert plain text with simple markdown to safe HTML.
 * Escapes HTML entities to prevent XSS, then:
 * - Converts **text** to <strong>text</strong>
 * - Converts • bullets to proper list items
 * - Converts numbered steps (1. 2. 3.) to ordered list
 * - Wraps in <p> tags with <br /> for line breaks
 */
function plainTextToHtml(text: string): string {
  if (!text.trim()) return '';

  // First escape HTML entities
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert **text** to <strong>text</strong>
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Process lines to detect lists
  const lines = escaped.split('\n');
  const result: string[] = [];
  let inBulletList = false;
  let inNumberedList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Bullet point line
    if (trimmed.startsWith('• ')) {
      if (!inBulletList) {
        if (inNumberedList) { result.push('</ol>'); inNumberedList = false; }
        result.push('<ul>');
        inBulletList = true;
      }
      result.push(`<li>${trimmed.slice(2)}</li>`);
      continue;
    }

    // Numbered step line (1. 2. 3. etc.)
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (!inNumberedList) {
        if (inBulletList) { result.push('</ul>'); inBulletList = false; }
        result.push('<ol>');
        inNumberedList = true;
      }
      result.push(`<li>${numberedMatch[2]}</li>`);
      continue;
    }

    // Regular line — close any open lists
    if (inBulletList) { result.push('</ul>'); inBulletList = false; }
    if (inNumberedList) { result.push('</ol>'); inNumberedList = false; }

    // Empty line = paragraph break, non-empty = content
    if (trimmed === '') {
      result.push('</p><p>');
    } else {
      result.push(line);
      result.push('<br />');
    }
  }

  // Close any remaining lists
  if (inBulletList) result.push('</ul>');
  if (inNumberedList) result.push('</ol>');

  // Wrap in <p> and clean up empty paragraphs
  let html = `<p>${result.join('')}</p>`;
  html = html.replace(/<br \/><\/p>/g, '</p>');
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br \/>/g, '<p>');

  return html;
}

/**
 * Convert HTML back to plain text for editing.
 * Reverses the plainTextToHtml conversion, including lists and bold.
 */
function htmlToPlainText(html: string): string {
  let text = html;

  // Convert <strong> to **text**
  text = text.replace(/<strong>([^<]+)<\/strong>/g, '**$1**');

  // Convert ordered list items to numbered steps
  let stepNum = 0;
  text = text.replace(/<ol>/g, () => { stepNum = 0; return ''; });
  text = text.replace(/<\/ol>/g, '');
  text = text.replace(/<li>([^<]*)<\/li>/g, (_, content) => {
    // Check if we're in an ordered list context (number) or bullet
    // This is a heuristic — if stepNum was reset, we're in an ordered list
    stepNum++;
    return `${stepNum}. ${content}\n`;
  });

  // Convert unordered list items to bullets
  text = text.replace(/<ul>/g, '');
  text = text.replace(/<\/ul>/g, '');
  // Reset stepNum to detect bullet lists (hacky but works for simple cases)
  text = text.replace(/<li>([^<]*)<\/li>/g, '• $1\n');

  // Standard conversions
  text = text.replace(/<br\s*\/?>/g, '\n');
  text = text.replace(/<\/p><p>/g, '\n\n');
  text = text.replace(/<\/?p>/g, '');

  // Unescape HTML entities
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');

  return text.trim();
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Pre-fill from existing exercise when editing
  const [name, setName] = useState(existingExercise?.name ?? '');
  const [description, setDescription] = useState(
    existingExercise?.description ? htmlToPlainText(existingExercise.description) : ''
  );
  const [tags, setTags] = useState(existingExercise?.tags.join(', ') ?? '');
  const [summary, setSummary] = useState(existingExercise?.summary ?? '');
  const [error, setError] = useState('');

  // Insert text at cursor position in description textarea
  function insertAtCursor(textBefore: string, textAfter: string = '') {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.slice(start, end);
    const newText =
      description.slice(0, start) +
      textBefore +
      selected +
      textAfter +
      description.slice(end);

    setDescription(newText);

    // Restore cursor position after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + textBefore.length + selected.length + textAfter.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }

  // Formatting helpers for improv exercises
  function insertBulletList() {
    insertAtCursor('\n• ');
  }

  function insertNumberedStep() {
    // Find the next step number based on existing numbered lines
    const lines = description.split('\n');
    let maxStep = 0;
    for (const line of lines) {
      const match = line.match(/^(\d+)\./);
      if (match) maxStep = Math.max(maxStep, parseInt(match[1], 10));
    }
    insertAtCursor(`\n${maxStep + 1}. `);
  }

  function insertBold() {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const selected = description.slice(textarea.selectionStart, textarea.selectionEnd);
    if (selected) {
      insertAtCursor('**', '**');
    } else {
      insertAtCursor('**text**');
    }
  }

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

          {/* Description (optional) with formatting toolbar */}
          <div>
            <label htmlFor="exercise-description" className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            {/* Formatting toolbar — common patterns for improv exercise instructions */}
            <div className="flex items-center gap-1 mb-1">
              <button
                type="button"
                onClick={insertNumberedStep}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                title="Add numbered step (for multi-step exercises)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={insertBulletList}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                title="Add bullet point (for tips, variations)"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={insertBold}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                title="Bold text (for emphasis)"
              >
                <Bold className="w-4 h-4" />
              </button>
              <span className="text-muted-foreground text-xs ml-2">
                Use **text** for bold
              </span>
            </div>
            <textarea
              id="exercise-description"
              ref={descriptionRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How to run the exercise, rules, variations..."
              rows={4}
              className="w-full bg-secondary border border-input rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-y font-mono"
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
