import { useCallback, useEffect, useRef, useState } from 'react';
import { exportSaveFile, importSaveFile } from '../../persistence/saveFiles';
import { SLOTS, deleteSlot, listSlots, readSlot, writeSlot } from '../../persistence/saveStore';
import type { SlotId, SlotInfo } from '../../persistence/saveStore';
import type { LoadResult } from '../../sim';
import { useGame } from '../store';
import { Modal } from './Modal';

export function SavesModal() {
  const game = useGame((s) => s.game);
  const loadGame = useGame((s) => s.loadGame);
  const showToast = useGame((s) => s.showToast);
  const close = useGame((s) => s.closeModal);
  const [slots, setSlots] = useState<SlotInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    listSlots()
      .then(setSlots)
      .catch(() => setError('Browser storage is unavailable. You can still export and import save files.'));
  }, []);
  useEffect(refresh, [refresh]);

  const applyLoad = (result: LoadResult) => {
    if (!result.ok) {
      setError(result.error);
      return;
    }
    loadGame(result.state);
    showToast(result.migratedFrom ? `Save upgraded from version ${result.migratedFrom}.` : 'Game loaded.');
  };

  const save = async (slot: SlotId) => {
    if (!game) return;
    try {
      await writeSlot(slot, game);
      showToast('Game saved.');
      refresh();
    } catch {
      setError('Saving failed. Try exporting a file instead.');
    }
  };

  const load = async (slot: SlotId) => {
    if (game && game.status === 'playing' && !window.confirm('Load this save? Unsaved progress will be lost.')) return;
    applyLoad(await readSlot(slot));
  };

  const remove = async (slot: SlotId) => {
    if (!window.confirm('Delete this save?')) return;
    await deleteSlot(slot);
    refresh();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) applyLoad(await importSaveFile(file));
  };

  return (
    <Modal
      title="Save / Load"
      onClose={close}
      footer={
        <>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onFile} />
          <button onClick={() => fileInput.current?.click()}>Import file…</button>
          <button disabled={!game} onClick={() => game && exportSaveFile(game)}>
            Export to file
          </button>
          <button className="primary" onClick={close}>
            Close
          </button>
        </>
      }
    >
      {error && <div className="alert">{error}</div>}
      <table className="table">
        <tbody>
          {SLOTS.map(({ id, label }) => {
            const info = slots?.find((s) => s.slot === id);
            return (
              <tr key={id}>
                <td>
                  <strong>{label}</strong>
                  <div className="muted small-text">
                    {info ? `${info.companyName} · ${info.gameDate} · saved ${new Date(info.savedAt).toLocaleString()}` : slots ? 'Empty' : '…'}
                  </div>
                </td>
                <td className="slot-actions">
                  {id !== 'auto' && (
                    <button className="small" disabled={!game} onClick={() => save(id)}>
                      Save here
                    </button>
                  )}
                  <button className="small" disabled={!info} onClick={() => load(id)}>
                    Load
                  </button>
                  <button className="small danger" disabled={!info} onClick={() => remove(id)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted small-text">The game autosaves at the start of every in-game month. Browser storage can be cleared, so export a file for anything you want to keep.</p>
    </Modal>
  );
}
