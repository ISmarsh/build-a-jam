/**
 * PrepPage Component — Build a session by adding exercises
 *
 * LEARNING NOTES - useReducer via Context:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: inject a service, call methods (service.addExercise(...))
 *    React: call dispatch({ type: 'ADD_EXERCISE', ... }) — pure data in,
 *    the reducer figures out the new state. No mutation.
 *
 * 2. WHY DISPATCH + ACTIONS?
 *    - Clear audit trail of what happened
 *    - Reducer is a pure function — easy to test
 *    - Multiple components can dispatch without prop drilling callbacks
 *    - Similar to NgRx if you've used that in Angular
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { exercises } from '../data/exercises';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

function PrepPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [defaultDuration, setDefaultDuration] = useState(5);

  // If there's no current session, create one on first visit
  if (!state.currentSession) {
    dispatch({ type: 'CREATE_SESSION' });
    return null; // Re-render will happen with the new session
  }

  const sessionExercises = state.currentSession.exercises;

  // Total time for the session
  const totalMinutes = sessionExercises.reduce((sum, ex) => sum + ex.duration, 0);

  // Look up exercise details by ID
  function getExercise(exerciseId: string) {
    return exercises.find((e) => e.id === exerciseId);
  }

  function handleAddExercise(exerciseId: string) {
    dispatch({ type: 'ADD_EXERCISE', exerciseId, duration: defaultDuration });
  }

  function handleRemoveExercise(index: number) {
    dispatch({ type: 'REMOVE_EXERCISE', index });
  }

  function handleDurationChange(index: number, duration: number) {
    dispatch({ type: 'SET_DURATION', index, duration });
  }

  function handleStartSession() {
    dispatch({ type: 'START_SESSION' });
    navigate(`/session/${state.currentSession!.id}`);
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        &larr; Back to exercises
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Build Your Session</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: exercise queue */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Session Queue
            {sessionExercises.length > 0 && (
              <span className="text-gray-400 text-base font-normal ml-2">
                {sessionExercises.length} exercise{sessionExercises.length !== 1 && 's'}
                {' · '}{totalMinutes} min
              </span>
            )}
          </h2>

          {sessionExercises.length === 0 ? (
            <p className="text-gray-500 italic">
              No exercises yet. Add some from the list on the right.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionExercises.map((se, index) => {
                const exercise = getExercise(se.exerciseId);
                return (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-500 text-sm mr-2">{index + 1}.</span>
                        <span className="text-white">
                          {exercise?.name ?? se.exerciseId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={se.duration}
                          onChange={(e) =>
                            handleDurationChange(index, Math.max(1, Number(e.target.value)))
                          }
                          className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
                        />
                        <span className="text-gray-400 text-sm">min</span>
                        <button
                          onClick={() => handleRemoveExercise(index)}
                          className="text-red-400 hover:text-red-300 text-sm ml-2"
                          aria-label={`Remove ${exercise?.name ?? 'exercise'}`}
                        >
                          Remove
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {sessionExercises.length > 0 && (
            <button
              onClick={handleStartSession}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Session ({totalMinutes} min)
            </button>
          )}
        </div>

        {/* Right column: exercise library */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Exercises</h2>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-gray-400 text-sm">Default duration:</label>
            <input
              type="number"
              min={1}
              max={60}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(Math.max(1, Number(e.target.value)))}
              className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-center text-sm"
            />
            <span className="text-gray-400 text-sm">min</span>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="bg-gray-800 border-gray-700">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-indigo-500 text-base">
                      {exercise.name}
                    </CardTitle>
                    <button
                      onClick={() => handleAddExercise(exercise.id)}
                      className="text-indigo-400 hover:text-indigo-300 text-sm shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <p className="text-gray-400 text-sm line-clamp-2">
                    {exercise.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exercise.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-gray-700 text-indigo-400 border-gray-600 text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrepPage;
