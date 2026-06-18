# speclet VS Code Extension

Registers `@speclet` as a GitHub Copilot Chat participant with slash commands for every speclet operation.

## Commands

| Command | Description |
|---|---|
| `@speclet /tasks` | Generate tasks for all phases |
| `@speclet /tasks 1` | Generate tasks for phase 1 only |
| `@speclet /implement 1` | Implement phase 1 |
| `@speclet /implement "Phase 2"` | Implement by phase name |
| `@speclet /clarify` | Clarifying questions for the full plan |
| `@speclet /clarify 2` | Clarify a specific phase |
| `@speclet /analyze` | Analyze all tasks for gaps and conflicts |
| `@speclet /analyze 1` | Analyze a specific phase |
| `@speclet /constitution` | Fill in or update the project constitution |

## Prerequisites

- VS Code with the GitHub Copilot Chat extension installed and signed in
- A project initialized with `speclet init <plan>` (creates `.speclet/` directory)

## Install

```bash
npm install
npm run build
npx vsce package --no-dependencies
code --install-extension speclet-vscode-0.1.0.vsix
```

Or use the shortcut script:

```bash
npm run install-ext
```

## How it works

When you run a command like `@speclet /implement 1`, the extension:

1. Reads your `.speclet/context.md`, `.speclet/constitution.md` (if filled in), and the relevant task files
2. Builds the same structured prompt the `speclet` CLI would build
3. Sends it directly to the Copilot language model
4. Streams the response back into the chat

No copy-paste needed — it's the full speclet workflow, native in Copilot Chat.

## Development

```bash
npm run watch    # TypeScript watch mode
npm run build    # one-off build
npm run package  # build + create .vsix
```

