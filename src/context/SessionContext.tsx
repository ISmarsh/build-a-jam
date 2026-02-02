/* eslint-disable react-refresh/only-export-components -- context files export hooks alongside providers */
/**
 * SessionContext — manages the Prep → Session → Notes workflow state
 *
 * LEARNING NOTES - REACT CONTEXT:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: services are singletons injected via DI. State lives in the
 *    service and components subscribe to observables or signals.
 *    React: Context is the equivalent of a "global service". You create a
 *    Context, provide a value at the top of the tree, and consume it
 *    anywhere below via useContext (or a custom hook like useSession).
 *
 * 2. WHEN TO USE CONTEXT:
 *    - When multiple components at different nesting levels need the same data
 *    - When prop drilling (passing props through many layers) gets painful
 *    - Session state is a perfect example: Prep, Session, and Notes pages
 *      all need access to the current session
 *
 * 3. CONTEXT + REDUCER PATTERN:
 *    We use useReducer (not useState) because session state has multiple
 *    related actions. This is similar to Angular's NgRx/Redux pattern:
 *    dispatch an action → reducer produces new state → React re-renders.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { Session, SessionExercise, CompletedSession } from '../types';
import { useStorage } from '../storage/StorageContext';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  CURRENT_SESSION: 'current-session',
  SESSIONS: 'sessions',
  COMPLETED_SESSIONS: 'completed-sessions',
  FAVORITE_EXERCISE_IDS: 'favorite-exercise-ids',
} as const;

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface SessionState {
  /** The session being built or run right now (null = idle) */
  currentSession: Session | null;
  /** Index of the exercise currently being run (null = not running) */
  currentExerciseIndex: number | null;
  /** Saved sessions (templates and one-offs) */
  sessions: Session[];
  /** History of completed sessions */
  completedSessions: CompletedSession[];
  /** IDs of individually-starred exercises */
  favoriteExerciseIds: string[];
  /** Whether initial load from storage has finished */
  loaded: boolean;
}

const initialState: SessionState = {
  currentSession: null,
  currentExerciseIndex: null,
  sessions: [],
  completedSessions: [],
  favoriteExerciseIds: [],
  loaded: false,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type SessionAction =
  | { type: 'HYDRATE'; sessions: Session[]; completedSessions: CompletedSession[]; currentSession: Session | null; favoriteExerciseIds: string[] }
  | { type: 'CREATE_SESSION'; name?: string }
  | { type: 'LOAD_SESSION'; session: Session }
  | { type: 'ADD_EXERCISE'; exerciseId: string; duration: number }
  | { type: 'REMOVE_EXERCISE'; index: number }
  | { type: 'SET_DURATION'; index: number; duration: number }
  | { type: 'SET_EXERCISE_NOTES'; index: number; notes: string }
  | { type: 'SET_ACTUAL_DURATION'; index: number; actualSeconds: number }
  | { type: 'REORDER_EXERCISES'; from: number; to: number }
  | { type: 'START_SESSION' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'COMPLETE_SESSION'; notes: string }
  | { type: 'SAVE_AS_TEMPLATE'; name: string }
  | { type: 'CLEAR_SESSION' }
  | { type: 'DELETE_COMPLETED_SESSION'; index: number }
  | { type: 'CLEAR_COMPLETED_SESSIONS' }
  | { type: 'TOGGLE_FAVORITE_EXERCISE'; exerciseId: string }
  | { type: 'DELETE_SESSION_TEMPLATE'; sessionId: string }
  | { type: 'SAVE_COMPLETED_AS_TEMPLATE'; completedSessionIndex: number; name: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const result = [...list];
  const [moved] = result.splice(from, 1);
  result.splice(to, 0, moved);
  return result.map((item, i) => ({ ...item, order: i }));
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        sessions: action.sessions,
        completedSessions: action.completedSessions,
        currentSession: action.currentSession,
        favoriteExerciseIds: action.favoriteExerciseIds,
        loaded: true,
      };

    case 'CREATE_SESSION':
      return {
        ...state,
        currentSession: {
          id: generateId(),
          name: action.name,
          exercises: [],
          createdAt: new Date().toISOString(),
          isTemplate: false,
        },
        currentExerciseIndex: null,
      };

    case 'LOAD_SESSION':
      return {
        ...state,
        currentSession: {
          ...action.session,
          // Give it a new ID so the original template isn't mutated
          id: generateId(),
          createdAt: new Date().toISOString(),
          isTemplate: false,
        },
        currentExerciseIndex: null,
      };

    case 'ADD_EXERCISE': {
      if (!state.currentSession) return state;
      const newExercise: SessionExercise = {
        exerciseId: action.exerciseId,
        duration: action.duration,
        order: state.currentSession.exercises.length,
      };
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: [...state.currentSession.exercises, newExercise],
        },
      };
    }

    case 'REMOVE_EXERCISE': {
      if (!state.currentSession) return state;
      const filtered = state.currentSession.exercises
        .filter((_, i) => i !== action.index)
        .map((ex, i) => ({ ...ex, order: i }));
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: filtered,
        },
      };
    }

    case 'SET_DURATION': {
      if (!state.currentSession) return state;
      const updated = state.currentSession.exercises.map((ex, i) =>
        i === action.index ? { ...ex, duration: action.duration } : ex,
      );
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: updated,
        },
      };
    }

    case 'SET_EXERCISE_NOTES': {
      if (!state.currentSession) return state;
      const updated = state.currentSession.exercises.map((ex, i) =>
        i === action.index ? { ...ex, notes: action.notes } : ex,
      );
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: updated,
        },
      };
    }

    case 'SET_ACTUAL_DURATION': {
      if (!state.currentSession) return state;
      const updated = state.currentSession.exercises.map((ex, i) =>
        i === action.index ? { ...ex, actualSeconds: action.actualSeconds } : ex,
      );
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: updated,
        },
      };
    }

    case 'REORDER_EXERCISES': {
      if (!state.currentSession) return state;
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          exercises: reorder(state.currentSession.exercises, action.from, action.to),
        },
      };
    }

    case 'START_SESSION':
      if (!state.currentSession || state.currentSession.exercises.length === 0) {
        return state;
      }
      return {
        ...state,
        currentExerciseIndex: 0,
      };

    case 'NEXT_EXERCISE': {
      if (state.currentExerciseIndex === null || !state.currentSession) return state;
      const next = state.currentExerciseIndex + 1;
      if (next >= state.currentSession.exercises.length) {
        // Past the last exercise — session is done
        return { ...state, currentExerciseIndex: null };
      }
      return { ...state, currentExerciseIndex: next };
    }

    case 'COMPLETE_SESSION': {
      if (!state.currentSession) return state;
      const completed: CompletedSession = {
        sessionId: state.currentSession.id,
        completedAt: new Date().toISOString(),
        exercises: state.currentSession.exercises,
        notes: action.notes,
      };
      return {
        ...state,
        completedSessions: [...state.completedSessions, completed],
        currentSession: null,
        currentExerciseIndex: null,
      };
    }

    case 'SAVE_AS_TEMPLATE': {
      if (!state.currentSession) return state;
      const template: Session = {
        ...state.currentSession,
        name: action.name,
        isTemplate: true,
      };
      return {
        ...state,
        sessions: [...state.sessions, template],
      };
    }

    case 'CLEAR_SESSION':
      return {
        ...state,
        currentSession: null,
        currentExerciseIndex: null,
      };

    case 'DELETE_COMPLETED_SESSION':
      return {
        ...state,
        completedSessions: state.completedSessions.filter((_, i) => i !== action.index),
      };

    case 'CLEAR_COMPLETED_SESSIONS':
      return {
        ...state,
        completedSessions: [],
      };

    case 'TOGGLE_FAVORITE_EXERCISE': {
      const ids = state.favoriteExerciseIds;
      const exists = ids.includes(action.exerciseId);
      return {
        ...state,
        favoriteExerciseIds: exists
          ? ids.filter(id => id !== action.exerciseId)
          : [...ids, action.exerciseId],
      };
    }

    case 'DELETE_SESSION_TEMPLATE':
      return {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.sessionId),
      };

    case 'SAVE_COMPLETED_AS_TEMPLATE': {
      const completed = state.completedSessions[action.completedSessionIndex];
      if (!completed) return state;
      const template: Session = {
        id: generateId(),
        name: action.name,
        exercises: completed.exercises.map(({ exerciseId, duration, order }) => ({
          exerciseId,
          duration,
          order,
        })),
        createdAt: new Date().toISOString(),
        isTemplate: true,
      };
      return {
        ...state,
        sessions: [...state.sessions, template],
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

interface SessionContextValue {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const storage = useStorage();

  // Load persisted state on mount
  useEffect(() => {
    async function hydrate() {
      const [sessions, completedSessions, currentSession, favoriteExerciseIds] = await Promise.all([
        storage.load<Session[]>(STORAGE_KEYS.SESSIONS),
        storage.load<CompletedSession[]>(STORAGE_KEYS.COMPLETED_SESSIONS),
        storage.load<Session>(STORAGE_KEYS.CURRENT_SESSION),
        storage.load<string[]>(STORAGE_KEYS.FAVORITE_EXERCISE_IDS),
      ]);
      dispatch({
        type: 'HYDRATE',
        sessions: sessions ?? [],
        completedSessions: completedSessions ?? [],
        currentSession: currentSession ?? null,
        favoriteExerciseIds: favoriteExerciseIds ?? [],
      });
    }
    void hydrate();
  }, [storage]);

  // Persist on every state change (after initial hydration)
  useEffect(() => {
    if (!state.loaded) return;
    void storage.save(STORAGE_KEYS.SESSIONS, state.sessions);
    void storage.save(STORAGE_KEYS.COMPLETED_SESSIONS, state.completedSessions);
    void storage.save(STORAGE_KEYS.FAVORITE_EXERCISE_IDS, state.favoriteExerciseIds);
    if (state.currentSession) {
      void storage.save(STORAGE_KEYS.CURRENT_SESSION, state.currentSession);
    } else {
      void storage.remove(STORAGE_KEYS.CURRENT_SESSION);
    }
  }, [state.sessions, state.completedSessions, state.currentSession, state.favoriteExerciseIds, state.loaded, storage]);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access session state and dispatch actions.
 *
 * Usage:
 *   const { state, dispatch } = useSession();
 *   dispatch({ type: 'ADD_EXERCISE', exerciseId: '...', duration: 5 });
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return ctx;
}
