/**
 * NotesPage Component — Post-session reflections
 *
 * LEARNING NOTES - CONTROLLED COMPONENTS / FORMS:
 *
 * 1. ANGULAR vs REACT FORMS:
 *    Angular: Reactive Forms with FormControl, FormGroup, validators
 *    React: "Controlled components" — form state lives in React state,
 *    inputs get value + onChange. Simpler model, less boilerplate.
 *
 * 2. CONTROLLED vs UNCONTROLLED:
 *    - Controlled: React state is the source of truth (value={state})
 *    - Uncontrolled: DOM is the source of truth (useRef to read it)
 *    - Controlled is the recommended pattern — it's like Angular's
 *      reactive forms where you always know the current value
 *
 * 3. textarea:
 *    In HTML, textarea content goes between tags: <textarea>text</textarea>
 *    In React, textarea uses value prop just like input: <textarea value={...} />
 *    This is one of React's "controlled" normalizations.
 */

import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Star, RefreshCw } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useTemplateSaver } from '../hooks/useTemplateSaver';
import { getExerciseName, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import type { Session } from '../types';

/**
 * Compare two sessions to check if exercises have changed.
 * Used to determine if "Update template" option should be shown.
 */
function hasExerciseChanges(current: Session, original: Session): boolean {
  const currentExercises = current.exercises;
  const originalExercises = original.exercises;

  // Different count = definitely modified
  if (currentExercises.length !== originalExercises.length) {
    return true;
  }

  // Compare each exercise (id, duration, order)
  return currentExercises.some((ex, i) => {
    const orig = originalExercises[i];
    return (
      ex.exerciseId !== orig.exerciseId ||
      ex.duration !== orig.duration ||
      ex.order !== orig.order
    );
  });
}

// Save mode: 'none' = no template action, 'update' = update existing, 'new' = save as new
type SaveMode = 'none' | 'update' | 'new';

function NotesPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [saveMode, setSaveMode] = useState<SaveMode>('none');
  const template = useTemplateSaver();

  const session = state.currentSession;

  // Look up the source template if this session was loaded from one
  // Note: React Compiler requires the full `session` object as dependency
  // because we access multiple properties inside the memo
  const sourceTemplate = useMemo(() => {
    if (!session?.sourceTemplateId) return null;
    return state.sessions.find((s) => s.id === session.sourceTemplateId) ?? null;
  }, [session, state.sessions]);

  // Check if session was modified from the source template
  const wasModified = useMemo(() => {
    if (!session || !sourceTemplate) return false;
    return hasExerciseChanges(session, sourceTemplate);
  }, [session, sourceTemplate]);

  // If there's no session to take notes on, redirect to home
  if (!session) {
    return <Navigate to="/" replace />;
  }

  function handleSetSaveMode(mode: SaveMode) {
    if (mode === saveMode) {
      // Toggle off
      setSaveMode('none');
      template.cancel();
    } else {
      setSaveMode(mode);
      if (mode === 'new') {
        // Start with empty name for new template
        template.start('');
      } else {
        template.cancel();
      }
    }
  }

  function handleComplete() {
    // Handle template save/update based on mode
    if (saveMode === 'update' && sourceTemplate) {
      template.update(sourceTemplate.id, sourceTemplate.name ?? 'Unnamed');
    } else if (saveMode === 'new' && template.templateName.trim()) {
      template.save();
    }
    dispatch({ type: 'COMPLETE_SESSION', notes });
    void navigate('/');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Session Complete</h1>
      <p className="text-muted-foreground mb-8">
        How did it go? Jot down what worked, what didn't, and anything to remember.
      </p>

      {/* Exercises that were run */}
      <h2 className="text-lg font-semibold text-foreground mb-3">Exercises</h2>
      <div className="space-y-2 mb-4">
        {session.exercises.map((se, i) => (
          <Card key={se.slotId ?? i}>
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {getExerciseName(se)}
                </span>
                <span className="text-muted-foreground text-sm">
                  {se.actualSeconds != null
                    ? <>{formatDuration(se.actualSeconds)} <span className="text-muted-foreground">/ {se.duration} min</span></>
                    : <>{se.duration} min</>
                  }
                </span>
              </div>
              {se.notes && (
                <p className="text-muted-foreground text-sm mt-1 ml-5">{se.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Session totals */}
      {(() => {
        const plannedMinutes = session.exercises.reduce((sum, ex) => sum + ex.duration, 0);
        const actualTotalSeconds = session.exercises.reduce((sum, ex) => sum + (ex.actualSeconds ?? 0), 0);
        const hasActualTime = session.exercises.some((ex) => ex.actualSeconds != null);
        return (
          <p className="text-muted-foreground text-sm mb-8">
            Total: {hasActualTime
              ? <>{formatDuration(actualTotalSeconds)} <span className="text-muted-foreground">/ {plannedMinutes} min planned</span></>
              : <>{plannedMinutes} min</>
            }
          </p>
        );
      })()}

      {/* Notes textarea — controlled component */}
      <h2 className="text-lg font-semibold text-foreground mb-3">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What worked well? What needs work? Any exercises to try next time?"
        rows={6}
        className="w-full bg-card border rounded-lg p-4 text-secondary-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-y"
      />

      {/* Template save options */}
      <div className="mt-4 space-y-2">
        {/* Show "Update template" option if session came from a modified template */}
        {sourceTemplate && wasModified && (
          <button
            type="button"
            onClick={() => handleSetSaveMode('update')}
            className="group flex items-center gap-2 cursor-pointer select-none text-sm transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${saveMode === 'update' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}
            />
            <span className={saveMode === 'update' ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}>
              Update "{sourceTemplate.name}"
            </span>
          </button>
        )}

        {/* Show "Save as new" if session is fresh OR if it was modified from a template */}
        {(!sourceTemplate || wasModified) && (
          <button
            type="button"
            onClick={() => handleSetSaveMode('new')}
            className="group flex items-center gap-2 cursor-pointer select-none text-sm transition-colors"
          >
            <Star
              className={`w-4 h-4 ${saveMode === 'new' ? 'fill-star text-star' : 'text-muted-foreground group-hover:text-star'}`}
            />
            <span className={saveMode === 'new' ? 'text-star' : 'text-muted-foreground group-hover:text-star'}>
              Save as new favorite
            </span>
          </button>
        )}

        {/* Name input for new template */}
        {saveMode === 'new' && (
          <input
            type="text"
            value={template.templateName}
            onChange={(e) => template.setTemplateName(e.target.value)}
            placeholder="Favorite name..."
            className="w-full bg-secondary border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- conditionally rendered after user action
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-6">
        <Button
          size="lg"
          className="w-full"
          onClick={handleComplete}
          disabled={saveMode === 'new' && !template.templateName.trim()}
        >
          {saveMode === 'update'
            ? `Complete & Update "${sourceTemplate?.name}"`
            : saveMode === 'new'
              ? 'Complete & Save New Favorite'
              : 'Complete Session'}
        </Button>
      </div>
    </div>
  );
}

export default NotesPage;
