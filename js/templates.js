import { listTemplates } from './db.js';
import { navigate } from './router.js';
import { getPresets, addPreset, removePreset } from './presets.js';

export async function renderTemplates(container) {
  container.innerHTML = '<div class="loading">Loading...</div>';
  const templates = await listTemplates();

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let html = `<div class="screen-header"><h1>Templates</h1></div>`;

  if (templates.length === 0) {
    html += `<div class="empty">No templates yet.<br>Tap + to create one.</div>`;
  } else {
    html += templates.map(t => `
      <div class="template-list-card" data-id="${esc(t.id)}">
        <div>
          <div style="font-weight:600;">${esc(t.name)}</div>
          <div style="font-size:0.82rem;color:var(--text-muted);margin-top:3px;">${t.exercises.length} exercise${t.exercises.length !== 1 ? 's' : ''}</div>
        </div>
        <span style="color:var(--text-muted);font-size:1.2rem;">›</span>
      </div>
    `).join('');
  }

  html += `<button class="fab" id="new-btn">+</button>`;

  html += `
    <div class="card" style="margin:12px;margin-bottom:80px;" id="presets-card">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Exercise Presets</div>
      <div id="preset-list"></div>
      <div style="display:flex;gap:8px;margin-top:10px;">
        <input type="text" id="preset-input" placeholder="Add preset name...">
        <button class="btn btn-primary btn-sm" id="preset-add-btn">Add</button>
      </div>
    </div>`;

  container.innerHTML = html;

  container.querySelectorAll('.template-list-card').forEach(card => {
    card.addEventListener('click', () => navigate(`#template-edit?id=${card.dataset.id}`));
  });

  container.querySelector('#new-btn').addEventListener('click', () => navigate('#template-edit'));

  function renderPresets() {
    const presets = getPresets();
    const list = container.querySelector('#preset-list');
    if (presets.length === 0) {
      list.innerHTML = '<div class="empty" style="padding:16px 0;font-size:14px;">No presets yet</div>';
    } else {
      list.innerHTML = presets.map(p => `
        <div class="preset-row">
          <span>${esc(p)}</span>
          <button class="btn btn-danger btn-sm preset-remove-btn" data-name="${esc(p)}">✕</button>
        </div>
      `).join('');
      list.querySelectorAll('.preset-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          removePreset(btn.dataset.name);
          renderPresets();
        });
      });
    }
  }

  renderPresets();

  container.querySelector('#preset-add-btn').addEventListener('click', () => {
    const input = container.querySelector('#preset-input');
    const name = input.value.trim();
    if (!name) return;
    addPreset(name);
    input.value = '';
    renderPresets();
  });

  container.querySelector('#preset-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') container.querySelector('#preset-add-btn').click();
  });

  window.addEventListener('sync-complete', () => renderTemplates(container), { once: true });
}
