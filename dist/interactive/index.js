"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInteractive = startInteractive;
const readline = __importStar(require("readline"));
const fs = __importStar(require("fs"));
const startup_1 = require("./startup");
const commands_1 = require("./commands");
const config_1 = require("../config/config");
function getCompletions(currentPath) {
    if (!fs.existsSync(currentPath)) {
        return [];
    }
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const completions = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.'))
            continue;
        completions.push(entry.name);
    }
    return completions;
}
async function startInteractive(initialConfig) {
    await (0, startup_1.showStartupAnimation)();
    let config = initialConfig;
    // Use object to hold currentPath so closures always get the current value
    const state = {
        currentPath: config.currentPath
    };
    // Completer function that uses state.currentPath
    const completer = (line) => {
        try {
            const trimmed = line.trim();
            if (!trimmed) {
                return [[], ''];
            }
            // Find the last word using regex to get exact position
            const lastWordMatch = line.match(/(\S+)$/);
            if (!lastWordMatch) {
                return [[], line];
            }
            const lastWord = lastWordMatch[1];
            const lastWordStart = lastWordMatch.index;
            const prefix = line.substring(lastWordStart);
            const parts = trimmed.split(/\s+/);
            const command = parts[0]?.toLowerCase() || '';
            // Only autocomplete if we're in a command that takes a path argument
            const commandsThatNeedCompletion = ['cd', 'open', 'cp', 'rm', 'mkdir'];
            if (commandsThatNeedCompletion.includes(command) && parts.length > 1) {
                const completions = getCompletions(state.currentPath);
                const hits = completions.filter((c) => c.toLowerCase().startsWith(lastWord.toLowerCase()));
                return [hits.length > 0 ? hits : [], prefix];
            }
            // If we're typing a command name itself
            if (parts.length === 1) {
                const commandCompletions = ['ls', 'cd', 'mkdir', 'open', 'cp', 'rm', 'tree', 'pwd', 'init', 'config', 'help', 'save', 'cancel', 'clean', 'exit', 'quit', '..', '...'];
                const hits = commandCompletions.filter((c) => c.toLowerCase().startsWith(lastWord.toLowerCase()));
                return [hits.length > 0 ? hits : commandCompletions, prefix];
            }
            return [[], line];
        }
        catch (e) {
            // Return empty completion on any error to prevent crash
            return [[], line];
        }
    };
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
        completer: completer,
    });
    let isProcessingCommand = false;
    let currentCommandAbortController = null;
    // Override SIGINT to cancel commands instead of exiting
    process.on('SIGINT', () => {
        if (isProcessingCommand) {
            // Cancel current command but stay in program
            if (currentCommandAbortController) {
                currentCommandAbortController.abort();
                currentCommandAbortController = null;
            }
            isProcessingCommand = false;
            console.log('\n^C');
            rl.prompt();
        }
        else {
            // Clear the line if not processing
            rl.write('\x1B[2K\r> ');
        }
    });
    rl.on('line', async (input) => {
        const trimmed = input.trim();
        if (trimmed === 'exit' || trimmed === 'quit') {
            rl.close();
            return;
        }
        if (trimmed === '') {
            rl.prompt();
            return;
        }
        // Create abort controller for this command
        currentCommandAbortController = new AbortController();
        isProcessingCommand = true;
        const abortController = currentCommandAbortController;
        try {
            const result = await (0, commands_1.processCommand)(trimmed, state.currentPath, config, abortController.signal, rl);
            if (abortController.signal.aborted) {
                rl.prompt();
                return;
            }
            if (result.reloadConfig) {
                const newConfig = await (0, config_1.initConfig)();
                if (newConfig) {
                    config = newConfig;
                    state.currentPath = config.currentPath;
                }
            }
            if (result.newPath) {
                state.currentPath = result.newPath;
            }
            if (result.output) {
                console.log(result.output);
            }
        }
        catch (error) {
            if (error.name === 'AbortError' || abortController.signal.aborted) {
                console.log('\nCommand cancelled.');
            }
            else {
                console.error(`Error: ${error.message}`);
            }
        }
        finally {
            isProcessingCommand = false;
            currentCommandAbortController = null;
        }
        rl.prompt();
    });
    rl.on('close', () => {
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }
        console.log('\nGoodbye!');
        process.exit(0);
    });
    rl.prompt();
}
