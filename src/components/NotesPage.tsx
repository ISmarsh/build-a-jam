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

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useTemplateSaver } from '../hooks/useTemplateSaver';
import { getExerciseName, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

function NotesPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [wantTemplate, setWantTemplate] = useState(false);
  const template = useTemplateSaver();

  const session = state.currentSession;

  // If there's no session to take notes on, redirect to home
  if (!session) {
    return <Navigate to="/" replace />;
  }

  function handleToggleTemplate() {
    if (wantTemplate) {
      setWantTemplate(false);
      template.cancel();
    } else {
      setWantTemplate(true);
      template.start(session!.name ?? '');
    }
  }

  function handleComplete() {
    // Save favorite first if requested
    if (wantTemplate && template.templateName.trim()) {
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
          <Card key={i}>
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

      {/* Save as favorite toggle */}
      <button
        type="button"
        onClick={handleToggleTemplate}
        className="group flex items-center gap-2 mt-4 cursor-pointer select-none text-sm transition-colors"
      >
        <Star
          className={`w-4 h-4 ${wantTemplate ? 'fill-star text-star' : 'text-muted-foreground group-hover:text-star'}`}
        />
        <span className={wantTemplate ? 'text-star' : 'text-muted-foreground group-hover:text-star'}>
          Save as favorite
        </span>
      </button>
      {wantTemplate && (
        <input
          type="text"
          value={template.templateName}
          onChange={(e) => template.setTemplateName(e.target.value)}
          placeholder="Favorite name..."
          className="mt-2 w-full bg-secondary border border-input rounded px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary"
          autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- conditionally rendered after user action
        />
      )}

      {/* Actions */}
      <div className="mt-6">
        <Button
          size="lg"
          className="w-full"
          onClick={handleComplete}
          disabled={wantTemplate && !template.templateName.trim()}
        >
          {wantTemplate ? 'Complete Session & Save Favorite' : 'Complete Session'}
        </Button>
      </div>
    </div>
  );
}

export default NotesPage;
