import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

// Cache only this release's static files. Provider requests and CVs never enter
// Cache Storage. Updates wait for all existing tabs to close before activation.
export function serviceWorkerSource(files, version) {
  return `const FILES = ${JSON.stringify(files)};
const PREFIX = 'custom-cv-shell:' + new URL('./', self.location.href).pathname + ':';
const CACHE = PREFIX + ${JSON.stringify(version)};
const urls = FILES.map(file => new URL(file, self.location.href).href);
const assets = new Set(urls);
const shell = new URL('index.html', self.location.href).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    urls.map(url => new Request(url, { cache: 'reload' }))
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const asset = url.origin + url.pathname;
  const inScope = url.pathname.startsWith(new URL('./', self.location.href).pathname);
  const target = request.mode === 'navigate' && inScope ? shell : asset;
  if (target !== shell && !assets.has(target)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(target)) || fetch(request)));
});
`;
}

export default function offlinePlugin() {
  let outputDirectory;
  return {
    name: "custom-cv-offline",
    apply: "build",
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const files = [];
      async function collect(directory, prefix = "") {
        for (const entry of await readdir(directory, { withFileTypes: true })) {
          const file = prefix + entry.name;
          if (entry.isDirectory())
            await collect(join(directory, entry.name), file + "/");
          else if (file !== "sw.js" && !file.endsWith(".map")) files.push(file);
        }
      }
      await collect(outputDirectory);
      files.sort();
      const hash = createHash("sha256");
      hash.update(serviceWorkerSource(files, ""));
      for (const file of files) {
        hash.update(file);
        hash.update(await readFile(join(outputDirectory, file)));
      }
      await writeFile(
        join(outputDirectory, "sw.js"),
        serviceWorkerSource(files, hash.digest("hex").slice(0, 16)),
      );
    },
  };
}
