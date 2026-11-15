// Offline support: keeps a copy of the whole app on the device.
// When online, every file is fetched fresh (so new and old files never get mixed after an update),
// and the saved copy is refreshed. When offline, the saved copy is used.
// When you add a file, add it to FILES and change the number in CACHE.
// The maths app lives on the same address and shares the browser's offline storage, so this file only ever
// deletes its own old copies (names starting with "lengua4-"), never the maths app's.
const PREFIX = "lengua4-";
const CACHE = PREFIX + "v2";
const FILES = [
  "./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./shared/style.css", "./shared/progress.js", "./shared/engine.js", "./shared/topic.js", "./shared/words.js", "./shared/silabas.js",
  "./ortografia/", "./ortografia/index.html", "./ortografia/skills.js"
];

self.addEventListener("install", e => {
  // cache: "reload" skips the browser's own cache, so the saved copy is all from the same version
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache:"reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    // "no-cache" asks the server whether the file changed (a quick check), so updates show at once
    fetch(e.request, { cache:"no-cache" })
      .then(res => {
        if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch:true }))
  );
});
