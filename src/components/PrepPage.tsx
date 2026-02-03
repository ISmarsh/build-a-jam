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
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight, Coffee, GripVertical, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import { getExerciseById, BREAK_EXERCISE_ID, getExerciseName } from '../data/exercises';
import type { Exercise, SessionExercise } from '../types';
import { type ConfirmConfig, confirmRemove } from '../lib/confirmations';
import { useTemplateSaver } from '../hooks/useTemplateSaver';
import { useExerciseFilter } from '../hooks/useExerciseFilter';
import ExerciseFilterBar from './ExerciseFilterBar';
import ExerciseDetailModal from './ExerciseDetailModal';
import ConfirmModal from './ConfirmModal';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

// ---------------------------------------------------------------------------
// SortablePrepItem — a single draggable exercise in the prep queue
// ---------------------------------------------------------------------------

interface SortablePrepItemProps {
  id: string;
  index: number;
  se: SessionExercise;
  /** Exercise number excluding breaks — undefined for break items */
  exerciseNumber: number | undefined;
  onDurationChange: (index: number, duration: number) => void;
  onRequestRemove: () => void;
  onShowDetail: (exercise: Exercise) => void;
}

function SortablePrepItem({
  id,
  index,
  se,
  exerciseNumber,
  onDurationChange,
  onRequestRemove,
  onShowDetail,
}: SortablePrepItemProps) {
  const isBreak = se.exerciseId === BREAK_EXERCISE_ID;
  const exercise = isBreak ? undefined : getExerciseById(se.exerciseId);
  const name = isBreak ? 'Break' : (exercise?.name ?? se.exerciseId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            aria-label={`Drag to reorder ${name}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0 flex items-center">
            <span className="shrink-0 w-5 text-center mr-2">
              {isBreak ? (
                <Coffee className="w-4 h-4 text-muted-foreground inline" />
              ) : (
                <span className="text-muted-foreground text-sm">{exerciseNumber}.</span>
              )}
            </span>
            <span className="text-foreground">{name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="number"
              min={1}
              max={60}
              value={se.duration}
              onChange={(e) =>
                onDurationChange(index, Math.max(1, Number(e.target.value)))
              }
              aria-label={`Duration for ${name} in minutes`}
              className="w-16 bg-secondary border border-input rounded px-2 py-1 text-foreground text-center text-sm"
            />
            <span className="text-muted-foreground text-sm">min</span>
            <button
              onClick={onRequestRemove}
              className="text-destructive hover:text-destructive/80 shrink-0 transition-colors ml-1"
              aria-label={`Remove ${name}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {exercise?.summary && (
          <p className="text-muted-foreground text-sm mt-1 ml-8 line-clamp-1">
            {exercise.summary}
          </p>
        )}
        <div className="flex items-end justify-between mt-1 ml-8">
          <div className="flex flex-wrap gap-1">
            {exercise?.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-primary border-input text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
          {exercise && (
            <button
              onClick={() => onShowDetail(exercise)}
              className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-xs shrink-0 ml-2 transition-colors"
            >
              Details <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PrepPage() {
  const { state, dispatch } = useSession();
  const navigate = useNavigate();
  const [defaultDuration, setDefaultDuration] = useState(10);
  const exerciseFilter = useExerciseFilter();
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const template = useTemplateSaver();

  // Sensors for drag-and-drop — must be called before early return (Rules of Hooks)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // If there's no current session, create one on first visit
  if (!state.currentSession) {
    dispatch({ type: 'CREATE_SESSION' });
    return null; // Re-render will happen with the new session
  }

  const sessionExercises = state.currentSession.exercises;

  // Total time for the session
  const totalMinutes = sessionExercises.reduce((sum, ex) => sum + ex.duration, 0);

  // Precompute exercise numbers (excluding breaks) for display.
  // E.g., [Exercise=1, Break=undefined, Exercise=2, Exercise=3]
  const exerciseNumbers: (number | undefined)[] = [];
  let exerciseCount = 0;
  for (const se of sessionExercises) {
    if (se.exerciseId === BREAK_EXERCISE_ID) {
      exerciseNumbers.push(undefined);
    } else {
      exerciseCount++;
      exerciseNumbers.push(exerciseCount);
    }
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

  // Stable IDs for dnd-kit — slotId is generated when exercises are added
  const sortableIds = sessionExercises.map((se, i) => se.slotId ?? `prep-${i}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = sortableIds.indexOf(String(active.id));
    const toIndex = sortableIds.indexOf(String(over.id));
    if (fromIndex === -1 || toIndex === -1) return;
    dispatch({ type: 'REORDER_EXERCISES', from: fromIndex, to: toIndex });
  }

  function handleStartSession() {
    dispatch({ type: 'START_SESSION' });
    void navigate(`/session/${state.currentSession!.id}`);
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: exercise library with filtering */}
        <div>
          <ExerciseFilterBar
            selectedSource={exerciseFilter.selectedSource}
            onSourceChange={exerciseFilter.handleSourceChange}
            featuredTags={exerciseFilter.featuredTags}
            allTags={exerciseFilter.allTags}
            selectedTags={exerciseFilter.selectedTags}
            onTagToggle={exerciseFilter.handleTagToggle}
            searchText={exerciseFilter.searchText}
            onSearchChange={exerciseFilter.setSearchText}
            idPrefix="prep"
          />

          <div className="flex items-center gap-2 my-4">
            <label htmlFor="default-duration" className="text-muted-foreground text-sm">Default duration:</label>
            <input
              id="default-duration"
              type="number"
              min={1}
              max={60}
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(Math.max(1, Number(e.target.value)))}
              className="w-16 bg-secondary border border-input rounded px-2 py-1 text-foreground text-center text-sm"
            />
            <span className="text-muted-foreground text-sm">min</span>
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-3">
            Exercises ({exerciseFilter.filtered.length})
          </h2>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-dark">
            {exerciseFilter.sorted.map((exercise) => (
              <Card key={exercise.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-primary text-base">
                      {exercise.name}
                    </CardTitle>
                    <button
                      onClick={() => handleAddExercise(exercise.id)}
                      className="text-primary hover:text-primary-hover text-sm shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  {exercise.summary && (
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {exercise.summary}
                    </p>
                  )}
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex flex-wrap gap-1">
                      {exercise.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-primary border-input text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <button
                      onClick={() => setDetailExercise(exercise)}
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-hover text-xs shrink-0 ml-2 transition-colors"
                    >
                      Details <ArrowRight className="w-3 h-3" />
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
            <h2 className="text-xl font-semibold text-foreground">
              Session Queue
              {sessionExercises.length > 0 && (
                <span className="text-muted-foreground text-base font-normal ml-2">
                  {sessionExercises.length} exercise{sessionExercises.length !== 1 && 's'}
                  {' · '}{totalMinutes} min
                </span>
              )}
            </h2>
            {sessionExercises.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => template.start(state.currentSession?.name ?? '')}
                  className="inline-flex items-center gap-1 text-star hover:text-star/80 text-sm transition-colors"
                  title="Save as favorite"
                >
                  <Star className="w-4 h-4 fill-current" /> Save
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
                  className="text-muted-foreground hover:text-destructive text-sm transition-colors"
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
                placeholder="Favorite name..."
                className="flex-1 bg-secondary border border-input rounded px-3 py-1 text-foreground text-sm focus:outline-none focus:border-primary"
                autoFocus // eslint-disable-line jsx-a11y/no-autofocus -- conditionally rendered after user action
                onKeyDown={(e) => {
                  if (e.key === 'Enter') template.save();
                  if (e.key === 'Escape') template.cancel();
                }}
              />
              <Button size="sm" onClick={template.save} disabled={!template.templateName.trim()}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={template.cancel}>
                Cancel
              </Button>
            </div>
          )}

          {sessionExercises.length === 0 ? (
            <p className="text-muted-foreground italic">
              No exercises yet. Add some from the library.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sessionExercises.map((se, index) => {
                    const name = getExerciseName(se);
                    return (
                      <SortablePrepItem
                        key={sortableIds[index]}
                        id={sortableIds[index]}
                        index={index}
                        se={se}
                        exerciseNumber={exerciseNumbers[index]}
                        onDurationChange={handleDurationChange}
                        onShowDetail={(exercise) => setDetailExercise(exercise)}
                        onRequestRemove={() =>
                          setConfirm(confirmRemove(name, () => {
                            handleRemoveExercise(index);
                            setConfirm(null);
                          }))
                        }
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {sessionExercises.length > 0 && (
            <Button size="lg" className="mt-6 w-full" onClick={handleStartSession}>
              Start Session ({totalMinutes} min)
            </Button>
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
