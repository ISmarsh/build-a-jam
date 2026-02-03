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
import { ArrowRight, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById, BREAK_EXERCISE_ID } from '../data/exercises';
import type { Exercise, Session } from '../types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import ConfirmModal from './ConfirmModal';
import ExerciseDetailModal from './ExerciseDetailModal';
import { Button } from './ui/button';

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
  // Renaming state — null when not renaming, otherwise the template ID being edited
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Session templates (saved from prep or history)
  const templates = state.sessions.filter((s) => s.isTemplate);

  // Favorite exercises (starred individually)
  const favoriteExercises = state.favoriteExerciseIds
    .map((id) => getExerciseById(id))
    .filter((ex): ex is Exercise => ex != null);

  function handleEditTemplate(template: Session) {
    dispatch({ type: 'LOAD_SESSION', session: template });
    void navigate('/prep');
  }

  function handleStartTemplate(template: Session) {
    // Load the template and immediately start the session, skipping prep.
    // LOAD_SESSION creates a new session (with a new ID) from the template,
    // then START_SESSION sets currentExerciseIndex to 0. Both dispatches
    // happen synchronously before navigate. SessionPage reads state from
    // context (not from the URL param), so the ID in the URL is cosmetic.
    dispatch({ type: 'LOAD_SESSION', session: template });
    dispatch({ type: 'START_SESSION' });
    // Use template.id in the URL as a readable reference — SessionPage
    // will pick up the actual session from context state
    void navigate(`/session/${template.id}`);
  }

  function handleDeleteTemplate(sessionId: string) {
    setConfirm({
      title: 'Delete favorite?',
      message: 'This will permanently remove this saved favorite.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        dispatch({ type: 'DELETE_SESSION_TEMPLATE', sessionId });
        setConfirm(null);
        toast('Favorite deleted');
        if (expandedTemplateId === sessionId) setExpandedTemplateId(null);
      },
    });
  }

  function handleStartRename(template: Session) {
    setRenamingId(template.id);
    setRenameValue(template.name ?? '');
  }

  function handleSaveRename() {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: 'RENAME_SESSION_TEMPLATE', sessionId: renamingId, name: renameValue.trim() });
      toast('Renamed');
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function handleCancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  const isEmpty = templates.length === 0 && favoriteExercises.length === 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Favorites</h1>

      {isEmpty ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">No favorites yet.</p>
          <p className="text-muted-foreground mb-4">
            Star exercises from the home page, or save sessions as favorites from the prep or history pages.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-primary hover:text-primary-hover transition-colors"
          >
            Browse exercises <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1: Session Templates */}
          {templates.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">
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
                    <Card key={template.id}>
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
                                className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                              <Star className="w-4 h-4 text-star fill-star" />
                              <span className="text-foreground font-semibold">
                                {template.name ?? 'Untitled'}
                              </span>
                            </div>
                            <span className="text-muted-foreground text-sm">
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
                                const isBreak = se.exerciseId === BREAK_EXERCISE_ID;
                                const ex = isBreak ? undefined : getExerciseById(se.exerciseId);
                                return (
                                  <Badge
                                    key={se.slotId ?? j}
                                    variant="outline"
                                    className={`border-input text-xs ${
                                      ex
                                        ? 'text-primary cursor-pointer hover:bg-secondary/80'
                                        : 'text-secondary-foreground'
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
                                    {isBreak ? 'Break' : (ex?.name ?? se.exerciseId)}
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
                              const isBreak = se.exerciseId === BREAK_EXERCISE_ID;
                              const ex = isBreak ? undefined : getExerciseById(se.exerciseId);
                              return (
                                <div
                                  key={se.slotId ?? j}
                                  className="border-l-2 border-border pl-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-foreground text-sm">
                                      <span className="text-muted-foreground mr-2">
                                        {j + 1}.
                                      </span>
                                      {isBreak ? (
                                        'Break'
                                      ) : ex ? (
                                        <button
                                          onClick={() => setDetailExercise(ex)}
                                          className="text-primary hover:text-primary-hover transition-colors"
                                        >
                                          {ex.name}
                                        </button>
                                      ) : (
                                        se.exerciseId
                                      )}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {se.duration} min
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Rename input — shown inline when renaming */}
                            {renamingId === template.id && (
                              <div className="flex items-center gap-2 mb-3">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename();
                                    if (e.key === 'Escape') handleCancelRename();
                                  }}
                                  autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- user just clicked rename
                                  className="flex-1 bg-secondary border border-input rounded px-2 py-1 text-foreground text-sm focus:outline-none focus:border-primary"
                                  placeholder="Favorite name..."
                                />
                                <Button size="sm" onClick={handleSaveRename}>Save</Button>
                                <button
                                  onClick={handleCancelRename}
                                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="border-t pt-3 mt-3 flex items-center gap-4">
                              <Button size="sm" onClick={() => handleStartTemplate(template)}>
                                Start Session
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)}>
                                Edit in Prep
                              </Button>
                              <button
                                onClick={() => handleStartRename(template)}
                                className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-muted-foreground hover:text-destructive text-xs transition-colors"
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
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Starred Exercises ({favoriteExercises.length})
              </h2>
              <div className="space-y-3">
                {favoriteExercises.map((exercise) => (
                  <Card key={exercise.id}>
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
                            className="text-star hover:text-muted-foreground shrink-0 transition-colors"
                            title="Remove from favorites"
                          >
                            <Star className="w-5 h-5 fill-current" />
                          </button>
                          <button
                            onClick={() => setDetailExercise(exercise)}
                            className="text-primary hover:text-primary-hover transition-colors text-left truncate"
                          >
                            {exercise.name}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-2 shrink-0">
                          {exercise.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-primary border-input text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {exercise.summary && (
                        <p className="text-muted-foreground text-sm mt-1 ml-8 line-clamp-1">
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
