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
   / |
  '  '

╔═════════════════════════╗
║    Roguelike CLI v1.1   ║
╚═════════════════════════╝
```

AI-powered interactive terminal for creating schemas, architectures and todo lists.

## Install

```bash
npm i -g roguelike-cli
```

## Usage

```bash
rlc
```

First run will start the setup wizard to configure:
- Storage path for your notes
- AI provider (Claude, GPT, Gemini, Grok)
- API key

## Commands

| Command | Description |
|---------|-------------|
| `ls` | List all schemas, todos, and notes |
| `tree` | Show directory tree structure |
| `tree -A` | Show tree with files |
| `tree --depth=N` | Limit tree depth |
| `cd <node>` | Navigate into a node |
| `cd ..` | Go back to parent |
| `..` | Same as cd .. |
| `pwd` | Show current path |
| `open` | Open current folder in Finder |
| `open <folder>` | Open specific folder in Finder |
| `mkdir <name>` | Create new folder |
| `cp <src> <dest>` | Copy file or folder |
| `mv <src> <dest>` | Move/rename file or folder |
| `rm <name>` | Delete file |
| `rm -rf <name>` | Delete folder recursively |
| `config` | Show configuration |
| `config:apiKey=<key>` | Set API key |
| `init` | Run setup wizard |
| `help` | Show examples |
| `clean` | Show items to delete |
| `clean --yes` | Delete all items in current folder |
| `exit` / `quit` | Exit the program |

## Workflow

1. Type description (e.g., `todo: deploy app`)
2. AI generates schema preview
3. Refine with more instructions if needed
4. Type `save` to save or `cancel` to discard

**Todo** creates folder structure, **Schema** saves as `.rlc.schema` file.

## Clipboard

Add `| pbcopy` (macOS), `| copy` or `| clip` (Windows) to any command:

```
> ls | pbcopy
> tree | pbcopy
> config | copy
```

## Examples

### Todo List

```
> todo opening company in delaware

├── register business name
├── file incorporation papers
├── get EIN number
└── Branch: legal
    └── open business bank account

[Type "save" to create folder opening-company-in-delaware/]
```

### Cloud Infrastructure Schema

```
> yandex cloud production infrastructure

┌─────────────────────────────────────────────────────────────┐
│                  Yandex Cloud                               │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │ back-fastapi     │      │ admin-next       │           │
│  │ (VM)             │      │ (VM)             │           │
│  └────────┬─────────┘      └──────────────────┘           │
│           │                                                 │
│           ├──────────────────┬─────────────────┐           │
│           │                  │                 │           │
│  ┌────────▼────────┐  ┌─────▼──────┐   ┌──────▼────────┐  │
│  │   PostgreSQL    │  │   Redis    │   │  Cloudflare   │  │
│  │  (Existing DB)  │  │  Cluster   │   │  R2 Storage   │  │
│  └─────────────────┘  └────────────┘   └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Web Application Architecture

```
> architecture production redis web application

├── load-balancer
├── web-servers
│   ├── app-server-1
│   ├── app-server-2
│   └── app-server-3
├── redis
│   ├── cache-cluster
│   └── session-store
└── database
    ├── postgres-primary
    └── postgres-replica
```

### Kubernetes Cluster

```
> kubernetes cluster with postgres and redis

┌─────────────────────────────────────────────────────────────┐
│         Kubernetes cluster with clusters postgres          │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │   postgres   │      │    redis     │                  │
│  │              │      │              │                  │
│  │ primary-pod  │      │ cache-pod-1  │                  │
│  │ replica-pod-1│      │ cache-pod-2  │                  │
│  │ replica-pod-2│      │              │                  │
│  └──────┬───────┘      └──────┬───────┘                  │
│         │                      │                           │
│         └──────────┬───────────┘                           │
│                    │                                         │
│            ┌───────▼────────┐                              │
│            │ worker-zones   │                              │
│            │   zone-1       │                              │
│            │   zone-2       │                              │
│            └────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### Recipe Steps

```
> todo bake cookies

├── Prep
│   ├── Gather ingredients
│   └── Preheat oven (375°F)
├── Mix
│   ├── Cream butter + sugar
│   ├── Add eggs + vanilla
│   └── Mix in flour
├── Bake
│   ├── Shape cookies
│   └── Bake 8-10 min
└── Cool & store
```

### Project Planning

```
> todo launch startup

├── Phase 1: Ideation
│   ├── Market research
│   ├── Define MVP
│   └── Create business plan
├── Phase 2: Development
│   ├── Build prototype
│   ├── User testing
│   └── Iterate
├── Phase 3: Launch
│   ├── Marketing campaign
│   ├── Press release
│   └── Launch day
└── Phase 4: Growth
    ├── Gather feedback
    ├── Scale infrastructure
    └── Hire team
```

## Website

**https://www.rlc.rocks**

## License

MIT
