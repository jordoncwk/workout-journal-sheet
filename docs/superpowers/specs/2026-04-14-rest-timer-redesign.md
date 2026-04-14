# Rest Timer Redesign — Design Spec

**Date:** 2026-04-14

## Overview

Move the rest timer button from the bottom of the workout page into the screen header. The button is always visible in the header. When rest is active, only the button turns red — the header background stays dark. Tapping the button starts or cancels the timer.

## UI — Header Layout

### Idle state

```
[✕]  Workout Name  1:23  [Rest 2:00]
```

- The rest button sits on the far right of the header, after the elapsed timer badge.
- Styled as a small pill: `background: rgba(0,188,212,0.18); color: var(--accent)` (teal, matching the existing accent colour).

### Active state

```
[✕]  Workout Name  1:23  [✕ 1:47]
```

- The same button turns red: `background: #c0392b; color: #fff`.
- Label format: `✕ M:SS` (the ✕ prefix signals it can be tapped to cancel).
- The header background remains dark — no full-header colour change.

## Behaviour

| Trigger | Action |
|---------|--------|
| Tap idle button | Start 2-minute countdown. Button turns red. |
| Tap active button | Cancel timer. Button resets to teal "Rest 2:00". |
| Timer reaches 0 | Button flashes (existing `rest-timer-flash` animation). Vibration + audio beep fire (existing logic). Button resets to teal "Rest 2:00". |

All existing timer mechanics (end-timestamp approach, AudioContext beep, vibrate) are unchanged.

## Changes

### Removed

- The bottom ghost button `<button class="btn btn-ghost btn-full" id="rest-timer-btn">Rest 2:00</button>` is deleted.
- The `<div>` wrapper that contained it (alongside "Finish Workout") becomes a single-button flex div with only the finish button.

### HTML — screen header

The rest button is appended inside the `.screen-header` div:

```html
<div class="screen-header">
  <button class="back-btn" id="discard-btn">✕</button>
  <h1>${state.templateName || 'Free-form'}</h1>
  <span class="timer-badge" id="workout-timer">${elapsed}</span>
  <button class="rest-header-btn" id="rest-timer-btn">Rest 2:00</button>
</div>
```

The button uses a new class `rest-header-btn` (not `btn btn-ghost`) to keep styles isolated from the general button system.

### CSS — `css/styles.css`

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

### JS — `js/workout.js`

1. Move `<button id="rest-timer-btn">` into the header HTML string (see above).
2. Remove the bottom rest button from the footer div.
3. On timer **start**: add class `rest-active` to the button; update text to `✕ ${formatRestTime(120)}`.
4. On timer **cancel** or **expiry**: remove class `rest-active`; reset text to `Rest 2:00`.
5. The "restore on re-render" block (lines 104–108 in current `workout.js`) must also apply `rest-active` class if the timer is running when `render()` is called.

## Affected Files

| File | Change |
|------|--------|
| `js/workout.js` | Move rest button into header HTML; remove bottom rest button; toggle `rest-active` class instead of mutating text only |
| `css/styles.css` | Add `.rest-header-btn` and `.rest-header-btn.rest-active` |

## Out of Scope

- Changing the timer duration (stays 2 minutes).
- Any changes to the audio/vibration logic.
- Any changes to the "Finish Workout" button.
