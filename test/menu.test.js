import test from 'node:test';
import assert from 'node:assert/strict';
import { menuCommands, setupTelegramMenu } from '../menu.js';

test('menuCommands exposes the main sticker conversion commands', () => {
  assert.deepEqual(menuCommands.map((cmd) => cmd.command), ['pts', 'gif', 'stp', 'help']);
  for (const cmd of menuCommands) {
    assert.match(cmd.command, /^[a-z0-9_]{1,32}$/);
    assert.ok(cmd.description.length >= 3 && cmd.description.length <= 256);
  }
});

test('setupTelegramMenu registers the command menu and Telegram commands button', async () => {
  const calls = [];
  const telegram = {
    async callApi(method, payload) {
      calls.push({ method, payload });
      return true;
    },
  };

  await setupTelegramMenu(telegram);

  assert.deepEqual(calls, [
    {
      method: 'setMyCommands',
      payload: {
        commands: menuCommands,
        scope: { type: 'default' },
      },
    },
    {
      method: 'setChatMenuButton',
      payload: {
        menu_button: { type: 'commands' },
      },
    },
  ]);
});
