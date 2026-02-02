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
import { ArrowLeft, ArrowRight, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById, filterBySource, getTagsForExercises, filterExercises, sortByFavorites, sourceCounts } from '../data/exercises';
import type { SourceFilter } from '../data/exercises';
import type { Exercise } from '../types';
import { useTemplateSaver } from '../hooks/useTemplateSaver';
import TagFilter from './TagFilter';
import ExerciseDetailModal from './ExerciseDetailModal';
import ConfirmModal from './ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

function PrepPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [defaultDuration, setDefaultDuration] = useState(5);
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const template = useTemplateSaver();

  // If there's no current session, create one on first visit
  if (!state.currentSession) {
    dispatch({ type: 'CREATE_SESSION' });
    return null; // Re-render will happen with the new session
  }

  const sessionExercises = state.currentSession.exercises;

  // Total time for the session
  const totalMinutes = sessionExercises.reduce((sum, ex) => sum + ex.duration, 0);

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

  // COMPUTED VALUES: source filtering → tag computation → text/tag filtering → sort
  const sourceFilteredExercises = filterBySource(selectedSource);
  const { featuredTags, allTags } = getTagsForExercises(sourceFilteredExercises);
  const filteredExercises = filterExercises(sourceFilteredExercises, selectedTags, searchText);
  const favoriteIds = state.favoriteExerciseIds;
  const sortedExercises = sortByFavorites(filteredExercises, favoriteIds);

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSourceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedSource(event.target.value as SourceFilter);
    setSelectedTags([]);
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 inline" /> Back to exercises
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Build Your Session</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: exercise library with filtering */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Exercises ({filteredExercises.length})
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-sm">Source:</label>
              <select
                value={selectedSource}
                onChange={handleSourceChange}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All ({sourceCounts.all})</option>
                <option value="learnimprov">learnimprov.com ({sourceCounts.learnimprov})</option>
                <option value="improwiki">improwiki.com ({sourceCounts.improwiki})</option>
              </select>
            </div>
          </div>

          <TagFilter
            featuredTags={featuredTags}
            allTags={allTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />

          <div className="relative mt-4 mb-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search exercises..."
              className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 text-sm"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white px-2"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

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

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-dark">
            {sortedExercises.map((exercise) => (
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
                  {exercise.summary && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {exercise.summary}
                    </p>
                  )}
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-wrap gap-1">
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
                    <button
                      onClick={() => setDetailExercise(exercise)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs shrink-0 ml-2 transition-colors"
                    >
                      Details <ArrowRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column: session queue */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Session Queue
              {sessionExercises.length > 0 && (
                <span className="text-gray-400 text-base font-normal ml-2">
                  {sessionExercises.length} exercise{sessionExercises.length !== 1 && 's'}
                  {' · '}{totalMinutes} min
                </span>
              )}
            </h2>
            {sessionExercises.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => template.start(state.currentSession?.name ?? '')}
                  className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors"
                  title="Save as favorite template"
                >
                  <Star className="w-4 h-4 inline fill-current" /> Save
                </button>
                <button
                  onClick={() => setConfirm({
                    title: 'Clear queue?',
                    message: `Remove all ${sessionExercises.length} exercise${sessionExercises.length !== 1 ? 's' : ''} from the queue?`,
                    confirmLabel: 'Clear',
                    onConfirm: () => {
                      dispatch({ type: 'CLEAR_SESSION' });
                      setConfirm(null);
                      toast('Queue cleared');
                    },
                  })}
                  className="text-gray-400 hover:text-red-400 text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Inline form for naming the template */}
          {template.isSaving && (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={template.templateName}
                onChange={(e) => template.setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') template.save();
                  if (e.key === 'Escape') template.cancel();
                }}
              />
              <button
                onClick={template.save}
                disabled={!template.templateName.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm px-3 py-1 rounded transition-colors"
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
          )}

          {sessionExercises.length === 0 ? (
            <p className="text-gray-500 italic">
              No exercises yet. Add some from the library.
            </p>
          ) : (
            <div className="space-y-3">
              {sessionExercises.map((se, index) => {
                const exercise = getExerciseById(se.exerciseId);
                return (
                  <Card key={index} className="bg-gray-800 border-gray-700">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3">
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
                            onClick={() => setConfirm({
                              title: 'Remove exercise?',
                              message: `Remove "${exercise?.name ?? 'exercise'}" from the queue?`,
                              confirmLabel: 'Remove',
                              onConfirm: () => {
                                handleRemoveExercise(index);
                                setConfirm(null);
                              },
                            })}
                            className="text-red-400 hover:text-red-300 text-sm ml-2"
                            aria-label={`Remove ${exercise?.name ?? 'exercise'}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {exercise?.summary && (
                        <p className="text-gray-400 text-sm mt-1 ml-5 line-clamp-1">
                          {exercise.summary}
                        </p>
                      )}
                      <div className="flex items-end justify-between mt-1 ml-5">
                        <div className="flex flex-wrap gap-1">
                          {exercise?.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-gray-700 text-indigo-400 border-gray-600 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {exercise && (
                          <button
                            onClick={() => setDetailExercise(exercise)}
                            className="text-indigo-400 hover:text-indigo-300 text-xs shrink-0 ml-2 transition-colors"
                          >
                            Details <ArrowRight className="w-3 h-3 inline" />
                          </button>
                        )}
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
      </div>
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          variant="danger"
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

export default PrepPage;
