# OpenCode Tools

Tools allow LLMs to perform actions in your codebase. All tools enabled by default; configure via `opencode.json`.

## Built-in Tools

| Tool | Purpose |
|------|---------|
| `bash` | Execute shell commands |
| `edit` | Modify files via exact string replacement |
| `write` | Create new files or overwrite existing |
| `read` | Read file contents (supports line ranges) |
| `grep` | Search file contents with regex |
| `glob` | Find files by pattern (`**/*.ts`) |
| `list` | List directory contents |
| `patch` | Apply patch/diff files |
| `todowrite` | Create/update task lists* |
| `todoread` | Read task list state* |
| `webfetch` | Fetch and read web pages |

*Disabled for subagents by default

## Configuration

### Global
```json
{
  "tools": {
    "write": false,
    "bash": true
  }
}
```

### Per Agent (JSON)
```json
{
  "agent": {
    "plan": {
      "tools": {
        "write": false,
        "bash": false
      }
    }
  }
}
```

### Per Agent (Markdown)
```yaml
---
tools:
  write: false
  edit: false
---
```

Agent configs override global settings.

### Wildcards

Disable multiple tools at once:
```json
{
  "tools": {
    "mymcp_*": false
  }
}
```

## Custom Tools

Define custom functions LLMs can call. See [Custom Tools](/docs/custom-tools).

## MCP Servers

Integrate external tools via Model Context Protocol. See [MCP Servers](/docs/mcp-servers).

## Internals

- `grep`, `glob`, `list` use [ripgrep](https://github.com/BurntSushi/ripgrep)
- Respects `.gitignore` by default
- Override with `.ignore` file:
  ```
  !node_modules/
  !dist/
  ```

---
Source: [docs/opencode_tools_full.md](../docs/opencode_tools_full.md)

# Log
- 2024-12-16: Created from raw docs
