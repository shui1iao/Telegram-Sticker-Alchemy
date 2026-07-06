export const menuCommands = Object.freeze([
  { command: 'pts', description: '图片转贴纸：私聊直发/群里回复' },
  { command: 'gif', description: 'GIF/视频转动态贴纸' },
  { command: 'stp', description: '贴纸转图片/GIF' },
  { command: 'help', description: '查看使用说明' },
]);

export async function setupTelegramMenu(telegram) {
  await telegram.callApi('setMyCommands', {
    commands: menuCommands,
    scope: { type: 'default' },
  });
  await telegram.callApi('setChatMenuButton', {
    menu_button: { type: 'commands' },
  });
}
