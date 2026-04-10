# Exercise Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a preset exercise list that appears as an inline autocomplete dropdown when adding exercises on the workout and template-edit pages, with management UI on the Templates tab.

**Architecture:** A new `js/presets.js` module handles all localStorage read/write for preset names and exports an `attachAutocomplete(inputEl)` DOM helper. Templates, template-edit, and workout pages import from this module. No external libraries, no IndexedDB.

**Tech Stack:** Vanilla JS (ES modules), localStorage, Jest (node environment with mocked localStorage), CSS custom properties.

---

## File Map

- **Create:** `js/presets.js` — `getPresets`, `savePresets`, `addPreset`, `removePreset`, `attachAutocomplete`
- **Create:** `tests/presets.test.js` — unit tests for the pure localStorage functions
- **Modify:** `css/styles.css` — add `.autocomplete-wrap`, `.autocomplete-dropdown`, `.autocomplete-item`, `.preset-row`
- **Modify:** `js/templates.js` — add "Exercise Presets" management card at the bottom
- **Modify:** `js/template-edit.js` — call `attachAutocomplete` on `#new-ex-input` inside `attachEvents()`
- **Modify:** `js/workout.js` — replace `prompt()` with inline `#add-ex-input` field + `attachAutocomplete`
- **Modify:** `sw.js` — add `js/presets.js` to SHELL array, bump cache version

---

## Task 1: `js/presets.js` module + tests

### Files
- Create: `js/presets.js`
- Create: `tests/presets.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/presets.test.js`:

```js
import { getPresets, savePresets, addPreset, removePreset } from '../js/presets.js';

// Mock localStorage for Node test environment (no browser APIs available)
let store = {};
global.localStorage = {
  getItem: key => store[key] ?? null,
  setItem: (key, val) => { store[key] = val; },
  removeItem: key => { delete store[key]; },
};

beforeEach(() => { store = {}; });

test('getPresets returns empty array when nothing stored', () => {
  expect(getPresets()).toEqual([]);
});

test('savePresets and getPresets round-trip', () => {
  savePresets(['Bench Press', 'Squat']);
  expect(getPresets()).toEqual(['Bench Press', 'Squat']);
});

test('addPreset appends a new name', () => {
  addPreset('Deadlift');
  expect(getPresets()).toEqual(['Deadlift']);
});

test('addPreset ignores duplicates case-insensitively', () => {
  addPreset('Bench Press');
  addPreset('bench press');
  addPreset('BENCH PRESS');
  expect(getPresets()).toHaveLength(1);
});

test('addPreset trims whitespace', () => {
  addPreset('  Squat  ');
  expect(getPresets()).toEqual(['Squat']);
});

test('addPreset ignores empty and whitespace-only names', () => {
  addPreset('');
  addPreset('   ');
  expect(getPresets()).toEqual([]);
});

test('removePreset removes matching name case-insensitively', () => {
  savePresets(['Bench Press', 'Squat', 'Deadlift']);
  removePreset('squat');
  expect(getPresets()).toEqual(['Bench Press', 'Deadlift']);
});

test('removePreset does nothing when name not found', () => {
  savePresets(['Bench Press']);
  removePreset('OHP');
  expect(getPresets()).toEqual(['Bench Press']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/presets.test.js
```

Expected: failures — `Cannot find module '../js/presets.js'`

- [ ] **Step 3: Write the implementation**

Create `js/presets.js`:

```js
const STORAGE_KEY = 'exercisePresets';

export function getPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function savePresets(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

export function addPreset(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const presets = getPresets();
  if (presets.some(p => p.toLowerCase() === trimmed.toLowerCase())) return;
  presets.push(trimmed);
  savePresets(presets);
}

export function removePreset(name) {
  const presets = getPresets().filter(p => p.toLowerCase() !== name.toLowerCase());
  savePresets(presets);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Attaches an autocomplete dropdown to a text input.
 * Wraps the input in a .autocomplete-wrap div and appends a
 * .autocomplete-dropdown div. Shows up to 6 matching presets on input.
 * Tapping a suggestion fills the input (user still clicks Add to confirm).
 */
export function attachAutocomplete(input) {
  const wrap = document.createElement('div');
  wrap.className = 'autocomplete-wrap';
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.hidden = true;
  wrap.appendChild(dropdown);

  function updateDropdown() {
    const val = input.value.trim().toLowerCase();
    const matches = val
      ? getPresets().filter(p => p.toLowerCase().includes(val)).slice(0, 6)
      : [];
    if (matches.length === 0) {
      dropdown.hidden = true;
      return;
    }
    dropdown.innerHTML = matches.map(p =>
      `<div class="autocomplete-item">${esc(p)}</div>`
    ).join('');
    dropdown.hidden = false;
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // prevent blur firing before mousedown completes
        input.value = item.textContent;
        dropdown.hidden = true;
      });
    });
  }

  input.addEventListener('input', updateDropdown);
  input.addEventListener('focus', updateDropdown);
  input.addEventListener('blur', () => {
    setTimeout(() => { dropdown.hidden = true; }, 150);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/presets.test.js
```

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/presets.js tests/presets.test.js
git commit -m "feat: add presets module with localStorage helpers and autocomplete"
```

---

## Task 2: CSS styles

### Files
- Modify: `css/styles.css`

- [ ] **Step 1: Append styles**

At the end of `css/styles.css`, after the last rule (`.chart-svg { display: block; width: 100%; height: 220px; }`), append:

```css
/* ── Exercise presets & autocomplete ── */
.autocomplete-wrap { position: relative; flex: 1; min-width: 0; }
.autocomplete-dropdown {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--surface); border: 1px solid var(--surface2);
  border-radius: 10px; z-index: 200; overflow: hidden;
  margin-top: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.autocomplete-item {
  padding: 12px 14px; font-size: 15px; cursor: pointer;
  border-bottom: 1px solid var(--surface2);
}
.autocomplete-item:last-child { border-bottom: none; }
.autocomplete-item:active { background: var(--surface2); }
.preset-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid var(--surface2);
}
.preset-row:last-child { border-bottom: none; }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "feat: add autocomplete and preset-row CSS"
```

---

## Task 3: Preset management card on Templates tab

### Files
- Modify: `js/templates.js`

The current `js/templates.js` renders a template list, an empty state, and a FAB button. We add an "Exercise Presets" card after the FAB.

- [ ] **Step 1: Add import**

At the top of `js/templates.js`, replace:

```js
import { listTemplates } from './db.js';
import { navigate } from './router.js';
```

with:

```js
import { listTemplates } from './db.js';
import { navigate } from './router.js';
import { getPresets, addPreset, removePreset } from './presets.js';
```

- [ ] **Step 2: Add the esc helper and presets card to renderTemplates**

Replace the entire `renderTemplates` function with:

```js
export async function renderTemplates(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const templates = await listTemplates();

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let html = `<div class="screen-header"><h1>Templates</h1></div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Tap + to create one.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-list-card" data-id="${esc(t.id)}">
        <div>
          <div style="font-weight:600;">${esc(t.name)}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `<button class="fab" id="new-btn">+</button>`;

  html += `
    <div class="card" style="margin:12px;margin-bottom:80px;" id="presets-card">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Exercise Presets</div>
      <div id="preset-list"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <input type="text" id="preset-input" placeholder="Add preset name...">
        <button class="btn btn-primary btn-sm" id="preset-add-btn">Add</button>
      </div>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.template-list-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#template-edit?id=${card.dataset.id}`));
  });

  container.querySelector('#new-btn').addEventListener('click', () => navigate('#template-edit'));

  function renderPresets() {
    const presets = getPresets();
    const list = container.querySelector('#preset-list');
    if (presets.length === 0) {
      list.innerHTML = '<div class="empty" style="padding:16px 0;font-size:14px;">No presets yet</div>';
    } else {
      list.innerHTML = presets.map(p => `
        <div class="preset-row">
          <span>${esc(p)}</span>
          <button class="btn btn-danger btn-sm preset-remove-btn" data-name="${esc(p)}">✕</button>
        </div>
      `).join('');
      list.querySelectorAll('.preset-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          removePreset(btn.dataset.name);
          renderPresets();
        });
      });
    }
  }

  renderPresets();

  container.querySelector('#preset-add-btn').addEventListener('click', () => {
    const input = container.querySelector('#preset-input');
    const name = input.value.trim();
    if (!name) return;
    addPreset(name);
    input.value = '';
    renderPresets();
  });

  container.querySelector('#preset-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') container.querySelector('#preset-add-btn').click();
  });

  window.addEventListener('sync-complete', () => renderTemplates(container), { once: true });
}
```

- [ ] **Step 3: Verify manually**

Open the app → Templates tab. Confirm:
- "Exercise Presets" card appears at the bottom below the template list
- Typing a name and tapping Add adds it to the list
- Tapping ✕ removes it immediately
- "No presets yet" shows when the list is empty

- [ ] **Step 4: Commit**

```bash
git add js/templates.js
git commit -m "feat: add exercise presets management card to Templates tab"
```

---

## Task 4: Autocomplete on template-edit page

### Files
- Modify: `js/template-edit.js`

The template-edit page has a `#new-ex-input` text field inside a flex row. We import `attachAutocomplete` and call it inside `attachEvents()`, which runs after every re-render.

- [ ] **Step 1: Add import**

At the top of `js/template-edit.js`, replace:

```js
import { getTemplate, saveTemplate, deleteTemplate, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
```

with:

```js
import { getTemplate, saveTemplate, deleteTemplate, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
import { attachAutocomplete } from './presets.js';
```

- [ ] **Step 2: Attach autocomplete in attachEvents**

In `js/template-edit.js`, inside the `attachEvents` function, add at the very end (after the `if (deleteBtn) { ... }` block and before the closing `}`):

```js
    // Attach autocomplete to the new-exercise input
    attachAutocomplete(container.querySelector('#new-ex-input'));
```

The full `attachEvents` function closing should look like:

```js
    // Delete
    const deleteBtn = container.querySelector('#delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this template?')) return;
        await deleteTemplate(template.id);
        await addToSyncQueue({ action: 'deleteTemplate', id: template.id });
        flushQueue();
        navigate('#templates');
      });
    }

    // Autocomplete for new exercise input
    attachAutocomplete(container.querySelector('#new-ex-input'));
  }
```

- [ ] **Step 3: Verify manually**

Open the app → Templates tab → tap a template (or create one) → on the edit page, tap the "Add exercise name..." input. Type a few letters of a preset you created in Task 3. Confirm the dropdown appears with matching suggestions. Tap a suggestion — it fills the input. Tap Add — exercise is added.

- [ ] **Step 4: Commit**

```bash
git add js/template-edit.js
git commit -m "feat: add preset autocomplete to template-edit exercise input"
```

---

## Task 5: Inline exercise input + autocomplete on workout page

### Files
- Modify: `js/workout.js`

Currently the workout page has a `+ Add exercise` button that calls `prompt()`. We replace it with a text input + button + autocomplete.

- [ ] **Step 1: Add import**

At the top of `js/workout.js`, replace:

```js
import { saveWorkout, addToSyncQueue, listWorkouts } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
import { formatRestTime } from './timer-utils.js';
import { buildExerciseStats } from './workout-stats.js';
```

with:

```js
import { saveWorkout, addToSyncQueue, listWorkouts } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
import { formatRestTime } from './timer-utils.js';
import { buildExerciseStats } from './workout-stats.js';
import { attachAutocomplete } from './presets.js';
```

- [ ] **Step 2: Replace the "+ Add exercise" button HTML with an inline form**

In `js/workout.js`, in the `render` function, replace:

```js
  // Add exercise button (free-form)
  html += `<div style="padding:8px 12px 0; display:flex; gap:8px; flex-wrap:wrap;">
    <button class="btn btn-ghost btn-sm" id="add-ex-btn">+ Add exercise</button>
  </div>`;
```

with:

```js
  // Add exercise inline form (replaces prompt)
  html += `<div style="padding:8px 12px 0; display:flex; gap:8px; align-items:center;">
    <input type="text" id="add-ex-input" placeholder="Exercise name..." style="flex:1;min-width:0;padding:10px;font-size:15px;">
    <button class="btn btn-ghost btn-sm" id="add-ex-btn" style="white-space:nowrap;">+ Add</button>
  </div>`;
```

- [ ] **Step 3: Replace the add-exercise event handler and attach autocomplete**

In `js/workout.js`, in the `render` function, replace:

```js
  // Add exercise (free-form)
  container.querySelector('#add-ex-btn').addEventListener('click', () => {
    const name = prompt('Exercise name:');
    if (!name || !name.trim()) return;
    state.exercises.push({ exercise_name: name.trim(), sets: [{ weight_kg: '', reps: '' }] });
    saveState(state);
    render(container, state, exerciseStats);
  });
```

with:

```js
  // Add exercise inline form
  function doAddExercise() {
    const input = container.querySelector('#add-ex-input');
    const name = input.value.trim();
    if (!name) return;
    state.exercises.push({ exercise_name: name, sets: [{ weight_kg: '', reps: '' }] });
    saveState(state);
    render(container, state, exerciseStats);
  }
  container.querySelector('#add-ex-btn').addEventListener('click', doAddExercise);
  container.querySelector('#add-ex-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doAddExercise();
  });
  attachAutocomplete(container.querySelector('#add-ex-input'));
```

- [ ] **Step 4: Verify manually**

Open the app → start a workout. Confirm:
- A text input and "+ Add" button appear at the top below the header (instead of the old "+ Add exercise" button)
- Typing exercise letters shows matching presets in a dropdown
- Tapping a suggestion fills the input
- Tapping "+ Add" or pressing Enter adds the exercise to the workout
- The rest of the workout page (sets, rest timer, finish) still works

- [ ] **Step 5: Commit**

```bash
git add js/workout.js
git commit -m "feat: replace prompt with inline input and preset autocomplete on workout page"
```

---

## Task 6: Service worker cache + full test suite

### Files
- Modify: `sw.js`

- [ ] **Step 1: Add presets.js to SW cache and bump version**

In `sw.js`, replace:

```js
const CACHE = 'workout-journal-v6';
```

with:

```js
const CACHE = 'workout-journal-v7';
```

And after `BASE + '/js/workout-stats.js',`, add:

```js
  BASE + '/js/presets.js',
```

The updated SHELL block should read:

```js
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
  BASE + '/js/workout-stats.js',
  BASE + '/js/presets.js',
  BASE + '/js/templates.js',
  BASE + '/js/template-edit.js',
  BASE + '/js/history.js',
  BASE + '/js/history-detail.js',
  BASE + '/js/progress.js',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];
```

- [ ] **Step 2: Run the full test suite**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

Expected: all tests PASS (db.test.js, timer-utils.test.js, workout-stats.test.js, presets.test.js — 24+ tests)

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "fix: add presets.js to SW cache, bump to v7"
```
