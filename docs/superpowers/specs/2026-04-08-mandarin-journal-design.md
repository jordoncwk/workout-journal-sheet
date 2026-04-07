# Mandarin Learning Journal — Design Spec

**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

A personal Mandarin learning journal built as a Progressive Web App (PWA). The user can quickly add Chinese characters, pinyin, English meanings, and personal notes. Entries are stored locally for offline use and synced to Google Sheets as a cloud backup. The app installs on iPhone from Safari with no App Store required.

---

## Architecture

```
┌─────────────────────────────────────┐
│         iPhone (PWA)                │
│  ┌─────────────────────────────┐    │
│  │  HTML/CSS/JS App            │    │
│  │  Service Worker (offline)   │    │
│  │  IndexedDB (local store)    │    │
│  └────────────┬────────────────┘    │
└───────────────┼─────────────────────┘
                │ (when online)
                ▼
┌───────────────────────────────────┐
│  Google Apps Script (API)         │
└───────────────┬───────────────────┘
                │
                ▼
┌───────────────────────────────────┐
│  Google Sheets (cloud backup)     │
│  Tab: Entries | Tab: Tags         │
└───────────────────────────────────┘
```

- **Frontend:** Vanilla HTML/CSS/JS PWA, hosted on GitHub Pages (free)
- **Backend:** Google Apps Script — handles all Sheets reads/writes, same pattern as the existing workout journal
- **Local store:** IndexedDB — all reads/writes hit this first; the app is fully functional offline
- **Service Worker:** Caches the app shell so it loads with no internet connection
- **Hosting:** GitHub Pages (separate repository from the workout journal)

---

## Data Model

### Entry

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID string | Unique identifier, used for sync |
| `characters` | string | Chinese text e.g. `你好` |
| `pinyin` | string | Tone-marked pinyin e.g. `nǐ hǎo` |
| `english` | string | English meaning e.g. `Hello` |
| `notes` | string | User's personal notes/comments |
| `tags` | string[] | Free-form tags e.g. `["greetings", "hsk1"]` |
| `radicals` | object[] | Auto-fetched from HanziDB, stored with entry |
| `createdAt` | ISO timestamp | Used for chronological sorting |
| `updatedAt` | ISO timestamp | Used for conflict resolution |

### Google Sheets tabs

- **Entries** — one row per entry, columns match the fields above
- **Tags** — deduplicated list of all tags used across entries, auto-derived from the Entries tab during sync (used to populate the filter chips in the UI)

---

## Screens

### 1. Journal Feed (home screen)
- Search bar at top (full-text across all fields)
- Tag filter chips below search (tap to filter; "All" selected by default)
- Chronological list of entries, newest first
  - Each card shows: large characters, pinyin in accent colour, English, tags, date
- Floating `+` button (bottom right) to add a new entry
- Sync status indicator (shows offline / syncing / synced)

### 2. Add Entry
- 4 input fields: Characters, Pinyin, English, My Notes
- Pinyin field auto-converts numbered input (`ni3 hao3`) to tone marks (`nǐ hǎo`) as the user types
- Characters field pre-fills from clipboard if clipboard contains Chinese text (Quick Add)
- Tag selector at bottom — type to create new tags or select existing
- Save button — writes to IndexedDB immediately, queues sync

### 3. Entry Detail
- Large characters centred at top
- Pinyin with speaker icon (taps Web Speech API for audio)
- English meaning
- Character breakdown panel — shows radical components and their meanings (from bundled HanziDB JSON)
- My Notes section
- Edit button (top right) opens Add Entry form pre-filled

### 4. Flashcard Mode
- Accessible from a nav button on the Journal Feed
- Optional tag filter before starting (review all or a specific tag)
- Full-screen card showing characters only
- Tap card to reveal pinyin + English
- Skip button and "Got it" button to advance
- Progress counter (Card X of Y)
- No spaced repetition — simple sequential review in this version

---

## Smart Features

### Auto Tone Marks
- Implemented in pure JavaScript — no API, works offline
- Uses `pinyin-tone-converter` open-source library (~5KB)
- Triggered on every keystroke in the Pinyin field
- Input: `wo3 shi4 xue2 sheng1` → Output: `wǒ shì xuéshēng`

### Audio Pronunciation
- Uses the browser's built-in Web Speech API (`SpeechSynthesis`)
- Language set to `zh-CN`
- Works on iOS Safari natively — no external service, no cost, no API key
- Triggered by tapping the speaker icon on Entry Detail

### Full-Text Search
- Searches across `characters`, `pinyin`, `english`, and `notes` fields
- Runs entirely against local IndexedDB — instant results, works offline
- Implemented with a simple in-memory filter on the entry list

### Character Breakdown
- Source: **HanziDB** — free, open-source JSON dataset (~3MB), bundled with the app
- Contains radical decomposition, stroke count, and HSK level for all common characters
- Parsed at entry-save time; radical data stored with the entry so it's available offline
- Displayed in a panel on Entry Detail

### Quick Add from Clipboard
- On the Add Entry screen, if the clipboard contains Chinese characters, the Characters field is pre-filled automatically on page load
- Uses the `navigator.clipboard.readText()` API (requires user permission on iOS)

---

## Offline Sync Strategy

- All writes go to IndexedDB first — the app never waits for network
- A sync queue (also in IndexedDB) tracks entries created/updated while offline
- When the app detects network connectivity, the queue is flushed to Google Sheets via GAS
- On app launch (when online), the app fetches the latest state from Google Sheets to catch any edits made directly in the spreadsheet
- Conflict resolution: **last-write-wins** on `updatedAt` timestamp — appropriate for a single-user app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| PWA | Service Worker + Web App Manifest |
| Local storage | IndexedDB (via idb library, ~5KB) |
| Pinyin conversion | pinyin-tone-converter (~5KB) |
| Character data | HanziDB JSON (bundled, ~3MB) |
| Audio | Web Speech API (built-in, no library) |
| Backend | Google Apps Script |
| Cloud storage | Google Sheets |
| Hosting | GitHub Pages |

---

## Out of Scope (this version)

- Spaced repetition scheduling (SRS) — plain flashcard mode only
- HSK level badge display — HanziDB has this data; can be added later
- Export to Anki/CSV
- Streak / progress stats dashboard
- Multi-device real-time sync (sync happens on app launch, not push-based)
