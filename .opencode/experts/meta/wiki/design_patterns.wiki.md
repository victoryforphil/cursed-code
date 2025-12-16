# Design Patterns

## Agents vs Experts

**Agents** (`.opencode/agent/*.md`) define behavior - prompts, tools, permissions.

**Experts** (`.opencode/experts/*/`) accumulate knowledge over time - docs, fixes, wikis, flows.

### Decision Rule
- Does it need persistent memory/knowledge? → Expert folder
- Is it a utility/transformation tool? → Agent file only

### Examples
- **Scout**: Agent with expert folder (accumulates research tips)
- **Scribe**: Agent only (pure conversion, no memory needed)
- **Wikify**: Agent only (transformation, no learning)

### Why This Matters
Experts grow smarter over time as they document patterns, fixes, and workflows. Agents without experts remain stateless tools.

## File Naming Conventions

Use suffixes to identify file types:
- `*.fix.md` - Problem/solution pairs
- `*.todo.md` - Task tracking
- `*.wiki.md` - Distilled knowledge

## Prompt Structure

Effective expert prompts follow this pattern:

```markdown
# Expert Name

Brief role description (1-3 sentences).

## Rules
- Bullet point instructions
- Clear, actionable
- No fluff

## Resources
- Reference to subdirectories

# Log
- Date: Change description
```

# Log
- 2024-12-15: Initial architectural decisions documented
