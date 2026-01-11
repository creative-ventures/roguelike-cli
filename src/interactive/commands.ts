import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { Config } from '../config/config';
import { listSchemas, navigateToNode, getTree } from '../storage/storage';
import { saveSchemaFile, writeNodeConfig } from '../storage/nodeConfig';
import { generateSchemaWithAI } from '../ai/claude';

// Parse tree ASCII art and create folder structure
function createFoldersFromTree(rootPath: string, treeContent: string): void {
  // Create root folder
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }
  
  // Parse tree lines
  const lines = treeContent.split('\n');
  const stack: { path: string; indent: number }[] = [{ path: rootPath, indent: -1 }];
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Extract node name from tree line
    // Patterns: "├── Name", "└── Name", "│   ├── Name", etc.
    const match = line.match(/^([\s│]*)[├└]──\s*(.+)$/);
    if (!match) continue;
    
    const prefix = match[1];
    let nodeName = match[2].trim();
    
    // Calculate indent level (each │ or space block = 1 level)
    const indent = Math.floor(prefix.replace(/│/g, ' ').length / 4);
    
    // Clean node name - remove extra info in parentheses, brackets
    nodeName = nodeName.replace(/\s*\([^)]*\)\s*/g, '').trim();
    nodeName = nodeName.replace(/\s*\[[^\]]*\]\s*/g, '').trim();
    
    // Create safe folder name
    const safeName = nodeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    if (!safeName) continue;
    
    // Pop stack until we find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parentPath = stack[stack.length - 1].path;
    const folderPath = path.join(parentPath, safeName);
    
    // Create folder
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    // Create node config
    writeNodeConfig(folderPath, {
      name: nodeName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Push to stack
    stack.push({ path: folderPath, indent });
  }
}

// Generate dungeon map visualization from folder structure
function generateDungeonMap(dirPath: string): string {
  if (!fs.existsSync(dirPath)) {
    return 'Directory does not exist.';
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
  
  if (folders.length === 0) {
    return 'No rooms to display. Create some tasks first.';
  }
  
  const lines: string[] = [];
  const roomWidth = 20;
  const roomsPerRow = 2;
  const wall = '█';
  const door = '+';
  const task = '*';
  const milestone = '@';
  
  // Group folders into rows of 2
  const rows: typeof folders[] = [];
  for (let i = 0; i < folders.length; i += roomsPerRow) {
    rows.push(folders.slice(i, i + roomsPerRow));
  }
  
  // Top border
  lines.push('  ' + wall.repeat(roomWidth * roomsPerRow + 3));
  
  rows.forEach((row, rowIndex) => {
    // Room content
    for (let line = 0; line < 6; line++) {
      let rowStr = '  ' + wall;
      
      row.forEach((folder, colIndex) => {
        const name = folder.name.replace(/-/g, ' ');
        const displayName = name.length > roomWidth - 4 
          ? name.substring(0, roomWidth - 7) + '...' 
          : name;
        
        // Get sub-items
        const subPath = path.join(dirPath, folder.name);
        const subEntries = fs.existsSync(subPath) 
          ? fs.readdirSync(subPath, { withFileTypes: true })
              .filter(e => e.isDirectory() && !e.name.startsWith('.'))
          : [];
        
        if (line === 0) {
          // Empty line
          rowStr += ' '.repeat(roomWidth - 1) + wall;
        } else if (line === 1) {
          // Room name
          const title = `[${displayName}]`;
          const padding = roomWidth - title.length - 1;
          rowStr += ' ' + title + ' '.repeat(Math.max(0, padding - 1)) + wall;
        } else if (line >= 2 && line <= 4) {
          // Sub-items
          const itemIndex = line - 2;
          if (itemIndex < subEntries.length) {
            const subName = subEntries[itemIndex].name.replace(/-/g, ' ');
            const shortName = subName.length > roomWidth - 6 
              ? subName.substring(0, roomWidth - 9) + '...' 
              : subName;
            const marker = subName.toLowerCase().includes('boss') || 
                          subName.toLowerCase().includes('launch') ||
                          subName.toLowerCase().includes('deploy')
              ? milestone : task;
            const itemStr = `${marker} ${shortName}`;
            const itemPadding = roomWidth - itemStr.length - 1;
            rowStr += ' ' + itemStr + ' '.repeat(Math.max(0, itemPadding - 1)) + wall;
          } else {
            rowStr += ' '.repeat(roomWidth - 1) + wall;
          }
        } else {
          // Empty line
          rowStr += ' '.repeat(roomWidth - 1) + wall;
        }
        
        // Add door between rooms
        if (colIndex < row.length - 1 && line === 3) {
          rowStr = rowStr.slice(0, -1) + door + door + door;
        } else if (colIndex < row.length - 1) {
          rowStr = rowStr.slice(0, -1) + wall;
        }
      });
      
      // Fill empty space if odd number of rooms
      if (row.length < roomsPerRow) {
        rowStr += ' '.repeat(roomWidth) + wall;
      }
      
      lines.push(rowStr);
    }
    
    // Bottom border with doors to next row
    if (rowIndex < rows.length - 1) {
      let borderStr = '  ' + wall.repeat(Math.floor(roomWidth / 2)) + door;
      borderStr += wall.repeat(roomWidth - 1) + door;
      borderStr += wall.repeat(Math.floor(roomWidth / 2) + 1);
      lines.push(borderStr);
      
      // Corridor
      let corridorStr = '  ' + ' '.repeat(Math.floor(roomWidth / 2)) + '│';
      corridorStr += ' '.repeat(roomWidth - 1) + '│';
      lines.push(corridorStr);
      
      borderStr = '  ' + wall.repeat(Math.floor(roomWidth / 2)) + door;
      borderStr += wall.repeat(roomWidth - 1) + door;
      borderStr += wall.repeat(Math.floor(roomWidth / 2) + 1);
      lines.push(borderStr);
    }
  });
  
  // Bottom border
  lines.push('  ' + wall.repeat(roomWidth * roomsPerRow + 3));
  
  // Legend
  lines.push('');
  lines.push(`Legend: ${task} Task  ${milestone} Milestone  ${door} Door  ${wall} Wall`);
  
  return lines.join('\n');
}

export interface CommandResult {
  output?: string;
  newPath?: string;
  reloadConfig?: boolean;
}

// Pending schema waiting to be saved
export interface PendingSchema {
  title: string;
  content: string;
  format: 'block' | 'tree';
  tree?: any[];
}

// Conversation history for AI context
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Session state for dialog mode
export interface SessionState {
  pending: PendingSchema | null;
  history: ConversationMessage[];
}

// Global session state
export const sessionState: SessionState = {
  pending: null,
  history: []
};

// Format items in columns like native ls
function formatColumns(items: string[], termWidth: number = 80): string {
  if (items.length === 0) return '';
  
  const maxLen = Math.max(...items.map(s => s.length)) + 2;
  const cols = Math.max(1, Math.floor(termWidth / maxLen));
  
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += cols) {
    const row = items.slice(i, i + cols);
    rows.push(row.map(item => item.padEnd(maxLen)).join('').trimEnd());
  }
  
  return rows.join('\n');
}

// Copy to clipboard (cross-platform)
function copyToClipboard(text: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execSync('pbcopy', { input: text });
    } else if (platform === 'win32') {
      execSync('clip', { input: text });
    } else {
      // Linux - try xclip or xsel
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
    }
  } catch (e) {
    // Silently fail if clipboard not available
  }
}

// Helper function for recursive copy
function copyRecursive(src: string, dest: string): void {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);
      copyRecursive(srcPath, destPath);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

export async function processCommand(
  input: string,
  currentPath: string,
  config: Config,
  signal?: AbortSignal,
  rl?: readline.Interface
): Promise<CommandResult> {
  // Check for clipboard pipe
  const clipboardPipe = /\s*\|\s*(pbcopy|copy|clip)\s*$/i;
  const shouldCopy = clipboardPipe.test(input);
  const cleanInput = input.replace(clipboardPipe, '').trim();
  
  const parts = cleanInput.split(' ').filter(p => p.length > 0);
  const command = parts[0].toLowerCase();
  
  // Helper to wrap result with clipboard copy
  const wrapResult = (result: CommandResult): CommandResult => {
    if (shouldCopy && result.output) {
      copyToClipboard(result.output);
      result.output += '\n\n[copied to clipboard]';
    }
    return result;
  };
  
  // Version command
  if (command === 'v' || command === 'version') {
    const pkg = require('../../package.json');
    return wrapResult({ output: `Roguelike CLI v${pkg.version}` });
  }
  
  // Map command - dungeon visualization
  if (command === 'map') {
    const dungeonMap = generateDungeonMap(currentPath);
    return wrapResult({ output: dungeonMap });
  }
  
  if (command === 'ls') {
    if (!fs.existsSync(currentPath)) {
      return wrapResult({ output: 'Directory does not exist.' });
    }
    
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    const items: string[] = [];
    
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      if (entry.isDirectory()) {
        items.push(entry.name + '/');
      } else {
        items.push(entry.name);
      }
    }
    
    if (items.length === 0) {
      return wrapResult({ output: '' });
    }
    
    const termWidth = process.stdout.columns || 80;
    return wrapResult({ output: formatColumns(items, termWidth) });
  }
  
  if (command === 'tree') {
    const showFiles = parts.includes('-A') || parts.includes('--all');
    
    // Parse depth: --depth=N or -d N
    let maxDepth = 10;
    const depthFlag = parts.find(p => p.startsWith('--depth='));
    if (depthFlag) {
      maxDepth = parseInt(depthFlag.split('=')[1]) || 10;
    } else {
      const dIndex = parts.indexOf('-d');
      if (dIndex !== -1 && parts[dIndex + 1]) {
        maxDepth = parseInt(parts[dIndex + 1]) || 10;
      }
    }
    
    const treeLines = getTree(currentPath, '', true, maxDepth, 0, showFiles);
    if (treeLines.length === 0) {
      return wrapResult({ output: 'No items found.' });
    }
    return wrapResult({ output: treeLines.join('\n') });
  }
  
  // Handle navigation without 'cd' command (.., ...)
  if (command === '..' || command === '...') {
    let levels = command === '...' ? 2 : 1;
    let targetPath = currentPath;
    
    for (let i = 0; i < levels; i++) {
      const parentPath = path.dirname(targetPath);
      if (parentPath === config.storagePath || parentPath.length < config.storagePath.length) {
        return { output: 'Already at root.' };
      }
      targetPath = parentPath;
    }
    
    return { newPath: targetPath, output: '' };
  }
  
  if (command === 'mkdir') {
    if (parts.length < 2) {
      return { output: 'Usage: mkdir <name>' };
    }
    
    const name = parts.slice(1).join(' ');
    const { createNode } = require('../storage/nodeConfig');
    
    try {
      const nodePath = createNode(currentPath, name);
      return { output: `Created: ${name}` };
    } catch (error: any) {
      return { output: `Error: ${error.message}` };
    }
  }
  
  if (command === 'cp') {
    if (parts.length < 3) {
      return { output: 'Usage: cp <source> <destination>' };
    }
    
    const source = parts[1];
    const dest = parts[2];
    
    const sourcePath = path.isAbsolute(source) ? source : path.join(currentPath, source);
    const destPath = path.isAbsolute(dest) ? dest : path.join(currentPath, dest);
    
    if (!fs.existsSync(sourcePath)) {
      return { output: `Source not found: ${source}` };
    }
    
    try {
      copyRecursive(sourcePath, destPath);
      return { output: `Copied: ${source} -> ${dest}` };
    } catch (error: any) {
      return { output: `Error: ${error.message}` };
    }
  }
  
  if (command === 'mv' || command === 'move') {
    if (parts.length < 3) {
      return { output: 'Usage: mv <source> <destination>' };
    }
    
    const source = parts[1];
    const dest = parts[2];
    
    const sourcePath = path.isAbsolute(source) ? source : path.join(currentPath, source);
    const destPath = path.isAbsolute(dest) ? dest : path.join(currentPath, dest);
    
    if (!fs.existsSync(sourcePath)) {
      return { output: `Source not found: ${source}` };
    }
    
    try {
      fs.renameSync(sourcePath, destPath);
      return { output: `Moved: ${source} -> ${dest}` };
    } catch (error: any) {
      // If rename fails (cross-device), copy then delete
      try {
        copyRecursive(sourcePath, destPath);
        fs.rmSync(sourcePath, { recursive: true, force: true });
        return { output: `Moved: ${source} -> ${dest}` };
      } catch (e: any) {
        return { output: `Error: ${e.message}` };
      }
    }
  }
  
  if (command === 'open') {
    const { exec } = require('child_process');
    
    // open or open . - open current folder in system file manager
    if (parts.length < 2 || parts[1] === '.') {
      exec(`open "${currentPath}"`);
      return { output: `Opening: ${currentPath}` };
    }
    
    const name = parts.slice(1).join(' ');
    const targetPath = path.join(currentPath, name);
    
    // Check if target exists
    if (fs.existsSync(targetPath)) {
      const stat = fs.statSync(targetPath);
      
      if (stat.isDirectory()) {
        // It's a folder, open in file manager
        exec(`open "${targetPath}"`);
        return { output: `Opening: ${targetPath}` };
      }
      
      if (stat.isFile()) {
        // It's a file, show its content (supports | pbcopy)
        const content = fs.readFileSync(targetPath, 'utf-8');
        return wrapResult({ output: content });
      }
    }
    
    return wrapResult({ output: `Not found: ${name}` });
  }
  
  if (command === 'rm') {
    if (parts.length < 2) {
      return { output: 'Usage: rm <name> or rm -rf <name>' };
    }
    
    const isRecursive = parts[1] === '-rf' || parts[1] === '-r';
    const targetName = isRecursive ? parts.slice(2).join(' ') : parts.slice(1).join(' ');
    
    if (!targetName) {
      return { output: 'Usage: rm <name> or rm -rf <name>' };
    }
    
    const targetPath = path.isAbsolute(targetName) ? targetName : path.join(currentPath, targetName);
    
    if (!fs.existsSync(targetPath)) {
      return { output: `Not found: ${targetName}` };
    }
    
    try {
      if (isRecursive) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        const stat = fs.statSync(targetPath);
        if (stat.isDirectory()) {
          return { output: `Error: ${targetName} is a directory. Use rm -rf to remove directories.` };
        }
        fs.unlinkSync(targetPath);
      }
      return { output: `Removed: ${targetName}` };
    } catch (error: any) {
      return { output: `Error: ${error.message}` };
    }
  }
  
  if (command === 'init') {
    const { initCommand } = await import('../commands/init');
    await initCommand(rl);
    return { output: 'Initialization complete. You can now use rlc.\n', reloadConfig: true };
  }
  
  if (command === 'cd') {
    if (parts.length < 2) {
      return { output: 'Usage: cd <node> or cd .. or cd <path>' };
    }
    
    const target = parts.slice(1).join(' ');
    
    if (target === '..') {
      const parentPath = path.dirname(currentPath);
      if (parentPath === config.storagePath || parentPath.length < config.storagePath.length) {
        return { output: 'Already at root.' };
      }
      return { newPath: parentPath, output: '' };
    }
    
    if (target === '...') {
      let targetPath = path.dirname(currentPath);
      targetPath = path.dirname(targetPath);
      if (targetPath.length < config.storagePath.length) {
        return { output: 'Already at root.' };
      }
      return { newPath: targetPath, output: '' };
    }
    
    // Handle paths like "cd bank/account" or "cd ../other"
    if (target.includes('/')) {
      let targetPath = currentPath;
      const pathParts = target.split('/');
      
      for (const part of pathParts) {
        if (part === '..') {
          targetPath = path.dirname(targetPath);
        } else if (part === '.') {
          continue;
        } else {
          const newPath = navigateToNode(targetPath, part);
          if (!newPath) {
            return { output: `Path "${target}" not found.` };
          }
          targetPath = newPath;
        }
      }
      
      return { newPath: targetPath, output: '' };
    }
    
    const newPath = navigateToNode(currentPath, target);
    if (!newPath) {
      return { output: `Node "${target}" not found.` };
    }
    
    return { newPath, output: '' };
  }
  
  if (command === 'pwd') {
    return wrapResult({ output: currentPath });
  }
  
  if (command === 'config') {
    const maskedKey = config.apiKey 
      ? config.apiKey.slice(0, 8) + '...' + config.apiKey.slice(-4)
      : '(not set)';
    
    const output = `
Provider:     ${config.aiProvider}
Model:        ${config.model || '(default)'}
API Key:      ${maskedKey}
Storage:      ${config.storagePath}
`.trim();
    
    return wrapResult({ output });
  }
  
  if (command.startsWith('config:')) {
    const configParts = input.split(':').slice(1).join(':').trim().split('=');
    if (configParts.length !== 2) {
      return { output: 'Usage: config:key=value' };
    }
    
    const key = configParts[0].trim();
    const value = configParts[1].trim();
    
    if (key === 'apiKey') {
      const { updateConfig } = await import('../config/config');
      updateConfig({ apiKey: value });
      return { output: 'API key updated.' };
    }
    
    if (key === 'storagePath') {
      const { updateConfig } = await import('../config/config');
      updateConfig({ storagePath: value, currentPath: value });
      return { output: `Storage path updated to: ${value}` };
    }
    
    return { output: `Unknown config key: ${key}` };
  }
  
  if (command === 'help') {
    return wrapResult({
      output: `Commands:
  init                  - Initialize rlc (first time setup)
  ls                    - List all schemas, todos, and notes
  tree                  - Show directory tree structure
  tree -A               - Show tree with files
  tree --depth=N        - Limit tree depth (e.g., --depth=2)
  map                   - Dungeon map visualization
  cd <node>             - Navigate into a node
  cd ..                 - Go back to parent
  pwd                   - Show current path
  open                  - Open current folder in Finder
  open <folder>         - Open specific folder in Finder
  mkdir <name>          - Create new folder
  cp <src> <dest>       - Copy file or folder
  mv <src> <dest>       - Move/rename file or folder
  rm <name>             - Delete file
  rm -rf <name>         - Delete folder recursively
  config                - Show configuration
  config:apiKey=<key>   - Set API key
  v, version            - Show version
  <description>         - Create schema/todo (AI generates preview)
  save                  - Save pending schema to disk
  cancel                - Discard pending schema
  clean                 - Show items to delete in current folder
  clean --yes           - Delete all items in current folder
  exit/quit             - Exit the program

Clipboard:
  ls | pbcopy           - Copy output to clipboard (macOS)
  tree | pbcopy         - Works with any command
  config | copy         - Alternative for Windows

Workflow:
  1. Type description (e.g., "todo: deploy app")
  2. AI generates schema preview
  3. Refine with more instructions if needed
  4. Type "save" to save or "cancel" to discard

Examples:

  > todo opening company in delaware

  ┌─ TODO opening company in delaware ───────────────────────────┐
  │                                                               │
  ├── register business name                                     │
  ├── file incorporation papers                                  │
  ├── get EIN number                                             │
  └── Branch: legal                                               │
      └── open business bank account                             │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘

  > yandex cloud production infrastructure

  ┌─────────────────────────────────────────────────────────────┐
  │                  Yandex Cloud                               │
  │                                                             │
  │  ┌──────────────────┐      ┌──────────────────┐           │
  │  │ back-fastapi     │      │ admin-next       │           │
  │  │ (VM)             │      │ (VM)             │           │
  │  └────────┬─────────┘      └──────────────────┘           │
  │           │                                                 │
  │           ├──────────────────┬─────────────────┐           │
  │           │                  │                 │           │
  │  ┌────────▼────────┐  ┌─────▼──────┐   ┌──────▼────────┐  │
  │  │   PostgreSQL    │  │   Redis    │   │  Cloudflare   │  │
  │  │  (Existing DB)  │  │  Cluster   │   │  R2 Storage   │  │
  │  └─────────────────┘  └────────────┘   └───────────────┘  │
  └─────────────────────────────────────────────────────────────┘

  > architecture production redis web application

  ┌─ Architecture production redis web application ────────────┐
  │                                                               │
  ├── load-balancer                                               │
  ├── web-servers                                                 │
  │   ├── app-server-1                                            │
  │   ├── app-server-2                                            │
  │   └── app-server-3                                            │
  ├── redis                                                       │
  │   ├── cache-cluster                                           │
  │   └── session-store                                           │
  └── database                                                    │
      ├── postgres-primary                                        │
      └── postgres-replica                                        │
  │                                                               │
  └───────────────────────────────────────────────────────────────┘

  > kubernetes cluster with clusters postgres and redis

  ┌─────────────────────────────────────────────────────────────┐
  │         Kubernetes cluster with clusters postgres          │
  │                                                             │
  │  ┌──────────────┐      ┌──────────────┐                  │
  │  │   postgres   │      │    redis     │                  │
  │  │              │      │              │                  │
  │  │ primary-pod  │      │ cache-pod-1  │                  │
  │  │ replica-pod-1│      │ cache-pod-2  │                  │
  │  │ replica-pod-2│      │              │                  │
  │  └──────┬───────┘      └──────┬───────┘                  │
  │         │                      │                           │
  │         └──────────┬───────────┘                           │
  │                    │                                         │
  │            ┌───────▼────────┐                              │
  │            │ worker-zones   │                              │
  │            │   zone-1       │                              │
  │            │   zone-2       │                              │
  │            └────────────────┘                              │
  └─────────────────────────────────────────────────────────────┘

www.rlc.rocks`
    });
  }
  
  // Save command - save pending schema/todo
  if (command === 'save') {
    if (!sessionState.pending) {
      return wrapResult({ output: 'Nothing to save. Create a schema first.' });
    }
    
    const pending = sessionState.pending;
    const safeName = pending.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    if (pending.format === 'tree') {
      // Create folder structure from tree ASCII art
      const rootPath = path.join(currentPath, safeName);
      createFoldersFromTree(rootPath, pending.content);
      
      // Clear session
      sessionState.pending = null;
      sessionState.history = [];
      
      return wrapResult({ output: `Created todo folder: ${safeName}/` });
    } else {
      // Save as .rlc.schema file
      const schemaPath = saveSchemaFile(
        currentPath,
        pending.title,
        pending.content
      );
      const filename = path.basename(schemaPath);
      
      // Clear session
      sessionState.pending = null;
      sessionState.history = [];
      
      return wrapResult({ output: `Saved: ${filename}` });
    }
  }
  
  // Cancel command - discard pending schema
  if (command === 'cancel') {
    if (!sessionState.pending) {
      return wrapResult({ output: 'Nothing to cancel.' });
    }
    
    sessionState.pending = null;
    sessionState.history = [];
    
    return wrapResult({ output: 'Discarded pending schema.' });
  }
  
  // Clean command - clear current directory
  if (command === 'clean') {
    const entries = fs.readdirSync(currentPath);
    const toDelete = entries.filter(e => !e.startsWith('.'));
    
    if (toDelete.length === 0) {
      return wrapResult({ output: 'Directory is already empty.' });
    }
    
    // Check for --yes flag to skip confirmation
    if (!parts.includes('--yes') && !parts.includes('-y')) {
      return wrapResult({ 
        output: `Will delete ${toDelete.length} items:\n${toDelete.join('\n')}\n\nRun "clean --yes" to confirm.` 
      });
    }
    
    for (const entry of toDelete) {
      const entryPath = path.join(currentPath, entry);
      fs.rmSync(entryPath, { recursive: true, force: true });
    }
    
    return wrapResult({ output: `Deleted ${toDelete.length} items.` });
  }
  
  // AI generation - store in pending, don't save immediately
  const fullInput = cleanInput;
  
  // Add user message to history
  sessionState.history.push({ role: 'user', content: fullInput });
  
  const schema = await generateSchemaWithAI(fullInput, config, signal, sessionState.history);
  
  if (signal?.aborted) {
    return { output: 'Command cancelled.' };
  }
  
  if (schema) {
    // Store in pending
    sessionState.pending = {
      title: schema.title,
      content: schema.content,
      format: schema.format,
      tree: schema.tree
    };
    
    // Add assistant response to history
    sessionState.history.push({ role: 'assistant', content: schema.content });
    
    const safeName = schema.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    const saveHint = schema.format === 'tree'
      ? `[Type "save" to create folder ${safeName}/, or refine with more instructions]`
      : `[Type "save" to save as ${safeName}.rlc.schema, or refine with more instructions]`;
    
    return wrapResult({ 
      output: `\n${schema.content}\n\n${saveHint}` 
    });
  }
  
  return wrapResult({ output: 'Could not generate schema. Make sure API key is set.' });
}

