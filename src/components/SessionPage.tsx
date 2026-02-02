/**
 * SessionPage Component — Run through exercises with a timer
 *
 * LEARNING NOTES - useEffect for timers:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you'd use RxJS interval() or setInterval in ngOnInit,
 *    clean up in ngOnDestroy
 *    React: setInterval in useEffect, return a cleanup function.
 *    The cleanup runs when the component unmounts or deps change.
 *
 * 2. useEffect CLEANUP:
 *    The function returned from useEffect is called:
 *    - When the component unmounts (like ngOnDestroy)
 *    - Before the effect re-runs (if deps changed)
 *    This prevents memory leaks from orphaned intervals.
 *
 * 3. WHY useRef FOR THE TIMER?
 *    We use useRef for the interval ID and cumulative time because
 *    changing a ref doesn't trigger a re-render. We only need re-renders
 *    when the elapsed seconds change, not when we store/clear the interval.
 *
 * 4. REDIRECT VIA <Navigate>:
 *    Instead of using useEffect + navigate() for redirects, we return a
 *    <Navigate> component during render. This avoids race conditions where
 *    a useEffect redirect fires after a programmatic navigate() call.
 */

import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getExerciseById, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

function SessionPage() {
  const { state, dispatch } = useSession();

  // Timer state: counts up in seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track cumulative time across exercises (doesn't need re-renders)
  const cumulativeSecondsRef = useRef(0);

  const session = state.currentSession;
  const exerciseIndex = state.currentExerciseIndex;

  // Timer effect — ticks every second when not paused
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      cumulativeSecondsRef.current += 1;
    }, 1000);

    // Cleanup: clear the interval when pausing, unmounting, or re-running
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  // Redirect guards via render — avoids useEffect race conditions
  if (!session) {
    return <Navigate to="/prep" replace />;
  }
  if (exerciseIndex === null) {
    return <Navigate to={`/notes/${session.id}`} replace />;
  }

  // Re-bind after null guard so TypeScript narrows the type to `number`
  const idx = exerciseIndex;
  const currentSessionExercise = session.exercises[idx];
  const currentExercise = getExerciseById(currentSessionExercise.exerciseId);

  const totalExercises = session.exercises.length;
  const targetSeconds = currentSessionExercise.duration * 60;
  const isOverTime = elapsedSeconds >= targetSeconds;

  // Total session time
  const totalSessionMinutes = session.exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const totalSessionSeconds = totalSessionMinutes * 60;
  const totalElapsed = cumulativeSecondsRef.current;

  function handleNextExercise() {
    // Save actual time spent on this exercise before moving on
    dispatch({ type: 'SET_ACTUAL_DURATION', index: idx, actualSeconds: elapsedSeconds });

    // Reset timer for next exercise
    setElapsedSeconds(0);
    setIsPaused(false);

    // Dispatch advances the index (or sets it to null on the last exercise)
    // The render-time <Navigate> guard handles routing to /notes
    dispatch({ type: 'NEXT_EXERCISE' });
  }

  function handleTogglePause() {
    setIsPaused((prev) => !prev);
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Progress indicator */}
      <p className="text-gray-400 mb-2">
        Exercise {idx + 1} of {totalExercises}
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((idx + 1) / totalExercises) * 100}%` }}
        />
      </div>

      {/* Current exercise */}
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardContent className="py-8 text-left">
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentExercise?.name ?? currentSessionExercise.exerciseId}
          </h1>
          {currentExercise?.summary && (
            <p className="text-gray-400 text-base mb-4 italic">{currentExercise.summary}</p>
          )}
          {currentExercise?.description ? (
            <div
              className="text-gray-300 text-lg leading-relaxed prose-exercise"
              dangerouslySetInnerHTML={{ __html: currentExercise.description }}
            />
          ) : (
            <p className="text-gray-500 italic">No description available.</p>
          )}
          {/* Quick notes for this exercise */}
          <textarea
            value={currentSessionExercise.notes ?? ''}
            onChange={(e) =>
              dispatch({ type: 'SET_EXERCISE_NOTES', index: idx, notes: e.target.value })
            }
            placeholder="Quick notes..."
            rows={2}
            className="w-full mt-4 bg-gray-700 border border-gray-600 rounded-lg p-3 text-gray-300 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y"
          />
        </CardContent>
      </Card>

      {/* Timer */}
      <div className="mb-8">
        <p
          className={`text-6xl font-mono font-bold mb-2 ${
            isOverTime ? 'text-red-400' : 'text-white'
          }`}
        >
          {formatDuration(elapsedSeconds)}
        </p>
        <p className="text-gray-400">
          Target: {currentSessionExercise.duration} min ({formatDuration(targetSeconds)})
        </p>
        <p className="text-gray-500 text-sm mt-1">
          Session: {formatDuration(totalElapsed)} / {formatDuration(totalSessionSeconds)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="secondary" size="lg" onClick={handleTogglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button size="lg" onClick={handleNextExercise}>
          {idx + 1 >= totalExercises ? 'Finish Session' : 'Next Exercise'}
        </Button>
      </div>
    </div>
  );
}

export default SessionPage;
