import { listTemplates } from './db.js';
import { navigate } from './router.js';

export async function renderHome(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';

  const active = getActiveWorkout();
  const templates = await listTemplates();

  let html = `<div class="screen-header"><h1>Workout Journal</h1></div>`;

  if (active) {
    html += `
      <div class="card" style="margin:12px; background: rgba(0,188,212,0.08); border-color: rgba(0,188,212,0.3);">
        <div style="font-weight:600; margin-bottom:6px;">Workout in progress</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">${active.templateName || 'Free-form'}</div>
        <button class="btn btn-primary btn-full" onclick="location.hash='#workout'">Resume</button>
      </div>`;
  }

  html += `<div style="padding: 8px 12px 4px; font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Start a workout</div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Add one in Templates.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <div>
          <div class="template-card-name">${t.name}</div>
          <div class="template-card-sub">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `
    <div style="padding:12px;">
      <button class="btn btn-ghost btn-full" id="freeform-btn">+ Free-form workout</button>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const t = templates.find(t => t.id === id);
      startWorkout(t);
    });
  });

  container.querySelector('#freeform-btn').addEventListener('click', () => {
    startWorkout(null);
  });

  window.addEventListener('sync-complete', () => renderHome(container), { once: true });
}

function getActiveWorkout() {
  try { return JSON.parse(localStorage.getItem('activeWorkout')); } catch { return null; }
}

function startWorkout(template) {
  const state = {
    templateId: template ? template.id : null,
    templateName: template ? template.name : 'Free-form',
    startedAt: Date.now(),
    exercises: template
      ? template.exercises.map(ex => ({
          exercise_name: ex.exercise_name,
          sets: Array.from({ length: ex.default_sets }, () => ({ weight_kg: '', reps: '', logged: false }))
        }))
      : [],
    currentExerciseIndex: 0,
  };
  localStorage.setItem('activeWorkout', JSON.stringify(state));
  navigate('#workout');
}
