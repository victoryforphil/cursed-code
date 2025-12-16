# OpenCode Permissions

Control which actions require approval. Configure in `opencode.json` under `permission`.

## Permission Types

| Value | Behavior |
|-------|----------|
| `allow` | Run without approval |
| `ask` | Prompt before running |
| `deny` | Disable the tool |

**Defaults**: Most tools `allow`. `doom_loop` and `external_directory` default to `ask`.

## Tools

### edit
Controls file editing operations.
```json
{ "permission": { "edit": "ask" } }
```

### bash
Simple mode—apply to all commands:
```json
{ "permission": { "bash": "ask" } }
```

Per-command mode—granular control:
```json
{
  "permission": {
    "bash": {
      "git push": "ask",
      "git status": "allow",
      "npm run build": "allow"
    }
  }
}
```

#### Glob Patterns
- `*` — matches zero or more characters
- `?` — matches exactly one character

Deny all, allow specific:
```json
{
  "permission": {
    "bash": {
      "*": "deny",
      "pwd": "allow",
      "git status": "ask"
    }
  }
}
```

Disable command groups:
```json
{ "permission": { "bash": { "terraform *": "deny" } } }
```

#### "Accept Always" Scope
- Applies for current session only
- Matches first two elements: `git log` → allows `git log *` but not `git commit`
- Pipelines: each command parsed separately

### webfetch
Controls web page fetching.
```json
{ "permission": { "webfetch": "deny" } }
```

### doom_loop
Triggered when same tool called 3× with identical args. Prevents infinite loops.
```json
{ "permission": { "doom_loop": "ask" } }
```

### external_directory
Controls access to files outside working directory.
```json
{ "permission": { "external_directory": "ask" } }
```

## Per-Agent Overrides

Agent config overrides global. In `opencode.json`:
```json
{
  "permission": {
    "bash": { "git push": "ask" }
  },
  "agent": {
    "build": {
      "permission": {
        "bash": { "git push": "allow" }
      }
    }
  }
}
```

In agent markdown frontmatter:
```yaml
---
permission:
  edit: deny
  bash: ask
  webfetch: deny
---
```

---
**Source**: [docs/opencode_permissions_full.md](../docs/opencode_permissions_full.md) | [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions)

# Log
- 2024-12-16: Created from full permissions documentation
