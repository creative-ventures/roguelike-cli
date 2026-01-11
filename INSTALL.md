# Roguelike CLI - Installation Guide

## Local Development Setup

1. Install dependencies:
```bash
cd cli
npm install
```

2. Build the project:
```bash
npm run build
```

3. Link locally for testing:
```bash
npm link
```

This will make `rlc` command available globally.

4. Test the installation:
```bash
rlc
```

## First Run

Run `init` to configure:
```bash
rlc
> init
```

Or set API key manually:
```bash
> config:apiKey=your-api-key-here
```

## How to Use

### View config
```bash
> config
Provider:     claude
Model:        claude-sonnet-4-20250514
API Key:      sk-ant-a...1234
Storage:      /Users/you/.rlc/notes
```

### Create schema or todo
```bash
> todo opening company in delaware
> architecture kubernetes cluster with postgres
```

### Navigation
```bash
> ls                    # list files (columns)
> cd my-project         # go into folder
> cd ..                 # go back
> pwd                   # current path
> tree                  # show tree structure
> tree -A               # show tree with files
> tree --depth=2        # limit depth
> open                  # open folder in Finder
> open my-folder        # open specific folder
```

### Copy to clipboard
Add `| pbcopy` (macOS), `| copy` or `| clip` (Windows) to any command:
```bash
> ls | pbcopy
> tree | pbcopy
> config | pbcopy
> pwd | pbcopy
```

### File operations
```bash
> mkdir my-note         # create folder
> cp source dest        # copy
> mv source dest        # move/rename
> rm file               # delete file
> rm -rf folder         # delete folder
```

## Uninstall

```bash
npm unlink -g roguelike-cli
```

## Troubleshooting

If you get "command not found":
- Make sure `npm link` was run successfully
- Check that `~/.npm-global/bin` or similar is in your PATH

If API errors occur:
- Verify your API key is set: `config`
- Check that you have credits/access to Claude API

## Website

https://www.rlc.rocks

