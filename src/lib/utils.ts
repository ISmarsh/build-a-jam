import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes
 *
 * LEARNING NOTE:
 * - clsx: Conditionally combines classnames
 * - twMerge: Merges Tailwind classes intelligently (removes conflicts)
 * - Example: cn("p-4", "p-2") => "p-2" (not "p-4 p-2")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
