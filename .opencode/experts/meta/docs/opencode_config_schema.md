# OpenCode Config Schema Reference

Complete reference for opencode.json configuration.

## Format
- Supports JSON and JSONC (JSON with Comments)
- Schema: https://opencode.ai/config.json

## Locations (merged in order)
1. Global: `~/.config/opencode/opencode.json`
2. Project: `./opencode.json` (or nearest Git directory)
3. Custom: `OPENCODE_CONFIG` environment variable
4. Custom directory: `OPENCODE_CONFIG_DIR` environment variable

## Key Configuration Options

### Models
```json
{
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5",
  "provider": {}
}
```

### Agents
```json
{
  "agent": {
    "name": {
      "description": "What the agent does",
      "mode": "primary|subagent|all",
      "model": "model-override",
      "temperature": 0.1,
      "prompt": "{file:path/to/prompt.md}",
      "tools": { "write": false },
      "permission": { "bash": "ask|allow|deny" }
    }
  }
}
```

### Commands
```json
{
  "command": {
    "name": {
      "template": "Prompt with $ARGUMENTS and $1, $2 positional params",
      "description": "Brief description",
      "agent": "agent-name",
      "subtask": true,
      "model": "model-override"
    }
  }
}
```

### Instructions
```json
{
  "instructions": [
    "CONTRIBUTING.md",
    ".cursor/rules/*.md"
  ]
}
```

### Tools
```json
{
  "tools": {
    "write": true,
    "bash": false,
    "mymcp_*": true
  }
}
```

### Permissions
```json
{
  "permission": {
    "edit": "ask|allow|deny",
    "bash": {
      "git push": "ask",
      "git *": "ask",
      "*": "allow"
    },
    "webfetch": "ask"
  }
}
```

### MCP Servers
```json
{
  "mcp": {}
}
```

### Sharing
```json
{
  "share": "manual|auto|disabled"
}
```

### Formatters
```json
{
  "formatter": {
    "prettier": { "disabled": true },
    "custom": {
      "command": ["cmd", "$FILE"],
      "extensions": [".js"]
    }
  }
}
```

## Variables
- Env vars: `{env:VARIABLE_NAME}`
- Files: `{file:path/to/file}`

Paths can be relative to config or absolute with `/` or `~`.

## Additional Options
- `theme`: Theme name
- `autoupdate`: true|false|"notify"
- `tui.scroll_speed`: Number (default 1)
- `tui.scroll_acceleration.enabled`: Boolean
- `keybinds`: Custom keybind configuration
- `disabled_providers`: ["provider-id"]
- `enabled_providers`: ["provider-id"]

# Source
https://opencode.ai/docs/config/

# Log
- 2024-12-15: Fetched OpenCode config documentation
