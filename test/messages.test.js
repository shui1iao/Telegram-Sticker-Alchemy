import test from 'node:test';
import assert from 'node:assert/strict';
import { missingInputMessage } from '../messages.js';

test('missingInputMessage explains group privacy when /pts cannot see the replied image', () => {
  const text = missingInputMessage({
    chat: { type: 'supergroup' },
    message: {
      text: '/pts@Pic_Gif_Sticker_Bot',
      reply_to_message: { message_id: 123 },
    },
  }, 'image');

  assert.match(text, /没拿到被回复的图片/);
  assert.match(text, /隐私模式/);
  assert.match(text, /BotFather/);
  assert.match(text, /管理员/);
});

test('missingInputMessage explains group privacy when @mention cannot see the replied image', () => {
  const text = missingInputMessage({
    chat: { type: 'supergroup' },
    message: {
      text: '@Pic_Gif_Sticker_Bot',
      reply_to_message: { message_id: 123 },
    },
  }, 'image');

  assert.match(text, /没拿到被回复的图片/);
  assert.match(text, /隐私模式/);
  assert.match(text, /BotFather/);
  assert.match(text, /管理员/);
});

test('missingInputMessage explains group privacy even when Telegram hides reply_to_message', () => {
  const text = missingInputMessage({
    chat: { type: 'supergroup' },
    message: { text: '/pts@Pic_Gif_Sticker_Bot' },
  }, 'image');

  assert.match(text, /没拿到被回复的图片/);
  assert.match(text, /隐私模式/);
  assert.match(text, /BotFather/);
  assert.match(text, /管理员/);
});

test('missingInputMessage keeps the short private-chat image hint', () => {
  assert.equal(
    missingInputMessage({ chat: { type: 'private' }, message: { text: '/pts' } }, 'image'),
    '回复一张图片后发 /pts，或直接把图片发给我。'
  );
});
