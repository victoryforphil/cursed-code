# Feature: context-window-monitor

**Source:** `src/hooks/context-window-monitor.ts`  
**Lines:** ~95 | **Dependencies:** @opencode-ai/plugin (PluginInput type) | **Complexity:** Medium

## What It Does

Monitors Anthropic Claude API token usage during tool execution and injects a one-time reassurance reminder when context usage exceeds 70% of the 200K actual token limit. The reminder displays progress using the 1M token window (public limit) to help the LLM understand it has plenty of remaining context and should not rush through work.

Solves the problem: LLMs sometimes panic and sacrifice quality when they think context is running low. This hook reassures them about available space using familiar mental models (1M tokens feels infinite vs 200K sounds scary).

## How It Works

1. **Initialize** - Create session-specific tracking (Set of sessionIDs that have been reminded)
2. **After Tool Executes** - Retrieve all messages for the session via OpenCode client API
3. **Filter Messages** - Extract only assistant messages with token usage data from Anthropic provider
4. **Check Threshold** - Calculate actual usage % (input tokens + cache reads / 200K limit)
5. **If Below 70%** - Return early (nothing to do)
6. **If At/Above 70%** - Mark session as reminded, append reminder text to tool output
7. **Calculate Display Stats** - Show usage using 1M window (friendlier numbers) to the LLM
8. **Session Cleanup** - Remove session from reminded set when deleted (event listener)

## Code Analysis

### Hook Initialization & Session Tracking

```typescript
export function createContextWindowMonitorHook(ctx: PluginInput) {
  const remindedSessions = new Set<string>()
  
  // Why Set: Fast O(1) lookups, prevents duplicate reminders per session
  // Context: Sessions are independent - each gets one reminder at 70% threshold
```

**File location:** `src/hooks/context-window-monitor.ts:28-29`

This closure captures session state. Using a Set ensures we only remind once per session, even if the threshold is exceeded multiple times.

### Token Usage Calculation

```typescript
const totalInputTokens = (lastTokens?.input ?? 0) + (lastTokens?.cache?.read ?? 0)
const actualUsagePercentage = totalInputTokens / ANTHROPIC_ACTUAL_LIMIT

if (actualUsagePercentage < CONTEXT_WARNING_THRESHOLD) return
```

**File location:** `src/hooks/context-window-monitor.ts:57-62`

Key insight: Uses **only the last assistant message's tokens**. This works because:
- OpenCode compacts conversation history before sending to Claude
- The "input tokens" shown represent the actual compressed context sent to the model
- Cache reads are bonus tokens (no compaction benefit) - must be included
- Only the latest message reflects current context state

### Display vs Actual Limits

```typescript
const displayUsagePercentage = totalInputTokens / ANTHROPIC_DISPLAY_LIMIT
const usedPct = (displayUsagePercentage * 100).toFixed(1)
const usedTokens = totalInputTokens.toLocaleString()

output.output += `\n\n${CONTEXT_REMINDER}
[Context Status: ${usedPct}% used (${usedTokens}/${limitTokens} tokens), ${remainingPct}% remaining]`
```

**File location:** `src/hooks/context-window-monitor.ts:66-73`

Psychology pattern: Displays the same token count against 1M limit (vs 200K) so LLM sees friendly percentages. If actual is 140K:
- Actual: 70% of 200K (scary!)
- Display: 14% of 1M (plenty left!)

### Event Handler for Cleanup

```typescript
const eventHandler = async ({ event }: { event: { type: string; properties?: unknown } }) => {
  if (event.type === "session.deleted") {
    const sessionInfo = props?.info as { id?: string } | undefined
    if (sessionInfo?.id) {
      remindedSessions.delete(sessionInfo.id)
    }
  }
}
```

**File location:** `src/hooks/context-window-monitor.ts:79-88`

Prevents memory leaks by clearing session from Set when OpenCode deletes it.

### Type Safety with Message Filtering

```typescript
interface AssistantMessageInfo {
  role: "assistant"
  providerID: string
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: { read: number; write: number }
  }
}

const assistantMessages = messages
  .filter((m) => m.info.role === "assistant")
  .map((m) => m.info as AssistantMessageInfo)

if (lastAssistant.providerID !== "anthropic") return
```

**File location:** `src/hooks/context-window-monitor.ts:13-53`

Ensures we only process Anthropic messages with token data. Other providers (OpenAI, etc.) are ignored gracefully.

## Implementation Details

### Event Hooks
- **`tool.execute.after`** - Triggered after ANY tool runs. Hook receives:
  - `input.tool` - Tool name that executed
  - `input.sessionID` - Session where tool ran
  - `input.callID` - Unique tool invocation ID
  - `output` - Tool result (title, output, metadata) - mutable object we append to
  
### API Integration
- Uses `ctx.client.session.messages()` - OpenCode client method to fetch session message history
- Returns either direct data or wrapped in `{ data }` - code handles both patterns
- No authentication needed (ctx already has credentials from plugin runtime)

### State Tracking
- **remindedSessions Set** - Per-session flag to ensure reminder fires once
- **Memory** - Cleared by event listener when sessions are deleted
- **Scope** - Session-level (not global), so multiple users don't interfere

### Error Handling
- Wraps entire logic in try/catch, silently continues if anything fails
- Rationale: Monitoring is secondary - tool execution must succeed even if monitor breaks
- Graceful degradation pattern - better to miss a reminder than break tooling

## Key Patterns

### Session-Level State with Event Cleanup
Store per-session flags in closures, clean up with event listeners. Prevents memory leaks while keeping state isolated.

**Reuse for:** Similar "remind once per session" features (first-time setup, deprecation warnings, quota alerts).

### Hook Output Mutation
Append to `output.output` string directly. Doesn't create new response - seamlessly integrates with existing tool result.

**Reuse for:** Injecting metadata, audit trails, or contextual info into any tool result.

### Display vs Internal Limits
Store two thresholds - one for triggering (real), one for displaying (user-friendly). Keeps LLM behavior optimized while showing clear progress.

**Reuse for:** Any resource where display units differ from internal calculations (token windows, rate limits with different display tiers, etc.).

### Provider-Specific Logic
Check `providerID` before consuming provider-specific fields. Gracefully skip other providers.

**Reuse for:** Multi-provider plugins where each provider has different token accounting, capabilities, or metadata.

### Defensive Message Access
Use optional chaining (`??`), flexible response parsing (data or wrapped), and safe type assertion with validation filters.

**Reuse for:** Robust API client code that handles API version drift, response format variations.

### Problem: One-Shot Per Session
Without the Set check, reminders would fire every time the hook runs (multiple times per session). The session-level de-duplication is essential.

### Problem: Token Calculation Complexity
Must include cache reads (they count toward usage) but use only latest message (reflects compressed context). Missing either breaks accuracy.

## Adaptation Strategy

### What to Keep
- **Session-level deduplication** - Critical to prevent reminder spam
- **Provider filtering** - Other models have different token accounting (or none)
- **Graceful error handling** - Never break tool execution for monitoring
- **Psychology-friendly display** - Reassurance over panic is the point
- **Event cleanup** - Prevents memory leaks in long-running processes

### What to Simplify
- **Hard-coded message** - Could be configurable (custom text per org/user)
- **Fixed 70% threshold** - Could be a config option (70%, 80%, 90%)
- **Token numbers** - Could pull from provider API instead of hard-coding
- **Display calculation** - Could support multiple display formats (percentage only, tokens only, progress bar, etc.)

### Configuration

```typescript
interface ContextWindowMonitorConfig {
  // Enable/disable the hook
  enabled: true,
  
  // Trigger reminder at this % of actual limit
  thresholdPercent: 70,
  
  // Display using this friendly window size
  displayLimitTokens: 1_000_000,
  
  // The actual service limit (from provider docs)
  actualLimitTokens: 200_000,
  
  // Custom reminder message (can use template vars)
  reminderMessage: `[SYSTEM REMINDER - 1M Context Window]\n\nYou are using Anthropic Claude with 1M context window...`,
  
  // Only remind if using Anthropic (true) or all providers (false)
  anthropicOnly: true,
}
```

## Implementation Checklist

- [ ] Extract hook function to your codebase as `createContextWindowMonitorHook`
- [ ] Import PluginInput type from @opencode-ai/plugin (or your plugin SDK)
- [ ] Register hook in plugin setup: `'tool.execute.after': createContextWindowMonitorHook(ctx).['tool.execute.after']`
- [ ] Register event handler: `event: createContextWindowMonitorHook(ctx).event`
- [ ] Test with a real tool execution, verify reminder appears when usage > 70%
- [ ] Verify reminder appears only once per session (test with multiple tool calls)
- [ ] Test session deletion, verify Set cleanup prevents memory leaks
- [ ] (Optional) Add config for threshold, message text, display limits
- [ ] (Optional) Log reminder injection events for analytics/debugging
- [ ] (Optional) Support multiple provider limits (not just Anthropic)

