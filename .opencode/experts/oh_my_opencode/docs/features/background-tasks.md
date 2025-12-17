# Feature: Background Task System

**Source:** BackgroundManager, background_task tools, background-notification hook  
**Main Files:**
- `src/features/background-agent/manager.ts` (420 LOC)
- `src/tools/background-task/tools.ts` (330 LOC)
- `src/hooks/background-notification/index.ts` (23 LOC)

**Lines:** ~770 | **Dependencies:** OpenCode client/session API, hook system, event bus | **Complexity:** High

---

## What It Does

Orchestrates async agent execution in child sessions - launches agents, monitors progress, notifies on completion. Runs background agents completely separate from the parent session, with polling-based progress tracking every 2 seconds, automatic completion detection via idle/todo checks, and parent session notification via toast + prompt injection.

---

## How It Works

1. **Launch (user calls `background_task` tool)**
   - Create child session with `client.session.create()`
   - Build BackgroundTask metadata (id, timestamps, status)
   - Call `promptAsync()` with agent + disabled tools (prevent nested background tasks)
   - Store task in manager, start polling interval if not running

2. **Event Handling (real-time updates)**
   - Hook receives `message.part.updated` events → increment `toolCalls`, record `lastTool`
   - Hook receives `session.idle` event → check todos (might be incomplete), mark completed if no todos
   - Hook receives `session.deleted` event → cancel task, clean up notifications

3. **Polling (every 2 seconds)**
   - Fetch session status from `client.session.status()`
   - If idle: check todos again (two-pass to catch async todo-continuation), fetch messages for progress
   - Update `progress.toolCalls`, `progress.lastTool`, `progress.lastMessage`
   - Stop polling when no running tasks remain

4. **Completion & Notification**
   - Mark task `status = "completed"`, queue for parent notification
   - Send toast to user (TUI)
   - Send prompt to parent session with "[BACKGROUND TASK COMPLETED]" message + task_id hint
   - Clear notifications after delivery

5. **Output Retrieval (user calls `background_output`)**
   - Get task by id, check status
   - If running + block=false: return current status
   - If running + block=true: poll every 1s until completion or timeout
   - If completed: fetch session messages, extract assistant's last text

---

## Code Analysis

### BackgroundManager Constructor & Lifecycle

```typescript
// src/features/background-agent/manager.ts:54-66
export class BackgroundManager {
  private tasks: Map<string, BackgroundTask>  // All tracked tasks
  private notifications: Map<string, BackgroundTask[]>  // Notification queue per parent session
  private client: OpencodeClient  // OpenCode API client
  private directory: string  // Plugin directory
  private pollingInterval?: Timer  // Single polling timer (started once, reused)

  constructor(ctx: PluginInput) {
    this.tasks = new Map()
    this.notifications = new Map()
    this.client = ctx.client
    this.directory = ctx.directory
  }
}
```

**Pattern:** Singleton manager holds all tasks globally. Single polling interval timer for all tasks (efficient).

### Task Launch Flow

```typescript
// src/features/background-agent/manager.ts:68-135
async launch(input: LaunchInput): Promise<BackgroundTask> {
  // Validate agent name
  if (!input.agent || input.agent.trim() === "") {
    throw new Error("Agent parameter is required")
  }

  // 1. Create child session linked to parent
  const createResult = await this.client.session.create({
    body: {
      parentID: input.parentSessionID,  // Linkage for UI hierarchy
      title: `Background: ${input.description}`,  // Show in session list
    },
  })

  const sessionID = createResult.data.id

  // 2. Build task metadata
  const task: BackgroundTask = {
    id: `bg_${crypto.randomUUID().slice(0, 8)}`,  // Short task ID
    sessionID,
    parentSessionID: input.parentSessionID,
    description: input.description,
    prompt: input.prompt,
    agent: input.agent,
    status: "running",
    startedAt: new Date(),
    progress: { toolCalls: 0, lastUpdate: new Date() },
  }

  this.tasks.set(task.id, task)
  this.startPolling()  // Lazy-start polling

  // 3. Fire agent asynchronously (fire-and-forget)
  this.client.session.promptAsync({
    path: { id: sessionID },
    body: {
      agent: input.agent,
      tools: {
        task: false,  // Prevent nested background_task calls
        background_task: false,
      },
      parts: [{ type: "text", text: input.prompt }],
    },
  }).catch((error) => {
    // Mark error if agent not found
    const existingTask = this.findBySession(sessionID)
    if (existingTask) {
      existingTask.status = "error"
      existingTask.error = error.includes("agent.name")
        ? `Agent "${input.agent}" not found...`
        : String(error)
      existingTask.completedAt = new Date()
      this.notifyParentSession(existingTask)
    }
  })

  return task
}
```

**Key decisions:**
- `promptAsync()` is fire-and-forget (not awaited) → returns immediately
- Tools disabled to prevent recursive background tasks
- Error catch runs async, doesn't block launch

### Event-Driven Progress Tracking

```typescript
// src/features/background-agent/manager.ts:177-240
handleEvent(event: Event): void {
  const props = event.properties

  // Pattern 1: Tool execution detected
  if (event.type === "message.part.updated") {
    const task = this.findBySession(props.sessionID)
    if (!task) return

    if (props.type === "tool" || props.tool) {
      // Increment tool count on every tool_use part
      task.progress.toolCalls += 1
      task.progress.lastTool = props.tool
      task.progress.lastUpdate = new Date()
    }
  }

  // Pattern 2: Session idle (agent finished thinking)
  if (event.type === "session.idle") {
    const task = this.findBySession(props.sessionID)
    if (!task || task.status !== "running") return

    // Two-pass check: handle async todo-continuation hook
    this.checkSessionTodos(sessionID).then((hasIncompleteTodos) => {
      if (hasIncompleteTodos) {
        log("[background-agent] Task has incomplete todos, waiting...")
        return  // Don't mark completed yet
      }

      task.status = "completed"
      task.completedAt = new Date()
      this.markForNotification(task)
      this.notifyParentSession(task)
    })
  }

  // Pattern 3: Session manually deleted
  if (event.type === "session.deleted") {
    const task = this.findBySession(props.info.id)
    if (!task) return

    if (task.status === "running") {
      task.status = "cancelled"
      task.error = "Session deleted"
    }
    this.tasks.delete(task.id)
    this.clearNotificationsForTask(task.id)  // Clean up queue
  }
}
```

**Patterns:**
- `message.part.updated` → tool execution counter (real-time via event bus)
- `session.idle` → ready to check completion (but async todo-continuation might add todos)
- `session.deleted` → explicit cleanup

### Polling Implementation (Fallback + Enhancement)

```typescript
// src/features/background-agent/manager.ts:346-425
private async pollRunningTasks(): Promise<void> {
  // Get all session statuses at once
  const allStatuses = (await this.client.session.status()).data

  for (const task of this.tasks.values()) {
    if (task.status !== "running") continue

    // Fallback: session not yet idle
    const sessionStatus = allStatuses[task.sessionID]
    if (sessionStatus?.type === "idle") {
      // Double-check: might have async todos added
      const hasIncompleteTodos = await this.checkSessionTodos(task.sessionID)
      if (hasIncompleteTodos) continue

      task.status = "completed"
      task.completedAt = new Date()
      this.markForNotification(task)
      this.notifyParentSession(task)
      continue
    }

    // Enhance progress from messages if still running
    try {
      const messagesResult = await this.client.session.messages({
        path: { id: task.sessionID },
      })

      const messages = messagesResult.data
      const assistantMsgs = messages.filter((m) => m.info?.role === "assistant")

      let toolCalls = 0
      let lastTool: string | undefined
      let lastMessage: string | undefined

      // Count tools + extract last message text
      for (const msg of assistantMsgs) {
        for (const part of msg.parts ?? []) {
          if (part.type === "tool_use" || part.tool) {
            toolCalls++
            lastTool = part.tool || part.name
          }
          if (part.type === "text") lastMessage = part.text
        }
      }

      task.progress.toolCalls = toolCalls
      task.progress.lastTool = lastTool
      task.progress.lastMessage = lastMessage  // For status display
      task.progress.lastUpdate = new Date()
    } catch (error) {
      log("[background-agent] Poll error for task:", error)
    }
  }

  // Stop polling if no running tasks
  if (!this.hasRunningTasks()) {
    this.stopPolling()
  }
}
```

**Key insight:** Polling runs every 2s but only counts running tasks. Once all tasks complete, polling stops (lazy-stop).

### Notification Delivery

```typescript
// src/features/background-agent/manager.ts:282-323
private notifyParentSession(task: BackgroundTask): void {
  const duration = this.formatDuration(task.startedAt, task.completedAt)

  // 1. Show toast (TUI)
  if (this.client.tui?.showToast) {
    this.client.tui.showToast({
      body: {
        title: "Background Task Completed",
        message: `Task "${task.description}" finished in ${duration}.`,
        variant: "success",
        duration: 5000,
      },
    }).catch(() => {})
  }

  // 2. Inject message into parent session (with 200ms delay for timing)
  setTimeout(async () => {
    const messageDir = getMessageDir(task.parentSessionID)
    const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null

    await this.client.session.prompt({
      path: { id: task.parentSessionID },
      body: {
        agent: prevMessage?.agent,  // Continue with same agent
        parts: [
          {
            type: "text",
            text: `[BACKGROUND TASK COMPLETED] Task "${task.description}" finished in ${duration}. Use background_output with task_id="${task.id}" to get results.`,
          },
        ],
      },
      query: { directory: this.directory },
    })

    this.clearNotificationsForTask(task.id)
  }, 200)
}
```

**Patterns:**
- Toast for immediate UX feedback
- Prompt injection for persistent record + hint about retrieving results
- Delayed to avoid timing issues

### background_task Tool

```typescript
// src/tools/background-task/tools.ts:23-63
export function createBackgroundTask(manager: BackgroundManager) {
  return tool({
    description: BACKGROUND_TASK_DESCRIPTION,
    args: {
      description: tool.schema.string().describe("Short task description"),
      prompt: tool.schema.string().describe("Full detailed prompt for the agent"),
      agent: tool.schema.string().describe("Agent type to use"),
    },
    async execute(args: BackgroundTaskArgs, toolContext) {
      try {
        const task = await manager.launch({
          description: args.description,
          prompt: args.prompt,
          agent: args.agent.trim(),
          parentSessionID: toolContext.sessionID,  // Context injected
          parentMessageID: toolContext.messageID,
        })

        return `Background task launched successfully.

Task ID: ${task.id}
Session ID: ${task.sessionID}
Description: ${task.description}
Agent: ${task.agent}

The system will notify you when the task completes.
Use \`background_output\` tool with task_id="${task.id}" to check progress.`
      } catch (error) {
        return `❌ Failed to launch background task: ${error.message}`
      }
    },
  })
}
```

**User interface:** Simple args, returns task metadata + instructions.

### background_output Tool (Status + Results)

```typescript
// src/tools/background-task/tools.ts:196-260
export function createBackgroundOutput(manager: BackgroundManager, client: OpencodeClient) {
  return tool({
    description: BACKGROUND_OUTPUT_DESCRIPTION,
    args: {
      task_id: tool.schema.string().describe("Task ID to get output from"),
      block: tool.schema.boolean().optional().describe("Wait for completion (default: false)"),
      timeout: tool.schema.number().optional().describe("Max wait time in ms (default: 60000)"),
    },
    async execute(args: BackgroundOutputArgs) {
      const task = manager.getTask(args.task_id)
      if (!task) return `Task not found: ${args.task_id}`

      // Already completed: return result immediately
      if (task.status === "completed") {
        return await formatTaskResult(task, client)  // Fetch messages, extract text
      }

      // Error/cancelled: return status
      if (task.status === "error" || task.status === "cancelled") {
        return formatTaskStatus(task)
      }

      // Non-blocking and running: return status now
      if (!args.block) {
        return formatTaskStatus(task)
      }

      // Blocking: poll until completion
      const startTime = Date.now()
      while (Date.now() - startTime < args.timeout) {
        await delay(1000)

        const currentTask = manager.getTask(args.task_id)
        if (currentTask?.status === "completed") {
          return await formatTaskResult(currentTask, client)
        }
        if (currentTask?.status === "error" || currentTask?.status === "cancelled") {
          return formatTaskStatus(currentTask)
        }
      }

      // Timeout: return current status
      return `Timeout exceeded. Task still running.\\n\\n${formatTaskStatus(task)}`
    },
  })
}

// Format depends on status
function formatTaskStatus(task: BackgroundTask): string {
  return `# Task Status
| Field | Value |
| Task ID | \`${task.id}\` |
| Status | **${task.status}** |
| Tool Calls | ${task.progress?.toolCalls} |
| Last Tool | ${task.progress?.lastTool || "N/A"} |
| Duration | ${formatDuration(task.startedAt, task.completedAt)} |`
}

async function formatTaskResult(task: BackgroundTask, client: OpencodeClient): Promise<string> {
  // Fetch session messages
  const messages = await client.session.messages({ path: { id: task.sessionID } })

  // Extract last assistant message text
  const assistantMsgs = messages.data.filter((m) => m.info?.role === "assistant")
  const lastMsg = assistantMsgs[assistantMsgs.length - 1]
  const textContent = lastMsg?.parts
    ?.filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n")

  return `Task Result
Task ID: ${task.id}
Duration: ${formatDuration(task.startedAt, task.completedAt)}
---
${textContent || "(No text output)"}`
}
```

**Dual-mode behavior:** Non-blocking returns status + hints; blocking polls + returns full result.

### background_cancel Tool (Cancellation)

```typescript
// src/tools/background-task/tools.ts:262-331
export function createBackgroundCancel(manager: BackgroundManager, client: OpencodeClient) {
  return tool({
    description: BACKGROUND_CANCEL_DESCRIPTION,
    args: {
      taskId: tool.schema.string().optional(),
      all: tool.schema.boolean().optional(),
    },
    async execute(args: BackgroundCancelArgs, toolContext) {
      if (args.all === true) {
        // Get all tasks for this parent session
        const tasks = manager.getTasksByParentSession(toolContext.sessionID)
        const runningTasks = tasks.filter((t) => t.status === "running")

        for (const task of runningTasks) {
          // Fire-and-forget abort (don't await to avoid cascading abort)
          client.session.abort({ path: { id: task.sessionID } }).catch(() => {})

          task.status = "cancelled"
          task.completedAt = new Date()
        }

        return `✅ Cancelled ${runningTasks.length} background task(s)`
      }

      // Cancel single task
      const task = manager.getTask(args.taskId!)
      if (!task) return `❌ Task not found: ${args.taskId}`
      if (task.status !== "running") return `❌ Cannot cancel: already ${task.status}`

      client.session.abort({ path: { id: task.sessionID } }).catch(() => {})
      task.status = "cancelled"
      task.completedAt = new Date()

      return `✅ Task cancelled: ${task.id}`
    },
  })
}
```

**Important:** `abort()` is fire-and-forget (no await) to avoid aborting the parent session.

### Background Notification Hook

```typescript
// src/hooks/background-notification/index.ts:12-20
export function createBackgroundNotificationHook(manager: BackgroundManager) {
  const eventHandler = async ({ event }: EventInput) => {
    // Delegate all event handling to manager
    manager.handleEvent(event)
  }

  return {
    event: eventHandler,  // Register as event hook
  }
}
```

**One-liner:** Hook passes all events to manager. Manager decides what to do.

---

## Implementation Details

### Task Lifecycle States

| Status | Entry Point | Exit Condition | Actions |
|--------|-------------|-----------------|---------|
| `running` | `launch()` | `session.idle` + no todos → polling | Track progress, listen to events |
| `completed` | idle event or polling | Final | Send notification, mark queue |
| `error` | `promptAsync()` error | Final | Send notification, mark error message |
| `cancelled` | `background_cancel()` or `session.deleted` | Final | Abort session, cleanup queue |

### Event-Driven vs Polling Strategy

**Event-driven (real-time):**
- `message.part.updated` → increment tool counter immediately
- `session.idle` → check completion asynchronously
- `session.deleted` → immediate cleanup

**Polling (2s interval, fallback):**
- Confirms session status (catch session.idle misses)
- Fetches messages to count tools + extract progress
- Stops when no running tasks

**Why both?** Events are real-time but async (todo-continuation might add todos after idle). Polling catches this.

### Todo-Aware Completion

```typescript
// src/features/background-agent/manager.ts:160-175
private async checkSessionTodos(sessionID: string): Promise<boolean> {
  try {
    // Fetch todos from session
    const response = await this.client.session.todo({ path: { id: sessionID } })
    const todos = response.data ?? response

    if (!todos || todos.length === 0) return false

    // Check for incomplete todos
    const incomplete = todos.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled"
    )

    return incomplete.length > 0
  } catch {
    return false
  }
}
```

**Pattern:** Called twice (after idle event + during polling) to catch async todo additions.

### Notification Queue Management

```typescript
// src/features/background-agent/manager.ts:242-265
markForNotification(task: BackgroundTask): void {
  const queue = this.notifications.get(task.parentSessionID) ?? []
  queue.push(task)
  this.notifications.set(task.parentSessionID, queue)
}

getPendingNotifications(sessionID: string): BackgroundTask[] {
  return this.notifications.get(sessionID) ?? []
}

clearNotifications(sessionID: string): void {
  this.notifications.delete(sessionID)
}

private clearNotificationsForTask(taskId: string): void {
  for (const [sessionID, tasks] of this.notifications.entries()) {
    const filtered = tasks.filter((t) => t.id !== taskId)
    if (filtered.length === 0) {
      this.notifications.delete(sessionID)
    } else {
      this.notifications.set(sessionID, filtered)
    }
  }
}
```

**Pattern:** Per-parent-session queue tracks completed tasks pending notification. Cleared after delivery or session deletion.

### Duration Formatting

```typescript
// src/features/background-agent/manager.ts:325-337
private formatDuration(start: Date, end?: Date): string {
  const duration = (end ?? new Date()).getTime() - start.getTime()
  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}
```

**Used for:** Toast messages, notification prompts, status displays.

---

## Key Patterns

### Singleton Manager with Lazy Initialization

- One BackgroundManager instance per plugin
- Single polling interval timer (reused for all tasks)
- Polling starts when first task launches, stops when all complete
- Efficient resource usage

### Event Bus Integration

- Hook subscribes to all events (`message.part.updated`, `session.idle`, `session.deleted`)
- Manager's `handleEvent()` is pure event handler (no side effects)
- Events update task state in real-time, triggering completion checks

### Fire-and-Forget Pattern for Background Operations

```typescript
// promptAsync() - don't await (agent runs independently)
this.client.session.promptAsync({ ... }).catch((error) => { /* handle error */ })

// abort() - don't await (prevents cascading abort to parent)
client.session.abort({ path: { id: sessionID } }).catch(() => {})
```

**Why?** Awaiting could block parent session or cause cascade aborts.

### Two-Pass Completion Detection

1. **Event-based** (`session.idle` event): Quick, but async todos might be added after
2. **Polling-based** (every 2s): Catches completed tasks + async todo additions
3. **Fallback** (if both miss): `background_output` with block=true waits for user-initiated check

### Parent Session Notification via Prompt Injection

```typescript
// Find previous message fields (agent, directory)
const prevMessage = findNearestMessageWithFields(messageDir)

// Inject into parent session (continues previous agent context)
await this.client.session.prompt({
  path: { id: task.parentSessionID },
  body: {
    agent: prevMessage?.agent,  // Reuse agent
    parts: [{ type: "text", text: "[BACKGROUND TASK COMPLETED]..." }],
  },
  query: { directory: this.directory },
})
```

**Benefit:** Notification appears in parent session's message history + agent can react.

### Status vs Result Display Modes

- **Status mode** (running/error): Show progress (tool count, last tool, duration)
- **Result mode** (completed): Fetch messages, extract last assistant text
- **Blocking poll** (user calls `background_output` with block=true): Wait up to 60s, then return whatever

---

## Adaptation Strategy

### What to Keep

1. **Manager singleton pattern** - Central task tracking is essential
2. **Event + polling dual detection** - Catches all completion scenarios
3. **Todo-aware completion check** - Critical for OpenCode integration
4. **Fire-and-forget for background operations** - Prevents cascades
5. **Notification queue per parent session** - Maintains session isolation

### What to Simplify

1. **Message injection complexity** - Could just queue notifications for UI display instead
2. **Dual formatting for status/result** - Could use single format with conditional fields
3. **Tool disable config** - Could allow some tools in background (with restrictions)

### Configuration Template

```typescript
interface BackgroundTaskConfig {
  enabled: true,
  // How often to poll (ms)
  pollInterval: 2000,
  // Toast notification options
  toast: {
    enabled: true,
    duration: 5000,
    variant: "success",
  },
  // Timeout for background_output blocking mode (ms)
  maxBlockTimeout: 600000,
  // Whether to inject notification into parent session
  injectNotification: true,
  // Whether to check todos for completion
  todoAware: true,
  // Tools to disable in background sessions
  disabledTools: ["task", "background_task"],
}
```

---

## Implementation Checklist

- [ ] Copy BackgroundManager class (handle session lifecycle + polling)
- [ ] Implement event handler in manager (handleEvent method)
- [ ] Copy todo-checking logic (two-pass completion detection)
- [ ] Create background_task tool (launch wrapper)
- [ ] Create background_output tool (status + blocking retrieval)
- [ ] Create background_cancel tool (cleanup)
- [ ] Create notification hook (event bridge to manager)
- [ ] Wire up toast notifications (or substitute with logging)
- [ ] Test with long-running agent (verify polling works)
- [ ] Test cancellation (verify fire-and-forget abort doesn't cascade)
- [ ] Test todo-aware completion (verify two-pass todo check)

