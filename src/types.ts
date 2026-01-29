/**
 * Type definitions for Build-a-Jam
 *
 * ANGULAR vs REACT:
 * - In Angular: you'd use interfaces in a *.model.ts file
 * - In React: same pattern, just TypeScript interfaces
 * - No decorators needed like @Injectable or @Component
 */

// ---------------------------------------------------------------------------
// Exercise Library
// ---------------------------------------------------------------------------

/**
 * An exercise in the library. This is the "what it is" definition —
 * duration lives on SessionExercise because it depends on context.
 */
export interface Exercise {
  id: string;
  name: string;
  tags: string[];
  description: string;
  notes?: string;                // tips, variations, or teaching points
  sourceUrl?: string;            // attribution link back to origin site
}

// ---------------------------------------------------------------------------
// Session Planning & Execution
// ---------------------------------------------------------------------------

/**
 * An exercise placed into a session queue. Duration is set here because
 * the same exercise might be 5 minutes in a quick warm-up or 15 minutes
 * when you want to dig deep.
 */
export interface SessionExercise {
  exerciseId: string;            // reference to Exercise.id
  duration: number;              // minutes — set during session prep
  order: number;                 // position in the queue
  notes?: string;                // notes specific to this slot
}

/**
 * A planned session — either a one-off or a reusable template.
 */
export interface Session {
  id: string;
  name?: string;                 // optional label for templates
  exercises: SessionExercise[];
  createdAt: Date;
  isTemplate: boolean;           // true = saved for reuse
}

/**
 * What actually happened after running a session.
 */
export interface CompletedSession {
  sessionId: string;             // reference to Session.id
  completedAt: Date;
  exercises: SessionExercise[];  // what was actually run
  notes: string;                 // post-session reflections
}
