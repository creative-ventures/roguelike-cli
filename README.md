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

**A gamified task manager where every task is a folder and every project is a dungeon.**

Instead of flat text files, your tasks become a **file system tree**. Nested tasks = nested folders. Complete tasks to earn XP, level up, and unlock achievements.

## Features

- **Navigate** your todos like directories (`cd`, `ls`, `tree`)
- **Track progress** with XP, levels, and streaks
- **Earn achievements** for completing tasks
- **Mark milestones** as boss fights (3x XP)
- **Set deadlines** with human-readable dates
- **Generate visualizations** - trees, block diagrams, dungeon maps
- Let **AI help** you structure complex projects

## Install

```bash
npm i -g roguelike-cli
rlc
```

## Quick Start

```
> todo launch startup

├── Research [BOSS]
│   ├── Market analysis
│   └── User interviews
├── Development
│   ├── Backend API [DUE: +7d]
│   └── Frontend UI
└── Launch [MILESTONE]
    └── Marketing campaign

[Type "save" to create folder launch-startup/]
> save
Created todo folder: launch-startup/

> cd launch-startup/research
> done

=== TASK COMPLETED ===

Tasks completed: 3
Bosses defeated: 1
+45 XP

*** LEVEL UP! ***
You are now level 2!

=== NEW ACHIEVEMENTS ===
[x] First Blood: Complete your first task
[x] Boss Slayer: Complete a boss task
```

## Commands

### Navigation

| Command | Description |
|---------|-------------|
| `ls` | List tasks (shows status) |
| `tree` | Task tree with deadlines |
| `tree -A` | Include files |
| `tree --depth=N` | Limit depth |
| `cd <task>` | Enter task |
| `..`, `...` | Go up 1 or 2 levels |
| `pwd` | Current path |
| `open` | Open in Finder |

### Task Management

| Command | Description |
|---------|-------------|
| `done` | Complete task (recursive, earns XP) |
| `undo` | Undo last done (restores XP) |
| `deadline <date>` | Set deadline |
| `boss` | Toggle boss status (3x XP) |
| `block [node]` | Block by task or text reason |
| `unblock` | Remove blocked status |
| `status` | Show task details |
| `check` | Show overdue/upcoming deadlines |

### Gamification

| Command | Description |
|---------|-------------|
| `stats` | XP, level, streaks |
| `achievements` | Achievement list |
| `map` | Dungeon map view |
| `map --ai` | AI-generated dungeon |

### File Operations

| Command | Description |
|---------|-------------|
| `mkdir <name>` | Create task |
| `cp <src> <dst>` | Copy |
| `mv <src> <dst>` | Move/rename |
| `rm <name>` | Delete file |
| `rm -rf <name>` | Delete folder |

### AI Generation

| Command | Description |
|---------|-------------|
| `<description>` | AI generates preview |
| `save` | Save pending schema |
| `cancel` | Discard |

## Deadlines

```
> deadline today       # Due today
> deadline tomorrow    # Due tomorrow
> deadline +3d         # Due in 3 days
> deadline Jan 15      # Due on date
```

Tree shows deadlines:

```
├── Backend API/ [BOSS] [3d left]
│   ├── Database/ [DONE]
│   └── Endpoints/ [OVERDUE 2d]
└── Frontend/ [tomorrow]
```

## XP System

- Base XP: 10 per task
- Depth bonus: +5 XP per nesting level
- Boss multiplier: 3x XP

| Level | XP Required |
|-------|-------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 150 |
| 5 | 337 |
| 10 | 3,844 |

## Achievements

| Achievement | Description |
|-------------|-------------|
| First Blood | Complete first task |
| Getting Started | Complete 10 tasks |
| Productive | Complete 50 tasks |
| Centurion | Complete 100 tasks |
| Deep Diver | Complete task at depth 5+ |
| Boss Slayer | Complete a boss task |
| Boss Hunter | Defeat 5 bosses |
| Speedrunner | Complete task same day |
| On a Roll | 3 day streak |
| Streak Master | 7 day streak |
| Unstoppable | 30 day streak |
| Adventurer | Reach level 5 |
| Veteran | Reach level 10 |
| Legend | Reach level 25 |

## Dungeon Map

```
> map

  ###########################################
  #                    #                    #
  #   [Research]       #   [Development]    #
  #   * Market         +---* Backend        #
  #   x Users          #   @ Deploy BOSS    #
  #                    #                    #
  ##########+############+##################
           |            |
  ##########+############+##################
  #                                         #
  #            [Launch]                     #
  #            * Marketing                  #
  #            @ SHIP IT! [BOSS]            #
  #                                         #
  ###########################################

Legend: * Task  x Done  @ Boss  ! Blocked  + Door
```

Use `map --ai` for creative AI-generated layouts.

## Block Diagrams

```
> schema kubernetes cluster

┌─────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster                       │
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │   Control Plane  │      │   Worker Nodes   │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           └──────────┬───────────────┘                      │
│  ┌──────────────────┐│┌──────────────────┐                 │
│  │    PostgreSQL    │││     Redis        │                 │
│  └──────────────────┘│└──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Clipboard

```
> tree | pbcopy     # macOS
> tree | clip       # Windows
> ls | copy         # Alternative
```

## Configuration

```
> init              # Setup wizard
> config            # Show settings
> config:apiKey=sk-... # Set API key
```

## Website

**https://www.rlc.rocks**

## License

MIT
