import { start as startRouter, register } from './router.js';
import { renderHome } from './home.js';
import { renderWorkout } from './workout.js';
import { renderTemplates } from './templates.js';
import { renderTemplateEdit } from './template-edit.js';
import { renderHistory } from './history.js';
import { renderHistoryDetail } from './history-detail.js';
import { renderProgress } from './progress.js';
import { initSync } from './sync.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/workout-journal-sheet/sw.js').catch(() => {});
}

register('#home', renderHome);
register('#workout', renderWorkout);
register('#templates', renderTemplates);
register('#template-edit', renderTemplateEdit);
register('#history', renderHistory);
register('#history-detail', renderHistoryDetail);
register('#progress', renderProgress);

initSync();

// Inject bottom nav into body once
function renderNav() {
  const existing = document.getElementById('bottom-nav');
  if (existing) existing.remove();
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.id = 'bottom-nav';
  const hash = window.location.hash || '#home';
  const tabs = [
    { hash: '#home',      icon: '🏠', label: 'Home' },
    { hash: '#history',   icon: '📋', label: 'History' },
    { hash: '#templates', icon: '📁', label: 'Templates' },
    { hash: '#progress',  icon: '📈', label: 'Progress' },
  ];
  nav.innerHTML = tabs.map(t => `
    <button class="nav-btn ${hash.startsWith(t.hash) ? 'active' : ''}" onclick="location.hash='${t.hash}'">
      <span class="nav-icon">${t.icon}</span>${t.label}
    </button>
  `).join('');
  document.body.appendChild(nav);
}

window.addEventListener('hashchange', renderNav);
renderNav();

startRouter();
