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
 * 3. WHY useRef FOR THE INTERVAL ID?
 *    We use useRef for the interval ID because changing a ref doesn't
 *    trigger a re-render. We only need re-renders when the elapsed seconds
 *    change, not when we store/clear the interval.
 *
 * 4. REDIRECT VIA <Navigate>:
 *    Instead of using useEffect + navigate() for redirects, we return a
 *    <Navigate> component during render. This avoids race conditions where
 *    a useEffect redirect fires after a programmatic navigate() call.
 *
 * 5. TIMER STATE IN CONTEXT:
 *    Timer values (elapsed, cumulative, paused) live in SessionContext
 *    instead of local useState. This is because navigating away from
 *    SessionPage unmounts the component and loses local state. Context
 *    persists across route changes since SessionProvider wraps the router.
 *    Angular services are singletons that persist similarly — Context
 *    gives us the same guarantee in React.
 *
 * 6. LIVE QUEUE EDITING:
 *    The SessionQueuePanel and ExercisePickerDialog enable mid-session
 *    queue modifications. The key pattern: the reducer handles all index
 *    bookkeeping (INSERT_EXERCISE adjusts currentExerciseIndex, etc.)
 *    so this component just dispatches actions and lets the reducer
 *    figure out the new state. This is the same single-source-of-truth
 *    pattern as Angular's NgRx selectors + effects.
 */

import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById, formatDuration, BREAK_EXERCISE_ID } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import SessionQueuePanel from './SessionQueuePanel';
import ExercisePickerDialog from './ExercisePickerDialog';

/** Default duration for breaks in minutes */
const DEFAULT_BREAK_DURATION = 5;

/** Default duration for exercises added mid-session in minutes */
const DEFAULT_ADD_DURATION = 10;

function SessionPage() {
  const { state, dispatch } = useSession();

  // UI-only state (OK to lose on unmount — these reset naturally)
  const [showDescription, setShowDescription] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  // Current timestamp, updated by the timer effect. Used to estimate
  // exercise/session end times. Stored in state (not computed via
  // Date.now() in render) because the React compiler requires render
  // to be pure — Date.now() is an impure function.
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer state lives in context so it survives navigation
  const elapsedSeconds = state.timerElapsed;
  const cumulativeSeconds = state.timerCumulative;
  const isPaused = state.timerPaused;

  const session = state.currentSession;
  const exerciseIndex = state.currentExerciseIndex;

  // Compute isOverTime early so we can use it in a hook (hooks must be
  // called unconditionally, before any early returns).
  const currentExerciseDuration = session?.exercises[exerciseIndex ?? 0]?.duration ?? 0;
  const targetSecondsEarly = currentExerciseDuration * 60;
  const isOverTimeEarly = exerciseIndex !== null && elapsedSeconds >= targetSecondsEarly;

  // Timer effect — dispatches TIMER_TICK every second when not paused.
  // The interval runs as long as this component is mounted and unpaused.
  // If the user navigates away, the interval stops (cleanup runs), but
  // the accumulated time is preserved in context state.
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      dispatch({ type: 'TIMER_TICK' });
      setNow(Date.now()); // update timestamp for end time estimates
    }, 1000);

    // Cleanup: clear the interval when pausing, unmounting, or re-running
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, dispatch]);

  // Vibrate when hitting target duration — gives tactile feedback so you
  // don't have to watch the screen. Uses the Vibration API, which is
  // supported on Android browsers but not iOS Safari. Falls back gracefully.
  //
  // REACT LEARNING NOTE — RULES OF HOOKS:
  // Hooks must be called unconditionally (before any early returns). That's
  // why we compute isOverTimeEarly above the guards. The prevIsOverTimeRef
  // pattern tracks the previous value so we only vibrate on the false→true
  // transition, not on every render where isOverTime is true.
  const prevIsOverTimeRef = useRef(false);
  useEffect(() => {
    if (isOverTimeEarly && !prevIsOverTimeRef.current) {
      // Just crossed the threshold — vibrate for 200ms
      navigator.vibrate?.(200);
    }
    prevIsOverTimeRef.current = isOverTimeEarly;
  }, [isOverTimeEarly]);

  // Wait for hydration before applying redirect guards.
  // On HMR or page refresh, useReducer reinitializes with default state
  // (currentExerciseIndex: null) before the HYDRATE action restores values
  // from storage. Without this guard, the null index would trigger the
  // "session complete" redirect below, bouncing the user to /notes mid-session.
  if (!state.loaded) {
    return null;
  }

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
  const isBreak = currentSessionExercise.exerciseId === BREAK_EXERCISE_ID;
  const currentExercise = isBreak ? undefined : getExerciseById(currentSessionExercise.exerciseId);

  const totalExercises = session.exercises.length;
  // For the progress label, count only exercises (not breaks)
  const totalNonBreaks = session.exercises.filter((e) => e.exerciseId !== BREAK_EXERCISE_ID).length;
  const currentExerciseNumber = session.exercises
    .slice(0, idx + 1)
    .filter((e) => e.exerciseId !== BREAK_EXERCISE_ID).length;
  const targetSeconds = currentSessionExercise.duration * 60;
  const isOverTime = elapsedSeconds >= targetSeconds;

  // Total session time
  const totalSessionMinutes = session.exercises.reduce((sum, ex) => sum + ex.duration, 0);
  const totalSessionSeconds = totalSessionMinutes * 60;

  function handleNextExercise() {
    // Save actual time spent on this exercise before moving on
    dispatch({ type: 'SET_ACTUAL_DURATION', index: idx, actualSeconds: elapsedSeconds });

    // Collapse description for next exercise
    setShowDescription(false);

    // Scroll to top so the new exercise is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Dispatch advances the index (or sets it to null on the last exercise).
    // NEXT_EXERCISE also resets timerElapsed and unpauses in the reducer.
    // The render-time <Navigate> guard handles routing to /notes.
    dispatch({ type: 'NEXT_EXERCISE' });
  }

  function handleTogglePause() {
    dispatch({ type: isPaused ? 'TIMER_RESUME' : 'TIMER_PAUSE' });
  }

  // --- Live queue editing handlers ---

  function handleRemoveUpcoming(index: number) {
    dispatch({ type: 'REMOVE_EXERCISE', index });
    toast('Removed from queue');
  }

  function handleDurationChange(index: number, duration: number) {
    dispatch({ type: 'SET_DURATION', index, duration });
  }

  function handleAddExercise(exerciseId: string) {
    // Insert right after the current exercise
    const insertAt = idx + 1;
    dispatch({
      type: 'INSERT_EXERCISE',
      exerciseId,
      duration: DEFAULT_ADD_DURATION,
      atIndex: insertAt,
    });
    const exercise = getExerciseById(exerciseId);
    toast(`Added "${exercise?.name ?? exerciseId}" to queue`);
  }

  function handleAddBreak() {
    const insertAt = idx + 1;
    dispatch({
      type: 'INSERT_EXERCISE',
      exerciseId: BREAK_EXERCISE_ID,
      duration: DEFAULT_BREAK_DURATION,
      atIndex: insertAt,
    });
    toast('Break added to queue');
  }

  function handleReorder(from: number, to: number) {
    dispatch({ type: 'REORDER_EXERCISES', from, to });
  }

  function handleEditNotes(index: number, notes: string) {
    dispatch({ type: 'SET_EXERCISE_NOTES', index, notes });
  }

  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Progress indicator — breaks don't count in exercise numbering */}
      <p className="mb-2 text-muted-foreground">
        {isBreak
          ? `Break · ${totalNonBreaks} exercise${totalNonBreaks !== 1 ? 's' : ''} total`
          : `Exercise ${currentExerciseNumber} of ${totalNonBreaks}`}
      </p>
      <div className="mb-8 h-2 w-full rounded-full bg-secondary">
        <div
          className="h-2 rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((idx + 1) / totalExercises) * 100}%` }}
        />
      </div>

      {/* Current exercise (or break) */}
      <Card className="mb-8">
        <CardContent className="py-8 text-left">
          {isBreak ? (
            /* Break card — simpler layout, no description */
            <>
              <div className="mb-2 flex items-center gap-3">
                <Coffee className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-primary">Break</h1>
              </div>
              <p className="text-base italic text-muted-foreground">
                Take a breather. Stretch, hydrate, reset.
              </p>
            </>
          ) : (
            /* Regular exercise card */
            <>
              <h1 className="mb-2 text-3xl font-bold text-primary">
                {currentExercise?.name ?? currentSessionExercise.exerciseId}
              </h1>
              {currentExercise?.summary && (
                <p className="mb-4 text-base italic text-muted-foreground">
                  {currentExercise.summary}
                </p>
              )}
              {currentExercise?.description && (
                <>
                  <button
                    onClick={() => setShowDescription((prev) => !prev)}
                    aria-expanded={showDescription}
                    className="mb-2 inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary-hover"
                  >
                    {showDescription ? (
                      <>
                        Hide details <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show details <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  {showDescription && (
                    <div
                      className="prose-exercise text-lg leading-relaxed text-secondary-foreground"
                      dangerouslySetInnerHTML={{ __html: currentExercise.description }}
                    />
                  )}
                </>
              )}
            </>
          )}
          {/* Quick notes for this exercise */}
          <textarea
            value={currentSessionExercise.notes ?? ''}
            onChange={(e) =>
              dispatch({ type: 'SET_EXERCISE_NOTES', index: idx, notes: e.target.value })
            }
            placeholder="Quick notes..."
            rows={2}
            className="mt-4 w-full resize-y rounded-lg border border-input bg-secondary p-3 text-sm text-secondary-foreground placeholder-muted-foreground transition-colors focus:border-primary focus:outline-none"
          />
        </CardContent>
      </Card>

      {/* Timer — countdown from target, goes negative when over */}
      <div className="mb-8">
        <p
          className={`mb-2 font-mono text-6xl font-bold ${
            isOverTime ? 'text-destructive' : 'text-primary'
          }`}
        >
          {/* remainingOrOverSeconds: positive when under target, represents time left;
              when over target, represents how much we've exceeded by */}
          {isOverTime ? '-' : ''}
          {formatDuration(Math.abs(targetSeconds - elapsedSeconds))}
        </p>
        <p className="text-muted-foreground">
          {currentSessionExercise.duration}{' '}
          {currentSessionExercise.duration === 1 ? 'minute' : 'minutes'} target
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Session: {formatDuration(cumulativeSeconds)} / {formatDuration(totalSessionSeconds)}
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="secondary" size="lg" onClick={handleTogglePause}>
          {isPaused ? 'Resume' : 'Pause'}
        </Button>
        <Button size="lg" onClick={handleNextExercise}>
          {idx + 1 >= totalExercises ? 'Wrap Up' : 'Next Exercise'}
        </Button>
      </div>

      {/* Live queue editing panel */}
      <SessionQueuePanel
        exercises={session.exercises}
        currentIndex={idx}
        timerElapsed={elapsedSeconds}
        now={now}
        onRemove={handleRemoveUpcoming}
        onDurationChange={handleDurationChange}
        onReorder={handleReorder}
        onAddExercise={() => setShowExercisePicker(true)}
        onAddBreak={handleAddBreak}
        onEditNotes={handleEditNotes}
      />

      {/* Exercise picker dialog */}
      <ExercisePickerDialog
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onAdd={handleAddExercise}
        existingExerciseIds={session.exercises.map((e) => e.exerciseId)}
      />
    </div>
  );
}

export default SessionPage;
