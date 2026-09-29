import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import offlinePlugin, { serviceWorkerSource } from "./offlinePlugin.mjs";

function worker() {
  const handlers = {},
    stored = new Map(),
    deleted = [],
    fetched = [];
  let claimed = false;
  const scope = "https://cv.example/workspace/";
  vm.runInNewContext(
    serviceWorkerSource(
      ["index.html", "assets/app.js", "assets/pdf.worker.mjs"],
      "release-2",
    ),
    {
      URL,
      Request,
      self: {
        location: new URL(scope + "sw.js"),
        clients: {
          claim: async () => {
            claimed = true;
          },
        },
        addEventListener: (event, handler) => {
          handlers[event] = handler;
        },
      },
      caches: {
        open: async () => ({
          addAll: async (requests) =>
            requests.forEach((request) => stored.set(request.url, request.url)),
          match: async (url) => stored.get(url),
        }),
        keys: async () => [
          "custom-cv-shell:/workspace/:release-1",
          "custom-cv-shell:/workspace/:release-2",
          "custom-cv-shell:/other/:release-1",
          "unrelated-cache",
        ],
        delete: async (key) => {
          deleted.push(key);
        },
      },
      fetch: async (request) => {
        fetched.push(request.url);
        return "network";
      },
    },
  );
  return { handlers, stored, deleted, fetched, claimed: () => claimed, scope };
}

test("offline shell includes the PDF worker and handles subpath reloads without network", async () => {
  const state = worker();
  let install;
  state.handlers.install({
    waitUntil: (promise) => {
      install = promise;
    },
  });
  await install;
  assert.equal(state.stored.size, 3);
  let response;
  state.handlers.fetch({
    request: {
      url: state.scope + "?resume=1",
      method: "GET",
      mode: "navigate",
    },
    respondWith: (promise) => {
      response = promise;
    },
  });
  assert.equal(await response, state.scope + "index.html");
  state.handlers.fetch({
    request: new Request(state.scope + "assets/pdf.worker.mjs"),
    respondWith: (promise) => {
      response = promise;
    },
  });
  assert.equal(await response, state.scope + "assets/pdf.worker.mjs");
  assert.equal(state.fetched.length, 0);
});

test("worker leaves remote and same-origin provider requests and all writes untouched", () => {
  const { handlers, scope } = worker();
  for (const [url, method] of [
    ["https://api.openai.com/v1/models", "GET"],
    [scope + "v1/models", "GET"],
    [scope + "v1/chat/completions", "POST"],
    [scope + "assets/app.js", "POST"],
    ["https://cv.example/outside/", "GET"],
  ]) {
    handlers.fetch({
      request: new Request(url, { method }),
      respondWith: () =>
        assert.fail("Provider or unrelated request intercepted"),
    });
  }
});

test("activation removes only prior caches for this app scope and claims clients", async () => {
  const state = worker();
  let activation;
  state.handlers.activate({
    waitUntil: (promise) => {
      activation = promise;
    },
  });
  await activation;
  assert.deepEqual(state.deleted, ["custom-cv-shell:/workspace/:release-1"]);
  assert.equal(state.claimed(), true);
});

test("production plugin includes lazy assets and public files and versions content changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cv-offline-"));
  try {
    await mkdir(join(root, "dist/assets"), { recursive: true });
    for (const file of [
      "index.html",
      "favicon.svg",
      "assets/app.js",
      "assets/lazy.js",
      "assets/pdf.worker.mjs",
      "assets/app.js.map",
    ]) {
      await writeFile(join(root, "dist", file), file);
    }
    const plugin = offlinePlugin();
    plugin.configResolved({ root, build: { outDir: "dist" } });
    await plugin.closeBundle();
    const before = await readFile(join(root, "dist/sw.js"), "utf8");
    assert.match(before, /assets\/lazy.js/);
    assert.match(before, /assets\/pdf.worker.mjs/);
    assert.match(before, /favicon.svg/);
    assert.doesNotMatch(before, /app.js.map|skipWaiting/);
    await writeFile(join(root, "dist/index.html"), "new release");
    await plugin.closeBundle();
    assert.notEqual(await readFile(join(root, "dist/sw.js"), "utf8"), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
