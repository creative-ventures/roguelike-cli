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
    '  Tasks: done, undo, dl <date>, boss, block',
    '  Stats: stats, achievements, map --ai',
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
async function showStartupAnimation() {
    for (const line of ASCII_ART) {
        console.log(line);
        await (0, utils_1.sleep)(15);
    }
    await (0, utils_1.sleep)(100);
}
