import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  aiProvider: 'claude' | 'claude-opus' | 'openai' | 'gemini' | 'grok' | 'custom';
  apiKey: string;
  apiUrl?: string;
  storagePath: string;
  currentPath: string;
  model?: string;
  rules?: string;
  rulesPreset?: string;
}

// Preset rules for different themes
export const RULES_PRESETS: Record<string, { name: string; rules: string }> = {
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

export async function initConfig(): Promise<Config | null> {
  const configDir = path.dirname(CONFIG_FILE);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return null;
  }
  
  const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
  const config: Config = JSON.parse(configData);
  
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

export function saveConfig(config: Config): void {
  const configDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(): Config {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error('Config not initialized. Run rlc first.');
  }
  
  const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(configData);
}

export function updateConfig(updates: Partial<Config>): Config {
  const config = getConfig();
  const updated = { ...config, ...updates };
  saveConfig(updated);
  return updated;
}

