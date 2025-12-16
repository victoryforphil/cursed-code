# Feature: Predefined Agents

## Overview
oh-my-opencode ships with 7 specialized agents, each with custom prompts, model configurations, and tool restrictions. These agents demonstrate how to structure domain-specific AI agents for different engineering tasks.

## Agent Architecture

### Agent Config Structure
```typescript
interface AgentConfig {
  description: string          // Shown in agent picker UI
  mode: "primary" | "subagent" // Primary = can use Task tool, Subagent = called via Task
  model: string                // Model ID (e.g., "anthropic/claude-opus-4-5")
  temperature?: number         // 0-1, defaults vary by model
  thinking?: {                 // Extended thinking config (Claude)
    type: "enabled"
    budgetTokens: number
  }
  reasoningEffort?: "low" | "medium" | "high"  // GPT o-series
  textVerbosity?: "low" | "medium" | "high"    // GPT o-series
  maxTokens?: number           // Max output tokens
  tools?: {                    // Tool restrictions
    [toolName: string]: boolean
  }
  prompt: string               // System prompt
  color?: string               // UI color for agent
}
```

## The 7 Built-in Agents

### 1. OmO (Orchestrator)
**Model:** Claude Opus 4.5  
**Mode:** Primary  
**Thinking:** 32k token budget  
**Max Tokens:** 64k  

**Role:** The main orchestrator agent that handles user requests, delegates to specialists, and manages complex workflows.

#### Key Capabilities
- **Intent classification** - Trivial, explicit, exploratory, open-ended, ambiguous
- **Codebase assessment** - Disciplined, transitional, legacy/chaotic, greenfield
- **Strategic delegation** - Routes work to specialized agents
- **Parallel execution** - Fires background tasks liberally
- **Todo management** - Plans obsessively, tracks progress
- **Verification** - Runs diagnostics, builds, tests before marking complete

#### Prompt Structure
The prompt is organized in phases:

**Phase 0 - Intent Gate:**
- Classify request type (trivial, explicit, exploratory, open-ended, ambiguous)
- Check for ambiguity
- Validate before acting
- Challenge user when design seems flawed

**Phase 1 - Codebase Assessment:**
- Quick assessment of code quality/consistency
- State classification (disciplined, transitional, chaotic, greenfield)
- Adapt behavior to match codebase maturity

**Phase 2A - Exploration & Research:**
- Tool selection matrix (free tools → cheap agents → expensive oracle)
- Explore agent = contextual grep (internal codebase)
- Librarian agent = reference grep (external docs/repos)
- Parallel execution by default

**Phase 2B - Implementation:**
- Pre-implementation todos
- **HARD BLOCK on frontend files** (.tsx/.jsx/.vue/.svelte/.css)
- Delegation table (UI → frontend-ui-ux-engineer, docs → document-writer, etc.)
- Mandatory 7-section delegation prompt structure
- Code change rules (match patterns, never suppress types, never commit unless asked)
- Verification requirements

**Phase 2C - Failure Recovery:**
- 3-strike rule: after 3 failures, STOP → REVERT → DOCUMENT → CONSULT Oracle
- Never shotgun debug

**Phase 3 - Completion:**
- Checklist: todos done, diagnostics clean, build passes, request fulfilled
- Cancel all background tasks before delivering

#### Tool Usage Philosophy
```
Direct tools (grep/glob/LSP) → FREE, always try first
explore agent                → CHEAP, use liberally for internal code
librarian agent              → CHEAP, use for external references
oracle agent                 → EXPENSIVE, use sparingly for complex decisions
```

#### Delegation Prompt Structure (Mandatory)
When delegating to another agent, must include all 7 sections:

```
1. TASK: Atomic, specific goal
2. EXPECTED OUTCOME: Concrete deliverables with success criteria
3. REQUIRED SKILLS: Which skill to invoke
4. REQUIRED TOOLS: Explicit tool whitelist
5. MUST DO: Exhaustive requirements
6. MUST NOT DO: Forbidden actions
7. CONTEXT: File paths, existing patterns, constraints
```

#### Key Prompt Snippets

**Frontend Gate (Hard Block):**
```
### GATE: Frontend Files (HARD BLOCK - zero tolerance)

| Extension | Action | No Exceptions |
|-----------|--------|---------------|
| `.tsx`, `.jsx` | DELEGATE | Even "just add className" |
| `.vue`, `.svelte` | DELEGATE | Even single prop change |
| `.css`, `.scss`, `.sass`, `.less` | DELEGATE | Even color/margin tweak |

YOU CANNOT: "Just quickly fix", "It's only one line", "Too simple to delegate"

ALL frontend = DELEGATE to `frontend-ui-ux-engineer`. Period.
```

**Ambiguity Handling:**
```
| Situation | Action |
|-----------|--------|
| Single valid interpretation | Proceed |
| Multiple interpretations, similar effort | Proceed with reasonable default, note assumption |
| Multiple interpretations, 2x+ effort difference | **MUST ask** |
| Missing critical info (file, error, context) | **MUST ask** |
| User's design seems flawed or suboptimal | **MUST raise concern** before implementing |
```

**When to Challenge User:**
```
If you observe:
- A design decision that will cause obvious problems
- An approach that contradicts established patterns in the codebase
- A request that seems to misunderstand how the existing code works

Then: Raise your concern concisely. Propose an alternative. Ask if they want to proceed anyway.

Example:
I notice [observation]. This might cause [problem] because [reason].
Alternative: [your suggestion].
Should I proceed with your original request, or try the alternative?
```

**Parallel Execution Default:**
```typescript
// CORRECT: Always background, always parallel
background_task(agent="explore", prompt="Find auth implementations in our codebase...")
background_task(agent="explore", prompt="Find error handling patterns here...")
background_task(agent="librarian", prompt="Find JWT best practices in official docs...")
background_task(agent="librarian", prompt="Find how production apps handle auth in Express...")
// Continue working immediately. Collect with background_output when needed.

// WRONG: Sequential or blocking
result = task(...)  // Never wait synchronously for explore/librarian
```

**Search Stop Conditions:**
```
STOP searching when:
- You have enough context to proceed confidently
- Same information appearing across multiple sources
- 2 search iterations yielded no new useful data
- Direct answer found

DO NOT over-explore. Time is precious.
```

**Communication Style:**
```
### Be Concise
- Answer directly without preamble
- Don't summarize what you did unless asked
- Don't explain your code unless asked
- One word answers are acceptable when appropriate

### No Flattery
Never start responses with:
- "Great question!"
- "That's a really good idea!"
- "Excellent choice!"

Just respond directly to the substance.
```

**Anti-Patterns (Blocking Violations):**
```
| Category | Forbidden |
|----------|-----------|
| **Type Safety** | `as any`, `@ts-ignore`, `@ts-expect-error` |
| **Error Handling** | Empty catch blocks `catch(e) {}` |
| **Testing** | Deleting failing tests to "pass" |
| **Search** | Firing 3+ agents when grep suffices |
| **Frontend** | ANY direct edit to frontend files |
| **Debugging** | Shotgun debugging, random changes |
```

---

### 2. Oracle (Strategic Advisor)
**Model:** GPT-5.2  
**Mode:** Subagent  
**Temperature:** 0.1  
**Reasoning Effort:** Medium  
**Text Verbosity:** High  
**Tools:** Read-only (no write/edit/task/background_task)

**Role:** Expert technical advisor for architecture decisions, code analysis, and complex problem-solving.

#### When OmO Consults Oracle
```
| Trigger | Action |
|---------|--------|
| Complex architecture design | Oracle FIRST, then implement |
| After completing significant work | Oracle review before marking complete |
| 2+ failed fix attempts | Oracle for debugging guidance |
| Unfamiliar code patterns | Oracle to explain behavior |
| Security/performance concerns | Oracle for analysis |
| Multi-system tradeoffs | Oracle for architectural decision |
```

#### Decision Framework
Oracle applies **pragmatic minimalism**:

**Bias toward simplicity:**
- Right solution = least complex that fulfills requirements
- Resist hypothetical future needs

**Leverage what exists:**
- Favor modifications over new components
- New libraries require explicit justification

**Prioritize developer experience:**
- Readability > theoretical performance
- Maintainability > architectural purity

**One clear path:**
- Single primary recommendation
- Alternatives only when substantially different

**Signal the investment:**
- Quick (<1h), Short (1-4h), Medium (1-2d), Large (3d+)

#### Response Structure
**Essential (always include):**
- **Bottom line**: 2-3 sentences with recommendation
- **Action plan**: Numbered steps/checklist
- **Effort estimate**: Quick/Short/Medium/Large

**Expanded (when relevant):**
- **Why this approach**: Brief reasoning and trade-offs
- **Watch out for**: Risks, edge cases, mitigation

**Edge cases (only when applicable):**
- **Escalation triggers**: When to use more complex solution
- **Alternative sketch**: High-level outline of advanced path

#### Key Prompt Snippets

**Core Philosophy:**
```
Apply pragmatic minimalism in all recommendations:

**Bias toward simplicity**: The right solution is typically the least complex one 
that fulfills the actual requirements. Resist hypothetical future needs.

**Leverage what exists**: Favor modifications to current code, established patterns, 
and existing dependencies over introducing new components. New libraries, services, 
or infrastructure require explicit justification.

**Prioritize developer experience**: Optimize for readability, maintainability, and 
reduced cognitive load. Theoretical performance gains or architectural purity matter 
less than practical usability.
```

**Guiding Principles:**
```
- Deliver actionable insight, not exhaustive analysis
- For code reviews: surface the critical issues, not every nitpick
- For planning: map the minimal path to the goal
- Support claims briefly; save deep exploration for when it's requested
- Dense and useful beats long and thorough
```

---

### 3. Librarian (External Reference Searcher)
**Model:** Claude Sonnet 4.5  
**Mode:** Subagent  
**Temperature:** 0.1  
**Tools:** Read-only (no write/edit/background_task)

**Role:** Search external documentation, OSS repos, and web resources for library usage patterns and best practices.

#### When OmO Uses Librarian
Fire immediately on these trigger phrases:
- "How do I use [library]?"
- "What's the best practice for [framework feature]?"
- "Why does [external dependency] behave this way?"
- "Find examples of [library] usage"
- Working with unfamiliar npm/pip/cargo packages

#### Request Classification
**TYPE A: CONCEPTUAL**
- Triggers: "How do I...", "What is...", "Best practice for..."
- Tools: context7 + websearch_exa + grep_app (parallel)

**TYPE B: IMPLEMENTATION**
- Triggers: "How does X implement Y?", "Show me source of Z"
- Tools: gh clone + read + blame

**TYPE C: CONTEXT & HISTORY**
- Triggers: "Why was this changed?", "History of X?"
- Tools: gh issues/prs + git log/blame

**TYPE D: COMPREHENSIVE**
- Triggers: Complex/ambiguous requests
- Tools: ALL tools in parallel

#### Tool Arsenal
```
| Purpose | Tool | Command/Usage |
|---------|------|---------------|
| **Official Docs** | context7 | context7_resolve-library-id → context7_get-library-docs |
| **Latest Info** | websearch_exa | websearch_exa_web_search_exa("query 2025") |
| **Fast Code Search** | grep_app | grep_app_searchGitHub(query, language, useRegexp) |
| **Deep Code Search** | gh CLI | gh search code "query" --repo owner/repo |
| **Clone Repo** | gh CLI | gh repo clone owner/repo ${TMPDIR:-/tmp}/name -- --depth 1 |
| **Issues/PRs** | gh CLI | gh search issues/prs "query" --repo owner/repo |
| **View Issue/PR** | gh CLI | gh issue/pr view <num> --repo owner/repo --comments |
| **Release Info** | gh CLI | gh api repos/owner/repo/releases/latest |
| **Git History** | git | git log, git blame, git show |
| **Read URL** | webfetch | webfetch(url) for blog posts, SO threads |
```

#### Mandatory Citation Format
Every claim MUST include a permalink:

```markdown
**Claim**: [What you're asserting]

**Evidence** ([source](https://github.com/owner/repo/blob/<sha>/path#L10-L20)):
```typescript
// The actual code
function example() { ... }
```

**Explanation**: This works because [specific reason from the code].
```

#### Permalink Construction
```
https://github.com/<owner>/<repo>/blob/<commit-sha>/<filepath>#L<start>-L<end>

Example:
https://github.com/tanstack/query/blob/abc123def/packages/react-query/src/useQuery.ts#L42-L50
```

**Getting SHA:**
- From clone: `git rev-parse HEAD`
- From API: `gh api repos/owner/repo/commits/HEAD --jq '.sha'`
- From tag: `gh api repos/owner/repo/git/refs/tags/v1.0.0 --jq '.object.sha'`

#### Parallel Execution Requirements
```
| Request Type | Minimum Parallel Calls |
|--------------|----------------------|
| TYPE A (Conceptual) | 3+ |
| TYPE B (Implementation) | 4+ |
| TYPE C (Context) | 4+ |
| TYPE D (Comprehensive) | 6+ |
```

#### Key Prompt Snippets

**Critical Date Awareness:**
```
**CURRENT YEAR CHECK**: Before ANY search, verify the current date from environment context.
- **NEVER search for 2024** - It is NOT 2024 anymore
- **ALWAYS use current year** (2025+) in search queries
- When searching: use "library-name topic 2025" NOT "2024"
- Filter out outdated 2024 results when they conflict with 2025 information
```

**Parallel Acceleration Pattern:**
```
Tool 1: gh repo clone owner/repo ${TMPDIR:-/tmp}/repo -- --depth 1
Tool 2: grep_app_searchGitHub(query: "function_name", repo: "owner/repo")
Tool 3: gh api repos/owner/repo/commits/HEAD --jq '.sha'
Tool 4: context7_get-library-docs(id, topic: "relevant-api")
```

**Communication Rules:**
```
1. **NO TOOL NAMES**: Say "I'll search the codebase" not "I'll use grep_app"
2. **NO PREAMBLE**: Answer directly, skip "I'll help you with..." 
3. **ALWAYS CITE**: Every code claim needs a permalink
4. **USE MARKDOWN**: Code blocks with language identifiers
5. **BE CONCISE**: Facts > opinions, evidence > speculation
```

---

### 4. Explore (Internal Code Searcher)
**Model:** Grok Code (opencode/grok-code)  
**Mode:** Subagent  
**Temperature:** 0.1  
**Tools:** Read-only (no write/edit/background_task)

**Role:** Contextual grep for the current codebase. Answers "Where is X?", "Which files have Y?", "Find the code that does Z".

#### When OmO Uses Explore
```
| Use Direct Tools | Use Explore Agent |
|------------------|-------------------|
| You know exactly what to search | Multiple search angles needed |
| Single keyword/pattern suffices | Unfamiliar module structure |
| Known file location | Cross-layer pattern discovery |
```

Fire liberally. Use as a **peer tool**, not a fallback. Launch multiple in parallel for broad searches.

#### Thoroughness Levels
Caller should specify:
- **"quick"** - Basic search, first matches
- **"medium"** - Moderate exploration, common patterns
- **"very thorough"** - Comprehensive analysis, edge cases

#### Required Output Format
Every response MUST include:

**1. Intent Analysis (in `<analysis>` tags):**
```
<analysis>
**Literal Request**: [What they literally asked]
**Actual Need**: [What they're really trying to accomplish]
**Success Looks Like**: [What result would let them proceed immediately]
</analysis>
```

**2. Parallel Execution:**
Launch **3+ tools simultaneously** in first action.

**3. Structured Results:**
```
<results>
<files>
- /absolute/path/to/file1.ts — [why this file is relevant]
- /absolute/path/to/file2.ts — [why this file is relevant]
</files>

<answer>
[Direct answer to their actual need, not just file list]
</answer>

<next_steps>
[What they should do with this information]
[Or: "Ready to proceed - no follow-up needed"]
</next_steps>
</results>
```

#### Success Criteria
```
| Criterion | Requirement |
|-----------|-------------|
| **Paths** | ALL paths must be **absolute** (start with /) |
| **Completeness** | Find ALL relevant matches, not just the first one |
| **Actionability** | Caller can proceed **without asking follow-up questions** |
| **Intent** | Address their **actual need**, not just literal request |
```

#### Tool Strategy
```
- **Semantic search** (definitions, references): LSP tools
- **Structural patterns** (function shapes, class structures): ast_grep_search  
- **Text patterns** (strings, comments, logs): grep
- **File patterns** (find by name/extension): glob
- **History/evolution** (when added, who changed): git commands
- **External examples** (how others implement): grep_app
```

#### grep_app Strategy
```
grep_app searches millions of public GitHub repos instantly.

**Critical**: grep_app results may be **outdated or from different library versions**. Always:
1. Start with grep_app for broad discovery
2. Launch multiple grep_app calls with query variations in parallel
3. **Cross-validate with local tools** (grep, ast_grep_search, LSP) before trusting results

Flood with parallel calls. Trust only cross-validated results.
```

---

### 5. Frontend UI/UX Engineer
**Model:** Claude Sonnet 4.5  
**Mode:** Subagent  
**Tools:** Full access to write/edit

**Role:** Specialist for all frontend work (.tsx/.jsx/.vue/.svelte/.css files).

**Trigger:** ANY file with frontend extensions or keywords (UI, UX, component, button, modal, animation, styling, responsive, layout).

OmO has a **HARD BLOCK** on frontend files - zero tolerance, no exceptions. Even "just add className" gets delegated.

*(Full prompt details not loaded, but pattern follows: frontend-specific best practices, accessibility, responsive design, component patterns)*

---

### 6. Document Writer
**Model:** Claude Sonnet 4.5  
**Mode:** Subagent  
**Tools:** Write/edit enabled

**Role:** Specialized for writing documentation (README, API docs, guides, wikis).

**Trigger:** Working with .md files, documentation requests, API reference generation.

*(Full prompt details not loaded, but pattern follows: documentation best practices, clarity, examples, structure)*

---

### 7. Multimodal Looker
**Model:** Claude Sonnet 4.5  
**Mode:** Subagent  
**Tools:** Screen capture, image analysis

**Role:** Visual analysis of UI, screenshots, diagrams, design mockups.

**Trigger:** Working with images, screenshots, visual debugging.

*(Full prompt details not loaded, but pattern follows: visual analysis, UI critique, design feedback)*

---

## Agent Configuration System

### Utils (createBuiltinAgents)
```typescript
export function createBuiltinAgents(
  overrides?: AgentOverrides
): Record<string, AgentConfig> {
  const agents = { ...builtinAgents }
  
  if (overrides) {
    for (const [name, override] of Object.entries(overrides)) {
      if (agents[name]) {
        agents[name] = { ...agents[name], ...override }
      }
    }
  }
  
  return agents
}
```

### Config Schema (Zod)
```typescript
export const AgentOverridesSchema = z.record(
  z.enum([
    "OmO",
    "oracle", 
    "librarian",
    "explore",
    "frontend-ui-ux-engineer",
    "document-writer",
    "multimodal-looker",
    "build"
  ]),
  z.object({
    model: z.string().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    // ... other AgentConfig fields
  })
)
```

### User Overrides
Users can override agent configs in `oh-my-opencode.json`:

```json
{
  "agents": {
    "oracle": {
      "model": "anthropic/claude-opus-4-5",
      "reasoningEffort": "high"
    },
    "explore": {
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.2
    }
  }
}
```

---

## Key Patterns for Cursed-Code

### 1. Structured System Prompts
Organize prompts in clear phases/sections:
- Use tables for decision matrices
- Include examples (good vs bad)
- Explicit success/failure criteria
- Anti-patterns section

### 2. Tool Restrictions
Subagents often have restricted toolsets:
```typescript
tools: { 
  write: false,          // Read-only agents
  edit: false,
  task: false,           // Prevent recursive agent calls
  background_task: false // Prevent parallel spawning
}
```

### 3. Model Selection Strategy
```
Primary orchestrator: Claude Opus (extended thinking)
Deep reasoning: GPT-5.2 (o-series reasoning)
Fast execution: Claude Sonnet, Grok Code
Multimodal: Claude with vision
```

### 4. Delegation Patterns
- **Hard blocks** (frontend = always delegate, no exceptions)
- **Soft delegation** (complex architecture = consult oracle after 2 failures)
- **Parallel delegation** (explore + librarian fired simultaneously)

### 5. Communication Style Enforcement
All agents enforce:
- No preamble
- No flattery
- Concise answers
- Direct responses
- Evidence-based claims (especially librarian)

---

## Extraction Value for Cursed-Code

**High Value:**
1. **Prompt engineering patterns** - Phase structure, decision matrices, anti-patterns
2. **Tool restriction patterns** - How to limit subagent capabilities
3. **Delegation taxonomy** - When to use which agent for what
4. **Parallel execution defaults** - Background tasks as fire-and-forget
5. **Evidence requirements** - Permalink citations, verification gates

**Adapt, Don't Copy:**
- Model choices (expensive GPT-5.2, Claude Opus 4.5)
- Opinionated hard blocks (frontend delegation)
- Specific workflows (3-strike failure recovery)

**Document in cursed-code:**
- Agent creation patterns → meta/wiki/opencode_agents.wiki.md
- Prompt engineering → prompt_pro expert
- Delegation strategies → swe_workflow expert

---

## Implementation Checklist

If creating similar agents for cursed-code:

- [ ] Define agent role and scope clearly
- [ ] Choose model based on task (reasoning vs speed vs cost)
- [ ] Structure prompt in clear phases/sections
- [ ] Include decision matrices and examples
- [ ] Define tool restrictions appropriate to role
- [ ] Specify communication style requirements
- [ ] Add success/failure criteria
- [ ] Document anti-patterns
- [ ] Test with real scenarios
- [ ] Allow user overrides via config

---

## Code Quality Notes

**Strengths:**
- Clear separation of concerns (each agent = specific domain)
- Well-structured system prompts with examples
- Smart tool restrictions prevent agent misuse
- Delegation patterns are well-thought-out

**Weaknesses:**
- No tests for agent behavior
- Opinionated model choices (expensive defaults)
- Some prompts are very long (OmO = 400 lines)
- Hard to override prompt structure (all-or-nothing)

**Overall:** Excellent reference for prompt engineering and agent design patterns. Extract the patterns, not the implementations.
