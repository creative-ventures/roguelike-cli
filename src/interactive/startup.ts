import { sleep } from '../utils';

const ASCII_ART = [
  '',
  '  |',
  '  |',
  '  + \\',
  '  \\.G_.*=.',
  '   `(#\'/.\|',
  '    .>\' (_--.',
  ' _=/d   ,^\\',
  '~~ \\)-\'   \'',
  '   / |   rlc',
  '  \'  \'',
  '',
  '╔═════════════════════════╗',
  '║      Roguelike CLI      ║',
  '╚═════════════════════════╝',
  '',
  '  Tasks: done, undo, dl <date>, boss, block',
  '  Stats: stats, achievements, inventory, map',
  '',
  '  Rules: fantasy, space, starwars, cyberpunk',
  '  Config: init, config -R="<rules>"',
  '',
  '  TAB autocomplete, | pbcopy to copy',
  '  <description> -> refine -> save',
  '',
  '  help - commands',
  '  www.rlc.rocks',
  '',
  '  Ready...',
  '',
];

export async function showStartupAnimation(): Promise<void> {
  for (const line of ASCII_ART) {
    console.log(line);
    await sleep(15);
  }
  await sleep(100);
}

