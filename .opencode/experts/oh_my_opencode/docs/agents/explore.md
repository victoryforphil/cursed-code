# Feature: Explore Agent

**Source:** `/repos/oh-my-opencode/src/agents/explore.ts`
**Lines:** ~100 | **Dependencies:** OpenCode SDK, 6+ search tools | **Complexity:** Medium

## What It Does

The Explore agent answers contextual search questions about codebases: "Where is X implemented?", "Which files contain Y?", "Find code that does Z". It's designed for parallel execution with 3+ search tools firing simultaneously to deliver complete, actionable results without follow-up questions needed.

This agent shifts the paradigm from "tell me where to look" to "here's everything you need to know to proceed."

## How It Works

1. **Parse the intent** - Understand both literal request and underlying need
2. **Launch parallel searches** - Fire 3+ tools simultaneously (glob, grep, ast_grep, LSP, etc.)
3. **Cross-validate results** - Combine multiple search strategies to catch everything
4. **Structure the output** - Return absolute paths, explanations, and next steps
5. **Ensure actionability** - Caller never needs to ask "but where exactly?"

Key decision points:
- **Thoroughness level** (quick/medium/very thorough) determines search depth
- **Tool selection** depends on search type (semantic vs. structural vs. text patterns)
- **Parallel execution non-negotiable** - Sequential search defeats the purpose

## Code Analysis

### 1. Agent Configuration (`explore.ts:3-9`)

```typescript
export const exploreAgent: AgentConfig = {
  description:
    'Contextual grep for codebases. Answers "Where is X?", "Which file has Y?", "Find the code that does Z"...',
  mode: "subagent",
  model: "opencode/grok-code",
  temperature: 0.1,
  tools: { write: false, edit: false, background_task: false },
  // ...
}
```

**Why this setup:**
- `subagent` mode: Launches in parallel from parent, doesn't block execution
- `grok-code` model: Specialized for code understanding and search
- `temperature: 0.1`: Deterministic, focused responses (not creative)
- Read-only tools: Can search but not modify (safety constraint)

**Integration point:** Parent agent calls this as `background_task` or parallel subagent for discovery phase.

### 2. Mission Statement (`explore.ts:10-18`)

```typescript
// Line 10-18: Core mission
You are a codebase search specialist. Your job: find files and code, return actionable results.

Answer questions like:
- "Where is X implemented?"
- "Which files contain Y?"
- "Find the code that does Z"
```

**Pattern:** Three-tier question categories drive tool selection strategy. Each reveals what the user really needs.

### 3. Intent Analysis (`explore.ts:23-30`)

```typescript
// Before ANY search, analyze the intent
<analysis>
**Literal Request**: [What they literally asked]
**Actual Need**: [What they're really trying to accomplish]
**Success Looks Like**: [What result would let them proceed immediately]
</analysis>
```

**Why this matters:**
- Caller says "Where is auth?" but needs "How does auth flow through the app?"
- Caller says "Find validation" but needs "All validation patterns in codebase"
- This bridges the gap between question and solution

**Pattern:** Precondition all searches with intent analysis. Prevents wasted tool calls.

### 4. Parallel Execution Requirement (`explore.ts:32-33`)

```typescript
// Line 32-33: CRITICAL constraint
### 2. Parallel Execution (Required)
Launch **3+ tools simultaneously** in your first action. Never sequential unless output depends on prior result.
```

**Why 3+ tools:**
- `glob` for file discovery by name/pattern
- `grep` for text pattern matching
- `ast_grep_search` for code structure (functions, classes)
- LSP tools for semantic references
- `grep_app` for external examples

**Implementation strategy:** All independent searches fire in same tool invocation block. Dependent searches wait for results.

### 5. Structured Results Format (`explore.ts:38-53`)

```typescript
// Line 38-53: Required output structure
<results>
<files>
- /absolute/path/to/file1.ts — [why this file is relevant]
- /absolute/path/to/file2.ts — [why this file is relevant]
</files>

<answer>
[Direct answer to their actual need, not just file list]
[If they asked "where is auth?", explain the auth flow you found]
</answer>

<next_steps>
[What they should do with this information]
[Or: "Ready to proceed - no follow-up needed"]
</next_steps>
</results>
```

**Structure enforces:**
- Absolute paths only (validation rule)
- Why each file matters (context for user)
- Answer, not just list (actionability)
- Next steps guidance (unblock caller)

### 6. Success Criteria & Failure Conditions (`explore.ts:55-71`)

```typescript
// Line 57-62: Success Criteria
| Criterion | Requirement |
|-----------|-------------|
| **Paths** | ALL paths must be **absolute** (start with /) |
| **Completeness** | Find ALL relevant matches, not just the first one |
| **Actionability** | Caller can proceed **without asking follow-up questions** |
| **Intent** | Address their **actual need**, not just literal request |

// Line 64-70: Failure Conditions
- Any path is relative (not absolute)
- You missed obvious matches in the codebase
- Caller needs to ask "but where exactly?" or "what about X?"
- You only answered the literal question, not the underlying need
- No <results> block with structured output
```

**Pattern:** Explicit failure criteria prevent incomplete responses. These are checkable before delivering result.

### 7. Tool Strategy (`explore.ts:79-98`)

```typescript
// Line 79-98: Tool Selection Logic
Use the right tool for the job:
- **Semantic search** (definitions, references): LSP tools
- **Structural patterns** (function shapes, class structures): ast_grep_search  
- **Text patterns** (strings, comments, logs): grep
- **File patterns** (find by name/extension): glob
- **History/evolution** (when added, who changed): git commands
- **External examples** (how others implement): grep_app

### grep_app Strategy
grep_app searches millions of public GitHub repos instantly — use it for external patterns and examples.

**Critical**: grep_app results may be **outdated or from different library versions**. Always:
1. Start with grep_app for broad discovery
2. Launch multiple grep_app calls with query variations in parallel
3. **Cross-validate with local tools** (grep, ast_grep_search, LSP) before trusting results
```

**Why different tools:**
- Semantic: "What functions call this?" → LSP
- Structural: "All components with render method?" → ast_grep_search
- Text: "All error messages containing 'timeout'?" → grep
- Files: "All test files?" → glob
- History: "When was this added?" → git
- External: "How do others implement X?" → grep_app

**Critical pattern:** grep_app is for discovery, not truth. Always cross-validate with local tools.

## Implementation Details

### Intent Analysis Engine
- **When:** Before launching any search tools
- **What:** Parse user question to extract literal request vs. actual need
- **Output:** 3-part analysis wrapped in `<analysis>` tags
- **Example:**
  - Literal: "Where is validation?"
  - Need: "How do I add a new validation rule?"
  - Success: "Show me all validation patterns and where to add new ones"

### Parallel Execution Engine
- **When:** After intent analysis
- **What:** Launch 3+ independent search tools simultaneously
- **Why:** Parallel execution catches patterns sequential search misses
- **Pattern:** Use tool invocation block to fire all independent searches in one action

### Search Tool Selection
- **glob** + **grep** combo: Find files by name, then search content
- **ast_grep_search**: Find code patterns (function definitions, class structures)
- **grep_app**: Discover patterns from open-source repos (validate against local)
- **Git history**: When asking "who added this?" or "when?"
- **LSP tools** (if available): Semantic references and definitions

### Thoroughness Levels
- **Quick**: 1-2 search tools, basic glob + grep, return first 5 matches
- **Medium**: 3-4 tools (glob, grep, ast_grep_search, maybe LSP), comprehensive but focused
- **Very thorough**: 5+ tools (all above + git history + grep_app validation), exhaustive cross-validation

### Actionability Guarantee
- **Never:** Return just file list expecting caller to open them
- **Always:** Explain what each file contains and why it matters
- **Always:** Provide next steps (specific lines to read, what to modify, etc.)
- **Test:** Would caller need to ask follow-up questions? If yes, output is incomplete.

## Key Patterns

**Parallel > Sequential**
- All independent searches fire simultaneously
- Dependent searches wait for predecessor results
- Reduces discovery time by 3-5x vs. sequential approach

**Intent > Literal Question**
- Understanding "why they're asking" beats precise parsing
- Prevents wasted searches on wrong interpretation
- Enables proactive solution delivery

**Cross-Validation > Trust First**
- grep_app finds patterns, but local tools verify
- Prevents stale/wrong external examples from corrupting results
- Critical for library version differences

**Absolute Paths Always**
- No relative paths in results
- Caller can copy/paste directly
- Enables automation of next steps

**Structured Output > Natural Language**
- XML-like tags (`<results>`, `<files>`, `<answer>`, `<next_steps>`) enforce consistency
- Parseable by parent agents or tools
- Enables chaining with other agents

## Anti-Patterns to Avoid

**Problem: Sequential search when parallel available**
- Calling glob, waiting for results, then calling grep
- Cost: 3-5x slower discovery
- Fix: Launch all independent searches simultaneously

**Problem: Relative paths in results**
- "./src/utils.ts" or "src/utils.ts"
- Cost: Caller can't copy/paste, needs to figure out base path
- Fix: Always use absolute paths (start with `/`)

**Problem: Returning file list without context**
- "Found: auth.ts, login.ts, session.ts"
- Cost: Caller still needs to open each file to understand structure
- Fix: Explain why each file matters and what it contains

**Problem: Only answering literal question**
- User: "Where is the auth code?"
- Agent: "In src/auth/"
- Cost: Caller still doesn't know how to use it
- Fix: Provide auth flow explanation and next steps

**Problem: Trusting grep_app results as source of truth**
- External examples may be outdated or from different versions
- Cost: False leads, incompatible patterns
- Fix: Validate grep_app results with local tools

**Problem: Missing matches due to single search approach**
- Single grep for "auth" might miss "authentication"
- Cost: Incomplete results, caller asks follow-ups
- Fix: Launch multiple search variations in parallel (auth, authentication, Auth, AUTH, etc.)

## Adaptation Strategy

### What to Keep
- Intent analysis before searches (prevents wasted tool calls)
- Parallel execution pattern (3+ tools minimum)
- Structured results format with absolute paths (enforces consistency)
- Failure criteria checklist (ensures completeness)
- Tool selection logic (right tool for right job)

### What to Simplify
- Can reduce parallel tools from 3+ to 2+ for simpler codebases
- Intent analysis can be brief for obvious questions
- Thoroughness levels optional if always running "medium"
- External grep_app validation optional for internal codebases

### What to Extend
- Add AST-based pattern matching for language-specific searches
- Add semantic index lookups if using LSP servers
- Add codebase statistics (file count, size, language breakdown)
- Add search result ranking (by relevance, not just list order)
- Add history tracking (what searches were popular, which worked best)

### Configuration
```typescript
{
  // Search parallelism
  maxParallelTools: 3,      // Minimum tools to fire simultaneously
  toolTimeoutMs: 5000,      // Per-tool timeout
  
  // Thoroughness behavior
  defaultThoroughness: "medium",  // quick | medium | very thorough
  quickMaxResults: 5,
  mediumMaxResults: 15,
  thoroughMaxResults: 50,
  
  // Path handling
  requireAbsolutePaths: true,  // Enforce validation
  stripLeadingDots: true,      // Convert ./src/x.ts to /project/src/x.ts
  
  // Intent analysis
  alwaysAnalyzeIntent: true,   // Never skip analysis phase
  maxAnalysisTokens: 200,      // Keep analysis concise
  
  // Tool selection
  preferredToolsByType: {
    semantic: ["lsp", "ast_grep"],
    structural: ["ast_grep_search", "grep"],
    text: ["grep"],
    files: ["glob"],
    history: ["git"],
    external: ["grep_app"]
  }
}
```

## Implementation Checklist

- [ ] Set up intent analysis wrapper (parse literal vs. actual need)
- [ ] Implement parallel tool invocation (3+ tools in first action block)
- [ ] Create structured results formatter (XML-like tags with validation)
- [ ] Add path validation (all absolute, no relative paths)
- [ ] Implement tool selection logic (right tool for search type)
- [ ] Add completeness check (did we find all matches?)
- [ ] Add actionability check (can caller proceed without follow-up?)
- [ ] Implement thoroughness levels (quick/medium/very thorough behavior)
- [ ] Add grep_app cross-validation (compare with local results)
- [ ] Create test cases for each search type (semantic, structural, text, files)
- [ ] Document tool availability for target platform
- [ ] Add timeout handling for slow searches
