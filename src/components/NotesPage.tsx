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
import { useSession } from '../context/SessionContext';
import { useTemplateSaver } from '../hooks/useTemplateSaver';
import { getExerciseById, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';

function NotesPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const template = useTemplateSaver();

  const session = state.currentSession;

  // If there's no session to take notes on, redirect to home
  if (!session) {
    return <Navigate to="/" replace />;
  }

  function handleSave() {
    dispatch({ type: 'COMPLETE_SESSION', notes });
    navigate('/');
  }

  function handleSkip() {
    dispatch({ type: 'COMPLETE_SESSION', notes: '' });
    navigate('/');
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Session Complete</h1>
      <p className="text-gray-400 mb-8">
        How did it go? Jot down what worked, what didn't, and anything to remember.
      </p>

      {/* Exercises that were run */}
      <h2 className="text-lg font-semibold text-white mb-3">Exercises</h2>
      <div className="space-y-2 mb-4">
        {session.exercises.map((se, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-white">
                  <span className="text-gray-500 mr-2">{i + 1}.</span>
                  {getExerciseById(se.exerciseId)?.name ?? se.exerciseId}
                </span>
                <span className="text-gray-400 text-sm">
                  {se.actualSeconds != null
                    ? <>{formatDuration(se.actualSeconds)} <span className="text-gray-500">/ {se.duration} min</span></>
                    : <>{se.duration} min</>
                  }
                </span>
              </div>
              {se.notes && (
                <p className="text-gray-400 text-sm mt-1 ml-5">{se.notes}</p>
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
          <p className="text-gray-400 text-sm mb-8">
            Total: {hasActualTime
              ? <>{formatDuration(actualTotalSeconds)} <span className="text-gray-500">/ {plannedMinutes} min planned</span></>
              : <>{plannedMinutes} min</>
            }
          </p>
        );
      })()}

      {/* Notes textarea — controlled component */}
      <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What worked well? What needs work? Any exercises to try next time?"
        rows={6}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
      />

      {/* Save as favorite template */}
      <div className="mt-6 mb-2">
        {template.isSaving ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={template.templateName}
              onChange={(e) => template.setTemplateName(e.target.value)}
              placeholder="Template name..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') template.save();
                if (e.key === 'Escape') template.cancel();
              }}
            />
            <button
              onClick={template.save}
              disabled={!template.templateName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded transition-colors"
            >
              Save
            </button>
            <button
              onClick={template.cancel}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => template.start()}
            className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
          >
            &#9733; Save session as favorite
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Save Notes
        </button>
        <button
          onClick={handleSkip}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

export default NotesPage;
