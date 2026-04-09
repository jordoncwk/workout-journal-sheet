const DB_NAME = 'workout-journal';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('templates')) {
        const s = db.createObjectStore('templates', { keyPath: 'id' });
        s.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('workouts')) {
        const s = db.createObjectStore('workouts', { keyPath: 'id' });
        s.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(storeName, mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    let result;
    const store = t.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => { result = req.result; };
    req.onerror = () => reject(req.error);
    t.oncomplete = () => resolve(result);
    t.onabort = () => reject(t.error);
    t.onerror = () => reject(t.error);
  }));
}

function getAll(storeName) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, 'readonly');
    const req = t.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

// ── Templates ──

export function saveTemplate(template) {
  return tx('templates', 'readwrite', store => store.put(template));
}

export function getTemplate(id) {
  return tx('templates', 'readonly', store => store.get(id));
}

export function listTemplates() {
  return getAll('templates').then(rows => rows.sort((a, b) => a.name.localeCompare(b.name)));
}

export function deleteTemplate(id) {
  return tx('templates', 'readwrite', store => store.delete(id));
}

// ── Workouts ──

export function saveWorkout(workout) {
  return tx('workouts', 'readwrite', store => store.put(workout));
}

export function getWorkout(id) {
  return tx('workouts', 'readonly', store => store.get(id));
}

export function listWorkouts() {
  return getAll('workouts').then(rows => rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
}

export function deleteWorkout(id) {
  return tx('workouts', 'readwrite', store => store.delete(id));
}

// ── Sync Queue ──

export function addToSyncQueue(entry) {
  return tx('syncQueue', 'readwrite', store => store.put(entry));
}

export function getSyncQueue() {
  return getAll('syncQueue');
}

export function removeFromSyncQueue(id) {
  return tx('syncQueue', 'readwrite', store => store.delete(id));
}
