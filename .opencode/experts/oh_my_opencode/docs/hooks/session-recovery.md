# Feature: session-recovery Hook

**Source:** `~/repos/oh-my-opencode/src/hooks/session-recovery/`  
**Lines:** ~450 | **Dependencies:** @opencode-ai/plugin, @opencode-ai/sdk, node:fs, node:path, xdg-basedir | **Complexity:** High

## What It Does

Automatically recovers Claude sessions from four types of Anthropic API validation errors by editing message files on disk. When an API call fails due to malformed message content (missing tool results, bad thinking block order, thinking blocks when disabled, or empty content), the hook detects the error type, repairs the message structure, aborts the failed session, and triggers automatic retry.

This enables Claude to self-heal from transient protocol violations without user intervention.

## How It Works

1. **Error Detection:** Hook receives `session.error` event with failed message metadata
2. **Type Classification:** Analyzes error message text to match one of 4 recovery patterns
3. **Session Abort:** Stops the current (broken) session
4. **Message Repair:** Based on error type:
   - `tool_result_missing`: Injects cancelled tool result placeholders
   - `thinking_block_order`: Prepends empty thinking block to first position
   - `thinking_disabled_violation`: Strips all thinking blocks from messages
   - `empty_content_message`: Replaces empty text parts with placeholder
5. **Automatic Retry:** User can retry the session with repaired messages
6. **Callbacks:** Notifies parent system of abort/completion for UI updates

## Code Analysis

### Main Entry Point
```typescript
// src/hooks/session-recovery/index.ts:289-393
export function createSessionRecoveryHook(ctx: PluginInput): SessionRecoveryHook {
  const processingErrors = new Set<string>()  // Prevent duplicate processing
  let onAbortCallback: ((sessionID: string) => void) | null = null
  let onRecoveryCompleteCallback: ((sessionID: string) => void) | null = null

  // Caller registers callbacks to know when recovery starts/completes
  const setOnAbortCallback = (callback: (sessionID: string) => void): void => {
    onAbortCallback = callback
  }

  const isRecoverableError = (error: unknown): boolean => {
    return detectErrorType(error) !== null  // Quick check for recoverability
  }

  const handleSessionRecovery = async (info: MessageInfo): Promise<boolean> => {
    // Fast path checks
    if (!info || info.role !== "assistant" || !info.error) return false
    if (processingErrors.has(assistantMsgID)) return false  // Skip duplicates
    processingErrors.add(assistantMsgID)  // Mark as processing

    // 1. Abort session BEFORE recovery
    await ctx.client.session.abort({ path: { id: sessionID } }).catch(() => {})

    // 2. Fetch current message state from storage
    const messagesResp = await ctx.client.session.messages({...})
    const failedMsg = msgs?.find((m) => m.info?.id === assistantMsgID)

    // 3. Dispatch to recovery function based on error type
    if (errorType === "tool_result_missing") {
      success = await recoverToolResultMissing(ctx.client, sessionID, failedMsg)
    } else if (errorType === "thinking_block_order") {
      success = await recoverThinkingBlockOrder(...)
    }
    // ... other types

    // 4. Show toast notification with recovery status
    await ctx.client.tui.showToast({...})

    return success
  }
}
```

### Error Detection
```typescript
// src/hooks/session-recovery/index.ts:86-117
function detectErrorType(error: unknown): RecoveryErrorType {
  const message = getErrorMessage(error)  // Normalize error to string

  // Pattern matching on specific error strings from Anthropic API
  if (message.includes("tool_use") && message.includes("tool_result")) {
    return "tool_result_missing"  // User pressed ESC during tool execution
  }

  if (message.includes("thinking") && (
    message.includes("first block") ||          // thinking must start first
    message.includes("must start with") ||      // or: thinking must come first
    message.includes("preceeding")              // or: typo variant
  )) {
    return "thinking_block_order"
  }

  if (message.includes("thinking is disabled") && message.includes("cannot contain")) {
    return "thinking_disabled_violation"  // Thinking blocks in non-extended API
  }

  if (message.includes("non-empty content") ||  // Common phrasing
      message.includes("must have non-empty content") ||
      message.includes("content") && message.includes("is empty")) {
    return "empty_content_message"  // Message has no text parts
  }

  return null  // Not a recoverable error
}
```

### Tool Result Missing Recovery (ESC Handling)
```typescript
// src/hooks/session-recovery/index.ts:123-162
async function recoverToolResultMissing(
  client: Client,
  sessionID: string,
  failedAssistantMsg: MessageData
): Promise<boolean> {
  // Extract tool IDs from failed message
  let parts = failedAssistantMsg.parts || []
  if (parts.length === 0 && failedAssistantMsg.info?.id) {
    // Fallback: read tool parts from filesystem if API didn't include them
    const storedParts = readParts(failedAssistantMsg.info.id)
    parts = storedParts.map((p) => ({
      type: p.type === "tool" ? "tool_use" : p.type,
      id: "callID" in p ? p.callID : p.id,  // Handle schema differences
      name: "tool" in p ? p.tool : undefined,
      input: "state" in p ? p.state?.input : undefined,
    }))
  }

  const toolUseIds = extractToolUseIds(parts)
  if (toolUseIds.length === 0) return false

  // Create cancelled tool_result parts for each tool_use
  const toolResultParts = toolUseIds.map((id) => ({
    type: "tool_result" as const,
    tool_use_id: id,
    content: "Operation cancelled by user (ESC pressed)",  // Standard placeholder
  }))

  // Send tool results to continue session
  try {
    await client.session.prompt({
      path: { id: sessionID },
      body: { parts: toolResultParts },
    })
    return true
  } catch {
    return false
  }
}
```

### Thinking Block Order Recovery
```typescript
// src/hooks/session-recovery/index.ts:164-193
async function recoverThinkingBlockOrder(
  _client: Client,
  sessionID: string,
  _failedAssistantMsg: MessageData,
  _directory: string,
  error: unknown
): Promise<boolean> {
  // First, try specific message index from error
  const targetIndex = extractMessageIndex(error)  // Parse "messages.5" from error
  if (targetIndex !== null) {
    const targetMessageID = findMessageByIndexNeedingThinking(sessionID, targetIndex)
    if (targetMessageID) {
      return prependThinkingPart(sessionID, targetMessageID)  // Add empty thinking to start
    }
  }

  // Fallback: fix ALL messages with orphan thinking (thinking not in first position)
  const orphanMessages = findMessagesWithOrphanThinking(sessionID)
  if (orphanMessages.length === 0) return false

  let anySuccess = false
  for (const messageID of orphanMessages) {
    if (prependThinkingPart(sessionID, messageID)) {
      anySuccess = true
    }
  }

  return anySuccess
}
```

### Storage Operations
```typescript
// src/hooks/session-recovery/storage.ts:226-249
export function prependThinkingPart(sessionID: string, messageID: string): boolean {
  const partDir = join(PART_STORAGE, messageID)  // ~/.local/share/opencode/storage/part/{messageID}

  if (!existsSync(partDir)) {
    mkdirSync(partDir, { recursive: true })
  }

  const partId = `prt_0000000000_thinking`  // Prefix with zeros for first position
  const part = {
    id: partId,
    sessionID,
    messageID,
    type: "thinking",
    thinking: "",  // Empty thinking block
    synthetic: true,  // Mark as injected by recovery
  }

  try {
    writeFileSync(join(partDir, `${partId}.json`), JSON.stringify(part, null, 2))
    return true
  } catch {
    return false
  }
}

// src/hooks/session-recovery/storage.ts:197-224
export function findMessagesWithOrphanThinking(sessionID: string): string[] {
  const messages = readMessages(sessionID)
  const result: string[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== "assistant") continue

    const parts = readParts(msg.id)
    if (parts.length === 0) continue

    // Check if first part (by ID sort) is thinking
    const sortedParts = [...parts].sort((a, b) => a.id.localeCompare(b.id))
    const firstPart = sortedParts[0]
    const firstIsThinking = THINKING_TYPES.has(firstPart.type)

    // If first part is NOT thinking, it's orphan thinking somewhere else
    if (!firstIsThinking) {
      result.push(msg.id)
    }
  }

  return result
}
```

### Empty Content Recovery
```typescript
// src/hooks/session-recovery/index.ts:218-275
async function recoverEmptyContentMessage(
  _client: Client,
  sessionID: string,
  failedAssistantMsg: MessageData,
  _directory: string,
  error: unknown
): Promise<boolean> {
  const targetIndex = extractMessageIndex(error)  // Get error location
  const failedID = failedAssistantMsg.info?.id

  let anySuccess = false

  // Strategy 1: Replace ALL empty text parts with placeholder
  const messagesWithEmptyText = findMessagesWithEmptyTextParts(sessionID)
  for (const messageID of messagesWithEmptyText) {
    if (replaceEmptyTextParts(messageID, "[user interrupted]")) {
      anySuccess = true
    }
  }

  // Strategy 2: Inject text part into thinking-only messages
  const thinkingOnlyIDs = findMessagesWithThinkingOnly(sessionID)
  for (const messageID of thinkingOnlyIDs) {
    if (injectTextPart(sessionID, messageID, "[user interrupted]")) {
      anySuccess = true
    }
  }

  // Strategy 3: Try specific target message from error
  if (targetIndex !== null) {
    const targetMessageID = findEmptyMessageByIndex(sessionID, targetIndex)
    if (targetMessageID) {
      if (replaceEmptyTextParts(targetMessageID, "[user interrupted]")) {
        return true
      }
      if (injectTextPart(sessionID, targetMessageID, "[user interrupted]")) {
        return true
      }
    }
  }

  // Strategy 4: Try the failed message itself
  if (failedID) {
    if (replaceEmptyTextParts(failedID, "[user interrupted]")) {
      return true
    }
    if (injectTextPart(sessionID, failedID, "[user interrupted]")) {
      return true
    }
  }

  // Strategy 5: Fallback to all empty messages
  const emptyMessageIDs = findEmptyMessages(sessionID)
  for (const messageID of emptyMessageIDs) {
    if (replaceEmptyTextParts(messageID, "[user interrupted]")) {
      anySuccess = true
    }
  }

  return anySuccess
}
```

## Implementation Details

### Event Handlers & Lifecycle

**Integration Point:** `session.error` event
- Parent registers hook to listen for session errors
- Hook receives: `{ id, role, sessionID, parentID, error }`
- Async recovery runs in background without blocking session

**Callback System:**
- `setOnAbortCallback()`: Called BEFORE session abort (parent marks session as "recovering")
- `setOnRecoveryCompleteCallback()`: Called AFTER recovery attempt (parent enables retry UI)
- Allows parent to show appropriate UI state throughout recovery

**Deduplication:**
- `processingErrors` Set tracks messages currently being recovered
- Prevents duplicate recovery attempts for same failed message
- Set entry cleaned up in `finally` block (always runs)

### Storage Architecture

**Message Storage:** `~/.local/share/opencode/storage/message/{sessionID}/`
- Contains JSON files for each message: `{ id, role, parentID, time, error }`
- Sorted by creation time for consistent ordering

**Part Storage:** `~/.local/share/opencode/storage/part/{messageID}/`
- Contains JSON files for each message part (text, tool, thinking, etc.)
- Part IDs sort lexicographically (used to control part order)
- Thinking parts use `prt_0000000000_*` prefix to force first position

**Critical Detail:** Thinking block order is controlled by **part ID sorting**, not creation time
- Recovery prepends part with ID `prt_0000000000_thinking`
- When sorted, this ID comes first (zeros < other characters)
- API reads parts in sorted order, validates thinking is first

### Error Message Parsing

```typescript
// src/hooks/session-recovery/index.ts:52-84
function getErrorMessage(error: unknown): string {
  // Handles: Error objects, API responses, nested structures
  const paths = [
    errorObj.data,              // Common: error.data.message
    errorObj.error,             // Or: error.error.message
    errorObj,                   // Or: error.message directly
    errorObj.data?.error,       // Or: error.data.error.message
  ]

  // Search paths in order, return first non-empty message string
}

function extractMessageIndex(error: unknown): number | null {
  const message = getErrorMessage(error)
  const match = message.match(/messages\.(\d+)/)  // Parse "messages.5" -> 5
  return match ? parseInt(match[1], 10) : null
}
```

### Thinking Type Classification

```typescript
// src/hooks/session-recovery/constants.ts
export const THINKING_TYPES = new Set(["thinking", "redacted_thinking", "reasoning"])
```

Multiple thinking variants handled uniformly:
- `thinking`: Extended API (user can see thinking)
- `redacted_thinking`: Extended API (thinking hidden from user)
- `reasoning`: Reasoning models (structurally identical)

### Content Detection

```typescript
// src/hooks/session-recovery/storage.ts:71-89
export function hasContent(part: StoredPart): boolean {
  // Thinking/meta parts: no content value
  if (THINKING_TYPES.has(part.type)) return false

  // Text: has content if non-empty after trim
  if (part.type === "text") {
    return !!(textPart.text?.trim())
  }

  // Tool/tool_result: always count as content (presence = value)
  if (part.type === "tool" || part.type === "tool_use") {
    return true
  }

  return false
}
```

## Key Patterns

### Error Recovery Strategy

**Specific-then-Broad Approach:**
1. Try to target the specific message index from error message
2. If that fails, scan entire session for pattern match
3. Apply fix to all affected messages (not just one)
4. Return true if ANY message was fixed

This handles cases where:
- Error index is off-by-one (system messages shift indexing)
- Multiple messages have the same problem
- Error message is ambiguous/incomplete

### Defensive Fallbacks

**Multiple Data Sources:**
```typescript
// Tool IDs: try API response first, fall back to filesystem
let parts = failedAssistantMsg.parts || []  // From API
if (parts.length === 0) {
  const storedParts = readParts(failedAssistantMsg.info.id)  // From disk
  parts = storedParts.map(...)
}
```

Rationale: API response may not include full message parts, but filesystem has complete record.

### Idempotent Mutations

All recovery operations are safe to run multiple times:
- Prepending thinking: uses fixed ID, overwrites if exists
- Stripping thinking: already removed = no-op
- Injecting text: adds new part, doesn't modify existing
- Replacing empty text: only affects parts with no content

Enables retry logic without risk of double-fixing.

### Session Abort Before Recovery

```typescript
// index.ts:320-324
if (onAbortCallback) {
  onAbortCallback(sessionID)  // Mark session as "recovering"
}

await ctx.client.session.abort({ path: { id: sessionID } })
```

**Why abort before fixing?**
- Stops any in-flight API calls using broken messages
- Ensures retry will use repaired messages from storage
- Signal to parent that session is unavailable during recovery

### Synthetic Flag

All injected parts marked with `synthetic: true`:
```typescript
const part: StoredTextPart = {
  ...
  synthetic: true,  // User didn't create this content
}
```

Allows UI to visually distinguish:
- User-created content: normal display
- Synthetic recovery content: tagged/italicized/different style
- Helps users understand what recovery did

## Adaptation Strategy

### What to Keep

1. **Error Detection Pattern Matching:** Error message parsing is specific to Anthropic API. Keep this structure if adapting to different APIs (change regex patterns, not architecture).

2. **Storage-Based Recovery:** Editing message files on disk is elegant for persistent session recovery. Valuable pattern for any system with file-backed message storage.

3. **Deduplication Set:** Preventing duplicate recovery processing is critical for background async operations.

4. **Callback System:** Decouples recovery from UI state management. Parent decides what to do on abort/complete.

5. **Multi-Strategy Recovery:** Tool result missing uses API-based retry, thinking block order uses filesystem mutations, empty content uses multiple approaches. Flexibility per error type.

### What to Simplify

1. **Orphan Thinking Detection:** Current logic scans all messages every recovery. Could cache "messages needing thinking" during initial error scan.

2. **Error Message Parsing:** Multiple fallback paths work but are verbose. Could use a single structured error path once API response format is standardized.

3. **Toast Notifications:** Can be optional (skip if UI unavailable). Current implementation catches errors, making toast optional by design.

4. **Callback Registration:** If recovery never needs to notify parent, could remove callbacks entirely and make it pure I/O.

### Configuration

```typescript
{
  enabled: true,

  // Which error types to recover
  recoverToolResultMissing: true,
  recoverThinkingBlockOrder: true,
  recoverThinkingDisabledViolation: true,
  recoverEmptyContentMessage: true,

  // Placeholder text for empty content recovery
  emptyMessagePlaceholder: "[user interrupted]",

  // Max recovery attempts per session (prevent infinite loops)
  maxRetries: 3,

  // Show UI notifications during recovery
  showNotifications: true,

  // Log recovery attempts to console
  debug: false,
}
```

## Implementation Checklist

- [ ] **Copy source files:** `src/hooks/session-recovery/` (all 4 files)
- [ ] **Integrate event handler:** Register `handleSessionRecovery` with `session.error` event
- [ ] **Set up callbacks:** Implement `setOnAbortCallback` and `setOnRecoveryCompleteCallback` with parent state management
- [ ] **Create storage paths:** Ensure `~/.local/share/opencode/storage/message/` and `.../part/` directories exist
- [ ] **Configure error messages:** Map your API error strings to recovery types (test with actual errors)
- [ ] **Test tool result recovery:** Trigger ESC during tool execution, verify cancelled tool results are injected
- [ ] **Test thinking block recovery:** Force thinking-not-first error, verify prepended thinking part is created
- [ ] **Test empty content recovery:** Create empty text parts, verify placeholder injection works
- [ ] **Implement retry UI:** After recovery completes, show retry button only on recoverable errors
- [ ] **Add instrumentation:** Log recovery attempts, success rate, error types for monitoring

# Log
- 2025-12-16: Created comprehensive implementation guide for session-recovery hook
- 2025-12-16: Documented all 4 error recovery types with code snippets and patterns
- 2025-12-16: Included storage architecture, error detection logic, and callback system
- 2025-12-16: Added adaptation strategy and configuration template
