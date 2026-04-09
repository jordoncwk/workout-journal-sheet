import { getWorkout, deleteWorkout, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

export async function renderHistoryDetail(container, params) {
  const id = params.get('id');
  container.innerHTML = '<div class="loading">Loading...</div>';
  const w = await getWorkout(id);

  if (!w) {
    container.innerHTML = `
      <div class="screen-header">
        <button class="back-btn" onclick="history.back()">‹</button>
        <h1>Not found</h1>
      </div>
      <div class="empty">Workout not found.</div>`;
    return;
  }

  const date = new Date(w.startedAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const duration = formatDuration(w.finishedAt - w.startedAt);

  let html = `
    <div class="screen-header">
      <button class="back-btn" id="back-btn">‹</button>
      <h1>${w.templateName}</h1>
    </div>
    <div class="card">
      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">${date} · ${duration}</div>`;

  w.exercises.forEach(ex => {
    html += `
      <div class="ex-group">
        <div class="ex-group-name">${ex.exercise_name}</div>
        ${ex.sets.map((s, i) => `<div class="set-line">Set ${i + 1}: ${s.weight_kg} kg × ${s.reps} reps</div>`).join('')}
      </div>`;
  });

  html += `</div>
    <div style="padding:0 12px;">
      <button class="btn btn-danger btn-full" id="delete-btn">Delete Workout</button>
    </div>`;

  container.innerHTML = html;

  container.querySelector('#back-btn').addEventListener('click', () => navigate('#history'));

  container.querySelector('#delete-btn').addEventListener('click', async () => {
    if (!confirm('Delete this workout?')) return;
    await deleteWorkout(id);
    await addToSyncQueue({ action: 'deleteWorkout', id });
    await flushQueue();
    navigate('#history');
  });
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
