import Anthropic from '@anthropic-ai/sdk';
import { Config } from '../config/config';

export interface GeneratedSchema {
  title: string;
  content: string;
  format: 'block' | 'tree';
  tree?: any[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

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

export async function generateSchemaWithAI(
  input: string,
  config: Config,
  signal?: AbortSignal,
  history?: ConversationMessage[]
): Promise<GeneratedSchema | null> {
  if (!config.apiKey) {
    throw new Error('API key not set. Use config:apiKey=<key> to set it.');
  }
  
  const client = new Anthropic({
    apiKey: config.apiKey,
  });
  
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  
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
    const message = await client.messages.create({
      model: model,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
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
  } catch (error: any) {
    console.error('AI Error:', error.message);
    return null;
  }
}

export async function generateDungeonMapWithAI(
  treeContent: string,
  config: Config,
  signal?: AbortSignal
): Promise<string | null> {
  if (!config.apiKey) {
    throw new Error('API key not set. Use config:apiKey=<key> to set it.');
  }
  
  const client = new Anthropic({
    apiKey: config.apiKey,
  });

  try {
    const model = config.model || 'claude-sonnet-4-20250514';
    const message = await client.messages.create({
      model: model,
      max_tokens: 2000,
      system: DUNGEON_MAP_PROMPT,
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
  } catch (error: any) {
    console.error('AI Error:', error.message);
    return null;
  }
}
