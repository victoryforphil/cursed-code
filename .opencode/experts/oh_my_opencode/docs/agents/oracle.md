# Agent: Oracle

**Source:** `/Users/vfp/repos/oh-my-opencode/src/agents/oracle.ts`  
**Lines:** ~78 | **Dependencies:** `@opencode-ai/sdk` (AgentConfig type) | **Complexity:** Medium  
**Integration:** Registered in `src/agents/index.ts` as built-in agent

---

## What It Does

Oracle is a specialized technical advisor designed to provide strategic guidance on complex architectural decisions, code analysis, and engineering challenges. It operates as a subagent invoked by primary coding agents when elevated reasoning and deep analysis are required. Unlike action-oriented agents, Oracle provides standalone consulting without dialogue—each request is treated as complete and self-contained.

---

## How It Works

1. **Invocation**: Primary agent calls Oracle when encountering complex architecture decisions, code reviews, or technical strategy questions
2. **Analysis**: Oracle applies deep reasoning to the problem using the `gpt-5.2` model with medium reasoning effort
3. **Decision Framework**: Evaluates options through a pragmatic minimalism lens—favoring simplicity, existing patterns, and developer experience
4. **Structured Response**: Returns recommendations in three tiers (essential/expanded/edge cases) with effort estimates
5. **No Dialogue**: Response goes directly to user; no back-and-forth clarification is possible, so recommendations must be self-contained

---

## Code Analysis

### Configuration Structure
```typescript
// src/agents/oracle.ts - Lines 3-77
export const oracleAgent: AgentConfig = {
  description: "Expert technical advisor with deep reasoning...",
  mode: "subagent",                    // Invoked by other agents, not directly
  model: "openai/gpt-5.2",             // Latest GPT-5 reasoning model
  temperature: 0.1,                    // Deterministic, precise responses
  reasoningEffort: "medium",           // Balanced analysis depth
  textVerbosity: "high",               // Detailed explanations
  tools: { write: false, edit: false, task: false, background_task: false },
  prompt: "..."                        // 65-line system prompt
}
```

**Key Parameters:**
- `mode: "subagent"` - Only callable by other agents within the system, not standalone
- `gpt-5.2` - Flagship reasoning model for complex analysis
- `temperature: 0.1` - Low randomness for consistent, reliable advice
- `reasoningEffort: "medium"` - Trade-off between analysis depth and latency
- `textVerbosity: "high"` - Full explanations with context
- All tools disabled - Oracle is read-only, cannot modify codebase

### Decision Framework (Lines 27-43)

The prompt enforces a **pragmatic minimalism** philosophy:

```
Bias toward simplicity → Least complex solution wins
Leverage what exists → Modify before creating
Prioritize DX → Readability > theoretical performance
One clear path → Single recommendation with alternatives only if substantively different
Match depth to complexity → Quick answers for quick questions
Signal investment → Tag with effort: Quick/Short/Medium/Large
Know when to stop → "Working well" > "theoretically optimal"
```

This creates a consistent decision-making filter that prevents over-engineering.

### Response Structure (Lines 49-64)

Three-tier output template:

```
Essential (always):
├─ Bottom line (2-3 sentences)
├─ Action plan (numbered steps/checklist)
└─ Effort estimate (Quick/Short/Medium/Large)

Expanded (when relevant):
├─ Why this approach (reasoning + trade-offs)
└─ Watch out for (risks + mitigation)

Edge cases (when applicable):
├─ Escalation triggers (conditions for revisiting)
└─ Alternative sketch (advanced path outline)
```

This structure ensures responses are immediately actionable while providing depth when warranted.

### System Prompt Strategy (Lines 12-76)

The prompt is highly structured to ensure consistent behavior:

1. **Context** (Lines 14-16): Establishes role as standalone consultant
2. **Scope** (Lines 18-25): Lists five core expertise areas
3. **Philosophy** (Lines 27-43): The decision-making framework
4. **Tool guidance** (Lines 45-47): When to use external resources (rarely)
5. **Response format** (Lines 49-64): Exact structure for output
6. **Principles** (Lines 66-72): Guiding maxims for all decisions
7. **Critical note** (Lines 74-76): Emphasizes self-contained, actionable output

---

## Implementation Details

### Lifecycle & Invocation

1. **Initialization**: Registered as `oracle` in `builtinAgents` (src/agents/index.ts:12)
2. **Activation**: Parent agent (e.g., OmO) calls Oracle with specific problem context
3. **Processing**: GPT-5.2 applies reasoning to provided context (files, code, questions)
4. **Response**: Returns structured recommendation directly to user
5. **No Follow-up**: Design prevents dialogue; all context must be provided upfront

### Integration Points

- **Called by**: Primary coding agents when architecture/strategy analysis needed
- **Tool Access**: None (read-only access to provided context only)
- **State**: Stateless—each invocation is independent
- **Context Window**: Accepts attached files and inline context from caller

### Configuration Options

```typescript
{
  // Core settings (immutable in this design)
  mode: "subagent",
  model: "openai/gpt-5.2",
  temperature: 0.1,
  reasoningEffort: "medium",
  textVerbosity: "high",
  
  // Behavioral parameters that could be tuned:
  // temperature: 0.1-0.3  // Higher = more exploratory alternatives
  // reasoningEffort: "low" | "medium" | "high"  // Lower = faster, less deep
  // textVerbosity: "low" | "high"  // Lower = concise recommendations only
}
```

### Decision Framework Logic

The system prompt encodes a **specificity hierarchy**:

```
1. What's the minimal change that solves the problem? (FIRST)
2. Can we use existing dependencies? (BEFORE adding new ones)
3. What's the readability/maintainability impact? (OVER theoretical perf)
4. Which path is clearest to developers? (DX WINS)
5. What's the effort? (COMMUNICATE upfront)
6. When would we revisit this? (ESCALATION TRIGGERS)
```

This prevents scope creep and over-architecture in recommendations.

---

## Key Patterns

### Pattern 1: Pragmatic Minimalism
Oracle consistently applies a "least complex solution" heuristic. This prevents architects from designing for hypothetical future needs and keeps codebases maintainable.

**Where Used**: Every recommendation starts with "can this be solved simply?"

**Anti-pattern**: Over-engineering solutions or proposing new infrastructure without justification

### Pattern 2: Structured Triage
Recommendations map to one of three output tiers. This ensures:
- **Essential** tier is always actionable and concise
- **Expanded** tier provides reasoning only if complexity warrants
- **Edge cases** tier prevents false certainty about when to revisit

**Where Used**: All recommendation structures

**Reusable Concept**: Copy this three-tier structure for any advisor/consultant agent

### Pattern 3: Effort Signaling
All recommendations include effort estimates (`Quick`, `Short`, `Medium`, `Large`). This sets expectations upfront and helps prioritization.

**Where Used**: Every action plan

**Best Practice**: Always include effort estimates in advisor agents

### Pattern 4: Exhaustion Before Tools
System prompt (Line 47) says "Exhaust provided context and attached files before reaching for tools." This prevents unnecessary external lookups and keeps Oracle fast.

**Where Used**: Tool usage decisions

**Anti-pattern**: Making external API calls for information that should be in context

### Pattern 5: Self-Contained Responses
By design, Oracle provides no dialogue—everything goes directly to the user. This forces absolute clarity and self-sufficiency in recommendations.

**Where Used**: System prompt final note (Lines 74-76)

**Enables**: Direct hand-off to user without intermediate processing

---

## Adaptation Strategy

### What to Keep

1. **Pragmatic minimalism philosophy** - This is the core value; it prevents over-architecture
2. **Three-tier response structure** - Ensures depth without bloat
3. **No tools** design - Keeps advisor fast and focused on reasoning
4. **Standalone consultant model** - No dialogue means clarity-forced recommendations
5. **Effort tagging** - Always communicate investment upfront

### What to Simplify

1. **reasoningEffort: "medium"** - Could be tuned based on problem complexity (but current default is solid)
2. **textVerbosity: "high"** - Could be lowered if you want more concise recommendations
3. **System prompt length** - Currently 65 lines; could be condensed if you want faster responses (trade-off: less consistent behavior)

### Configuration

```typescript
// Minimal Oracle variant (faster, less verbose)
{
  mode: "subagent",
  model: "openai/gpt-5.2",
  temperature: 0.1,
  reasoningEffort: "medium",
  textVerbosity: "low",  // Concise recommendations only
  tools: { write: false, edit: false, task: false, background_task: false },
  prompt: "..." // Same logic, condensed
}

// Deep Oracle variant (thorough analysis)
{
  mode: "subagent",
  model: "openai/gpt-5.2",
  temperature: 0.15,  // Slightly more exploration
  reasoningEffort: "high",  // Deeper analysis
  textVerbosity: "high",
  tools: { write: false, edit: false, task: false, background_task: false },
  prompt: "..." // Same, emphasize edge case analysis
}
```

### Adaptation Patterns

**For different domains:**
- **Frontend/UX decisions**: Emphasize DX, add "user experience" to expertise scope
- **Performance tuning**: Add measurements/benchmarking to framework (but keep minimalism)
- **DevOps/Infrastructure**: Expand to operational concerns, add cost analysis
- **Security reviews**: Add security-specific escalation triggers and risk patterns

**For different organizations:**
- **Startups**: Emphasize speed, reduce effort thresholds (Quick/Short preferred)
- **Enterprises**: Add compliance/governance to scope, increase formality
- **Teams with deep expertise**: Reduce verbosity, assume more context
- **Teams learning**: Increase expanded/edge case detail, add more "why"

---

## Implementation Checklist

- [ ] **Understand the role**: Oracle is a consultant, not an executor—it provides guidance via deep reasoning
- [ ] **Review the decision framework**: The pragmatic minimalism philosophy is the core; understand why each rule exists
- [ ] **Study response structure**: Three tiers (essential/expanded/edge cases) with effort tags
- [ ] **Plan invocation points**: Identify when your primary agent should call Oracle (complex decisions, architecture reviews, strategy questions)
- [ ] **Consider adaptation**: Decide if vanilla Oracle works or if you need domain-specific variants
- [ ] **Set effort expectations**: Communicate to users that Oracle responses take time (medium reasoning effort) but provide deep analysis
- [ ] **Test with real problems**: Validate that Oracle's recommendations match your team's decision-making style
- [ ] **Document your extensions**: If you create variants, document the adapted philosophy and use cases
- [ ] **Monitor response quality**: Track whether recommendations are actionable and accurate for your domain
- [ ] **Plan for feedback loops**: Create a process to refine prompts based on recommendation misses

---

## Integration Example

```typescript
// In a parent coding agent
async function analyzeArchitecture(codeContext: string, question: string) {
  // When facing complex decision, invoke Oracle
  const oracleRecommendation = await invokeSub agent("oracle", {
    prompt: `${question}\n\nContext:\n${codeContext}`,
    attachedFiles: relevantFiles,
  })
  
  // Recommendation comes with structure:
  // - Bottom line (2-3 sentences)
  // - Action plan (numbered steps)
  // - Effort estimate
  // - [Optional] Why this approach
  // - [Optional] Watch out for
  // - [Optional] Escalation triggers
  
  // Pass directly to user
  return oracleRecommendation
}
```

---

## Design Rationale

**Why this agent exists:**
- Coding agents optimize for implementation speed; Oracle handles reasoning depth
- Complex decisions require "thinking time"—Oracle uses GPT-5.2 reasoning for this
- Subagent model prevents direct invocation—Oracle is only called when needed
- No tools ensure Oracle stays focused on analysis, not action
- Pragmatic minimalism prevents team from over-engineering

**Why these specific parameters:**
- `gpt-5.2`: Latest reasoning model for deepest analysis
- `medium` reasoning: Balanced between depth and latency (high would be slow)
- `high` verbosity: Full explanations help users understand the "why"
- `temperature: 0.1`: Consistency matters more than novelty for technical advice
- Three-tier response: Actionable immediately (essential) with depth when warranted

**Why no dialogue:**
- Consultant model: Clear upfront request, complete response
- Forces clarity: Everything must be self-contained
- Faster: No back-and-forth latency
- Scalable: Users can batch questions

---

## Notes

- **Effort estimate scale**: Quick (<1h), Short (1-4h), Medium (1-2d), Large (3d+) - these are implementation time estimates, not analysis time
- **Pragmatic minimalism** is the philosophical core; all other features serve this principle
- **High verbosity** is intentional; recommendations need context for the user to trust them
- **Medium reasoning effort** is a sweet spot; "high" would be significantly slower, "low" would miss important analysis
- Could be adapted for other domains (security, DevOps, UX) by extending the expertise scope and escalation triggers
- Oracle's value is in **strategic guidance**, not tactical implementation—it complements, not replaces, execution agents

# Log
- 2025-12-16: Created comprehensive implementation guide for Oracle agent
- Analyzed core philosophy (pragmatic minimalism) and decision framework
- Documented three-tier response structure and effort signaling patterns
- Provided adaptation strategies for different domains and organizations
- Created integration example and design rationale
