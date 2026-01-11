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
  '   / |',
  '  \'  \'',
  '',
  '╔═════════════════════════╗',
  '║    Roguelike CLI v1.0   ║',
  '║     www.rlc.rocks       ║',
  '╚═════════════════════════╝',
  '',
  '  Commands: ls, cd, mkdir, open, cp, mv, rm, tree, pwd, clean',
  '  TAB to autocomplete, | pbcopy to copy output',
  '',
  '  Workflow: <description> -> refine -> save',
  '  init - setup, config - settings, help - examples',
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

