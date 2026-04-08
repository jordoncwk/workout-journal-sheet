# Workout Journal PWA — Design Spec
**Date:** 2026-04-09

## Overview

Convert the existing Google Apps Script–embedded workout journal into a standalone PWA hosted on GitHub Pages, using the same tech stack as the Mandarin journal: vanilla ES modules, hash router, IndexedDB (offline-first), service worker, and GAS as a JSON API backend.

Existing workout data in Google Sheets is preserved — the PWA pulls it into IndexedDB on first load.

---

## Repo Structure

The existing `workoutjournalsheet` repo is reorganized:

```
workoutjournalsheet/
  gas/                   ← all current .gs files moved here
    Code.gs
    Database.gs
    History.gs
    Progress.gs
    Setup.gs
    Templates.gs
    Tests.gs
    Workout.gs
    appsscript.json
  js/
    app.js               ← entry point: registers routes, inits sync, starts router
    router.js            ← hash-based router (register, navigate, start)
    db.js                ← IndexedDB: templates, workouts, syncQueue
    sync.js              ← pull from GAS on load/online, flush write queue
    config.js            ← GAS_URL constant
    home.js              ← template picker / free-form start screen
    workout.js           ← active workout: exercises, set logging, rest timer
    templates.js         ← templates list
    template-edit.js     ← create/edit a template
    history.js           ← past workouts list
    history-detail.js    ← single workout breakdown
    progress.js          ← PRs + stats card
  css/
    styles.css           ← dark theme, CSS variables (mirrors Mandarin journal palette)
  icons/
    icon-192.png
    icon-512.png
  index.html             ← shell: <div id="app">, loads js/app.js as module
  manifest.json          ← PWA manifest
  sw.js                  ← service worker: cache-first shell, network-first data
```

GitHub Pages serves from the repo root. The `gas/` folder is for source reference — the GAS project remains bound to the existing Spreadsheet and is deployed from there.

---

## Data Model (IndexedDB)

Three object stores:

### `templates` (keyPath: `id`)
```js
{
  id,           // string UUID
  name,         // string
  updatedAt,    // timestamp ms
  exercises: [
    { exercise_name, default_sets, default_reps, order }
  ]
}
```

### `workouts` (keyPath: `id`)
```js
{
  id,               // string UUID
  templateId,       // string | null
  templateName,     // string
  startedAt,        // timestamp ms
  finishedAt,       // timestamp ms
  updatedAt,        // timestamp ms
  exercises: [
    {
      exercise_name,
      sets: [{ weight_kg, reps, logged }]
    }
  ]
}
```

### `syncQueue` (keyPath: `id`)
Pending upsert/delete operations not yet confirmed by GAS. Each entry is a copy of the record plus an optional `_deleted: true` flag to signal deletion. Same flush-on-write pattern as Mandarin journal.

### Active workout
Stored in `localStorage` as `activeWorkout` JSON. Transient — survives page reload, cleared on finish or discard. Not synced.

---

## GAS API

`gas/Code.gs` is rewritten to serve JSON only. `doGet` and `doPost` route to existing helper functions in `Database.gs`, `History.gs`, `Templates.gs`.

### GET
| Parameter | Response |
|---|---|
| `?action=getAll` | `{ ok: true, templates: [...], workouts: [...] }` |

### POST (JSON body)
| Action | Effect |
|---|---|
| `upsertWorkout` | Upsert to `_History` + `_Sets` sheets |
| `deleteWorkout` | Remove from `_History` + `_Sets` |
| `upsertTemplate` | Upsert to `_Templates` + `_TemplateExercises` |
| `deleteTemplate` | Remove from `_Templates` + `_TemplateExercises` |

`Database.gs`, `History.gs`, `Templates.gs`, `Progress.gs`, `Setup.gs` are otherwise unchanged.

---

## Screens & Routing

Hash-based router, same implementation as Mandarin journal.

| Route | Module | Description |
|---|---|---|
| `#home` | `home.js` | Default. Template picker or free-form start. |
| `#workout` | `workout.js` | Active workout: exercises, set logging, rest timer. |
| `#history` | `history.js` | List of past workouts, newest first. |
| `#history-detail?id=X` | `history-detail.js` | Single workout breakdown with sets. |
| `#templates` | `templates.js` | Templates list with edit/delete. |
| `#template-edit?id=X` | `template-edit.js` | Create/edit template and its exercises. New template: no `id` param. |
| `#progress` | `progress.js` | Exercise PRs + stats card (total workouts, this week, this month, last workout, top exercise). |

**Navigation:** Fixed bottom nav with 4 tabs — Home, History, Templates, Progress. Active tab highlighted with accent color.

---

## Sync Strategy

Mirrors Mandarin journal `sync.js` exactly:

1. **On app load and `online` event:** call `?action=getAll`, merge remote records into IndexedDB by `updatedAt` (remote wins if newer).
2. **On write (finish workout, save/delete template, delete workout):** write to IndexedDB first, add to `syncQueue`, then immediately flush queue to GAS.
3. **Queue flush:** iterate syncQueue, POST each item, remove from queue on `ok: true`. Stop on network failure — retry on next `online` event.
4. **`sync-complete` event:** dispatched after a successful pull that changed local data, causing the current screen to re-render.

---

## PWA Shell

**`index.html`:** minimal shell with `<div id="app">`, loads `js/app.js` as `type="module"`. Includes PWA meta tags and manifest link.

**`manifest.json`:** name "Workout Journal", dark theme color, standalone display, portrait orientation, two icon sizes.

**`sw.js`:** cache-first for shell assets (HTML, CSS, JS, icons, manifest). Network-first for GAS API calls. Cache name versioned (e.g. `workout-journal-v1`).

---

## CSS / Theme

Single `css/styles.css`. Reuses Mandarin journal CSS variable names and dark palette:

```css
:root {
  --bg: #0f0f0f;
  --surface: #1a1a1a;
  --surface2: #242424;
  --accent: #00bcd4;
  --text: #e0e0e0;
  --text-muted: #888;
  --danger: #cf6679;
}
```

The existing workout journal uses a slightly different set of variable names (`--bg-base`, `--bg-card`, etc.) — these are unified to match the Mandarin journal convention. Visual appearance stays the same.

---

## Migration Notes

- Existing GAS functions (`db_*`, `getHistoryData`, `getTemplatesData`, etc.) are preserved and called from the new `Code.gs` API handlers.
- `Setup.gs` (`setupSheets`) remains for creating Sheets tabs — still callable from the Spreadsheet menu.
- `doGet` no longer serves HTML. The old `Index.html`, `WorkoutDialog.html`, `HistoryDialog.html`, `TemplatesDialog.html` are deleted.
- `onOpen` menu in `Code.gs` can be kept or removed — it no longer serves a purpose once the PWA is the entry point.
- Existing numeric IDs in Sheets are preserved. New records created by the PWA use string UUIDs (`crypto.randomUUID()`).
