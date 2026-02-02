/**
 * localStorage implementation of StorageProvider
 *
 * ANGULAR vs REACT:
 * - Angular: this would be a @Injectable() service provided in root
 * - React: it's a plain object that we'll pass through Context
 *
 * The interface is async (returns Promises) even though localStorage is
 * synchronous. This lets us swap in Google Drive or any other async
 * backend later without touching any component code.
 */

import type { StorageProvider } from '../types';

const PREFIX = 'build-a-jam:';

// Methods are async to satisfy the StorageProvider interface (future backends
// like Google Drive will need actual async I/O). localStorage is synchronous,
// so these don't need await — that's intentional.
/* eslint-disable @typescript-eslint/require-await */
export const localStorageProvider: StorageProvider = {
  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      console.warn(`Failed to load "${key}" from localStorage`);
      return null;
    }
  },

  async save<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to save "${key}" to localStorage`, err);
    }
  },

  async remove(key: string): Promise<void> {
    localStorage.removeItem(PREFIX + key);
  },
};
