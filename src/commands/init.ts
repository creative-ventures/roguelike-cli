import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, saveConfig, initConfig } from '../config/config';

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);
    
    let input = '';
    const onData = (chunk: Buffer) => {
      const str = chunk.toString();
      
      for (const char of str) {
        if (char === '\n' || char === '\r') {
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(input);
          return;
        } else if (char === '\x7f' || char === '\b') {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else if (char >= ' ') {
          input += char;
          process.stdout.write(char);
        }
      }
    };
    
    process.stdin.on('data', onData);
  });
}

// Recursive copy function
function copyRecursive(src: string, dest: string): void {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

export async function initCommand(): Promise<void> {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   ROGUELIKE CLI INITIALIZATION WIZARD ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Get existing config if any
  const existingConfig = await initConfig();
  const oldStoragePath = existingConfig?.storagePath;

  // 1. Root directory
  const defaultRoot = path.join(os.homedir(), '.rlc', 'workspace');
  const rootDirAnswer = await question(`Root directory for notes [${defaultRoot}]: `);
  const rootDir = rootDirAnswer.trim() || defaultRoot;

  // Check if we need to migrate data
  if (oldStoragePath && oldStoragePath !== rootDir && fs.existsSync(oldStoragePath)) {
    const entries = fs.readdirSync(oldStoragePath);
    if (entries.length > 0) {
      const migrateAnswer = await question(`\nMigrate existing data from ${oldStoragePath}? [Y/n]: `);
      if (migrateAnswer.toLowerCase() !== 'n') {
        if (!fs.existsSync(rootDir)) {
          fs.mkdirSync(rootDir, { recursive: true });
        }
        
        console.log(`Migrating data...`);
        for (const entry of entries) {
          const srcPath = path.join(oldStoragePath, entry);
          const destPath = path.join(rootDir, entry);
          copyRecursive(srcPath, destPath);
        }
        console.log(`Migrated ${entries.length} items to ${rootDir}`);
      }
    }
  }

  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
    console.log(`Created directory: ${rootDir}`);
  }

  // 2. AI Provider selection
  console.log('\nSelect AI Provider:');
  console.log('  1. Claude Sonnet 4.5');
  console.log('  2. Claude Opus 4.5');
  console.log('  3. GPT-4o (latest)');
  console.log('  4. Gemini 3 Pro');
  console.log('  5. Grok (latest)');

  const aiChoice = await question('\nEnter choice [1-5] (default: 1): ');
  const aiProviders = [
    { name: 'claude', model: 'claude-sonnet-4-20250514', apiUrl: 'https://api.anthropic.com' },
    { name: 'claude-opus', model: 'claude-opus-4-20250514', apiUrl: 'https://api.anthropic.com' },
    { name: 'openai', model: 'gpt-4o', apiUrl: 'https://api.openai.com' },
    { name: 'gemini', model: 'gemini-3-pro', apiUrl: 'https://generativelanguage.googleapis.com' },
    { name: 'grok', model: 'grok-beta', apiUrl: 'https://api.x.ai' },
  ];

  const selectedIndex = parseInt(aiChoice.trim()) - 1 || 0;
  const selectedProvider = aiProviders[selectedIndex] || aiProviders[0];

  console.log(`Selected: ${selectedProvider.name} (${selectedProvider.model})`);

  // 3. API Key - reuse existing if not provided
  const existingApiKey = existingConfig?.apiKey || '';
  const hasExistingKey = existingApiKey.length > 0;
  const keyPrompt = hasExistingKey 
    ? `\nAPI key for ${selectedProvider.name} [press Enter to keep existing]: `
    : `\nEnter API key for ${selectedProvider.name}: `;
  
  const apiKeyInput = await question(keyPrompt);
  const apiKey = apiKeyInput.trim() || existingApiKey;
  
  if (!apiKey) {
    console.log('Warning: API key not set. You can set it later with config:apiKey=<key>');
  } else if (apiKeyInput.trim()) {
    console.log('API key saved');
  } else {
    console.log('Using existing API key');
  }

  // Save config
  const config: Config = {
    aiProvider: selectedProvider.name as any,
    apiKey: apiKey,
    apiUrl: selectedProvider.apiUrl,
    storagePath: rootDir,
    currentPath: rootDir,
    model: selectedProvider.model,
  };

  saveConfig(config);
  
  // Ensure storage directory exists
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true });
  }

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║         INITIALIZATION COMPLETE       ║');
  console.log('╚═══════════════════════════════════════╝\n');
  console.log(`Root directory: ${rootDir}`);
  console.log(`AI Provider: ${selectedProvider.name}`);
  console.log(`Model: ${selectedProvider.model}\n`);
}

