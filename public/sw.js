const DB_NAME = 'ImageStore';
const STORE_NAME = 'images';

function getDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject('DB Error');
  });
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/local-image/')) {
    const id = url.pathname.replace('/local-image/', '');
    event.respondWith(
      getDb().then(db => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(id);
          req.onsuccess = () => {
            if (req.result) {
              resolve(new Response(req.result.file, {
                headers: { 'Content-Type': req.result.type }
              }));
            } else {
              resolve(new Response('Not found', { status: 404 }));
            }
          };
          req.onerror = () => resolve(new Response('Error', { status: 500 }));
        });
      })
    );
  }
});
