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
exports.sessionState = void 0;
exports.processCommand = processCommand;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const storage_1 = require("../storage/storage");
const nodeConfig_1 = require("../storage/nodeConfig");
const claude_1 = require("../ai/claude");
const profile_1 = require("../storage/profile");
// Parse tree ASCII art and create folder structure
function createFoldersFromTree(rootPath, treeContent) {
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath, { recursive: true });
    }
    const lines = treeContent.split('\n');
    const stack = [{ path: rootPath, indent: -1 }];
    for (const line of lines) {
        if (!line.trim())
            continue;
        const match = line.match(/^([\s│]*)[├└]──\s*(.+)$/);
        if (!match)
            continue;
        const prefix = match[1];
        let nodeName = match[2].trim();
        const indent = Math.floor(prefix.replace(/│/g, ' ').length / 4);
        // Extract metadata from node name
        const isBoss = /\[BOSS\]/i.test(nodeName) || /\[MILESTONE\]/i.test(nodeName);
        const deadlineMatch = nodeName.match(/\[(?:DUE|DEADLINE):\s*([^\]]+)\]/i);
        const deadline = deadlineMatch ? deadlineMatch[1].trim() : undefined;
        // Clean node name
        nodeName = nodeName.replace(/\s*\([^)]*\)\s*/g, '').trim();
        nodeName = nodeName.replace(/\s*\[[^\]]*\]\s*/g, '').trim();
        const safeName = nodeName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
        if (!safeName)
            continue;
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }
        const parentPath = stack[stack.length - 1].path;
        const folderPath = path.join(parentPath, safeName);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }
        // Calculate depth for XP
        const depth = stack.length;
        (0, nodeConfig_1.writeNodeConfig)(folderPath, {
            name: nodeName,
            status: 'open',
            xp: (0, nodeConfig_1.calculateXP)(depth, isBoss),
            isBoss,
            deadline,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        stack.push({ path: folderPath, indent });
    }
}
// Generate dungeon map visualization from folder structure
function generateDungeonMap(dirPath, config) {
    if (!fs.existsSync(dirPath)) {
        return 'Directory does not exist.';
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    if (folders.length === 0) {
        return 'No rooms to display. Create some tasks first.';
    }
    const lines = [];
    const roomWidth = 20;
    const roomsPerRow = 2;
    const wall = '#';
    const door = '+';
    const task = '*';
    const milestone = '@';
    const done = 'x';
    const blocked = '!';
    const rows = [];
    for (let i = 0; i < folders.length; i += roomsPerRow) {
        rows.push(folders.slice(i, i + roomsPerRow));
    }
    lines.push('');
    lines.push('  ' + wall.repeat(roomWidth * roomsPerRow + 3));
    rows.forEach((row, rowIndex) => {
        for (let line = 0; line < 6; line++) {
            let rowStr = '  ' + wall;
            row.forEach((folder, colIndex) => {
                const folderPath = path.join(dirPath, folder.name);
                const nodeConfig = (0, nodeConfig_1.readNodeConfig)(folderPath);
                const name = (nodeConfig?.name || folder.name).replace(/-/g, ' ');
                const displayName = name.length > roomWidth - 4
                    ? name.substring(0, roomWidth - 7) + '...'
                    : name;
                const subPath = path.join(dirPath, folder.name);
                const subEntries = fs.existsSync(subPath)
                    ? fs.readdirSync(subPath, { withFileTypes: true })
                        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
                    : [];
                if (line === 0) {
                    rowStr += ' '.repeat(roomWidth - 1) + wall;
                }
                else if (line === 1) {
                    const statusIcon = nodeConfig?.status === 'done' ? '[DONE]'
                        : nodeConfig?.isBoss ? '[BOSS]'
                            : '';
                    const title = statusIcon ? `${statusIcon}` : `[${displayName}]`;
                    const padding = roomWidth - title.length - 1;
                    rowStr += ' ' + title + ' '.repeat(Math.max(0, padding - 1)) + wall;
                }
                else if (line === 2 && !nodeConfig?.isBoss) {
                    const title = `[${displayName}]`;
                    const padding = roomWidth - title.length - 1;
                    rowStr += ' ' + title + ' '.repeat(Math.max(0, padding - 1)) + wall;
                }
                else if (line >= 2 && line <= 4) {
                    const itemIndex = nodeConfig?.isBoss ? line - 2 : line - 3;
                    if (itemIndex >= 0 && itemIndex < subEntries.length) {
                        const subConfig = (0, nodeConfig_1.readNodeConfig)(path.join(subPath, subEntries[itemIndex].name));
                        const subName = (subConfig?.name || subEntries[itemIndex].name).replace(/-/g, ' ');
                        const shortName = subName.length > roomWidth - 6
                            ? subName.substring(0, roomWidth - 9) + '...'
                            : subName;
                        let marker = task;
                        if (subConfig?.status === 'done')
                            marker = done;
                        else if (subConfig?.status === 'blocked')
                            marker = blocked;
                        else if (subConfig?.isBoss)
                            marker = milestone;
                        const itemStr = `${marker} ${shortName}`;
                        const itemPadding = roomWidth - itemStr.length - 1;
                        rowStr += ' ' + itemStr + ' '.repeat(Math.max(0, itemPadding - 1)) + wall;
                    }
                    else {
                        rowStr += ' '.repeat(roomWidth - 1) + wall;
                    }
                }
                else {
                    rowStr += ' '.repeat(roomWidth - 1) + wall;
                }
                if (colIndex < row.length - 1 && line === 3) {
                    rowStr = rowStr.slice(0, -1) + door + door + door;
                }
                else if (colIndex < row.length - 1) {
                    rowStr = rowStr.slice(0, -1) + wall;
                }
            });
            if (row.length < roomsPerRow) {
                rowStr += ' '.repeat(roomWidth) + wall;
            }
            lines.push(rowStr);
        }
        if (rowIndex < rows.length - 1) {
            let borderStr = '  ' + wall.repeat(Math.floor(roomWidth / 2)) + door;
            borderStr += wall.repeat(roomWidth - 1) + door;
            borderStr += wall.repeat(Math.floor(roomWidth / 2) + 1);
            lines.push(borderStr);
            let corridorStr = '  ' + ' '.repeat(Math.floor(roomWidth / 2)) + '|';
            corridorStr += ' '.repeat(roomWidth - 1) + '|';
            lines.push(corridorStr);
            borderStr = '  ' + wall.repeat(Math.floor(roomWidth / 2)) + door;
            borderStr += wall.repeat(roomWidth - 1) + door;
            borderStr += wall.repeat(Math.floor(roomWidth / 2) + 1);
            lines.push(borderStr);
        }
    });
    lines.push('  ' + wall.repeat(roomWidth * roomsPerRow + 3));
    lines.push('');
    lines.push(`Legend: ${task} Task  ${done} Done  ${milestone} Boss/Milestone  ${blocked} Blocked  ${door} Door`);
    return lines.join('\n');
}
// Parse human-readable date
function parseDeadline(input) {
    const lower = input.toLowerCase().trim();
    const today = new Date();
    if (lower === 'today') {
        return today.toISOString().split('T')[0];
    }
    if (lower === 'tomorrow') {
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
    }
    // +Nd format (e.g., +3d, +7d)
    const plusDaysMatch = lower.match(/^\+(\d+)d$/);
    if (plusDaysMatch) {
        today.setDate(today.getDate() + parseInt(plusDaysMatch[1]));
        return today.toISOString().split('T')[0];
    }
    // Try parsing as date
    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
    }
    return null;
}
// Format deadline for display
function formatDeadline(deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
        return `OVERDUE ${Math.abs(diffDays)}d`;
    if (diffDays === 0)
        return 'TODAY';
    if (diffDays === 1)
        return 'tomorrow';
    if (diffDays <= 7)
        return `${diffDays}d left`;
    return deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
// Get depth of current path relative to storage root
function getDepth(currentPath, storagePath) {
    const relative = path.relative(storagePath, currentPath);
    if (!relative)
        return 0;
    return relative.split(path.sep).length;
}
// Mark node as done recursively
function markDoneRecursive(nodePath, storagePath) {
    let result = { xpGained: 0, tasksCompleted: 0, bossesDefeated: 0 };
    const config = (0, nodeConfig_1.readNodeConfig)(nodePath);
    if (!config || config.status === 'done') {
        return result;
    }
    // First, mark all children as done
    const entries = fs.readdirSync(nodePath, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            const childResult = markDoneRecursive(path.join(nodePath, entry.name), storagePath);
            result.xpGained += childResult.xpGained;
            result.tasksCompleted += childResult.tasksCompleted;
            result.bossesDefeated += childResult.bossesDefeated;
        }
    }
    // Mark this node as done
    const depth = getDepth(nodePath, storagePath);
    const xp = config.xp || (0, nodeConfig_1.calculateXP)(depth, config.isBoss || false);
    (0, nodeConfig_1.writeNodeConfig)(nodePath, {
        ...config,
        status: 'done',
        completedAt: new Date().toISOString(),
    });
    result.xpGained += xp;
    result.tasksCompleted += 1;
    if (config.isBoss)
        result.bossesDefeated += 1;
    return result;
}
exports.sessionState = {
    pending: null,
    history: []
};
function formatColumns(items, termWidth = 80) {
    if (items.length === 0)
        return '';
    const maxLen = Math.max(...items.map(s => s.length)) + 2;
    const cols = Math.max(1, Math.floor(termWidth / maxLen));
    const rows = [];
    for (let i = 0; i < items.length; i += cols) {
        const row = items.slice(i, i + cols);
        rows.push(row.map(item => item.padEnd(maxLen)).join('').trimEnd());
    }
    return rows.join('\n');
}
function copyToClipboard(text) {
    const platform = process.platform;
    try {
        if (platform === 'darwin') {
            (0, child_process_1.execSync)('pbcopy', { input: text });
        }
        else if (platform === 'win32') {
            (0, child_process_1.execSync)('clip', { input: text });
        }
        else {
            try {
                (0, child_process_1.execSync)('xclip -selection clipboard', { input: text });
            }
            catch {
                (0, child_process_1.execSync)('xsel --clipboard --input', { input: text });
            }
        }
    }
    catch (e) {
        // Silently fail
    }
}
function copyRecursive(src, dest) {
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
    }
    else {
        fs.copyFileSync(src, dest);
    }
}
// Build tree with status and deadline info
function getTreeWithStatus(dirPath, prefix = '', isRoot = true, maxDepth = 10, currentDepth = 0, showFiles = false) {
    const lines = [];
    if (!fs.existsSync(dirPath)) {
        return lines;
    }
    if (currentDepth >= maxDepth) {
        return lines;
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.'));
    const files = showFiles ? entries.filter(e => e.isFile() && !e.name.startsWith('.')) : [];
    const allItems = [...dirs, ...files];
    allItems.forEach((entry, index) => {
        const isLast = index === allItems.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const nextPrefix = isLast ? '    ' : '│   ';
        if (entry.isDirectory()) {
            const nodePath = path.join(dirPath, entry.name);
            const config = (0, nodeConfig_1.readNodeConfig)(nodePath);
            let displayName = config?.name || entry.name;
            const tags = [];
            // Add status tag
            if (config?.status === 'done') {
                tags.push('DONE');
            }
            else if (config?.status === 'blocked') {
                tags.push('BLOCKED');
            }
            // Add boss tag
            if (config?.isBoss) {
                tags.push('BOSS');
            }
            // Add deadline tag
            if (config?.deadline && config.status !== 'done') {
                tags.push(formatDeadline(config.deadline));
            }
            const tagStr = tags.length > 0 ? ` [${tags.join('] [')}]` : '';
            lines.push(`${prefix}${connector}${displayName}/${tagStr}`);
            const childLines = getTreeWithStatus(nodePath, prefix + nextPrefix, false, maxDepth, currentDepth + 1, showFiles);
            lines.push(...childLines);
        }
        else {
            lines.push(`${prefix}${connector}${entry.name}`);
        }
    });
    return lines;
}
async function processCommand(input, currentPath, config, signal, rl) {
    const clipboardPipe = /\s*\|\s*(pbcopy|copy|clip)\s*$/i;
    const shouldCopy = clipboardPipe.test(input);
    const cleanInput = input.replace(clipboardPipe, '').trim();
    const parts = cleanInput.split(' ').filter(p => p.length > 0);
    const command = parts[0].toLowerCase();
    const wrapResult = (result) => {
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
    // Stats command
    if (command === 'stats') {
        return wrapResult({ output: (0, profile_1.formatStats)(config.rulesPreset) });
    }
    // Inventory command
    if (command === 'inventory' || command === 'inv' || command === 'loot') {
        const { formatInventoryDisplay } = await Promise.resolve().then(() => __importStar(require('../storage/profile')));
        return wrapResult({ output: formatInventoryDisplay(config.rulesPreset) });
    }
    // Achievements command
    if (command === 'achievements' || command === 'ach') {
        return wrapResult({ output: (0, profile_1.formatAchievements)(config.rulesPreset) });
    }
    // Done command - mark current node as completed
    if (command === 'done') {
        const { getDictionary } = await Promise.resolve().then(() => __importStar(require('../data/dictionaries')));
        const { formatLootDrop } = await Promise.resolve().then(() => __importStar(require('../data/loot')));
        const { getAchievementInfo } = await Promise.resolve().then(() => __importStar(require('../storage/profile')));
        const dict = getDictionary(config.rulesPreset);
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location. Navigate to a task first.' });
        }
        if (nodeConfig.status === 'done') {
            return wrapResult({ output: 'This task is already completed.' });
        }
        // Mark done recursively
        const result = markDoneRecursive(currentPath, config.storagePath);
        // Update profile with XP and achievements
        const depth = getDepth(currentPath, config.storagePath);
        const taskResult = (0, profile_1.completeTask)(result.xpGained, nodeConfig.isBoss || false, depth, nodeConfig.createdAt, config.rulesPreset);
        // Save to undo history
        (0, profile_1.addToUndoHistory)({
            path: currentPath,
            xpLost: result.xpGained,
            wasBoss: nodeConfig.isBoss || false,
            timestamp: new Date().toISOString(),
        });
        let output = `\n=== ${dict.messages.questCompleted} ===\n`;
        output += `\nTasks: ${result.tasksCompleted}`;
        if (result.bossesDefeated > 0) {
            output += ` | Bosses: ${result.bossesDefeated}`;
        }
        output += `\n+${result.xpGained} XP`;
        if (taskResult.levelUp) {
            output += `\n\n*** ${dict.messages.levelUp} ***`;
            output += `\n${dict.stats.level} ${taskResult.newLevel}!`;
        }
        if (taskResult.newAchievements.length > 0) {
            output += `\n\n=== ${dict.messages.newAchievement} ===`;
            for (const achId of taskResult.newAchievements) {
                const achInfo = getAchievementInfo(achId, dict);
                if (achInfo) {
                    output += `\n[x] ${achInfo.name}: ${achInfo.desc}`;
                }
            }
        }
        if (taskResult.lootDropped) {
            output += `\n\n${formatLootDrop(taskResult.lootDropped, dict)}`;
        }
        output += '\n\n[Type "undo" to revert]';
        return wrapResult({ output });
    }
    // Undo command
    if (command === 'undo') {
        const lastUndo = (0, profile_1.getLastUndo)();
        if (!lastUndo) {
            return wrapResult({ output: 'Nothing to undo.' });
        }
        // Revert the task status
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(lastUndo.path);
        if (nodeConfig) {
            (0, nodeConfig_1.writeNodeConfig)(lastUndo.path, {
                ...nodeConfig,
                status: 'open',
                completedAt: undefined,
            });
        }
        // Revert profile stats
        const result = (0, profile_1.performUndo)();
        let output = `\n=== UNDO ===\n`;
        output += `\nReverted: ${path.basename(lastUndo.path)}`;
        output += `\n${result.message}`;
        output += '\n';
        return wrapResult({ output });
    }
    // Deadline command (dl as alias)
    if (command === 'deadline' || command === 'dl') {
        if (parts.length < 2) {
            return wrapResult({ output: 'Usage: deadline <date> (or dl <date>)\nExamples: dl today, dl +3d, deadline Jan 15' });
        }
        const dateStr = parts.slice(1).join(' ');
        const deadline = parseDeadline(dateStr);
        if (!deadline) {
            return wrapResult({ output: `Could not parse date: ${dateStr}` });
        }
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location.' });
        }
        (0, nodeConfig_1.writeNodeConfig)(currentPath, {
            ...nodeConfig,
            deadline,
        });
        return wrapResult({ output: `Deadline set: ${formatDeadline(deadline)}` });
    }
    // Boss command - mark as boss/milestone
    if (command === 'boss' || command === 'milestone') {
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location.' });
        }
        const newIsBoss = !nodeConfig.isBoss;
        const depth = getDepth(currentPath, config.storagePath);
        (0, nodeConfig_1.writeNodeConfig)(currentPath, {
            ...nodeConfig,
            isBoss: newIsBoss,
            xp: (0, nodeConfig_1.calculateXP)(depth, newIsBoss),
        });
        return wrapResult({ output: newIsBoss ? 'Marked as BOSS task (3x XP)' : 'Removed BOSS status' });
    }
    // Block command - block <node> or block "reason"
    if (command === 'block') {
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location.' });
        }
        const arg = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
        let blockedBy = nodeConfig.blockedBy || [];
        let blockMessage = 'Task marked as blocked';
        if (arg) {
            // Check if it's a path to another node
            const potentialPath = path.join(currentPath, '..', arg);
            const absolutePath = path.isAbsolute(arg) ? arg : potentialPath;
            if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
                // It's a node path
                const blockerConfig = (0, nodeConfig_1.readNodeConfig)(absolutePath);
                const blockerName = blockerConfig?.name || path.basename(absolutePath);
                blockedBy = [...blockedBy, absolutePath];
                blockMessage = `Blocked by: ${blockerName}`;
            }
            else {
                // Check sibling folder
                const siblingPath = path.join(path.dirname(currentPath), arg);
                if (fs.existsSync(siblingPath) && fs.statSync(siblingPath).isDirectory()) {
                    const blockerConfig = (0, nodeConfig_1.readNodeConfig)(siblingPath);
                    const blockerName = blockerConfig?.name || arg;
                    blockedBy = [...blockedBy, siblingPath];
                    blockMessage = `Blocked by: ${blockerName}`;
                }
                else {
                    // It's a text reason
                    blockedBy = [...blockedBy, arg];
                    blockMessage = `Blocked: ${arg}`;
                }
            }
        }
        (0, nodeConfig_1.writeNodeConfig)(currentPath, {
            ...nodeConfig,
            status: 'blocked',
            blockedBy,
        });
        return wrapResult({ output: blockMessage });
    }
    // Unblock command
    if (command === 'unblock') {
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location.' });
        }
        (0, nodeConfig_1.writeNodeConfig)(currentPath, {
            ...nodeConfig,
            status: 'open',
            blockedBy: [],
        });
        return wrapResult({ output: 'Task unblocked' });
    }
    // Check command - show overdue/upcoming deadlines
    if (command === 'check') {
        const checkDeadlines = (dirPath, results) => {
            if (!fs.existsSync(dirPath))
                return;
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory() || entry.name.startsWith('.'))
                    continue;
                const nodePath = path.join(dirPath, entry.name);
                const cfg = (0, nodeConfig_1.readNodeConfig)(nodePath);
                if (cfg && cfg.deadline && cfg.status !== 'done') {
                    const deadlineDate = new Date(cfg.deadline);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    deadlineDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 3) { // Show tasks due within 3 days or overdue
                        results.push({
                            path: nodePath,
                            name: cfg.name,
                            deadline: formatDeadline(cfg.deadline),
                            status: diffDays < 0 ? 'OVERDUE' : diffDays === 0 ? 'TODAY' : 'SOON',
                        });
                    }
                }
                checkDeadlines(nodePath, results);
            }
        };
        const results = [];
        checkDeadlines(config.storagePath, results);
        if (results.length === 0) {
            return wrapResult({ output: 'No upcoming deadlines within 3 days.' });
        }
        const lines = ['', '=== DEADLINE CHECK ===', ''];
        const overdue = results.filter(r => r.status === 'OVERDUE');
        const today = results.filter(r => r.status === 'TODAY');
        const soon = results.filter(r => r.status === 'SOON');
        if (overdue.length > 0) {
            lines.push('OVERDUE:');
            for (const r of overdue) {
                lines.push(`  ! ${r.name} (${r.deadline})`);
            }
            lines.push('');
        }
        if (today.length > 0) {
            lines.push('DUE TODAY:');
            for (const r of today) {
                lines.push(`  * ${r.name}`);
            }
            lines.push('');
        }
        if (soon.length > 0) {
            lines.push('UPCOMING:');
            for (const r of soon) {
                lines.push(`  - ${r.name} (${r.deadline})`);
            }
            lines.push('');
        }
        return wrapResult({ output: lines.join('\n') });
    }
    // Status command - show current task status
    if (command === 'status') {
        const nodeConfig = (0, nodeConfig_1.readNodeConfig)(currentPath);
        if (!nodeConfig) {
            return wrapResult({ output: 'No task at current location.' });
        }
        const lines = [
            '',
            `Task: ${nodeConfig.name}`,
            `Status: ${nodeConfig.status.toUpperCase()}`,
            `XP: ${nodeConfig.xp}`,
        ];
        if (nodeConfig.isBoss) {
            lines.push('Type: BOSS');
        }
        if (nodeConfig.deadline) {
            lines.push(`Deadline: ${formatDeadline(nodeConfig.deadline)}`);
        }
        if (nodeConfig.completedAt) {
            lines.push(`Completed: ${new Date(nodeConfig.completedAt).toLocaleDateString()}`);
        }
        if (nodeConfig.blockedBy && nodeConfig.blockedBy.length > 0) {
            // Format blockedBy - show names if paths exist
            const blockerNames = nodeConfig.blockedBy.map(b => {
                if (fs.existsSync(b)) {
                    const cfg = (0, nodeConfig_1.readNodeConfig)(b);
                    return cfg?.name || path.basename(b);
                }
                return b;
            });
            lines.push(`Blocked by: ${blockerNames.join(', ')}`);
        }
        lines.push('');
        return wrapResult({ output: lines.join('\n') });
    }
    // Map command - dungeon visualization
    if (command === 'map') {
        // Check for --ai flag to use AI generation
        if (parts.includes('--ai') || parts.includes('-a')) {
            const treeLines = getTreeWithStatus(currentPath, '', true, 10, 0, false);
            const treeContent = treeLines.join('\n');
            if (!treeContent) {
                return wrapResult({ output: 'No tasks to visualize.' });
            }
            const mapContent = await (0, claude_1.generateDungeonMapWithAI)(treeContent, config, signal);
            if (mapContent) {
                // Save map to file
                const folderName = path.basename(currentPath);
                (0, nodeConfig_1.saveMapFile)(currentPath, folderName + '-map', mapContent);
                return wrapResult({ output: mapContent + '\n\n[Map saved as .rlc.map]' });
            }
            return wrapResult({ output: 'Could not generate AI map. Using default.' });
        }
        const dungeonMap = generateDungeonMap(currentPath, config);
        return wrapResult({ output: dungeonMap });
    }
    if (command === 'ls') {
        if (!fs.existsSync(currentPath)) {
            return wrapResult({ output: 'Directory does not exist.' });
        }
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });
        const items = [];
        for (const entry of entries) {
            if (entry.name.startsWith('.'))
                continue;
            if (entry.isDirectory()) {
                const nodePath = path.join(currentPath, entry.name);
                const config = (0, nodeConfig_1.readNodeConfig)(nodePath);
                let suffix = '/';
                if (config?.status === 'done')
                    suffix = '/ [DONE]';
                else if (config?.status === 'blocked')
                    suffix = '/ [BLOCKED]';
                else if (config?.isBoss)
                    suffix = '/ [BOSS]';
                items.push(entry.name + suffix);
            }
            else {
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
        let maxDepth = 10;
        const depthFlag = parts.find(p => p.startsWith('--depth='));
        if (depthFlag) {
            maxDepth = parseInt(depthFlag.split('=')[1]) || 10;
        }
        else {
            const dIndex = parts.indexOf('-d');
            if (dIndex !== -1 && parts[dIndex + 1]) {
                maxDepth = parseInt(parts[dIndex + 1]) || 10;
            }
        }
        const treeLines = getTreeWithStatus(currentPath, '', true, maxDepth, 0, showFiles);
        if (treeLines.length === 0) {
            return wrapResult({ output: 'No items found.' });
        }
        return wrapResult({ output: treeLines.join('\n') });
    }
    // Handle navigation without 'cd' command
    if (/^\.{2,}$/.test(command)) {
        const levels = command.length - 1;
        let targetPath = currentPath;
        if (targetPath === config.storagePath) {
            return { output: 'Already at root.' };
        }
        for (let i = 0; i < levels; i++) {
            const parentPath = path.dirname(targetPath);
            if (targetPath === config.storagePath || parentPath.length < config.storagePath.length) {
                break;
            }
            targetPath = parentPath;
            if (targetPath === config.storagePath) {
                break;
            }
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            try {
                copyRecursive(sourcePath, destPath);
                fs.rmSync(sourcePath, { recursive: true, force: true });
                return { output: `Moved: ${source} -> ${dest}` };
            }
            catch (e) {
                return { output: `Error: ${e.message}` };
            }
        }
    }
    if (command === 'open') {
        const { exec } = require('child_process');
        if (parts.length < 2 || parts[1] === '.') {
            exec(`open "${currentPath}"`);
            return { output: `Opening: ${currentPath}` };
        }
        const name = parts.slice(1).join(' ');
        const targetPath = path.join(currentPath, name);
        if (fs.existsSync(targetPath)) {
            const stat = fs.statSync(targetPath);
            if (stat.isDirectory()) {
                exec(`open "${targetPath}"`);
                return { output: `Opening: ${targetPath}` };
            }
            if (stat.isFile()) {
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
            }
            else {
                const stat = fs.statSync(targetPath);
                if (stat.isDirectory()) {
                    return { output: `Error: ${targetName} is a directory. Use rm -rf to remove directories.` };
                }
                fs.unlinkSync(targetPath);
            }
            return { output: `Removed: ${targetName}` };
        }
        catch (error) {
            return { output: `Error: ${error.message}` };
        }
    }
    if (command === 'init') {
        const { initCommand } = await Promise.resolve().then(() => __importStar(require('../commands/init')));
        await initCommand(rl);
        return { output: 'Initialization complete. You can now use rlc.\n', reloadConfig: true };
    }
    if (command === 'cd') {
        if (parts.length < 2) {
            return { output: 'Usage: cd <node> or cd .. or cd <path>' };
        }
        const target = parts.slice(1).join(' ');
        if (/^\.{2,}$/.test(target)) {
            const levels = target.length - 1;
            let targetPath = currentPath;
            if (targetPath === config.storagePath) {
                return { output: 'Already at root.' };
            }
            for (let i = 0; i < levels; i++) {
                const parentPath = path.dirname(targetPath);
                if (targetPath === config.storagePath || parentPath.length < config.storagePath.length) {
                    break;
                }
                targetPath = parentPath;
                if (targetPath === config.storagePath) {
                    break;
                }
            }
            return { newPath: targetPath, output: '' };
        }
        if (target.includes('/')) {
            let targetPath = currentPath;
            const pathParts = target.split('/');
            for (const part of pathParts) {
                if (/^\.{2,}$/.test(part)) {
                    const levels = part.length - 1;
                    for (let i = 0; i < levels; i++) {
                        if (targetPath === config.storagePath)
                            break;
                        const parentPath = path.dirname(targetPath);
                        if (parentPath.length < config.storagePath.length)
                            break;
                        targetPath = parentPath;
                    }
                }
                else if (part === '.') {
                    continue;
                }
                else if (part) {
                    const newPath = (0, storage_1.navigateToNode)(targetPath, part);
                    if (!newPath) {
                        return { output: `Path "${target}" not found.` };
                    }
                    targetPath = newPath;
                }
            }
            return { newPath: targetPath, output: '' };
        }
        const newPath = (0, storage_1.navigateToNode)(currentPath, target);
        if (!newPath) {
            return { output: `Node "${target}" not found.` };
        }
        return { newPath, output: '' };
    }
    if (command === 'pwd') {
        return wrapResult({ output: currentPath });
    }
    if (command === 'config') {
        const { updateConfig, SUPPORTED_MODELS } = await Promise.resolve().then(() => __importStar(require('../config/config')));
        // Check for flags (uppercase short, lowercase long)
        const keyFlag = parts.find(p => p.startsWith('-K=') || p.startsWith('--key='));
        const modelFlag = parts.find(p => p.startsWith('-M=') || p.startsWith('--model='));
        const rulesFlag = parts.find(p => p.startsWith('-R=') || p.startsWith('--rules='));
        if (keyFlag) {
            const value = keyFlag.split('=').slice(1).join('=');
            if (!value) {
                return wrapResult({ output: 'Error: API key cannot be empty' });
            }
            updateConfig({ apiKey: value });
            return wrapResult({ output: 'API key updated.' });
        }
        if (modelFlag) {
            const value = modelFlag.split('=').slice(1).join('=');
            if (!SUPPORTED_MODELS.includes(value)) {
                return wrapResult({
                    output: `Error: Unknown model "${value}"\n\nSupported models:\n  ${SUPPORTED_MODELS.join('\n  ')}`
                });
            }
            updateConfig({ model: value });
            return wrapResult({ output: `Model updated: ${value}` });
        }
        if (rulesFlag) {
            const value = rulesFlag.split('=').slice(1).join('=');
            updateConfig({ rules: value, rulesPreset: 'custom' });
            return wrapResult({ output: 'Rules updated.' });
        }
        // Show config
        const maskedKey = config.apiKey
            ? config.apiKey.slice(0, 8) + '...' + config.apiKey.slice(-4)
            : '(not set)';
        const rulesPreview = config.rules
            ? (config.rules.length > 60 ? config.rules.substring(0, 60) + '...' : config.rules)
            : '(default)';
        const output = `
Provider:     ${config.aiProvider}
Model:        ${config.model || '(default)'}
API Key:      ${maskedKey}
Storage:      ${config.storagePath}
Rules:        ${rulesPreview}

Set with flags:
  config -K=<key>       or --key=<key>
  config -M=<model>     or --model=<model>
  config -R="<rules>"   or --rules="<rules>"
`.trim();
        return wrapResult({ output });
    }
    if (command === 'help') {
        return wrapResult({
            output: `
=== ROGUELIKE CLI ===

Navigation:
  ls                    List tasks and files
  tree [-A] [--depth=N] Show task tree
  cd <task>             Navigate into task
  .., ...               Go up 1 or 2 levels
  pwd                   Current path
  open                  Open in Finder

Tasks:
  mkdir <name>          Create task
  done                  Complete (earns XP)
  undo                  Undo last done
  dl <date>             Set deadline (dl +3d, dl Jan 15)
  boss                  Toggle boss (3x XP)
  block [node]          Block by task
  unblock               Remove block
  status                Task details
  check                 Deadline alerts

Gamification:
  stats                 XP, level, streaks
  achievements          Achievement list (infinite)
  inventory             Loot collection
  map                   Dungeon map
  map --ai              AI-generated map

Rules (AI style presets):
  Set via init or config -R="<rules>"
  Presets: fantasy, space, starwars, western, cyberpunk, pirate

Config:
  init                  Setup wizard
  config                Show settings
  config -K=<key>       or --key=<key>
  config -M=<model>     or --model=<model>
  config -R="<rules>"   or --rules="<rules>"

Files:
  cp, mv, rm [-rf]      Standard operations
  clean --yes           Clear folder

AI:
  <description>         Generate preview
  save                  Save to folders
  cancel                Discard

Clipboard:
  <cmd> | pbcopy        macOS
  <cmd> | clip          Windows

www.rlc.rocks
`.trim()
        });
    }
    // Save command
    if (command === 'save') {
        if (!exports.sessionState.pending) {
            return wrapResult({ output: 'Nothing to save. Create a schema first.' });
        }
        const pending = exports.sessionState.pending;
        const safeName = pending.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (pending.format === 'tree') {
            const rootPath = path.join(currentPath, safeName);
            createFoldersFromTree(rootPath, pending.content);
            exports.sessionState.pending = null;
            exports.sessionState.history = [];
            return wrapResult({ output: `Created todo folder: ${safeName}/` });
        }
        else {
            const schemaPath = (0, nodeConfig_1.saveSchemaFile)(currentPath, pending.title, pending.content);
            const filename = path.basename(schemaPath);
            exports.sessionState.pending = null;
            exports.sessionState.history = [];
            return wrapResult({ output: `Saved: ${filename}` });
        }
    }
    // Cancel command
    if (command === 'cancel') {
        if (!exports.sessionState.pending) {
            return wrapResult({ output: 'Nothing to cancel.' });
        }
        exports.sessionState.pending = null;
        exports.sessionState.history = [];
        return wrapResult({ output: 'Discarded pending schema.' });
    }
    // Clean command
    if (command === 'clean') {
        const entries = fs.readdirSync(currentPath);
        const toDelete = entries.filter(e => !e.startsWith('.'));
        if (toDelete.length === 0) {
            return wrapResult({ output: 'Directory is already empty.' });
        }
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
    // AI generation
    const fullInput = cleanInput;
    exports.sessionState.history.push({ role: 'user', content: fullInput });
    const schema = await (0, claude_1.generateSchemaWithAI)(fullInput, config, signal, exports.sessionState.history);
    if (signal?.aborted) {
        return { output: 'Command cancelled.' };
    }
    if (schema) {
        exports.sessionState.pending = {
            title: schema.title,
            content: schema.content,
            format: schema.format,
            tree: schema.tree
        };
        exports.sessionState.history.push({ role: 'assistant', content: schema.content });
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
