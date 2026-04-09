# Collapsible Exercise Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tap an exercise card header during an active workout to collapse/expand it, hiding or showing the set rows.

**Architecture:** A module-level `Set<number>` tracks which exercise indices are collapsed. The `render` function checks membership to skip set rows. Header click toggles membership and re-renders. State clears when the workout ends.

**Tech Stack:** Vanilla JS ES modules, CSS custom properties. No new dependencies.

---

## File Map

- Modify: `js/workout.js` — add `collapsedExercises` Set, update render loop, add header click handler, stopPropagation on "+ Set", clear on stop
- Modify: `css/styles.css` — add `cursor: pointer` to `.ex-card-header`

> Note: `workout.js` uses DOM APIs and browser globals (`localStorage`, `navigator`, etc.) that don't run in the Jest/Node environment. The existing test suite only covers pure utility functions (`timer-utils.test.js`, `db.test.js`). This feature follows the same pattern — no automated tests; verify manually in the browser.

---

### Task 1: Add `collapsedExercises` Set and wire up collapse in render

**Files:**
- Modify: `js/workout.js`

- [ ] **Step 1: Add the `collapsedExercises` Set at module scope**

In `js/workout.js`, after the existing module-level variables (lines 6-7), add:

```js
let timerInterval = null;
const restTimerState = { interval: null, endTime: null };
const collapsedExercises = new Set();
```

- [ ] **Step 2: Update the exercise render loop to skip set rows when collapsed**

Replace the existing `state.exercises.forEach` block (lines 40-57) with:

```js
state.exercises.forEach((ex, ei) => {
  const isCollapsed = collapsedExercises.has(ei);
  html += `
    <div class="ex-card" data-ei="${ei}">
      <div class="ex-card-header" data-ei="${ei}">
        <span class="ex-card-name">${isCollapsed ? '▸' : '▾'} ${ex.exercise_name}</span>
        <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
      </div>`;
  if (!isCollapsed) {
    ex.sets.forEach((s, si) => {
      html += `
        <div class="set-row" data-ei="${ei}" data-si="${si}">
          <span class="set-num">${si + 1}</span>
          <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight_kg}" data-field="weight_kg" data-ei="${ei}" data-si="${si}">
          <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-field="reps" data-ei="${ei}" data-si="${si}">
          <button class="set-log-btn ${s.logged ? 'logged' : ''}" data-ei="${ei}" data-si="${si}">✓</button>
        </div>`;
    });
  }
  html += `</div>`;
});
```

- [ ] **Step 3: Add header click handler and stopPropagation on "+ Set"**

In the event-binding section of `render`, after the `// Add set` block, add a header collapse handler. Also update the existing `add-set-btn` handler to stop propagation.

Replace the existing `// Add set` block:

```js
  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ei = +btn.dataset.ei;
      state.exercises[ei].sets.push({ weight_kg: '', reps: '', logged: false });
      saveState(state);
      render(container, state);
    });
  });
```

Then add the header toggle handler after it:

```js
  // Collapse/expand on header tap
  container.querySelectorAll('.ex-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const ei = +header.dataset.ei;
      if (collapsedExercises.has(ei)) {
        collapsedExercises.delete(ei);
      } else {
        collapsedExercises.add(ei);
      }
      render(container, state);
    });
  });
```

- [ ] **Step 4: Clear `collapsedExercises` in `stopTimer`**

In the `stopTimer` function (currently lines 196-201), add the clear call:

```js
function stopTimer() {
  stopWorkoutTimer();
  clearInterval(restTimerState.interval);
  restTimerState.interval = null;
  restTimerState.endTime = null;
  collapsedExercises.clear();
}
```

- [ ] **Step 5: Commit**

```bash
git add js/workout.js
git commit -m "feat: collapse exercise cards on header tap"
```

---

### Task 2: Add cursor style to `.ex-card-header` in CSS

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 1: Add `cursor: pointer` to `.ex-card-header`**

In `css/styles.css`, the `.ex-card-header` rule is at line 120:

```css
.ex-card-header { padding: 14px 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; }
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "style: pointer cursor on collapsible exercise card header"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Open the app in the browser and start a workout with multiple exercises**

- [ ] **Step 2: Tap an exercise card header — set rows should disappear and chevron should change from ▾ to ▸**

- [ ] **Step 3: Tap the header again — set rows should reappear and chevron should return to ▾**

- [ ] **Step 4: Collapse a card, then tap "+ Set" on a collapsed card — set should be added without expanding the card**

- [ ] **Step 5: Collapse a card, then tap "+ Add exercise" — the collapsed card should remain collapsed after re-render**

- [ ] **Step 6: Collapse a card, finish the workout, start a new workout — all cards should start expanded**
