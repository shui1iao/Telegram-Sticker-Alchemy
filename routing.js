export function isPrivateChat(ctx) {
  return String(ctx?.chat?.type || '') === 'private';
}

export function shouldAutoConvertDirectMedia(ctx) {
  return isPrivateChat(ctx);
}

function escapeRegExp(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function messageText(ctx) {
  return String(ctx?.message?.text || ctx?.message?.caption || '');
}

export function hasBotMention(ctx, username) {
  const text = messageText(ctx);
  const name = String(username || '').replace(/^@/, '').trim();
  if (!text || !name) return false;
  const pattern = new RegExp(`(^|[^A-Za-z0-9_@])@${escapeRegExp(name)}(?=$|[^A-Za-z0-9_])`, 'i');
  return pattern.test(text);
}
