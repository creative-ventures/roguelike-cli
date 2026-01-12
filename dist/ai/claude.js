"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSchemaWithAI = generateSchemaWithAI;
exports.generateDungeonMapWithAI = generateDungeonMapWithAI;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const SYSTEM_PROMPT = `You are a schema generator. Based on user input, generate EITHER:

1. **BLOCK DIAGRAM** - when user mentions: "schema", "architecture", "infrastructure", "diagram", "system"
   Use box-drawing to create visual blocks with connections.

2. **TREE STRUCTURE** - when user mentions: "todo", "tasks", "list", "steps", "plan"
   Use tree format with metadata tags:
   - [BOSS] or [MILESTONE] for major milestones
   - [DUE: date] for deadlines (today, tomorrow, +3d, Jan 15)

Rules:
1. Extract a short title for filename
2. If user says "schema" or "architecture" - use BLOCK DIAGRAM format
3. If user says "todo" or "tasks" - use TREE format
4. Keep context from previous messages
5. For todos: add [BOSS] tags for major milestones, suggest deadlines

Respond with JSON:
{
  "title": "short-title",
  "format": "block" or "tree",
  "content": "the actual ASCII art schema here"
}`;
const DUNGEON_MAP_PROMPT = `You are a dungeon map generator for a roguelike task manager.
Given a tree structure of tasks, create an ASCII dungeon map where:
- Each major task group is a ROOM
- Sub-tasks are items inside rooms (marked with *)
- Boss/milestone tasks [BOSS] are marked with @ symbol
- Completed tasks [DONE] are marked with x
- Blocked tasks [BLOCKED] are marked with !
- Rooms are connected by corridors (|, +, -)
- Use # for walls
- Use + for doors between rooms
- Be creative with room shapes and layouts
- Include a legend at the bottom

Create a creative, interesting dungeon layout for the given tasks.
Output ONLY the ASCII map, no JSON wrapper.`;
async function generateSchemaWithAI(input, config, signal, history) {
    if (!config.apiKey) {
        throw new Error('API key not set. Use config -k=<key> to set it.');
    }
    const client = new sdk_1.default({
        apiKey: config.apiKey,
    });
    const messages = [];
    if (history && history.length > 0) {
        for (const msg of history.slice(0, -1)) {
            messages.push({
                role: msg.role,
                content: msg.role === 'assistant'
                    ? 'Previous schema generated:\n' + msg.content
                    : msg.content
            });
        }
    }
    messages.push({
        role: 'user',
        content: input
    });
    try {
        const model = config.model || 'claude-sonnet-4-20250514';
        // Build system prompt with custom rules
        let systemPrompt = SYSTEM_PROMPT;
        if (config.rules) {
            systemPrompt += '\n\nADDITIONAL STYLE RULES (apply to all responses):\n' + config.rules;
        }
        const message = await client.messages.create({
            model: model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: messages,
        });
        const content = message.content[0];
        if (content.type !== 'text') {
            return null;
        }
        const text = content.text.trim();
        let jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return null;
        }
        const parsed = JSON.parse(jsonMatch[0]);
        const schemaContent = parsed.content || '';
        return {
            title: parsed.title || 'schema',
            content: schemaContent,
            format: parsed.format || 'block',
        };
    }
    catch (error) {
        console.error('AI Error:', error.message);
        return null;
    }
}
async function generateDungeonMapWithAI(treeContent, config, signal) {
    if (!config.apiKey) {
        throw new Error('API key not set. Use config -k=<key> to set it.');
    }
    const client = new sdk_1.default({
        apiKey: config.apiKey,
    });
    try {
        const model = config.model || 'claude-sonnet-4-20250514';
        // Build system prompt with custom rules
        let systemPrompt = DUNGEON_MAP_PROMPT;
        if (config.rules) {
            systemPrompt += '\n\nADDITIONAL STYLE RULES:\n' + config.rules;
        }
        const message = await client.messages.create({
            model: model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{
                    role: 'user',
                    content: 'Generate a dungeon map for this task tree:\n\n' + treeContent
                }],
        });
        const content = message.content[0];
        if (content.type !== 'text') {
            return null;
        }
        return content.text.trim();
    }
    catch (error) {
        console.error('AI Error:', error.message);
        return null;
    }
}
