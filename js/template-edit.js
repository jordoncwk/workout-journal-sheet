import { getTemplate, saveTemplate, deleteTemplate, addToSyncQueue } from './db.js';
import { flushQueue } from './sync.js';
import { navigate } from './router.js';

export async function renderTemplateEdit(container, params) {
  const id = params.get('id');
  let template = id ? await getTemplate(id) : null;

  let exercises = template
    ? template.exercises.map(e => ({ ...e }))
    : [];

  function render() {
    let html = `
      <div class="screen-header">
        <button class="back-btn" id="back-btn">‹</button>
        <h1>${template ? 'Edit Template' : 'New Template'}</h1>
        <button class="icon-btn" id="save-btn">Save</button>
      </div>
      <div style="padding:12px;">
        <input type="text" id="tpl-name" placeholder="Template name (e.g. Upper Day)" value="${template ? template.name : ''}">
        <div class="card" style="margin-top:12px;">
          <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Exercises</div>
          <div id="exercises-list">`;

    exercises.forEach((ex, i) => {
      html += `
        <div class="exercise-row">
          <input class="exercise-name-input" type="text" placeholder="Exercise name" value="${ex.exercise_name}" data-i="${i}">
          <div>
            <div class="label-sm">Sets</div>
            <input class="num-input" type="number" min="1" value="${ex.default_sets}" data-field="default_sets" data-i="${i}">
          </div>
          <div>
            <div class="label-sm">Reps</div>
            <input class="num-input" type="number" min="1" value="${ex.default_reps}" data-field="default_reps" data-i="${i}">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${i > 0 ? `<button class="btn btn-ghost btn-sm move-btn" data-i="${i}" data-dir="-1">↑</button>` : '<div style="height:34px"></div>'}
            ${i < exercises.length - 1 ? `<button class="btn btn-ghost btn-sm move-btn" data-i="${i}" data-dir="1">↓</button>` : '<div style="height:34px"></div>'}
          </div>
          <button class="btn btn-danger btn-sm remove-btn" data-i="${i}">✕</button>
        </div>`;
    });

    html += `
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;">
            <input type="text" id="new-ex-input" placeholder="Add exercise name...">
            <button class="btn btn-primary btn-sm" id="add-ex-btn">Add</button>
          </div>
        </div>`;

    if (template) {
      html += `<button class="btn btn-danger btn-full" id="delete-btn">Delete Template</button>`;
    }

    html += `</div>`;
    container.innerHTML = html;
    attachEvents();
  }

  function attachEvents() {
    container.querySelector('#back-btn').addEventListener('click', () => navigate('#templates'));

    // Exercise name inputs
    container.querySelectorAll('.exercise-name-input').forEach(input => {
      input.addEventListener('input', () => {
        exercises[+input.dataset.i].exercise_name = input.value;
      });
    });

    // Sets/reps inputs
    container.querySelectorAll('input.num-input').forEach(input => {
      input.addEventListener('input', () => {
        exercises[+input.dataset.i][input.dataset.field] = parseInt(input.value) || 1;
      });
    });

    // Move up/down
    container.querySelectorAll('.move-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.i, dir = +btn.dataset.dir, j = i + dir;
        [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
        render();
      });
    });

    // Remove exercise
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        exercises.splice(+btn.dataset.i, 1);
        render();
      });
    });

    // Add exercise
    container.querySelector('#add-ex-btn').addEventListener('click', addExercise);
    container.querySelector('#new-ex-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') addExercise();
    });

    function addExercise() {
      const input = container.querySelector('#new-ex-input');
      const name = input.value.trim();
      if (!name) return;
      exercises.push({ exercise_name: name, default_sets: 3, default_reps: 8, order: exercises.length });
      input.value = '';
      render();
    }

    // Save
    container.querySelector('#save-btn').addEventListener('click', async () => {
      const name = container.querySelector('#tpl-name').value.trim();
      if (!name) { alert('Enter a template name.'); return; }
      const now = Date.now();
      const tpl = {
        id: template ? template.id : crypto.randomUUID(),
        name,
        updatedAt: now,
        exercises: exercises.map((e, i) => ({ ...e, order: i })),
      };
      await saveTemplate(tpl);
      await addToSyncQueue({ id: tpl.id, action: 'upsertTemplate', template: tpl });
      flushQueue();
      navigate('#templates');
    });

    // Delete
    const deleteBtn = container.querySelector('#delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Delete this template?')) return;
        await deleteTemplate(template.id);
        await addToSyncQueue({ action: 'deleteTemplate', id: template.id });
        flushQueue();
        navigate('#templates');
      });
    }
  }

  render();
}
