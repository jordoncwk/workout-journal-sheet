import 'fake-indexeddb/auto';
import {
  saveTemplate, getTemplate, listTemplates, deleteTemplate,
  saveWorkout, getWorkout, listWorkouts, deleteWorkout,
  addToSyncQueue, getSyncQueue, removeFromSyncQueue,
} from '../js/db.js';

const sampleTemplate = {
  id: 'tpl-1',
  name: 'Upper Day',
  updatedAt: 1000,
  exercises: [{ exercise_name: 'Bench Press', default_sets: 4, default_reps: 8, order: 0 }],
};

const sampleWorkout = {
  id: 'wkt-1',
  templateId: 'tpl-1',
  templateName: 'Upper Day',
  startedAt: 1000,
  finishedAt: 2000,
  updatedAt: 2000,
  exercises: [{ exercise_name: 'Bench Press', sets: [{ weight_kg: 80, reps: 8, logged: true }] }],
};

test('saveTemplate then getTemplate returns it', async () => {
  await saveTemplate(sampleTemplate);
  const result = await getTemplate('tpl-1');
  expect(result.name).toBe('Upper Day');
});

test('listTemplates returns all saved templates', async () => {
  const list = await listTemplates();
  expect(list.some(t => t.id === 'tpl-1')).toBe(true);
});

test('deleteTemplate removes it', async () => {
  await deleteTemplate('tpl-1');
  const result = await getTemplate('tpl-1');
  expect(result).toBeUndefined();
});

test('saveWorkout then getWorkout returns it', async () => {
  await saveWorkout(sampleWorkout);
  const result = await getWorkout('wkt-1');
  expect(result.templateName).toBe('Upper Day');
});

test('listWorkouts returns newest first', async () => {
  const older = { ...sampleWorkout, id: 'wkt-0', updatedAt: 500 };
  await saveWorkout(older);
  const list = await listWorkouts();
  expect(list[0].id).toBe('wkt-1');
});

test('deleteWorkout removes it', async () => {
  await deleteWorkout('wkt-1');
  const result = await getWorkout('wkt-1');
  expect(result).toBeUndefined();
});

test('syncQueue: add, get, remove', async () => {
  await addToSyncQueue({ id: 'sync-1', _deleted: false });
  const queue = await getSyncQueue();
  expect(queue.some(e => e.id === 'sync-1')).toBe(true);
  await removeFromSyncQueue('sync-1');
  const after = await getSyncQueue();
  expect(after.some(e => e.id === 'sync-1')).toBe(false);
});
