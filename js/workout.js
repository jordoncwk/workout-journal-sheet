import { saveWorkout, addToSyncQueue, listWorkouts } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
import { formatRestTime } from './timer-utils.js';
import { buildExerciseStats } from './workout-stats.js';
import { attachAutocomplete } from './presets.js';

let timerInterval = null;
const restTimerState = { interval: null, endTime: null, audioCtx: null };
const collapsedExercises = new Set();
const openNotes = new Set();

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function renderWorkout(container) {
  const state = getState();
  if (!state) { navigate('#home'); return; }

  stopWorkoutTimer();
  let allWorkouts = [];
  try {
    allWorkouts = await listWorkouts();
  } catch (err) {
    console.error('Failed to load workout history for stats:', err);
  }
  const exerciseNames = state.exercises.map(ex => ex.exercise_name);
  const exerciseStats = buildExerciseStats(allWorkouts, exerciseNames);
  render(container, state, exerciseStats);
}

function getState() {
  try { return JSON.parse(localStorage.getItem('activeWorkout')); } catch { return null; }
}

function saveState(state) {
  localStorage.setItem('activeWorkout', JSON.stringify(state));
}

function render(container, state, exerciseStats = {}) {
  const elapsed = formatDuration(Date.now() - state.startedAt);

  let html = `
    <div class="screen-header">
      <button class="back-btn" id="discard-btn">✕</button>
      <h1>${state.templateName || 'Free-form'}</h1>
      <span class="timer-badge" id="workout-timer">${elapsed}</span>
    </div>`;

  // Add exercise inline form (replaces prompt)
  html += `<div style="padding:8px 12px 0; display:flex; gap:8px; align-items:center;">
    <input type="text" id="add-ex-input" placeholder="Exercise name..." style="flex:1;min-width:0;padding:10px;font-size:15px;">
    <button class="btn btn-ghost btn-sm" id="add-ex-btn" style="white-space:nowrap;">+ Add</button>
  </div>`;

  state.exercises.forEach((ex, ei) => {
    const isCollapsed = collapsedExercises.has(ei);
    const stats = exerciseStats[ex.exercise_name.toLowerCase()];
    let statsHtml = '';
    if (stats && (stats.best || stats.last)) {
      const bestStr = stats.best ? `Best ${stats.best.weight_kg}kg×${stats.best.reps}` : '';
      const lastStr = stats.last ? `Last ${stats.last.weight_kg}kg×${stats.last.reps}` : '';
      const parts = [bestStr, lastStr].filter(Boolean);
      statsHtml = `<span class="ex-stats">${parts.join(' · ')}</span>`;
    }
    const hasNote = ex.note && ex.note.length > 0;
    html += `
      <div class="ex-card" data-ei="${ei}">
        <div class="ex-card-header" data-ei="${ei}">
          <span class="ex-arrow">${isCollapsed ? '▸' : '▾'}</span>
          <div class="ex-card-title">
            <span class="ex-card-name">${ex.exercise_name}</span>
            ${statsHtml}
          </div>
          <button class="note-icon${hasNote ? ' note-icon--active' : ''}" data-note-ei="${ei}" title="Notes">📝</button>
          <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
        </div>`;
    const noteVisible = openNotes.has(ei);
    html += `<textarea class="ex-note-textarea" data-note-area-ei="${ei}" placeholder="Notes..."${noteVisible ? ' style="display:block"' : ''}>${escapeHtml(ex.note)}</textarea>`;
    if (!isCollapsed) {
      ex.sets.forEach((s, si) => {
        const filled = s.weight_kg !== '' && s.reps !== '' ? ' filled' : '';
        html += `
          <div class="set-row${filled}" data-ei="${ei}" data-si="${si}">
            <span class="set-num">${si + 1}</span>
            <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight_kg}" data-field="weight_kg" data-ei="${ei}" data-si="${si}">
            <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-field="reps" data-ei="${ei}" data-si="${si}">
          </div>`;
      });
    }
    html += `</div>`;
  });

  html += `
    <div style="padding:16px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-ghost btn-full" id="rest-timer-btn">Rest 2:00</button>
      <button class="btn btn-primary btn-full" id="finish-btn">Finish Workout</button>
    </div>`;

  container.innerHTML = html;

  // Restore rest button label if countdown is running
  if (restTimerState.interval && restTimerState.endTime) {
    const remaining = Math.ceil((restTimerState.endTime - Date.now()) / 1000);
    const restBtn = container.querySelector('#rest-timer-btn');
    if (restBtn && remaining > 0) restBtn.textContent = `Rest ${formatRestTime(remaining)}`;
  }

  // Elapsed workout timer
  stopWorkoutTimer();
  timerInterval = setInterval(() => {
    const el = document.getElementById('workout-timer');
    if (el) el.textContent = formatDuration(Date.now() - state.startedAt);
  }, 1000);

  // Rest timer button
  const restBtn = container.querySelector('#rest-timer-btn');
  restBtn.addEventListener('click', () => {
    if (restTimerState.interval) {
      // Cancel running timer
      clearInterval(restTimerState.interval);
      restTimerState.interval = null;
      restTimerState.endTime = null;
      if (restTimerState.audioCtx) { restTimerState.audioCtx.close(); restTimerState.audioCtx = null; }
      restBtn.textContent = 'Rest 2:00';
    } else {
      // Start 2-minute countdown using end timestamp so background throttling doesn't drift
      restTimerState.endTime = Date.now() + 120 * 1000;
      try {
        restTimerState.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext unavailable:', e);
      }
      restBtn.textContent = `Rest ${formatRestTime(120)}`;
      restTimerState.interval = setInterval(() => {
        const remaining = Math.ceil((restTimerState.endTime - Date.now()) / 1000);
        const btn = document.getElementById('rest-timer-btn');
        if (!btn) { clearInterval(restTimerState.interval); restTimerState.interval = null; return; }
        if (remaining <= 0) {
          clearInterval(restTimerState.interval);
          restTimerState.interval = null;
          restTimerState.endTime = null;
          btn.textContent = 'Rest 2:00';
          if (navigator.vibrate) navigator.vibrate(500);
          if (restTimerState.audioCtx) {
            const osc = restTimerState.audioCtx.createOscillator();
            const gain = restTimerState.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.4;
            osc.connect(gain);
            gain.connect(restTimerState.audioCtx.destination);
            osc.start();
            osc.stop(restTimerState.audioCtx.currentTime + 0.3);
            const ctx = restTimerState.audioCtx;
            restTimerState.audioCtx = null;
            osc.onended = () => ctx.close();
          }
          btn.classList.add('rest-timer-flash');
          btn.addEventListener('animationend', () => btn.classList.remove('rest-timer-flash'), { once: true });
        } else {
          btn.textContent = `Rest ${formatRestTime(remaining)}`;
        }
      }, 1000);
    }
  });

  // Input changes
  container.querySelectorAll('input.set-input').forEach(input => {
    input.addEventListener('input', () => {
      const ei = +input.dataset.ei, si = +input.dataset.si, field = input.dataset.field;
      state.exercises[ei].sets[si][field] = input.value;
      saveState(state);
      const row = input.closest('.set-row');
      const inputs = row.querySelectorAll('.set-input');
      const allFilled = Array.from(inputs).every(i => i.value !== '');
      row.classList.toggle('filled', allFilled);
    });
  });

  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ei = +btn.dataset.ei;
      state.exercises[ei].sets.push({ weight_kg: '', reps: '' });
      saveState(state);
      render(container, state, exerciseStats);
    });
  });

  // Collapse/expand on header tap
  container.querySelectorAll('.ex-card-header').forEach(header => {
    header.addEventListener('click', () => {
      const ei = +header.dataset.ei;
      if (collapsedExercises.has(ei)) {
        collapsedExercises.delete(ei);
      } else {
        collapsedExercises.add(ei);
      }
      render(container, state, exerciseStats);
    });
  });

  // Add exercise inline form
  function doAddExercise() {
    const input = container.querySelector('#add-ex-input');
    const name = input.value.trim();
    if (!name) return;
    state.exercises.push({ exercise_name: name, sets: [{ weight_kg: '', reps: '' }] });
    saveState(state);
    render(container, state, exerciseStats);
  }
  container.querySelector('#add-ex-btn').addEventListener('click', doAddExercise);
  container.querySelector('#add-ex-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doAddExercise();
  });
  attachAutocomplete(container.querySelector('#add-ex-input'));

  // Discard
  container.querySelector('#discard-btn').addEventListener('click', () => {
    if (!confirm('Discard this workout?')) return;
    stopTimer();
    localStorage.removeItem('activeWorkout');
    navigate('#home');
  });

  // Finish
  container.querySelector('#finish-btn').addEventListener('click', () => finishWorkout(state));
}

async function finishWorkout(state) {
  stopTimer();
  const finishedAt = Date.now();
  const id = crypto.randomUUID();
  const workout = {
    id,
    templateId: state.templateId || null,
    templateName: state.templateName || 'Free-form',
    startedAt: state.startedAt,
    finishedAt,
    updatedAt: finishedAt,
    exercises: state.exercises.map(ex => ({
      exercise_name: ex.exercise_name,
      sets: ex.sets.filter(s => s.weight_kg !== '' && s.reps !== '').map(s => ({
        weight_kg: parseFloat(s.weight_kg) || 0,
        reps: parseInt(s.reps) || 0,
        logged: true,
      })),
    })).filter(ex => ex.sets.length > 0),
  };

  await saveWorkout(workout);
  await addToSyncQueue({ id: workout.id, action: 'upsertWorkout', workout });
  flushQueue();

  localStorage.removeItem('activeWorkout');
  navigate('#history');
}

function stopWorkoutTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function stopTimer() {
  stopWorkoutTimer();
  clearInterval(restTimerState.interval);
  restTimerState.interval = null;
  restTimerState.endTime = null;
  if (restTimerState.audioCtx) { restTimerState.audioCtx.close(); restTimerState.audioCtx = null; }
  collapsedExercises.clear();
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
