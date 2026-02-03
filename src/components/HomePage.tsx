/**
 * HomePage Component
 *
 * The main exercise browsing view — source filtering, tag filtering,
 * text search, and exercise list.
 *
 * ANGULAR vs REACT:
 * - Angular: this would be a "routed component" declared in a route config
 * - React: it's just a regular component passed as a Route element
 *
 * LEARNING NOTES:
 * - CONTROLLED INPUTS: The search input is a "controlled component" where
 *   React state is the single source of truth. The input's value comes from
 *   state, and onChange updates that state. This is different from Angular's
 *   two-way binding [(ngModel)] but achieves the same result with explicit
 *   one-way data flow.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';
import ExerciseList from './ExerciseList';
import ExerciseFilterBar from './ExerciseFilterBar';
import ExerciseFormDialog from './ExerciseFormDialog';
import ConfirmModal from './ConfirmModal';
import { Button } from './ui/button';
import { filterBySource, getTagsForExercises, filterExercises, sortByFavorites } from '../data/exercises';
import type { SourceFilter } from '../data/exercises';
import type { Exercise } from '../types';

function HomePage() {
  // SESSION CONTEXT: access favorite exercise IDs
  const { state, dispatch } = useSession();
  const favoriteIds = state.favoriteExerciseIds;

  // STATE: tag selection for filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // STATE: source selection (new - shows one source at a time)
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');

  // STATE: text search filter
  const [searchText, setSearchText] = useState('');

  // STATE: custom exercise create/edit/delete
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  // COMPUTED VALUES: source filtering → tag computation → text/tag filtering → sort
  const sourceFilteredExercises = filterBySource(selectedSource);
  const { featuredTags, allTags } = getTagsForExercises(sourceFilteredExercises);
  const filteredExercises = filterExercises(sourceFilteredExercises, selectedTags, searchText);
  const sortedExercises = sortByFavorites(filteredExercises, favoriteIds);

  // EVENT HANDLER: Toggle tag selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      }
      return [...prevTags, tag];
    });
  };

  // EVENT HANDLER: Change source filter
  const handleSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(event.target.value as SourceFilter);
    // Clear tag selections when changing source
    setSelectedTags([]);
  };

  return (
    <div className="flex flex-col gap-8">
      <ExerciseFilterBar
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
        featuredTags={featuredTags}
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
        searchText={searchText}
        onSearchChange={setSearchText}
        idPrefix="home"
      >
        {/* Action buttons rendered in the header row */}
        <div className="flex items-center gap-2">
          {/* Build button — hidden on mobile where BottomNav provides access */}
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/prep">Build a jam!</Link>
          </Button>
          {/* Favorites & History — hidden on mobile, available via BottomNav menu */}
          <Button variant="secondary" size="icon" className="hidden sm:flex" asChild>
            <Link to="/favorites" aria-label="Favorites" title="Favorites">
              <Star className="w-5 h-5" />
            </Link>
          </Button>
          <Button variant="secondary" size="icon" className="hidden sm:flex" asChild>
            <Link to="/history" aria-label="Session history" title="Session history">
              <Clock className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </ExerciseFilterBar>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Exercises ({filteredExercises.length})
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(true)}
          >
            <PenLine className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>
        <ExerciseList
          exercises={sortedExercises}
          favoriteIds={favoriteIds}
          onToggleFavorite={(id) => {
            const wasFavorite = favoriteIds.includes(id);
            dispatch({ type: 'TOGGLE_FAVORITE_EXERCISE', exerciseId: id });
            toast(wasFavorite ? 'Removed from favorites' : 'Added to favorites');
          }}
          onEditExercise={(exercise) => setEditingExercise(exercise)}
          onDeleteExercise={(exercise) => setDeletingExercise(exercise)}
        />
      </div>

      {/* Create exercise dialog */}
      {showCreateForm && (
        <ExerciseFormDialog
          open={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={(exercise) => {
            dispatch({ type: 'ADD_CUSTOM_EXERCISE', exercise });
            setShowCreateForm(false);
            toast(`Created "${exercise.name}"`);
          }}
        />
      )}

      {/* Edit exercise dialog */}
      {editingExercise && (
        <ExerciseFormDialog
          open={!!editingExercise}
          onClose={() => setEditingExercise(null)}
          existingExercise={editingExercise}
          onSave={(exercise) => {
            dispatch({ type: 'UPDATE_CUSTOM_EXERCISE', exercise });
            setEditingExercise(null);
            toast(`Updated "${exercise.name}"`);
          }}
        />
      )}

      {/* Delete exercise confirmation */}
      {deletingExercise && (
        <ConfirmModal
          title="Delete exercise?"
          message={`Permanently delete "${deletingExercise.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => {
            dispatch({ type: 'DELETE_CUSTOM_EXERCISE', exerciseId: deletingExercise.id });
            setDeletingExercise(null);
            toast('Exercise deleted');
          }}
          onCancel={() => setDeletingExercise(null)}
        />
      )}
    </div>
  );
}

export default HomePage;
