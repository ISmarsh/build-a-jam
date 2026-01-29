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
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { exercises as exerciseLibrary } from '../data/exercises';
import { Card, CardContent } from './ui/card';

function NotesPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');

  const session = state.currentSession;

  // If there's no session to take notes on, redirect to home
  if (!session) {
    navigate('/');
    return null;
  }

  function getExerciseName(exerciseId: string): string {
    return exerciseLibrary.find((e) => e.id === exerciseId)?.name ?? exerciseId;
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
      <div className="space-y-2 mb-8">
        {session.exercises.map((se, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="py-3 flex items-center justify-between">
              <span className="text-white">
                <span className="text-gray-500 mr-2">{i + 1}.</span>
                {getExerciseName(se.exerciseId)}
              </span>
              <span className="text-gray-400 text-sm">{se.duration} min</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes textarea — controlled component */}
      <h2 className="text-lg font-semibold text-white mb-3">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="What worked well? What needs work? Any exercises to try next time?"
        rows={6}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors resize-y"
      />

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
