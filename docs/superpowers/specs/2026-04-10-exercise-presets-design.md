# Exercise Presets Design

**Date:** 2026-04-10
**Status:** Approved

## Overview

Add an exercise preset list so users can quickly pick a common exercise name when adding an exercise, instead of typing from scratch. Presets appear as an inline autocomplete dropdown on both the active workout page and the template edit page. A management UI on the Templates tab lets users add and remove presets.

## Data Layer

Presets are stored in `localStorage` under the key `exercisePresets` as a JSON array of strings (exercise names), e.g. `["Bench Press", "Squat", "Deadlift"]`.

A new module `js/presets.js` exposes:
- `getPresets()` — returns the array, defaults to `[]` if nothing stored
- `savePresets(arr)` — serialises and writes the array to localStorage
- `addPreset(name)` — appends the name if not already present (case-insensitive dedup), saves
- `removePreset(name)` — removes the matching entry (case-insensitive), saves

No IndexedDB, no syncing. Presets are device-local config.

## Autocomplete Behavior

Both the workout page and template edit page get an autocomplete dropdown attached to their exercise name text input.

**Trigger:** Dropdown appears whenever the input has focus and the current value matches at least one preset (case-insensitive substring match). If the input is empty or nothing matches, the dropdown is hidden.

**Display:** Up to 6 matching presets shown as a list below the input, overlapping content below (absolute positioned). Each suggestion is a tappable row. Tapping a suggestion fills the input field; the user still taps "Add" to confirm adding the exercise.

**Dismissal:** Dropdown closes on input blur (with a short delay to allow tap on suggestion to register) or when the input is cleared.

## Active Workout Page Changes

The current `prompt('Exercise name:')` flow is replaced. The existing `+ Add exercise` button is replaced by an inline form: a text input, an "Add exercise" button, and the autocomplete dropdown beneath. The form is rendered in the same toolbar area below the screen header. Submitting with an empty input does nothing.

## Template Edit Page Changes

The existing `#new-ex-input` text field and "Add" button already exist at the bottom of the exercises card. The autocomplete dropdown is attached to `#new-ex-input`. No structural changes to the form — only the dropdown is added.

## Preset Management UI (Templates Tab)

A new "Exercise Presets" card is appended at the bottom of the Templates tab (below the template list and FAB). It contains:

- A section label: "Exercise Presets" (same style as other card labels)
- A list of current preset names, each row showing the name and a ✕ remove button
- An "empty" message if the list is empty: "No presets yet"
- A text input + "Add" button at the bottom of the card to add new presets
- Adding a duplicate name (case-insensitive) is silently ignored
- The list re-renders immediately on add/remove with no page reload

## Styling

New CSS classes in `css/styles.css`:
- `.autocomplete-wrap` — `position: relative` wrapper around the input+button row that contains the dropdown
- `.autocomplete-dropdown` — `position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid var(--surface2); border-radius: 10px; z-index: 200; overflow: hidden`
- `.autocomplete-item` — `padding: 12px 14px; font-size: 15px; cursor: pointer; border-bottom: 1px solid var(--surface2)`
- `.autocomplete-item:last-child` — `border-bottom: none`
- `.autocomplete-item:active` — `background: var(--surface2)`
- `.preset-row` — `display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--surface2)`
- `.preset-row:last-child` — `border-bottom: none`

## Files Changed

- **New:** `js/presets.js` — localStorage helpers
- **Modify:** `js/templates.js` — add "Exercise Presets" card
- **Modify:** `js/template-edit.js` — attach autocomplete to `#new-ex-input`
- **Modify:** `js/workout.js` — replace `prompt()` with inline input + autocomplete
- **Modify:** `css/styles.css` — autocomplete and preset-row styles
- **Modify:** `sw.js` — add `js/presets.js` to SHELL cache array, bump cache version
