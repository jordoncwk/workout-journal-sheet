const CACHE = 'workout-journal-v1';
const BASE = '/workoutjournalsheet';

const SHELL = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/css/styles.css',
  BASE + '/js/app.js',
  BASE + '/js/router.js',
  BASE + '/js/db.js',
  BASE + '/js/sync.js',
  BASE + '/js/config.js',
  BASE + '/js/home.js',
  BASE + '/js/workout.js',
  BASE + '/js/templates.js',
  BASE + '/js/template-edit.js',
  BASE + '/js/history.js',
  BASE + '/js/history-detail.js',
  BASE + '/js/progress.js',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Never cache GAS API calls
  if (e.request.url.includes('script.google.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
