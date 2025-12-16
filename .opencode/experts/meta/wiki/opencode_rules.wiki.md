# OpenCode Rules

Custom instructions for OpenCode via `AGENTS.md` files and config.

## AGENTS.md Purpose

- Project-specific instructions included in LLM context
- Similar to `CLAUDE.md` or Cursor rules
- Commit to Git for team sharing

**Create with**: `/init` command (scans project, generates file)

## Locations & Precedence

| Location | Scope | Use Case |
|----------|-------|----------|
| `./AGENTS.md` | Project | Team-shared project rules |
| `~/.config/opencode/AGENTS.md` | Global | Personal rules across all sessions |

Both are combined when present. Local files found by traversing up from cwd.

## Instructions Array (opencode.json)

Reference additional instruction files without duplicating to AGENTS.md:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    ".cursor/rules/*.md"
  ]
}
```

- Supports glob patterns (`packages/*/AGENTS.md`)
- Combined with all AGENTS.md files
- Works in project or global config

## Glob Pattern Examples

```json
"instructions": [
  "docs/*.md",
  "packages/*/AGENTS.md",
  ".cursor/rules/*.md"
]
```

**Best for**: Monorepos, shared standards across packages.

## Lazy-Load Pattern

For on-demand file loading, teach OpenCode in AGENTS.md:

```markdown
When you encounter @rules/file.md, use Read tool to load it.
Do NOT preemptively load - use lazy loading based on need.
```

## Gotchas

- OpenCode doesn't auto-parse file references in AGENTS.md
- Use `instructions` array for automatic inclusion
- Use lazy-load pattern for conditional/contextual files
- Global rules = personal preferences (not in Git)
- Project rules = team standards (commit to Git)

---
*Source: [docs/opencode_rules_full.md](../docs/opencode_rules_full.md)*

# Log
- 2024-12-16: Created from opencode_rules_full.md
