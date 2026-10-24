import { loadSave, saveToJson } from '../sim';
import type { GameState, LoadResult } from '../sim';

/** Downloads the game as a JSON save file. */
export function exportSaveFile(state: GameState): void {
  const json = saveToJson(state, new Date().toISOString());
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = state.company.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'company';
  a.href = url;
  a.download = `techtycoon-${safeName}-week${state.week}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSaveFile(file: File): Promise<LoadResult> {
  return loadSave(await file.text());
}
