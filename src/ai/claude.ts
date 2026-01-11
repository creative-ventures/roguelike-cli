import Anthropic from '@anthropic-ai/sdk';
import { Config } from '../config/config';

export interface GeneratedSchema {
  title: string;
  content: string;
  tree?: any[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a schema generator. Based on user input, generate EITHER:

1. **BLOCK DIAGRAM** - when user mentions: "schema", "architecture", "infrastructure", "diagram", "system"
   Use box-drawing to create visual blocks with connections:
   
   Example:
   \`\`\`
   ┌─────────────────────────────────────────────────────────────┐
   │                     Kubernetes Cluster                       │
   │                                                              │
   │  ┌──────────────────┐      ┌──────────────────┐            │
   │  │   Control Plane  │      │   Worker Nodes   │            │
   │  │                  │◄────►│                  │            │
   │  │  - API Server    │      │  - Node Pool 1   │            │
   │  │  - Scheduler     │      │  - Node Pool 2   │            │
   │  │  - etcd          │      │  - GPU Pool      │            │
   │  └────────┬─────────┘      └────────┬─────────┘            │
   │           │                          │                      │
   │           └──────────┬───────────────┘                      │
   │                      │                                       │
   │  ┌──────────────────┐│┌──────────────────┐                 │
   │  │    PostgreSQL    │││     Redis        │                 │
   │  └──────────────────┘│└──────────────────┘                 │
   └─────────────────────────────────────────────────────────────┘
   \`\`\`

2. **TREE STRUCTURE** - when user mentions: "todo", "tasks", "list", "steps", "plan"
   Use tree format:
   
   Example:
   \`\`\`
   ├── Phase 1: Setup
   │   ├── Create repository
   │   ├── Setup CI/CD
   │   └── Configure environment
   ├── Phase 2: Development
   │   ├── Backend API
   │   └── Frontend UI
   └── Phase 3: Deploy
   \`\`\`

Rules:
1. Extract a short title for filename
2. If user says "schema" or "architecture" - ALWAYS use BLOCK DIAGRAM format
3. If user says "todo" or "tasks" - use TREE format
4. Keep context from previous messages

Respond with JSON:
{
  "title": "short-title",
  "format": "block" or "tree",
  "content": "the actual ASCII art schema here"
}`;

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
  
  // Build messages from history or just the current input
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];
  
  if (history && history.length > 0) {
    // Add previous messages for context
    for (const msg of history.slice(0, -1)) { // exclude the last one (current input)
      messages.push({
        role: msg.role,
        content: msg.role === 'assistant' 
          ? `Previous schema generated:\n${msg.content}`
          : msg.content
      });
    }
  }
  
  // Add current user input
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
    
    // AI now returns ready content
    const schemaContent = parsed.content || '';
    
    return {
      title: parsed.title || 'schema',
      content: schemaContent,
    };
  } catch (error: any) {
    console.error('AI Error:', error.message);
    return null;
  }
}

