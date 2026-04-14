# Rest Timer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the rest timer button into the workout page header so it is always visible at the top, turning red only on the button itself when a rest is active.

**Architecture:** Two small, isolated changes — CSS adds two new classes for the header rest button states, and `workout.js` moves the button element into the header HTML string, removes it from the footer, and toggles `rest-active` class instead of only mutating text. No new modules, no new state.

**Tech Stack:** Vanilla JS ES modules, plain CSS custom properties. No test framework — verification is manual via browser.

---

## File Map

| File | Change |
|------|--------|
| `css/styles.css` | Add `.rest-header-btn` (idle style) and `.rest-header-btn.rest-active` (red style) after line 149 |
| `js/workout.js` | Move `#rest-timer-btn` into header HTML (line ~44–49); remove from footer (line ~95–99); add `rest-active` class toggle on start/cancel/expiry; fix restore-on-render block |

---

### Task 1: Add CSS classes for header rest button

**Files:**
- Modify: `css/styles.css` (after line 149, after `.rest-timer-flash`)

- [ ] **Step 1: Add the two new CSS rules**

Open `css/styles.css`. After line 149 (`.rest-timer-flash { animation: rest-timer-flash 1s ease-out; }`), insert:

```css
.rest-header-btn {
  background: rgba(0, 188, 212, 0.18);
  color: var(--accent);
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 10px;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}
.rest-header-btn.rest-active {
  background: #c0392b;
  color: #fff;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "style: add rest header button idle and active classes"
```

---

### Task 2: Move rest button into header and wire active state

**Files:**
- Modify: `js/workout.js`

There are four sub-changes, all in `workout.js`. Make them all before committing.

- [ ] **Step 1: Add rest button to header HTML**

In the `render` function, find the header HTML block (around lines 44–49):

```js
  let html = `
    <div class="screen-header">
      <button class="back-btn" id="discard-btn">✕</button>
      <h1>${state.templateName || 'Free-form'}</h1>
      <span class="timer-badge" id="workout-timer">${elapsed}</span>
    </div>`;
```

Replace with:

```js
  let html = `
    <div class="screen-header">
      <button class="back-btn" id="discard-btn">✕</button>
      <h1>${state.templateName || 'Free-form'}</h1>
      <span class="timer-badge" id="workout-timer">${elapsed}</span>
      <button class="rest-header-btn" id="rest-timer-btn">Rest 2:00</button>
    </div>`;
```

- [ ] **Step 2: Remove rest button from footer**

Find the footer HTML block (around lines 95–99):

```js
  html += `
    <div style="padding:16px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-ghost btn-full" id="rest-timer-btn">Rest 2:00</button>
      <button class="btn btn-primary btn-full" id="finish-btn">Finish Workout</button>
    </div>`;
```

Replace with:

```js
  html += `
    <div style="padding:16px;">
      <button class="btn btn-primary btn-full" id="finish-btn">Finish Workout</button>
    </div>`;
```

- [ ] **Step 3: Fix the restore-on-render block**

Find the restore block (around lines 103–108):

```js
  // Restore rest button label if countdown is running
  if (restTimerState.interval && restTimerState.endTime) {
    const remaining = Math.ceil((restTimerState.endTime - Date.now()) / 1000);
    const restBtn = container.querySelector('#rest-timer-btn');
    if (restBtn && remaining > 0) restBtn.textContent = `Rest ${formatRestTime(remaining)}`;
  }
```

Replace with:

```js
  // Restore rest button state if countdown is running
  if (restTimerState.interval && restTimerState.endTime) {
    const remaining = Math.ceil((restTimerState.endTime - Date.now()) / 1000);
    const restBtn = container.querySelector('#rest-timer-btn');
    if (restBtn && remaining > 0) {
      restBtn.textContent = `✕ ${formatRestTime(remaining)}`;
      restBtn.classList.add('rest-active');
    }
  }
```

- [ ] **Step 4: Update the click handler — start branch**

In the click handler for `#rest-timer-btn`, find the `else` branch (timer start, around lines 127–135):

```js
    } else {
      // Start 2-minute countdown using end timestamp so background throttling doesn't drift
      restTimerState.endTime = Date.now() + 120 * 1000;
      try {
        restTimerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext unavailable:', e);
      }
      restBtn.textContent = `Rest ${formatRestTime(120)}`;
      restTimerState.interval = setInterval(() => {
```

Replace the `restBtn.textContent` line only:

```js
      restBtn.textContent = `✕ ${formatRestTime(120)}`;
      restBtn.classList.add('rest-active');
```

So the full else branch becomes:

```js
    } else {
      // Start 2-minute countdown using end timestamp so background throttling doesn't drift
      restTimerState.endTime = Date.now() + 120 * 1000;
      try {
        restTimerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext unavailable:', e);
      }
      restBtn.textContent = `✕ ${formatRestTime(120)}`;
      restBtn.classList.add('rest-active');
      restTimerState.interval = setInterval(() => {
```

- [ ] **Step 5: Update the click handler — cancel branch**

In the same click handler, find the `if (restTimerState.interval)` cancel branch (around lines 120–126):

```js
    if (restTimerState.interval) {
      // Cancel running timer
      clearInterval(restTimerState.interval);
      restTimerState.interval = null;
      restTimerState.endTime = null;
      if (restTimerState.audioCtx) { restTimerState.audioCtx.close(); restTimerState.audioCtx = null; }
      restBtn.textContent = 'Rest 2:00';
    } else {
```

Replace with:

```js
    if (restTimerState.interval) {
      // Cancel running timer
      clearInterval(restTimerState.interval);
      restTimerState.interval = null;
      restTimerState.endTime = null;
      if (restTimerState.audioCtx) { restTimerState.audioCtx.close(); restTimerState.audioCtx = null; }
      restBtn.textContent = 'Rest 2:00';
      restBtn.classList.remove('rest-active');
    } else {
```

- [ ] **Step 6: Update the interval tick — countdown text and expiry reset**

Inside the `setInterval` callback, find the two places that set `btn.textContent`:

**Expiry (remaining <= 0), around lines 140–161:**

```js
          btn.textContent = 'Rest 2:00';
```

Replace with:

```js
          btn.textContent = 'Rest 2:00';
          btn.classList.remove('rest-active');
```

**Countdown tick (else branch), around line 163:**

```js
          btn.textContent = `Rest ${formatRestTime(remaining)}`;
```

Replace with:

```js
          btn.textContent = `✕ ${formatRestTime(remaining)}`;
```

- [ ] **Step 7: Commit**

```bash
git add js/workout.js
git commit -m "feat: move rest button into header, turn red when active"
```

---

### Task 3: Manual smoke test

- [ ] **Step 1: Serve the app**

```bash
npx serve . -p 3000
```

Open `http://localhost:3000` in a browser and start a workout.

- [ ] **Step 2: Verify idle state**

The header should show: `[✕]  Workout Name  1:23  [Rest 2:00]`

The "Rest 2:00" button should be a small teal/cyan pill in the top-right of the header. No rest button should appear in the footer — only "Finish Workout".

- [ ] **Step 3: Verify active state**

Tap "Rest 2:00". The button should immediately turn red and show `✕ 1:59` (counting down). The header background stays dark. The countdown should tick every second.

- [ ] **Step 4: Verify cancel**

While the timer is running, tap the red button. It should stop immediately and return to the teal "Rest 2:00" pill.

- [ ] **Step 5: Verify expiry**

Start the timer. Wait for it to reach 0 (or temporarily change `120 * 1000` to `5 * 1000` in `workout.js` for a 5-second test, then revert). At expiry: the button should flash (teal flash animation), the vibration/beep should fire, and the button should reset to teal "Rest 2:00". Revert any temporary change.

- [ ] **Step 6: Verify re-render preserves state**

Start the timer. Tap `+ Set` on any exercise (triggers a `render()` call). The header button should still be red and still counting down from where it was.
