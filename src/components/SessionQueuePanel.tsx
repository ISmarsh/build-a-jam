/**
 * SessionQueuePanel — Collapsible panel for viewing and editing the session queue
 * during an active session.
 *
 * LEARNING NOTES - COMPONENT COMPOSITION & DRAG-AND-DROP:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you might use Angular CDK's DragDrop module with cdkDrag/cdkDropList
 *    directives. The CDK handles animation, placeholder rendering, and accessibility.
 *    React: we use @dnd-kit, which follows a hooks-based approach. Instead of
 *    directives, you wrap items with <SortableContext> and call useSortable() in
 *    each draggable item. Same concepts, different API surface.
 *
 * 2. @dnd-kit ARCHITECTURE:
 *    - DndContext: the provider (like cdkDropListGroup) — handles drag events
 *    - SortableContext: defines which items are sortable and in what order
 *    - useSortable(): hook on each item — returns refs, listeners, and transform
 *    - The library handles touch events, keyboard DnD (Space to pick up,
 *      arrows to move), and accessibility announcements automatically.
 *
 * 3. LIFTING STATE UP (revisited):
 *    The expand/collapse toggle is local state — no other component cares
 *    whether the panel is open. But the queue data and edit actions come
 *    from SessionContext via the parent. This split (local UI state vs.
 *    shared app state) is a core React pattern.
 */

import { useState } from 'react';
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
import { ChevronDown, ChevronUp, Check, Play, Coffee, Plus, X, GripVertical } from 'lucide-react';
import type { SessionExercise } from '../types';
import { getExerciseById, formatDuration } from '../data/exercises';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import ConfirmModal from './ConfirmModal';

/** Sentinel exercise ID for break items */
export const BREAK_EXERCISE_ID = 'break';

interface SessionQueuePanelProps {
  exercises: SessionExercise[];
  currentIndex: number;
  onRemove: (index: number) => void;
  onDurationChange: (index: number, duration: number) => void;
  onReorder: (from: number, to: number) => void;
  onAddExercise: () => void;
  onAddBreak: () => void;
  onEditNotes: (index: number, notes: string) => void;
}

function getExerciseName(se: SessionExercise): string {
  if (se.exerciseId === BREAK_EXERCISE_ID) return 'Break';
  return getExerciseById(se.exerciseId)?.name ?? se.exerciseId;
}

// ---------------------------------------------------------------------------
// SortableQueueItem — a single draggable upcoming exercise row
// ---------------------------------------------------------------------------

interface SortableQueueItemProps {
  id: string;
  index: number;
  /** Exercise number excluding breaks (undefined for breaks) */
  exerciseNumber?: number;
  se: SessionExercise;
  name: string;
  isBreak: boolean;
  onDurationChange: (index: number, duration: number) => void;
  onRequestRemove: () => void;
}

function SortableQueueItem({
  id,
  index,
  exerciseNumber,
  se,
  name,
  isBreak,
  onDurationChange,
  onRequestRemove,
}: SortableQueueItemProps) {
  // useSortable gives us everything needed to make this item draggable:
  // - attributes: ARIA attributes for accessibility
  // - listeners: event handlers for the drag handle
  // - setNodeRef: ref to attach to the DOM element
  // - transform/transition: CSS values for smooth animation during drag
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
    // Raise the dragged item above others
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-card"
    >
      {/* Drag handle — only this element triggers dragging */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        aria-label={`Drag to reorder ${name}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Number + icon — breaks show a coffee icon, exercises show their number */}
      <span className="shrink-0 w-5 text-center">
        {isBreak ? (
          <Coffee className="w-4 h-4 text-muted-foreground" />
        ) : (
          <span className="text-muted-foreground">{exerciseNumber}</span>
        )}
      </span>

      {/* Exercise name */}
      <span className="flex-1 min-w-0 truncate text-foreground">
        {name}
      </span>

      {/* Duration edit */}
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          min={1}
          max={60}
          value={se.duration}
          onChange={(e) =>
            onDurationChange(index, Math.max(1, Number(e.target.value)))
          }
          aria-label={`Duration for ${name} in minutes`}
          className="w-12 bg-secondary border border-input rounded px-1 py-0.5 text-foreground text-center text-xs"
        />
        <span className="text-muted-foreground text-xs">m</span>
      </div>

      {/* Remove button */}
      <button
        onClick={onRequestRemove}
        className="text-destructive hover:text-destructive/80 shrink-0 transition-colors ml-1"
        aria-label={`Remove ${name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionQueuePanel — main component
// ---------------------------------------------------------------------------

function SessionQueuePanel({
  exercises,
  currentIndex,
  onRemove,
  onDurationChange,
  onReorder,
  onAddExercise,
  onAddBreak,
  onEditNotes,
}: SessionQueuePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Precompute exercise numbers (excluding breaks) for display.
  // E.g., [Exercise=1, Break=undefined, Exercise=2, Exercise=3, Break=undefined]
  const exerciseNumbers: (number | undefined)[] = [];
  let exerciseCount = 0;
  for (const se of exercises) {
    if (se.exerciseId === BREAK_EXERCISE_ID) {
      exerciseNumbers.push(undefined);
    } else {
      exerciseCount++;
      exerciseNumbers.push(exerciseCount);
    }
  }

  // Upcoming exercises (the sortable portion of the queue)
  const upcomingExercises = exercises.slice(currentIndex + 1);
  // Stable IDs for dnd-kit — slotId is generated when the exercise is added
  // to the queue, so it doesn't change when items are reordered. This prevents
  // the "snap back then animate" flicker caused by index-based IDs.
  // Falls back to index-based IDs for exercises added before slotId existed.
  const sortableIds = upcomingExercises.map((se, i) => se.slotId ?? `upcoming-${i}`);

  // Sensors: pointer (mouse/touch) and keyboard for accessibility
  // The activation constraint prevents accidental drags on tap/click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Convert sortable IDs back to actual exercise indices
    const fromSortableIndex = sortableIds.indexOf(String(active.id));
    const toSortableIndex = sortableIds.indexOf(String(over.id));
    if (fromSortableIndex === -1 || toSortableIndex === -1) return;

    // Offset by currentIndex + 1 to get real indices in the full array
    const fromIndex = currentIndex + 1 + fromSortableIndex;
    const toIndex = currentIndex + 1 + toSortableIndex;

    onReorder(fromIndex, toIndex);
  }

  return (
    <Card className="mt-6">
      <CardContent className="py-3">
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="text-foreground font-medium">
            Queue
            <span className="text-muted-foreground font-normal ml-2">
              {upcomingExercises.length} upcoming
            </span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-1 max-h-[40vh] overflow-y-auto scrollbar-dark">
            {/* Completed exercises — read-only, greyed out */}
            {exercises.slice(0, currentIndex).map((se, index) => {
              const name = getExerciseName(se);
              return (
                <div
                  key={`completed-${index}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm opacity-50"
                >
                  <span className="shrink-0 w-5 text-center">
                    <Check className="w-4 h-4 text-muted-foreground" />
                  </span>
                  <span className="flex-1 min-w-0 truncate text-foreground">{name}</span>
                  {se.actualSeconds != null ? (
                    <span className="text-muted-foreground text-xs shrink-0">
                      {formatDuration(se.actualSeconds)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs shrink-0">
                      {se.duration}m
                    </span>
                  )}
                  <button
                    onClick={() =>
                      setEditingNotesIndex(editingNotesIndex === index ? null : index)
                    }
                    className="text-muted-foreground hover:text-foreground text-xs shrink-0 transition-colors"
                    title="Edit notes"
                  >
                    Notes
                  </button>
                </div>
              );
            })}

            {/* Current exercise — highlighted, locked */}
            {(() => {
              const se = exercises[currentIndex];
              const name = getExerciseName(se);
              return (
                <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm bg-primary/10 border border-primary/30">
                  <span className="shrink-0 w-5 text-center">
                    <Play className="w-4 h-4 text-primary fill-primary" />
                  </span>
                  <span className="flex-1 min-w-0 truncate text-primary font-medium">
                    {name}
                    <span className="text-primary/70 text-xs ml-2">NOW</span>
                  </span>
                  <span className="text-muted-foreground text-xs shrink-0">
                    {se.duration}m
                  </span>
                </div>
              );
            })()}

            {/* Upcoming exercises — sortable via drag-and-drop */}
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
                {upcomingExercises.map((se, sortableIndex) => {
                  const realIndex = currentIndex + 1 + sortableIndex;
                  const name = getExerciseName(se);
                  const isBreak = se.exerciseId === BREAK_EXERCISE_ID;

                  return (
                    <SortableQueueItem
                      key={sortableIds[sortableIndex]}
                      id={sortableIds[sortableIndex]}
                      index={realIndex}
                      exerciseNumber={exerciseNumbers[realIndex]}
                      se={se}
                      name={name}
                      isBreak={isBreak}
                      onDurationChange={onDurationChange}
                      onRequestRemove={() =>
                        setConfirm({
                          title: 'Remove from queue?',
                          message: `Remove "${name}" from the session?`,
                          confirmLabel: 'Remove',
                          onConfirm: () => {
                            onRemove(realIndex);
                            setConfirm(null);
                          },
                        })
                      }
                    />
                  );
                })}
              </SortableContext>
            </DndContext>

            {/* Notes editor for completed exercises */}
            {editingNotesIndex !== null && editingNotesIndex < currentIndex && (
              <div className="px-3 py-2">
                <textarea
                  value={exercises[editingNotesIndex]?.notes ?? ''}
                  onChange={(e) => onEditNotes(editingNotesIndex, e.target.value)}
                  placeholder={`Notes for ${getExerciseName(exercises[editingNotesIndex])}...`}
                  rows={2}
                  className="w-full bg-secondary border border-input rounded-lg p-2 text-secondary-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary transition-colors resize-y"
                />
              </div>
            )}
          </div>
        )}

        {/* Add buttons — always visible when expanded */}
        {isExpanded && (
          <div className="flex gap-2 mt-3 pt-3 border-t border-input">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddExercise}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Exercise
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddBreak}
              className="flex-1"
            >
              <Coffee className="w-4 h-4 mr-1" />
              Add Break
            </Button>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}

export default SessionQueuePanel;
