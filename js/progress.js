import { listWorkouts } from './db.js';

export async function renderProgress(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const workouts = await listWorkouts();

  const now = Date.now();
  const nowDate = new Date();
  const daysSinceMonday = (nowDate.getDay() + 6) % 7;
  const weekStart = new Date(nowDate);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();

  const total = workouts.length;
  const thisWeek = workouts.filter(w => w.startedAt >= weekStart.getTime()).length;
  const thisMonth = workouts.filter(w => w.startedAt >= monthStart).length;

  let lastWorkout = '—';
  if (workouts.length > 0) {
    const maxFinished = Math.max(...workouts.map(w => w.finishedAt));
    const diffDays = Math.floor((now - maxFinished) / 86400000);
    if (diffDays === 0) lastWorkout = 'Today';
    else if (diffDays === 1) lastWorkout = 'Yesterday';
    else lastWorkout = `${diffDays}d ago`;
  }

  // PRs: per exercise, highest weight × most reps at that weight
  const exerciseSets = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      if (!exerciseSets[ex.exercise_name]) exerciseSets[ex.exercise_name] = [];
      ex.sets.forEach(s => exerciseSets[ex.exercise_name].push(s));
    });
  });

  const prs = Object.entries(exerciseSets).map(([name, sets]) => {
    const bestWeight = Math.max(...sets.map(s => s.weight_kg));
    const bestSet = sets.filter(s => s.weight_kg === bestWeight).sort((a, b) => b.reps - a.reps)[0];
    return { name, weight_kg: bestWeight, reps: bestSet.reps };
  }).sort((a, b) => a.name.localeCompare(b.name));

  let html = `<div class="screen-header"><h1>Progress</h1></div>`;

  html += `
    <div class="card">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Stats</div>
      <div class="stats-grid">
        <div class="stat-cell"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
        <div class="stat-cell"><div class="stat-value">${thisWeek}</div><div class="stat-label">This Week</div></div>
        <div class="stat-cell"><div class="stat-value">${thisMonth}</div><div class="stat-label">This Month</div></div>
        <div class="stat-cell"><div class="stat-value" style="font-size:1rem;">${lastWorkout}</div><div class="stat-label">Last Workout</div></div>
      </div>
    </div>`;

  if (prs.length > 0) {
    html += `
      <div class="card">
        <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Personal Records</div>
        ${prs.map(pr => `
          <div class="pr-row">
            <span class="pr-name">${pr.name}</span>
            <span class="pr-value">${pr.weight_kg} kg × ${pr.reps}</span>
          </div>`).join('')}
      </div>`;
  } else {
    html += `<div class="empty">No workout data yet.</div>`;
  }

  container.innerHTML = html;

  window.addEventListener('sync-complete', () => renderProgress(container), { once: true });
}
