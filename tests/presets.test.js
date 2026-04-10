import { getPresets, savePresets, addPreset, removePreset } from '../js/presets.js';

// Mock localStorage for Node test environment (no browser APIs available)
let store = {};
global.localStorage = {
  getItem: key => store[key] ?? null,
  setItem: (key, val) => { store[key] = val; },
  removeItem: key => { delete store[key]; },
};

beforeEach(() => { store = {}; });

test('getPresets returns empty array when nothing stored', () => {
  expect(getPresets()).toEqual([]);
});

test('savePresets and getPresets round-trip', () => {
  savePresets(['Bench Press', 'Squat']);
  expect(getPresets()).toEqual(['Bench Press', 'Squat']);
});

test('addPreset appends a new name', () => {
  addPreset('Deadlift');
  expect(getPresets()).toEqual(['Deadlift']);
});

test('addPreset ignores duplicates case-insensitively', () => {
  addPreset('Bench Press');
  addPreset('bench press');
  addPreset('BENCH PRESS');
  expect(getPresets()).toHaveLength(1);
});

test('addPreset trims whitespace', () => {
  addPreset('  Squat  ');
  expect(getPresets()).toEqual(['Squat']);
});

test('addPreset ignores empty and whitespace-only names', () => {
  addPreset('');
  addPreset('   ');
  expect(getPresets()).toEqual([]);
});

test('removePreset removes matching name case-insensitively', () => {
  savePresets(['Bench Press', 'Squat', 'Deadlift']);
  removePreset('squat');
  expect(getPresets()).toEqual(['Bench Press', 'Deadlift']);
});

test('removePreset does nothing when name not found', () => {
  savePresets(['Bench Press']);
  removePreset('OHP');
  expect(getPresets()).toEqual(['Bench Press']);
});
