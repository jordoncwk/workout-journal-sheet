import { listWorkouts } from './db.js';
import { buildExerciseHistory } from './workout-stats.js';

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

export async function renderProgress(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const workouts = await listWorkouts();

  // Collect all unique exercise names from history, sorted alphabetically
  const exerciseNames = [...new Set(
    workouts.flatMap(w => w.exercises.map(ex => ex.exercise_name))
  )].sort((a, b) => a.localeCompare(b));

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

  // Exercise progress chart card
  const optionsHtml = exerciseNames.map(n =>
    `<option value="${esc(n)}">${esc(n)}</option>`
  ).join('');
  html += `
    <div class="card" id="chart-card">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Exercise Progress</div>
      <select class="chart-select" id="chart-exercise-select">
        <option value="">Select exercise...</option>
        ${optionsHtml}
      </select>
      <div class="chart-wrap" id="chart-wrap">
        <div class="empty" style="padding:40px 0;font-size:14px;">Select an exercise to see progress</div>
      </div>
    </div>`;

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

  const select = container.querySelector('#chart-exercise-select');
  const chartWrap = container.querySelector('#chart-wrap');
  if (select) {
    select.addEventListener('change', () => {
      const name = select.value;
      if (!name) {
        chartWrap.innerHTML = '<div class="empty" style="padding:40px 0;font-size:14px;">Select an exercise to see progress</div>';
        return;
      }
      const history = buildExerciseHistory(workouts, name);
      renderChart(chartWrap, history);
    });
  }

  window.addEventListener('sync-complete', () => renderProgress(container), { once: true });
}

function renderChart(wrap, history) {
  if (history.length === 0) {
    wrap.innerHTML = '<div class="empty" style="padding:40px 0;font-size:14px;">No data for this exercise</div>';
    return;
  }

  const W = wrap.clientWidth || 300;
  const H = 220;
  const padTop = 32, padBottom = 24, padLeft = 40, padRight = 16;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const weights = history.map(p => p.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rawRange = maxW - minW || 1;
  const yPad = Math.max(2.5, rawRange * 0.05);
  const yMin = minW - yPad;
  const yMax = maxW + yPad;
  const yRange = yMax - yMin;

  // Y axis gridlines (4 lines)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = yMin + (yRange / gridCount) * i;
    const y = padTop + chartH - (val - yMin) / yRange * chartH;
    return { val: Math.round(val * 10) / 10, y };
  });

  // X positions
  const xPos = i => padLeft + (history.length === 1 ? chartW / 2 : i / (history.length - 1) * chartW);
  const yPos = w => padTop + chartH - (w - yMin) / yRange * chartH;

  // X axis labels: show all if ≤6, else first + last + evenly sampled
  const labelIndices = new Set();
  if (history.length <= 6) {
    history.forEach((_, i) => labelIndices.add(i));
  } else {
    labelIndices.add(0);
    labelIndices.add(history.length - 1);
    const step = Math.floor((history.length - 1) / 4);
    for (let i = step; i < history.length - 1; i += step) labelIndices.add(i);
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fmtDate = ts => { const d = new Date(ts); return `${months[d.getMonth()]} ${d.getDate()}`; };

  // Build SVG
  let svg = `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Gridlines + Y labels
  gridLines.forEach(({ val, y }) => {
    svg += `<line x1="${padLeft}" y1="${y}" x2="${W - padRight}" y2="${y}" stroke="var(--surface2)" stroke-width="1"/>`;
    svg += `<text x="${padLeft - 4}" y="${y + 4}" text-anchor="end" font-size="10" fill="var(--text-muted)">${val}</text>`;
  });

  // Line
  if (history.length > 1) {
    const points = history.map((p, i) => `${xPos(i)},${yPos(p.weight_kg)}`).join(' ');
    svg += `<polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>`;
  }

  // Dots + weight labels + x labels
  history.forEach((p, i) => {
    const x = xPos(i);
    const y = yPos(p.weight_kg);
    svg += `<circle cx="${x}" cy="${y}" r="4" fill="var(--accent)"/>`;
    const labelY = Math.max(padTop - 2, y - 10);
    svg += `<text x="${x}" y="${labelY}" text-anchor="middle" font-size="10" fill="var(--text)">${p.weight_kg}kg</text>`;
    if (labelIndices.has(i)) {
      svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="10" fill="var(--text-muted)">${fmtDate(p.date)}</text>`;
    }
  });

  svg += `</svg>`;
  wrap.innerHTML = svg;
}
