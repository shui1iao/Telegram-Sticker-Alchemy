import test from 'node:test';
import assert from 'node:assert/strict';
import { hasBotMention, shouldAutoConvertDirectMedia } from '../routing.js';

test('direct media auto-conversion only runs in private chats', () => {
  assert.equal(shouldAutoConvertDirectMedia({ chat: { type: 'private' } }), true);
  assert.equal(shouldAutoConvertDirectMedia({ chat: { type: 'group' } }), false);
  assert.equal(shouldAutoConvertDirectMedia({ chat: { type: 'supergroup' } }), false);
});

test('bot mention matches @username text and captions', () => {
  assert.equal(hasBotMention({ message: { text: '@Pic_Gif_Sticker_Bot' } }, 'Pic_Gif_Sticker_Bot'), true);
  assert.equal(hasBotMention({ message: { text: '转一下 @Pic_Gif_Sticker_Bot' } }, '@Pic_Gif_Sticker_Bot'), true);
  assert.equal(hasBotMention({ message: { caption: '帮忙 @Pic_Gif_Sticker_Bot' } }, 'Pic_Gif_Sticker_Bot'), true);
  assert.equal(hasBotMention({ message: { text: '@OtherBot' } }, 'Pic_Gif_Sticker_Bot'), false);
});
