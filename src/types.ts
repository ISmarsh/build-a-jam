/**
 * Type definitions for Build-a-Jam
 *
 * ANGULAR vs REACT:
 * - In Angular: you'd use interfaces in a *.model.ts file
 * - In React: same pattern, just TypeScript interfaces
 * - No decorators needed like @Injectable or @Component
 */

export interface Exercise {
  id: string;
  title: string;
  description: string;
  tags: string[];
  duration?: number; // in minutes
}

// Union type for tag categories (can expand this later)
export type TagCategory = 'connection' | 'structure' | 'heightening' | 'energy' | 'focus' | 'listening';
