import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline';
import { Config, saveConfig, initConfig, RULES_PRESETS } from '../config/config';

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
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

export async function initCommand(existingRl?: readline.Interface): Promise<void> {
  const rl = existingRl || readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const shouldCloseRl = !existingRl;
  
  try {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   ROGUELIKE CLI INITIALIZATION WIZARD ║');
    console.log('╚═══════════════════════════════════════╝\n');

    const existingConfig = await initConfig();
    const oldStoragePath = existingConfig?.storagePath;

    // 1. Root directory
    const defaultRoot = path.join(os.homedir(), '.rlc', 'workspace');
    const rootDirAnswer = await question(rl, `Root directory [${defaultRoot}]: `);
    const rootDir = rootDirAnswer.trim() || defaultRoot;

    // Check if we need to migrate data
    if (oldStoragePath && oldStoragePath !== rootDir && fs.existsSync(oldStoragePath)) {
      const entries = fs.readdirSync(oldStoragePath);
      if (entries.length > 0) {
        const migrateAnswer = await question(rl, `\nMigrate existing data from ${oldStoragePath}? [Y/n]: `);
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

    const aiChoice = await question(rl, '\nEnter choice [1-5] (default: 1): ');
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

    // 3. API Key
    const existingApiKey = existingConfig?.apiKey || '';
    const hasExistingKey = existingApiKey.length > 0;
    const keyPrompt = hasExistingKey 
      ? `\nAPI key for ${selectedProvider.name} [Enter to keep existing]: `
      : `\nEnter API key for ${selectedProvider.name}: `;
    
    const apiKeyInput = await question(rl, keyPrompt);
    const apiKey = apiKeyInput.trim() || existingApiKey;
    
    if (!apiKey) {
      console.log('Warning: API key not set. You can set it later with: config -k <key>');
    } else if (apiKeyInput.trim()) {
      console.log('API key saved');
    } else {
      console.log('Using existing API key');
    }

    // 4. Theme/Rules selection
    console.log('\nSelect AI Theme (affects language style):');
    const presetKeys = Object.keys(RULES_PRESETS);
    presetKeys.forEach((key, index) => {
      console.log(`  ${index + 1}. ${RULES_PRESETS[key].name}`);
    });
    console.log(`  ${presetKeys.length + 1}. Custom (enter your own rules)`);

    const existingPreset = existingConfig?.rulesPreset || 'default';
    const defaultPresetIndex = presetKeys.indexOf(existingPreset) + 1 || 1;
    
    const themeChoice = await question(rl, `\nEnter choice [1-${presetKeys.length + 1}] (default: ${defaultPresetIndex}): `);
    const themeIndex = parseInt(themeChoice.trim()) - 1;
    
    let selectedRules = '';
    let selectedPreset = 'default';
    
    if (themeIndex >= 0 && themeIndex < presetKeys.length) {
      selectedPreset = presetKeys[themeIndex];
      selectedRules = RULES_PRESETS[selectedPreset].rules;
      console.log(`Selected: ${RULES_PRESETS[selectedPreset].name}`);
    } else if (themeIndex === presetKeys.length) {
      // Custom rules
      console.log('\nEnter your custom rules for AI (how it should speak, what terms to use):');
      console.log('Example: "Use pirate language. Tasks are treasure hunts. Be playful."');
      const customRules = await question(rl, '\nYour rules: ');
      selectedRules = customRules.trim();
      selectedPreset = 'custom';
      console.log('Custom rules saved');
    } else {
      // Default
      selectedPreset = existingConfig?.rulesPreset || 'default';
      selectedRules = existingConfig?.rules || '';
      console.log(`Keeping: ${RULES_PRESETS[selectedPreset]?.name || 'Default'}`);
    }

    // Save config
    const config: Config = {
      aiProvider: selectedProvider.name as any,
      apiKey: apiKey,
      apiUrl: selectedProvider.apiUrl,
      storagePath: rootDir,
      currentPath: rootDir,
      model: selectedProvider.model,
      rules: selectedRules,
      rulesPreset: selectedPreset,
    };

    saveConfig(config);
    
    if (!fs.existsSync(rootDir)) {
      fs.mkdirSync(rootDir, { recursive: true });
    }

    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║         INITIALIZATION COMPLETE       ║');
    console.log('╚═══════════════════════════════════════╝\n');
    console.log(`Root directory: ${rootDir}`);
    console.log(`AI Provider: ${selectedProvider.name}`);
    console.log(`Model: ${selectedProvider.model}`);
    console.log(`Theme: ${RULES_PRESETS[selectedPreset]?.name || 'Custom'}\n`);
  } finally {
    if (shouldCloseRl) {
      rl.close();
    }
  }
}

