/**
 * HistoryPage Component — View completed session history
 *
 * LEARNING NOTES - READING FROM CONTEXT:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: inject a service, subscribe to an observable of past sessions
 *    React: useSession() hook gives us the full state including
 *    completedSessions — no subscription needed, React re-renders
 *    automatically when context changes.
 *
 * 2. DATE FORMATTING:
 *    We store dates as ISO strings for JSON serialisation. To display
 *    them, we create a Date object and use toLocaleDateString/
 *    toLocaleTimeString. The browser's Intl API handles locale-aware
 *    formatting without any library.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import ConfirmModal from './ConfirmModal';
import ExerciseDetailModal from './ExerciseDetailModal';
import type { Exercise } from '../types';

function HistoryPage() {
  const { state, dispatch } = useSession();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Confirmation modal state: stores a callback to run on confirm
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  // Inline save-as-template form (tracks which reversed index is being named)
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');

  // Show newest first
  const sessions = [...state.completedSessions].reverse();

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function handleDeleteSession(reversedIndex: number) {
    // Convert reversed index back to the original completedSessions index
    const originalIndex = state.completedSessions.length - 1 - reversedIndex;
    setConfirm({
      title: 'Delete session?',
      message: 'This will permanently remove this session from your history.',
      confirmLabel: 'Delete',
      onConfirm: () => {
        dispatch({ type: 'DELETE_COMPLETED_SESSION', index: originalIndex });
        setConfirm(null);
        toast('Session deleted');
        // If the deleted entry was expanded, collapse it
        if (expandedIndex === reversedIndex) setExpandedIndex(null);
      },
    });
  }

  function handleSaveAsTemplate(reversedIndex: number) {
    const name = templateName.trim();
    if (!name) return;
    const originalIndex = state.completedSessions.length - 1 - reversedIndex;
    dispatch({ type: 'SAVE_COMPLETED_AS_TEMPLATE', completedSessionIndex: originalIndex, name });
    toast.success(`Saved "${name}" to favorites`);
    setSavingIndex(null);
    setTemplateName('');
  }

  function handleClearAll() {
    setConfirm({
      title: 'Clear all history?',
      message: `This will permanently delete all ${sessions.length} session${sessions.length !== 1 ? 's' : ''} from your history.`,
      confirmLabel: 'Clear All',
      onConfirm: () => {
        dispatch({ type: 'CLEAR_COMPLETED_SESSIONS' });
        setConfirm(null);
        setExpandedIndex(null);
        toast('History cleared');
      },
    });
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-6 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        &larr; Back to exercises
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Session History</h1>
        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No sessions yet.</p>
          <Link
            to="/prep"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Build your first jam &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, i) => {
            const plannedMinutes = session.exercises.reduce(
              (sum, ex) => sum + ex.duration,
              0,
            );
            const actualTotalSeconds = session.exercises.reduce(
              (sum, ex) => sum + (ex.actualSeconds ?? 0),
              0,
            );
            const hasActualTime = session.exercises.some((ex) => ex.actualSeconds != null);

            const isExpanded = expandedIndex === i;

            return (
              <Card key={i} className="bg-gray-800 border-gray-700">
                <CardContent className="py-4">
                  {/* Header — clickable to expand/collapse */}
                  <button
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm transition-transform inline-block" style={{ transform: isExpanded ? 'rotate(90deg)' : undefined }}>
                          &#9654;
                        </span>
                        <span className="text-white font-semibold">
                          {formatDate(session.completedAt)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatTime(session.completedAt)}
                        </span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {session.exercises.length} exercise
                        {session.exercises.length !== 1 && 's'}
                        {' · '}
                        {hasActualTime
                          ? <>{formatDuration(actualTotalSeconds)} <span className="text-gray-500">/ {plannedMinutes} min planned</span></>
                          : <>{plannedMinutes} min</>
                        }
                      </span>
                    </div>

                    {/* Collapsed: exercise names as badges (clickable for details) */}
                    {!isExpanded && (
                      <div className="flex flex-wrap gap-1 mt-2 ml-5">
                        {session.exercises.map((se, j) => {
                          const ex = getExerciseById(se.exerciseId);
                          return (
                            <Badge
                              key={j}
                              variant="outline"
                              className={`bg-gray-700 border-gray-600 text-xs ${ex ? 'text-indigo-400 cursor-pointer hover:bg-gray-600' : 'text-gray-300'}`}
                              onClick={ex ? (e: React.MouseEvent) => { e.stopPropagation(); setDetailExercise(ex); } : undefined}
                            >
                              {ex?.name ?? se.exerciseId}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </button>

                  {/* Expanded: full exercise details */}
                  {isExpanded && (
                    <div className="mt-4 ml-5 space-y-3">
                      {session.exercises.map((se, j) => (
                        <div key={j} className="border-l-2 border-gray-700 pl-3">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm">
                              <span className="text-gray-500 mr-2">{j + 1}.</span>
                              {(() => {
                                const ex = getExerciseById(se.exerciseId);
                                return ex ? (
                                  <button
                                    onClick={() => setDetailExercise(ex)}
                                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    {ex.name}
                                  </button>
                                ) : se.exerciseId;
                              })()}
                            </span>
                            <span className="text-gray-400 text-xs">
                              {se.actualSeconds != null
                                ? <>{formatDuration(se.actualSeconds)} <span className="text-gray-500">/ {se.duration} min</span></>
                                : <>{se.duration} min</>
                              }
                            </span>
                          </div>
                          {se.notes && (
                            <p className="text-gray-400 text-sm mt-1">{se.notes}</p>
                          )}
                        </div>
                      ))}

                      {/* Session notes */}
                      {session.notes && (
                        <div className="border-t border-gray-700 pt-3 mt-3">
                          <p className="text-gray-500 text-xs mb-1">Session notes</p>
                          <p className="text-gray-300 text-sm">{session.notes}</p>
                        </div>
                      )}

                      {/* Actions: save as template + delete */}
                      <div className="border-t border-gray-700 pt-3 mt-3">
                        {savingIndex === i ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder="Template name..."
                              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveAsTemplate(i);
                                if (e.key === 'Escape') { setSavingIndex(null); setTemplateName(''); }
                              }}
                            />
                            <button
                              onClick={() => handleSaveAsTemplate(i)}
                              disabled={!templateName.trim()}
                              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1 rounded transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setSavingIndex(null); setTemplateName(''); }}
                              className="text-gray-400 hover:text-white text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => { setSavingIndex(i); setTemplateName(''); }}
                              className="text-yellow-400 hover:text-yellow-300 text-xs transition-colors"
                            >
                              &#9733; Save as favorite
                            </button>
                            <button
                              onClick={() => handleDeleteSession(i)}
                              className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                            >
                              Delete session
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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

export default HistoryPage;
