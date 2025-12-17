# Feature: todo-continuation-enforcer Hook

**Source:** `/repos/oh-my-opencode/src/hooks/todo-continuation-enforcer.ts`  
**Lines:** ~253 | **Dependencies:** hook-message-injector, session-recovery, OpenCode client | **Complexity:** Medium

## What It Does

Automatically prompts the LLM to continue working when incomplete todos remain after a session goes idle. Prevents the AI from stopping prematurely by injecting a continuation reminder with todo status, while respecting interrupts, errors, and active session recovery.

## How It Works

1. **Listens for idle state** - Watches `session.idle` event triggered when user stops sending messages
2. **Debounces with 200ms delay** - Cancels previous timers to avoid rapid re-scheduling
3. **Checks recovery mode** - Skips if session-recovery is actively restoring state (avoids conflicts)
4. **Validates conditions** - Skips if interrupted, errored, or already reminded this session
5. **Fetches todos via API** - Calls `session.todo()` endpoint to get current task list
6. **Filters incomplete** - Counts tasks not in "completed" or "cancelled" status
7. **Injects continuation prompt** - Adds system reminder with todo count/status via `session.prompt()`
8. **Preserves agent mode** - Reads previous message metadata to inject under correct agent
9. **Handles user interrupts** - Cancels pending continuation if user sends new message
10. **Resets state on assistant response** - Allows re-reminding on next idle cycle

## Code Analysis

### Event Handler Entry Point
```typescript
// src/hooks/todo-continuation-enforcer.ts:79
const handler = async ({ event }: { event: { type: string; properties?: unknown } }): Promise<void> => {
  const props = event.properties as Record<string, unknown> | undefined
  // Routes to different handlers based on event type: session.error, session.idle, message.updated, session.deleted
}
```

### Session Idle Event - Core Logic
```typescript
// src/hooks/todo-continuation-enforcer.ts:102-205
if (event.type === "session.idle") {
  const sessionID = props?.sessionID as string | undefined
  if (!sessionID) return

  // Debounce: cancel existing timer, schedule new one
  const existingTimer = pendingTimers.get(sessionID)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(async () => {
    pendingTimers.delete(sessionID)

    // Skip if session-recovery is active (avoid conflicts)
    if (recoveringSessions.has(sessionID)) {
      return
    }

    // Clear error/interrupt flags but skip if they were set
    const shouldBypass = interruptedSessions.has(sessionID) || errorSessions.has(sessionID)
    interruptedSessions.delete(sessionID)
    errorSessions.delete(sessionID)
    
    if (shouldBypass) return
    
    // Skip if already reminded this cycle
    if (remindedSessions.has(sessionID)) return

    // Fetch todos and check for incomplete tasks
    const todos = await ctx.client.session.todo({ path: { id: sessionID } })
    const incomplete = todos.filter(t => t.status !== "completed" && t.status !== "cancelled")
    
    if (incomplete.length === 0) return

    // Double-check abort didn't occur during fetch
    if (interruptedSessions.has(sessionID) || errorSessions.has(sessionID) || recoveringSessions.has(sessionID)) {
      return
    }

    // Get agent mode from previous message, inject continuation
    const messageDir = getMessageDir(sessionID)
    const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null

    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        agent: prevMessage?.agent,
        parts: [{ type: "text", text: CONTINUATION_PROMPT + status }]
      },
      query: { directory: ctx.directory }
    })

    remindedSessions.add(sessionID)
  }, 200) // 200ms debounce delay

  pendingTimers.set(sessionID, timer)
}
```

### Error Event - State Tracking
```typescript
// src/hooks/todo-continuation-enforcer.ts:82-100
if (event.type === "session.error") {
  const sessionID = props?.sessionID as string | undefined
  const isInterrupt = detectInterrupt(props?.error)
  
  errorSessions.add(sessionID)
  if (isInterrupt) {
    interruptedSessions.add(sessionID)
  }
  
  // Cancel pending continuation immediately on error
  const timer = pendingTimers.get(sessionID)
  if (timer) {
    clearTimeout(timer)
    pendingTimers.delete(sessionID)
  }
}
```

### Interrupt Detection
```typescript
// src/hooks/todo-continuation-enforcer.ts:47-62
function detectInterrupt(error: unknown): boolean {
  if (!error) return false
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>
    const name = errObj.name as string | undefined
    const message = (errObj.message as string | undefined)?.toLowerCase() ?? ""
    
    // Check for abort-related error names and messages
    if (name === "MessageAbortedError" || name === "AbortError") return true
    if (name === "DOMException" && message.includes("abort")) return true
    if (message.includes("aborted") || message.includes("cancelled") || message.includes("interrupted")) return true
  }
  // Also check string errors
  if (typeof error === "string") {
    const lower = error.toLowerCase()
    return lower.includes("abort") || lower.includes("cancel") || lower.includes("interrupt")
  }
  return false
}
```

### Message Updates - User Interaction Handling
```typescript
// src/hooks/todo-continuation-enforcer.ts:207-227
if (event.type === "message.updated") {
  const info = props?.info as Record<string, unknown> | undefined
  const sessionID = info?.sessionID as string | undefined

  // User message: cancel pending continuation (real user took over)
  if (sessionID && info?.role === "user") {
    const timer = pendingTimers.get(sessionID)
    if (timer) {
      clearTimeout(timer)
      pendingTimers.delete(sessionID)
    }
  }
  
  // Assistant response: clear reminded state (allows re-remind next idle)
  if (sessionID && info?.role === "assistant" && remindedSessions.has(sessionID)) {
    remindedSessions.delete(sessionID)
  }
}
```

### Continuation Prompt Text
```typescript
// src/hooks/todo-continuation-enforcer.ts:25-31
const CONTINUATION_PROMPT = `[SYSTEM REMINDER - TODO CONTINUATION]

Incomplete tasks remain in your todo list. Continue working on the next pending task.

- Proceed without asking for permission
- Mark each task complete when finished
- Do not stop until all tasks are done`

// Status appended: [Status: X/Y completed, Z remaining]
```

## Implementation Details

### Event Handlers & Lifecycle

| Event | Purpose | Action |
|-------|---------|--------|
| `session.idle` | Session enters idle state | Schedule debounced continuation check |
| `session.error` | Session encounters error | Track error, mark interrupt if applicable, cancel pending timers |
| `message.updated` (user role) | User sends new message | Cancel pending continuation (user interrupted) |
| `message.updated` (assistant role) | LLM responds | Clear reminded state to allow re-reminding |
| `session.deleted` | Session is deleted | Clean up all tracking state and timers |

### State Tracking

**Four separate Sets track session state:**

```typescript
const remindedSessions = new Set<string>()        // Has already been reminded this cycle
const interruptedSessions = new Set<string>()     // Session hit abort/cancel/interrupt error
const errorSessions = new Set<string>()           // Session hit any error (transient)
const recoveringSessions = new Set<string>()      // session-recovery is actively restoring
const pendingTimers = new Map<string, Timer>()    // Debounce timers per session
```

### API Usage

**Get todos:**
```typescript
ctx.client.session.todo({ path: { id: sessionID } })
// Returns: Todo[] with { content, status, priority, id }
```

**Inject continuation:**
```typescript
ctx.client.session.prompt({
  path: { id: sessionID },
  body: {
    agent: prevMessage?.agent,    // Preserve agent mode
    parts: [{ type: "text", text: "..." }]
  },
  query: { directory: ctx.directory }
})
```

### Message Directory Lookup

```typescript
// src/hooks/todo-continuation-enforcer.ts:33-45
function getMessageDir(sessionID: string): string | null {
  // 1. Check direct path: MESSAGE_STORAGE/{sessionID}
  // 2. Check nested path: MESSAGE_STORAGE/{dir}/{sessionID}
  // 3. Return null if not found
}

// Finds nearest previous message with agent/model metadata
const prevMessage = findNearestMessageWithFields(messageDir)
```

### Integration with session-recovery

Located in `src/index.ts:199-204`:

```typescript
if (sessionRecovery && todoContinuationEnforcer) {
  sessionRecovery.setOnAbortCallback(todoContinuationEnforcer.markRecovering);
  sessionRecovery.setOnRecoveryCompleteCallback(todoContinuationEnforcer.markRecoveryComplete);
}
```

**Why:** Prevents continuation injections during active recovery phase. Session-recovery calls `markRecovering()` when starting abort recovery, and `markRecoveryComplete()` when done. Todo enforcer skips injection while recovering.

## Key Patterns

### Debouncing with Cancellation
- Multiple `session.idle` events don't spawn multiple timers
- Each new idle event cancels the previous timer
- Only the final idle event's 200ms timer fires (if no new events)

### Race Condition Prevention
- Double-check abort conditions after async fetch completes (lines 172-176)
- Error/interrupt flags are cleared before skip check, but used to decide skip (prevents stale state)
- Recovery mode check happens both before and after fetch

### Stateful One-Time Reminding
- Per-session reminder tracking prevents spam
- Reset when assistant responds (allows continuation cycle to repeat)
- Cleared on user interaction (user took over, start fresh)

### Agent Mode Preservation
- Reads metadata from nearest previous message in session storage
- Falls back through chain: original → fallback → "general" default
- Maintains tool configuration and model settings

### Error Classification
- Distinguishes interrupts (abort, cancel, interrupt) from transient errors
- Interrupts block continuation entirely
- Transient errors are cleaned up after each check

## Adaptation Strategy

### What to Keep

- **Event-driven architecture** - React to idle/error/message events naturally
- **Debouncing pattern** - Prevents rapid re-scheduling, improves performance
- **State set tracking** - Clean per-session state isolation without complex data structures
- **Double-check pattern** - Validates no abort occurred during async operations
- **Integration with recovery** - Coordinates with other session management
- **Agent mode preservation** - Respects current agent configuration

### What to Simplify

- **Complex message lookup** - Can use simpler state if previous agent already known
- **Interrupt detection** - Could use single flag if error classification less important
- **Per-session reminder tracking** - Could use timestamp-based debouncing instead
- **Multiple error flags** - Could consolidate into single status enum if fewer states needed

### Configuration

```typescript
// Suggested configuration options
{
  enabled: true,
  debounce_delay_ms: 200,           // Time to wait before checking todos
  continuation_prompt: "...",        // Custom reminder text
  auto_resume: true,                 // Inject continuation automatically
  respect_interrupts: true,          // Skip on abort/cancel
  preserve_agent_mode: true,         // Use previous agent for injection
  max_incomplete_threshold: null,    // Optional: skip if >N todos incomplete
  skip_recovery_mode: true           // Skip while session-recovery active
}
```

## Implementation Checklist

- [ ] Create hook factory function with event handler
- [ ] Set up four state Sets (reminded, interrupted, error, recovering)
- [ ] Implement session.idle handler with 200ms debounce
- [ ] Add interrupt detection function
- [ ] Implement todo fetching via `ctx.client.session.todo()`
- [ ] Filter incomplete todos (status !== "completed" && !== "cancelled")
- [ ] Add message directory lookup for agent preservation
- [ ] Implement continuation prompt injection via `ctx.client.session.prompt()`
- [ ] Add message.updated handlers (user cancels timer, assistant resets reminder state)
- [ ] Add session.error handler with interrupt detection
- [ ] Add session.deleted handler for cleanup
- [ ] Wire integration with session-recovery hook (markRecovering/markRecoveryComplete)
- [ ] Test debounce behavior with rapid idle events
- [ ] Test abort/interrupt flow (error cancels pending injection)
- [ ] Test recovery mode coordination (injection skipped during recovery)
- [ ] Verify agent mode preserved from previous message

