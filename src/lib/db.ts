'use client';

import Database from '@tauri-apps/plugin-sql';
import { CalculatorHistoryItem } from './types';
import { isTauri } from './tauri-utils';

let db: Database | null = null;

export async function getDb() {
  if (!isTauri()) {
    console.warn('Database access skipped: Not in a Tauri environment.');
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
  const database = await getDb();
  if (!database) return null;

  const id = crypto.randomUUID();
  
  try {
    // Note: Tauri SQL plugin uses ? placeholders for SQLite
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
  if (!database) return [];

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
  if (!database) return;
  await database.execute('DELETE FROM history WHERE id = ?', [id]);
}

export async function clearHistory() {
  const database = await getDb();
  if (!database) return;
  await database.execute('DELETE FROM history');
}
