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
}

const CONFIG_FILE = path.join(os.homedir(), '.rlc', 'config.json');
const DEFAULT_STORAGE = path.join(os.homedir(), '.rlc', 'notes');

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

