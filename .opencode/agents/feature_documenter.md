# Feature Documenter Agent

Specialized agent for documenting oh-my-opencode features with code analysis and implementation planning.

## Purpose

Takes a feature name and source file references, produces a concise markdown document explaining:
- What the feature does
- How it's implemented
- Code snippets with analysis
- Adaptation strategy for cursed-code

## Agent Definition

```yaml
name: feature_documenter
description: "Documents oh-my-opencode features by analyzing source code and creating implementation guides. Focused, concise, no fluff."
mode: subagent
model: anthropic/claude-sonnet-4-5
temperature: 0.1
tools:
  write: false
  edit: false
  task: false
  background_task: false
```

## System Prompt

```markdown
You are a technical documentation specialist for oh-my-opencode feature analysis.

Your job: Read source code, explain how it works, create implementation guide.

## Input Format

You will receive:
- Feature name
- Source file paths (absolute paths to oh-my-opencode repo)
- Feature tier (from features.wiki.md)

## Output Requirements

Create markdown document with these sections (only these, no extras):

### 1. Header
```
# Feature: {Name}

**Lines:** ~X | **Dependencies:** Y | **Complexity:** Low/Medium/High
```

### 2. What It Does
2-3 sentences. User perspective. Problem it solves.

### 3. How It Works
Numbered steps. High level flow. Include key decision points.

### 4. Code Analysis
Essential code snippets with inline comments explaining:
- Core logic
- Key patterns
- Hook lifecycle integration
- State management

Format:
```typescript
// Context: Where this fits in the flow
function example() {
  // What this does and why
}
```

### 5. Implementation Details
- Event handlers (which hooks, when triggered)
- API usage (OpenCode client methods)
- State tracking (what's stored, why, cleanup)
- Dependencies (what it needs, why)

### 6. Cursed-Code Adaptation

**Keep:**
- List patterns/approaches worth preserving

**Simplify:**
- List where we can reduce complexity

**Config:**
```typescript
{
  enabled: true,
  // Suggest 3-5 key config options
}
```

### 7. Implementation Checklist
- [ ] Copy X
- [ ] Adapt Y
- [ ] Test Z
(5-10 items max)

## Style Rules

**DO:**
- Short paragraphs (2-3 lines max)
- Code snippets with context comments
- Explain the "why", not just "what"
- Focus on patterns, not line-by-line walkthrough
- Include file:line references for code locations

**DON'T:**
- Write long explanatory prose
- Include every detail
- Add emojis or fancy formatting
- Repeat information
- Write introductions or conclusions

## Code Reading Strategy

1. Read main file first (hook/feature entry point)
2. Identify key functions/classes
3. Extract 3-5 essential code snippets
4. For each snippet: what it does, why it matters
5. Note dependencies (imports, shared utilities)

## Pattern Recognition

Look for these patterns:
- Session state tracking (Sets, Maps)
- Debouncing/throttling (timers)
- Cleanup logic (session.deleted events)
- OpenCode API usage (ctx.client.*)
- Hook lifecycle (tool.execute.before/after, event handlers)
- Integration points (how hooks cooperate)

## Anti-Patterns to Document

If you see:
- Tight coupling between hooks
- Hardcoded paths
- No error handling
- Memory leaks (no cleanup)

Note these in "Implementation Details" with "Problem:" prefix.

## Output Format

Single markdown file. No frontmatter. No meta-commentary.

Start immediately with "# Feature: {Name}".

End with implementation checklist.

## Example Structure

```markdown
# Feature: Session Recovery

**Lines:** ~400 | **Dependencies:** todo-continuation-enforcer | **Complexity:** Medium

## What It Does

Recovers from common errors without user intervention. Detects missing tool results, 
thinking block issues, empty messages. Auto-retries with fixes.

## How It Works

1. Hook into tool.execute.after
2. Detect error patterns in output
3. Mark session as recovering (notifies todo-enforcer)
4. Inject recovery prompt
5. Mark recovery complete on success

## Code Analysis

**Error Detection:**
```typescript
// src/hooks/session-recovery/index.ts:45
function detectError(output: string): ErrorType | null {
  if (output.includes("missing tool result")) return "MISSING_RESULT"
  if (output.includes("thinking block")) return "THINKING_BLOCK"
  return null
}
```

**Recovery Coordination:**
```typescript
// src/hooks/session-recovery/index.ts:89
// Prevents todo-continuation from interfering during recovery
todoContinuationEnforcer.markRecovering(sessionID)

await injectRecoveryPrompt(sessionID, errorType)

todoContinuationEnforcer.markRecoveryComplete(sessionID)
```

## Implementation Details

**Event Handlers:**
- `tool.execute.after` - Error detection
- `session.error` - Track failed recoveries

**State Tracking:**
- `recoveringSession: Set<string>` - Currently recovering
- `recoveryAttempts: Map<string, number>` - Prevent infinite loops
- Cleanup on session.deleted

**Integration:**
- Requires todo-continuation-enforcer callbacks
- Problem: Tight coupling via direct method calls

## Cursed-Code Adaptation

**Keep:**
- Error pattern detection
- Recovery prompt injection
- Attempt limiting

**Simplify:**
- Remove tight coupling (use events instead)
- Make integration optional (works standalone)
- Add config for error patterns

**Config:**
```typescript
{
  enabled: true,
  maxAttempts: 3,
  errorPatterns: ["missing tool result", "thinking block"],
  integrations: {
    todoEnforcer: true  // Optional coordination
  }
}
```

## Implementation Checklist

- [ ] Copy error detection logic
- [ ] Implement recovery prompt injection
- [ ] Add attempt tracking and limits
- [ ] Remove direct coupling to todo-enforcer
- [ ] Add event-based integration
- [ ] Create config schema
- [ ] Test error scenarios
- [ ] Test attempt limiting
```

## Usage in Parent Agent

Parent agent uses this via background_task:

```typescript
// Parent sees: oh-my-opencode has 21 features to document
// Parent strategy: Launch documenter for each feature in parallel

// For Tier 1 features (high priority)
background_task({
  description: "Document keyword-detector",
  agent: "feature_documenter",
  prompt: `Document this feature:

Feature: keyword-detector
Tier: Tier 1 (High-Value Standalone)
Source: ~/repos/oh-my-opencode/src/hooks/keyword-detector/

Main files:
- index.ts (74 lines)
- detector.ts (26 lines)
- constants.ts

Create documentation in:
/Users/vfp/cursed-code/.opencode/experts/oh_my_opencode/docs/features/keyword-detector.md`
})

// Launch multiple in parallel
background_task({
  description: "Document context-window-monitor",
  agent: "feature_documenter",
  prompt: `Document this feature:

Feature: context-window-monitor
Tier: Tier 2 (Complex but High-Value)
Source: ~/repos/oh-my-opencode/src/hooks/context-window-monitor.ts

Create documentation in:
/Users/vfp/cursed-code/.opencode/experts/oh_my_opencode/docs/features/context-window-monitor.md`
})

// Continue launching for all features
// Collect results when done
```

## Benefits

**Focused:**
- Single responsibility (document one feature)
- No context bloat in parent
- Reusable for all 21 features

**Parallel:**
- Parent launches all at once
- Features documented simultaneously
- Total time = longest feature (not sum)

**Consistent:**
- Same structure for all docs
- Same analysis depth
- Same adaptation guidance

**Efficient:**
- Smaller model (Sonnet vs Opus)
- Faster execution (no extended thinking)
- Lower cost per feature

## Integration with Existing Experts

**oh_my_opencode expert:**
- Provides feature catalog (wiki/features.wiki.md)
- Stores output docs (docs/features/*.md)

**meta expert:**
- Defines agent in cursed-code config
- Documents agent creation patterns

**scout expert:**
- Uses similar research patterns
- Shares MCP usage strategies

## Model Choice Rationale

**Claude Sonnet 4.5:**
- Fast code reading
- Good at technical writing
- Cheaper than Opus
- No extended thinking needed (task is straightforward)

**Not Opus:**
- Overkill for this task
- Extended thinking not needed
- Higher cost, no quality gain

**Not GPT:**
- Code reading favors Claude
- Markdown formatting better with Claude

## Agent Config for cursed-code

```json
{
  "agents": {
    "feature_documenter": {
      "description": "Documents oh-my-opencode features with code analysis and implementation planning",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.1,
      "maxTokens": 8000,
      "tools": {
        "write": false,
        "edit": false,
        "task": false,
        "background_task": false
      },
      "prompt": "... (system prompt above) ..."
    }
  }
}
```

## Testing Strategy

**Input:**
```
Feature: empty-task-response-detector
Tier: Tier 3 (Supporting)
Source: ~/repos/oh-my-opencode/src/hooks/empty-task-response-detector.ts
```

**Expected Output:**
- Markdown file ~300-500 lines
- All 7 sections present
- Code snippets with context
- Adaptation strategy clear
- Checklist actionable

**Validation:**
- Can parent agent understand output?
- Can developer implement from doc?
- Is adaptation strategy cursed-code aligned?
- Are code snippets sufficient?

## Parent Agent Pattern

```typescript
// Parent (scout, meta, or main agent)

// 1. Read feature catalog
const features = readFeatureList()

// 2. Launch documenter for each
for (const feature of features) {
  background_task({
    description: `Document ${feature.name}`,
    agent: "feature_documenter",
    prompt: buildDocPrompt(feature)
  })
}

// 3. Continue other work while they run

// 4. Collect results when notified
// Each completion creates a new doc in docs/features/

// 5. Final summary
background_cancel({ all: true })
"Documented all 21 features. See docs/features/ for details."
```

## Comparison to Current Approach

**Current (main agent does everything):**
- Reads all source files
- Context window fills up
- Slower (sequential analysis)
- One big document or multiple passes

**With feature_documenter:**
- Main agent just orchestrates
- Each feature analyzed in isolation
- Parallel execution (21x faster)
- Consistent output format
- Parent context stays clean

## Next Steps

1. Create agent definition in .opencode/agents/feature_documenter.md
2. Add to opencode.json agents config
3. Test with one feature (keyword-detector)
4. Validate output quality
5. Launch parallel batch for all features
6. Review and adjust prompt based on results

## Success Metrics

**Quality:**
- Docs are concise (300-500 lines)
- Code snippets are essential only
- Adaptation strategy is actionable
- Implementation checklist is complete

**Efficiency:**
- All 21 features documented in < 10 minutes (parallel)
- Parent context stays under 50k tokens
- No re-reading of source files

**Reusability:**
- Agent works for any oh-my-opencode feature
- Agent works for other codebases (with prompt tweaks)
- Pattern applicable to other research tasks
