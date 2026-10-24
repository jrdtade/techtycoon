import 'fake-indexeddb/auto';
import { SAVE_FORMAT, dispatch, loadSave, migrateState, saveToJson, step, stepMany } from '../src/sim';
import { deleteSlot, listSlots, readSlot, writeSlot } from '../src/persistence/saveStore';
import { freshGame } from './helpers';

describe('save format', () => {
  test('a save round-trips and continues identically', () => {
    let s = freshGame(11);
    const r = dispatch(s, { type: 'acceptContract', offerId: s.contractOffers[0]!.id, employeeIds: [s.employees[0]!.id] });
    if (!r.ok) throw new Error(r.error);
    s = stepMany(r.state, 40);
    const loaded = loadSave(saveToJson(s, '2026-01-01T00:00:00.000Z'));
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(loaded.state).toEqual(s);
    expect(JSON.stringify(stepMany(loaded.state, 50))).toBe(JSON.stringify(stepMany(s, 50)));
  });

  test('garbage is rejected with a reason', () => {
    expect(loadSave('not json').ok).toBe(false);
    expect(loadSave({ hello: 1 }).ok).toBe(false);
    expect(loadSave({ format: SAVE_FORMAT, schemaVersion: 99, state: {} })).toMatchObject({ ok: false, error: expect.stringMatching(/newer/) });
    const broken = JSON.parse(saveToJson(freshGame(), 'x'));
    delete broken.state.employees;
    expect(loadSave(broken)).toMatchObject({ ok: false, error: expect.stringMatching(/employees/) });
  });

  test('migrations run in order from the save version to the current one', () => {
    const migrations = {
      1: (s: { v: number[] }) => ({ v: [...s.v, 2] }),
      2: (s: { v: number[] }) => ({ v: [...s.v, 3] }),
    };
    expect(migrateState({ v: [1] }, 1, migrations, 3)).toEqual({ v: [1, 2, 3] });
    expect(migrateState({ v: [1] }, 2, migrations, 3)).toEqual({ v: [1, 3] });
    expect(() => migrateState({}, 1, {}, 2)).toThrow(/No migration/);
  });
});

describe('IndexedDB slots', () => {
  test('write, list, read and delete', async () => {
    const s = step(freshGame(5));
    await writeSlot('slot1', s, new Date('2026-01-01'));
    const slots = await listSlots();
    expect(slots).toEqual([{ slot: 'slot1', companyName: 'Test Co', gameDate: 'Jan 1970, week 2', savedAt: '2026-01-01T00:00:00.000Z' }]);
    const read = await readSlot('slot1');
    expect(read.ok && read.state).toEqual(s);
    await deleteSlot('slot1');
    expect(await listSlots()).toEqual([]);
    expect((await readSlot('slot1')).ok).toBe(false);
  });
});
