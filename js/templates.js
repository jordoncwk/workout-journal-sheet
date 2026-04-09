import { listTemplates } from './db.js';
import { navigate } from './router.js';

export async function renderTemplates(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const templates = await listTemplates();

  let html = `<div class="screen-header"><h1>Templates</h1></div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Tap + to create one.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-list-card" data-id="${t.id}">
        <div>
          <div style="font-weight:600;">${t.name}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `<button class="fab" id="new-btn">+</button>`;
  container.innerHTML = html;

  container.querySelectorAll('.template-list-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#template-edit?id=${card.dataset.id}`));
  });

  container.querySelector('#new-btn').addEventListener('click', () => navigate('#template-edit'));

  window.addEventListener('sync-complete', () => renderTemplates(container), { once: true });
}
