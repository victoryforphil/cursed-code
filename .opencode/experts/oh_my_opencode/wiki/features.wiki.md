# Feature Catalog

Breakdown of oh-my-opencode's 21 hooks and extraction complexity.

## Tier 1: High-Value Standalones (Easy to Extract)

### todo-continuation-enforcer
**Lines:** ~250 | **Dependencies:** None | **Complexity:** Low

Prevents agents from stopping with incomplete todos.

**How it works:**
1. Listens for `session.idle` event
2. 200ms debounce timer
3. Fetches todos via `ctx.client.session.todo()`
4. If incomplete todos exist, injects continuation prompt
5. Bypass logic for user interrupts/errors

**Key code:**
```typescript
const CONTINUATION_PROMPT = `[SYSTEM REMINDER - TODO CONTINUATION]
Incomplete tasks remain. Continue working on next pending task.
- Proceed without asking
- Mark each task complete when finished
- Do not stop until all tasks are done`
```

**Why it's valuable:**
- Most requested feature
- Solves chronic LLM habit of quitting mid-task
- Zero dependencies on other hooks

---

### keyword-detector
**Lines:** ~150 | **Dependencies:** hook-message-injector | **Complexity:** Low

Auto-detects keywords and injects specialized instructions.

**Keywords:**
- `ultrawork` / `ulw` → Maximum performance mode
- `search` / `find` / `찾아` / `検索` → Maximized search effort
- `analyze` / `investigate` / `분석` / `調査` → Deep analysis mode

**How it works:**
1. Listens to `chat.message` hook
2. Extracts prompt text from parts
3. Regex matches against keyword list
4. Injects context via `injectHookMessage()`

**Why it's valuable:**
- Power user feature
- Multilingual support
- Easy to customize keywords

---

### comment-checker
**Lines:** ~200 | **Dependencies:** `@code-yeongyu/comment-checker` npm | **Complexity:** Medium

Warns agents about excessive comments.

**How it works:**
1. `tool.execute.before` → registers pending Write/Edit calls
2. `tool.execute.after` → runs comment checker CLI
3. Lazy downloads binary on first use
4. Filters valid patterns (BDD, directives, docstrings)
5. Appends warning to tool output

**Smart filters:**
- BDD: `describe`, `it`, `test`, `beforeEach`
- Directives: `TODO`, `FIXME`, `@ts-ignore`
- Docstrings: JSDoc, Python docstrings

**Why it's valuable:**
- LLMs love over-commenting
- Smart filtering prevents false positives
- Improves code quality

---

### directory-agents-injector & directory-readme-injector
**Lines:** ~400 combined | **Dependencies:** None | **Complexity:** Low

Hierarchical context injection from file → root.

**How it works:**
1. Walks from file directory to project root
2. Collects all `AGENTS.md` / `README.md` files
3. Injects in order: root → file directory
4. Caches injected paths per session

**Example:**
```
project/AGENTS.md           # Injected 1st
src/AGENTS.md              # Injected 2nd
src/components/AGENTS.md   # Injected 3rd
src/components/Button.tsx  # Reading this triggers injection
```

**Why it's valuable:**
- Directory-specific context
- No manual injection needed
- Complements cursed-code's AGENTS.md approach

---

### rules-injector
**Lines:** ~600 | **Dependencies:** frontmatter, picomatch | **Complexity:** Medium

Conditional rules based on glob patterns.

**How it works:**
1. Walks from file directory → project root + `~/.claude/rules/`
2. Parses `.md` / `.mdc` files with frontmatter
3. Matches via `globs` field against current file
4. Injects matching rules

**Example rule file:**
```markdown
---
globs: ["*.ts", "src/**/*.js"]
description: "TypeScript/JavaScript coding rules"
alwaysApply: false
---
- Use PascalCase for interfaces
- Use camelCase for functions
```

**Why it's valuable:**
- Conditional rules (not all rules apply all the time)
- Per-language/per-directory conventions
- Compatible with Claude Code format

---

### think-mode
**Lines:** ~150 | **Dependencies:** None | **Complexity:** Low

Auto-detects when extended thinking is needed.

**Triggers:**
- Phrases: "think deeply", "ultrathink", "reason carefully"
- Auto-adjusts extended thinking budget

**Model limits:**
- Claude: 32k tokens
- Gemini: 16k tokens
- GPT: 25k tokens

**Why it's valuable:**
- Dynamic reasoning mode switching
- No manual config needed

---

## Tier 2: Complex but High-Value

### background-task (Background Agent Manager)
**Lines:** ~800 | **Dependencies:** session API, hook-message-injector | **Complexity:** High

**THE killer feature.** Run agents in parallel sessions.

**How it works:**
1. Creates child session via `ctx.client.session.create()`
2. Launches agent with `promptAsync()`
3. Polls session status every 2s
4. Tracks tool calls, progress
5. Checks for incomplete todos via `session.todo()`
6. Notifies parent session on completion

**Key features:**
- Parent/child session relationship
- Progress tracking (tool calls, last tool, last message)
- Auto-completion detection (session.idle + no incomplete todos)
- Error handling (agent not found, session errors)
- OS notifications + toast messages

**Why it's valuable:**
- Multi-agent orchestration
- Parallel execution
- Never wait for sequential tasks

**Complexity:**
- Session lifecycle management
- Polling vs event-driven hybrid
- Error recovery
- Notification system

---

### context-window-monitor
**Lines:** ~200 | **Dependencies:** None | **Complexity:** Low

Prevents "context window anxiety" pattern.

**How it works:**
1. Tracks token usage via `tool.execute.after`
2. At 70%+ usage, injects reminder
3. Message: "Still 30% headroom, don't rush"

**Why it's valuable:**
- Prevents sloppy work from anxiety
- Evidence-based pattern from Agentic Patterns blog

---

### tool-output-truncator
**Lines:** ~300 | **Dependencies:** None | **Complexity:** Medium

Dynamic truncation based on remaining context.

**Targets:**
- Grep, Glob, LSP tools, AST-grep

**Strategy:**
- Keeps 50% headroom
- Caps at 50k tokens
- Smart truncation (preserves structure)

**Why it's valuable:**
- Prevents one verbose search from eating context
- Works across multiple tool types

---

## Tier 3: Supporting Features

### session-recovery
**Lines:** ~400 | **Dependencies:** None | **Complexity:** Medium

Recovers from common errors:
- Missing tool results
- Thinking block issues
- Empty messages

**Integration:**
- Hooks into todo-continuation-enforcer
- `markRecovering()` / `markRecoveryComplete()` callbacks

---

### anthropic-auto-compact
**Lines:** ~600 | **Dependencies:** Anthropic API | **Complexity:** High

Auto-summarizes and compacts session when Claude hits token limits.

**Features:**
- Detects token limit errors
- Runs compact tool
- Resumes automatically

---

### agent-usage-reminder
**Lines:** ~200 | **Dependencies:** None | **Complexity:** Low

Reminds users to leverage specialized agents when using search tools directly.

---

### empty-task-response-detector
**Lines:** ~100 | **Dependencies:** None | **Complexity:** Low

Warns when Task tool returns empty response.

---

### interactive-bash-session
**Lines:** ~400 | **Dependencies:** tmux | **Complexity:** High

Persistent shell sessions via tmux.

**Features:**
- Handles interactive prompts
- Session management
- Output capture

---

## Tier 4: Quality of Life

- **session-notification** - OS-level notifications when idle
- **auto-update-checker** - Checks for new versions
- **startup-toast** - Welcome message ("oMoMoMo...")
- **background-notification** - Toast when background tasks complete
- **non-interactive-env** - Sets `CI=true` for bash commands
- **empty-message-sanitizer** - Prevents empty API messages

---

## Extraction Priorities

For cursed-code, start with:

1. **todo-continuation-enforcer** (Week 1) - Immediate value, zero deps
2. **keyword-detector** (Week 1) - Easy, high customization potential
3. **directory-context** (Week 2) - Complements existing AGENTS.md approach
4. **background-task** (Week 2-3) - Killer feature, justify the effort
5. **rules-injector** (Week 3) - Powerful conditional rules engine

# Log
- 2025-12-16: Initial feature catalog with extraction analysis
