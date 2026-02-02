/* eslint-disable react-refresh/only-export-components -- context files export hooks alongside providers */
/**
 * StorageContext — provides a StorageProvider to the component tree
 *
 * ANGULAR vs REACT:
 * - Angular: you'd register an abstract token and provide a concrete
 *   service via `{ provide: StorageService, useClass: LocalStorage }`
 * - React: we use Context + a hook. Components call `useStorage()` and
 *   don't know or care which backend they're talking to.
 *
 * To swap backends later (e.g. Google Drive), just render a different
 * <StorageContext.Provider value={googleDriveProvider}> at the top of
 * the tree. No component code changes needed.
 */

import { createContext, useContext } from 'react';
import type { StorageProvider } from '../types';
import { localStorageProvider } from './local-storage';

const StorageContext = createContext<StorageProvider>(localStorageProvider);

/**
 * Hook to access the current StorageProvider.
 *
 * Usage:
 *   const storage = useStorage();
 *   const data = await storage.load('sessions');
 */
export function useStorage(): StorageProvider {
  return useContext(StorageContext);
}

export default StorageContext;
