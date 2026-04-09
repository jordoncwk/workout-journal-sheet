import { saveWorkout, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';
import { formatRestTime } from './timer-utils.js';

let timerInterval = null;
const restTimerState = { interval: null, endTime: null };
const collapsedExercises = new Set();

export function renderWorkout(container) {
  const state = getState();
  if (!state) { navigate('#home'); return; }

  stopWorkoutTimer();
  render(container, state);
}

function getState() {
  try { return JSON.parse(localStorage.getItem('activeWorkout')); } catch { return null; }
}

function saveState(state) {
  localStorage.setItem('activeWorkout', JSON.stringify(state));
}

function render(container, state) {
  const elapsed = formatDuration(Date.now() - state.startedAt);

  let html = `
    <div class="screen-header">
      <button class="back-btn" id="discard-btn">✕</button>
      <h1>${state.templateName || 'Free-form'}</h1>
      <span class="timer-badge" id="workout-timer">${elapsed}</span>
    </div>`;

  // Add exercise button (free-form)
  html += `<div style="padding:8px 12px 0; display:flex; gap:8px; flex-wrap:wrap;">
    <button class="btn btn-ghost btn-sm" id="add-ex-btn">+ Add exercise</button>
  </div>`;

  state.exercises.forEach((ex, ei) => {
    const isCollapsed = collapsedExercises.has(ei);
    html += `
      <div class="ex-card" data-ei="${ei}">
        <div class="ex-card-header" data-ei="${ei}">
          <span class="ex-card-name">${isCollapsed ? '▸' : '▾'} ${ex.exercise_name}</span>
          <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
        </div>`;
    if (!isCollapsed) {
      ex.sets.forEach((s, si) => {
        html += `
          <div class="set-row" data-ei="${ei}" data-si="${si}">
            <span class="set-num">${si + 1}</span>
            <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight_kg}" data-field="weight_kg" data-ei="${ei}" data-si="${si}">
            <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-field="reps" data-ei="${ei}" data-si="${si}">
            <button class="set-log-btn ${s.logged ? 'logged' : ''}" data-ei="${ei}" data-si="${si}">✓</button>
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
      restBtn.textContent = 'Rest 2:00';
    } else {
      // Start 2-minute countdown using end timestamp so background throttling doesn't drift
      restTimerState.endTime = Date.now() + 120 * 1000;
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
        } else {
          btn.textContent = `Rest ${formatRestTime(remaining)}`;
        }
      }, 1000);
    }
  });

  // Input changes
  container.querySelectorAll('input.set-input').forEach(input => {
    input.addEventListener('change', () => {
      const ei = +input.dataset.ei, si = +input.dataset.si, field = input.dataset.field;
      state.exercises[ei].sets[si][field] = input.value;
      saveState(state);
    });
  });

  // Log set toggle
  container.querySelectorAll('.set-log-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei, si = +btn.dataset.si;
      const s = state.exercises[ei].sets[si];
      s.logged = !s.logged;
      saveState(state);
      btn.classList.toggle('logged', s.logged);
    });
  });

  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ei = +btn.dataset.ei;
      state.exercises[ei].sets.push({ weight_kg: '', reps: '', logged: false });
      saveState(state);
      render(container, state);
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
      render(container, state);
    });
  });

  // Add exercise (free-form)
  container.querySelector('#add-ex-btn').addEventListener('click', () => {
    const name = prompt('Exercise name:');
    if (!name || !name.trim()) return;
    state.exercises.push({ exercise_name: name.trim(), sets: [{ weight_kg: '', reps: '', logged: false }] });
    saveState(state);
    render(container, state);
  });

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
      sets: ex.sets.filter(s => s.logged && s.weight_kg !== '' && s.reps !== '').map(s => ({
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
