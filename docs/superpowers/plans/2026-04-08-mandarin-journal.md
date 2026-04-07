# Mandarin Learning Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline-first PWA Mandarin learning journal that installs on iPhone and syncs to Google Sheets.

**Architecture:** Vanilla JS single-page app with hash-based routing. IndexedDB is the primary data store — all reads/writes are instant and offline-capable. A Service Worker caches the app shell. Google Apps Script acts as the backend API for Google Sheets sync, following the same pattern as the existing workout journal.

**Tech Stack:** Vanilla HTML/CSS/JS, IndexedDB, Service Worker, Web Speech API, makemeahanzi dataset (bundled), Google Apps Script, Google Sheets, GitHub Pages, Jest + fake-indexeddb (tests only)

---

## New Project Location

All files go in a **new separate directory**: `C:/Users/jordon/Documents/mandarin-journal/`

This is a separate git repo from the workout journal. The workout journal docs folder just holds this plan file.

---

## File Map

```
mandarin-journal/
├── index.html                  # App shell — one HTML file, all screens rendered by JS
├── manifest.json               # PWA manifest: name, icons, display mode
├── sw.js                       # Service Worker: cache app shell, network-first for GAS
├── css/
│   └── styles.css              # Dark theme, cards, forms, nav, flashcard
├── js/
│   ├── config.js               # GAS_URL constant — user fills in after deploying GAS
│   ├── app.js                  # Boot: register SW, register routes, init sync, start router
│   ├── router.js               # Hash-based screen router
│   ├── db.js                   # IndexedDB CRUD: entries + syncQueue stores
│   ├── sync.js                 # Flush syncQueue to GAS; pull remote on launch
│   ├── pinyin.js               # Convert numbered pinyin (ni3) to tone marks (nǐ)
│   ├── hanzi.js                # Load hanzidb.json, decompose characters into components
│   ├── tts.js                  # Web Speech API wrapper for zh-CN pronunciation
│   ├── search.js               # Full-text filter across entry fields
│   ├── journal.js              # Journal Feed screen
│   ├── form.js                 # Add/Edit Entry form
│   ├── detail.js               # Entry Detail screen
│   └── flashcard.js            # Flashcard mode
├── data/
│   └── hanzidb.json            # Generated: character → components map (~3MB)
├── icons/
│   ├── icon-192.png            # PWA icon (192×192)
│   └── icon-512.png            # PWA icon (512×512)
├── scripts/
│   ├── dictionary.txt          # Downloaded from makemeahanzi (one JSON per line)
│   └── build-hanzidb.js       # One-time script: generates data/hanzidb.json
├── gas/
│   ├── Code.gs                 # GAS entry: doPost (write), doGet (read)
│   ├── Entries.gs              # Sheet helpers: upsert, getAll
│   └── appsscript.json        # GAS project config
├── tests/
│   ├── pinyin.test.js
│   ├── search.test.js
│   ├── db.test.js
│   └── hanzi.test.js
└── package.json                # Jest only (no build step for production)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `C:/Users/jordon/Documents/mandarin-journal/` (new directory + git repo)
- Create: `index.html`
- Create: `manifest.json`
- Create: `package.json`
- Create: `js/config.js`

- [ ] **Step 1: Create directory and init git**

```bash
mkdir -p /c/Users/jordon/Documents/mandarin-journal
cd /c/Users/jordon/Documents/mandarin-journal
git init
mkdir -p css js data icons scripts tests gas
```

- [ ] **Step 2: Create package.json**

```json
{
  "name": "mandarin-journal",
  "type": "module",
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/.bin/jest",
    "build-hanzi": "node scripts/build-hanzidb.js"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "fake-indexeddb": "^4.0.2"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {}
  }
}
```

- [ ] **Step 3: Install dev dependencies**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
npm install
```

Expected: `node_modules/` created with jest and fake-indexeddb.

- [ ] **Step 4: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#0f0f0f">
  <title>Mandarin Journal</title>
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

- [ ] **Step 5: Create manifest.json**

```json
{
  "name": "Mandarin Journal",
  "short_name": "Mandarin",
  "description": "Personal Mandarin learning journal",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f0f",
  "theme_color": "#0f0f0f",
  "orientation": "portrait",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 6: Create js/config.js**

```js
// Replace GAS_URL after deploying the GAS backend (Task 13)
export const GAS_URL = '';
```

- [ ] **Step 7: Create .gitignore**

```
node_modules/
.DS_Store
```

- [ ] **Step 8: Commit**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
git add .
git commit -m "chore: project scaffold"
```

---

## Task 2: Dark Theme CSS

**Files:**
- Create: `css/styles.css`

- [ ] **Step 1: Create css/styles.css**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface2: #242424;
  --accent: #00bcd4;
  --text: #e0e0e0;
  --text-muted: #888;
  --danger: #cf6679;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  padding-bottom: env(safe-area-inset-bottom);
}

#app { min-height: 100vh; }

/* ── Headers ── */
.screen-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid var(--surface2);
}
.screen-header h1, .screen-header h2 { font-size: 1.1rem; }
.back-btn, .edit-btn, .icon-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
}

/* ── Journal Feed ── */
.journal { display: flex; flex-direction: column; min-height: 100vh; }
.journal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; }
.journal-header h1 { font-size: 1.3rem; }

.search-bar { padding: 0 16px 8px; }
.search-bar input {
  width: 100%;
  background: var(--surface);
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  font-size: 0.95rem;
}
.search-bar input::placeholder { color: var(--text-muted); }

.tag-chips { display: flex; gap: 8px; padding: 0 16px 12px; overflow-x: auto; scrollbar-width: none; }
.tag-chips::-webkit-scrollbar { display: none; }
.chip {
  background: var(--surface);
  border: none;
  border-radius: 16px;
  padding: 4px 14px;
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
}
.chip.active { background: var(--accent); color: #000; font-weight: 600; }

.entry-list { flex: 1; padding: 0 16px; }
.entry-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.entry-card:active { background: var(--surface2); }
.entry-characters { font-size: 2rem; margin-bottom: 2px; }
.entry-pinyin { color: var(--accent); font-size: 0.9rem; margin-bottom: 2px; }
.entry-english { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 6px; }
.entry-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.tag {
  background: var(--surface2);
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 0.75rem;
  color: var(--text-muted);
}
.date { font-size: 0.75rem; color: var(--text-muted); margin-left: auto; }
.empty { color: var(--text-muted); text-align: center; padding: 3rem 0; }

.fab {
  position: fixed;
  bottom: calc(24px + env(safe-area-inset-bottom));
  right: 24px;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--accent);
  color: #000;
  border: none;
  font-size: 1.8rem;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,188,212,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Form ── */
.form-screen, .detail-screen, .flashcard-screen { display: flex; flex-direction: column; min-height: 100vh; }
.form-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; }
.field .hint { color: var(--accent); font-size: 0.7rem; text-transform: none; letter-spacing: 0; }
.field input, .field textarea {
  background: var(--surface);
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  color: var(--text);
  font-size: 1rem;
}
.field textarea { min-height: 80px; resize: vertical; }
.field input:focus, .field textarea:focus { outline: 2px solid var(--accent); }

.tag-input-row { display: flex; gap: 8px; }
.tag-input-row input { flex: 1; }
.tag-input-row button {
  background: var(--surface);
  border: none;
  border-radius: 10px;
  width: 44px;
  color: var(--accent);
  font-size: 1.4rem;
  cursor: pointer;
}
.current-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag.removable { cursor: pointer; }
.tag.removable:hover { background: var(--danger); color: #fff; }

.save-btn {
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

/* ── Detail ── */
.detail-body { padding: 24px 16px; display: flex; flex-direction: column; gap: 16px; }
.detail-characters { font-size: 4rem; text-align: center; }
.detail-pinyin { font-size: 1.2rem; color: var(--accent); text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px; }
.speaker-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; }
.detail-english { color: var(--text-muted); font-size: 1rem; text-align: center; }
.detail-meta { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }

.radical-panel, .notes-panel {
  background: var(--surface);
  border-radius: 12px;
  padding: 14px 16px;
}
.panel-label { font-size: 0.7rem; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
.radical-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 0.95rem; }
.radical-char { font-size: 1.3rem; }
.radical-arrow { color: var(--text-muted); }
.radical-components { color: var(--text-muted); }
.notes-text { color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; }

/* ── Flashcard ── */
.tag-select { padding: 24px 16px; }
.tag-select p { color: var(--text-muted); margin-bottom: 16px; }
.tag-select .options { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.start-btn {
  width: 100%;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.card-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; }
.flash-card {
  background: var(--surface);
  border-radius: 20px;
  width: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  cursor: pointer;
  gap: 12px;
}
.flash-characters { font-size: 3.5rem; }
.flash-hint { color: var(--text-muted); font-size: 0.85rem; }
.flash-pinyin { color: var(--accent); font-size: 1.2rem; }
.flash-english { color: var(--text-muted); font-size: 1rem; }
.hidden { display: none; }

.progress { color: var(--text-muted); font-size: 0.85rem; }
.card-actions { display: flex; gap: 12px; padding: 16px; }
.skip-btn {
  flex: 1;
  background: var(--surface);
  color: var(--text);
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 1rem;
  cursor: pointer;
}
.next-btn {
  flex: 2;
  background: var(--accent);
  color: #000;
  border: none;
  border-radius: 12px;
  padding: 14px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.done-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 32px; text-align: center; }
.done-emoji { font-size: 3rem; }
.done-screen p { color: var(--text-muted); }
.done-screen button { width: 100%; padding: 14px; border-radius: 12px; border: none; font-size: 1rem; cursor: pointer; }
.done-screen #again { background: var(--accent); color: #000; font-weight: 600; }
.done-screen #home { background: var(--surface); color: var(--text); margin-top: 4px; }
```

- [ ] **Step 2: Commit**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
git add css/styles.css
git commit -m "style: dark theme CSS"
```

---

## Task 3: Pinyin Tone Conversion (TDD)

**Files:**
- Create: `js/pinyin.js`
- Create: `tests/pinyin.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/pinyin.test.js`:

```js
import { convertPinyin } from '../js/pinyin.js';

test('converts single syllable with tone 1', () => {
  expect(convertPinyin('ma1')).toBe('mā');
});

test('converts single syllable with tone 2', () => {
  expect(convertPinyin('ma2')).toBe('má');
});

test('converts single syllable with tone 3', () => {
  expect(convertPinyin('ma3')).toBe('mǎ');
});

test('converts single syllable with tone 4', () => {
  expect(convertPinyin('ma4')).toBe('mà');
});

test('tone 5 (neutral) leaves vowel unchanged', () => {
  expect(convertPinyin('ma5')).toBe('ma');
});

test('converts multi-syllable string', () => {
  expect(convertPinyin('ni3 hao3')).toBe('nǐ hǎo');
});

test('a or e takes the mark over other vowels', () => {
  expect(convertPinyin('dui4')).toBe('duì');
  expect(convertPinyin('gui4')).toBe('guì');
});

test('ou: o takes the mark', () => {
  expect(convertPinyin('gou3')).toBe('gǒu');
});

test('last vowel gets mark when no a/e/ou', () => {
  expect(convertPinyin('liu2')).toBe('liú');
});

test('handles v as ü', () => {
  expect(convertPinyin('lv4')).toBe('lǜ');
});

test('real sentence', () => {
  expect(convertPinyin('wo3 shi4 xue2 sheng1')).toBe('wǒ shì xuéshēng');
});

test('leaves non-numbered text unchanged', () => {
  expect(convertPinyin('hello')).toBe('hello');
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
npm test -- tests/pinyin.test.js
```

Expected: FAIL — `Cannot find module '../js/pinyin.js'`

- [ ] **Step 3: Create js/pinyin.js**

```js
const TONES = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
};

function applyTone(syllable, toneNum) {
  const tone = parseInt(toneNum, 10) - 1; // 0-indexed, 4 = neutral
  // Normalise v → ü
  const s = syllable.toLowerCase().replace(/v/g, 'ü');

  // Rule 1: a or e always takes the mark
  if (/[ae]/.test(s)) {
    return s.replace(/[ae]/, m => TONES[m][tone]);
  }
  // Rule 2: ou — o takes the mark
  if (s.includes('ou')) {
    return s.replace('o', TONES['o'][tone]);
  }
  // Rule 3: last vowel takes the mark
  const vowels = ['a', 'e', 'i', 'o', 'u', 'ü'];
  for (let i = s.length - 1; i >= 0; i--) {
    if (vowels.includes(s[i])) {
      return s.slice(0, i) + TONES[s[i]][tone] + s.slice(i + 1);
    }
  }
  return s;
}

export function convertPinyin(input) {
  return input.replace(/([a-züv]+)([1-5])/gi, (_match, syllable, tone) =>
    applyTone(syllable, tone)
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- tests/pinyin.test.js
```

Expected: PASS — 12 tests passing.

- [ ] **Step 5: Commit**

```bash
git add js/pinyin.js tests/pinyin.test.js
git commit -m "feat: pinyin tone mark conversion"
```

---

## Task 4: Full-Text Search (TDD)

**Files:**
- Create: `js/search.js`
- Create: `tests/search.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/search.test.js`:

```js
import { searchEntries } from '../js/search.js';

const entries = [
  { id: '1', characters: '你好', pinyin: 'nǐ hǎo', english: 'Hello', notes: 'greeting' },
  { id: '2', characters: '谢谢', pinyin: 'xiè xie', english: 'Thank you', notes: 'polite' },
  { id: '3', characters: '水', pinyin: 'shuǐ', english: 'Water', notes: 'basic vocab' },
];

test('empty query returns all entries', () => {
  expect(searchEntries(entries, '')).toHaveLength(3);
});

test('null query returns all entries', () => {
  expect(searchEntries(entries, null)).toHaveLength(3);
});

test('matches Chinese characters', () => {
  const result = searchEntries(entries, '你好');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('1');
});

test('matches pinyin (case insensitive)', () => {
  const result = searchEntries(entries, 'XIE');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

test('matches English (case insensitive)', () => {
  const result = searchEntries(entries, 'water');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('3');
});

test('matches notes field', () => {
  const result = searchEntries(entries, 'polite');
  expect(result).toHaveLength(1);
  expect(result[0].id).toBe('2');
});

test('returns empty array when no match', () => {
  expect(searchEntries(entries, 'zzznomatch')).toHaveLength(0);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- tests/search.test.js
```

Expected: FAIL — `Cannot find module '../js/search.js'`

- [ ] **Step 3: Create js/search.js**

```js
export function searchEntries(entries, query) {
  if (!query || !query.trim()) return entries;
  const q = query.toLowerCase().trim();
  return entries.filter(e =>
    (e.characters || '').includes(q) ||
    (e.pinyin || '').toLowerCase().includes(q) ||
    (e.english || '').toLowerCase().includes(q) ||
    (e.notes || '').toLowerCase().includes(q)
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- tests/search.test.js
```

Expected: PASS — 7 tests passing.

- [ ] **Step 5: Commit**

```bash
git add js/search.js tests/search.test.js
git commit -m "feat: full-text search"
```

---

## Task 5: IndexedDB Wrapper (TDD)

**Files:**
- Create: `js/db.js`
- Create: `tests/db.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/db.test.js`:

```js
import 'fake-indexeddb/auto';
import {
  saveEntry, getEntry, listEntries, deleteEntry,
  addToSyncQueue, getSyncQueue, removeFromSyncQueue,
} from '../js/db.js';

const sample = {
  id: 'test-1',
  characters: '你好',
  pinyin: 'nǐ hǎo',
  english: 'Hello',
  notes: '',
  tags: ['greetings'],
  radicals: [],
  createdAt: '2026-04-08T10:00:00.000Z',
  updatedAt: '2026-04-08T10:00:00.000Z',
};

test('saveEntry then getEntry returns the entry', async () => {
  await saveEntry(sample);
  const result = await getEntry('test-1');
  expect(result.characters).toBe('你好');
});

test('listEntries returns saved entries newest first', async () => {
  const older = { ...sample, id: 'old-1', createdAt: '2026-04-07T10:00:00.000Z', updatedAt: '2026-04-07T10:00:00.000Z' };
  await saveEntry(older);
  const list = await listEntries();
  expect(list[0].id).toBe('test-1'); // newer first
});

test('saveEntry with same id overwrites', async () => {
  const updated = { ...sample, english: 'Hi' };
  await saveEntry(updated);
  const result = await getEntry('test-1');
  expect(result.english).toBe('Hi');
});

test('deleteEntry removes entry', async () => {
  await deleteEntry('test-1');
  const result = await getEntry('test-1');
  expect(result).toBeUndefined();
});

test('syncQueue: add then get then remove', async () => {
  const entry = { ...sample, id: 'sync-1' };
  await addToSyncQueue(entry);
  const queue = await getSyncQueue();
  expect(queue.some(e => e.id === 'sync-1')).toBe(true);
  await removeFromSyncQueue('sync-1');
  const after = await getSyncQueue();
  expect(after.some(e => e.id === 'sync-1')).toBe(false);
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npm test -- tests/db.test.js
```

Expected: FAIL — `Cannot find module '../js/db.js'`

- [ ] **Step 3: Create js/db.js**

```js
const DB_NAME = 'mandarin-journal';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('entries')) {
        const store = db.createObjectStore('entries', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
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

export function saveEntry(entry) {
  return tx('entries', 'readwrite', store => store.put(entry));
}

export function getEntry(id) {
  return tx('entries', 'readonly', store => store.get(id));
}

export function deleteEntry(id) {
  return tx('entries', 'readwrite', store => store.delete(id));
}

export function listEntries() {
  return getAll('entries').then(rows =>
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

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
npm test -- tests/db.test.js
```

Expected: PASS — 5 tests passing.

- [ ] **Step 5: Commit**

```bash
git add js/db.js tests/db.test.js
git commit -m "feat: IndexedDB wrapper"
```

---

## Task 6: HanziDB Data + Lookup (TDD)

**Files:**
- Create: `scripts/build-hanzidb.js`
- Download: `scripts/dictionary.txt`
- Generate: `data/hanzidb.json`
- Create: `js/hanzi.js`
- Create: `tests/hanzi.test.js`

- [ ] **Step 1: Download the makemeahanzi dictionary**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
curl -L "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt" -o scripts/dictionary.txt
```

Expected: `scripts/dictionary.txt` created, ~4MB.

- [ ] **Step 2: Create scripts/build-hanzidb.js**

```js
import { readFileSync, writeFileSync } from 'fs';

// IDS (Ideographic Description Sequence) operators
const IDS_OPS = new Set(['⿰','⿱','⿲','⿳','⿴','⿵','⿶','⿷','⿸','⿹','⿺','⿻']);

function isCJK(char) {
  const cp = char.codePointAt(0);
  return (cp >= 0x4E00 && cp <= 0x9FFF) ||   // CJK Unified
         (cp >= 0x3400 && cp <= 0x4DBF) ||   // CJK Extension A
         (cp >= 0x20000 && cp <= 0x2A6DF);   // CJK Extension B
}

function extractComponents(decomposition) {
  if (!decomposition || decomposition === '？') return [];
  return [...decomposition].filter(c => !IDS_OPS.has(c) && isCJK(c));
}

const lines = readFileSync('./scripts/dictionary.txt', 'utf-8').trim().split('\n');
const result = {};

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    const components = extractComponents(entry.decomposition);
    if (components.length > 0) {
      result[entry.character] = components;
    }
  } catch (_) {
    // skip malformed lines
  }
}

writeFileSync('./data/hanzidb.json', JSON.stringify(result));
console.log(`Built data/hanzidb.json with ${Object.keys(result).length} characters`);
```

- [ ] **Step 3: Run the build script**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
node scripts/build-hanzidb.js
```

Expected output: `Built data/hanzidb.json with XXXX characters` (typically 6000–9000).

Verify spot-checks:
```bash
node --input-type=module << 'EOF'
import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('./data/hanzidb.json', 'utf-8'));
console.log('明:', d['明']);
console.log('你:', d['你']);
console.log('好:', d['好']);
EOF
```

Expected:
- `明: [ '日', '月' ]`
- `你: [ '亻', '尔' ]`
- `好: [ '女', '子' ]`

- [ ] **Step 4: Write the failing test**

Create `tests/hanzi.test.js`:

```js
import { decompose } from '../js/hanzi.js';
import { readFileSync } from 'fs';

// Load the real hanzidb.json for tests
const db = JSON.parse(readFileSync('./data/hanzidb.json', 'utf-8'));

// Inject into globalThis so hanzi.js can use it without fetch
globalThis._hanziTestDB = db;

test('decomposes 明 into 日 and 月', async () => {
  const result = await decompose('明');
  expect(result).toHaveLength(1);
  expect(result[0].char).toBe('明');
  expect(result[0].components).toContain('日');
  expect(result[0].components).toContain('月');
});

test('decomposes multiple characters', async () => {
  const result = await decompose('你好');
  expect(result.length).toBeGreaterThanOrEqual(1);
  const chars = result.map(r => r.char);
  expect(chars).toContain('你');
});

test('character with no breakdown returns empty components', async () => {
  const result = await decompose('一');
  // 一 has no components — it should either be absent or have empty components
  const entry = result.find(r => r.char === '一');
  if (entry) expect(entry.components).toHaveLength(0);
  else expect(result.filter(r => r.char === '一')).toHaveLength(0);
});
```

- [ ] **Step 5: Create js/hanzi.js**

```js
let _db = null;

async function loadDB() {
  if (_db) return _db;
  // Test environment injects _hanziTestDB to avoid fetch
  if (typeof globalThis._hanziTestDB !== 'undefined') {
    _db = globalThis._hanziTestDB;
    return _db;
  }
  const resp = await fetch('./data/hanzidb.json');
  _db = await resp.json();
  return _db;
}

export async function decompose(characters) {
  const db = await loadDB();
  return [...characters]
    .map(char => ({ char, components: db[char] || [] }))
    .filter(r => r.components.length > 0);
}
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
npm test -- tests/hanzi.test.js
```

Expected: PASS — 3 tests passing.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-hanzidb.js js/hanzi.js tests/hanzi.test.js data/hanzidb.json
git commit -m "feat: HanziDB character breakdown"
```

---

## Task 7: TTS Wrapper

**Files:**
- Create: `js/tts.js`

No automated tests — Web Speech API is a browser API. Manual verification in Task 11 (Entry Detail).

- [ ] **Step 1: Create js/tts.js**

```js
export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 0.8;
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 2: Commit**

```bash
git add js/tts.js
git commit -m "feat: TTS wrapper for zh-CN"
```

---

## Task 8: Router + App Boot

**Files:**
- Create: `js/router.js`
- Create: `js/app.js`

- [ ] **Step 1: Create js/router.js**

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
    const raw = window.location.hash || '#journal';
    const qIdx = raw.indexOf('?');
    const path = qIdx === -1 ? raw : raw.slice(0, qIdx);
    const search = qIdx === -1 ? '' : raw.slice(qIdx + 1);
    const fn = routes[path] || routes['#journal'];
    const container = document.getElementById('app');
    container.innerHTML = '';
    if (fn) fn(container, new URLSearchParams(search));
  };
  window.addEventListener('hashchange', render);
  render();
}
```

- [ ] **Step 2: Create js/app.js**

```js
import { start as startRouter, register } from './router.js';
import { renderJournal } from './journal.js';
import { renderForm } from './form.js';
import { renderDetail } from './detail.js';
import { renderFlashcard } from './flashcard.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

register('#journal', renderJournal);
register('#add', renderForm);
register('#edit', renderForm);
register('#detail', renderDetail);
register('#flashcard', renderFlashcard);

initSync();
startRouter();
```

- [ ] **Step 3: Commit**

```bash
git add js/router.js js/app.js
git commit -m "feat: router and app boot"
```

---

## Task 9: Journal Feed Screen

**Files:**
- Create: `js/journal.js`

- [ ] **Step 1: Create js/journal.js**

```js
import { listEntries } from './db.js';
import { navigate } from './router.js';
import { searchEntries } from './search.js';

export async function renderJournal(container) {
  let entries = await listEntries();
  const allTags = [...new Set(entries.flatMap(e => e.tags || []))].sort();
  let activeTag = 'all';
  let searchQuery = '';

  function getFiltered() {
    let result = entries;
    if (activeTag !== 'all') result = result.filter(e => (e.tags || []).includes(activeTag));
    if (searchQuery) result = searchEntries(result, searchQuery);
    return result;
  }

  function render() {
    const filtered = getFiltered();
    container.innerHTML = `
      <div class="journal">
        <header class="journal-header">
          <h1>Mandarin Journal</h1>
          <button class="icon-btn" id="flashcard-btn">📚</button>
        </header>
        <div class="search-bar">
          <input type="search" id="search" placeholder="Search entries..." value="${escHtml(searchQuery)}">
        </div>
        <div class="tag-chips">
          <button class="chip ${activeTag === 'all' ? 'active' : ''}" data-tag="all">All</button>
          ${allTags.map(t => `<button class="chip ${activeTag === t ? 'active' : ''}" data-tag="${escHtml(t)}">${escHtml(t)}</button>`).join('')}
        </div>
        <div class="entry-list">
          ${filtered.length === 0
            ? '<p class="empty">No entries yet. Tap + to add one.</p>'
            : filtered.map(e => `
                <div class="entry-card" data-id="${escHtml(e.id)}">
                  <div class="entry-characters">${escHtml(e.characters)}</div>
                  <div class="entry-pinyin">${escHtml(e.pinyin)}</div>
                  <div class="entry-english">${escHtml(e.english)}</div>
                  <div class="entry-meta">
                    ${(e.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
                    <span class="date">${new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
        </div>
        <button class="fab" id="add-btn">+</button>
      </div>
    `;

    document.getElementById('search').addEventListener('input', ev => {
      searchQuery = ev.target.value;
      render();
    });
    document.querySelectorAll('.chip').forEach(chip =>
      chip.addEventListener('click', () => { activeTag = chip.dataset.tag; render(); })
    );
    document.getElementById('add-btn').addEventListener('click', () => navigate('#add'));
    document.getElementById('flashcard-btn').addEventListener('click', () => navigate('#flashcard'));
    document.querySelectorAll('.entry-card').forEach(card =>
      card.addEventListener('click', () => navigate(`#detail?id=${card.dataset.id}`))
    );
  }

  render();
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

- [ ] **Step 2: Serve locally and verify the journal feed renders**

Open a local server (e.g. VS Code Live Server, or `npx serve .` if available) and open `http://localhost:PORT` in a browser. The page should show the journal feed with "No entries yet" message and a `+` button.

- [ ] **Step 3: Commit**

```bash
git add js/journal.js
git commit -m "feat: journal feed screen"
```

---

## Task 10: Add/Edit Entry Form

**Files:**
- Create: `js/form.js`

- [ ] **Step 1: Create js/form.js**

```js
import { saveEntry, getEntry, addToSyncQueue } from './db.js';
import { navigate } from './router.js';
import { convertPinyin } from './pinyin.js';
import { decompose } from './hanzi.js';

function generateId() {
  return (crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2));
}

function hasChinese(text) {
  return /[\u4E00-\u9FFF]/.test(text);
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderForm(container, params) {
  const editId = params.get('id');
  const existing = editId ? await getEntry(editId) : null;

  let clipboardChars = '';
  if (!editId && navigator.clipboard) {
    try {
      const text = await navigator.clipboard.readText();
      if (hasChinese(text)) clipboardChars = text;
    } catch (_) { /* user denied clipboard */ }
  }

  const base = existing || { characters: clipboardChars, pinyin: '', english: '', notes: '', tags: [] };
  let currentTags = [...(base.tags || [])];

  function renderTags() {
    const el = document.getElementById('current-tags');
    if (!el) return;
    el.innerHTML = currentTags
      .map(t => `<span class="tag removable" data-tag="${escHtml(t)}">${escHtml(t)} ×</span>`)
      .join('');
    el.querySelectorAll('.tag.removable').forEach(span =>
      span.addEventListener('click', () => {
        currentTags = currentTags.filter(t => t !== span.dataset.tag);
        renderTags();
      })
    );
  }

  container.innerHTML = `
    <div class="form-screen">
      <header class="screen-header">
        <button class="back-btn" id="back">←</button>
        <h2>${editId ? 'Edit Entry' : 'New Entry'}</h2>
        <span></span>
      </header>
      <div class="form-body">
        <div class="field">
          <label>CHARACTERS</label>
          <input type="text" id="characters" value="${escHtml(base.characters)}" placeholder="你好">
        </div>
        <div class="field">
          <label>PINYIN <span class="hint">type ni3 hao3 — auto converts</span></label>
          <input type="text" id="pinyin" value="${escHtml(base.pinyin)}" placeholder="nǐ hǎo">
        </div>
        <div class="field">
          <label>ENGLISH</label>
          <input type="text" id="english" value="${escHtml(base.english)}" placeholder="Hello">
        </div>
        <div class="field">
          <label>MY NOTES</label>
          <textarea id="notes" placeholder="Your thoughts...">${escHtml(base.notes)}</textarea>
        </div>
        <div class="field">
          <label>TAGS</label>
          <div class="tag-input-row">
            <input type="text" id="tag-input" placeholder="Add a tag...">
            <button id="add-tag">+</button>
          </div>
          <div class="current-tags" id="current-tags"></div>
        </div>
        <button class="save-btn" id="save">Save Entry</button>
      </div>
    </div>
  `;

  renderTags();

  // Live pinyin conversion
  const pinyinInput = document.getElementById('pinyin');
  pinyinInput.addEventListener('input', () => {
    const pos = pinyinInput.selectionStart;
    pinyinInput.value = convertPinyin(pinyinInput.value);
    pinyinInput.setSelectionRange(pos, pos);
  });

  // Tag add
  document.getElementById('add-tag').addEventListener('click', () => {
    const input = document.getElementById('tag-input');
    const tag = input.value.trim().toLowerCase();
    if (tag && !currentTags.includes(tag)) { currentTags.push(tag); renderTags(); }
    input.value = '';
  });
  document.getElementById('tag-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-tag').click();
  });

  document.getElementById('back').addEventListener('click', () => history.back());

  document.getElementById('save').addEventListener('click', async () => {
    const characters = document.getElementById('characters').value.trim();
    if (!characters) { alert('Characters are required.'); return; }
    const pinyin = document.getElementById('pinyin').value.trim();
    const english = document.getElementById('english').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const now = new Date().toISOString();
    const radicals = await decompose(characters);
    const entry = {
      id: editId || generateId(),
      characters, pinyin, english, notes,
      tags: currentTags, radicals,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };
    await saveEntry(entry);
    await addToSyncQueue(entry);
    navigate('#journal');
  });
}
```

- [ ] **Step 2: Verify manually**

In the browser, tap `+` on the journal feed. The form should appear. Type `ni3 hao3` in the Pinyin field and verify it converts to `nǐ hǎo` live. Save an entry and verify it appears in the journal feed.

- [ ] **Step 3: Commit**

```bash
git add js/form.js
git commit -m "feat: add/edit entry form with live pinyin conversion"
```

---

## Task 11: Entry Detail Screen

**Files:**
- Create: `js/detail.js`

- [ ] **Step 1: Create js/detail.js**

```js
import { getEntry } from './db.js';
import { navigate } from './router.js';
import { speak } from './tts.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderDetail(container, params) {
  const id = params.get('id');
  const entry = await getEntry(id);
  if (!entry) { navigate('#journal'); return; }

  container.innerHTML = `
    <div class="detail-screen">
      <header class="screen-header">
        <button class="back-btn" id="back">←</button>
        <h2>Entry</h2>
        <button class="edit-btn" id="edit">✏️ Edit</button>
      </header>
      <div class="detail-body">
        <div class="detail-characters">${escHtml(entry.characters)}</div>
        <div class="detail-pinyin">
          ${escHtml(entry.pinyin)}
          <button class="speaker-btn" id="speak">🔊</button>
        </div>
        <div class="detail-english">${escHtml(entry.english)}</div>

        ${entry.radicals && entry.radicals.length > 0 ? `
          <div class="radical-panel">
            <div class="panel-label">Character Breakdown</div>
            ${entry.radicals.map(r => `
              <div class="radical-row">
                <span class="radical-char">${escHtml(r.char)}</span>
                <span class="radical-arrow">→</span>
                <span class="radical-components">${r.components.map(c => escHtml(c)).join('  +  ')}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${entry.notes ? `
          <div class="notes-panel">
            <div class="panel-label">My Notes</div>
            <div class="notes-text">${escHtml(entry.notes)}</div>
          </div>
        ` : ''}

        <div class="detail-meta">
          ${(entry.tags || []).map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}
          <span class="date">${new Date(entry.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back').addEventListener('click', () => history.back());
  document.getElementById('edit').addEventListener('click', () => navigate(`#edit?id=${id}`));
  document.getElementById('speak').addEventListener('click', () => speak(entry.characters));
}
```

- [ ] **Step 2: Verify manually**

Tap an entry card in the journal. The detail screen should show large characters, pinyin with a speaker button, the radical breakdown panel, and your notes. Tap the speaker button and verify Mandarin audio plays.

- [ ] **Step 3: Commit**

```bash
git add js/detail.js
git commit -m "feat: entry detail screen with TTS and radical breakdown"
```

---

## Task 12: Flashcard Mode

**Files:**
- Create: `js/flashcard.js`

- [ ] **Step 1: Create js/flashcard.js**

```js
import { listEntries } from './db.js';
import { navigate } from './router.js';
import { speak } from './tts.js';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function renderFlashcard(container) {
  const allEntries = await listEntries();
  const allTags = [...new Set(allEntries.flatMap(e => e.tags || []))].sort();
  let selectedTag = 'all';
  let cards = [];
  let index = 0;

  function getCards() {
    if (selectedTag === 'all') return [...allEntries];
    return allEntries.filter(e => (e.tags || []).includes(selectedTag));
  }

  function renderTagSelect() {
    container.innerHTML = `
      <div class="flashcard-screen">
        <header class="screen-header">
          <button id="back">←</button>
          <h2>Flashcard Mode</h2>
          <span></span>
        </header>
        <div class="tag-select">
          <p>Which cards do you want to review?</p>
          <div class="options">
            <button class="chip ${selectedTag === 'all' ? 'active' : ''}" data-tag="all">All (${allEntries.length})</button>
            ${allTags.map(t => {
              const count = allEntries.filter(e => (e.tags || []).includes(t)).length;
              return `<button class="chip ${selectedTag === t ? 'active' : ''}" data-tag="${escHtml(t)}">${escHtml(t)} (${count})</button>`;
            }).join('')}
          </div>
          <button class="start-btn" id="start">Start →</button>
        </div>
      </div>
    `;
    document.getElementById('back').addEventListener('click', () => navigate('#journal'));
    document.querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', () => { selectedTag = c.dataset.tag; renderTagSelect(); })
    );
    document.getElementById('start').addEventListener('click', () => {
      cards = getCards();
      if (cards.length === 0) { alert('No entries match this filter.'); return; }
      index = 0;
      renderCard();
    });
  }

  function renderCard() {
    const card = cards[index];
    let revealed = false;

    container.innerHTML = `
      <div class="flashcard-screen">
        <header class="screen-header">
          <button id="back">← Exit</button>
          <span class="progress">${index + 1} / ${cards.length}</span>
          <span></span>
        </header>
        <div class="card-area">
          <div class="flash-card" id="flash-card">
            <div class="flash-characters">${escHtml(card.characters)}</div>
            <div class="flash-hint" id="hint">tap to reveal</div>
            <div class="flash-answer hidden" id="answer">
              <div class="flash-pinyin">${escHtml(card.pinyin)}</div>
              <div class="flash-english">${escHtml(card.english)}</div>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="skip-btn" id="skip">← Skip</button>
          <button class="next-btn" id="next">Got it →</button>
        </div>
      </div>
    `;

    document.getElementById('back').addEventListener('click', () => navigate('#journal'));

    document.getElementById('flash-card').addEventListener('click', () => {
      if (!revealed) {
        document.getElementById('answer').classList.remove('hidden');
        document.getElementById('hint').classList.add('hidden');
        speak(card.characters);
        revealed = true;
      }
    });

    document.getElementById('skip').addEventListener('click', () => {
      index = (index + 1) % cards.length;
      renderCard();
    });

    document.getElementById('next').addEventListener('click', () => {
      index++;
      if (index >= cards.length) renderDone();
      else renderCard();
    });
  }

  function renderDone() {
    container.innerHTML = `
      <div class="flashcard-screen">
        <div class="done-screen">
          <div class="done-emoji">🎉</div>
          <h2>Done!</h2>
          <p>You reviewed all ${cards.length} cards.</p>
          <button id="again">Review Again</button>
          <button id="home">Back to Journal</button>
        </div>
      </div>
    `;
    document.getElementById('again').addEventListener('click', () => { index = 0; renderCard(); });
    document.getElementById('home').addEventListener('click', () => navigate('#journal'));
  }

  renderTagSelect();
}
```

- [ ] **Step 2: Verify manually**

Tap 📚 in the journal. Select a tag filter (or All) and tap Start. Tap the card to reveal pinyin + English and hear audio. Tap "Got it →" to advance. After the last card, the completion screen should appear.

- [ ] **Step 3: Commit**

```bash
git add js/flashcard.js
git commit -m "feat: flashcard mode"
```

---

## Task 13: GAS Backend

**Files:**
- Create: `gas/appsscript.json`
- Create: `gas/Entries.gs`
- Create: `gas/Code.gs`

This task uses the Google Apps Script editor at [script.google.com](https://script.google.com). The GAS project must be attached to a new Google Spreadsheet.

- [ ] **Step 1: Create a new Google Spreadsheet**

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet named `Mandarin Journal`
2. Note the spreadsheet URL — you'll need it

- [ ] **Step 2: Open Apps Script editor**

In the spreadsheet: Extensions → Apps Script. This opens the editor.

- [ ] **Step 3: Replace the default Code.gs with this content**

In the Apps Script editor, paste into `Code.gs`:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'upsertEntry') {
      Entries.upsert(data.entry);
      return json({ ok: true });
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doGet(e) {
  try {
    if (e.parameter.action === 'getAll') {
      return json({ ok: true, entries: Entries.getAll() });
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

- [ ] **Step 4: Create Entries.gs in the Apps Script editor**

Click `+` next to Files, name it `Entries`, paste:

```javascript
const SHEET_NAME = 'Entries';
const COLS = ['id','characters','pinyin','english','notes','tags','radicals','createdAt','updatedAt'];

const Entries = {
  sheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(SHEET_NAME);
      sh.appendRow(COLS);
      sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold');
    }
    return sh;
  },

  getAll() {
    const sh = this.sheet();
    const rows = sh.getDataRange().getValues();
    if (rows.length <= 1) return [];
    const [, ...data] = rows;
    return data.map(row => {
      const entry = {};
      COLS.forEach((col, i) => {
        entry[col] = (col === 'tags' || col === 'radicals')
          ? JSON.parse(row[i] || '[]')
          : row[i];
      });
      return entry;
    });
  },

  upsert(entry) {
    const sh = this.sheet();
    const allValues = sh.getDataRange().getValues();
    const ids = allValues.slice(1).map(r => r[0]);
    const rowIndex = ids.indexOf(entry.id);
    const rowData = COLS.map(col =>
      (col === 'tags' || col === 'radicals')
        ? JSON.stringify(entry[col] || [])
        : (entry[col] ?? '')
    );
    if (rowIndex === -1) {
      sh.appendRow(rowData);
    } else {
      sh.getRange(rowIndex + 2, 1, 1, COLS.length).setValues([rowData]);
    }
  },
};
```

- [ ] **Step 5: Deploy as a Web App**

In Apps Script editor:
1. Click **Deploy** → **New deployment**
2. Type: **Web app**
3. Description: `Mandarin Journal v1`
4. Execute as: **Me**
5. Who has access: **Anyone** (required for the PWA to call it without OAuth)
6. Click **Deploy**
7. Copy the Web App URL (looks like `https://script.google.com/macros/s/XXXX/exec`)

- [ ] **Step 6: Update js/config.js with the GAS URL**

In `C:/Users/jordon/Documents/mandarin-journal/js/config.js`:

```js
export const GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

Replace `YOUR_DEPLOYMENT_ID` with the actual ID from step 5.

- [ ] **Step 7: Save the GAS files locally for reference**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
```

Create `gas/appsscript.json`:
```json
{
  "timeZone": "Asia/Singapore",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

Create `gas/Code.gs` and `gas/Entries.gs` with the same content as pasted into the Apps Script editor above (local copies for reference only — the live version lives in Apps Script).

- [ ] **Step 8: Commit**

```bash
git add gas/ js/config.js
git commit -m "feat: GAS backend and config"
```

---

## Task 14: Sync Layer

**Files:**
- Create: `js/sync.js`

- [ ] **Step 1: Create js/sync.js**

```js
import { GAS_URL } from './config.js';
import { getSyncQueue, removeFromSyncQueue, saveEntry, listEntries } from './db.js';

export async function initSync() {
  window.addEventListener('online', () => {
    pullFromSheets().then(flushQueue);
  });
  if (navigator.onLine && GAS_URL) {
    await pullFromSheets();
    await flushQueue();
  }
}

async function flushQueue() {
  if (!GAS_URL || !navigator.onLine) return;
  const queue = await getSyncQueue();
  for (const entry of queue) {
    try {
      const resp = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'upsertEntry', entry }),
      });
      const result = await resp.json();
      if (result.ok) await removeFromSyncQueue(entry.id);
    } catch (_) {
      break; // network failed — retry on next online event
    }
  }
}

async function pullFromSheets() {
  if (!GAS_URL || !navigator.onLine) return;
  try {
    const resp = await fetch(`${GAS_URL}?action=getAll`);
    const { ok, entries: remote } = await resp.json();
    if (!ok || !remote) return;
    const local = await listEntries();
    const localMap = Object.fromEntries(local.map(e => [e.id, e]));
    for (const entry of remote) {
      const localEntry = localMap[entry.id];
      if (!localEntry || entry.updatedAt > localEntry.updatedAt) {
        await saveEntry(entry);
      }
    }
  } catch (_) {
    // silent — try again on next launch
  }
}
```

- [ ] **Step 2: Verify sync manually**

1. Open the app in a browser, add a new entry.
2. Check the Google Sheet — the entry should appear within a few seconds (assuming you're online and GAS_URL is set).
3. Turn off WiFi on your phone (or use Chrome DevTools → Network → Offline), add another entry, turn WiFi back on — the entry should sync to Sheets.

- [ ] **Step 3: Commit**

```bash
git add js/sync.js
git commit -m "feat: offline sync queue to Google Sheets"
```

---

## Task 15: Service Worker + PWA Icons

**Files:**
- Create: `sw.js`
- Create: `icons/icon-192.png` and `icons/icon-512.png`

- [ ] **Step 1: Create icons**

Generate two simple square PNG icons (dark background, Chinese character 汉 in white). Use any image editor, or run this with Node.js if you have `canvas` available:

```bash
# If you have ImageMagick installed:
magick -size 192x192 xc:#0f0f0f -fill white -font "Arial-Unicode-MS" -pointsize 120 -gravity center -annotate 0 "汉" icons/icon-192.png
magick -size 512x512 xc:#0f0f0f -fill white -font "Arial-Unicode-MS" -pointsize 320 -gravity center -annotate 0 "汉" icons/icon-512.png
```

If ImageMagick is not available, create any 192×192 and 512×512 PNG and save them to `icons/`. They just need to exist for the PWA to install correctly.

- [ ] **Step 2: Create sw.js**

```js
const CACHE = 'mandarin-journal-v1';

const SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/app.js',
  '/js/router.js',
  '/js/db.js',
  '/js/sync.js',
  '/js/config.js',
  '/js/pinyin.js',
  '/js/hanzi.js',
  '/js/tts.js',
  '/js/search.js',
  '/js/journal.js',
  '/js/form.js',
  '/js/detail.js',
  '/js/flashcard.js',
  '/data/hanzidb.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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
  // Network-first for GAS API calls
  if (e.request.url.includes('script.google.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify({ ok: false, error: 'offline' }), {
        headers: { 'Content-Type': 'application/json' },
      }))
    );
    return;
  }
  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
```

- [ ] **Step 3: Verify PWA install on iPhone**

1. Deploy to GitHub Pages (Task 16)
2. Open the GitHub Pages URL in Safari on iPhone
3. Tap Share → Add to Home Screen
4. The app icon should appear on the home screen
5. Open from home screen — it should open in standalone mode (no Safari UI)
6. Turn on Airplane Mode, open again — app should still load

- [ ] **Step 4: Commit**

```bash
git add sw.js icons/
git commit -m "feat: service worker and PWA icons"
```

---

## Task 16: Deploy to GitHub Pages

- [ ] **Step 1: Create a new GitHub repository**

1. Go to [github.com](https://github.com) → New repository
2. Name: `mandarin-journal`
3. Public (required for free GitHub Pages)
4. Do NOT initialise with README (we already have commits)

- [ ] **Step 2: Push to GitHub**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/mandarin-journal.git
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

- [ ] **Step 3: Enable GitHub Pages**

1. In the GitHub repo: Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Click Save

After ~1 minute, the app is live at: `https://YOUR_GITHUB_USERNAME.github.io/mandarin-journal/`

- [ ] **Step 4: Update sw.js SHELL paths if needed**

If GitHub Pages serves the app at a sub-path (e.g. `/mandarin-journal/`), update the paths in `sw.js` to include the prefix:

```js
const BASE = '/mandarin-journal'; // or '' if at root

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  // ... etc
];
```

Also update `manifest.json`:
```json
{
  "start_url": "/mandarin-journal/"
}
```

- [ ] **Step 5: Final commit and push**

```bash
git add sw.js manifest.json
git commit -m "chore: adjust paths for GitHub Pages deployment"
git push
```

- [ ] **Step 6: Run full test suite one last time**

```bash
cd /c/Users/jordon/Documents/mandarin-journal
npm test
```

Expected: All tests pass (pinyin, search, db, hanzi).

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| PWA installable on iPhone | Task 15 (SW + manifest), Task 16 (deploy) |
| Offline support | Task 5 (IndexedDB), Task 14 (sync queue), Task 15 (SW cache) |
| Characters + Pinyin + English + Notes per entry | Task 10 (form) |
| Auto tone mark conversion | Task 3 (pinyin.js) |
| Tags with chronological feed | Task 9 (journal.js) |
| Full-text search | Task 4 (search.js), Task 9 (journal.js) |
| Character breakdown (HanziDB) | Task 6 (hanzi.js + data) |
| Audio pronunciation | Task 7 (tts.js), Task 11 (detail.js) |
| Quick add from clipboard | Task 10 (form.js — clipboard pre-fill) |
| Flashcard mode with tag filter | Task 12 (flashcard.js) |
| Google Sheets sync | Task 13 (GAS), Task 14 (sync.js) |
| Last-write-wins conflict resolution | Task 14 (sync.js — updatedAt comparison) |
| Dark theme | Task 2 (styles.css) |

All spec requirements are covered. ✓
