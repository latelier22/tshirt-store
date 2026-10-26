import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createImageReadiness } from "../app/lib/image-readiness";

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const image = (src: string) => ({ src, sizes: "20vw" });

test("a board is not ready until every image has completed, with at most two decodes running", async () => {
  const pending = new Map<string, (ready: boolean) => void>();
  let completed = false;
  const loader = createImageReadiness(request => new Promise(resolve => pending.set(request.src, resolve)));
  const board = loader.prepare([image("a"), image("b"), image("c")]).then(ready => { completed = true; return ready; });
  await tick();
  assert.deepEqual([...pending.keys()], ["a", "b"]);
  assert.equal(completed, false);
  pending.get("a")!(true);
  await tick();
  assert.ok(pending.has("c"));
  pending.get("b")!(true);
  await tick();
  assert.equal(completed, false);
  pending.get("c")!(true);
  assert.equal(await board, true);
});

test("concurrent requests share one decode and subsequent scenes reuse the ready image", async () => {
  let calls = 0;
  const loader = createImageReadiness(async () => { calls++; return true; });
  assert.deepEqual(await Promise.all([loader.prepare([image("a")]), loader.prepare([image("a")])]), [true, true]);
  assert.equal(await loader.prepare([image("a")]), true);
  assert.equal(calls, 1);
});

test("a failed image keeps the board unready and is retried instead of cached as ready", async () => {
  let calls = 0;
  const loader = createImageReadiness(async () => { if (++calls === 1) throw new Error("network"); return true; });
  assert.equal(await loader.prepare([image("a")]), false);
  assert.equal(await loader.prepare([image("a")]), true);
  assert.equal(calls, 2);
});

test("a thumbnail and a hero photo are prepared independently, and the cache remains bounded", async () => {
  let calls = 0;
  const loader = createImageReadiness(async () => { calls++; return true; }, 1, 2);
  await loader.prepare([image("a"), { src: "a", sizes: "70vw" }, image("b")]);
  assert.equal(calls, 3);
  await loader.prepare([image("a")]);
  assert.equal(calls, 4);
});
