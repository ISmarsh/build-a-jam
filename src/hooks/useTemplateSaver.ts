/**
 * useTemplateSaver — Custom hook for the "Save as favorite" template flow
 *
 * LEARNING NOTES - CUSTOM HOOKS:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: you'd create a shared Service and inject it into multiple
 *    components. The service holds the state and methods.
 *    React: you create a custom hook. Each component that calls the hook
 *    gets its OWN copy of the state (hooks aren't singletons like services).
 *
 * 2. WHY A CUSTOM HOOK?
 *    PrepPage and NotesPage both had identical logic for:
 *      - savingTemplate (boolean) + templateName (string) state
 *      - handleSaveTemplate() — trim, guard, dispatch, toast, reset
 *      - startSaving() / cancelSaving() — toggle the form open/closed
 *    Extracting to a hook eliminates that duplication. The JSX for the
 *    inline form still lives in each component (hooks return data, not UI).
 *
 * 3. HOOK RULES:
 *    Custom hooks can call other hooks (useSession, useState, etc.).
 *    They follow the same rules: call at the top level, not inside
 *    conditions or loops. Note: toast() from Sonner is a plain function,
 *    not a hook — so it can be called anywhere (inside callbacks, etc.).
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '../context/SessionContext';

export function useTemplateSaver() {
  const { dispatch } = useSession();

  const [isSaving, setIsSaving] = useState(false);
  const [templateName, setTemplateName] = useState('');

  function save() {
    const name = templateName.trim();
    if (!name) return;
    dispatch({ type: 'SAVE_AS_TEMPLATE', name });
    toast.success(`Saved "${name}" to favorites`);
    setIsSaving(false);
    setTemplateName('');
  }

  function start(initialName = '') {
    setIsSaving(true);
    setTemplateName(initialName);
  }

  function cancel() {
    setIsSaving(false);
    setTemplateName('');
  }

  return { isSaving, templateName, setTemplateName, save, start, cancel };
}
