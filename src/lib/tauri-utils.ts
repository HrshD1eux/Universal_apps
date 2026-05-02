'use client';

import { invoke } from '@tauri-apps/api/core';

/**
 * Robust check to determine if the code is running inside a Tauri window.
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && 
         (window as any).__TAURI_INTERNALS__ !== undefined;
};

/**
 * A safe wrapper for Tauri's invoke that prevents crashes in non-Tauri environments.
 * @param command The Rust command to invoke
 * @param args Arguments for the command
 * @returns The result of the command, or throws a specific error if not in Tauri.
 */
export async function safeInvoke<T>(command: string, args?: any): Promise<T> {
  if (!isTauri()) {
    throw new Error('DESKTOP_ONLY: IPC calls are only available in the desktop application.');
  }
  
  try {
    return await invoke<T>(command, args);
  } catch (err) {
    // Standardize error reporting
    throw err;
  }
}
