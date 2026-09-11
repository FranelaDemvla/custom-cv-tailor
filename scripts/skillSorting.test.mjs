import test from "node:test";
import assert from "node:assert/strict";
import { skillSortingTransform } from "../src/lib/skillSorting.ts";

const rect = (left, top, width, height = 24) => ({ left, top, width, height, right: left + width, bottom: top + height });
const transform = (rects, from, to, index, width) => skillSortingTransform({
  rects, activeIndex: from, overIndex: to, index, activeNodeRect: rects[from],
}, width, 6);

test("unequal skills make space without scaling or leaving gaps", () => {
  const rects = [rect(10, 20, 100), rect(116, 20, 40), rect(162, 20, 70)];
  assert.deepEqual(transform(rects, 0, 2, 1, 300), { x: -106, y: 0, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 0, 2, 2, 300), { x: -106, y: 0, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 0, 2, 0, 300), { x: 122, y: 0, scaleX: 1, scaleY: 1 });
});

test("reordering repacks wrapped rows in both directions", () => {
  const rects = [rect(10, 20, 100), rect(116, 20, 40), rect(10, 50, 70)];
  assert.deepEqual(transform(rects, 0, 2, 1, 160), { x: -106, y: 0, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 0, 2, 2, 160), { x: 46, y: -30, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 0, 2, 0, 160), { x: 0, y: 30, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 2, 0, 2, 160), { x: 0, y: -30, scaleX: 1, scaleY: 1 });
  assert.deepEqual(transform(rects, 2, 0, 0, 160), { x: 0, y: 30, scaleX: 1, scaleY: 1 });
});

test("no movement and missing drop targets are safe", () => {
  const rects = [rect(10, 20, 100)];
  assert.deepEqual(transform(rects, 0, 0, 0, 160), { x: 0, y: 0, scaleX: 1, scaleY: 1 });
  assert.equal(transform(rects, 0, -1, 0, 160), null);
  assert.equal(transform([], 0, 0, 0, 160), null);
});
