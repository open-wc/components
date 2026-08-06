import { test } from 'node:test';
import assert from 'node:assert/strict';

test('initializes TanStack virtual-core without a pre-existing Node process global', async () => {
  const originalProcess = globalThis.process;
  globalThis.process = undefined;

  try {
    await import('./virtualizer-environment.js?browser-global-test');
    const { Virtualizer } = await import('@tanstack/virtual-core');

    assert.equal(globalThis.process.env.NODE_ENV, 'production');
    assert.doesNotThrow(() =>
      new Virtualizer({
        count: 0,
        getScrollElement: () => null,
        estimateSize: () => 1,
        observeElementRect: () => () => {},
        observeElementOffset: () => () => {},
        scrollToFn: () => {},
      }),
    );
  } finally {
    globalThis.process = originalProcess;
  }
});
