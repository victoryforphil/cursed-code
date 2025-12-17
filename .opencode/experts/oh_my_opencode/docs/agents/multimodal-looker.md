# Feature: Multimodal Looker Agent

**Source:** `src/agents/multimodal-looker.ts`  
**Lines:** ~43 | **Dependencies:** `@opencode-ai/sdk` | **Complexity:** Low

---

## What It Does

Analyzes media files (PDFs, images, diagrams) that cannot be interpreted as plain text, extracting specific information or summaries from visual/document content. Designed as a subagent that processes files in a separate context window, saving tokens in the main conversation while providing accurate visual interpretation.

---

## How It Works

1. **Invocation** - Main agent (OmO) or tools call this subagent with a file path and extraction goal
2. **Context Separation** - Runs in isolated session with Gemini 2.5 Flash (not main LLM)
3. **File Reading** - Uses Read tool to access file, interprets visual/document structure
4. **Extraction** - Analyzes content deeply, extracts ONLY what was explicitly requested
5. **Response** - Returns structured data directly to caller (no preamble, no raw file dump)
6. **Token Optimization** - Caller receives analyzed result, not raw file content (context savings)

---

## Code Analysis

### Agent Definition
```typescript
// src/agents/multimodal-looker.ts:3-42
export const multimodalLookerAgent: AgentConfig = {
  description: "Analyze media files (PDFs, images, diagrams)...",
  mode: "subagent",  // Runs as isolated specialist, not in main session
  model: "google/gemini-2.5-flash",  // Fast multimodal model
  temperature: 0.1,  // Deterministic extraction (low creativity)
  tools: { 
    write: false,    // No file creation (read-only analysis)
    edit: false,     // No modification
    bash: false,     // No command execution
    background_task: false  // Synchronous only
  },
  // Prompt defines extraction contract...
}
```

**Key design**: Tool restrictions (write/edit/bash disabled) enforce read-only analysis role. Temperature 0.1 ensures consistent extraction without hallucination.

### Prompt Structure
```typescript
// src/agents/multimodal-looker.ts:10-41
prompt: `You interpret media files that cannot be read as plain text.

Your job: examine the attached file and extract ONLY what was requested.

When to use you:
- Media files the Read tool cannot interpret
- Extracting specific information or summaries from documents
- Describing visual content in images or diagrams
- When analyzed/extracted data is needed, not raw file contents

When NOT to use you:
- Source code or plain text files (use Read directly)
- Files that need editing afterward (need literal content)
- Simple file reading where no interpretation is needed

How you work:
1. Receive file path and extraction goal
2. Read and analyze the file deeply
3. Return ONLY relevant extracted information
4. Main agent never processes raw file - saves context tokens

Response rules:
- Return extracted information directly, no preamble
- If info not found, state clearly what's missing
- Match language of request
- Be thorough on goal, concise on everything else
`
```

**Pattern**: Clear boundaries on when/when-not-to-use prevent misuse (e.g., source code extraction should use Read tool). Response format contracts (no preamble) optimize for token efficiency.

---

## Integration Points

### 1. **Look-At Tool** (Primary Integration)
```typescript
// src/tools/look-at/tools.ts:45-52
const createResult = await ctx.client.session.create({
  parentID: toolContext.sessionID,  // Links to main session
  title: `look_at: ${args.goal.substring(0, 50)}`,
})

await ctx.client.session.prompt({
  path: { id: sessionID },
  agent: MULTIMODAL_LOOKER_AGENT,  // Explicitly targets this agent
  tools: {
    task: false,
    call_omo_agent: false,
    look_at: false,  // Prevent recursive tool calls
  },
  parts: [{ type: "text", text: prompt }],
})
```

**Flow**: Look-at tool creates child session, sends prompt with file path + goal, waits for response. Disables nested tool calls to prevent loops.

### 2. **Configuration System**
```typescript
// src/config/schema.ts:26, 39
// Registered as builtin agent
export const BuiltinAgentNameSchema = z.enum([
  "OmO", "oracle", "librarian", "explore",
  "frontend-ui-ux-engineer", "document-writer",
  "multimodal-looker",  // Available for override/config
])

// src/index.ts:358-360
if (config.agent["multimodal-looker"]) {
  config.agent["multimodal-looker"].tools = {
    ...config.agent["multimodal-looker"].tools,
    // Tool permissions can be overridden per config
  }
}
```

**Pattern**: Registered in schema for config overrides. Allows users to customize model, temperature, or tool permissions per their needs.

### 3. **Usage from OmO Main Agent**
```typescript
// Conceptual usage (how main agent would invoke)
// When user asks to analyze a PDF/image:

// OmO detects media file analysis need
→ Delegates to multimodal-looker via look-at tool
→ Provides file path + specific extraction goal
→ Receives analyzed data back
→ Continues work with extracted information (not raw bytes)
```

**Benefit**: Main agent avoids loading large media files into its context, maintains focus on orchestration.

---

## Implementation Details

### Event Handlers & Lifecycle
- **Invocation**: Triggered via `look-at` tool or direct session.prompt() with agent specified
- **Initialization**: Each call creates isolated session (separate context window)
- **Cleanup**: Session automatically cleaned up after response (no manual teardown needed)
- **No Background Tasks**: Synchronous only—blocks until response received

### API Usage
```typescript
// API Contract
Input Parameters:
- file_path: string  // Absolute path to media file
- goal: string       // What to extract/analyze

Output:
- text: string       // Extracted information formatted per request
- format: determined by goal phrasing (structured/natural language)

Errors:
- File not readable → "Error: Failed to read file..."
- Analysis failed → Session error handling
- No matching info → Agent states: "Information not found: [what was expected]"
```

### State & Context Optimization
- **Context Window**: Isolated from main session (no contamination)
- **Model Context**: Uses Gemini 2.5 Flash (500K token window)
- **Token Savings**: Caller receives X bytes of extracted data instead of Y bytes of raw media
- **No State Persistence**: Each call is fresh (no cross-session memory)

### Dependencies
- `@opencode-ai/sdk`: AgentConfig type
- `google/gemini-2.5-flash`: Multimodal LLM (Google API required)
- OpenCode session management: Child session creation/messaging
- Read tool: Must be available in subagent to load files

---

## Key Patterns

### 1. **Specialist Subagent Pattern**
```
Main Agent (OmO)
    ↓
Specific Task (media analysis)
    ↓
Isolated Subagent (multimodal-looker)
    ├─ Own context window
    ├─ Own model (Gemini, not main LLM)
    ├─ Own tool permissions
    └─ Synchronous response back

Benefit: Task isolation, token efficiency, clear responsibility separation
```

### 2. **Response Normalization**
Agent enforces: "Return extracted information directly, no preamble"

This means:
```
❌ Bad: "Looking at this PDF, I found the following information: ..."
✅ Good: "[Extracted data directly formatted for use]"
```

Caller expects data they can immediately use, not explanatory text.

### 3. **Scope Bounding**
Response rules include:
- "Be thorough on the goal, concise on everything else"
- "If info not found, state clearly what's missing"

Prevents:
- Over-extraction (extracting everything, not just requested)
- Hallucination (making up info when file doesn't contain it)
- Context bloat (verbose explanations)

### 4. **Tool Restriction Pattern**
Disabled tools:
```
write: false        // Cannot create files (analyzer only)
edit: false         // Cannot modify (immutable analysis)
bash: false         // Cannot execute commands
background_task: false  // No async work (must complete in session)
```

Enforces: This agent is a pure analyzer/transformer, not an action-taker.

---

## Anti-Patterns to Avoid

### Problem: Recursive Tool Calls
```typescript
// ❌ Don't: Allow look-at tool inside multimodal-looker
// This creates: look-at → multimodal-looker → look-at → ...

// ✅ Do: Disable look-at when invoking multimodal-looker
tools: {
  look_at: false,  // Prevents recursion
  task: false,     // Prevent task delegation
  call_omo_agent: false,  // Prevent re-invoking OmO
}
```

### Problem: Using for Text Files
```typescript
// ❌ Don't: Use multimodal-looker for .txt, .json, .ts files
const goal = "Extract all function names from source.ts"
// → Should use Read tool directly + simple parsing

// ✅ Do: Reserve for actual media (PDFs, images, diagrams)
const goal = "Extract table data from financial-report.pdf"
const goal = "Describe the architecture shown in system-diagram.png"
```

### Problem: Ignoring Temperature
```typescript
// ❌ Don't: Change temperature to 0.7 for extraction
// Higher temperature = more creative/hallucinated responses
// Defeats purpose of extraction accuracy

// ✅ Keep: temperature: 0.1 for deterministic extraction
```

### Problem: Expecting Write Access
```typescript
// ❌ Don't: Ask agent to "Extract data and save to CSV"
// write: false prevents file creation

// ✅ Do: Extract data, return to caller
// Caller or another agent with write access handles storage
```

---

## Adaptation Strategy

### What to Keep
- **Subagent isolation pattern** - Separates concerns, optimizes context
- **Response format contract** - Direct data return (no preamble) - reusable for any extractor
- **Tool restrictions** - Enforces role clarity (read-only analyst)
- **Temperature setting** - Deterministic extraction pattern applicable to any LLM
- **Goal-based prompting** - Explicitly request what to extract, nothing more

### What to Simplify
- **Model choice**: Gemini 2.5 Flash is fast + multimodal, but could use Claude if Google APIs unavailable
- **Session nesting**: Could be flattened if performance becomes issue (though isolation is valuable)
- **Tool set**: Could enable task if complex extraction needs sub-research

### Configuration
```typescript
{
  // Enable for media file analysis
  enabled: true,
  
  // Model: Multimodal-capable, fast inference
  model: "google/gemini-2.5-flash",  // or claude-opus for richer reasoning
  
  // Temperature: Low for consistency
  temperature: 0.1,
  
  // Context optimization
  max_tokens: 2000,  // Extraction typically doesn't need huge output
  
  // Tool access: Read-only
  tools: {
    write: false,
    edit: false,
    bash: false,
    background_task: false,
    read: true,  // Required to load files
  },
  
  // Response contract
  response_format: "extracted_data_only",  // No preamble/explanation
}
```

---

## Implementation Checklist

- [ ] **Understand subagent pattern** - Isolated session, separate context, synchronous response
- [ ] **Register in schema** - Add to BuiltinAgentNameSchema if creating similar agent
- [ ] **Define tool permissions** - Disable write/edit/bash to enforce read-only role
- [ ] **Implement response contract** - Train/prompt for direct data return (no preamble)
- [ ] **Create invocation tool** - Like look-at: accepts file_path + goal, creates session
- [ ] **Handle errors gracefully** - Distinguish "file not readable" from "info not found"
- [ ] **Test with various media** - PDFs, images, diagrams; verify extraction accuracy
- [ ] **Measure token savings** - Compare raw file bytes vs extracted response bytes
- [ ] **Document boundaries** - When to use (media) vs when NOT to use (plain text)
- [ ] **Configure permissions** - Allow in opencode.json config for user customization

---

# Log
- 2025-12-16: Created comprehensive implementation guide for Multimodal Looker agent
- Analysis includes: pattern library, integration flows, adaptation strategy, configuration guide
