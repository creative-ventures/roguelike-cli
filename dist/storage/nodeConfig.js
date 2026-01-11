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
exports.readNodeConfig = readNodeConfig;
exports.writeNodeConfig = writeNodeConfig;
exports.createNode = createNode;
exports.saveSchemaFile = saveSchemaFile;
exports.readSchemaFile = readSchemaFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const CONFIG_FILE = '.rlc.json';
function readNodeConfig(nodePath) {
    const configPath = path.join(nodePath, CONFIG_FILE);
    if (!fs.existsSync(configPath)) {
        return null;
    }
    try {
        const data = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
function writeNodeConfig(nodePath, config) {
    if (!fs.existsSync(nodePath)) {
        fs.mkdirSync(nodePath, { recursive: true });
    }
    const configPath = path.join(nodePath, CONFIG_FILE);
    const existing = readNodeConfig(nodePath);
    const updated = {
        ...existing,
        ...config,
        updatedAt: new Date().toISOString(),
        createdAt: existing?.createdAt || new Date().toISOString(),
    };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
}
function createNode(parentPath, name, options) {
    const safeName = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const nodePath = path.join(parentPath, safeName);
    const config = {
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
function saveSchemaFile(dirPath, filename, content) {
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
function readSchemaFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf-8');
}
