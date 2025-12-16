---
description: Create a new expert and start research
subtask: true
---

Create a new expert folder for "$1" at `.opencode/experts/$1/`.

**Structure to create:**
```
.opencode/experts/$1/
├── PROMPT.md        # Expert context (use description if provided)
├── docs/            # Raw documentation
├── wiki/            # Distilled knowledge
├── notes/           # Research notes
├── fix/             # Problem/solution logs
└── flows/           # Step-by-step workflows
```

**PROMPT.md template:**
```markdown
# $1 Expert

$2

## Context
Expert for $1. Accumulates knowledge about patterns, best practices, and gotchas.

## Rules
- Document findings in wiki/*.wiki.md
- Log issues and solutions in fix/*.fix.md
- Keep notes in notes/
- Store raw docs in docs/

## Resources
- wiki/ - Distilled knowledge
- docs/ - Raw documentation
- fix/ - Issues and solutions
- notes/ - Research observations

# Log
- {date}: Created
```

If $2 (description) not provided, use a placeholder.

**After creating the structure, automatically invoke `/research $1` with any remaining arguments ($3, $4, $5, etc. as URLs).**

This creates the expert folder and kicks off the research pipeline in one command.
