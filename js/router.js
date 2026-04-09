const routes = {};

export function register(hash, fn) {
  routes[hash] = fn;
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function start() {
  const render = () => {
    const raw = window.location.hash || '#home';
    const qIdx = raw.indexOf('?');
    const path = qIdx === -1 ? raw : raw.slice(0, qIdx);
    const search = qIdx === -1 ? '' : raw.slice(qIdx + 1);
    const fn = routes[path] || routes['#home'];
    const container = document.getElementById('app');
    container.innerHTML = '';
    if (fn) fn(container, new URLSearchParams(search));
  };
  window.addEventListener('hashchange', render);
  render();
}
