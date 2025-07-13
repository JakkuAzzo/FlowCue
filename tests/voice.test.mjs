import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCommand } from '../frontend/src/utils/voiceCommands.js';

test('voice command parsing', () => {
  assert.equal(parseCommand('next'), 'NEXT_SLIDE');
  assert.equal(parseCommand('previous slide'), 'PREV_SLIDE');
  assert.equal(parseCommand('next song please'), 'NEXT_SONG');
  assert.equal(parseCommand('unknown'), null);
});
