/**
 * ExercisePickerDialog — Modal for browsing and adding exercises mid-session
 *
 * LEARNING NOTES - DIALOG WITH CHILD STATE:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you'd pass data to MatDialog via inject(MAT_DIALOG_DATA) and
 *    emit results back via MatDialogRef.close(result).
 *    React: the dialog is just a component with its own local state for
 *    filters. The parent passes callbacks (onAdd, onClose) as props.
 *    No special injection mechanism needed — just props and composition.
 *
 * 2. STAYING OPEN FOR MULTI-ADD:
 *    Unlike a typical "pick one and close" dialog, this stays open so
 *    users can add multiple exercises in one go. The parent handles the
 *    actual dispatch; we just call onAdd(exerciseId) for each selection.
 *    A toast (from the parent) confirms each add.
 *
 * 3. REUSING ExerciseFilterBar:
 *    We reuse the same filter bar that HomePage and PrepPage use. The
 *    idPrefix prop avoids duplicate HTML IDs since the SessionPage's
 *    filter bar would conflict otherwise.
 */

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  filterBySource,
  getTagsForExercises,
  filterExercises,
  sortByFavorites,
} from '../data/exercises';
import type { SourceFilter } from '../data/exercises';
import type { Exercise } from '../types';
import { useSession } from '../context/SessionContext';
import ExerciseFilterBar from './ExerciseFilterBar';
import ExerciseDetailModal from './ExerciseDetailModal';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface ExercisePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseId: string) => void;
  /** Exercise IDs already in the session queue (shown as "In queue") */
  existingExerciseIds: string[];
}

function ExercisePickerDialog({
  open,
  onClose,
  onAdd,
  existingExerciseIds,
}: ExercisePickerDialogProps) {
  const { state } = useSession();
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Same filter pipeline used by HomePage and PrepPage
  const sourceFiltered = filterBySource(selectedSource);
  const { featuredTags, allTags } = getTagsForExercises(sourceFiltered);
  const filtered = filterExercises(sourceFiltered, selectedTags, searchText);
  const sorted = sortByFavorites(filtered, state.favoriteExerciseIds);

  function handleSourceChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setSelectedSource(event.target.value as SourceFilter);
    setSelectedTags([]);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="bg-card max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Exercise</DialogTitle>
            <DialogDescription>
              Browse the library and add exercises to your running session.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <ExerciseFilterBar
              selectedSource={selectedSource}
              onSourceChange={handleSourceChange}
              featuredTags={featuredTags}
              allTags={allTags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              searchText={searchText}
              onSearchChange={setSearchText}
              idPrefix="session-picker"
            />

            <p className="text-muted-foreground text-sm mt-3 mb-2">
              {filtered.length} exercise{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Compact exercise list */}
            <div className="space-y-2">
              {sorted.map((exercise) => {
                const inQueue = existingExerciseIds.includes(exercise.id);
                return (
                  <Card key={exercise.id}>
                    <CardHeader className="py-2 px-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-primary text-sm truncate">
                          {exercise.name}
                        </CardTitle>
                        {inQueue ? (
                          <span className="text-muted-foreground text-xs shrink-0 italic">
                            In queue
                          </span>
                        ) : (
                          <button
                            onClick={() => onAdd(exercise.id)}
                            className="text-primary hover:text-primary-hover text-sm shrink-0"
                          >
                            + Add
                          </button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 px-3">
                      {exercise.summary && (
                        <p className="text-muted-foreground text-xs line-clamp-1">
                          {exercise.summary}
                        </p>
                      )}
                      <div className="flex items-end justify-between mt-1">
                        <div className="flex flex-wrap gap-1">
                          {exercise.tags.slice(0, 4).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-primary border-input text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {exercise.tags.length > 4 && (
                            <span className="text-muted-foreground text-xs">
                              +{exercise.tags.length - 4}
                            </span>
                          )}
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
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail modal — stacks on top of the picker dialog */}
      {detailExercise && (
        <ExerciseDetailModal
          exercise={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </>
  );
}

export default ExercisePickerDialog;
