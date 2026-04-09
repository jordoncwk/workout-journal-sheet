# Dark Theme Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all 4 HTML files from the light iOS theme to a dark slate theme with a cyan/teal accent using CSS variables.

**Architecture:** Each file gets a `:root` block defining CSS variables, then every hardcoded color in the `<style>` block is replaced with the corresponding variable. Inline style color values in the HTML body are replaced with the dark hex values directly.

**Tech Stack:** Pure HTML/CSS — no build tools, no npm, no test runner. This is a Google Apps Script web app. "Testing" is visual: deploy via `clasp push` and open the web app URL.

---

## CSS Variable Reference (used in every task)

Add this `:root` block to the top of the `<style>` section in each file:

```css
:root {
  --bg-base: #0f1117;
  --bg-card: #161b27;
  --bg-input: #1e2535;
  --border: #2a3347;
  --text-primary: #f0f4ff;
  --text-secondary: #a0aec0;
  --accent: #06b6d4;
  --accent-dark: #0891b2;
  --success: #0d9488;
  --success-bg: rgba(13,148,136,0.15);
  --danger: #ef4444;
}
```

---

## Task 1: Restyle Index.html

**Files:**
- Modify: `Index.html` (lines 8–116 are the `<style>` block; lines 118–228 are the HTML body with some inline styles)

- [ ] **Step 1: Add CSS variables block**

In `Index.html`, inside the `<style>` tag, insert the `:root` block from the reference above as the very first rule (before `* { box-sizing... }`).

- [ ] **Step 2: Restyle body and page**

Replace in the `<style>` block:
```css
/* BEFORE */
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f2f2f7; color: #1c1c1e; font-size: 17px; }

/* AFTER */
body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-base); color: var(--text-primary); font-size: 17px; }
```

- [ ] **Step 3: Restyle bottom nav**

```css
/* BEFORE */
#bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: rgba(255,255,255,0.95);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-top: 1px solid #d1d1d6;
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
  }
.nav-btn {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 10px 0 8px;
    font-size: 11px; font-weight: 500; color: #8e8e93; letter-spacing: 0.2px;
  }
.nav-btn.active { color: #4a86e8; }

/* AFTER */
#bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: rgba(15,17,23,0.97);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-top: 1px solid var(--border);
    display: flex;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
  }
.nav-btn {
    flex: 1; border: none; background: none; cursor: pointer;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 4px; padding: 10px 0 8px;
    font-size: 11px; font-weight: 500; color: var(--text-secondary); letter-spacing: 0.2px;
  }
.nav-btn.active { color: var(--accent); }
```

- [ ] **Step 4: Restyle header**

```css
/* BEFORE */
.header {
    background: #4a86e8; color: white;
    padding: 18px 16px;
    padding-top: calc(18px + env(safe-area-inset-top));
    display: flex; align-items: center; gap: 12px;
    position: sticky; top: 0; z-index: 10;
  }

/* AFTER */
.header {
    background: var(--bg-card); color: var(--text-primary);
    padding: 18px 16px;
    padding-top: calc(18px + env(safe-area-inset-top));
    display: flex; align-items: center; gap: 12px;
    position: sticky; top: 0; z-index: 10;
    border-bottom: 1px solid var(--border);
  }
```

- [ ] **Step 5: Restyle buttons**

```css
/* BEFORE */
.btn-primary { background: #4a86e8; color: white; }
.btn-danger { background: #e53935; color: white; }
.btn-ghost { background: transparent; color: #4a86e8; border: 2px solid #4a86e8; }

/* AFTER */
.btn-primary { background: var(--accent); color: white; }
.btn-danger { background: var(--danger); color: white; }
.btn-ghost { background: transparent; color: var(--accent); border: 2px solid var(--accent); }
```

- [ ] **Step 6: Restyle cards, loading, empty states, select**

```css
/* BEFORE */
.card { background: white; border-radius: 16px; margin: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
.loading { text-align: center; padding: 80px 20px; color: #8e8e93; font-size: 17px; }
.empty { text-align: center; padding: 80px 20px; color: #aeaeb2; font-size: 17px; line-height: 1.6; }
select { width: 100%; padding: 16px; font-size: 17px; border: 1.5px solid #d1d1d6; border-radius: 12px; background: white; min-height: 54px; color: #1c1c1e; -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23999' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 44px; }

/* AFTER */
.card { background: var(--bg-card); border-radius: 16px; margin: 12px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); border: 1px solid var(--border); }
.loading { text-align: center; padding: 80px 20px; color: var(--text-secondary); font-size: 17px; }
.empty { text-align: center; padding: 80px 20px; color: var(--text-secondary); font-size: 17px; line-height: 1.6; }
select { width: 100%; padding: 16px; font-size: 17px; border: 1.5px solid var(--border); border-radius: 12px; background: var(--bg-input); min-height: 54px; color: var(--text-primary); -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23a0aec0' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 44px; }
```

- [ ] **Step 7: Restyle timer badge**

```css
/* BEFORE */
.timer { font-size: 17px; font-variant-numeric: tabular-nums; background: rgba(255,255,255,0.25); padding: 6px 14px; border-radius: 20px; font-weight: 600; }

/* AFTER */
.timer { font-size: 17px; font-variant-numeric: tabular-nums; background: rgba(6,182,212,0.15); color: var(--accent); padding: 6px 14px; border-radius: 20px; font-weight: 600; border: 1px solid rgba(6,182,212,0.25); }
```

- [ ] **Step 8: Restyle exercise cards and set rows**

```css
/* BEFORE */
.ex-card { background: white; border-radius: 16px; margin: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden; }
.best-weight { font-size: 15px; color: #8e8e93; margin-bottom: 14px; }
.set-num { font-size: 16px; color: #aeaeb2; width: 24px; text-align: center; font-weight: 600; }
.set-input { flex: 1; border: 1.5px solid #d1d1d6; border-radius: 12px; padding: 14px 8px; font-size: 20px; text-align: center; min-height: 52px; }
.set-input.logged { background: #e8f5e9; color: #2e7d32; font-weight: 700; border-color: #a5d6a7; }
.log-btn { padding: 14px 18px; background: #4a86e8; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; white-space: nowrap; min-height: 52px; }
.log-btn.logged { background: #34a853; }
.add-ex-row input { flex: 1; border: 1.5px solid #d1d1d6; border-radius: 12px; padding: 14px; font-size: 17px; min-height: 52px; }

/* AFTER */
.ex-card { background: var(--bg-card); border-radius: 16px; margin: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid var(--border); }
.best-weight { font-size: 15px; color: var(--text-secondary); margin-bottom: 14px; }
.set-num { font-size: 16px; color: var(--text-secondary); width: 24px; text-align: center; font-weight: 600; }
.set-input { flex: 1; border: 1.5px solid var(--border); border-radius: 12px; padding: 14px 8px; font-size: 20px; text-align: center; min-height: 52px; background: var(--bg-input); color: var(--text-primary); }
.set-input.logged { background: var(--success-bg); color: #2dd4bf; font-weight: 700; border-color: var(--success); }
.log-btn { padding: 14px 18px; background: var(--accent); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; white-space: nowrap; min-height: 52px; }
.log-btn.logged { background: var(--success); }
.add-ex-row input { flex: 1; border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; font-size: 17px; min-height: 52px; background: var(--bg-input); color: var(--text-primary); }
```

- [ ] **Step 9: Restyle summary stats**

```css
/* BEFORE */
.summary-stat { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid #f2f2f7; font-size: 17px; }
.summary-val { font-weight: 700; color: #4a86e8; font-size: 19px; }

/* AFTER */
.summary-stat { display: flex; justify-content: space-between; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--border); font-size: 17px; }
.summary-val { font-weight: 700; color: var(--accent); font-size: 19px; }
```

- [ ] **Step 10: Restyle template section classes**

```css
/* BEFORE */
.template-sub { font-size: 15px; color: #8e8e93; margin-top: 4px; }
.exercise-row { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid #f2f2f7; }
.exercise-name-input { flex: 1; border: 1.5px solid #d1d1d6; border-radius: 10px; padding: 12px; font-size: 17px; min-height: 48px; }
.num-input { width: 60px; border: 1.5px solid #d1d1d6; border-radius: 10px; padding: 12px 4px; font-size: 17px; text-align: center; min-height: 48px; }
.label-sm { font-size: 12px; color: #8e8e93; text-align: center; margin-bottom: 3px; font-weight: 500; }
.section-label { font-size: 13px; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 12px; }
.add-exercise-row input { flex: 1; border: 1.5px solid #d1d1d6; border-radius: 10px; padding: 13px; font-size: 17px; min-height: 50px; }
.name-input-big { width: 100%; border: 1.5px solid #d1d1d6; border-radius: 12px; padding: 16px; font-size: 19px; margin-bottom: 18px; min-height: 56px; }
.fab { position: fixed; bottom: calc(90px + env(safe-area-inset-bottom)); right: 22px; width: 64px; height: 64px; border-radius: 50%; background: #4a86e8; color: white; font-size: 34px; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(74,134,232,0.45); display: none; align-items: center; justify-content: center; z-index: 50; }

/* AFTER */
.template-sub { font-size: 15px; color: var(--text-secondary); margin-top: 4px; }
.exercise-row { display: flex; align-items: center; gap: 10px; padding: 14px 0; border-bottom: 1px solid var(--border); }
.exercise-name-input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px; font-size: 17px; min-height: 48px; background: var(--bg-input); color: var(--text-primary); }
.num-input { width: 60px; border: 1.5px solid var(--border); border-radius: 10px; padding: 12px 4px; font-size: 17px; text-align: center; min-height: 48px; background: var(--bg-input); color: var(--text-primary); }
.label-sm { font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 3px; font-weight: 500; }
.section-label { font-size: 13px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 12px; }
.add-exercise-row input { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 13px; font-size: 17px; min-height: 50px; background: var(--bg-input); color: var(--text-primary); }
.name-input-big { width: 100%; border: 1.5px solid var(--border); border-radius: 12px; padding: 16px; font-size: 19px; margin-bottom: 18px; min-height: 56px; background: var(--bg-input); color: var(--text-primary); }
.fab { position: fixed; bottom: calc(90px + env(safe-area-inset-bottom)); right: 22px; width: 64px; height: 64px; border-radius: 50%; background: var(--accent); color: white; font-size: 34px; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(6,182,212,0.45); display: none; align-items: center; justify-content: center; z-index: 50; }
```

- [ ] **Step 11: Restyle history section classes**

```css
/* BEFORE */
.session-meta { font-size: 14px; color: #8e8e93; margin-top: 4px; }
.session-body { border-top: 1px solid #f2f2f7; padding: 16px; display: none; }
.ex-group-name { font-size: 16px; font-weight: 700; color: #3a3a3c; margin-bottom: 8px; }
.set-line { font-size: 16px; color: #48484a; padding: 5px 0; }
.chevron { color: #c7c7cc; font-size: 22px; transition: transform 0.2s; margin-left: 10px; }

/* AFTER */
.session-meta { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.session-body { border-top: 1px solid var(--border); padding: 16px; display: none; }
.ex-group-name { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; }
.set-line { font-size: 16px; color: var(--text-secondary); padding: 5px 0; }
.chevron { color: var(--text-secondary); font-size: 22px; transition: transform 0.2s; margin-left: 10px; }
```

- [ ] **Step 12: Restyle progress section classes**

```css
/* BEFORE */
.pr-row { display: flex; align-items: center; justify-content: space-between; padding: 17px 0; border-bottom: 1px solid #f2f2f7; min-height: 56px; }
.pr-val { font-size: 18px; font-weight: 700; color: #4a86e8; }

/* AFTER */
.pr-row { display: flex; align-items: center; justify-content: space-between; padding: 17px 0; border-bottom: 1px solid var(--border); min-height: 56px; }
.pr-val { font-size: 18px; font-weight: 700; color: var(--accent); }
```

- [ ] **Step 13: Fix inline style color values in the HTML body**

Find and replace these inline style color values in the HTML body section of `Index.html` (below the `</style>` tag):

| Find | Replace |
|------|---------|
| `color:#888` | `color:#a0aec0` |
| `color: #bbb` | `color: #a0aec0` |
| `color:#aaa` | `color:#a0aec0` |

There is one instance at line ~127: `style="font-size:14px;color:#888;margin-bottom:8px;"` — change to `style="font-size:14px;color:#a0aec0;margin-bottom:8px;"`

- [ ] **Step 14: Commit**

```bash
git add Index.html
git commit -m "style: apply dark theme to Index.html"
```

---

## Task 2: Restyle WorkoutDialog.html

**Files:**
- Modify: `WorkoutDialog.html` (lines 5–42 are the `<style>` block)

- [ ] **Step 1: Add CSS variables block**

Inside the `<style>` tag in `WorkoutDialog.html`, insert the `:root` block from the reference above as the very first rule.

- [ ] **Step 2: Restyle body, header, buttons, card**

```css
/* BEFORE */
body { font-family: -apple-system, sans-serif; background: #f5f5f5; color: #222; }
.header { background: #4a86e8; color: white; padding: 14px 16px; display: flex; align-items: center; gap: 10px; position: sticky; top: 0; z-index: 10; }
.btn-primary { background: #4a86e8; color: white; }
.btn-success { background: #34a853; color: white; }
.btn-danger { background: #e53935; color: white; }
.btn-ghost { background: transparent; color: #4a86e8; border: 1.5px solid #4a86e8; }
.card { background: white; border-radius: 12px; margin: 10px; padding: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }

/* AFTER */
body { font-family: -apple-system, sans-serif; background: var(--bg-base); color: var(--text-primary); }
.header { background: var(--bg-card); color: var(--text-primary); padding: 14px 16px; display: flex; align-items: center; gap: 10px; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border); }
.btn-primary { background: var(--accent); color: white; }
.btn-success { background: var(--success); color: white; }
.btn-danger { background: var(--danger); color: white; }
.btn-ghost { background: transparent; color: var(--accent); border: 1.5px solid var(--accent); }
.card { background: var(--bg-card); border-radius: 12px; margin: 10px; padding: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid var(--border); }
```

- [ ] **Step 3: Restyle exercise card internals**

```css
/* BEFORE */
.best-weight { font-size: 13px; color: #888; margin-bottom: 10px; }
.set-num { font-size: 13px; color: #aaa; width: 20px; }
.set-input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 8px; font-size: 16px; text-align: center; }
.set-input:focus { border-color: #4a86e8; outline: none; }
.set-label { font-size: 11px; color: #999; text-align: center; }
.set-logged { background: #e8f5e9 !important; color: #2e7d32; font-weight: 600; }
.log-set-btn { padding: 10px 14px; background: #4a86e8; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.log-set-btn.logged { background: #34a853; }
.next-btn { background: #4a86e8; color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.add-ex-row input { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; font-size: 15px; }
.summary-stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f0f0f0; font-size: 16px; }
.summary-val { font-weight: 700; color: #4a86e8; }
select { width: 100%; padding: 14px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px; background: white; }
#loading { text-align: center; padding: 60px; color: #888; }

/* AFTER */
.best-weight { font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
.set-num { font-size: 13px; color: var(--text-secondary); width: 20px; }
.set-input { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 10px 8px; font-size: 16px; text-align: center; background: var(--bg-input); color: var(--text-primary); }
.set-input:focus { border-color: var(--accent); outline: none; }
.set-label { font-size: 11px; color: var(--text-secondary); text-align: center; }
.set-logged { background: var(--success-bg) !important; color: #2dd4bf; font-weight: 600; border-color: var(--success) !important; }
.log-set-btn { padding: 10px 14px; background: var(--accent); color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.log-set-btn.logged { background: var(--success); }
.next-btn { background: var(--accent); color: white; border: none; border-radius: 8px; padding: 10px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.add-ex-row input { flex: 1; border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 15px; background: var(--bg-input); color: var(--text-primary); }
.summary-stat { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 16px; }
.summary-val { font-weight: 700; color: var(--accent); }
select { width: 100%; padding: 14px; font-size: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-input); color: var(--text-primary); }
#loading { text-align: center; padding: 60px; color: var(--text-secondary); }
```

- [ ] **Step 4: Fix inline style color values in HTML body**

In the HTML body of `WorkoutDialog.html`, find and replace:

| Find | Replace |
|------|---------|
| `color:#888` | `color:#a0aec0` |
| `color: #888` | `color: #a0aec0` |
| `color:#aaa` | `color:#a0aec0` |

- [ ] **Step 5: Commit**

```bash
git add WorkoutDialog.html
git commit -m "style: apply dark theme to WorkoutDialog.html"
```

---

## Task 3: Restyle HistoryDialog.html

**Files:**
- Modify: `HistoryDialog.html` (lines 5–23 are the `<style>` block; lines 78–80 have an inline color)

- [ ] **Step 1: Add CSS variables block**

Inside the `<style>` tag in `HistoryDialog.html`, insert the `:root` block from the reference above as the very first rule.

- [ ] **Step 2: Restyle all CSS rules**

```css
/* BEFORE */
body { font-family: -apple-system, sans-serif; background: #f5f5f5; color: #222; }
.header { background: #4a86e8; color: white; padding: 16px; position: sticky; top: 0; }
.card { background: white; border-radius: 12px; margin: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); overflow: hidden; }
.session-meta { font-size: 13px; color: #888; }
.session-body { border-top: 1px solid #f0f0f0; padding: 12px 16px; display: none; }
.ex-group-name { font-size: 14px; font-weight: 600; color: #555; margin-bottom: 6px; }
.set-line { font-size: 14px; color: #444; padding: 2px 0; }
.chevron { color: #bbb; font-size: 18px; transition: transform 0.2s; }
.empty { text-align: center; padding: 60px 20px; color: #aaa; font-size: 15px; }
#loading { text-align: center; padding: 60px; color: #888; }

/* AFTER */
body { font-family: -apple-system, sans-serif; background: var(--bg-base); color: var(--text-primary); }
.header { background: var(--bg-card); color: var(--text-primary); padding: 16px; position: sticky; top: 0; border-bottom: 1px solid var(--border); }
.card { background: var(--bg-card); border-radius: 12px; margin: 10px; box-shadow: 0 1px 4px rgba(0,0,0,0.4); overflow: hidden; border: 1px solid var(--border); }
.session-meta { font-size: 13px; color: var(--text-secondary); }
.session-body { border-top: 1px solid var(--border); padding: 12px 16px; display: none; }
.ex-group-name { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.set-line { font-size: 14px; color: var(--text-secondary); padding: 2px 0; }
.chevron { color: var(--text-secondary); font-size: 18px; transition: transform 0.2s; }
.empty { text-align: center; padding: 60px 20px; color: var(--text-secondary); font-size: 15px; }
#loading { text-align: center; padding: 60px; color: var(--text-secondary); }
```

- [ ] **Step 3: Fix inline color in JS-generated HTML**

In the JS template literal (around line 79), find and replace:

```js
// BEFORE
'<div style="color:#aaa;font-size:14px;">No sets logged.</div>'

// AFTER
'<div style="color:#a0aec0;font-size:14px;">No sets logged.</div>'
```

- [ ] **Step 4: Commit**

```bash
git add HistoryDialog.html
git commit -m "style: apply dark theme to HistoryDialog.html"
```

---

## Task 4: Restyle TemplatesDialog.html

**Files:**
- Modify: `TemplatesDialog.html` (lines 5–33 are the `<style>` block; lines 98 and 130 have inline colors in JS)

- [ ] **Step 1: Add CSS variables block**

Inside the `<style>` tag in `TemplatesDialog.html`, insert the `:root` block from the reference above as the very first rule.

- [ ] **Step 2: Restyle all CSS rules**

```css
/* BEFORE */
body { font-family: -apple-system, sans-serif; background: #f5f5f5; color: #222; }
.header { background: #4a86e8; color: white; padding: 16px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; }
.btn-primary { background: #4a86e8; color: white; }
.btn-danger { background: #e53935; color: white; }
.btn-ghost { background: transparent; color: #4a86e8; border: 1.5px solid #4a86e8; }
.card { background: white; border-radius: 12px; margin: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.template-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
.template-name { font-size: 16px; font-weight: 600; }
.template-sub { font-size: 13px; color: #888; margin-top: 2px; }
.exercise-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f8f8f8; }
.exercise-name-input { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; font-size: 15px; }
.num-input { width: 52px; border: 1px solid #ddd; border-radius: 6px; padding: 8px 4px; font-size: 15px; text-align: center; }
.label-sm { font-size: 11px; color: #888; text-align: center; margin-bottom: 2px; }
.section-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.add-exercise-row input { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 10px; font-size: 15px; }
.empty { text-align: center; padding: 40px 20px; color: #aaa; font-size: 15px; }
.fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: #4a86e8; color: white; font-size: 28px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; }
.name-input-big { width: 100%; border: 1px solid #ddd; border-radius: 8px; padding: 12px; font-size: 17px; margin-bottom: 16px; }
#loading { text-align: center; padding: 60px; color: #888; }

/* AFTER */
body { font-family: -apple-system, sans-serif; background: var(--bg-base); color: var(--text-primary); }
.header { background: var(--bg-card); color: var(--text-primary); padding: 16px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--border); }
.btn-primary { background: var(--accent); color: white; }
.btn-danger { background: var(--danger); color: white; }
.btn-ghost { background: transparent; color: var(--accent); border: 1.5px solid var(--accent); }
.card { background: var(--bg-card); border-radius: 12px; margin: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.4); border: 1px solid var(--border); }
.template-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); }
.template-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.template-sub { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.exercise-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.exercise-name-input { flex: 1; border: 1px solid var(--border); border-radius: 6px; padding: 8px; font-size: 15px; background: var(--bg-input); color: var(--text-primary); }
.num-input { width: 52px; border: 1px solid var(--border); border-radius: 6px; padding: 8px 4px; font-size: 15px; text-align: center; background: var(--bg-input); color: var(--text-primary); }
.label-sm { font-size: 11px; color: var(--text-secondary); text-align: center; margin-bottom: 2px; }
.section-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.add-exercise-row input { flex: 1; border: 1px solid var(--border); border-radius: 6px; padding: 10px; font-size: 15px; background: var(--bg-input); color: var(--text-primary); }
.empty { text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 15px; }
.fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: white; font-size: 28px; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(6,182,212,0.35); display: flex; align-items: center; justify-content: center; }
.name-input-big { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 17px; margin-bottom: 16px; background: var(--bg-input); color: var(--text-primary); }
#loading { text-align: center; padding: 60px; color: var(--text-secondary); }
```

- [ ] **Step 3: Fix inline colors in JS-generated HTML**

In the JS `renderList` function (around line 98), find and replace:

```js
// BEFORE
<span style="color:#bbb; font-size:20px;">›</span>

// AFTER
<span style="color:#a0aec0; font-size:20px;">›</span>
```

In the `renderExercises` function (around line 130), find and replace:

```js
// BEFORE
'<div style="color:#aaa; padding: 8px 0; font-size:14px;">No exercises yet.</div>'

// AFTER
'<div style="color:#a0aec0; padding: 8px 0; font-size:14px;">No exercises yet.</div>'
```

- [ ] **Step 4: Commit**

```bash
git add TemplatesDialog.html
git commit -m "style: apply dark theme to TemplatesDialog.html"
```

---

## Task 5: Deploy and verify

- [ ] **Step 1: Push to Google Apps Script**

```bash
clasp push
```

Expected output: `Pushed X files.`

- [ ] **Step 2: Open the web app and verify visually**

Open the deployed web app URL. Check each of the 4 pages (Workout, Templates, History, Progress) against this checklist:
- Background is dark slate (`#0f1117`), not white or light gray
- Cards have dark background (`#161b27`) with subtle border
- Header is dark with cyan-tinted timer badge
- Bottom nav icons: inactive = muted gray, active = cyan
- Input fields are dark with light text
- "Log" buttons are cyan; logged sets show teal-green
- FAB (+ button on Templates) is cyan
- All text is readable — no light-on-light or dark-on-dark

- [ ] **Step 3: Final commit if any tweaks were needed**

```bash
git add -A
git commit -m "style: fix dark theme tweaks after visual review"
```
