'use client';

import { invoke } from '@tauri-apps/api/core';

/**
 * Robust check to determine if the code is running inside a Tauri window.
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && 
         ((window as any).__TAURI_INTERNALS__ !== undefined || 
          (window as any).__TAURI__ !== undefined);
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
/**
 * Robust copy to clipboard function that handles Tauri, Browser APIs, and legacy fallbacks.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try Tauri Plugin (Priority for Desktop)
  try {
    // Dynamic import to avoid breaking in non-Tauri environments
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    if (typeof writeText === 'function') {
      await writeText(text);
      return true;
    }
  } catch (err) {
    // Likely not in a Tauri environment or plugin missing
  }

  // 2. Try modern Browser Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Browser blocked it (requires focus or permissions)
  }

  // 3. Final legacy fallback: document.execCommand('copy')
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) return true;
    }
  } catch (err) {
    console.error('All copy methods failed:', err);
  }

  return false;
}

/**
 * Vault security commands
 */
export const vaultAuth = {
  isSet: () => safeInvoke<boolean>('is_master_password_set'),
  set: (password: string) => safeInvoke<void>('set_master_password', { password }),
  verify: (password: string) => safeInvoke<boolean>('verify_master_password', { password }),
};
