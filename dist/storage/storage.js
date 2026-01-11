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
exports.listSchemas = listSchemas;
exports.navigateToNode = navigateToNode;
exports.readSchema = readSchema;
exports.getTree = getTree;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const nodeConfig_1 = require("./nodeConfig");
function listSchemas(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return [];
    }
    const items = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        // Skip hidden files
        if (entry.name.startsWith('.')) {
            continue;
        }
        if (entry.isDirectory()) {
            const config = (0, nodeConfig_1.readNodeConfig)(fullPath);
            items.push({
                name: entry.name,
                path: fullPath,
                config,
            });
        }
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
}
function navigateToNode(currentPath, nodeName) {
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
function readSchema(nodePath) {
    // Read node config and return its info
    const config = (0, nodeConfig_1.readNodeConfig)(nodePath);
    if (!config) {
        return null;
    }
    let output = `${config.name}`;
    if (config.deadline)
        output += `\nDeadline: ${config.deadline}`;
    if (config.branch)
        output += `\nBranch: ${config.branch}`;
    if (config.zone)
        output += `\nZone: ${config.zone}`;
    if (config.description)
        output += `\n${config.description}`;
    return output;
}
function getTree(dirPath, prefix = '', isLast = true, maxDepth = 10, currentDepth = 0, showFiles = false) {
    if (currentDepth >= maxDepth) {
        return [];
    }
    const lines = [];
    // Get items - either just folders or all entries
    let items = [];
    if (showFiles) {
        // Show all files and folders
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith('.'))
                continue;
            const fullPath = path.join(dirPath, entry.name);
            const config = entry.isDirectory() ? (0, nodeConfig_1.readNodeConfig)(fullPath) : null;
            items.push({
                name: entry.name,
                path: fullPath,
                isDir: entry.isDirectory(),
                config
            });
        }
        // Sort: folders first, then files
        items.sort((a, b) => {
            if (a.isDir !== b.isDir)
                return a.isDir ? -1 : 1;
            return a.name.localeCompare(b.name);
        });
    }
    else {
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
