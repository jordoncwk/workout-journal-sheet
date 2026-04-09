import { listWorkouts } from './db.js';
import { navigate } from './router.js';

export async function renderHistory(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const workouts = await listWorkouts();

  let html = `<div class="screen-header"><h1>History</h1></div>`;

  if (workouts.length === 0) {
    html += `<div class="empty">No workouts yet.<br>Complete your first workout to see history.</div>`;
  } else {
    html += workouts.map(w => {
      const date = formatDate(w.startedAt);
      const duration = formatDuration(w.finishedAt - w.startedAt);
      const setCount = w.exercises.reduce((n, ex) => n + ex.sets.length, 0);
      return `
        <div class="history-card" data-id="${w.id}">
          <div class="history-card-header">
            <div style="flex:1">
              <div class="history-card-name">${w.templateName}</div>
              <div class="history-card-meta">${date} · ${duration} · ${setCount} set${setCount !== 1 ? 's' : ''}</div>
            </div>
            <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
          </div>
        </div>`;
    }).join('');
  }

  container.innerHTML = html;

  container.querySelectorAll('.history-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#history-detail?id=${card.dataset.id}`));
  });

  window.addEventListener('sync-complete', () => renderHistory(container), { once: true });
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDuration(ms) {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
