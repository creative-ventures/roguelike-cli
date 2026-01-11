import * as fs from 'fs';
import * as path from 'path';

export interface NodeConfig {
  name: string;
  deadline?: string;
  branch?: string;
  zone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

const CONFIG_FILE = '.rlc.json';

export function readNodeConfig(nodePath: string): NodeConfig | null {
  const configPath = path.join(nodePath, CONFIG_FILE);
  
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function writeNodeConfig(nodePath: string, config: NodeConfig): void {
  if (!fs.existsSync(nodePath)) {
    fs.mkdirSync(nodePath, { recursive: true });
  }
  
  const configPath = path.join(nodePath, CONFIG_FILE);
  const existing = readNodeConfig(nodePath);
  
  const updated: NodeConfig = {
    ...existing,
    ...config,
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
}

export function createNode(
  parentPath: string,
  name: string,
  options?: {
    deadline?: string;
    branch?: string;
    zone?: string;
    description?: string;
    metadata?: Record<string, any>;
  }
): string {
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const nodePath = path.join(parentPath, safeName);
  
  const config: NodeConfig = {
    name,
    deadline: options?.deadline,
    branch: options?.branch,
    zone: options?.zone,
    description: options?.description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: options?.metadata,
  };
  
  writeNodeConfig(nodePath, config);
  
  return nodePath;
}

// Save schema content to .rlc.schema file
export function saveSchemaFile(dirPath: string, filename: string, content: string): string {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  const schemaPath = path.join(dirPath, `${safeName}.rlc.schema`);
  fs.writeFileSync(schemaPath, content, 'utf-8');
  
  return schemaPath;
}

// Read schema file
export function readSchemaFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, 'utf-8');
}

