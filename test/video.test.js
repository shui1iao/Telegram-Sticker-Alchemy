import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Evaluate only conversion helpers, never initialize the bot or contact Telegram.
const source = fs.readFileSync(new URL('../bot.js', import.meta.url), 'utf8');
function section(start, end) {
  const offset = source.indexOf(start);
  assert.ok(offset >= 0);
  return source.slice(offset, source.indexOf(end, offset));
}
function helpers(duration = 2, bytes = 1000) {
  const commands = [];
  const context = vm.createContext({
    run: async (command, args) => {
      commands.push({ command, args });
      return command === 'ffprobe'
        ? { code: 0, stdout: JSON.stringify({ streams: [{ duration }], format: { duration } }) }
        : { code: 0 };
    },
    rm: async () => {},
    existsNonEmpty: async () => true,
    stat: async () => ({ size: bytes }),
  });
  vm.runInContext(section('async function getMediaDurationSeconds', 'function formatDurationForFfmpeg')
    + section('function bestPhoto', 'async function downloadFile')
    + section('const MAX_ANIMATION_BYTES', 'async function convertStickerToPng'), context);
  return { context, commands };
}

test('long media bypasses sticker and converts full silent animation without a time limit', async () => {
  const { context, commands } = helpers(13);
  assert.equal(await context.convertVideoToWebm('input.mp4', 'sticker.webm'), null);
  assert.equal(commands.filter(c => c.command === 'ffmpeg').length, 0);
  assert.equal(await context.convertVideoToAnimation('input.mp4', 'animation.mp4'), 'animation.mp4');
  const args = commands.find(c => c.command === 'ffmpeg').args;
  assert.ok(args.includes('libx264') && args.includes('-an'));
  assert.ok(!args.includes('-t') && !args.includes('-to'));
  assert.match(args[args.indexOf('-vf') + 1], /^setpts=PTS-STARTPTS,/);
});

test('short stickers enforce 256KiB and 512px; oversize output falls back', async () => {
  const { context, commands } = helpers();
  assert.equal(await context.convertVideoToWebm('input.mp4', 'sticker.webm'), 'sticker.webm');
  const args = commands.find(c => c.command === 'ffmpeg').args;
  assert.ok(args.includes('libvpx-vp9') && !args.includes('-t'));
  assert.match(args[args.indexOf('-vf') + 1], /fps=30,scale=512:512/);
  const oversized = helpers(2, 256 * 1024 + 1);
  assert.equal(await oversized.context.convertVideoToWebm('in', 'out'), null);
});

test('probe failure and unknown duration fail instead of inventing three seconds', async () => {
  const { context } = helpers();
  context.run = async () => ({ code: 1 });
  await assert.rejects(context.getMediaDurationSeconds('broken'), /无法探测/);
  context.run = async () => ({ code: 0, stdout: '{"streams":[{}],"format":{}}' });
  await assert.rejects(context.getMediaDurationSeconds('unknown'), /无法探测/);
  context.run = async () => ({ code: 0, stdout: '{"streams":[{}],"format":{"duration":"13"}}' });
  assert.equal(await context.getMediaDurationSeconds('container-duration'), 13);
});

test('animation rejects oversized files, encoder failure and incomplete duration', async () => {
  await assert.rejects(helpers(13, 50000001).context.convertVideoToAnimation('in', 'out'), /50MB/);
  const { context } = helpers(13);
  const run = context.run;
  context.run = async (command, args) => command === 'ffmpeg' ? { code: 1 } : run(command, args);
  await assert.rejects(context.convertVideoToAnimation('in', 'out'), /完整动图转换失败/);
  await assert.rejects(context.verifyFullDuration('out', 20), /时长与原素材不符/);
});

test('GIF documents take dynamic routing before generic images', () => {
  const { context } = helpers();
  for (const document of [
    { mime_type: 'image/gif', file_name: 'input.gif' },
    { mime_type: 'application/octet-stream', file_name: 'input.GIF' },
  ]) assert.equal(context.getInputKindAndFileId({ document: { ...document, file_id: 'file' } }).kind, 'video');
  assert.equal(context.getInputKindAndFileId({ document: { mime_type: 'image/png', file_id: 'file' } }).kind, 'image');
});
