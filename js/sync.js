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

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = '__gas_' + Date.now();
    const script = document.createElement('script');
    script.src = `${url}&callback=${cb}`;
    window[cb] = (data) => {
      delete window[cb];
      script.remove();
      resolve(data);
    };
    script.onerror = () => {
      delete window[cb];
      script.remove();
      reject(new Error('JSONP failed'));
    };
    document.head.appendChild(script);
  });
}

export async function flushQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getSyncQueue();
  for (const entry of queue) {
    try {
      await fetch(GAS_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(entry),
      });
      // no-cors response is opaque — assume success
      await removeFromSyncQueue(entry.id);
    } catch (_) {
      break; // network failed — retry on next online event
    }
  }
}

export async function pullFromGAS() {
  if (!GAS_URL || !navigator.onLine) return;
  try {
    const { ok, templates: remoteTemplates, workouts: remoteWorkouts } = await jsonp(`${GAS_URL}?action=getAll`);
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
