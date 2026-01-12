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

**Turn your backlog into a dungeon crawl.** Roguelike CLI is a terminal-based task manager that transforms productivity into an RPG experience. Complete quests, level up, and conquer your goals.

## Features

- **RPG Engine** — Tasks are quests. Completing them earns XP, unlocks achievements, and levels you up.
- **AI Game Master** — Integrated AI helps decompose complex tasks and generates structured plans.
- **Local-First** — Your data stays on your machine in simple folders and JSON files.
- **Themeable** — Choose your adventure style: Fantasy, Space Opera, Star Wars, Cyberpunk, and more.

## Why Roguelike CLI?

Most task managers are boring. We make deep work addictive by applying proven RPG mechanics to your daily workflow.

## Install

```bash
npm i -g roguelike-cli
rlc
```

## Folder Structure

Every task is a folder. You can drop files directly into task folders — designs, docs, code, anything. Your file manager becomes your task manager.

```
my-startup/
├── research/
│   ├── market-analysis/
│   │   └── competitors.xlsx    <- attached file
│   └── user-interviews/
│       └── notes.md            <- attached file
├── development/
│   ├── backend-api/
│   │   └── spec.yaml           <- attached file
│   └── frontend-ui/
└── launch/
    └── marketing/
```

Navigate with `cd`, view with `tree`, open in Finder with `open`. It's just folders.

## Quick Start

```
> todo launch my startup

├── Research [BOSS]
│   ├── Market analysis
│   └── User interviews [DUE: +7d]
├── Development
│   ├── Backend API [DUE: Jan 20]
│   └── Frontend UI
└── Launch [MILESTONE]

[Type "save" to create folders]
> save
Created: launch-my-startup/

> cd launch-my-startup/research
> done

=== QUEST COMPLETED ===

+45 XP
*** LEVEL UP! ***

=== NEW ACHIEVEMENTS ===
[x] First Blood: Complete your first quest
[x] Boss Slayer: Defeat a boss
```

## Configuration

Run `init` to set up, or use `config` flags:

```
> config

Provider:     claude
Model:        claude-sonnet-4-20250514
API Key:      sk-ant-a...xxxx
Storage:      /Users/you/.rlc/workspace
Theme:        Fantasy RPG
Rules:        Use fantasy RPG language...

Set with flags:
  config -k=<key>       Set API key
  config -m=<model>     Set model
  config -t=<theme>     Set theme
  config -r="<rules>"   Set custom rules
```

### Default Settings

| Setting | Default |
|---------|---------|
| Provider | Claude Sonnet 4.5 |
| Storage | `~/.rlc/workspace` |
| Theme | Default (no theme) |

## Themes (Rules)

Themes change how the AI speaks. Set with `config -t=<theme>` or during `init`.

| Theme | Style |
|-------|-------|
| `default` | Standard task manager language |
| `fantasy` | Quests, dungeons, dragons, loot |
| `space` | Missions, starships, commanders |
| `starwars` | Jedi, Force, Rebel Alliance |
| `western` | Bounties, sheriffs, frontier |
| `cyberpunk` | Gigs, netrunners, corps |
| `pirate` | Plunder, treasure, seven seas |

### Custom Rules

```
> config -r="Speak like a medieval knight. Tasks are 'duties'. Use 'huzzah' for success."
```

Or select "Custom" during `init` to enter your own rules.

## Commands

### Navigation

| Command | Description |
|---------|-------------|
| `ls` | List tasks (shows status) |
| `tree` | Task tree with deadlines |
| `tree -A` | Include files |
| `cd <task>` | Enter task |
| `..`, `...` | Go up levels |
| `open` | Open in Finder |

### Task Management

| Command | Description |
|---------|-------------|
| `done` | Complete task (earns XP) |
| `undo` | Undo last done |
| `deadline <date>` | Set deadline |
| `boss` | Toggle boss (3x XP) |
| `block [node]` | Block by task |
| `unblock` | Remove block |
| `check` | Show deadlines |

### Gamification

| Command | Description |
|---------|-------------|
| `stats` | XP, level, streaks |
| `achievements` | Achievement list |
| `map` | Dungeon map |
| `map --ai` | AI-generated map |

### File Operations

| Command | Description |
|---------|-------------|
| `mkdir <name>` | Create task |
| `cp`, `mv`, `rm` | Standard ops |

### Configuration

| Command | Description |
|---------|-------------|
| `init` | Setup wizard |
| `config` | View settings |
| `config -k=<key>` | Set API key |
| `config -m=<model>` | Set model |
| `config -t=<theme>` | Set theme |
| `config -r="<rules>"` | Custom rules |

## Deadlines

```
> deadline today       # Due today
> deadline tomorrow    # Due tomorrow
> deadline +3d         # In 3 days
> deadline Jan 15      # Specific date
```

Tree shows deadlines:
```
├── Backend/ [BOSS] [3d left]
│   ├── Database/ [DONE]
│   └── API/ [OVERDUE 2d]
└── Frontend/ [tomorrow]
```

## XP System

| Factor | XP |
|--------|-----|
| Base task | 10 |
| Per depth level | +5 |
| Boss multiplier | 3x |

## Achievements

| Achievement | How to unlock |
|-------------|---------------|
| First Blood | Complete first task |
| Getting Started | Complete 10 tasks |
| Centurion | Complete 100 tasks |
| Deep Diver | Task at depth 5+ |
| Boss Slayer | Complete a boss |
| Speedrunner | Same-day completion |
| Streak Master | 7 day streak |

## Dungeon Map

```
> map

  ###########################################
  #                   #                     #
  #   [Research]      #   [Development]     #
  #   x Analysis      +---* Backend         #
  #   x Interviews    #   @ Deploy BOSS     #
  #                   #                     #
  ##########+###########+###################
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
