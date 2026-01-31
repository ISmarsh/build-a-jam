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
 * 3. WHY NOT useState FOR THE TIMER?
 *    We use useRef for the interval ID because changing a ref doesn't
 *    trigger a re-render. We only need re-renders when the elapsed
 *    seconds change, not when we store/clear the interval.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { exercises as exerciseLibrary } from '../data/exercises';
import { Card, CardContent } from './ui/card';

function SessionPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();

  // Timer state: counts up in seconds
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const session = state.currentSession;
  const exerciseIndex = state.currentExerciseIndex;

  // Redirect if there's no active session
  useEffect(() => {
    if (!session || exerciseIndex === null) {
      navigate('/prep');
    }
  }, [session, exerciseIndex, navigate]);

  // Timer effect — ticks every second when not paused
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Cleanup: clear the interval when pausing, unmounting, or re-running
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused]);

  if (!session || exerciseIndex === null) {
    return null; // Redirect effect will fire
  }

  const currentSessionExercise = session.exercises[exerciseIndex];
  const currentExercise = exerciseLibrary.find(
    (e) => e.id === currentSessionExercise.exerciseId,
  );

  const totalExercises = session.exercises.length;
  const targetSeconds = currentSessionExercise.duration * 60;
  const isOverTime = elapsedSeconds >= targetSeconds;

  // Format seconds as MM:SS
  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function handleNextExercise() {
    setElapsedSeconds(0);
    setIsPaused(false);

    // TypeScript doesn't realize session/exerciseIndex are non-null here
    // due to the early return guard above, so we use non-null assertions
    if (exerciseIndex! + 1 >= totalExercises) {
      // Last exercise — go to notes
      dispatch({ type: 'NEXT_EXERCISE' });
      navigate(`/notes/${session!.id}`);
    } else {
      dispatch({ type: 'NEXT_EXERCISE' });
    }
  }

  function handleTogglePause() {
    setIsPaused((prev) => !prev);
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Progress indicator */}
      <p className="text-gray-400 mb-2">
        Exercise {exerciseIndex + 1} of {totalExercises}
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-8">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((exerciseIndex + 1) / totalExercises) * 100}%` }}
        />
      </div>

      {/* Current exercise */}
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardContent className="py-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            {currentExercise?.name ?? currentSessionExercise.exerciseId}
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed max-w-xl mx-auto">
            {currentExercise?.description ?? 'No description available.'}
          </p>
        </CardContent>
      </Card>

      {/* Timer */}
      <div className="mb-8">
        <p
          className={`text-6xl font-mono font-bold mb-2 ${
            isOverTime ? 'text-red-400' : 'text-white'
          }`}
        >
          {formatTime(elapsedSeconds)}
        </p>
        <p className="text-gray-400">
          Target: {currentSessionExercise.duration} min ({formatTime(targetSeconds)})
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleTogglePause}
          className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={handleNextExercise}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {exerciseIndex + 1 >= totalExercises ? 'Finish Session' : 'Next Exercise'}
        </button>
      </div>
    </div>
  );
}

export default SessionPage;
