import * as fs from 'fs';
import * as path from 'path';
import { readNodeConfig, NodeConfig } from './nodeConfig';

export interface SchemaInfo {
  name: string;
  path: string;
  config?: NodeConfig | null;
}

export function listSchemas(dirPath: string): SchemaInfo[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  
  const items: SchemaInfo[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    // Skip hidden files
    if (entry.name.startsWith('.')) {
      continue;
    }
    
    if (entry.isDirectory()) {
      const config = readNodeConfig(fullPath);
      items.push({
        name: entry.name,
        path: fullPath,
        config,
      });
    }
  }
  
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export function navigateToNode(currentPath: string, nodeName: string): string | null {
  const schemas = listSchemas(currentPath);
  const node = schemas.find(s => s.name.toLowerCase() === nodeName.toLowerCase());
  
  if (!node) {
    return null;
  }
  
  if (fs.statSync(node.path).isDirectory()) {
    return node.path;
  }
  
  return node.path;
}

export function readSchema(nodePath: string): string | null {
  // Read node config and return its info
  const config = readNodeConfig(nodePath);
  
  if (!config) {
    return null;
  }
  
  let output = `${config.name}`;
  if (config.deadline) output += `\nDeadline: ${config.deadline}`;
  if (config.branch) output += `\nBranch: ${config.branch}`;
  if (config.zone) output += `\nZone: ${config.zone}`;
  if (config.description) output += `\n${config.description}`;
  
  return output;
}

export function getTree(dirPath: string, prefix = '', isLast = true, maxDepth = 10, currentDepth = 0, showFiles = false): string[] {
  if (currentDepth >= maxDepth) {
    return [];
  }
  
  const lines: string[] = [];
  
  // Get items - either just folders or all entries
  let items: { name: string; path: string; isDir: boolean; config?: any }[] = [];
  
  if (showFiles) {
    // Show all files and folders
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      const config = entry.isDirectory() ? readNodeConfig(fullPath) : null;
      
      items.push({
        name: entry.name,
        path: fullPath,
        isDir: entry.isDirectory(),
        config
      });
    }
    // Sort: folders first, then files
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } else {
    // Only folders (original behavior)
    const schemas = listSchemas(dirPath);
    items = schemas.map(s => ({
      name: s.name,
      path: s.path,
      isDir: true,
      config: s.config
    }));
  }
  
  items.forEach((item, index) => {
    const isItemLast = index === items.length - 1;
    const connector = isItemLast ? '└──' : '├──';
    const currentPrefix = prefix + (isLast ? '    ' : '│   ');
    
    let displayName = item.name;
    
    // Add file indicator
    if (!item.isDir) {
      displayName = `* ${displayName}`;
    }
    
    if (item.config?.deadline) {
      displayName += ` [${item.config.deadline}]`;
    }
    if (item.config?.branch) {
      displayName += ` (${item.config.branch})`;
    }
    
    lines.push(`${prefix}${connector} ${displayName}`);
    
    if (item.isDir) {
      const childLines = getTree(item.path, currentPrefix, isItemLast, maxDepth, currentDepth + 1, showFiles);
      lines.push(...childLines);
    }
  });
  
  return lines;
}

