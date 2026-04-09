# Collapsible Exercise Cards

**Date:** 2026-04-09

## Overview

During an active workout, exercise cards (`.ex-card`) can be collapsed by tapping the card header. Collapsed cards show only the header row; set rows are hidden. State survives re-renders within the session.

## State

A module-level `Set<number>` called `collapsedExercises` in `js/workout.js` tracks collapsed exercise indices (`ei`). It is declared at module scope alongside `timerInterval` and `restTimerState`. It is never reset during re-renders. It is cleared in `stopTimer()` so it resets when the workout ends or is discarded.

## Rendering

In the `render` loop over `state.exercises`, check `collapsedExercises.has(ei)`:
- If **collapsed**: render the header only (no `.set-row` elements).
- If **expanded** (default): render header + all set rows as today.

The `+ Set` button remains in the header in both states so the user can add a set without expanding first.

A chevron character in the header indicates state:
- Expanded: `▾`
- Collapsed: `▸`

## Interaction

- `.ex-card-header` gets a click listener that toggles `ei` in `collapsedExercises` and calls `render(container, state)`.
- The `+ Set` button calls `e.stopPropagation()` to prevent the header click from firing when adding a set.

## CSS

Add `cursor: pointer` to `.ex-card-header`. No other CSS changes required.

## Files Changed

- `js/workout.js` — add `collapsedExercises` Set, update `render`, header click handler, `+ Set` stopPropagation, clear in `stopTimer`
- `css/styles.css` — add `cursor: pointer` to `.ex-card-header`
