import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentSaveQueue, selectionAfterGeneration } from '../src/lib/documentSaveQueue.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('overlapping flushes serialize newer edits and never report saved early', async () => {
  const writes = [], states = [], waits = [deferred(), deferred()];
  const queue = new DocumentSaveQueue(async (value, expected) => {
    const index = writes.length;
    writes.push({ value, expected });
    await waits[index].promise;
    return value;
  }, (_, state) => states.push(state));
  queue.seed({ id: 'A', revision: 0 });
  queue.enqueue({ id: 'A', revision: 1 });
  const first = queue.flush('A');
  queue.enqueue({ id: 'A', revision: 2 });
  const switched = queue.flushAll();
  assert.equal(writes.length, 1);
  waits[0].resolve();
  await new Promise(setImmediate);
  assert.equal(writes.length, 2);
  assert.equal(writes[1].expected, 1);
  assert.equal(writes[1].value.revision, 2);
  assert.equal(queue.hasPending(), true);
  assert.equal(states.includes('saved'), false);
  waits[1].resolve();
  await Promise.all([first, switched]);
  assert.equal(queue.hasPending(), false);
  assert.equal(states.at(-1), 'saved');
});

test('storage failure preserves unsaved state for the unload guard and retry', async () => {
  let failing = true;
  const states = [];
  const queue = new DocumentSaveQueue(async (value) => {
    if (failing) throw new Error('Quota exceeded');
    return value;
  }, (_, state) => states.push(state));
  queue.enqueue({ id: 'A', revision: 1 });
  await assert.rejects(queue.flushAll(), /Quota/);
  assert.equal(states.at(-1), 'error');
  assert.equal(queue.hasPending(), true);
  failing = false;
  await queue.flushAll();
  assert.equal(queue.hasPending(), false);
});

test('a conflict does not prevent another document from saving and can be rebased after reload', async () => {
  const states = {}, writes = [];
  let conflict = true;
  const queue = new DocumentSaveQueue(async (value, expected) => {
    writes.push({ value, expected });
    if (value.id === 'A' && conflict) {
      const error = new Error('changed elsewhere');
      error.name = 'StaleRevisionError';
      throw error;
    }
    return value;
  }, (id, state) => { states[id] = state; });
  queue.seed({ id: 'A', revision: 0 });
  queue.enqueue({ id: 'A', revision: 1 });
  queue.enqueue({ id: 'B', revision: 1 });
  await assert.rejects(queue.flushAll());
  assert.equal(states.A, 'conflict');
  assert.equal(states.B, 'saved');
  assert.equal(queue.hasPending(), true);
  await queue.discard('A');
  queue.seed({ id: 'A', revision: 5 });
  conflict = false;
  queue.enqueue({ id: 'A', revision: 6 });
  await queue.flushAll();
  assert.equal(writes.at(-1).expected, 5);
  assert.equal(queue.hasPending(), false);
});

test('generation completion respects the current selection', () => {
  assert.equal(selectionAfterGeneration('B', 'A', 'copy'), 'B');
  assert.equal(selectionAfterGeneration('A', 'A', 'copy'), 'copy');
  assert.equal(selectionAfterGeneration(null, 'A', 'copy'), null);
});
