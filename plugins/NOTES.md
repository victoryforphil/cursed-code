# Plugin Port Notes

Notes, decisions, questions, and issues from porting oh-my-opencode plugins.

## Session: 2025-12-16

### Completed Ports (4 single-file plugins)

1. **empty-task-response-detector.ts** - Simplest, zero deps, ~40 lines
2. **context-window-monitor.ts** - ~100 lines, uses session.messages API
3. **todo-continuation-enforcer.ts** - ~180 lines, the "killer feature"
4. **keyword-detector.ts** - ~150 lines, simplified from original

### Completed Monorepo Plugins (1 plugin)

1. **background-tasks/** - Full-featured background task orchestration (~755 lines)
   - **Architecture:** BackgroundManager singleton + 3 tools + notification hooks
   - **Features:** Parallel agent execution, progress monitoring, dual notifications (toast + prompt)
   - **Config:** Enable/disable, max concurrent, polling interval, notification preferences
   - **Status:** Ready for testing and npm publish
   - **Package:** `@cursed/background-tasks`

---

## Key Decisions Made

### 1. Standalone Files vs Multi-File Structure
**Decision:** Single-file plugins
**Rationale:** 
- Easier to copy/paste into `.opencode/plugin/`
- Follows cursed-code's à la carte philosophy
- No build step needed for users
- Can always refactor to multi-file later if needed

### 2. Removed hook-message-injector Dependency
**Decision:** Simplified implementations without writing to OpenCode's internal storage
**Rationale:**
- `hook-message-injector` writes directly to `~/.local/share/opencode/storage/message/`
- This is invasive and tightly coupled to OpenCode internals
- Could break with OpenCode updates
- Simpler approaches work:
  - `todo-continuation-enforcer`: Uses `ctx.client.session.prompt()` API
  - `keyword-detector`: Appends to `output.parts` in `chat.message` hook

### 3. Removed Logging
**Decision:** Removed `log()` calls from oh-my-opencode's shared logger
**Rationale:**
- Reduces dependencies
- Users can add their own logging if needed
- Silent failures with graceful degradation

### 4. Configuration via Constants
**Decision:** Hardcoded config constants at top of each file
**Rationale:**
- No config file dependency
- Fork-friendly: users just edit the file
- Can be upgraded to config file later if demand exists

---

## Questions for You

### Q1: Todo Enforcer Agent Mode
The original `todo-continuation-enforcer` tries to preserve the previous agent mode when injecting the continuation prompt. I simplified this by omitting the `agent` field in the prompt call.

**Trade-off:** Agent may switch to default mode after continuation.
**To fix:** Would need to either:
a) Store last-seen agent in plugin state
b) Re-implement hook-message-injector pattern

**Preference?**

### Q2: Keyword Detector Trigger Behavior
Current implementation injects keywords only once per session (first message).

**Alternative:** Could trigger on every message, or only after session reset.
**Preference?**

### Q3: Context Window Monitor - Anthropic Only
Currently only monitors Anthropic models (checks `providerID === "anthropic"`).

**Should we:**
a) Add support for other providers (different token limits)?
b) Make it configurable via constants?
c) Keep as Anthropic-only?

### Q4: Installation Location
These are stored in `plugins/` at repo root, but users need them in `.opencode/plugin/`.

**Options:**
a) Symlink approach: `ln -s /path/to/cursed-code/plugins ~/.config/opencode/plugin`
b) Copy individual files as needed
c) Add an install script
d) Leave as-is with README instructions

**Preference?**

---

## Not Ported (Could Add Later)

### High Value
- **directory-agents-injector** - Auto-injects AGENTS.md from parent dirs
- **directory-readme-injector** - Similar for README.md
- **rules-injector** - Conditional rules based on glob patterns
- **think-mode** - Auto-detects when extended thinking is needed

### Medium Value
- **session-notification** - OS notifications when idle
- **comment-checker** - Warns about excessive comments
- **tool-output-truncator** - Dynamic truncation for search tools

### Lower Priority
- **anthropic-auto-compact** - Auto-summarizes on token limit
- **session-recovery** - Recovers from errors (tight coupling with todo-enforcer)
- **interactive-bash-session** - tmux-based persistent sessions

---

## Known Issues

### Issue 1: chat.message Hook Output Modification
The keyword-detector appends to `output.parts` - unclear if OpenCode respects this modification. May need testing.

**Workaround if broken:** Fall back to hook-message-injector approach or file-based injection.

### Issue 2: TypeScript Types
Using `@opencode-ai/plugin` import - users need this package or need to handle type-only imports.

**Workaround:** Could convert to plain `.js` files without types.

---

## Testing Checklist
- [ ] empty-task-response-detector: Trigger Task tool with empty response
- [ ] context-window-monitor: Use Anthropic model past 70% of 200k tokens
- [ ] todo-continuation-enforcer: Create todos, let session go idle
- [ ] keyword-detector: Use "ultrawork" or "search" in prompt

---

## References
- oh-my-opencode wiki: `.opencode/experts/oh_my_opencode/wiki/`
- OpenCode plugin docs: https://opencode.ai/docs/plugins/
- OpenCode plugin types: `@opencode-ai/plugin`
