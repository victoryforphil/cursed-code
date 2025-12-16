# Feature: Todo Continuation Enforcer

## Overview
**Lines:** ~250 | **Dependencies:** hook-message-injector | **Complexity:** Low-Medium

Prevents agents from stopping with incomplete todos by monitoring session idle events and injecting continuation prompts.

## Problem It Solves
LLMs have a chronic habit of completing one task and then stopping, even when multiple todos remain. This feature ensures all tasks in the todo list are completed before the agent stops.

## How It Works

### 1. Event Monitoring
Listens to multiple session lifecycle events:
- `session.idle` - Agent finished responding
- `session.error` - Error occurred during execution
- `message.updated` - New message in session
- `session.deleted` - Session was deleted

### 2. Debouncing Strategy
Uses a 200ms debounce timer to prevent race conditions:

```typescript
const timer = setTimeout(async () => {
  pendingTimers.delete(sessionID)
  log(`[${HOOK_NAME}] Timer fired, checking conditions`, { sessionID })
  
  // Check conditions and inject continuation if needed
}, 200)

pendingTimers.set(sessionID, timer)
```

**Why 200ms?**
- Long enough to avoid racing with other hooks
- Short enough to feel instant to users
- Gives session time to settle into "idle" state

### 3. Bypass Logic
Skips continuation in these scenarios:

```typescript
// Skip if session is in recovery mode (session-recovery hook integration)
if (recoveringSessions.has(sessionID)) {
  return
}

// Skip if user interrupted or error occurred
const shouldBypass = interruptedSessions.has(sessionID) || errorSessions.has(sessionID)
if (shouldBypass) {
  return
}

// Skip if already reminded this cycle
if (remindedSessions.has(sessionID)) {
  return
}
```

**Interrupt Detection:**
```typescript
function detectInterrupt(error: unknown): boolean {
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>
    const name = errObj.name as string | undefined
    const message = (errObj.message as string | undefined)?.toLowerCase() ?? ""
    
    // Check error name
    if (name === "MessageAbortedError" || name === "AbortError") return true
    if (name === "DOMException" && message.includes("abort")) return true
    
    // Check error message
    if (message.includes("aborted") || message.includes("cancelled") || message.includes("interrupted")) {
      return true
    }
  }
  return false
}
```

### 4. Todo Fetching
Uses OpenCode's native todo API:

```typescript
const response = await ctx.client.session.todo({
  path: { id: sessionID },
})
todos = (response.data ?? response) as Todo[]

const incomplete = todos.filter(
  (t) => t.status !== "completed" && t.status !== "cancelled"
)
```

**Todo Interface:**
```typescript
interface Todo {
  content: string
  status: string  // "pending" | "in_progress" | "completed" | "cancelled"
  priority: string
  id: string
}
```

### 5. Continuation Prompt Injection
If incomplete todos exist, injects a system reminder:

```typescript
const CONTINUATION_PROMPT = `[SYSTEM REMINDER - TODO CONTINUATION]

Incomplete tasks remain in your todo list. Continue working on the next pending task.

- Proceed without asking for permission
- Mark each task complete when finished
- Do not stop until all tasks are done`

await ctx.client.session.prompt({
  path: { id: sessionID },
  body: {
    agent: prevMessage?.agent,  // Respects agent mode
    parts: [{
      type: "text",
      text: `${CONTINUATION_PROMPT}\n\n[Status: ${todos.length - incomplete.length}/${todos.length} completed, ${incomplete.length} remaining]`,
    }],
  },
  query: { directory: ctx.directory },
})
```

**Key Details:**
- Respects agent mode by reusing previous message's agent
- Shows completion status (e.g., "2/5 completed, 3 remaining")
- Uses imperative language ("Proceed without asking")
- Injected as user message (agent sees it as user input)

### 6. State Management
Tracks multiple session states:

```typescript
const remindedSessions = new Set<string>()      // Already reminded this cycle
const interruptedSessions = new Set<string>()   // User interrupted
const errorSessions = new Set<string>()         // Error occurred
const recoveringSessions = new Set<string>()    // In recovery mode
const pendingTimers = new Map<string, Timer>()  // Debounce timers
```

**State Cleanup:**
- `remindedSessions` cleared when assistant responds (allows re-remind)
- Error/interrupt states cleared after check (single-use bypass)
- All states cleared on session deletion
- Timers cancelled on user message or error

### 7. Integration with Session Recovery
Exposes callbacks for session-recovery hook:

```typescript
export interface TodoContinuationEnforcer {
  handler: (input) => Promise<void>
  markRecovering: (sessionID: string) => void
  markRecoveryComplete: (sessionID: string) => void
}

const markRecovering = (sessionID: string): void => {
  recoveringSessions.add(sessionID)
}

const markRecoveryComplete = (sessionID: string): void => {
  recoveringSessions.delete(sessionID)
}
```

**Why this matters:**
Session recovery needs to prevent todo-continuation from interfering while it fixes errors.

## Implementation Details

### Message Directory Resolution
Needs to find previous message to respect agent mode:

```typescript
function getMessageDir(sessionID: string): string | null {
  if (!existsSync(MESSAGE_STORAGE)) return null

  // Try direct path first
  const directPath = join(MESSAGE_STORAGE, sessionID)
  if (existsSync(directPath)) return directPath

  // Search in subdirectories
  for (const dir of readdirSync(MESSAGE_STORAGE)) {
    const sessionPath = join(MESSAGE_STORAGE, dir, sessionID)
    if (existsSync(sessionPath)) return sessionPath
  }

  return null
}
```

Uses `findNearestMessageWithFields()` from hook-message-injector to extract agent info.

### Timer Management
Properly cancels pending timers to avoid memory leaks:

```typescript
// Cancel on user message
if (sessionID && info?.role === "user") {
  const timer = pendingTimers.get(sessionID)
  if (timer) {
    clearTimeout(timer)
    pendingTimers.delete(sessionID)
  }
}

// Cancel on session deletion
const timer = pendingTimers.get(sessionInfo.id)
if (timer) {
  clearTimeout(timer)
  pendingTimers.delete(sessionInfo.id)
}
```

### Race Condition Handling
Re-checks abort state after async operations:

```typescript
// Re-check if abort occurred during the delay/fetch
if (interruptedSessions.has(sessionID) || errorSessions.has(sessionID) || recoveringSessions.has(sessionID)) {
  log(`[${HOOK_NAME}] Abort occurred during delay/fetch`, { sessionID })
  remindedSessions.delete(sessionID)
  return
}
```

## Dependencies

### hook-message-injector
Used to find previous message's agent info:

```typescript
import {
  findNearestMessageWithFields,
  MESSAGE_STORAGE,
} from "../features/hook-message-injector"

const messageDir = getMessageDir(sessionID)
const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
```

Returns: `{ agent?: string }`

## Key Patterns

### 1. Debounced Event Handler
Prevents rapid-fire triggers:
- Cancel existing timer on new event
- Start new timer
- Only execute if timer completes

### 2. Multi-State Tracking
Different bypass reasons tracked separately:
- Error vs interrupt vs recovery
- Single-use vs persistent states
- Per-session isolation

### 3. Agent Mode Respect
Always preserves agent from previous message:
- Prevents forcing non-agent mode
- Maintains session context
- Works with background tasks

### 4. Graceful Error Handling
Failures don't break session:
- Todo API errors → silent skip
- Prompt injection errors → cleanup state
- Missing message dir → no agent specified

## Testing Scenarios

### Happy Path
1. User creates 3 todos
2. Agent completes 1 todo, marks it complete
3. Agent goes idle
4. Hook detects 2 incomplete todos
5. Hook injects continuation prompt
6. Agent continues to next todo

### Error Path
1. Agent working on todo
2. Error occurs (API failure, etc.)
3. session.error event fires
4. Hook adds session to errorSessions
5. session.idle fires
6. Hook skips continuation (error bypass)

### Interrupt Path
1. Agent working on todo
2. User hits stop/cancel
3. session.error with abort error
4. Hook detects interrupt via detectInterrupt()
5. session.idle fires
6. Hook skips continuation (interrupt bypass)

### Recovery Path
1. Session-recovery calls markRecovering()
2. Agent being recovered
3. session.idle fires
4. Hook skips continuation (recovery mode)
5. Session-recovery calls markRecoveryComplete()
6. Future idle events can trigger continuation

## Potential Extraction Issues

### 1. Dependency on hook-message-injector
**Problem:** Uses shared utility from features/
**Solution:** 
- Copy findNearestMessageWithFields() locally
- Or make hook-message-injector a peer dependency
- Or fetch message directly via API

### 2. Integration with session-recovery
**Problem:** Exposes callbacks for tight coupling
**Solution:**
- Make callbacks optional
- Use events instead of direct coupling
- Document that recovery mode skipping is optional

### 3. Message Storage Path
**Problem:** Hardcoded MESSAGE_STORAGE path
**Solution:**
- Make configurable via plugin config
- Or use OpenCode API to get messages
- Fallback to no agent if can't find

## Configuration (If Standalone)

Suggested config schema:

```typescript
{
  enabled: true,
  debounceMs: 200,
  prompt: "Custom continuation prompt...",
  showStatus: true,  // Show "2/5 completed" status
  skipOnError: true,
  skipOnInterrupt: true,
}
```

## Performance Considerations

### Memory
- Tracks Sets per session (small)
- Clears on session deletion
- Timer map cleaned up properly

### Network
- 1 API call per idle event (todo fetch)
- 1 API call if continuing (prompt injection)
- No polling

### CPU
- Minimal (regex for interrupt detection)
- No heavy computation

## Value Proposition

**Why this is worth extracting:**
1. **Solves chronic LLM problem** - Agents stopping mid-task
2. **Zero user intervention** - Works automatically
3. **Smart bypass logic** - Doesn't interfere with errors/interrupts
4. **Agent mode compatible** - Works with specialized agents
5. **Clean implementation** - Well-structured, easy to understand

**Most requested feature** according to oh-my-opencode's author.

## Implementation Checklist

- [ ] Copy core logic (event handlers, todo checking)
- [ ] Replace hook-message-injector dependency
- [ ] Make MESSAGE_STORAGE configurable
- [ ] Remove session-recovery callbacks (optional feature)
- [ ] Add config schema with Zod
- [ ] Add tests for bypass logic
- [ ] Add tests for debouncing
- [ ] Document integration with other hooks
- [ ] Create example usage

## Code Quality Notes

**Strengths:**
- Well-commented with debug logging
- Proper cleanup (timers, state)
- Race condition handling
- Clear separation of concerns

**Weaknesses:**
- No tests
- Tight coupling with session-recovery
- Hardcoded MESSAGE_STORAGE path
- Could use config for prompt/debounce

Overall: High-quality implementation, ready for extraction with minor modifications.
