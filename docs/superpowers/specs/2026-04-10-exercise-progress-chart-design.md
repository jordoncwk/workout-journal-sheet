# Exercise Progress Chart on Progress Page

**Date:** 2026-04-10
**Status:** Approved

## Overview

Add an exercise progress chart to the Progress page. The user selects an exercise from a dropdown and sees an SVG line chart of their best weight per session over time.

## Data Layer

A new pure function `buildExerciseHistory(workouts, exerciseName)` is added to `js/workout-stats.js`.

**Input:**
- `workouts` — all saved workout objects from IndexedDB (same format as `listWorkouts()` returns)
- `exerciseName` — string, matched case-insensitively

**Output:** `Array<{ date: number, weight_kg: number, reps: number }>` sorted chronologically (oldest first), one entry per workout session that included the exercise. Each entry is the best set from that session: heaviest weight, tiebreak most reps.

**Algorithm:**
1. Filter workouts to those containing the exercise (case-insensitive name match)
2. For each matching workout, find the best set (max weight, tiebreak max reps)
3. Return `{ date: workout.finishedAt, weight_kg, reps }` sorted by `date` ascending
4. If no matching workouts, return `[]`

## UI

The Progress page gains an "Exercise Progress" card inserted above the existing Stats card.

**Card contents:**
- A `<select>` dropdown listing all exercise names that appear anywhere in history, sorted alphabetically
- A default empty option: "Select exercise..."
- Below the dropdown: an SVG line chart (height: 220px, width: 100% of card)

**Chart behaviour:**
- Renders when an exercise with ≥1 data point is selected
- If only 1 data point: single dot + weight label, no line
- If 0 data points or no selection: placeholder text "No data for this exercise"
- Chart updates immediately on dropdown change (no page reload)

**Chart layout:**
- Padding: 32px top, 24px bottom, 40px left, 16px right (room for axis labels)
- Y axis: weight in kg. Range = `[floor(minWeight - padding), ceil(maxWeight + padding)]` where padding is 5% of the range (min 2.5kg). 4–5 evenly spaced gridlines with kg labels on the left.
- X axis: session dates evenly spaced along the bottom. Labels: abbreviated date "Apr 1" format. Labels shown for all points; if more than 6 points, show only first, last, and evenly sampled intermediates to avoid overlap.
- Line: single polyline connecting all dots, stroke `var(--accent)`, stroke-width 2, no fill
- Dots: circle r=4, fill `var(--accent)`
- Weight label above each dot: font-size 10px, color `var(--text)`, centered on dot x, offset 10px above dot

## Styling

New CSS classes in `css/styles.css`:
- `.chart-select` — full-width select styled consistently with existing inputs, margin-bottom 12px
- `.chart-wrap` — `width: 100%; overflow-x: auto` (allows horizontal scroll if many data points)
- `.chart-svg` — `display: block; width: 100%; height: 220px`
- Chart gridlines: stroke `var(--surface2)`, stroke-width 1
- Axis labels: font-size 10px, fill `var(--text-muted)`

## Files Changed

- `js/workout-stats.js` — add `buildExerciseHistory(workouts, exerciseName)`
- `tests/workout-stats.test.js` — add tests for `buildExerciseHistory`
- `js/progress.js` — add exercise picker + SVG chart, import `buildExerciseHistory`
- `css/styles.css` — add `.chart-select`, `.chart-wrap`, `.chart-svg`
