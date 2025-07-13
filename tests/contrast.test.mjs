import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageLuminance } from '../frontend/src/utils/contrast.js';

test('averageLuminance computes average', () => {
  const data = new Uint8ClampedArray([
    255,255,255,255,
    0,0,0,255
  ]);
  const lum = averageLuminance(data);
  assert(Math.abs(lum - 0.5) < 0.01);
});
