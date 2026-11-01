'use client';

import { invoke } from '@tauri-apps/api/core';
import { runWebCalculation } from './calc-engine';

/**
 * Robust check to determine if the code is running inside a Tauri window.
 */
export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && 
         ((window as any).__TAURI_INTERNALS__ !== undefined || 
          (window as any).__TAURI__ !== undefined);
};

/**
 * Universal safe invoke: Executes via Tauri Rust IPC on desktop,
 * and automatically falls back to instant client-side math calculations in web browsers.
 * @param command The calculation command to invoke
 * @param args Arguments for the command
 * @returns The result of the command
 */
export async function safeInvoke<T>(command: string, args?: any): Promise<T> {
  if (isTauri()) {
    try {
      return await invoke<T>(command, args);
    } catch (err) {
      console.warn(`Tauri command '${command}' failed, using web fallback:`, err);
    }
  }
  
  // Instant client-side web fallback
  return await runWebCalculation<T>(command, args);
}

/**
 * Robust copy to clipboard function that handles Tauri, Browser APIs, and legacy fallbacks.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;

  // 1. Try Tauri Plugin (Priority for Desktop)
  try {
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
    if (typeof writeText === 'function') {
      await writeText(text);
      return true;
    }
  } catch (err) {
    // Likely not in a Tauri environment
  }

  // 2. Try modern Browser Clipboard API
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Browser blocked
  }

  // 3. Legacy fallback: document.execCommand('copy')
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement("textarea");
      textArea.value = text;
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
