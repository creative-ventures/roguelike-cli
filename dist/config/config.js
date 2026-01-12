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
exports.RULES_PRESETS = exports.SUPPORTED_MODELS = void 0;
exports.initConfig = initConfig;
exports.saveConfig = saveConfig;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
// Supported models for validation
exports.SUPPORTED_MODELS = [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gpt-4o',
    'gpt-4-turbo',
    'gemini-3-pro',
    'gemini-2.0-flash',
    'grok-beta',
];
// Preset rules
exports.RULES_PRESETS = {
    default: {
        name: 'Default (No theme)',
        rules: '',
    },
    fantasy: {
        name: 'Fantasy RPG',
        rules: 'Use fantasy RPG language. Tasks are "quests", completing them is "slaying". Major milestones are "boss battles". Use terms like "adventurer", "dungeon", "loot", "guild". Add flavor text with swords, dragons, magic.',
    },
    space: {
        name: 'Space Opera',
        rules: 'Use sci-fi space language. Tasks are "missions", completing them is "mission accomplished". Major milestones are "final frontier". Use terms like "commander", "starship", "coordinates", "hyperdrive". Add flavor with stars, planets, aliens.',
    },
    starwars: {
        name: 'Star Wars',
        rules: 'Use Star Wars language. Tasks are "missions from the Rebel Alliance". Completing is "defeating the Empire". Milestones are "destroying the Death Star". Use "Jedi", "Force", "Padawan", "Master". May the Force be with you.',
    },
    western: {
        name: 'Wild West',
        rules: 'Use Wild West language. Tasks are "bounties", completing them is "collecting the reward". Milestones are "showdowns". Use terms like "sheriff", "outlaw", "saloon", "frontier", "partner". Add dusty trails and tumbleweeds.',
    },
    cyberpunk: {
        name: 'Cyberpunk',
        rules: 'Use cyberpunk language. Tasks are "gigs", completing them is "flatlined". Milestones are "megacorp takedowns". Use terms like "netrunner", "chrome", "corpo", "edgerunner", "eddies". Add neon and rain.',
    },
    pirate: {
        name: 'Pirate',
        rules: 'Use pirate language. Tasks are "plunder", completing them is "claiming the treasure". Milestones are "capturing the flagship". Use "captain", "crew", "booty", "seven seas", "landlubber". Arr matey!',
    },
};
const CONFIG_FILE = path.join(os.homedir(), '.rlc', 'config.json');
const DEFAULT_STORAGE = path.join(os.homedir(), '.rlc', 'workspace');
async function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    if (!fs.existsSync(CONFIG_FILE)) {
        return null;
    }
    const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(configData);
    if (!fs.existsSync(config.storagePath)) {
        fs.mkdirSync(config.storagePath, { recursive: true });
    }
    if (!config.currentPath) {
        config.currentPath = config.storagePath;
    }
    if (!config.model) {
        config.model = 'claude-sonnet-4-20250514';
    }
    return config;
}
function saveConfig(config) {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
function getConfig() {
    if (!fs.existsSync(CONFIG_FILE)) {
        throw new Error('Config not initialized. Run rlc first.');
    }
    const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
}
function updateConfig(updates) {
    const config = getConfig();
    const updated = { ...config, ...updates };
    saveConfig(updated);
    return updated;
}
