# Roguelike CLI

```
  |
  |
  + \
  \.G_.*=.
   `(#'/.\ |
    .>' (_--.
 _=/d   ,^\
~~ \)-'   '
   / |   rlc
  '  '

╔═════════════════════════╗
║      Roguelike CLI      ║
╚═════════════════════════╝
```

## What is this?

**A new format for notes, schemas, and todo lists — where every task is a folder.**

Instead of flat text files, your tasks become a **file system tree**. Nested tasks = nested folders. You can:

- **Navigate** your todos like directories (`cd`, `ls`, `tree`)
- **Attach files** directly to tasks (just put them in the folder)
- **Track dependencies** and blockers between tasks
- **Generate beautiful visualizations** — trees, block diagrams, and dungeon maps
- Let **AI help** you structure complex projects

## Why folders?

```
project/
├── phase-1-research/
│   ├── market-analysis/
│   │   └── competitors.xlsx      <- attach files directly
│   └── user-interviews/
├── phase-2-development/
│   ├── backend-api/
│   ├── frontend-ui/
│   └── database-schema/
└── phase-3-launch/
    ├── marketing/
    └── deployment/
```

Your file manager becomes your task manager. Git tracks your progress. AI generates the structure.

## Install

```bash
npm i -g roguelike-cli
rlc
```

## Workflow

```
> todo launch my startup

├── Research
│   ├── Market analysis
│   ├── Competitor research
│   └── User interviews
├── Development
│   ├── MVP features
│   ├── Backend API
│   └── Frontend UI
├── Launch
│   ├── Marketing campaign
│   └── Press release
└── Growth
    ├── Metrics tracking
    └── User feedback

[Type "save" to create folder launch-my-startup/]
> save
Created todo folder: launch-my-startup/

> cd launch-my-startup
> tree
├── research/
│   ├── market-analysis/
│   ├── competitor-research/
│   └── user-interviews/
├── development/
│   ├── mvp-features/
│   ├── backend-api/
│   └── frontend-ui/
├── launch/
│   ├── marketing-campaign/
│   └── press-release/
└── growth/
    ├── metrics-tracking/
    └── user-feedback/
```

Now you can `cd development/backend-api` and drop your actual code files there!

## Visualizations

### Tree View (default)

```
├── Phase 1: Setup
│   ├── Create repository
│   ├── Setup CI/CD
│   └── Configure environment
├── Phase 2: Development
│   ├── Backend API
│   └── Frontend UI
└── Phase 3: Deploy
```

### Block Diagram (for architecture)

```
> schema kubernetes cluster

┌─────────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                         │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   postgres   │      │    redis     │                    │
│  │              │      │              │                    │
│  │ primary-pod  │      │ cache-pod-1  │                    │
│  │ replica-pod  │      │ cache-pod-2  │                    │
│  └──────┬───────┘      └──────┬───────┘                    │
│         └──────────┬───────────┘                            │
│                    ▼                                        │
│            ┌───────────────┐                                │
│            │ worker-nodes  │                                │
│            └───────────────┘                                │
└─────────────────────────────────────────────────────────────┘
```

### Dungeon Map View

Visualize your project as a dungeon map. Each room is a task, corridors show dependencies.

```
> map

  ████████████████████████████████████████
  █                    █                 █
  █   [Research]       █   [Development] █
  █   * Market         █   * Backend     █
  █   * Users    ──────+───* Frontend    █
  █                    █   * Database    █
  █████████+███████████████████+██████████
           │                   │
  █████████+███████████████████+██████████
  █                    █                 █
  █   [Launch]         █   [Growth]      █
  █   * Marketing      █   * Metrics     █
  █   * Press    ──────+───* Feedback    █
  █   @ BOSS: Ship it! █                 █
  █                    █                 █
  ████████████████████████████████████████

Legend: * Task  @ Milestone  + Door  █ Wall
```

## Gamification (Roadmap)

- **XP System** — Earn experience for completing tasks
- **Achievements** — "First Blood", "100 Tasks", "Deep Nesting"
- **Boss Tasks** — Major milestones as boss fights
- **Dungeon Maps** — Explore your project as a roguelike dungeon
- **Stats** — Track velocity, streaks, completion rates

## Commands

| Command | Description |
|---------|-------------|
| `ls` | List tasks and files |
| `tree` | Show task tree |
| `tree -A` | Include files |
| `map` | Dungeon map view |
| `cd <task>` | Enter task |
| `..` | Go back |
| `mkdir <name>` | Create task |
| `open` | Open in Finder |
| `cp`, `mv`, `rm` | File operations |
| `config` | Settings |
| `help` | Examples |
| `v`, `version` | Show version |

## AI Integration

Just describe what you need:

```
> todo bake cookies

├── Prep
│   ├── Gather ingredients
│   └── Preheat oven
├── Mix
│   ├── Cream butter + sugar
│   └── Add flour
├── Bake (8-10 min)
└── Cool & store

> add deadline tomorrow for Bake
> add blocker "buy flour" for Mix
> shorter
> more detailed
> save
```

AI understands context and refines until you're happy.

## Examples

### Software Project

```
> todo build saas app

├── Planning
│   ├── Define MVP scope
│   ├── Create wireframes
│   └── Tech stack decision
├── Backend
│   ├── Database schema
│   ├── API endpoints
│   ├── Authentication
│   └── Payment integration
├── Frontend
│   ├── Components library
│   ├── Pages
│   └── State management
├── DevOps
│   ├── CI/CD pipeline
│   ├── Staging environment
│   └── Production deployment
└── Launch
    ├── Beta testing
    ├── Marketing site
    └── Product Hunt launch
```

### Life Goals

```
> todo learn japanese

├── Basics (Month 1-2)
│   ├── Hiragana
│   ├── Katakana
│   └── Basic grammar
├── Foundation (Month 3-6)
│   ├── Kanji (500)
│   ├── Vocabulary (2000 words)
│   └── Genki textbook
├── Intermediate (Month 6-12)
│   ├── JLPT N4 prep
│   ├── Reading practice
│   └── Conversation partner
└── Advanced
    ├── JLPT N3
    ├── Watch anime without subs
    └── Visit Japan
```

### Infrastructure

```
> schema cloud infrastructure

┌─────────────────────────────────────────────────────────────┐
│                     Production                              │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ Load Balancer    │      │ CDN              │           │
│  └────────┬─────────┘      └──────────────────┘           │
│           │                                                 │
│  ┌────────▼────────┐  ┌────────────┐   ┌────────────────┐ │
│  │   App Servers   │  │   Redis    │   │   PostgreSQL   │ │
│  │   (3 replicas)  │──│   Cache    │   │   (Primary +   │ │
│  └─────────────────┘  └────────────┘   │    Replica)    │ │
│                                         └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Clipboard

```
> tree | pbcopy     # macOS
> tree | clip       # Windows
```

## Website

**https://www.rlc.rocks**

## License

MIT
