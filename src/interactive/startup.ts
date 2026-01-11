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
  '  Navigation: ls, cd, tree, pwd, open',
  '  Tasks: done, deadline, boss, block, status',
  '  Gamification: stats, achievements, map',
  '',
  '  TAB to autocomplete, | pbcopy to copy',
  '  Workflow: <description> -> refine -> save',
  '',
  '  help - all commands, init - setup',
  '',
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

