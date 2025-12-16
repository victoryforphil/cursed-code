# Agent Capabilities Reference

Quick reference for what each SWE agent can and cannot do.

## Planner Agent

### Can Do
- Read files (read, glob, grep, list)
- Analyze codebase structure
- Decompose complex tasks
- Identify dependencies between tasks
- Write/update todo lists
- Flag risks and edge cases

### Cannot Do
- Write or edit files
- Execute bash commands
- Call other agents
- Make code changes

### Best For
- "What needs to change?"
- "How should we approach this?"
- "What are the dependencies?"

## Architect Agent

### Can Do
- Everything Planner can do
- Write new files (specs, docs)
- Create detailed pseudocode
- Match existing code patterns

### Cannot Do
- Edit existing files
- Execute bash commands
- Call other agents

### Best For
- "How exactly should this be implemented?"
- "What code structure should we use?"
- "Write specs for these tasks"

## Coder Agent

### Can Do
- Everything Architect can do
- Edit existing files
- Execute bash commands (with ask for dangerous ones)
- Run tests, lints, builds

### Cannot Do
- Call other agents
- Make architectural decisions (should follow specs)

### Best For
- "Implement this spec"
- "Fix this specific bug"
- "Run the tests"

## Tool Access Matrix

| Tool | Planner | Architect | Coder |
|------|---------|-----------|-------|
| read | ✓ | ✓ | ✓ |
| glob | ✓ | ✓ | ✓ |
| grep | ✓ | ✓ | ✓ |
| list | ✓ | ✓ | ✓ |
| write | ✗ | ✓ | ✓ |
| edit | ✗ | ✗ | ✓ |
| bash | ✗ | ✗ | ✓ (restricted) |
| task | ✗ | ✗ | ✗ |
| todowrite | ✓ | ✓ | ✓ |
| todoread | ✓ | ✓ | ✓ |

## When to Use Each

```
Complexity High ──────────────► Low

┌──────────┐   ┌───────────┐   ┌───────┐
│ Planner  │ → │ Architect │ → │ Coder │
└──────────┘   └───────────┘   └───────┘
    │              │               │
    │              │               └─ Trivial: typos, simple fixes
    │              └─ Medium: known bug, add function
    └─ Complex: new feature, refactor, debug

```

## Model Characteristics

### DeepSeek-R1 32B (Planner)
- **Speed**: Slow (extensive reasoning)
- **Tokens**: ~10-20k per analysis
- **Strength**: Chain-of-thought, understanding
- **Weakness**: Can be verbose

### Qwen 2.5 Coder 32B (Architect/Coder)
- **Speed**: Fast
- **Tokens**: ~5-15k per task
- **Strength**: Code generation, pattern matching
- **Weakness**: May skip edge cases without spec

# Log
- 2024-12-16: Initial capabilities documentation
