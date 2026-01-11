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
exports.ACHIEVEMENTS = void 0;
exports.xpForLevel = xpForLevel;
exports.levelFromXP = levelFromXP;
exports.xpToNextLevel = xpToNextLevel;
exports.readProfile = readProfile;
exports.saveProfile = saveProfile;
exports.addXP = addXP;
exports.completeTask = completeTask;
exports.formatStats = formatStats;
exports.formatAchievements = formatAchievements;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const PROFILE_FILE = path.join(os.homedir(), '.rlc', 'profile.json');
// Achievement definitions
exports.ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first task' },
    { id: 'ten_tasks', name: 'Getting Started', description: 'Complete 10 tasks' },
    { id: 'fifty_tasks', name: 'Productive', description: 'Complete 50 tasks' },
    { id: 'hundred_tasks', name: 'Centurion', description: 'Complete 100 tasks' },
    { id: 'deep_nesting', name: 'Deep Diver', description: 'Complete a task at depth 5+' },
    { id: 'boss_slayer', name: 'Boss Slayer', description: 'Complete a boss task' },
    { id: 'five_bosses', name: 'Boss Hunter', description: 'Defeat 5 bosses' },
    { id: 'speedrunner', name: 'Speedrunner', description: 'Complete a task on the same day it was created' },
    { id: 'streak_3', name: 'On a Roll', description: '3 day completion streak' },
    { id: 'streak_7', name: 'Streak Master', description: '7 day completion streak' },
    { id: 'streak_30', name: 'Unstoppable', description: '30 day completion streak' },
    { id: 'level_5', name: 'Adventurer', description: 'Reach level 5' },
    { id: 'level_10', name: 'Veteran', description: 'Reach level 10' },
    { id: 'level_25', name: 'Legend', description: 'Reach level 25' },
    { id: 'xp_1000', name: 'XP Collector', description: 'Earn 1000 XP' },
    { id: 'xp_10000', name: 'XP Hoarder', description: 'Earn 10000 XP' },
];
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
        stats: {
            completedByDay: {},
            createdAt: new Date().toISOString(),
        },
    };
}
function addXP(amount) {
    const profile = readProfile();
    const oldLevel = profile.level;
    profile.totalXP += amount;
    profile.level = levelFromXP(profile.totalXP);
    saveProfile(profile);
    return {
        newXP: profile.totalXP,
        levelUp: profile.level > oldLevel,
        newLevel: profile.level,
    };
}
function completeTask(xp, isBoss, depth, createdAt) {
    const profile = readProfile();
    const oldLevel = profile.level;
    const today = new Date().toISOString().split('T')[0];
    const createdDate = createdAt.split('T')[0];
    // Add XP
    profile.totalXP += xp;
    profile.tasksCompleted += 1;
    if (isBoss) {
        profile.bossesDefeated += 1;
    }
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
        // Same day - streak continues but doesn't increment
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
    // Check for new achievements
    const newAchievements = [];
    const checkAchievement = (id) => {
        if (!profile.achievements.includes(id)) {
            profile.achievements.push(id);
            const achievement = exports.ACHIEVEMENTS.find(a => a.id === id);
            if (achievement)
                newAchievements.push(achievement);
        }
    };
    // Task count achievements
    if (profile.tasksCompleted >= 1)
        checkAchievement('first_blood');
    if (profile.tasksCompleted >= 10)
        checkAchievement('ten_tasks');
    if (profile.tasksCompleted >= 50)
        checkAchievement('fifty_tasks');
    if (profile.tasksCompleted >= 100)
        checkAchievement('hundred_tasks');
    // Boss achievements
    if (isBoss)
        checkAchievement('boss_slayer');
    if (profile.bossesDefeated >= 5)
        checkAchievement('five_bosses');
    // Depth achievement
    if (depth >= 5)
        checkAchievement('deep_nesting');
    // Speedrunner achievement
    if (createdDate === today)
        checkAchievement('speedrunner');
    // Streak achievements
    if (profile.currentStreak >= 3)
        checkAchievement('streak_3');
    if (profile.currentStreak >= 7)
        checkAchievement('streak_7');
    if (profile.currentStreak >= 30)
        checkAchievement('streak_30');
    // Level achievements
    if (profile.level >= 5)
        checkAchievement('level_5');
    if (profile.level >= 10)
        checkAchievement('level_10');
    if (profile.level >= 25)
        checkAchievement('level_25');
    // XP achievements
    if (profile.totalXP >= 1000)
        checkAchievement('xp_1000');
    if (profile.totalXP >= 10000)
        checkAchievement('xp_10000');
    saveProfile(profile);
    return {
        xpGained: xp,
        levelUp: profile.level > oldLevel,
        newLevel: profile.level,
        newAchievements,
    };
}
function formatStats() {
    const profile = readProfile();
    const nextLevel = xpToNextLevel(profile.totalXP);
    const lines = [
        '',
        '=== PLAYER STATS ===',
        '',
        `Level: ${profile.level}`,
        `XP: ${profile.totalXP} (${nextLevel.current}/${nextLevel.required} to next level)`,
        `Progress: [${'#'.repeat(Math.floor(nextLevel.progress / 5))}${'.'.repeat(20 - Math.floor(nextLevel.progress / 5))}] ${nextLevel.progress}%`,
        '',
        `Tasks Completed: ${profile.tasksCompleted}`,
        `Bosses Defeated: ${profile.bossesDefeated}`,
        `Current Streak: ${profile.currentStreak} days`,
        `Longest Streak: ${profile.longestStreak} days`,
        '',
        `Achievements: ${profile.achievements.length}/${exports.ACHIEVEMENTS.length}`,
        '',
    ];
    return lines.join('\n');
}
function formatAchievements() {
    const profile = readProfile();
    const lines = [
        '',
        '=== ACHIEVEMENTS ===',
        '',
    ];
    for (const achievement of exports.ACHIEVEMENTS) {
        const unlocked = profile.achievements.includes(achievement.id);
        const status = unlocked ? '[x]' : '[ ]';
        lines.push(`${status} ${achievement.name}`);
        lines.push(`    ${achievement.description}`);
    }
    lines.push('');
    lines.push(`Unlocked: ${profile.achievements.length}/${exports.ACHIEVEMENTS.length}`);
    lines.push('');
    return lines.join('\n');
}
