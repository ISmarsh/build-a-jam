/**
 * Confirmation dialog helpers — factory functions for common confirmations
 *
 * LEARNING NOTES - FACTORY FUNCTIONS FOR UI PATTERNS:
 *
 * 1. THE PROBLEM:
 *    Confirmation dialogs are created inline throughout the app:
 *    setConfirm({
 *      title: 'Remove exercise?',
 *      message: `Remove "${name}" from the queue?`,
 *      confirmLabel: 'Remove',
 *      onConfirm: () => { ... }
 *    });
 *
 *    This leads to inconsistent wording and duplicated object literals.
 *
 * 2. THE SOLUTION:
 *    Factory functions that return the config object. Centralizes:
 *    - Consistent wording ("Remove" vs "Delete" vs "Clear")
 *    - Message formatting
 *    - Label choices
 *
 * 3. USAGE:
 *    setConfirm(confirmRemove('Zip Zap Zop', () => handleRemove(index)));
 *
 * 4. ANGULAR vs REACT:
 *    Angular: you might put these in a service or use a ConfirmService that
 *    opens a dialog and returns a Promise<boolean>.
 *    React: we keep it simple — factory functions return config objects,
 *    the component owns the state and renders ConfirmModal.
 */

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * Confirm removing an item from a list (queue, history, etc.)
 */
export function confirmRemove(itemName: string, onConfirm: () => void): ConfirmConfig {
  return {
    title: 'Remove from queue?',
    message: `Remove "${itemName}" from the session?`,
    confirmLabel: 'Remove',
    onConfirm,
  };
}

/**
 * Confirm deleting an item permanently (template, custom exercise, etc.)
 */
export function confirmDelete(itemType: string, onConfirm: () => void): ConfirmConfig {
  return {
    title: `Delete ${itemType}?`,
    message: `This will permanently remove this ${itemType}.`,
    confirmLabel: 'Delete',
    onConfirm,
  };
}

/**
 * Confirm clearing all items (history, queue, etc.)
 */
export function confirmClearAll(itemType: string, onConfirm: () => void): ConfirmConfig {
  return {
    title: `Clear all ${itemType}?`,
    message: `This will permanently remove all ${itemType}. This cannot be undone.`,
    confirmLabel: 'Clear All',
    onConfirm,
  };
}

/**
 * Confirm discarding unsaved changes
 */
export function confirmDiscard(onConfirm: () => void): ConfirmConfig {
  return {
    title: 'Discard changes?',
    message: 'You have unsaved changes that will be lost.',
    confirmLabel: 'Discard',
    onConfirm,
  };
}
