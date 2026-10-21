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
        ? { code: 0, stdout: JSON.stringify({ streams: [{ duration: args.at(-1) === 'out' ? Math.min(duration,30) : duration }], format: { duration } }) }
        : { code: 0 };
    },
    rm: async () => {},
    existsNonEmpty: async () => true,
    stat: async () => ({ size: bytes }),
  });
  vm.runInContext(section('async function getMediaDurationSeconds', 'function pickEmoji')
    + section('function bestPhoto', 'async function downloadFile')
    + section('async function verifyStickerDuration', 'async function convertStickerToPng'), context);
  return { context, commands };
}

test('clips use min(source,30) and accept up to 512KiB without fallback', async () => {
  for (const duration of [13,35]) {
    const {context,commands}=helpers(duration,512*1024);
    assert.equal(await context.convertVideoToWebm('input','out'),'out');
    const args=commands.find(c=>c.command==='ffmpeg').args;
    assert.equal(args[args.indexOf('-t')+1],String(Math.min(duration,30)));
    assert.ok(args.includes('libvpx-vp9'));
  }
});
test('oversize output exhausts exactly the original six presets then errors', async () => {
  const {context,commands}=helpers(13,512*1024+1);
  await assert.rejects(context.convertVideoToWebm('input','out'),/转贴纸失败/);
  const calls=commands.filter(c=>c.command==='ffmpeg');
  assert.equal(calls.length,6);
  assert.deepEqual(calls.map(c=>c.args[c.args.indexOf('-r')+1]),['24','18','15','12','10','8']);
  assert.deepEqual(calls.map(c=>c.args[c.args.indexOf('-crf')+1]),['42','48','52','56','60','63']);
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

test('encoder failure and incorrect target duration fail explicitly', async () => {
  const {context}=helpers(13);const run=context.run;
  context.run=async (command,args)=>command==='ffmpeg'?{code:1}:run(command,args);
  await assert.rejects(context.convertVideoToWebm('input','out'),/转贴纸失败/);
  await assert.rejects(context.verifyStickerDuration('out',30,0.05),/目标时长/);
});

test('GIF documents take dynamic routing before generic images', () => {
  const { context } = helpers();
  for (const document of [
    { mime_type: 'image/gif', file_name: 'input.gif' },
    { mime_type: 'application/octet-stream', file_name: 'input.GIF' },
  ]) assert.equal(context.getInputKindAndFileId({ document: { ...document, file_id: 'file' } }).kind, 'video');
  assert.equal(context.getInputKindAndFileId({ document: { mime_type: 'image/png', file_id: 'file' } }).kind, 'image');
});
