import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapGesture } from '../frontend/src/utils/gestureMap.js';

test('gesture mapping', () => {
  assert.equal(mapGesture('SwipeLeft'), 'PREV_SLIDE');
  assert.equal(mapGesture('SwipeRight'), 'NEXT_SLIDE');
  assert.equal(mapGesture('Fist'), 'NEXT_SONG');
});
