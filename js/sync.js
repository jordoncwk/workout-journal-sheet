import { GAS_URL } from './config.js';
import {
  getSyncQueue, removeFromSyncQueue,
  saveTemplate, listTemplates,
  saveWorkout, listWorkouts,
} from './db.js';

export async function initSync() {
  window.addEventListener('online', () => {
    pullFromGAS().then(flushQueue);
  });
  if (navigator.onLine && GAS_URL) {
    await pullFromGAS();
    await flushQueue();
  }
}

export async function flushQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getSyncQueue();
  for (const entry of queue) {
    try {
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(entry),
      });
      const result = await resp.json();
      if (result.ok) await removeFromSyncQueue(entry.id);
    } catch (_) {
      break; // network failed — retry on next online event
    }
  }
}

export async function pullFromGAS() {
  if (!GAS_URL || !navigator.onLine) return;
  try {
    const resp = await fetch(`${GAS_URL}?action=getAll`);
    const { ok, templates: remoteTemplates, workouts: remoteWorkouts } = await resp.json();
    if (!ok) return;

    let changed = false;

    // Merge templates
    const localTemplates = await listTemplates();
    const localTplMap = Object.fromEntries(localTemplates.map(t => [t.id, t]));
    for (const t of (remoteTemplates || [])) {
      const local = localTplMap[t.id];
      if (!local || t.updatedAt > local.updatedAt) {
        await saveTemplate(t);
        changed = true;
      }
    }

    // Merge workouts
    const localWorkouts = await listWorkouts();
    const localWktMap = Object.fromEntries(localWorkouts.map(w => [w.id, w]));
    for (const w of (remoteWorkouts || [])) {
      const local = localWktMap[w.id];
      if (!local || w.updatedAt > local.updatedAt) {
        await saveWorkout(w);
        changed = true;
      }
    }

    if (changed) window.dispatchEvent(new CustomEvent('sync-complete'));
  } catch (_) {
    // silent — retry on next load
  }
}
