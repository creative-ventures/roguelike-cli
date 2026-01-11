#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const interactive_1 = require("./interactive");
const config_1 = require("./config/config");
const init_1 = require("./commands/init");
async function main() {
    // Check for "rlc init" command line argument
    const args = process.argv.slice(2);
    if (args[0] === 'init') {
        await (0, init_1.initCommand)();
        return;
    }
    let config = await (0, config_1.initConfig)();
    if (!config) {
        console.log('\n╔═══════════════════════════════════════╗');
        console.log('║     ROGUELIKE CLI NOT INITIALIZED     ║');
        console.log('╚═══════════════════════════════════════╝\n');
        console.log('Running init wizard...\n');
        await (0, init_1.initCommand)();
        config = await (0, config_1.initConfig)();
        if (!config) {
            console.log('Initialization failed. Please try again.');
            process.exit(1);
        }
    }
    await (0, interactive_1.startInteractive)(config);
}
main().catch(console.error);
