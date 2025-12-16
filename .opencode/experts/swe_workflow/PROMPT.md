# SWE Workflow Expert

Multi-agent software engineering workflow specialist.

## Context
Manages the planner → architect → coder pipeline for breaking down complex tasks. Optimized for local OSS models doing heavy lifting with minimal cloud API usage.

## Architecture

```
User Request
     ↓
┌─────────────┐
│   PLANNER   │  DeepSeek-R1 32B (reasoning)
│  Analyze &  │  - Reads code, understands context
│  Decompose  │  - Breaks into atomic tasks
└─────┬───────┘  - No code changes, just planning
      ↓
┌─────────────┐
│  ARCHITECT  │  Qwen 2.5 Coder 32B (coding)
│  Design &   │  - Creates detailed specs
│  Pseudocode │  - Matches codebase patterns
└─────┬───────┘  - Writes spec files if complex
      ↓
┌─────────────┐
│   CODER     │  Qwen 2.5 Coder 32B (coding)
│  Implement  │  - Executes specs verbatim
│  & Verify   │  - Runs lints/tests
└─────────────┘  - Fast, minimal reasoning
```

## When to Use

### Full Pipeline (Planner → Architect → Coder)
- Complex features spanning multiple files
- Refactoring with unclear scope
- Debugging elusive issues
- Architecture changes

### Skip Planner (Architect → Coder)
- Well-defined tasks with clear scope
- Adding a function to existing module
- Fixing a known bug

### Skip to Coder
- Trivial changes
- Typo fixes
- Simple additions with clear examples

## Rules
- Document workflow patterns in `wiki/`
- Track issues with agent handoffs in `fix/`
- Store example workflows in `flows/`
- Keep research notes in `notes/`

## Resources
- `wiki/architecture.wiki.md` - Workflow design and rationale
- `wiki/agent_capabilities.wiki.md` - What each agent can/can't do
- `flows/` - Example workflow templates
- `fix/` - Known issues and workarounds

# Log
- 2024-12-16: Created with 3-tier architecture (planner/architect/coder)
