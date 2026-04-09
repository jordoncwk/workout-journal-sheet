import { saveWorkout, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

let timerInterval = null;

export function renderWorkout(container) {
  const state = getState();
  if (!state) { navigate('#home'); return; }

  stopTimer();
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
    html += `
      <div class="ex-card" data-ei="${ei}">
        <div class="ex-card-header">
          <span class="ex-card-name">${ex.exercise_name}</span>
          <button class="btn btn-ghost btn-sm add-set-btn" data-ei="${ei}">+ Set</button>
        </div>`;
    ex.sets.forEach((s, si) => {
      html += `
        <div class="set-row" data-ei="${ei}" data-si="${si}">
          <span class="set-num">${si + 1}</span>
          <input class="set-input" type="number" inputmode="decimal" placeholder="kg" value="${s.weight_kg}" data-field="weight_kg" data-ei="${ei}" data-si="${si}">
          <input class="set-input" type="number" inputmode="numeric" placeholder="reps" value="${s.reps}" data-field="reps" data-ei="${ei}" data-si="${si}">
          <button class="set-log-btn ${s.logged ? 'logged' : ''}" data-ei="${ei}" data-si="${si}">✓</button>
        </div>`;
    });
    html += `</div>`;
  });

  html += `
    <div style="padding:16px; display:flex; flex-direction:column; gap:10px;">
      <button class="btn btn-primary btn-full" id="finish-btn">Finish Workout</button>
    </div>`;

  // Rest timer display
  html += `<div id="rest-timer" style="display:none; text-align:center; padding:12px; font-size:1rem; color:var(--accent);"></div>`;

  container.innerHTML = html;

  // Elapsed workout timer
  stopTimer();
  timerInterval = setInterval(() => {
    const el = document.getElementById('workout-timer');
    if (el) el.textContent = formatDuration(Date.now() - state.startedAt);
  }, 1000);

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
      if (s.logged) startRestTimer(container);
    });
  });

  // Add set
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei;
      state.exercises[ei].sets.push({ weight_kg: '', reps: '', logged: false });
      saveState(state);
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

function startRestTimer(container) {
  const REST_SECONDS = 90;
  let remaining = REST_SECONDS;
  const el = document.getElementById('rest-timer');
  if (!el) return;
  el.style.display = 'block';

  clearInterval(window._restInterval);
  window._restInterval = setInterval(() => {
    remaining--;
    const restEl = document.getElementById('rest-timer');
    if (!restEl) { clearInterval(window._restInterval); return; }
    if (remaining <= 0) {
      clearInterval(window._restInterval);
      restEl.style.display = 'none';
    } else {
      restEl.textContent = `Rest: ${remaining}s`;
    }
  }, 1000);
  el.textContent = `Rest: ${remaining}s`;
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
  await addToSyncQueue({ action: 'upsertWorkout', workout });
  await flushQueue();

  localStorage.removeItem('activeWorkout');
  navigate('#history');
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  clearInterval(window._restInterval);
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
