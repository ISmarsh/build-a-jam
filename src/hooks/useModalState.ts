/**
 * useModalState — Generic hook for modal visibility tied to an item
 *
 * LEARNING NOTES - GENERIC CUSTOM HOOKS:
 *
 * 1. THE PATTERN:
 *    Many modals in this app follow the same pattern:
 *    - State is `SomeType | null` (null = closed, non-null = open with data)
 *    - Opening sets the item, closing sets null
 *    - Components check `item !== null` to render the modal
 *
 * 2. BEFORE:
 *    const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
 *    // open: setDetailExercise(exercise)
 *    // close: setDetailExercise(null)
 *    // render: {detailExercise && <Modal ... />}
 *
 * 3. AFTER:
 *    const detailModal = useModalState<Exercise>();
 *    // open: detailModal.open(exercise)
 *    // close: detailModal.close()
 *    // render: {detailModal.item && <Modal ... />}
 *
 * 4. ANGULAR vs REACT:
 *    Angular: you might use a service with BehaviorSubject<T | null> and
 *    open()/close() methods. The observable is subscribed in the template.
 *    React: a custom hook encapsulates useState and returns an object with
 *    the current value plus helper methods. Same concept, hooks API.
 *
 * 5. GENERIC TYPE <T>:
 *    TypeScript generics let us reuse this hook for any item type:
 *    useModalState<Exercise>(), useModalState<Session>(), etc.
 *    The type flows through to `item` and `open(item)`.
 */

import { useState, useCallback } from 'react';

interface ModalState<T> {
  /** The currently displayed item, or null if modal is closed */
  item: T | null;
  /** Whether the modal is open (convenience for `item !== null`) */
  isOpen: boolean;
  /** Open the modal with the given item */
  open: (item: T) => void;
  /** Close the modal */
  close: () => void;
}

export function useModalState<T>(): ModalState<T> {
  const [item, setItem] = useState<T | null>(null);

  const open = useCallback((newItem: T) => {
    setItem(newItem);
  }, []);

  const close = useCallback(() => {
    setItem(null);
  }, []);

  return {
    item,
    isOpen: item !== null,
    open,
    close,
  };
}
