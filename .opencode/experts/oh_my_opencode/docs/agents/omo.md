# Feature: OmO (Orchestrator) Agent

**Source:** `/repos/oh-my-opencode/src/agents/omo.ts`, `/repos/oh-my-opencode/src/agents/build.ts`

**Lines:** ~545 | **Dependencies:** AgentConfig (SDK) | **Complexity:** High

---

## What It Does

OmO is the "team lead" orchestrator agent for oh-my-opencode. It plans obsessively with todos, assesses search complexity before launching explorations, and delegates strategically to specialized subagents (explore, librarian, oracle, frontend-ui-ux-engineer). The agent operates with extended thinking (32k token budget), enforces hard gates (frontend files always delegate), consults Oracle after significant work, and implements 3-strike failure recovery before reverting.

---

## How It Works

### 1. **Intent Gate (Phase 0)** — Every Message Entry Point
   - Classifies request type: Trivial → Explicit → Exploratory → Open-ended → Ambiguous
   - Checks for ambiguity: single interpretation → multi-interpretation (raise concern if 2x+ effort difference)
   - Validates scope clarity before acting (can direct tools answer? search clear? external libs?)

### 2. **Codebase Assessment (Phase 1)** — For Open-Ended Tasks
   - Checks config files (linter, formatter, type config)
   - Samples 2-3 similar files for consistency patterns
   - Classifies state: Disciplined → Transitional → Legacy/Chaotic → Greenfield
   - Adapts behavior based on codebase maturity

### 3. **Exploration & Research (Phase 2A)** — Strategic Tool Selection
   - Uses direct tools first (grep, glob, lsp, ast_grep) — always FREE
   - Fires explore agent for multiple search angles, unfamiliar modules, cross-layer patterns
   - Fires librarian agent for external docs, OSS references, framework best practices
   - Consults oracle only for architecture, reviews, or after 2+ failures
   - **Parallel execution default**: Background tasks for explore/librarian, continue working immediately

### 4. **Implementation (Phase 2B)** — Plan-Then-Execute
   - Creates todo list before starting (2+ steps → immediate todowrite)
   - **Hard gate**: Frontend files (.tsx/.jsx/.vue/.svelte/.css) → ALWAYS delegate (zero tolerance)
   - Delegates using 7-section mandatory structure: TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT
   - Matches existing patterns (if disciplined), proposes approach first (if chaotic)
   - Runs lsp_diagnostics at logical checkpoints, never suppresses type errors

### 5. **Failure Recovery (Phase 2C)** — 3-Strike Rule
   - Fix root causes, not symptoms; re-verify after every attempt
   - **After 3 consecutive failures**: STOP → REVERT → DOCUMENT → CONSULT ORACLE → ASK USER
   - Never leave code in broken state, continue hoping, or shotgun debug

### 6. **Completion (Phase 3)** — Verification & Delivery
   - All todos marked done, diagnostics clean, build passes, request fully addressed
   - Cancel ALL running background tasks before final answer
   - Report pre-existing issues separately from your changes

---

## Code Analysis

### Core System Prompt Structure

```typescript
// src/agents/omo.ts:3-396
const OMO_SYSTEM_PROMPT = `<Role>
  You are OmO, the orchestrator agent for OpenCode.
  **Identity**: Elite software engineer, Bay Area. Work, delegate, verify, deliver.
  **Core Competencies**: Parsing implicit requirements, adapting to codebase maturity,
    delegating specialized work, parallel execution.
  **Operating Mode**: NEVER work alone when specialists available. Frontend → delegate.
  Deep research → parallel background agents. Complex architecture → consult Oracle.
</Role>`

// Context: Establishes identity as orchestrator, sets delegation-first mindset,
// emphasizes parallel execution. This is the mental model that drives all decisions.
```

### Intent Gate System (Phase 0)

```typescript
// src/agents/omo.ts:19-29
## Phase 0 - Intent Gate (EVERY message)

| Type | Signal | Action |
| Trivial | Single file, known location, direct answer | Direct tools only, no agents |
| Explicit | Specific file/line, clear command | Execute directly |
| Exploratory | "How does X work?", "Find Y" | Assess scope, then search |
| Open-ended | "Improve", "Refactor", "Add feature" | Assess codebase first |
| Ambiguous | Unclear scope, multiple interpretations | Ask ONE clarifying question |

// Why: Prevents low-effort tasks from triggering expensive agent work,
// ensures explorations are scoped before expensive searches,
// catches ambiguity early when clarification is cheapest
```

### Hard Gate: Frontend Delegation

```typescript
// src/agents/omo.ts:173-185
## GATE: Frontend Files (HARD BLOCK - zero tolerance)

| Extension | Action | No Exceptions |
| .tsx, .jsx | DELEGATE | Even "just add className" |
| .vue, .svelte | DELEGATE | Even single prop change |
| .css, .scss, .sass, .less | DELEGATE | Even color/margin tweak |

ALL frontend = DELEGATE to `frontend-ui-ux-engineer`. Period.

// Why: Prevents frontend-specific knowledge gaps, preserves context for logic work,
// ensures UI consistency maintained by specialists. Detection by extension AND keywords.
```

### Delegation Structure (Mandatory 7 Sections)

```typescript
// src/agents/omo.ts:197-209
## Delegation Prompt Structure (MANDATORY - ALL 7 sections):

1. TASK: Atomic, specific goal (one action per delegation)
2. EXPECTED OUTCOME: Concrete deliverables with success criteria
3. REQUIRED SKILLS: Which skill to invoke
4. REQUIRED TOOLS: Explicit tool whitelist (prevents tool sprawl)
5. MUST DO: Exhaustive requirements - leave NOTHING implicit
6. MUST NOT DO: Forbidden actions - anticipate and block rogue behavior
7. CONTEXT: File paths, existing patterns, constraints

// Context: Prevents vague prompts that cause agent behavior drift.
// Each section serves specific purpose: bounds the task, clarifies success,
// prevents rogue action, and provides working context.
```

### Parallel Execution (Build Extension)

```typescript
// src/agents/build.ts:26-37
## PARALLEL TOOL CALLS - MANDATORY

ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE. This is non-negotiable.

// CORRECT: Always background, always parallel
background_task(agent="explore", prompt="Find auth implementations...")
background_task(agent="explore", prompt="Find error handling patterns...")
background_task(agent="librarian", prompt="Find JWT best practices...")
background_task(agent="librarian", prompt="Find how production apps handle auth...")
// Continue working immediately. Collect with background_output when needed.

// WRONG: Sequential or blocking
result = task(...)  // Never wait synchronously for explore/librarian

// Context: Parallel execution model treats explore/librarian as async grep tools,
// not consultants. Massive throughput improvement by continuing work while
// agents investigate.
```

### Todo-Driven Workflow

```typescript
// src/agents/build.ts:39-76
// User Request → TodoWrite (plan) → Mark in_progress → Execute/Delegate → Mark complete → Next

// Pattern: For ANY multi-step task (even if looks "simple")
todowrite([
  { id: "research", content: "Research X implementation", status: "in_progress", priority: "high" },
  { id: "impl", content: "Implement X feature", status: "pending", priority: "high" },
  { id: "test", content: "Test X feature", status: "pending", priority: "medium" }
])

// Fire multiple parallel tasks immediately
background_task(agent="explore", prompt="Find all files related to X")
background_task(agent="librarian", prompt="Look up X documentation")

// Continue working on implementation skeleton while agents research
// When notified: INTEGRATE findings and mark TODO complete

// Context: Todo list provides:
// 1. User visibility into progress (not "working on something")
// 2. Recovery path if connection drops (see what was done vs planned)
// 3. Discipline enforcement (no skipping steps, no batching completions)
// Mark complete IMMEDIATELY after finishing (never batch)
```

### 3-Strike Failure Recovery

```typescript
// src/agents/omo.ts:243-259
## After 3 Consecutive Failures:

1. STOP all further edits immediately
2. REVERT to last known working state (git checkout / undo edits)
3. DOCUMENT what was attempted and what failed
4. CONSULT Oracle with full failure context
5. If Oracle cannot resolve → ASK USER before proceeding

// Never: Leave code in broken state, continue hoping it'll work, delete failing tests

// Context: Circuit breaker pattern prevents sunk-cost debugging spirals.
// After 3 failures, you've learned what NOT to do locally; oracle has
// different reasoning model that might spot pattern you missed.
```

### Evidence Requirements

```typescript
// src/agents/omo.ts:230-239
## Evidence Requirements (task NOT complete without these)

| Action | Required Evidence |
| File edit | `lsp_diagnostics` clean on changed files |
| Build command | Exit code 0 |
| Test run | Pass (or explicit note of pre-existing failures) |
| Delegation | Agent result received and verified |

NO EVIDENCE = NOT COMPLETE.

// Context: Prevents "pretty sure it works" completions that break downstream.
// Diagnostics prove type safety. Build/test exit codes prove functionality.
// Agent results verified prevent silent failures.
```

### Oracle Consultation Decision Matrix

```typescript
// src/agents/omo.ts:282-308
WHEN to Consult:
- Complex architecture design → Oracle FIRST, then implement
- After completing significant work → Oracle review before marking complete
- 2+ failed fix attempts → Oracle for debugging guidance
- Unfamiliar code patterns → Oracle to explain behavior
- Security/performance concerns → Oracle for analysis
- Multi-system tradeoffs → Oracle for architectural decision

WHEN NOT to Consult:
- Simple file operations (use direct tools)
- First attempt at any fix (try yourself first)
- Questions answerable from code you've read
- Trivial decisions (variable names, formatting)
- Things you can infer from existing patterns

// Context: Oracle is expensive (high-quality reasoning model).
// Use as architect, not as first-line solver. Threshold is 2+ failures,
// not 1st attempt.
```

---

## Implementation Details

### Event Hooks & Lifecycle

1. **Entry Point**: Every user message triggers intent gate (Phase 0)
2. **Request Classification**: Determines if task needs pre-work (assessment, clarification)
3. **Parallel Preparation**: Fires background agents for context gathering
4. **Sequential Execution**: Performs main work while agents gather context
5. **Background Result Collection**: Integrates agent findings as they complete
6. **Verification**: Runs diagnostics at logical checkpoints
7. **Recovery**: If 3 consecutive failures, invokes circuit breaker (revert + oracle)
8. **Completion**: Cancels all background tasks, delivers final answer

### State Tracking

- **Todo Items**: Tracks plan, progress, completion (in todo system)
- **Background Tasks**: Tracks parallel agents, collect results when needed
- **Failure Counter**: Resets per fix attempt; triggers circuit breaker at 3
- **Codebase State**: Cached from initial assessment (disciplined vs chaotic)

### API Integration Points

- **Direct Tools**: grep, glob, lsp_diagnostics (used for simple queries, always first)
- **Background Tasks**: explore, librarian (fire parallel, collect async)
- **Blocking Tasks**: oracle (after complexity assessment or 2+ failures)
- **Delegation Output**: Task result collection for work delegated to specialists

### Constraints & Gates

- **Frontend Files**: Absolute block on direct edit (.tsx/.jsx/.vue/.svelte/.css)
- **Type Safety**: Never suppress with `as any`, `@ts-ignore`, `@ts-expect-error`
- **Commit Policy**: Never commit unless explicitly requested
- **Speculation**: Never infer about unread code
- **Broken State**: Never leave code broken after failures

---

## Key Patterns

### Pattern 1: Classify Before Acting
Request enters gate system. OmO determines type (trivial/explicit/exploratory/open-ended/ambiguous) before committing resources. This prevents expensive agent invocations on simple queries.

**Where Used**: `OMO_SYSTEM_PROMPT` Phase 0, lines 19-40

**Why**: Classifying costs 0 context, saves massive inference time by routing simple tasks to direct tools.

### Pattern 2: Parallel-First Mindset
Default behavior: fire multiple background agents simultaneously. Continue work immediately. Treat explore/librarian as async grep tools, not consultants.

**Where Used**: `BUILD_AGENT_PROMPT_EXTENSION` Phase 2A, lines 26-37; build.ts:59-75

**Why**: Dramatically reduces total execution time. Internal search (explore) and external search (librarian) can happen simultaneously.

### Pattern 3: Todo-Driven Discipline
Every multi-step task → immediate todowrite. Mark in_progress before starting. Mark complete immediately after finishing (never batch). Provides both user visibility and recovery path.

**Where Used**: `OMO_SYSTEM_PROMPT` Task_Management section, lines 310-334; build.ts:39-57

**Why**: Todo list is contract: user sees progress, AI has recovery path if connection drops, discipline enforced.

### Pattern 4: 7-Section Delegation Prompt
All subagent prompts must include: TASK, EXPECTED OUTCOME, REQUIRED SKILLS, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT. No implicit assumptions.

**Where Used**: `OMO_SYSTEM_PROMPT` lines 197-209; build.ts:77-114

**Why**: Vague prompts cause agent drift. Each section prevents specific failure mode.

### Pattern 5: Circuit Breaker (3-Strike Recovery)
After 3 consecutive fix attempts fail, stop all edits, revert to last known good state, consult oracle (expensive but different reasoning), ask user if oracle can't resolve.

**Where Used**: `OMO_SYSTEM_PROMPT` Phase 2C, lines 243-259

**Why**: Prevents sunk-cost debugging spirals. At 3 failures, local reasoning has hit ceiling; oracle's different model might spot pattern. If oracle fails too, user must decide direction.

### Pattern 6: Hard Gate on Frontend
ZERO tolerance for direct frontend edits. .tsx/.jsx/.vue/.svelte/.css always delegate, even "just add className". Detection by extension AND keywords.

**Where Used**: `OMO_SYSTEM_PROMPT` Phase 2B, lines 173-185

**Why**: Prevents frontend knowledge gaps from breaking UI consistency. Forces specialization.

### Pattern 7: Codebase Maturity Adaptation
Before following patterns, assess if they're worth following. Sample reference files, classify into: Disciplined → Transitional → Legacy/Chaotic → Greenfield. Adapt behavior.

**Where Used**: `OMO_SYSTEM_PROMPT` Phase 1, lines 62-83

**Why**: Don't blindly follow broken patterns. Verify before assuming patterns are intentional.

---

## Adaptation Strategy

### What to Keep

**The Intent Gate**: Fast path for trivial tasks. Costs almost nothing, saves massive time on simple queries.

**Parallel Execution Model**: Fire multiple background agents simultaneously. This scales linearly with agent availability.

**Todo-Driven Workflow**: Every multi-step task gets planned before execution. Provides user visibility + recovery path.

**7-Section Delegation Structure**: Prevents vague subagent prompts. Each section serves specific anti-drift purpose.

**Circuit Breaker (3-Strike Rule)**: Prevents debugging spirals. Clear handoff to oracle after local reasoning ceiling hit.

**Hard Gates**: Frontend files always delegate. Type safety never suppressed. Commit only when asked. These are non-negotiable safety rails.

### What to Simplify

**Codebase Assessment**: Full 4-level classification (Disciplined/Transitional/Legacy/Greenfield) is enterprise-grade. Simpler projects can skip or collapse to 2 levels.

**Oracle Consultation Rules**: Full matrix of "when to consult" is comprehensive but context-heavy. Can compress to: "After 2 failures or when uncertain about architecture."

**Tone Guidelines**: Large section on communication style, flattery avoidance, matching user style. Can compress to: "Be direct, concise, match user brevity."

**Evidence Requirements**: Full checklist is thorough. Can simplify to: "Diagnostics clean, build passes, delegation verified."

### Configuration

```typescript
{
  // Core orchestration model
  model: "anthropic/claude-opus-4-5",
  mode: "primary",
  thinking: {
    type: "enabled",
    budgetTokens: 32000,  // Extended thinking for deep planning
  },
  maxTokens: 64000,  // Allow long reasoning + response
  
  // Intent gate thresholds
  intents: {
    trivial_max_lines: 20,  // Files this size or smaller = trivial
    ambiguity_threshold: "2x_effort_difference",  // Ask if effort diff this large
  },
  
  // Parallel execution
  parallel: {
    explore_parallel_max: 5,  // Fire up to 5 parallel explore tasks
    librarian_parallel_max: 5,  // Fire up to 5 parallel librarian tasks
  },
  
  // Failure recovery
  failure_recovery: {
    failure_threshold: 3,  // Invoke circuit breaker after 3 failures
    oracle_consultation_required: true,  // Must consult oracle before retry
  },
  
  // Delegation gates
  gates: {
    frontend_extensions: [".tsx", ".jsx", ".vue", ".svelte", ".css", ".scss"],
    frontend_keywords: ["UI", "UX", "component", "button", "modal", "styling"],
    always_delegate: true,  // Zero tolerance
    type_error_suppression: false,  // Never allow as any / @ts-ignore
  },
}
```

---

## Implementation Checklist

- [ ] **Integrate Intent Gate**: Implement Phase 0 classification (Trivial/Explicit/Exploratory/Open-ended/Ambiguous) for every request
- [ ] **Wire Todo System**: Set up todowrite hooks for multi-step tasks, mark in_progress/complete atomically
- [ ] **Implement Parallel Execution**: Fire explore/librarian background tasks simultaneously, continue work while agents gather context
- [ ] **Set Frontend Hard Gate**: Detect .tsx/.jsx/.vue/.svelte/.css AND keywords (UI, component, etc.), always delegate
- [ ] **Create 7-Section Delegation Template**: Embed TASK/EXPECTED_OUTCOME/REQUIRED_SKILLS/REQUIRED_TOOLS/MUST_DO/MUST_NOT_DO/CONTEXT structure
- [ ] **Implement 3-Strike Circuit Breaker**: Count consecutive failures, auto-revert on 3rd failure, fire oracle consultation
- [ ] **Add Codebase Assessment**: Sample config files + reference files, classify maturity (Disciplined/Transitional/Legacy/Greenfield)
- [ ] **Integrate Diagnostics Checkpoints**: Run lsp_diagnostics at logical checkpoints, before marking todos complete
- [ ] **Add Oracle Consultation Logic**: Trigger after 2+ failures, after significant work, for architecture decisions
- [ ] **Create Cancellation Hook**: Cancel ALL background tasks before final answer delivery

---

# Log
- 2025-12-16: Documented OmO orchestrator agent, analyzed intent gate system, parallel execution model, todo-driven workflow, 3-strike failure recovery, hard gates, and delegation structure
- 2025-12-16: Identified 7 key patterns (classify-before-acting, parallel-first, todo-driven, 7-section-delegation, circuit-breaker, frontend-gate, codebase-adaptation)
- 2025-12-16: Created configuration template with thresholds and gate settings
