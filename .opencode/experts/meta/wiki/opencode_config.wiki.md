# OpenCode Config

JSON/JSONC configuration for OpenCode behavior, providers, and customization.

## Schema

```json
{ "$schema": "https://opencode.ai/config.json" }
```

Enables editor autocomplete and validation.

## File Locations & Merge Order

Configs are **deep merged** (later overrides earlier for conflicts):

1. **Global**: `~/.config/opencode/opencode.json`
2. **Project**: `./opencode.json` (or nearest Git root)
3. **Custom path**: `OPENCODE_CONFIG=/path/to/config.json`
4. **Custom dir**: `OPENCODE_CONFIG_DIR=/path/to/dir` (loads agents, commands, plugins)

## Top-Level Keys

| Key | Type | Description |
|-----|------|-------------|
| `$schema` | string | Schema URL for validation |
| `theme` | string | UI theme name |
| `model` | string | Primary model (`provider/model`) |
| `small_model` | string | Lightweight tasks (title gen) |
| `provider` | object | Provider configurations |
| `autoupdate` | bool/string | `true`, `false`, or `"notify"` |
| `share` | string | `"manual"`, `"auto"`, or `"disabled"` |
| `tools` | object | Enable/disable tools (`{tool: bool}`) |
| `permission` | object | Tool permissions (`{tool: "ask"}`) |
| `instructions` | string[] | Paths/globs to instruction files |
| `agent` | object | Agent definitions |
| `command` | object | Custom commands |
| `keybinds` | object | Key bindings |
| `formatter` | object | Code formatters |
| `mcp` | object | MCP server configs |
| `tui` | object | TUI settings |
| `enabled_providers` | string[] | Allowlist of providers |
| `disabled_providers` | string[] | Blocklist of providers |

## Variable Substitution

### Environment Variables
```json
{ "model": "{env:OPENCODE_MODEL}" }
```
Unset vars become empty string.

### File Contents
```json
{ "apiKey": "{file:~/.secrets/api-key}" }
```
Paths: relative to config, or absolute (`/`, `~`).

## Key Examples

### Provider + Model
```json
{
  "provider": { 
    "anthropic": { 
      "options": { "apiKey": "{env:ANTHROPIC_API_KEY}" }
    }
  },
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

### Ollama Local Models
```json
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": {
        "baseURL": "http://localhost:11434/v1"
      },
      "models": {
        "qwen2.5-coder:32b": {
          "name": "Qwen 2.5 Coder 32B",
          "description": "Best coding model"
        },
        "deepseek-r1:32b": {
          "name": "DeepSeek R1 32B",
          "description": "Best reasoning model"
        }
      }
    }
  },
  "model": "ollama/qwen2.5-coder:32b"
}
```

**Important**: Models are defined within `provider.ollama.models`, NOT in a separate `modelProviders` key.

### Tools & Permissions
```json
{
  "tools": { "bash": false },
  "permission": { "edit": "ask", "bash": "ask" }
}
```

### Instructions
```json
{ "instructions": ["CONTRIBUTING.md", "docs/*.md", ".cursor/rules/*.md"] }
```

### TUI
```json
{
  "tui": {
    "scroll_speed": 3,
    "scroll_acceleration": { "enabled": true }
  }
}
```

## Provider Filtering

- `disabled_providers`: Blocklist (takes priority)
- `enabled_providers`: Allowlist (only these load)

If both set, `disabled_providers` wins for conflicts.

## Related Docs

- [Full config reference](../docs/opencode_config_full.md)
- Agents: `~/.config/opencode/agent/` or `.opencode/agent/`
- Commands: `~/.config/opencode/command/` or `.opencode/command/`

# Log
- 2024-12-16: Created from opencode_config_full.md
- 2024-12-16: Added Ollama provider example with correct format
