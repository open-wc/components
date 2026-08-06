import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VerticalListController } from './VerticalListController.js';

test('requests an update only when the rendered range changes', async () => {
  const host = {
    updateComplete: Promise.resolve(),
    addController() {},
    requestUpdate() {
      this.updateRequests = (this.updateRequests ?? 0) + 1;
    },
  };
  const list = new VerticalListController(host, {
    getItems: () => [],
    getItemKey: index => index,
    onRangeChange() {},
  });
  const onChange = list.getVirtualizer().options.onChange;
  const unchangedRange = { calculateRange: () => ({ startIndex: 0, endIndex: 1 }) };

  onChange(unchangedRange);
  onChange(unchangedRange);
  await Promise.resolve();

  assert.equal(host.updateRequests, 1);
});
