# OpenCode Configuration Documentation

**Source:** https://opencode.ai/docs/config

## Overview

OpenCode supports both **JSON** and **JSONC** (JSON with Comments) formats for configuration.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  // Theme configuration
  "theme": "opencode",
  "model": "anthropic/claude-sonnet-4-5",
  "autoupdate": true,
}
```

## Configuration Locations

Configuration files are **merged together**, not replaced. Settings from all config locations are combined using a deep merge strategy, where later configs override earlier ones only for conflicting keys.

### Global Configuration
Place your global OpenCode config in `~/.config/opencode/opencode.json`. Use this for themes, providers, or keybinds.

### Per Project Configuration
Add a `opencode.json` in your project root. Settings from this config are merged with and can override the global config. Safe to check into Git and uses the same schema as the global one.

### Custom Path
Specify a custom config file path using the `OPENCODE_CONFIG` environment variable:
```bash
export OPENCODE_CONFIG=/path/to/my/custom-config.json
opencode run "Hello world"
```

### Custom Directory
Specify a custom config directory using the `OPENCODE_CONFIG_DIR` environment variable. This directory will be searched for agents, commands, modes, and plugins:
```bash
export OPENCODE_CONFIG_DIR=/path/to/my/config-directory
opencode run "Hello world"
```

## Configuration Schema

### TUI Settings
Configure TUI-specific settings through the `tui` option:
```json
{
  "tui": {
    "scroll_speed": 3,
    "scroll_acceleration": {
      "enabled": true
    }
  }
}
```

Available options:
- `scroll_acceleration.enabled` - Enable macOS-style scroll acceleration (takes precedence over `scroll_speed`)
- `scroll_speed` - Custom scroll speed multiplier (default: `1`, minimum: `1`)

### Tools Configuration
Manage the tools an LLM can use:
```json
{
  "tools": {
    "write": false,
    "bash": false
  }
}
```

### Models Configuration
Configure providers and models:
```json
{
  "provider": {},
  "model": "anthropic/claude-sonnet-4-5",
  "small_model": "anthropic/claude-haiku-4-5"
}
```

The `small_model` option configures a separate model for lightweight tasks like title generation.

### Themes
Configure the theme through the `theme` option:
```json
{
  "theme": "opencode"
}
```

### Agents
Configure specialized agents for specific tasks:
```jsonc
{
  "agent": {
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "model": "anthropic/claude-sonnet-4-5",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "tools": {
        // Disable file modification tools for review-only agent
        "write": false,
        "edit": false,
      },
    },
  },
}
```

### Sharing
Configure the share feature:
```json
{
  "share": "manual"
}
```

Takes:
- `"manual"` - Allow manual sharing via commands (default)
- `"auto"` - Automatically share new conversations
- `"disabled"` - Disable sharing entirely

### Commands
Configure custom commands for repetitive tasks:
```jsonc
{
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-haiku-4-5",
    },
    "component": {
      "template": "Create a new React component named $ARGUMENTS with TypeScript support.\nInclude proper typing and basic structure.",
      "description": "Create a new component",
    },
  },
}
```

### Keybinds
Customize your keybinds:
```json
{
  "keybinds": {}
}
```

### Autoupdate
OpenCode automatically downloads new updates when it starts up. Disable with:
```json
{
  "autoupdate": false
}
```

Or set to `"notify"` to be notified when a new version is available without auto-updating.

### Formatters
Configure code formatters:
```json
{
  "formatter": {
    "prettier": {
      "disabled": true
    },
    "custom-prettier": {
      "command": ["npx", "prettier", "--write", "$FILE"],
      "environment": {
        "NODE_ENV": "development"
      },
      "extensions": [".js", ".ts", ".jsx", ".tsx"]
    }
  }
}
```

### Permissions
Configure which actions require approval:
```json
{
  "permission": {
    "edit": "ask",
    "bash": "ask"
  }
}
```

### MCP Servers
Configure MCP servers:
```json
{
  "mcp": {}
}
```

### Instructions
Configure custom instruction files:
```json
{
  "instructions": ["CONTRIBUTING.md", "docs/guidelines.md", ".cursor/rules/*.md"]
}
```

### Disabled Providers
Disable specific providers:
```json
{
  "disabled_providers": ["openai", "gemini"]
}
```

### Enabled Providers
Specify an allowlist of providers:
```json
{
  "enabled_providers": ["anthropic", "openai"]
}
```

## Variable Substitution

### Environment Variables
Use `{env:VARIABLE_NAME}` to substitute environment variables:
```json
{
  "model": "{env:OPENCODE_MODEL}",
  "provider": {
    "anthropic": {
      "options": {
        "apiKey": "{env:ANTHROPIC_API_KEY}"
      }
    }
  }
}
```

### File Contents
Use `{file:path/to/file}` to substitute file contents:
```json
{
  "instructions": ["./custom-instructions.md"],
  "provider": {
    "openai": {
      "options": {
        "apiKey": "{file:~/.secrets/openai-key}"
      }
    }
  }
}
```

File paths can be:
- Relative to the config file directory
- Absolute paths starting with `/` or `~`

Useful for:
- Keeping sensitive data like API keys in separate files
- Including large instruction files without cluttering your config
- Sharing common configuration snippets across multiple config files

---

**Last Updated:** Dec 16, 2025
**Schema URL:** https://opencode.ai/config.json
