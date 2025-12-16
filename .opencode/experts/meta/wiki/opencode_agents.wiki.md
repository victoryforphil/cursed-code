# OpenCode Agents

Specialized AI assistants with custom prompts, models, and tool access.

## Quick Reference

| Option | Values | Notes |
|--------|--------|-------|
| `mode` | `primary`, `subagent`, `all` | Default: `all` |
| `model` | `provider/model-name` | Inherits from global/parent if unset |
| `temperature` | `0.0` - `1.0` | Lower = deterministic, higher = creative |
| `maxSteps` | integer | Limits agentic iterations |
| `tools` | `{ "toolname": true/false }` | Supports wildcards: `mcp_*` |
| `permission` | `ask`, `allow`, `deny` | For `edit`, `bash`, `webfetch` |
| `prompt` | string or `{file:./path}` | Custom system prompt |
| `disable` | `true/false` | Disable an agent |

## Agent Types

**Primary agents** - Main assistants you interact with directly
- Switch with **Tab** key or `switch_agent` keybind
- Have full tool access by default

**Subagents** - Specialized helpers invoked for specific tasks
- Called automatically by primary agents based on description
- Manual invoke: `@agentname your message`
- Inherit parent's model if unspecified

## Built-in Agents

| Agent | Mode | Purpose |
|-------|------|---------|
| **Build** | primary | Default. All tools enabled for development work |
| **Plan** | primary | Analysis/planning. File edits and bash set to `ask` |
| **General** | subagent | Research, search, multi-step tasks |
| **Explore** | subagent | Fast codebase exploration, file/keyword search |

## Configuration

### JSON Format

```json
{
  "agent": {
    "myagent": {
      "description": "What this agent does",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "temperature": 0.3,
      "prompt": "{file:./prompts/myagent.txt}",
      "tools": {
        "write": false,
        "bash": true
      },
      "permission": {
        "edit": "ask"
      }
    }
  }
}
```

### Markdown Format

Place in `~/.config/opencode/agent/` (global) or `.opencode/agent/` (project).

Filename becomes agent name (e.g., `review.md` creates `review` agent).

```markdown
---
description: Reviews code for quality
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
permission:
  bash:
    "git diff": allow
    "git log*": allow
    "*": ask
---

You are in code review mode. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
```

## Key Options

### Tools
Control tool availability per agent. Agent config overrides global.

```json
"tools": {
  "write": false,
  "mymcp_*": false  // Wildcard: disable all MCP tools
}
```

### Permissions
Fine-grained control with glob patterns for bash:

```json
"permission": {
  "edit": "deny",
  "bash": {
    "git status": "allow",
    "git push": "ask",
    "*": "deny"
  },
  "webfetch": "ask"
}
```

### Temperature Guidelines
- `0.0-0.2`: Code analysis, planning (deterministic)
- `0.3-0.5`: General development (balanced)
- `0.6-1.0`: Brainstorming, exploration (creative)

Default: `0` for most models, `0.55` for Qwen.

### Additional Provider Options
Pass-through to provider (model-specific):

```json
{
  "agent": {
    "deep-thinker": {
      "model": "openai/gpt-5",
      "reasoningEffort": "high"
    }
  }
}
```

## Creating Agents

Interactive wizard:
```bash
opencode agent create
```

## Session Navigation

When subagents create child sessions:
- `<Leader>+Right` - Cycle forward through sessions
- `<Leader>+Left` - Cycle backward

---

**Source**: [OpenCode Agents Documentation](https://opencode.ai/docs/agents)

# Log
- 2024-12-16: Created from opencode_agents_full.md
