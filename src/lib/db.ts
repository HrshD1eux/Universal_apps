'use client';

import Database from '@tauri-apps/plugin-sql';
import { CalculatorHistoryItem } from './types';
import { isTauri } from './tauri-utils';

let db: Database | null = null;
const WEB_STORAGE_KEY = 'calc_history_web';

function getWebHistory(): CalculatorHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setWebHistory(items: CalculatorHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export async function getDb() {
  if (!isTauri()) {
    return null;
  }

  if (!db) {
    try {
      db = await Database.load('sqlite:universal_apps.db');
      
      // Initialize tables if they don't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS history (
          id TEXT PRIMARY KEY,
          calculator_name TEXT NOT NULL,
          category TEXT NOT NULL,
          inputs TEXT NOT NULL,
          outputs TEXT NOT NULL,
          execution_time_ms INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (err) {
      console.error('Failed to load database:', err);
      return null;
    }
  }
  return db;
}

export async function saveToHistory(
  calculatorName: string,
  category: string,
  inputs: any,
  outputs: any,
  executionTimeMs: number
) {
  const id = crypto.randomUUID();
  const database = await getDb();
  
  if (!database) {
    try {
      const items = getWebHistory();
      items.unshift({
        id,
        calculator_name: calculatorName,
        category,
        inputs,
        outputs,
        execution_time_ms: executionTimeMs,
        created_at: new Date().toISOString()
      });
      setWebHistory(items.slice(0, 100));
      return id;
    } catch {
      return null;
    }
  }

  try {
    await database.execute(
      `INSERT INTO history (id, calculator_name, category, inputs, outputs, execution_time_ms)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, calculatorName, category, JSON.stringify(inputs), JSON.stringify(outputs), executionTimeMs]
    );
    return id;
  } catch (err) {
    console.error('Failed to save to history:', err);
    return null;
  }
}

export async function getHistory(limit = 50): Promise<CalculatorHistoryItem[]> {
  const database = await getDb();
  if (!database) {
    return getWebHistory().slice(0, limit);
  }

  try {
    const rows = await database.select<any[]>(
      `SELECT * FROM history ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    
    return rows.map(row => ({
      ...row,
      inputs: JSON.parse(row.inputs),
      outputs: JSON.parse(row.outputs)
    }));
  } catch (err) {
    console.error('Failed to fetch history:', err);
    return [];
  }
}

export async function deleteHistoryItem(id: string) {
  const database = await getDb();
  if (!database) {
    const items = getWebHistory().filter(item => item.id !== id);
    setWebHistory(items);
    return;
  }
  await database.execute('DELETE FROM history WHERE id = ?', [id]);
}

export async function clearHistory() {
  const database = await getDb();
  if (!database) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(WEB_STORAGE_KEY);
    }
    return;
  }
  await database.execute('DELETE FROM history');
}
