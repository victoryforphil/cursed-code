# OpenCode MCP Servers

MCP (Model Context Protocol) adds external tools to OpenCode. Supports local and remote servers.

> **Caveat**: MCP tools add to context. Be selective—some servers (e.g., GitHub MCP) can easily exceed context limits.

## Server Types

### Local

Spawns a local process. Use `type: "local"`.

```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "environment": { "MY_VAR": "value" },
      "enabled": true,
      "timeout": 5000
    }
  }
}
```

| Option | Required | Description |
|--------|----------|-------------|
| `command` | Y | Command array to start server |
| `environment` | | Env vars for the process |
| `enabled` | | Enable/disable on startup |
| `timeout` | | Tool fetch timeout in ms (default: 5000) |

### Remote

Connects to HTTP endpoint. Use `type: "remote"`.

```json
{
  "mcp": {
    "my-remote": {
      "type": "remote",
      "url": "https://mcp.example.com",
      "headers": { "Authorization": "Bearer {env:API_KEY}" },
      "enabled": true
    }
  }
}
```

| Option | Required | Description |
|--------|----------|-------------|
| `url` | Y | Remote server URL |
| `headers` | | Request headers |
| `oauth` | | OAuth config object or `false` to disable |
| `enabled` | | Enable/disable on startup |
| `timeout` | | Tool fetch timeout in ms (default: 5000) |

## OAuth Configuration

OpenCode auto-handles OAuth via Dynamic Client Registration (RFC 7591).

**Automatic** (no config needed):
```json
{ "type": "remote", "url": "https://mcp.example.com/mcp" }
```

**Pre-registered client**:
```json
{
  "oauth": {
    "clientId": "{env:CLIENT_ID}",
    "clientSecret": "{env:CLIENT_SECRET}",
    "scope": "tools:read tools:execute"
  }
}
```

**Disable OAuth** (for API key auth):
```json
{
  "oauth": false,
  "headers": { "Authorization": "Bearer {env:API_KEY}" }
}
```

**CLI commands**:
```bash
opencode mcp auth <server>    # Trigger OAuth flow
opencode mcp list             # Show servers + auth status
opencode mcp logout <server>  # Remove credentials
```

Tokens stored in `~/.local/share/opencode/mcp-auth.json`.

## Environment Variables

Use `{env:VAR_NAME}` syntax in config values:
```json
"headers": { "Authorization": "Bearer {env:MY_API_KEY}" }
```

## Enabling/Disabling Tools

### Global disable

```json
{
  "tools": {
    "my-mcp-foo": false,
    "my-mcp*": false  // glob pattern
  }
}
```

### Per-agent enable

Disable globally, enable for specific agent:

```json
{
  "tools": { "my-mcp*": false },
  "agent": {
    "my-agent": {
      "tools": { "my-mcp*": true }
    }
  }
}
```

**Glob patterns**: `*` = any chars, `?` = one char

## Common Servers

### Context7

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

### Grep (Vercel)

```json
{
  "mcp": {
    "gh_grep": {
      "type": "remote",
      "url": "https://mcp.grep.app"
    }
  }
}
```

---

*Source: [opencode_mcp_full.md](../docs/opencode_mcp_full.md)*

# Log
- 2024-12-16: Created from raw documentation
