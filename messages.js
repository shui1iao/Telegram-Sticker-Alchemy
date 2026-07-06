function isGroupChat(ctx) {
  return ['group', 'supergroup'].includes(String(ctx?.chat?.type || ''));
}

function isExplicitRequest(ctx) {
  const text = String(ctx?.message?.text || ctx?.message?.caption || '');
  return /^\/[a-z0-9_]+(?:@\w+)?(?:\s|$)/i.test(text) || /@\w+/i.test(text);
}

export function missingInputMessage(ctx, kind = 'image') {
  if (isGroupChat(ctx) && isExplicitRequest(ctx)) {
    if (kind === 'video') {
      return '我没拿到被回复的 GIF/视频。群里如果是回复媒体发命令，需要在 @BotFather 里关闭这个 bot 的隐私模式，或把我设为群管理员；改完后重新发一次媒体再回复 /gif。';
    }
    if (kind === 'sticker') {
      return '我没拿到被回复的贴纸。群里如果是回复贴纸发命令，需要在 @BotFather 里关闭这个 bot 的隐私模式，或把我设为群管理员；改完后重新发一次贴纸再回复 /stp。';
    }
    return '我没拿到被回复的图片。群里如果是回复图片发 /pts，需要在 @BotFather 里关闭这个 bot 的隐私模式，或把我设为群管理员；改完后重新发一次图片再回复 /pts。';
  }

  if (kind === 'video') return '回复 GIF/动图/短视频后发 /gif，或直接把 GIF/视频发给我。';
  if (kind === 'sticker') return '回复一个贴纸后发 /stp，或直接把贴纸发给我。';
  return '回复一张图片后发 /pts，或直接把图片发给我。';
}
