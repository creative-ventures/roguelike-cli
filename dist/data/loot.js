"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollForLoot = rollForLoot;
exports.formatLootDrop = formatLootDrop;
exports.formatInventory = formatInventory;
exports.calculateInventoryValue = calculateInventoryValue;
const dictionaries_1 = require("./dictionaries");
// Rarity drop chances by player level
// Higher level = higher chance for rare items, but overall drop rate decreases
function getDropChances(level) {
    // Base drop rate decreases with level (starts at 30%, min 5%)
    const baseDropRate = Math.max(0.05, 0.30 - (level * 0.01));
    // Rarity weights shift toward rarer items at higher levels
    const legendaryWeight = Math.min(0.05, level * 0.002);
    const epicWeight = Math.min(0.10, level * 0.004);
    const rareWeight = Math.min(0.20, 0.05 + level * 0.005);
    const uncommonWeight = Math.min(0.30, 0.15 + level * 0.005);
    const commonWeight = 1 - legendaryWeight - epicWeight - rareWeight - uncommonWeight;
    return {
        dropRate: baseDropRate,
        rarityWeights: {
            common: commonWeight,
            uncommon: uncommonWeight,
            rare: rareWeight,
            epic: epicWeight,
            legendary: legendaryWeight,
        },
    };
}
// Bonus multipliers for different sources
const SOURCE_MULTIPLIERS = {
    task: 1.0,
    levelup: 3.0, // 3x chance on level up
    achievement: 2.5, // 2.5x chance on achievement
    boss: 2.0, // 2x chance on boss
};
// Select random rarity based on weights
function selectRarity(weights) {
    const roll = Math.random();
    let cumulative = 0;
    const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    for (const rarity of rarities) {
        cumulative += weights[rarity];
        if (roll < cumulative) {
            return rarity;
        }
    }
    return 'common';
}
// Select random item from rarity pool
function selectItem(rarity, dict) {
    const pool = dict.loot[rarity];
    return pool[Math.floor(Math.random() * pool.length)];
}
// Main function to roll for loot
function rollForLoot(level, source, rulesPreset) {
    const dict = (0, dictionaries_1.getDictionary)(rulesPreset);
    const { dropRate, rarityWeights } = getDropChances(level);
    // Apply source multiplier
    const adjustedDropRate = Math.min(0.95, dropRate * (SOURCE_MULTIPLIERS[source] || 1.0));
    // Roll for drop
    if (Math.random() > adjustedDropRate) {
        return { dropped: false };
    }
    // Select rarity and item
    const rarity = selectRarity(rarityWeights);
    const name = selectItem(rarity, dict);
    return {
        dropped: true,
        item: {
            name,
            rarity,
            droppedAt: new Date().toISOString(),
            source,
        },
    };
}
// Format loot drop message
function formatLootDrop(item, dict) {
    const rarityName = dict.rarities[item.rarity];
    const raritySymbol = getRaritySymbol(item.rarity);
    return `
=== ${dict.messages.lootDropped} ===

${raritySymbol} [${rarityName}] ${item.name}
`.trim();
}
// Get rarity symbol/color indicator
function getRaritySymbol(rarity) {
    switch (rarity) {
        case 'common': return '[.]';
        case 'uncommon': return '[+]';
        case 'rare': return '[*]';
        case 'epic': return '[#]';
        case 'legendary': return '[!]';
    }
}
// Format inventory display
function formatInventory(inventory, dict) {
    if (!inventory || inventory.length === 0) {
        return `${dict.stats.inventory}: (empty)`;
    }
    // Group by rarity
    const byRarity = {
        legendary: [],
        epic: [],
        rare: [],
        uncommon: [],
        common: [],
    };
    for (const item of inventory) {
        byRarity[item.rarity].push(item);
    }
    const lines = [`=== ${dict.stats.inventory} (${inventory.length} items) ===`, ''];
    for (const rarity of ['legendary', 'epic', 'rare', 'uncommon', 'common']) {
        const items = byRarity[rarity];
        if (items.length > 0) {
            const symbol = getRaritySymbol(rarity);
            const rarityName = dict.rarities[rarity];
            lines.push(`${rarityName}:`);
            for (const item of items) {
                lines.push(`  ${symbol} ${item.name}`);
            }
            lines.push('');
        }
    }
    return lines.join('\n').trim();
}
// Calculate inventory value (for stats)
function calculateInventoryValue(inventory) {
    if (!inventory)
        return 0;
    const values = {
        common: 1,
        uncommon: 5,
        rare: 25,
        epic: 100,
        legendary: 500,
    };
    return inventory.reduce((sum, item) => sum + values[item.rarity], 0);
}
