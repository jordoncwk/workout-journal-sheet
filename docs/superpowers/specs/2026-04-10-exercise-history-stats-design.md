# Exercise History Stats on Active Workout Page

**Date:** 2026-04-10
**Status:** Approved

## Overview

During an active workout, show each exercise's all-time best set and last-session best set as a subtitle line inside the exercise card header. This gives the user their performance targets at a glance without any extra interaction.

## Data Layer

`renderWorkout` in `js/workout.js` is made async. Before rendering, it calls `listWorkouts()` once to load all historical workouts, then builds an `exerciseStats` map:

```js
// Map<string (lowercased exercise name), { best, last }>
// best: { weight_kg, reps }  — heaviest weight, tiebreak most reps, across all history
// last: { weight_kg, reps }  — best set from the most recent workout containing that exercise
```

**Best set algorithm:** Iterate all workouts × all exercises matching the name (case-insensitive) × all sets. Track the set with the highest `weight_kg`; on tie, prefer higher `reps`.

**Last session algorithm:** Among all workouts containing the exercise, find the one with the highest `finishedAt`. From that workout's matching exercise, pick the best set using the same weight-then-reps rule.

The current active workout is excluded from both calculations (only saved history counts).

`exerciseStats` is passed into `render(container, state, exerciseStats)`.

## UI

Inside each `.ex-card-header`, a subtitle `<span class="ex-stats">` is rendered immediately after the exercise name span:

```
▾ Bench Press
   Best 100kg×5 · Last 80kg×8
```

Format: `Best {weight}kg×{reps} · Last {weight}kg×{reps}`

- If no history exists for the exercise: the `.ex-stats` span is omitted entirely.
- If best and last are from the same workout, both are still shown (values may be identical).
- Weights are displayed as-is (no rounding beyond what's stored).

## Styling

New `.ex-stats` class in `css/styles.css`:
- `font-size: 11px`
- `color: var(--text-muted)` (or equivalent muted tone matching existing palette)
- `display: block` so it sits on its own line below the exercise name
- No bold, no interaction

## Files Changed

- `js/workout.js` — make `renderWorkout` async, add `buildExerciseStats(workouts, exercises)` helper, pass stats to `render`, render `.ex-stats` subtitle in exercise card header
- `css/styles.css` — add `.ex-stats` rule
