"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showStartupAnimation = showStartupAnimation;
const utils_1 = require("../utils");
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
async function showStartupAnimation() {
    for (const line of ASCII_ART) {
        console.log(line);
        await (0, utils_1.sleep)(15);
    }
    await (0, utils_1.sleep)(100);
}
