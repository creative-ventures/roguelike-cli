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
    '  Commands: ls, cd, mkdir, open, cp, mv, rm, tree, pwd, clean',
    '  TAB to autocomplete, | pbcopy to copy output',
    '',
    '  Workflow: <description> -> refine -> save',
    '  init - setup, config - settings, help - examples',
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
