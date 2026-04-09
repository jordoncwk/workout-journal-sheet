# Exercise History Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each exercise's all-time best set and last-session best set as a subtitle line in the exercise card header on the active workout page.

**Architecture:** Extract a pure `buildExerciseStats` helper into `js/workout-stats.js` so it can be unit-tested in isolation. Make `renderWorkout` async — it loads all saved workouts once, calls the helper to build a stats map, then passes it into `render`. The render function adds a `.ex-stats` subtitle line below each exercise name.

**Tech Stack:** Vanilla JS (ES modules), IndexedDB via existing `listWorkouts()`, Jest for tests, CSS custom properties already defined in `styles.css`.

---

## File Map

- **Create:** `js/workout-stats.js` — pure `buildExerciseStats(workouts, exerciseNames)` function, no imports
- **Create:** `tests/workout-stats.test.js` — unit tests for the helper
- **Modify:** `js/workout.js` — import helper, make `renderWorkout` async, thread stats into `render`, render `.ex-stats` span
- **Modify:** `css/styles.css` — add `.ex-stats` rule

---

## Task 1: Pure stats helper + tests

### Files
- Create: `js/workout-stats.js`
- Create: `tests/workout-stats.test.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/workout-stats.test.js`:

```js
import { buildExerciseStats } from '../js/workout-stats.js';

const workouts = [
  {
    id: 'w1',
    finishedAt: 1000,
    exercises: [
      { exercise_name: 'Bench Press', sets: [{ weight_kg: 80, reps: 8 }, { weight_kg: 90, reps: 5 }] },
    ],
  },
  {
    id: 'w2',
    finishedAt: 2000,
    exercises: [
      { exercise_name: 'Bench Press', sets: [{ weight_kg: 85, reps: 6 }] },
      { exercise_name: 'Squat', sets: [{ weight_kg: 100, reps: 5 }] },
    ],
  },
];

test('best set is heaviest weight', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  expect(stats['bench press'].best).toEqual({ weight_kg: 90, reps: 5 });
});

test('best set tiebreaks on most reps', () => {
  const ws = [{ id: 'w1', finishedAt: 1000, exercises: [
    { exercise_name: 'OHP', sets: [{ weight_kg: 60, reps: 5 }, { weight_kg: 60, reps: 8 }] },
  ]}];
  const stats = buildExerciseStats(ws, ['ohp']);
  expect(stats['ohp'].best).toEqual({ weight_kg: 60, reps: 8 });
});

test('last is best set from most recent workout containing exercise', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  // w2 is more recent (finishedAt: 2000), only one set: 85kg×6
  expect(stats['bench press'].last).toEqual({ weight_kg: 85, reps: 6 });
});

test('exercise name matching is case-insensitive', () => {
  const stats = buildExerciseStats(workouts, ['BENCH PRESS']);
  expect(stats['bench press'].best).toEqual({ weight_kg: 90, reps: 5 });
});

test('returns null for exercise with no history', () => {
  const stats = buildExerciseStats(workouts, ['deadlift']);
  expect(stats['deadlift'].best).toBeNull();
  expect(stats['deadlift'].last).toBeNull();
});

test('exercise not in active workout is not included in result', () => {
  const stats = buildExerciseStats(workouts, ['bench press']);
  expect(stats['squat']).toBeUndefined();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/workout-stats.test.js
```

Expected: multiple failures — `Cannot find module '../js/workout-stats.js'`

- [ ] **Step 3: Write the implementation**

Create `js/workout-stats.js`:

```js
/**
 * Builds a stats map for each exercise in the active workout.
 * @param {Array} workouts - All saved workout objects from history
 * @param {string[]} exerciseNames - Exercise names in the current active workout
 * @returns {Object} Map keyed by lowercased exercise name:
 *   { best: { weight_kg, reps } | null, last: { weight_kg, reps } | null }
 */
export function buildExerciseStats(workouts, exerciseNames) {
  const result = {};

  for (const rawName of exerciseNames) {
    const key = rawName.toLowerCase();
    if (key in result) continue;

    let best = null;
    let lastWorkoutTime = -1;
    let last = null;

    for (const workout of workouts) {
      for (const ex of workout.exercises) {
        if (ex.exercise_name.toLowerCase() !== key) continue;

        for (const set of ex.sets) {
          // Update best: heaviest weight, tiebreak most reps
          if (
            best === null ||
            set.weight_kg > best.weight_kg ||
            (set.weight_kg === best.weight_kg && set.reps > best.reps)
          ) {
            best = { weight_kg: set.weight_kg, reps: set.reps };
          }
        }

        // Update last: from most recent workout containing this exercise
        if (workout.finishedAt > lastWorkoutTime) {
          lastWorkoutTime = workout.finishedAt;
          // Pick best set from this session
          last = null;
          for (const set of ex.sets) {
            if (
              last === null ||
              set.weight_kg > last.weight_kg ||
              (set.weight_kg === last.weight_kg && set.reps > last.reps)
            ) {
              last = { weight_kg: set.weight_kg, reps: set.reps };
            }
          }
        }
      }
    }

    result[key] = { best, last };
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/workout-stats.test.js
```

Expected: all 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/workout-stats.js tests/workout-stats.test.js
git commit -m "feat: add buildExerciseStats pure helper"
```

---

## Task 2: Wire stats into renderWorkout

### Files
- Modify: `js/workout.js`

- [ ] **Step 1: Add imports and make renderWorkout async**

At the top of `js/workout.js`, update the db.js import (line 1) to add `listWorkouts`:

```js
import { saveWorkout, addToSyncQueue, listWorkouts } from './db.js';
```

Then add the workout-stats import after the existing imports (after line 4):

```js
import { buildExerciseStats } from './workout-stats.js';
```

Replace the `renderWorkout` function (lines 10–16):

```js
export async function renderWorkout(container) {
  const state = getState();
  if (!state) { navigate('#home'); return; }

  stopWorkoutTimer();
  const allWorkouts = await listWorkouts();
  const exerciseNames = state.exercises.map(ex => ex.exercise_name);
  const exerciseStats = buildExerciseStats(allWorkouts, exerciseNames);
  render(container, state, exerciseStats);
}
```

- [ ] **Step 2: Update render signature to accept stats**

Change the `render` function signature from:

```js
function render(container, state) {
```

to:

```js
function render(container, state, exerciseStats = {}) {
```

- [ ] **Step 3: Add the stats subtitle to each exercise card header**

Inside `render`, find the section that builds each exercise card (around line 43–48). Replace it with:

```js
  state.exercises.forEach((ex, ei) => {
    const isCollapsed = collapsedExercises.has(ei);
    const stats = exerciseStats[ex.exercise_name.toLowerCase()];
    let statsHtml = '';
    if (stats && (stats.best || stats.last)) {
      const bestStr = stats.best ? `Best ${stats.best.weight_kg}kg×${stats.best.reps}` : '';
      const lastStr = stats.last ? `Last ${stats.last.weight_kg}kg×${stats.last.reps}` : '';
      const parts = [bestStr, lastStr].filter(Boolean);
      statsHtml = `<span class="ex-stats">${parts.join(' · ')}</span>`;
    }
    html += `
      <div class="ex-card" data-ei="${ei}">
        <div class="ex-card-header" data-ei="${ei}">
          <span class="ex-card-name">${isCollapsed ? '▸' : '▾'} ${ex.exercise_name}</span>
          ${statsHtml}
          <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
        </div>`;
```

- [ ] **Step 4: Pass exerciseStats through all internal render calls**

There are two places inside `render` that call `render(container, state)` recursively (add set button and collapse/expand). Update both to pass `exerciseStats`:

Find (line ~157):
```js
      render(container, state);
```
in the add-set-btn handler — replace with:
```js
      render(container, state, exerciseStats);
```

Find (line ~170):
```js
      render(container, state);
```
in the collapse/expand handler — replace with:
```js
      render(container, state, exerciseStats);
```

- [ ] **Step 5: Verify the app loads without errors**

Open `index.html` in a browser (or dev server). Start a workout and confirm:
- No console errors
- Exercises with history show a subtitle line, e.g. `Best 90kg×5 · Last 85kg×6`
- Exercises with no history show no subtitle line
- Adding a set and collapsing/expanding still works

- [ ] **Step 6: Commit**

```bash
git add js/workout.js
git commit -m "feat: wire exercise history stats into active workout render"
```

---

## Task 3: Style the stats subtitle

### Files
- Modify: `css/styles.css`

- [ ] **Step 1: Add the .ex-stats rule**

After the `.ex-card-name` rule (line 121 of `css/styles.css`), add:

```css
.ex-stats { font-size: 11px; color: var(--text-muted); display: block; padding: 0 0 4px 20px; }
```

- [ ] **Step 2: Verify visually**

Open the active workout page. Confirm:
- Stats text is small and muted (grey, matching other muted text)
- It sits on its own line below the exercise name, indented to align under the name (past the arrow)
- The `+ Set` button remains right-aligned in the header

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: style exercise history stats subtitle"
```

---

## Task 4: Run full test suite

- [ ] **Step 1: Run all tests**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

Expected: all tests PASS (db.test.js, timer-utils.test.js, workout-stats.test.js)

- [ ] **Step 2: Commit if any fixup needed**

If any test failures found, fix and commit:
```bash
git add <files>
git commit -m "fix: <description of fix>"
```
