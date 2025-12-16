# OpenCode Commands

Custom commands for repetitive tasks. Triggered via `/command-name` in TUI.

## Built-in Commands

- `/init` - Initialize project
- `/undo` - Undo last action
- `/redo` - Redo last action
- `/share` - Share session
- `/help` - Show help

Custom commands can override built-ins.

## Creating Commands

Two methods: JSON config or Markdown files.

### Markdown Files (Preferred)

Location:
- Global: `~/.config/opencode/command/*.md`
- Per-project: `.opencode/command/*.md`

Filename becomes command name (`test.md` → `/test`).

```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage report.
Focus on failing tests and suggest fixes.
```

### JSON Config

```jsonc
{
  "command": {
    "test": {
      "template": "Run the full test suite...",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

## Template Variables

### Arguments

- `$ARGUMENTS` - All arguments as single string
- `$1`, `$2`, `$3`... - Positional arguments

```markdown
Create a React component named $ARGUMENTS with TypeScript.
```

```
/component Button
```

Positional example:

```markdown
Create file $1 in directory $2 with content: $3
```

```
/create-file config.json src "{ \"key\": \"value\" }"
```

### Shell Injection

Use `` !`command` `` to inject shell output:

```markdown
Recent commits:
!`git log --oneline -10`

Review these changes.
```

Commands run from project root.

### File References

Use `@path/to/file` to include file contents:

```markdown
Review @src/components/Button.tsx for performance issues.
```

## Command Options

| Option | Required | Description |
|--------|----------|-------------|
| `template` | Yes | Prompt sent to LLM |
| `description` | No | Shown in TUI autocomplete |
| `agent` | No | Which agent executes (default: current) |
| `model` | No | Override model for this command |
| `subtask` | No | Force subagent invocation (bool) |

### Subtask Behavior

- If `agent` is a subagent, command triggers subagent invocation by default
- Set `subtask: false` to disable
- Set `subtask: true` to force subagent mode (avoids polluting primary context)

## Source

Full docs: [docs/opencode_commands_full.md](../docs/opencode_commands_full.md)

# Log
- 2024-12-16: Created from opencode_commands_full.md
