# Dark Theme Restyle — Design Spec

**Date:** 2026-04-06

## Summary

Restyle all 4 HTML files in the Workout Journal Google Apps Script web app from the current light iOS-style theme to a dark, premium theme with a cyan/teal accent color. Implementation uses CSS variables for a single source of truth.

## Scope

Files to be modified:
- `Index.html`
- `WorkoutDialog.html`
- `HistoryDialog.html`
- `TemplatesDialog.html`

No `.gs` backend files are changed.

## Color Palette

All files get a `:root` block with these CSS variables:

| Variable | Value | Usage |
|---|---|---|
| `--bg-base` | `#0f1117` | Page/body background |
| `--bg-card` | `#161b27` | Card, header, nav backgrounds |
| `--bg-input` | `#1e2535` | Input fields, secondary surfaces |
| `--border` | `#2a3347` | All borders and dividers |
| `--text-primary` | `#f0f4ff` | Headings, body text |
| `--text-secondary` | `#a0aec0` | Labels, muted text, placeholders |
| `--accent` | `#06b6d4` | Buttons, active nav, highlights, borders |
| `--accent-dark` | `#0891b2` | Hover/pressed accent state |
| `--success` | `#0d9488` | Logged set button, logged input border |
| `--success-bg` | `rgba(13,148,136,0.15)` | Logged input background tint |
| `--danger` | `#ef4444` | Delete/cancel buttons |

## Per-Element Mapping

### Body & Background
- `background: #f2f2f7` → `var(--bg-base)`
- `color: #1c1c1e` → `var(--text-primary)`

### Cards
- `background: white` → `var(--bg-card)`
- `box-shadow: 0 1px 3px rgba(0,0,0,0.07)` → `box-shadow: 0 1px 3px rgba(0,0,0,0.4); border: 1px solid var(--border)`

### Header
- `background: #4a86e8` → `var(--bg-card)` with `border-bottom: 1px solid var(--border)`
- Header text color: white → `var(--text-primary)`
- Timer badge: `background: rgba(255,255,255,0.25)` → `background: rgba(6,182,212,0.15); color: var(--accent); border: 1px solid rgba(6,182,212,0.25)`

### Bottom Nav (Index.html)
- `background: rgba(255,255,255,0.95)` → `rgba(15,17,23,0.97)`
- `border-top: 1px solid #d1d1d6` → `border-top: 1px solid var(--border)`
- Active color: `#4a86e8` → `var(--accent)`
- Inactive color: `#8e8e93` → `var(--text-secondary)`

### Buttons
- `.btn-primary` background `#4a86e8` → `var(--accent)`
- `.btn-danger` background `#e53935` → `var(--danger)`
- `.btn-ghost` border/color `#4a86e8` → `var(--accent)`
- `.log-btn` background `#4a86e8` → `var(--accent)`
- `.log-btn.logged` background `#34a853` → `var(--success)`
- FAB background `#4a86e8` → `var(--accent)`

### Inputs & Selects
- `border: 1.5px solid #d1d1d6` → `border: 1.5px solid var(--border)`
- `background: white` → `var(--bg-input)`
- `color: #1c1c1e` → `var(--text-primary)`
- Placeholder/label colors → `var(--text-secondary)`
- Focus border → `var(--accent)`
- `.set-input.logged` → `background: var(--success-bg); border-color: var(--success); color: #2dd4bf`

### Exercise Cards
- Exercise border accent: keep existing colors (they are programmatically set per-exercise) — no change needed
- `.best-weight` color `#8e8e93` → `var(--text-secondary)`
- `.set-num` color `#aeaeb2` → `var(--text-secondary)`

### Section Labels & Secondary Text
- All `#8e8e93`, `#aeaeb2`, `#999`, `#888` → `var(--text-secondary)`

### Dividers
- `border-bottom: 1px solid #f2f2f7` → `border-bottom: 1px solid var(--border)`
- `border-bottom: 1px solid #f0f0f0` → `border-bottom: 1px solid var(--border)`

## Approach

CSS variable swap (Approach A): add a `:root` block with all variables to each file's `<style>` section, then replace every hardcoded color value with the corresponding variable. No structural HTML changes. No new files.

## Out of Scope

- No changes to `.gs` backend files
- No layout or structural changes
- No new features or animations
