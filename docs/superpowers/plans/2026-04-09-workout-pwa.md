# Workout Journal PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the GAS-embedded workout journal into a standalone PWA on GitHub Pages, matching the Mandarin journal's tech stack.

**Architecture:** Vanilla ES modules + hash router + IndexedDB (offline-first) served from GitHub Pages. GAS becomes a pure JSON API (`doGet`/`doPost`). Sync mirrors the Mandarin journal pattern: pull on load, write-through queue, flush on online.

**Tech Stack:** HTML/CSS/JS (no bundler), IndexedDB, Service Worker, Google Apps Script Web App, GitHub Pages, Jest + fake-indexeddb for tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `index.html` | Create | PWA shell — `<div id="app">`, meta tags, manifest link |
| `manifest.json` | Create | PWA manifest — name, icons, theme, standalone |
| `sw.js` | Create | Service worker — cache shell, skip GAS calls |
| `css/styles.css` | Create | All styles — dark theme, bottom nav, cards, forms |
| `js/config.js` | Create | `GAS_URL` export |
| `js/router.js` | Create | Hash router — `register`, `navigate`, `start` |
| `js/db.js` | Create | IndexedDB — templates, workouts, syncQueue |
| `js/sync.js` | Create | Pull from GAS, flush write queue |
| `js/app.js` | Create | Entry point — register routes, init sync, start router |
| `js/home.js` | Create | Home screen — template picker, free-form start |
| `js/workout.js` | Create | Active workout — set logging, rest timer, finish/discard |
| `js/templates.js` | Create | Templates list |
| `js/template-edit.js` | Create | Create/edit template and exercises |
| `js/history.js` | Create | Past workouts list |
| `js/history-detail.js` | Create | Single workout breakdown |
| `js/progress.js` | Create | PRs table + stats card |
| `gas/Code.gs` | Rewrite | JSON API router — `doGet`/`doPost` |
| `gas/Database.gs` | Move | Unchanged — keep all `db_*` functions |
| `gas/History.gs` | Move | Unchanged |
| `gas/Templates.gs` | Move | Unchanged |
| `gas/Workout.gs` | Move | Keep `finishWorkout` helper logic for reference |
| `gas/Progress.gs` | Move | Unchanged |
| `gas/Setup.gs` | Move | Unchanged |
| `gas/Tests.gs` | Move | Unchanged |
| `gas/appsscript.json` | Move | Unchanged |
| `tests/db.test.js` | Create | Jest tests for IndexedDB layer |
| `package.json` | Create | Jest config + fake-indexeddb |
| `Index.html` | Delete | No longer used |
| `WorkoutDialog.html` | Delete | No longer used |
| `HistoryDialog.html` | Delete | No longer used |
| `TemplatesDialog.html` | Delete | No longer used |

---

## Task 1: Reorganize repo — move GAS files to `gas/`

**Files:**
- Move: `Code.gs` → `gas/Code.gs`
- Move: `Database.gs` → `gas/Database.gs`
- Move: `History.gs` → `gas/History.gs`
- Move: `Progress.gs` → `gas/Progress.gs`
- Move: `Setup.gs` → `gas/Setup.gs`
- Move: `Templates.gs` → `gas/Templates.gs`
- Move: `Tests.gs` → `gas/Tests.gs`
- Move: `Workout.gs` → `gas/Workout.gs`
- Move: `appsscript.json` → `gas/appsscript.json`
- Delete: `Index.html`, `WorkoutDialog.html`, `HistoryDialog.html`, `TemplatesDialog.html`

- [ ] **Step 1: Create `gas/` folder and move files**

```bash
mkdir -p gas
mv Code.gs Database.gs History.gs Progress.gs Setup.gs Templates.gs Tests.gs Workout.gs appsscript.json gas/
```

- [ ] **Step 2: Delete old HTML dialogs**

```bash
rm Index.html WorkoutDialog.html HistoryDialog.html TemplatesDialog.html
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: move GAS files to gas/ subfolder, remove embedded HTML dialogs"
```

---

## Task 2: Set up test infrastructure

**Files:**
- Create: `package.json`
- Create: `tests/db.test.js` (placeholder — filled in Task 4)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "workout-journal",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
  },
  "devDependencies": {
    "fake-indexeddb": "^4.0.2",
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Create `tests/` directory with a placeholder test**

Create `tests/db.test.js`:
```js
test('placeholder', () => expect(1).toBe(1));
```

- [ ] **Step 4: Run tests to confirm setup**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 5: Add `.gitignore` entry for `node_modules`**

Create or append to `.gitignore`:
```
node_modules/
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tests/db.test.js .gitignore
git commit -m "chore: add Jest + fake-indexeddb test infrastructure"
```

---

## Task 3: Create `js/config.js` and `js/router.js`

**Files:**
- Create: `js/config.js`
- Create: `js/router.js`

- [ ] **Step 1: Create `js/config.js`**

```js
// Replace with your deployed GAS web app URL after Task 13
export const GAS_URL = '';
```

- [ ] **Step 2: Create `js/router.js`** (copied directly from Mandarin journal pattern)

```js
const routes = {};

export function register(hash, fn) {
  routes[hash] = fn;
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function start() {
  const render = () => {
    const raw = window.location.hash || '#home';
    const qIdx = raw.indexOf('?');
    const path = qIdx === -1 ? raw : raw.slice(0, qIdx);
    const search = qIdx === -1 ? '' : raw.slice(qIdx + 1);
    const fn = routes[path] || routes['#home'];
    const container = document.getElementById('app');
    container.innerHTML = '';
    if (fn) fn(container, new URLSearchParams(search));
  };
  window.addEventListener('hashchange', render);
  render();
}
```

- [ ] **Step 3: Commit**

```bash
git add js/config.js js/router.js
git commit -m "feat: add config and hash router"
```

---

## Task 4: Create `js/db.js` and tests

**Files:**
- Create: `js/db.js`
- Modify: `tests/db.test.js`

- [ ] **Step 1: Write failing tests in `tests/db.test.js`**

```js
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — `Cannot find module '../js/db.js'`

- [ ] **Step 3: Create `js/db.js`**

```js
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
    const store = t.objectStore(storeName);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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
  return getAll('workouts').then(rows => rows.sort((a, b) => b.updatedAt - a.updatedAt));
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: `7 passed`.

- [ ] **Step 5: Commit**

```bash
git add js/db.js tests/db.test.js
git commit -m "feat: add IndexedDB layer with tests (templates, workouts, syncQueue)"
```

---

## Task 5: Create `js/sync.js`

**Files:**
- Create: `js/sync.js`

- [ ] **Step 1: Create `js/sync.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add js/sync.js
git commit -m "feat: add sync layer (pull from GAS, flush write queue)"
```

---

## Task 6: Create `index.html`, `manifest.json`, and `sw.js`

**Files:**
- Create: `index.html`
- Create: `manifest.json`
- Create: `sw.js`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="theme-color" content="#0f0f0f">
  <title>Workout Journal</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app"><p style="color:#888;padding:2rem">Loading...</p></div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `manifest.json`**

```json
{
  "name": "Workout Journal",
  "short_name": "Workout",
  "description": "Personal workout tracking journal",
  "start_url": "/workoutjournalsheet/",
  "id": "/workoutjournalsheet/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "orientation": "portrait",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: Create `sw.js`**

```js
const CACHE = 'workout-journal-v1';
const BASE = '/workoutjournalsheet';

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/css/styles.css',
  BASE + '/js/app.js',
  BASE + '/js/router.js',
  BASE + '/js/db.js',
  BASE + '/js/sync.js',
  BASE + '/js/config.js',
  BASE + '/js/home.js',
  BASE + '/js/workout.js',
  BASE + '/js/templates.js',
  BASE + '/js/template-edit.js',
  BASE + '/js/history.js',
  BASE + '/js/history-detail.js',
  BASE + '/js/progress.js',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Never cache GAS API calls
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

- [ ] **Step 4: Add icons — copy from Mandarin journal or create placeholders**

```bash
mkdir -p icons
cp ../mandarin-journal/icons/icon-192.png icons/icon-192.png
cp ../mandarin-journal/icons/icon-512.png icons/icon-512.png
```

If the Mandarin journal icons aren't accessible, create placeholder PNGs with any image editor and place them at `icons/icon-192.png` and `icons/icon-512.png`.

- [ ] **Step 5: Commit**

```bash
git add index.html manifest.json sw.js icons/
git commit -m "feat: add PWA shell (index.html, manifest, service worker, icons)"
```

---

## Task 7: Create `css/styles.css`

**Files:**
- Create: `css/styles.css`

- [ ] **Step 1: Create `css/styles.css`**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface2: #242424;
  --accent: #00bcd4;
  --text: #e0e0e0;
  --text-muted: #888;
  --danger: #cf6679;
  --success: #0d9488;
}

html, body { height: 100%; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 17px;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom);
}

#app { min-height: 100vh; padding-bottom: calc(72px + env(safe-area-inset-bottom)); }

/* ── Bottom nav ── */
.bottom-nav {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 480px;
  background: rgba(15,15,15,0.97);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-top: 1px solid var(--surface2);
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}
.nav-btn {
  flex: 1; border: none; background: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; padding: 10px 0 8px;
  font-size: 11px; font-weight: 500; color: var(--text-muted); letter-spacing: 0.2px;
}
.nav-btn .nav-icon { font-size: 26px; line-height: 1; }
.nav-btn.active { color: var(--accent); }

/* ── Screen header ── */
.screen-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  position: sticky; top: 0; z-index: 10;
  border-bottom: 1px solid var(--surface2);
  padding-top: calc(16px + env(safe-area-inset-top));
}
.screen-header h1 { font-size: 1.2rem; font-weight: 700; flex: 1; }
.back-btn, .icon-btn {
  background: none; border: none; color: var(--accent);
  font-size: 1rem; cursor: pointer; padding: 4px 8px;
}

/* ── Cards ── */
.card {
  background: var(--surface); border-radius: 14px;
  margin: 12px; padding: 16px;
  border: 1px solid var(--surface2);
  box-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

/* ── Buttons ── */
.btn {
  padding: 14px 20px; border: none; border-radius: 12px;
  font-size: 16px; font-weight: 600; cursor: pointer; min-height: 50px;
}
.btn-primary { background: var(--accent); color: #000; }
.btn-danger { background: var(--danger); color: #fff; }
.btn-ghost { background: transparent; color: var(--accent); border: 1.5px solid var(--accent); }
.btn-sm { padding: 8px 14px; font-size: 14px; min-height: 36px; border-radius: 8px; }
.btn-full { width: 100%; margin-top: 10px; display: block; }

/* ── Inputs ── */
input[type="text"], input[type="number"], select {
  width: 100%; padding: 14px; font-size: 16px;
  border: 1.5px solid var(--surface2); border-radius: 10px;
  background: var(--surface); color: var(--text);
  -webkit-appearance: none; appearance: none;
}
input:focus, select:focus { outline: none; border-color: var(--accent); }
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px;
}

/* ── Empty / loading states ── */
.empty { text-align: center; padding: 80px 20px; color: var(--text-muted); font-size: 16px; line-height: 1.6; }
.loading { text-align: center; padding: 80px 20px; color: var(--text-muted); font-size: 16px; }

/* ── Home screen ── */
.home-header { padding: 20px 16px 12px; }
.home-header h1 { font-size: 1.4rem; font-weight: 700; }
.template-card {
  background: var(--surface); border-radius: 14px;
  margin: 8px 12px; padding: 16px;
  border: 1px solid var(--surface2); cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: background 0.15s;
}
.template-card:active { background: var(--surface2); }
.template-card-name { font-size: 1rem; font-weight: 600; }
.template-card-sub { font-size: 0.82rem; color: var(--text-muted); margin-top: 3px; }

/* ── Active workout ── */
.ex-card {
  background: var(--surface); border-radius: 14px;
  margin: 10px 12px; overflow: hidden;
  border: 1px solid var(--surface2);
}
.ex-card-header { padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
.ex-card-name { font-size: 1rem; font-weight: 600; flex: 1; }
.best-badge {
  font-size: 0.75rem; color: var(--text-muted);
  background: var(--surface2); border-radius: 8px; padding: 3px 8px;
}
.set-row {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-top: 1px solid var(--surface2);
}
.set-num { font-size: 0.82rem; color: var(--text-muted); width: 32px; }
.set-input { flex: 1; padding: 10px; font-size: 15px; text-align: center; }
.set-log-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
  background: var(--surface2); color: var(--text-muted); font-size: 18px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.set-log-btn.logged { background: var(--accent); color: #000; }
.timer-badge {
  font-size: 15px; font-variant-numeric: tabular-nums;
  background: rgba(0,188,212,0.15); color: var(--accent);
  padding: 4px 12px; border-radius: 16px; font-weight: 600;
  border: 1px solid rgba(0,188,212,0.25);
}

/* ── History ── */
.history-card {
  background: var(--surface); border-radius: 14px;
  margin: 8px 12px; overflow: hidden;
  border: 1px solid var(--surface2); cursor: pointer;
  transition: background 0.15s;
}
.history-card:active { background: var(--surface2); }
.history-card-header { padding: 14px 16px; display: flex; align-items: center; }
.history-card-name { font-size: 1rem; font-weight: 600; flex: 1; }
.history-card-meta { font-size: 0.82rem; color: var(--text-muted); margin-top: 3px; }

/* ── History detail ── */
.ex-group { margin-bottom: 14px; }
.ex-group-name { font-size: 0.95rem; font-weight: 600; margin-bottom: 6px; }
.set-line { font-size: 0.88rem; color: var(--text-muted); padding: 2px 0; }

/* ── Templates ── */
.template-list-card {
  background: var(--surface); border-radius: 14px;
  margin: 8px 12px; padding: 16px;
  border: 1px solid var(--surface2); cursor: pointer;
  display: flex; align-items: center; justify-content: space-between;
  transition: background 0.15s;
}
.template-list-card:active { background: var(--surface2); }
.fab {
  position: fixed; bottom: calc(80px + env(safe-area-inset-bottom)); right: 20px;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--accent); color: #000; font-size: 28px;
  border: none; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,188,212,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 50;
}

/* ── Template edit ── */
.exercise-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 0; border-bottom: 1px solid var(--surface2);
}
.exercise-row:last-child { border-bottom: none; }
.exercise-name-input { flex: 1; }
.num-input { width: 56px; text-align: center; padding: 10px 4px; }
.label-sm { font-size: 11px; color: var(--text-muted); text-align: center; margin-bottom: 3px; }

/* ── Progress ── */
.stats-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px; margin-bottom: 16px;
}
.stat-cell {
  background: var(--surface2); border-radius: 10px;
  padding: 12px; text-align: center;
}
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--accent); }
.stat-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; }
.pr-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid var(--surface2);
}
.pr-row:last-child { border-bottom: none; }
.pr-name { font-size: 0.95rem; flex: 1; }
.pr-value { font-size: 0.95rem; font-weight: 600; color: var(--accent); }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: add CSS styles (dark theme, bottom nav, cards, forms)"
```

---

## Task 8: Create `js/app.js` and bottom nav shell

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Create `js/app.js`**

```js
import { start as startRouter, register, navigate } from './router.js';
import { renderHome } from './home.js';
import { renderWorkout } from './workout.js';
import { renderTemplates } from './templates.js';
import { renderTemplateEdit } from './template-edit.js';
import { renderHistory } from './history.js';
import { renderHistoryDetail } from './history-detail.js';
import { renderProgress } from './progress.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/workoutjournalsheet/sw.js').catch(() => {});
}

register('#home', renderHome);
register('#workout', renderWorkout);
register('#templates', renderTemplates);
register('#template-edit', renderTemplateEdit);
register('#history', renderHistory);
register('#history-detail', renderHistoryDetail);
register('#progress', renderProgress);

initSync();

// Inject bottom nav into body once
function renderNav() {
  const existing = document.getElementById('bottom-nav');
  if (existing) existing.remove();
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.id = 'bottom-nav';
  const hash = window.location.hash || '#home';
  const tabs = [
    { hash: '#home',      icon: '🏠', label: 'Home' },
    { hash: '#history',   icon: '📋', label: 'History' },
    { hash: '#templates', icon: '📁', label: 'Templates' },
    { hash: '#progress',  icon: '📈', label: 'Progress' },
  ];
  nav.innerHTML = tabs.map(t => `
    <button class="nav-btn ${hash.startsWith(t.hash) ? 'active' : ''}" onclick="location.hash='${t.hash}'">
      <span class="nav-icon">${t.icon}</span>${t.label}
    </button>
  `).join('');
  document.body.appendChild(nav);
}

window.addEventListener('hashchange', renderNav);
renderNav();

startRouter();
```

- [ ] **Step 2: Create stub screen files so app.js imports resolve**

Create `js/home.js`:
```js
export function renderHome(container) {
  container.innerHTML = '<div class="loading">Home coming soon</div>';
}
```

Create `js/workout.js`:
```js
export function renderWorkout(container) {
  container.innerHTML = '<div class="loading">Workout coming soon</div>';
}
```

Create `js/templates.js`:
```js
export function renderTemplates(container) {
  container.innerHTML = '<div class="loading">Templates coming soon</div>';
}
```

Create `js/template-edit.js`:
```js
export function renderTemplateEdit(container) {
  container.innerHTML = '<div class="loading">Template edit coming soon</div>';
}
```

Create `js/history.js`:
```js
export function renderHistory(container) {
  container.innerHTML = '<div class="loading">History coming soon</div>';
}
```

Create `js/history-detail.js`:
```js
export function renderHistoryDetail(container) {
  container.innerHTML = '<div class="loading">History detail coming soon</div>';
}
```

Create `js/progress.js`:
```js
export function renderProgress(container) {
  container.innerHTML = '<div class="loading">Progress coming soon</div>';
}
```

- [ ] **Step 3: Commit**

```bash
git add js/app.js js/home.js js/workout.js js/templates.js js/template-edit.js js/history.js js/history-detail.js js/progress.js
git commit -m "feat: add app entry point, bottom nav, stub screens"
```

---

## Task 9: Implement `js/home.js`

**Files:**
- Modify: `js/home.js`

The home screen shows a template list. Tapping one starts a workout. A "Free-form" button starts without a template. If there's already an active workout in `localStorage`, show a "Resume Workout" banner instead.

- [ ] **Step 1: Implement `js/home.js`**

```js
import { listTemplates } from './db.js';
import { navigate } from './router.js';

export async function renderHome(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';

  const active = getActiveWorkout();
  const templates = await listTemplates();

  let html = `<div class="screen-header"><h1>Workout Journal</h1></div>`;

  if (active) {
    html += `
      <div class="card" style="margin:12px; background: rgba(0,188,212,0.08); border-color: rgba(0,188,212,0.3);">
        <div style="font-weight:600; margin-bottom:6px;">Workout in progress</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">${active.templateName || 'Free-form'}</div>
        <button class="btn btn-primary btn-full" onclick="location.hash='#workout'">Resume</button>
      </div>`;
  }

  html += `<div style="padding: 8px 12px 4px; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Start a workout</div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Add one in Templates.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <div>
          <div class="template-card-name">${t.name}</div>
          <div class="template-card-sub">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `
    <div style="padding:12px;">
      <button class="btn btn-ghost btn-full" id="freeform-btn">+ Free-form workout</button>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const t = templates.find(t => t.id === id);
      startWorkout(t);
    });
  });

  container.querySelector('#freeform-btn').addEventListener('click', () => {
    startWorkout(null);
  });

  window.addEventListener('sync-complete', () => renderHome(container), { once: true });
}

function getActiveWorkout() {
  try { return JSON.parse(localStorage.getItem('activeWorkout')); } catch { return null; }
}

function startWorkout(template) {
  const state = {
    templateId: template ? template.id : null,
    templateName: template ? template.name : 'Free-form',
    startedAt: Date.now(),
    exercises: template
      ? template.exercises.map(ex => ({
          exercise_name: ex.exercise_name,
          sets: Array.from({ length: ex.default_sets }, () => ({ weight_kg: '', reps: '', logged: false }))
        }))
      : [],
    currentExerciseIndex: 0,
  };
  localStorage.setItem('activeWorkout', JSON.stringify(state));
  navigate('#workout');
}
```

- [ ] **Step 2: Commit**

```bash
git add js/home.js
git commit -m "feat: implement home screen (template picker, free-form start, resume banner)"
```

---

## Task 10: Implement `js/workout.js`

**Files:**
- Modify: `js/workout.js`

Active workout screen: shows exercises with set rows (weight + reps inputs, log toggle). Rest timer starts when a set is logged. Finish and discard buttons. Exercise navigation (prev/next). On finish: write to IndexedDB + syncQueue, clear localStorage.

- [ ] **Step 1: Implement `js/workout.js`**

```js
import { saveWorkout, addToSyncQueue, listWorkouts } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

let timerInterval = null;

export function renderWorkout(container) {
  const state = getState();
  if (!state) { navigate('#home'); return; }

  stopTimer();
  render(container, state);
}

function getState() {
  try { return JSON.parse(localStorage.getItem('activeWorkout')); } catch { return null; }
}

function saveState(state) {
  localStorage.setItem('activeWorkout', JSON.stringify(state));
}

function render(container, state) {
  const elapsed = formatDuration(Date.now() - state.startedAt);

  let html = `
    <div class="screen-header">
      <button class="back-btn" id="discard-btn">✕</button>
      <h1>${state.templateName || 'Free-form'}</h1>
      <span class="timer-badge" id="workout-timer">${elapsed}</span>
    </div>`;

  // Add exercise button (free-form)
  html += `<div style="padding:8px 12px 0; display:flex; gap:8px; flex-wrap:wrap;">
    <button class="btn btn-ghost btn-sm" id="add-ex-btn">+ Add exercise</button>
  </div>`;

  state.exercises.forEach((ex, ei) => {
    html += `
      <div class="ex-card" data-ei="${ei}">
        <div class="ex-card-header">
          <span class="ex-card-name">${ex.exercise_name}</span>
          <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
        </div>`;
    ex.sets.forEach((s, si) => {
      html += `
        <div class="set-row" data-ei="${ei}" data-si="${si}">
          <span class="set-num">${si + 1}</span>
          <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight_kg}" data-field="weight_kg" data-ei="${ei}" data-si="${si}">
          <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-field="reps" data-ei="${ei}" data-si="${si}">
          <button class="set-log-btn ${s.logged ? 'logged' : ''}" data-ei="${ei}" data-si="${si}">✓</button>
        </div>`;
    });
    html += `</div>`;
  });

  html += `
    <div style="padding:16px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-primary btn-full" id="finish-btn">Finish Workout</button>
    </div>`;

  // Rest timer display
  html += `<div id="rest-timer" style="display:none; text-align:center; padding:12px; font-size:1rem; color:var(--accent);"></div>`;

  container.innerHTML = html;

  // Elapsed workout timer
  stopTimer();
  timerInterval = setInterval(() => {
    const el = document.getElementById('workout-timer');
    if (el) el.textContent = formatDuration(Date.now() - state.startedAt);
  }, 1000);

  // Input changes
  container.querySelectorAll('input.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const ei = +input.dataset.ei, si = +input.dataset.si, field = input.dataset.field;
      state.exercises[ei].sets[si][field] = input.value;
      saveState(state);
    });
  });

  // Log set toggle
  container.querySelectorAll('.set-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei, si = +btn.dataset.si;
      const s = state.exercises[ei].sets[si];
      s.logged = !s.logged;
      saveState(state);
      btn.classList.toggle('logged', s.logged);
      if (s.logged) startRestTimer(container);
    });
  });

  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei;
      state.exercises[ei].sets.push({ weight_kg: '', reps: '', logged: false });
      saveState(state);
      render(container, state);
    });
  });

  // Add exercise (free-form)
  container.querySelector('#add-ex-btn').addEventListener('click', () => {
    const name = prompt('Exercise name:');
    if (!name || !name.trim()) return;
    state.exercises.push({ exercise_name: name.trim(), sets: [{ weight_kg: '', reps: '', logged: false }] });
    saveState(state);
    render(container, state);
  });

  // Discard
  container.querySelector('#discard-btn').addEventListener('click', () => {
    if (!confirm('Discard this workout?')) return;
    stopTimer();
    localStorage.removeItem('activeWorkout');
    navigate('#home');
  });

  // Finish
  container.querySelector('#finish-btn').addEventListener('click', () => finishWorkout(state));
}

function startRestTimer(container) {
  const REST_SECONDS = 90;
  let remaining = REST_SECONDS;
  const el = document.getElementById('rest-timer');
  if (!el) return;
  el.style.display = 'block';

  clearInterval(window._restInterval);
  window._restInterval = setInterval(() => {
    remaining--;
    const restEl = document.getElementById('rest-timer');
    if (!restEl) { clearInterval(window._restInterval); return; }
    if (remaining <= 0) {
      clearInterval(window._restInterval);
      restEl.style.display = 'none';
    } else {
      restEl.textContent = `Rest: ${remaining}s`;
    }
  }, 1000);
  el.textContent = `Rest: ${remaining}s`;
}

async function finishWorkout(state) {
  stopTimer();
  const finishedAt = Date.now();
  const id = crypto.randomUUID();
  const workout = {
    id,
    templateId: state.templateId || null,
    templateName: state.templateName || 'Free-form',
    startedAt: state.startedAt,
    finishedAt,
    updatedAt: finishedAt,
    exercises: state.exercises.map(ex => ({
      exercise_name: ex.exercise_name,
      sets: ex.sets.filter(s => s.logged && s.weight_kg !== '' && s.reps !== '').map(s => ({
        weight_kg: parseFloat(s.weight_kg) || 0,
        reps: parseInt(s.reps) || 0,
        logged: true,
      })),
    })).filter(ex => ex.sets.length > 0),
  };

  await saveWorkout(workout);
  await addToSyncQueue({ action: 'upsertWorkout', workout });
  await flushQueue();

  localStorage.removeItem('activeWorkout');
  navigate('#history');
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  clearInterval(window._restInterval);
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add js/workout.js
git commit -m "feat: implement active workout screen (set logging, rest timer, finish/discard)"
```

---

## Task 11: Implement `js/history.js` and `js/history-detail.js`

**Files:**
- Modify: `js/history.js`
- Modify: `js/history-detail.js`

- [ ] **Step 1: Implement `js/history.js`**

```js
import { listWorkouts, deleteWorkout, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

export async function renderHistory(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const workouts = await listWorkouts();

  let html = `<div class="screen-header"><h1>History</h1></div>`;

  if (workouts.length === 0) {
    html += `<div class="empty">No workouts yet.<br>Complete your first workout to see history.</div>`;
  } else {
    html += workouts.map(w => {
      const date = formatDate(w.startedAt);
      const duration = formatDuration(w.finishedAt - w.startedAt);
      const setCount = w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      return `
        <div class="history-card" data-id="${w.id}">
          <div class="history-card-header">
            <div style="flex:1">
              <div class="history-card-name">${w.templateName}</div>
              <div class="history-card-meta">${date} · ${duration} · ${setCount} set${setCount !== 1 ? 's' : ''}</div>
            </div>
            <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
          </div>
        </div>`;
    }).join('');
  }

  container.innerHTML = html;

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#history-detail?id=${card.dataset.id}`));
  });

  window.addEventListener('sync-complete', () => renderHistory(container), { once: true });
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
```

- [ ] **Step 2: Implement `js/history-detail.js`**

```js
import { getWorkout, deleteWorkout, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

export async function renderHistoryDetail(container, params) {
  const id = params.get('id');
  container.innerHTML = '<div class="loading">Loading...</div>';
  const w = await getWorkout(id);

  if (!w) {
    container.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" onclick="history.back()">‹</button>
        <h1>Not found</h1>
      </div>
      <div class="empty">Workout not found.</div>`;
    return;
  }

  const date = new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const duration = formatDuration(w.finishedAt - w.startedAt);

  let html = `
    <div class="screen-header">
      <button class="back-btn" id="back-btn">‹</button>
      <h1>${w.templateName}</h1>
    </div>
    <div class="card">
      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">${date} · ${duration}</div>`;

  w.exercises.forEach(ex => {
    html += `
      <div class="ex-group">
        <div class="ex-group-name">${ex.exercise_name}</div>
        ${ex.sets.map((s, i) => `<div class="set-line">Set ${i + 1}: ${s.weight_kg} kg × ${s.reps} reps</div>`).join('')}
      </div>`;
  });

  html += `</div>
    <div style="padding:0 12px;">
      <button class="btn btn-danger btn-full" id="delete-btn">Delete Workout</button>
    </div>`;

  container.innerHTML = html;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('#history'));

  container.querySelector('#delete-btn').addEventListener('click', async () => {
    if (!confirm('Delete this workout?')) return;
    await deleteWorkout(id);
    await addToSyncQueue({ action: 'deleteWorkout', id });
    await flushQueue();
    navigate('#history');
  });
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
```

- [ ] **Step 3: Commit**

```bash
git add js/history.js js/history-detail.js
git commit -m "feat: implement history list and workout detail screens"
```

---

## Task 12: Implement `js/templates.js` and `js/template-edit.js`

**Files:**
- Modify: `js/templates.js`
- Modify: `js/template-edit.js`

- [ ] **Step 1: Implement `js/templates.js`**

```js
import { listTemplates } from './db.js';
import { navigate } from './router.js';

export async function renderTemplates(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const templates = await listTemplates();

  let html = `<div class="screen-header"><h1>Templates</h1></div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Tap + to create one.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-list-card" data-id="${t.id}">
        <div>
          <div style="font-weight:600;">${t.name}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `<button class="fab" id="new-btn">+</button>`;
  container.innerHTML = html;

  container.querySelectorAll('.template-list-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#template-edit?id=${card.dataset.id}`));
  });

  container.querySelector('#new-btn').addEventListener('click', () => navigate('#template-edit'));

  window.addEventListener('sync-complete', () => renderTemplates(container), { once: true });
}
```

- [ ] **Step 2: Implement `js/template-edit.js`**

```js
import { getTemplate, saveTemplate, deleteTemplate, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

export async function renderTemplateEdit(container, params) {
  const id = params.get('id');
  let template = id ? await getTemplate(id) : null;

  let exercises = template
    ? template.exercises.map(e => ({ ...e }))
    : [];

  function render() {
    let html = `
      <div class="screen-header">
        <button class="back-btn" id="back-btn">‹</button>
        <h1>${template ? 'Edit Template' : 'New Template'}</h1>
        <button class="icon-btn" id="save-btn">Save</button>
      </div>
      <div style="padding:12px;">
        <input type="text" id="tpl-name" placeholder="Template name (e.g. Upper Day)" value="${template ? template.name : ''}">
        <div class="card" style="margin-top:12px;">
          <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Exercises</div>
          <div id="exercises-list">`;

    exercises.forEach((ex, i) => {
      html += `
        <div class="exercise-row">
          <input class="exercise-name-input" type="text" placeholder="Exercise name" value="${ex.exercise_name}" data-i="${i}">
          <div>
            <div class="label-sm">Sets</div>
            <input class="num-input" type="number" min="1" value="${ex.default_sets}" data-field="default_sets" data-i="${i}">
          </div>
          <div>
            <div class="label-sm">Reps</div>
            <input class="num-input" type="number" min="1" value="${ex.default_reps}" data-field="default_reps" data-i="${i}">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${i > 0 ? `<button class="btn btn-ghost btn-sm move-btn" data-i="${i}" data-dir="-1">↑</button>` : '<div style="height:34px"></div>'}
            ${i < exercises.length - 1 ? `<button class="btn btn-ghost btn-sm move-btn" data-i="${i}" data-dir="1">↓</button>` : '<div style="height:34px"></div>'}
          </div>
          <button class="btn btn-danger btn-sm remove-btn" data-i="${i}">✕</button>
        </div>`;
    });

    html += `
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="text" id="new-ex-input" placeholder="Add exercise name...">
            <button class="btn btn-primary btn-sm" id="add-ex-btn">Add</button>
          </div>
        </div>`;

    if (template) {
      html += `<button class="btn btn-danger btn-full" id="delete-btn">Delete Template</button>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    container.querySelector('#back-btn').addEventListener('click', () => navigate('#templates'));

    // Exercise name inputs
    container.querySelectorAll('.exercise-name-input').forEach(input => {
      input.addEventListener('input', () => {
        exercises[+input.dataset.i].exercise_name = input.value;
      });
    });

    // Sets/reps inputs
    container.querySelectorAll('input.num-input').forEach(input => {
      input.addEventListener('input', () => {
        exercises[+input.dataset.i][input.dataset.field] = parseInt(input.value) || 1;
      });
    });

    // Move up/down
    container.querySelectorAll('.move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.i, dir = +btn.dataset.dir, j = i + dir;
        [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
        render();
      });
    });

    // Remove exercise
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        exercises.splice(+btn.dataset.i, 1);
        render();
      });
    });

    // Add exercise
    container.querySelector('#add-ex-btn').addEventListener('click', addExercise);
    container.querySelector('#new-ex-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') addExercise();
    });

    function addExercise() {
      const input = container.querySelector('#new-ex-input');
      const name = input.value.trim();
      if (!name) return;
      exercises.push({ exercise_name: name, default_sets: 3, default_reps: 8, order: exercises.length });
      input.value = '';
      render();
    }

    // Save
    container.querySelector('#save-btn').addEventListener('click', async () => {
      const name = container.querySelector('#tpl-name').value.trim();
      if (!name) { alert('Enter a template name.'); return; }
      const now = Date.now();
      const tpl = {
        id: template ? template.id : crypto.randomUUID(),
        name,
        updatedAt: now,
        exercises: exercises.map((e, i) => ({ ...e, order: i })),
      };
      await saveTemplate(tpl);
      await addToSyncQueue({ action: 'upsertTemplate', template: tpl });
      await flushQueue();
      navigate('#templates');
    });

    // Delete
    const deleteBtn = container.querySelector('#delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this template?')) return;
        await deleteTemplate(template.id);
        await addToSyncQueue({ action: 'deleteTemplate', id: template.id });
        await flushQueue();
        navigate('#templates');
      });
    }
  }

  render();
}
```

- [ ] **Step 3: Commit**

```bash
git add js/templates.js js/template-edit.js
git commit -m "feat: implement templates list and create/edit template screens"
```

---

## Task 13: Implement `js/progress.js`

**Files:**
- Modify: `js/progress.js`

- [ ] **Step 1: Implement `js/progress.js`**

```js
import { listWorkouts } from './db.js';

export async function renderProgress(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const workouts = await listWorkouts();

  const now = Date.now();
  const nowDate = new Date();
  const daysSinceMonday = (nowDate.getDay() + 6) % 7;
  const weekStart = new Date(nowDate);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();

  const total = workouts.length;
  const thisWeek = workouts.filter(w => w.startedAt >= weekStart.getTime()).length;
  const thisMonth = workouts.filter(w => w.startedAt >= monthStart).length;

  let lastWorkout = '—';
  if (workouts.length > 0) {
    const maxFinished = Math.max(...workouts.map(w => w.finishedAt));
    const diffDays = Math.floor((now - maxFinished) / 86400000);
    if (diffDays === 0) lastWorkout = 'Today';
    else if (diffDays === 1) lastWorkout = 'Yesterday';
    else lastWorkout = `${diffDays}d ago`;
  }

  // PRs: per exercise, highest weight × most reps at that weight
  const exerciseSets = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      if (!exerciseSets[ex.exercise_name]) exerciseSets[ex.exercise_name] = [];
      ex.sets.forEach(s => exerciseSets[ex.exercise_name].push(s));
    });
  });

  const prs = Object.entries(exerciseSets).map(([name, sets]) => {
    const bestWeight = Math.max(...sets.map(s => s.weight_kg));
    const bestSet = sets.filter(s => s.weight_kg === bestWeight).sort((a, b) => b.reps - a.reps)[0];
    return { name, weight_kg: bestWeight, reps: bestSet.reps };
  }).sort((a, b) => a.name.localeCompare(b.name));

  let html = `<div class="screen-header"><h1>Progress</h1></div>`;

  html += `
    <div class="card">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Stats</div>
      <div class="stats-grid">
        <div class="stat-cell"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
        <div class="stat-cell"><div class="stat-value">${thisWeek}</div><div class="stat-label">This Week</div></div>
        <div class="stat-cell"><div class="stat-value">${thisMonth}</div><div class="stat-label">This Month</div></div>
        <div class="stat-cell"><div class="stat-value" style="font-size:1rem;">${lastWorkout}</div><div class="stat-label">Last Workout</div></div>
      </div>
    </div>`;

  if (prs.length > 0) {
    html += `
      <div class="card">
        <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Personal Records</div>
        ${prs.map(pr => `
          <div class="pr-row">
            <span class="pr-name">${pr.name}</span>
            <span class="pr-value">${pr.weight_kg} kg × ${pr.reps}</span>
          </div>`).join('')}
      </div>`;
  } else {
    html += `<div class="empty">No workout data yet.</div>`;
  }

  container.innerHTML = html;

  window.addEventListener('sync-complete', () => renderProgress(container), { once: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add js/progress.js
git commit -m "feat: implement progress screen (stats card, PRs)"
```

---

## Task 14: Rewrite `gas/Code.gs` as JSON API

**Files:**
- Modify: `gas/Code.gs`

The GAS project is still bound to your Spreadsheet. You edit files directly in the Apps Script editor (script.google.com). This task rewrites `Code.gs` to serve JSON — all other `.gs` files stay unchanged.

- [ ] **Step 1: Open the Apps Script editor for your Spreadsheet**

Go to your Google Spreadsheet → Extensions → Apps Script.

- [ ] **Step 2: Replace `Code.gs` with the following**

```js
function doGet(e) {
  try {
    if (e.parameter.action === 'getAll') {
      const allTemplates = db_getTemplates();
      const allExercises = db_getAllTemplateExercises();
      const exByTemplate = {};
      allExercises.forEach(ex => {
        if (!exByTemplate[ex.template_id]) exByTemplate[ex.template_id] = [];
        exByTemplate[ex.template_id].push(ex);
      });
      const templates = allTemplates.map(t => ({
        id: String(t.id),
        name: t.name,
        updatedAt: t.created_at,
        exercises: (exByTemplate[t.id] || []).map(ex => ({
          exercise_name: ex.exercise_name,
          default_sets: ex.default_sets,
          default_reps: ex.default_reps,
          order: ex.position,
        })),
      }));

      const allWorkouts = db_getWorkouts();
      const allSets = db_getAllSets();
      const setsByWorkout = {};
      allSets.forEach(s => {
        if (!setsByWorkout[s.workout_id]) setsByWorkout[s.workout_id] = [];
        setsByWorkout[s.workout_id].push(s);
      });

      const exerciseNames = [...new Set(allSets.map(s => s.exercise_name))];
      const bests = exerciseNames.length > 0 ? db_getBestSetsForExercises(exerciseNames) : {};

      const workouts = allWorkouts.map(w => {
        const sets = setsByWorkout[w.id] || [];
        const exerciseMap = {};
        sets.forEach(s => {
          if (!exerciseMap[s.exercise_name]) exerciseMap[s.exercise_name] = [];
          exerciseMap[s.exercise_name].push({ weight_kg: s.weight_kg, reps: s.reps, logged: true });
        });
        return {
          id: String(w.id),
          templateId: w.template_id ? String(w.template_id) : null,
          templateName: w.name,
          startedAt: w.started_at,
          finishedAt: w.finished_at,
          updatedAt: w.finished_at,
          exercises: Object.entries(exerciseMap).map(([name, sets]) => ({ exercise_name: name, sets })),
        };
      });

      return json({ ok: true, templates, workouts });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'upsertWorkout') {
      const w = data.workout;
      // Find existing by id or insert new
      const histSheet = db_getSheet('_History');
      const rows = histSheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(w.id)) {
          // Already exists — skip (idempotent)
          found = true;
          break;
        }
      }
      if (!found) {
        const id = db_nextId(histSheet);
        histSheet.appendRow([id, w.templateId || '', w.templateName || 'Free-form', w.startedAt, w.finishedAt]);
        const workoutId = id;
        w.exercises.forEach(ex => {
          ex.sets.forEach((s, i) => {
            db_saveSet(workoutId, ex.exercise_name, i + 1, s.weight_kg, s.reps);
          });
        });
      }
      return json({ ok: true });
    }

    if (data.action === 'deleteWorkout') {
      deleteWorkout(Number(data.id) || data.id);
      return json({ ok: true });
    }

    if (data.action === 'upsertTemplate') {
      const t = data.template;
      const sheet = db_getSheet('_Templates');
      const rows = sheet.getDataRange().getValues();
      let found = false;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(t.id)) {
          sheet.getRange(i + 1, 2).setValue(t.name);
          found = true;
          break;
        }
      }
      if (!found) {
        const id = db_nextId(sheet);
        sheet.appendRow([id, t.name, Date.now()]);
      }
      // Re-sync exercises (replace)
      const tplRows = sheet.getDataRange().getValues();
      const tplRow = tplRows.slice(1).find(r => String(r[0]) === String(t.id));
      if (tplRow) {
        db_updateTemplateExercises(tplRow[0], t.exercises);
      }
      return json({ ok: true });
    }

    if (data.action === 'deleteTemplate') {
      db_deleteTemplate(Number(data.id) || data.id);
      return json({ ok: true });
    }

    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

- [ ] **Step 3: Deploy as web app**

In the Apps Script editor:
1. Click **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**, copy the web app URL

- [ ] **Step 4: Set `GAS_URL` in `js/config.js`**

```js
export const GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Replace `YOUR_DEPLOYMENT_ID` with the ID from the URL you just copied.

- [ ] **Step 5: Update `gas/Code.gs` in the repo to match**

Copy the same Code.gs content into `gas/Code.gs` in your local repo.

- [ ] **Step 6: Commit**

```bash
git add gas/Code.gs js/config.js
git commit -m "feat: rewrite GAS Code.gs as JSON API, set GAS_URL"
```

---

## Task 15: Enable GitHub Pages and verify PWA

**Files:** None — GitHub repo settings.

- [ ] **Step 1: Push all commits to GitHub**

```bash
git push origin master
```

- [ ] **Step 2: Enable GitHub Pages**

On GitHub: repo → Settings → Pages → Source: **Deploy from a branch** → Branch: `master`, folder: `/ (root)` → Save.

Wait ~1 minute for the first deploy.

- [ ] **Step 3: Verify the app loads**

Open `https://<your-username>.github.io/workoutjournalsheet/` in a browser.

Expected:
- App loads with "Home" screen
- Bottom nav shows 4 tabs
- Templates tab: empty state or your existing templates (pulled from GAS)
- History tab: your existing workouts (pulled from GAS)

- [ ] **Step 4: Verify PWA installability**

On Chrome desktop: address bar → install icon.
On iOS Safari: Share → Add to Home Screen.

Expected: App installs and opens in standalone mode (no browser chrome).

- [ ] **Step 5: Verify offline mode**

In DevTools → Network → set to "Offline". Reload.
Expected: App still loads (served from service worker cache).

- [ ] **Step 6: Commit any fixes found during verification**

```bash
git add -p
git commit -m "fix: <describe fix>"
git push origin master
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by |
|---|---|
| Repo reorganized (`gas/` subfolder) | Task 1 |
| Old HTML files deleted | Task 1 |
| Test infrastructure | Task 2 |
| `config.js`, `router.js` | Task 3 |
| `db.js` with templates, workouts, syncQueue | Task 4 |
| `sync.js` — pull + flush | Task 5 |
| `index.html`, `manifest.json`, `sw.js` | Task 6 |
| `css/styles.css` dark theme | Task 7 |
| `app.js` + bottom nav | Task 8 |
| Home screen — template picker, free-form, resume | Task 9 |
| Workout screen — set logging, rest timer, finish, discard | Task 10 |
| History list | Task 11 |
| History detail + delete | Task 11 |
| Templates list | Task 12 |
| Template create/edit/delete | Task 12 |
| Progress — stats card + PRs | Task 13 |
| GAS JSON API | Task 14 |
| GitHub Pages + PWA verification | Task 15 |
| Existing data preserved (numeric IDs mapped to strings) | Task 14 `doGet` |
| `updatedAt` merge sync | Tasks 5, 14 |
| `localStorage` for active workout | Tasks 9, 10 |
