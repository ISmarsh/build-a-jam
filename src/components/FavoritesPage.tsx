/**
 * FavoritesPage Component — Browse saved templates and starred exercises
 *
 * LEARNING NOTES - COMBINING CONTEXT DATA:
 *
 * 1. This page reads two different pieces of state from SessionContext:
 *    - sessions[] (filtered to isTemplate) = saved session templates
 *    - favoriteExerciseIds[] = individually starred exercises
 *    Both live in the same context but serve different purposes.
 *
 * 2. ANGULAR vs REACT:
 *    Angular: you'd inject the service and combine observables with combineLatest
 *    React: just destructure both from the same context — simpler!
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById } from '../data/exercises';
import type { Exercise, Session } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import ConfirmModal from './ConfirmModal';
import ExerciseDetailModal from './ExerciseDetailModal';

function FavoritesPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Session templates (saved from prep or history)
  const templates = state.sessions.filter((s) => s.isTemplate);

  // Favorite exercises (starred individually)
  const favoriteExercises = state.favoriteExerciseIds
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex != null);

  function handleStartTemplate(template: Session) {
    dispatch({ type: 'LOAD_SESSION', session: template });
    navigate('/prep');
  }

  function handleDeleteTemplate(sessionId: string) {
    setConfirm({
      title: 'Delete template?',
      message: 'This will permanently remove this saved template.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        dispatch({ type: 'DELETE_SESSION_TEMPLATE', sessionId });
        setConfirm(null);
        toast('Template deleted');
        if (expandedTemplateId === sessionId) setExpandedTemplateId(null);
      },
    });
  }

  const isEmpty = templates.length === 0 && favoriteExercises.length === 0;

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 inline" /> Back to exercises
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Favorites</h1>

      {isEmpty ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-2">No favorites yet.</p>
          <p className="text-gray-500 mb-4">
            Star exercises from the home page, or save session templates from the prep or history pages.
          </p>
          <Link
            to="/"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Browse exercises <ArrowRight className="w-4 h-4 inline" />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Session Templates */}
          {templates.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Saved Sessions ({templates.length})
              </h2>
              <div className="space-y-4">
                {templates.map((template) => {
                  const totalMinutes = template.exercises.reduce(
                    (sum, ex) => sum + ex.duration,
                    0,
                  );
                  const isExpanded = expandedTemplateId === template.id;

                  return (
                    <Card key={template.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="py-4">
                        {/* Header — clickable to expand/collapse */}
                        <button
                          onClick={() =>
                            setExpandedTemplateId(isExpanded ? null : template.id)
                          }
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ChevronRight
                                className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-white font-semibold">
                                {template.name ?? 'Untitled'}
                              </span>
                            </div>
                            <span className="text-gray-400 text-sm">
                              {template.exercises.length} exercise
                              {template.exercises.length !== 1 && 's'}
                              {' · '}
                              {totalMinutes} min
                            </span>
                          </div>

                          {/* Collapsed: exercise names as badges */}
                          {!isExpanded && (
                            <div className="flex flex-wrap gap-1 mt-2 ml-5">
                              {template.exercises.map((se, j) => {
                                const ex = getExerciseById(se.exerciseId);
                                return (
                                  <Badge
                                    key={j}
                                    variant="outline"
                                    className={`bg-gray-700 border-gray-600 text-xs ${
                                      ex
                                        ? 'text-indigo-400 cursor-pointer hover:bg-gray-600'
                                        : 'text-gray-300'
                                    }`}
                                    onClick={
                                      ex
                                        ? (e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            setDetailExercise(ex);
                                          }
                                        : undefined
                                    }
                                  >
                                    {ex?.name ?? se.exerciseId}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </button>

                        {/* Expanded: full exercise list + actions */}
                        {isExpanded && (
                          <div className="mt-4 ml-5 space-y-3">
                            {template.exercises.map((se, j) => {
                              const ex = getExerciseById(se.exerciseId);
                              return (
                                <div
                                  key={j}
                                  className="border-l-2 border-gray-700 pl-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-white text-sm">
                                      <span className="text-gray-500 mr-2">
                                        {j + 1}.
                                      </span>
                                      {ex ? (
                                        <button
                                          onClick={() => setDetailExercise(ex)}
                                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                        >
                                          {ex.name}
                                        </button>
                                      ) : (
                                        se.exerciseId
                                      )}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      {se.duration} min
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Actions */}
                            <div className="border-t border-gray-700 pt-3 mt-3 flex items-center gap-4">
                              <button
                                onClick={() => handleStartTemplate(template)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                              >
                                Start Session
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 2: Favorite Exercises */}
          {favoriteExercises.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">
                Starred Exercises ({favoriteExercises.length})
              </h2>
              <div className="space-y-3">
                {favoriteExercises.map((exercise) => (
                  <Card key={exercise.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => {
                              dispatch({
                                type: 'TOGGLE_FAVORITE_EXERCISE',
                                exerciseId: exercise.id,
                              });
                              toast('Removed from favorites');
                            }}
                            className="text-yellow-400 hover:text-gray-400 shrink-0 transition-colors"
                            title="Remove from favorites"
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                          <button
                            onClick={() => setDetailExercise(exercise)}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-left truncate"
                          >
                            {exercise.name}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-2 shrink-0">
                          {exercise.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="bg-gray-700 text-indigo-400 border-gray-600 text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {exercise.summary && (
                        <p className="text-gray-400 text-sm mt-1 ml-8 line-clamp-1">
                          {exercise.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

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

export default FavoritesPage;
