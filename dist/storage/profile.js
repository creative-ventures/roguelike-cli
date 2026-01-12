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
exports.ACHIEVEMENT_THRESHOLDS = void 0;
exports.xpForLevel = xpForLevel;
exports.levelFromXP = levelFromXP;
exports.xpToNextLevel = xpToNextLevel;
exports.readProfile = readProfile;
exports.saveProfile = saveProfile;
exports.completeTask = completeTask;
exports.getAchievementInfo = getAchievementInfo;
exports.formatStats = formatStats;
exports.formatAchievements = formatAchievements;
exports.formatInventoryDisplay = formatInventoryDisplay;
exports.addToUndoHistory = addToUndoHistory;
exports.getLastUndo = getLastUndo;
exports.performUndo = performUndo;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const dictionaries_1 = require("../data/dictionaries");
const loot_1 = require("../data/loot");
const PROFILE_FILE = path.join(os.homedir(), '.rlc', 'profile.json');
// Achievement thresholds (infinite, level-based)
exports.ACHIEVEMENT_THRESHOLDS = {
    tasks: [1, 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    bosses: [1, 5, 10, 25, 50, 100, 250, 500],
    streaks: [3, 7, 14, 30, 60, 90, 180, 365],
    depths: [3, 5, 7, 10, 15, 20],
    levels: [5, 10, 25, 50, 100, 150, 200],
    xp: [1000, 5000, 10000, 50000, 100000, 500000, 1000000],
};
// Map threshold to achievement ID
function getAchievementId(type, threshold) {
    return `${type}_${threshold}`;
}
// XP required for each level (cumulative)
function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}
function levelFromXP(xp) {
    let level = 1;
    let totalRequired = 0;
    while (totalRequired + xpForLevel(level) <= xp) {
        totalRequired += xpForLevel(level);
        level++;
    }
    return level;
}
function xpToNextLevel(xp) {
    const level = levelFromXP(xp);
    let totalForCurrentLevel = 0;
    for (let i = 1; i < level; i++) {
        totalForCurrentLevel += xpForLevel(i);
    }
    const xpInCurrentLevel = xp - totalForCurrentLevel;
    const required = xpForLevel(level);
    return {
        current: xpInCurrentLevel,
        required,
        progress: Math.floor((xpInCurrentLevel / required) * 100),
    };
}
function readProfile() {
    if (!fs.existsSync(PROFILE_FILE)) {
        return createDefaultProfile();
    }
    try {
        const data = fs.readFileSync(PROFILE_FILE, 'utf-8');
        const profile = JSON.parse(data);
        return {
            ...createDefaultProfile(),
            ...profile,
            stats: {
                ...createDefaultProfile().stats,
                ...profile.stats,
            },
        };
    }
    catch {
        return createDefaultProfile();
    }
}
function saveProfile(profile) {
    const dir = path.dirname(PROFILE_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Update level based on XP
    profile.level = levelFromXP(profile.totalXP);
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(profile, null, 2), 'utf-8');
}
function createDefaultProfile() {
    return {
        totalXP: 0,
        level: 1,
        tasksCompleted: 0,
        bossesDefeated: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        inventory: [],
        undoHistory: [],
        stats: {
            completedByDay: {},
            createdAt: new Date().toISOString(),
            deepestDepth: 0,
            speedruns: 0,
            nightOwlTasks: 0,
            earlyBirdTasks: 0,
        },
    };
}
function completeTask(xp, isBoss, depth, createdAt, rulesPreset) {
    const profile = readProfile();
    const oldLevel = profile.level;
    const today = new Date().toISOString().split('T')[0];
    const createdDate = createdAt.split('T')[0];
    const hour = new Date().getHours();
    // Add XP
    profile.totalXP += xp;
    profile.tasksCompleted += 1;
    if (isBoss) {
        profile.bossesDefeated += 1;
    }
    // Track special completions
    if (createdDate === today) {
        profile.stats.speedruns = (profile.stats.speedruns || 0) + 1;
    }
    if (hour >= 0 && hour < 6) {
        profile.stats.earlyBirdTasks = (profile.stats.earlyBirdTasks || 0) + 1;
    }
    if (hour >= 0 && hour < 5) {
        profile.stats.nightOwlTasks = (profile.stats.nightOwlTasks || 0) + 1;
    }
    profile.stats.deepestDepth = Math.max(profile.stats.deepestDepth || 0, depth);
    // Update streak
    if (profile.lastCompletionDate) {
        const lastDate = new Date(profile.lastCompletionDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            profile.currentStreak += 1;
        }
        else if (diffDays > 1) {
            profile.currentStreak = 1;
        }
    }
    else {
        profile.currentStreak = 1;
    }
    profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
    profile.lastCompletionDate = today;
    // Update daily stats
    profile.stats.completedByDay[today] = (profile.stats.completedByDay[today] || 0) + 1;
    // Update level
    profile.level = levelFromXP(profile.totalXP);
    const levelUp = profile.level > oldLevel;
    // Check for new achievements
    const newAchievements = [];
    const checkAchievement = (id) => {
        if (!profile.achievements.includes(id)) {
            profile.achievements.push(id);
            newAchievements.push(id);
        }
    };
    // Task count achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.tasks) {
        if (profile.tasksCompleted >= threshold) {
            checkAchievement(getAchievementId('tasks', threshold));
        }
    }
    // Boss achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.bosses) {
        if (profile.bossesDefeated >= threshold) {
            checkAchievement(getAchievementId('bosses', threshold));
        }
    }
    // Depth achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.depths) {
        if (profile.stats.deepestDepth >= threshold) {
            checkAchievement(getAchievementId('depth', threshold));
        }
    }
    // Streak achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.streaks) {
        if (profile.currentStreak >= threshold) {
            checkAchievement(getAchievementId('streak', threshold));
        }
    }
    // Level achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.levels) {
        if (profile.level >= threshold) {
            checkAchievement(getAchievementId('level', threshold));
        }
    }
    // XP achievements (infinite)
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.xp) {
        if (profile.totalXP >= threshold) {
            checkAchievement(getAchievementId('xp', threshold));
        }
    }
    // Special achievements
    if (createdDate === today) {
        checkAchievement('speedrun');
    }
    if (hour >= 0 && hour < 5) {
        checkAchievement('nightowl');
    }
    if (hour >= 5 && hour < 7) {
        checkAchievement('earlybird');
    }
    // Roll for loot
    let lootDropped;
    // Roll from task completion
    const taskLoot = (0, loot_1.rollForLoot)(profile.level, isBoss ? 'boss' : 'task', rulesPreset);
    if (taskLoot.dropped && taskLoot.item) {
        lootDropped = taskLoot.item;
        profile.inventory = profile.inventory || [];
        profile.inventory.push(taskLoot.item);
    }
    // Additional roll on level up
    if (levelUp) {
        const levelLoot = (0, loot_1.rollForLoot)(profile.level, 'levelup', rulesPreset);
        if (levelLoot.dropped && levelLoot.item) {
            if (!lootDropped) {
                lootDropped = levelLoot.item;
            }
            profile.inventory.push(levelLoot.item);
        }
    }
    // Additional roll on new achievements
    if (newAchievements.length > 0) {
        const achievementLoot = (0, loot_1.rollForLoot)(profile.level, 'achievement', rulesPreset);
        if (achievementLoot.dropped && achievementLoot.item) {
            if (!lootDropped) {
                lootDropped = achievementLoot.item;
            }
            profile.inventory.push(achievementLoot.item);
        }
    }
    saveProfile(profile);
    return {
        xpGained: xp,
        levelUp,
        oldLevel,
        newLevel: profile.level,
        newAchievements,
        lootDropped,
    };
}
// Get achievement display info from dictionary
function getAchievementInfo(achievementId, dict) {
    // Parse achievement ID
    const parts = achievementId.split('_');
    const type = parts[0];
    const threshold = parseInt(parts[1]);
    // Map to dictionary keys
    const keyMap = {
        tasks: { 1: 'firstTask', 10: 'tasks10', 50: 'tasks50', 100: 'tasks100', 500: 'tasks500', 1000: 'tasks1000' },
        bosses: { 1: 'boss1', 5: 'boss5', 10: 'boss10', 25: 'boss25' },
        streak: { 3: 'streak3', 7: 'streak7', 14: 'streak14', 30: 'streak30' },
        depth: { 3: 'depth3', 5: 'depth5', 10: 'depth10' },
    };
    // Special achievements
    if (achievementId === 'speedrun') {
        return dict.achievements.speedrun;
    }
    if (achievementId === 'nightowl') {
        return dict.achievements.nightOwl;
    }
    if (achievementId === 'earlybird') {
        return dict.achievements.earlyBird;
    }
    // Get from map
    if (keyMap[type] && keyMap[type][threshold]) {
        const key = keyMap[type][threshold];
        return dict.achievements[key];
    }
    // Generate for achievements beyond dictionary
    return {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${threshold}`,
        desc: `Reach ${threshold} ${type}`,
    };
}
function formatStats(rulesPreset) {
    const profile = readProfile();
    const dict = (0, dictionaries_1.getDictionary)(rulesPreset);
    const nextLevel = xpToNextLevel(profile.totalXP);
    const lines = [
        '',
        '=== PLAYER STATS ===',
        '',
        `${dict.stats.level}: ${profile.level}`,
        `${dict.stats.xp}: ${profile.totalXP} (${nextLevel.current}/${nextLevel.required} to next)`,
        `Progress: [${'#'.repeat(Math.floor(nextLevel.progress / 5))}${'.'.repeat(20 - Math.floor(nextLevel.progress / 5))}] ${nextLevel.progress}%`,
        '',
        `${dict.stats.tasksCompleted}: ${profile.tasksCompleted}`,
        `${dict.stats.bossesDefeated}: ${profile.bossesDefeated}`,
        `${dict.stats.currentStreak}: ${profile.currentStreak} days`,
        `${dict.stats.longestStreak}: ${profile.longestStreak} days`,
        '',
        `Achievements: ${profile.achievements.length}`,
        `${dict.stats.inventory}: ${(profile.inventory || []).length} items`,
        `Inventory Value: ${(0, loot_1.calculateInventoryValue)(profile.inventory || [])}`,
        '',
    ];
    return lines.join('\n');
}
function formatAchievements(rulesPreset) {
    const profile = readProfile();
    const dict = (0, dictionaries_1.getDictionary)(rulesPreset);
    const lines = [
        '',
        '=== ACHIEVEMENTS ===',
        '',
    ];
    // Show unlocked achievements
    if (profile.achievements.length === 0) {
        lines.push('No achievements yet. Complete tasks to unlock!');
    }
    else {
        lines.push('Unlocked:');
        for (const id of profile.achievements) {
            const info = getAchievementInfo(id, dict);
            if (info) {
                lines.push(`[x] ${info.name}`);
                lines.push(`    ${info.desc}`);
            }
        }
    }
    // Show next achievements to unlock
    lines.push('');
    lines.push('Next to unlock:');
    // Find next task achievement
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.tasks) {
        const id = getAchievementId('tasks', threshold);
        if (!profile.achievements.includes(id)) {
            const info = getAchievementInfo(id, dict);
            if (info) {
                lines.push(`[ ] ${info.name} (${profile.tasksCompleted}/${threshold})`);
            }
            break;
        }
    }
    // Find next boss achievement
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.bosses) {
        const id = getAchievementId('bosses', threshold);
        if (!profile.achievements.includes(id)) {
            const info = getAchievementInfo(id, dict);
            if (info) {
                lines.push(`[ ] ${info.name} (${profile.bossesDefeated}/${threshold})`);
            }
            break;
        }
    }
    // Find next streak achievement
    for (const threshold of exports.ACHIEVEMENT_THRESHOLDS.streaks) {
        const id = getAchievementId('streak', threshold);
        if (!profile.achievements.includes(id)) {
            const info = getAchievementInfo(id, dict);
            if (info) {
                lines.push(`[ ] ${info.name} (${profile.currentStreak}/${threshold})`);
            }
            break;
        }
    }
    lines.push('');
    lines.push(`Total unlocked: ${profile.achievements.length}`);
    lines.push('');
    return lines.join('\n');
}
function formatInventoryDisplay(rulesPreset) {
    const profile = readProfile();
    const dict = (0, dictionaries_1.getDictionary)(rulesPreset);
    return (0, loot_1.formatInventory)(profile.inventory || [], dict);
}
function addToUndoHistory(entry) {
    const profile = readProfile();
    profile.undoHistory = profile.undoHistory || [];
    profile.undoHistory.unshift(entry);
    if (profile.undoHistory.length > 10) {
        profile.undoHistory = profile.undoHistory.slice(0, 10);
    }
    saveProfile(profile);
}
function getLastUndo() {
    const profile = readProfile();
    if (!profile.undoHistory || profile.undoHistory.length === 0) {
        return null;
    }
    return profile.undoHistory[0];
}
function performUndo() {
    const profile = readProfile();
    if (!profile.undoHistory || profile.undoHistory.length === 0) {
        return { success: false, entry: null, message: 'Nothing to undo.' };
    }
    const entry = profile.undoHistory.shift();
    profile.totalXP = Math.max(0, profile.totalXP - entry.xpLost);
    profile.tasksCompleted = Math.max(0, profile.tasksCompleted - 1);
    if (entry.wasBoss) {
        profile.bossesDefeated = Math.max(0, profile.bossesDefeated - 1);
    }
    profile.level = levelFromXP(profile.totalXP);
    const today = new Date().toISOString().split('T')[0];
    if (profile.stats.completedByDay[today]) {
        profile.stats.completedByDay[today] = Math.max(0, profile.stats.completedByDay[today] - 1);
    }
    saveProfile(profile);
    return {
        success: true,
        entry,
        message: `Undo: -${entry.xpLost} XP`
    };
}
