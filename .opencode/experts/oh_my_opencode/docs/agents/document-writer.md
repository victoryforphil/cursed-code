# Feature: Document Writer Agent

**Source:** `/Users/vfp/repos/oh-my-opencode/src/agents/document-writer.ts`  
**Lines:** ~204 | **Dependencies:** AgentConfig (OpenCode SDK) | **Complexity:** Medium

## What It Does

The Document Writer is a specialized technical writing agent that transforms complex codebases into crystal-clear documentation. It handles README files, API docs, architecture documentation, and user guides—and MUST be used when executing documentation tasks from ai-todo list plans. Uniquely, it employs verification-driven documentation where every code example is tested before publication.

## How It Works

**Execution Flow:**

1. **Read todo list** → Extract execution_context with exact task quote
2. **Identify current task** → Find matching todo item; use aggressive exploration (Explore agent in parallel)
3. **Update todo list** → Mark "현재 진행 중인 작업" section with in-progress status
4. **Execute documentation** → Choose doc type (README/API/Architecture/User Guide), write according to patterns
5. **Verification (mandatory)** → Test all code examples, check links, verify API responses
6. **Mark complete** → Only check `[ ]` → `[x]` after ALL verification criteria met
7. **Generate report** → Task completion report with documented changes and verification results

**Key Decision Points:**
- **Doc Type Selection**: Routes to different structure/tone (README = welcoming; API = technical/precise; Architecture = educational; User Guide = friendly/supportive)
- **Exploration Strategy**: Uses maximum parallelism (multiple read/glob/grep in single message) + Explore agent for broad searches
- **Verification Gate**: Task is INCOMPLETE until all examples verified—forces iteration on failures

## Code Analysis

### Core Agent Configuration
```typescript
// src/agents/document-writer.ts:1-10
export const documentWriterAgent: AgentConfig = {
  description: "Technical writer for README, API docs, architecture docs, user guides. MUST BE USED when executing documentation tasks from ai-todo list plans.",
  mode: "subagent",  // Runs as subagent, not primary orchestrator
  model: "google/gemini-3-pro-preview",  // Gemini chosen for writing clarity
  tools: { background_task: false },  // No background tasks; sequential execution
  prompt: `<role>...<workflow>...<guide>...`
}
```

**Why this config:**
- `subagent` mode: Delegates all documentation from OmO orchestrator
- `google/gemini-3-pro-preview`: Better at prose generation than coding models
- `background_task: false`: Documentation needs blocking execution (can't parallelize writing)
- No `write: true` by default: Runs in OpenCode context where writing is managed by platform

### Role Definition Section (lines 9-66)
```typescript
// The agent's identity emphasizes dual perspective
<role>
You are a TECHNICAL WRITER with deep engineering background
// Combines developer understanding + reader empathy
// Can explore codebases even without detailed specs
</role>
```

**Core mission**: Accurate, comprehensive, genuinely useful documentation.

**Code of Conduct**: 5 principles enforced throughout prompt:

1. **Diligence & Integrity** — Complete what is asked; never mark incomplete work as done
2. **Continuous Learning** — Study codebase before writing; learn conventions
3. **Precision & Adherence** — Match existing patterns; respect project conventions  
4. **Verification-Driven** — ALWAYS verify code examples; test every command
5. **Transparency & Accountability** — Announce each step; explain reasoning

### Workflow Engine (lines 68-144)
```typescript
<workflow>
// 7-step execution loop
1. Read todo list → extract EXACT task quote from execution_context
2. Identify current task → find matching item; EXPLORE AGGRESSIVELY
3. Update todo list → mark "현재 진행 중인 작업" section
4. Execute documentation → choose doc type, write patterns
5. Verification (MANDATORY) → test examples, check links, verify API
6. Mark complete → only check box after ALL criteria met
7. Generate report → TASK COMPLETION REPORT with structured output
```

**Critical rules embedded:**
- `[ ]` → `[x]` ONLY after successful verification (line 119)
- "Task is INCOMPLETE until documentation is verified. Period." (line 57)
- Maximum parallelism for read-only operations (line 178)
- Use Explore agent aggressively for broad searches (line 179)

### Documentation Patterns (lines 88-109)
```typescript
// Different doc types → different structures, tones, focus areas

#### README Files
- Structure: Title, Description, Installation, Usage, API Reference, Contributing, License
- Tone: Welcoming but professional
- Focus: Getting users started quickly

#### API Documentation
- Structure: Endpoint, Method, Parameters, Request/Response examples, Error codes
- Tone: Technical, precise, comprehensive
- Focus: Every detail for integration

#### Architecture Documentation  
- Structure: Overview, Components, Data Flow, Dependencies, Design Decisions
- Tone: Educational, explanatory
- Focus: Why things are built this way

#### User Guides
- Structure: Introduction, Prerequisites, Step-by-step tutorials, Troubleshooting
- Tone: Friendly, supportive
- Focus: Guiding users to success
```

**Implementation notes:** Each type is a distinct pattern—agent selects based on task description.

### Quality Checklist (lines 147-167)
```typescript
// 4-axis quality gate
CLARITY: Can new developer understand? Terms explained? Logical structure?
COMPLETENESS: All features? All parameters? All error cases?
ACCURACY: Code examples tested? API verified? Versions current?
CONSISTENCY: Terminology consistent? Formatting? Style matches existing?
```

**All 4 must pass before marking task complete.**

### Verification Mandate (lines 46-57)
```typescript
### 4. VERIFICATION-DRIVEN DOCUMENTATION
- ALWAYS verify code examples: Every snippet must be tested and working
- Search for existing docs: Find and update affected docs
- Write accurate examples: Genuinely demonstrate functionality
- Test all commands: Run every command documented
- Handle edge cases: Document not just happy paths, but errors
- Never skip verification: If untestable, explicitly state limitation
- Fix the docs, not the reality: Update docs to match code

// ENFORCEMENT GATE:
**The task is INCOMPLETE until documentation is verified. Period.**
```

**Core pattern:** Verification is not optional—it's a blocking gate.

## Implementation Details

### Event Lifecycle

1. **Invoked by OmO** when documentation task in ai-todo plan
2. **Reads todo list** (input file path in execution_context)
3. **Enters execution loop** (7 steps)
4. **Mark in_progress** (updates todo file before starting work)
5. **Exploration phase** (uses Explore agent in parallel for codebase searches)
6. **Writing phase** (creates documentation per doc type patterns)
7. **Verification phase** (tests, checks links, validates examples)
8. **Mark complete** (checkbox + completion report)

### State Tracking

**Todo List Integration:**
- Reads ai-todo file structure
- Updates "현재 진행 중인 작업" section
- Changes `[ ]` → `[x]` on completion
- Generates TASK COMPLETION REPORT

**Exploration State:**
- Uses maximum parallelism (multiple tool calls in single message)
- Launches Explore agent for broad codebase searches
- Maintains context across exploration and writing phases

### API/Tool Usage

**Tools NOT available (disabled):**
- `background_task: false` → Sequential execution only
- No background parallelization of writing tasks

**Implied tools (from role/workflow):**
- Read file system (to access codebase, test examples)
- Run commands (to verify code examples and commands)
- Link verification (to check documentation links)
- File editing (to update todo lists, create documentation files)

**External agent usage:**
- **Explore agent** (invoked via `Task` tool with `subagent_type=Explore`)
  - Used aggressively for broad codebase searches
  - Finds code to document, patterns to explain
  - Fires multiple in parallel in single message

### Configuration Points

```typescript
{
  description: string,  // How agent describes itself to orchestrator
  mode: "subagent",     // Fixed; always subagent, not primary
  model: "google/gemini-3-pro-preview",  // Can be overridden in config
  tools: {
    background_task: false  // MUST remain false (sequential docs only)
  },
  prompt: string  // 7-section system prompt with role/workflow/guide
}
```

**Why Gemini?** Better at prose/technical writing than coding-focused models (lines 5-7).

## Key Patterns

### Pattern 1: Code of Conduct as Execution Guard
The 5 principles (Diligence, Learning, Precision, Verification, Transparency) function as execution guards—not just aspirational statements. Each has concrete behavioral rules:
- **Diligence** → Blocks incomplete work from being marked done
- **Verification** → Gate for task completion; forces iteration
- **Transparency** → Requires announcing each step, explaining reasoning

**Reusable in:** Any agent doing quality-sensitive work (testing, architecture review, security audit)

### Pattern 2: Verification-Driven Workflow
Task is fundamentally incomplete until verification passes. Not "nice to have" but blocking:
```
Write → Verify → If fails: Iterate → Re-verify → Mark complete
```

This inverts typical AI behavior (quick completion) to prioritize accuracy.

**Reusable in:** Any documentation/writing agent, testing agents, quality assurance agents

### Pattern 3: Maximum Parallelism for Exploration
Uses Explore agent aggressively in parallel:
```
// Same message: multiple searches fire together
- Read todo list + find referenced file
- Glob for related docs
- Grep for patterns to document
- Launch Explore agent for broad searches
```

**Reusable in:** Any agent doing exploratory work before execution

### Pattern 4: Multiple Doc Type Routing
Single agent handles 4 distinct documentation types by routing to different patterns:
```
if (task.type === "README") → Structure, tone, focus for README
else if (task.type === "API") → Structure, tone, focus for API docs
...etc
```

**Reusable in:** Multi-domain agents (testing agent supporting multiple test types, builder agent supporting multiple build strategies)

### Pattern 5: Todo List as Execution Log
Uses todo list as external state machine:
- Reads current state from file
- Marks in_progress before work
- Marks complete after verification
- Generates structured completion report

**Reusable in:** Any long-running agent task that needs user visibility

### Anti-Pattern: No Background Task Parallelization
```typescript
tools: { background_task: false }  // Sequential only
```

Documentation writing doesn't parallelize well—each doc builds on previous exploration. Sequential execution is intentional.

**Avoid:** Using background_task in writing agents; use explicit sequential steps instead.

## Adaptation Strategy

### What to Keep

1. **Code of Conduct framework** — 5 principles provide robust execution guard
2. **Verification-driven approach** — Forces accuracy before completion
3. **Dual identity** (engineer + writer) — Explains why this agent can explore codebases AND write clearly
4. **Todo list integration** — External state machine for long-running tasks
5. **Doc type routing** — Clean separation of different documentation patterns

### What to Simplify

1. **Multiple doc types** → Start with README-only; add types incrementally
2. **Korean todos** ("현재 진행 중인 작업") → Adapt to your language/convention
3. **Exploration phase** → If codebase is small, skip aggressive Explore usage
4. **Completion report format** → Simplify if don't need structured output

### Configuration

```typescript
{
  // Core: what this agent does
  description: "Technical writer. Handles [specific doc types]. Must BE USED when [specific trigger].",
  mode: "subagent",
  model: "anthropic/claude-3.5-sonnet",  // Tune per your preference
  
  // Enforcement: verification-driven approach
  prompt: `<role>TECHNICAL WRITER identity...</role>
<workflow>
1. Read [your todo format] 
2. Extract exact task
3. Update [your state tracking]
4. Execute documentation [your types]
5. Verify [your verification criteria]
6. Mark complete [your completion format]
7. Report [your report format]
</workflow>
<guide>Quality checklist: [your axes]</guide>`
}
```

### Implementation Checklist

- [ ] Copy agent definition structure (AgentConfig with description/mode/model/tools/prompt)
- [ ] Adapt role to your domain (technical writer → architect? code reviewer? tester?)
- [ ] Adapt workflow to your task type (7-step loop for your specific execution pattern)
- [ ] Define doc types (README/API/Architecture/etc → adapt to your doc taxonomy)
- [ ] Create quality checklist (4-axis framework → adapt to your quality dimensions)
- [ ] Integrate todo list parsing (read format, update format, report format)
- [ ] Implement verification gate (critical blocking rule for task completion)
- [ ] Test with sample task from todo list (verify todo parsing, state updates work)
- [ ] Verify code examples actually execute (spot-check before going live)
- [ ] Document project-specific conventions in this expert's wiki/notes

---

# Log

- 2025-12-16: Created comprehensive implementation guide for Document Writer agent
- Key findings: Verification-driven workflow is core pattern; todo list integration enables user visibility; Code of Conduct serves as execution guard; Explore agent used aggressively for exploration phase
