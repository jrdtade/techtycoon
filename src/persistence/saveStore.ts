import { openDB, type IDBPDatabase } from 'idb';
import { createSave, loadSave } from '../sim';
import type { GameState, LoadResult, SaveFile } from '../sim';

// IndexedDB save slots. Browser-only; the save format itself lives in src/sim/save.ts.

export type SlotId = 'auto' | 'slot1' | 'slot2' | 'slot3';
export const SLOTS: { id: SlotId; label: string }[] = [
  { id: 'auto', label: 'Autosave' },
  { id: 'slot1', label: 'Slot 1' },
  { id: 'slot2', label: 'Slot 2' },
  { id: 'slot3', label: 'Slot 3' },
];

interface SaveRecord {
  slot: SlotId;
  file: SaveFile;
}

export interface SlotInfo {
  slot: SlotId;
  companyName: string;
  gameDate: string;
  savedAt: string;
}

const DB_NAME = 'techtycoon';
const STORE = 'saves';
let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> {
  dbPromise ??= openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: 'slot' });
    },
  });
  return dbPromise;
}

export async function writeSlot(slot: SlotId, state: GameState, now = new Date()): Promise<void> {
  const record: SaveRecord = { slot, file: createSave(state, now.toISOString()) };
  await (await db()).put(STORE, record);
}

export async function readSlot(slot: SlotId): Promise<LoadResult> {
  const record = (await (await db()).get(STORE, slot)) as SaveRecord | undefined;
  if (!record) return { ok: false, error: 'That slot is empty.' };
  return loadSave(record.file);
}

export async function deleteSlot(slot: SlotId): Promise<void> {
  await (await db()).delete(STORE, slot);
}

export async function listSlots(): Promise<SlotInfo[]> {
  const records = (await (await db()).getAll(STORE)) as SaveRecord[];
  return records.map((r) => ({ slot: r.slot, companyName: r.file.companyName, gameDate: r.file.gameDate, savedAt: r.file.savedAt }));
}
