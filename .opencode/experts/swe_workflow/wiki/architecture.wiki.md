# SWE Workflow Architecture

## Design Rationale

### Problem
Complex SWE tasks require:
1. Deep reasoning for understanding/planning
2. Pattern matching for design
3. Fast execution for implementation

Single-agent approach wastes expensive reasoning on simple coding.

### Solution: Tiered Specialization

| Agent | Model | Strength | Token Cost |
|-------|-------|----------|------------|
| Planner | DeepSeek-R1 32B | Reasoning, analysis | Local (free) |
| Architect | Qwen 2.5 Coder 32B | Code patterns, design | Local (free) |
| Coder | Qwen 2.5 Coder 32B | Fast implementation | Local (free) |

### Key Insight: Context Isolation
Each agent gets fresh context = no pollution from previous steps.
- Planner: Only sees enough to understand the task
- Architect: Only sees plan + relevant code
- Coder: Only sees spec + target file

### Tool Permissions

| Agent | Read | Write | Edit | Bash | Task |
|-------|------|-------|------|------|------|
| Planner | ✓ | ✗ | ✗ | ✗ | ✗ |
| Architect | ✓ | ✓ (specs) | ✗ | ✗ | ✗ |
| Coder | ✓ | ✓ | ✓ | ✓ | ✗ |

Progressively more dangerous tools as trust increases.

## Workflow Patterns

### Pattern 1: Full Pipeline
```
@planner "Add user authentication to the API"
  ↓ (returns task list)
@architect "Implement tasks from planner: [paste tasks]"
  ↓ (returns specs)
@coder "Execute specs: [paste specs]"
```

### Pattern 2: Automated Orchestration (Future)
```
/swe "Add user authentication to the API"
  ↓ (orchestrator chains agents automatically)
```

### Pattern 3: Skip Tiers
```
# Well-defined task - skip planner
@architect "Add rate limiting to /api/users endpoint"
  ↓
@coder "Execute: [specs]"

# Trivial task - straight to coder
@coder "Fix typo in README: 'teh' → 'the'"
```

## Model Selection Rationale

### DeepSeek-R1 32B for Planning
- Chain-of-thought reasoning
- Good at understanding complex codebases
- Slower but thorough
- GSM8K: 93.2% (math/logic benchmark)

### Qwen 2.5 Coder 32B for Architecture/Coding
- Excellent at code generation
- Fast inference
- Matches patterns well
- HumanEval: 79-82% (coding benchmark)

## Future Enhancements

1. **Orchestrator Agent** - Chains planner→architect→coder automatically
2. **Reviewer Agent** - Validates coder output before commit
3. **Spec Files** - Architect writes to `.opencode/specs/` for complex tasks
4. **Memory** - Track patterns that work well per-codebase

## Lessons from oh-my-opencode

Applied:
- ✅ Loose coupling (agents don't call each other directly)
- ✅ Clear separation of concerns
- ✅ Progressive tool permissions
- ✅ Context isolation per agent

Avoided:
- ❌ Tight coupling between hooks
- ❌ Monolithic bundling
- ❌ Forced model selection (uses local models)

# Log
- 2024-12-16: Initial architecture documentation
