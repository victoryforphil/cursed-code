# Feature: Background Task Manager

**Lines:** ~1200 (manager + tools + hooks)  
**Dependencies:** OpenCode session API  
**Complexity:** High

## What It Does

Runs agents in parallel child sessions while parent continues working. Fire-and-forget task execution with automatic completion notifications.

## The Problem

Sequential task execution wastes time:
```
User: "Search codebase for auth AND fetch React docs AND implement feature"

Bad (sequential):
1. Search codebase (2 min) → wait
2. Fetch docs (1 min) → wait  
3. Implement (5 min) → wait
Total: 8 minutes

Good (parallel):
1. Launch search in background
2. Launch docs fetch in background
3. Start implementing immediately
4. Collect results when needed
Total: 5 minutes (work overlaps)
```

## Architecture

### Three Components

**1. BackgroundManager** (`features/background-agent/manager.ts`)
- Creates child sessions
- Tracks task lifecycle
- Polls for completion
- Notifies parent session

**2. Tools** (`tools/background-task/tools.ts`)
- `background_task` - Launch agent in background
- `background_output` - Get results (blocking or non-blocking)
- `background_cancel` - Cancel running tasks

**3. Hooks** (`hooks/background-notification/`)
- Toast notifications when tasks complete
- OS-level notifications

## How It Works

### 1. Launch Background Task

**Tool Definition:**
```typescript
background_task({
  description: "Short summary for status tracking",
  prompt: "Full detailed prompt for the agent",
  agent: "explore" | "librarian" | "oracle" | any registered agent
})
```

**Manager.launch():**
```typescript
async launch(input: LaunchInput): Promise<BackgroundTask> {
  // 1. Create child session
  const createResult = await this.client.session.create({
    body: {
      parentID: input.parentSessionID,
      title: `Background: ${input.description}`,
    },
  })
  
  const sessionID = createResult.data.id
  
  // 2. Create task record
  const task: BackgroundTask = {
    id: `bg_${crypto.randomUUID().slice(0, 8)}`,
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
  this.startPolling()
  
  // 3. Launch agent (async, non-blocking)
  this.client.session.promptAsync({
    path: { id: sessionID },
    body: {
      agent: input.agent,
      tools: {
        task: false,              // Prevent recursive Task calls
        background_task: false,   // Prevent nested background tasks
      },
      parts: [{ type: "text", text: input.prompt }],
    },
  }).catch((error) => {
    // Handle errors asynchronously
    const existingTask = this.findBySession(sessionID)
    if (existingTask) {
      existingTask.status = "error"
      existingTask.error = error.message
      existingTask.completedAt = new Date()
      this.notifyParentSession(existingTask)
    }
  })
  
  return task
}
```

**Key Points:**
- `session.create()` with `parentID` establishes parent/child relationship
- `promptAsync()` is fire-and-forget (doesn't block)
- Tool restrictions prevent infinite recursion
- Returns immediately with task ID

### 2. Track Progress

**Polling Strategy:**
```typescript
private startPolling(): void {
  if (this.pollingInterval) return
  
  this.pollingInterval = setInterval(() => {
    this.pollRunningTasks()
  }, 2000)  // Poll every 2 seconds
}

private async pollRunningTasks(): Promise<void> {
  // 1. Get all session statuses
  const statusResult = await this.client.session.status()
  const allStatuses = statusResult.data as Record<string, { type: string }>
  
  for (const task of this.tasks.values()) {
    if (task.status !== "running") continue
    
    const sessionStatus = allStatuses[task.sessionID]
    
    // 2. Check if idle
    if (sessionStatus.type === "idle") {
      // 3. Verify no incomplete todos
      const hasIncompleteTodos = await this.checkSessionTodos(task.sessionID)
      
      if (!hasIncompleteTodos) {
        task.status = "completed"
        task.completedAt = new Date()
        this.notifyParentSession(task)
      }
    }
    
    // 4. Fetch progress details
    const messagesResult = await this.client.session.messages({
      path: { id: task.sessionID },
    })
    
    // Count tool calls, track last tool/message
    for (const msg of assistantMessages) {
      for (const part of msg.parts) {
        if (part.type === "tool_use") {
          task.progress.toolCalls++
          task.progress.lastTool = part.tool
        }
        if (part.type === "text") {
          task.progress.lastMessage = part.text
          task.progress.lastMessageAt = new Date()
        }
      }
    }
  }
  
  // Stop polling if no running tasks
  if (!this.hasRunningTasks()) {
    this.stopPolling()
  }
}
```

**Event-Driven Completion:**
```typescript
handleEvent(event: Event): void {
  if (event.type === "session.idle") {
    const sessionID = props.sessionID
    const task = this.findBySession(sessionID)
    
    if (task && task.status === "running") {
      this.checkSessionTodos(sessionID).then((hasIncompleteTodos) => {
        if (!hasIncompleteTodos) {
          task.status = "completed"
          task.completedAt = new Date()
          this.notifyParentSession(task)
        }
      })
    }
  }
  
  if (event.type === "message.part.updated") {
    const task = this.findBySession(sessionID)
    if (task && partInfo.type === "tool") {
      task.progress.toolCalls += 1
      task.progress.lastTool = partInfo.tool
      task.progress.lastUpdate = new Date()
    }
  }
}
```

**Hybrid Approach:**
- **Events** for real-time updates (tool calls, idle state)
- **Polling** as backup and for comprehensive progress (handles missed events)

### 3. Detect Completion

**Todo Check (Critical):**
```typescript
private async checkSessionTodos(sessionID: string): Promise<boolean> {
  const response = await this.client.session.todo({
    path: { id: sessionID },
  })
  const todos = response.data as Todo[]
  
  if (!todos || todos.length === 0) return false
  
  const incomplete = todos.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled"
  )
  
  return incomplete.length > 0
}
```

**Why Check Todos:**
- Agent might go idle mid-task
- Todo continuation enforcer will re-trigger agent
- Only mark complete when truly done

**Completion Criteria:**
```
session.idle + no incomplete todos = COMPLETED
session.error                     = ERROR
session.deleted                   = CANCELLED
```

### 4. Notify Parent

**Notification Strategy:**
```typescript
private notifyParentSession(task: BackgroundTask): void {
  const duration = formatDuration(task.startedAt, task.completedAt)
  
  // 1. Show toast notification
  const tuiClient = this.client as any
  if (tuiClient.tui?.showToast) {
    tuiClient.tui.showToast({
      body: {
        title: "Background Task Completed",
        message: `Task "${task.description}" finished in ${duration}.`,
        variant: "success",
        duration: 5000,
      },
    })
  }
  
  // 2. Inject message into parent session
  const message = `[BACKGROUND TASK COMPLETED] Task "${task.description}" finished in ${duration}. Use background_output with task_id="${task.id}" to get results.`
  
  setTimeout(async () => {
    // Find previous message to respect agent mode
    const messageDir = getMessageDir(task.parentSessionID)
    const prevMessage = messageDir ? findNearestMessageWithFields(messageDir) : null
    
    await this.client.session.prompt({
      path: { id: task.parentSessionID },
      body: {
        agent: prevMessage?.agent,  // Respect agent mode
        parts: [{ type: "text", text: message }],
      },
      query: { directory: this.directory },
    })
    
    this.clearNotificationsForTask(task.id)
  }, 200)  // Small delay to avoid races
}
```

**Two-Tier Notification:**
1. **Toast** - User sees immediately
2. **Prompt injection** - Agent sees and can act on results

### 5. Retrieve Results

**Non-Blocking (Default):**
```typescript
background_output({ task_id: "bg_abc123" })

// Returns immediately:
// - If completed: full results
// - If running: current status (tool calls, last tool, progress)
// - If error: error details
```

**Blocking (Rare):**
```typescript
background_output({ 
  task_id: "bg_abc123",
  block: true,
  timeout: 60000  // Max 10 minutes
})

// Polls every 1 second until:
// - Task completes → return results
// - Task errors → return error
// - Timeout → return current status
```

**Why Blocking Rare:**
- System auto-notifies when done
- Agent can continue other work
- Only needed if must have results before proceeding

**Result Formatting:**
```typescript
async formatTaskResult(task: BackgroundTask): Promise<string> {
  // Fetch all messages from child session
  const messagesResult = await client.session.messages({
    path: { id: task.sessionID },
  })
  
  // Extract assistant messages
  const assistantMessages = messages.filter(m => m.info.role === "assistant")
  
  // Get last message text
  const lastMessage = assistantMessages[assistantMessages.length - 1]
  const textContent = lastMessage.parts
    .filter(p => p.type === "text")
    .map(p => p.text)
    .join("\n")
  
  return `Task Result

Task ID: ${task.id}
Description: ${task.description}
Duration: ${formatDuration(task.startedAt, task.completedAt)}

---

${textContent}`
}
```

### 6. Cancel Tasks

**Single Task:**
```typescript
background_cancel({ taskId: "bg_abc123" })

// Aborts child session, marks cancelled
```

**All Tasks:**
```typescript
background_cancel({ all: true })

// Best practice: call before delivering final answer
// Cleans up any forgotten background tasks
```

**Abort Strategy:**
```typescript
// Fire-and-forget abort (critical!)
client.session.abort({
  path: { id: task.sessionID },
}).catch(() => {})  // Don't await, don't propagate

task.status = "cancelled"
task.completedAt = new Date()
```

**Why Fire-and-Forget:**
- Awaiting abort can abort parent session
- Just mark cancelled locally
- Child session cleanup happens async

## Data Structures

### BackgroundTask
```typescript
interface BackgroundTask {
  id: string                    // "bg_a1b2c3d4"
  sessionID: string             // Child session ID
  parentSessionID: string       // Parent session ID
  parentMessageID: string       // Message that launched task
  description: string           // Short summary
  prompt: string                // Full prompt sent to agent
  agent: string                 // Agent type used
  status: "running" | "completed" | "error" | "cancelled"
  startedAt: Date
  completedAt?: Date
  error?: string
  progress: TaskProgress
}

interface TaskProgress {
  toolCalls: number             // Total tool invocations
  lastTool?: string             // Most recent tool name
  lastUpdate: Date              // Last progress update
  lastMessage?: string          // Most recent text output
  lastMessageAt?: Date          // When last message was sent
}
```

### Manager State
```typescript
class BackgroundManager {
  private tasks: Map<string, BackgroundTask>           // All tasks
  private notifications: Map<string, BackgroundTask[]> // Pending notifications per parent
  private pollingInterval?: Timer                      // Active polling timer
}
```

## Usage Patterns

### Pattern 1: Parallel Research
```typescript
// Launch both in parallel
background_task({
  description: "Search internal auth code",
  prompt: "Find all authentication implementations in our codebase",
  agent: "explore"
})

background_task({
  description: "Fetch JWT docs",
  prompt: "Find JWT best practices and examples from official docs",
  agent: "librarian"
})

// Continue working immediately
// System notifies when both complete
// Collect results later
```

### Pattern 2: Long-Running Build
```typescript
background_task({
  description: "Full production build",
  prompt: "Run production build and report any errors",
  agent: "build"
})

// Work on other tasks while building
// Get notified when build finishes
```

### Pattern 3: Multiple Agents, Single Task
```typescript
// Comprehensive analysis
background_task({
  description: "Security audit",
  prompt: "Audit codebase for security vulnerabilities",
  agent: "explore"
})

background_task({
  description: "Known CVE check",
  prompt: "Check dependencies for known vulnerabilities",
  agent: "librarian"
})

background_task({
  description: "Architecture review",
  prompt: "Review security architecture and propose improvements",
  agent: "oracle"
})

// All run in parallel, notify when each completes
```

### Pattern 4: Cleanup Before Finish
```typescript
// Agent finishing work
"I've completed the implementation. Let me clean up."

// Cancel any forgotten background tasks
background_cancel({ all: true })

// Deliver final answer
"Done. All tasks complete."
```

## OmO Integration

OmO prompt enforces background task usage:

**Default Behavior:**
```
### Parallel Execution (DEFAULT behavior)

**Explore/Librarian = fire-and-forget tools**. Treat them like grep, not consultants.

// CORRECT: Always background, always parallel
background_task(agent="explore", prompt="Find auth implementations...")
background_task(agent="explore", prompt="Find error handling patterns...")
background_task(agent="librarian", prompt="Find JWT best practices...")
// Continue working immediately. Collect with background_output when needed.

// WRONG: Sequential or blocking
result = task(...)  // Never wait synchronously for explore/librarian
```

**Completion Requirement:**
```
### Before Delivering Final Answer:
- Cancel ALL running background tasks: background_cancel(all=true)
- This conserves resources and ensures clean workflow completion
```

**Oracle Exception:**
```
Oracle is EXPENSIVE. Use blocking Task tool for oracle, not background_task.
```

## Implementation Details

### Session Management
```typescript
// Create child session
const createResult = await client.session.create({
  body: {
    parentID: input.parentSessionID,
    title: `Background: ${input.description}`,
  },
})

// Launch async (non-blocking)
client.session.promptAsync({
  path: { id: sessionID },
  body: { agent, parts: [...] },
})

// Check status
const statusResult = await client.session.status()
const allStatuses = statusResult.data

// Abort session
client.session.abort({ path: { id: sessionID } })
```

### Error Handling
```typescript
// Launch errors
this.client.session.promptAsync({ ... })
  .catch((error) => {
    const task = this.findBySession(sessionID)
    if (task) {
      task.status = "error"
      
      // Detect agent not found
      if (errorMessage.includes("agent.name")) {
        task.error = `Agent "${agent}" not found. Make sure it's registered.`
      } else {
        task.error = errorMessage
      }
      
      task.completedAt = new Date()
      this.notifyParentSession(task)
    }
  })
```

### Memory Management
```typescript
// Cleanup on session deleted
if (event.type === "session.deleted") {
  const sessionID = props.info.id
  const task = this.findBySession(sessionID)
  
  if (task) {
    if (task.status === "running") {
      task.status = "cancelled"
      task.error = "Session deleted"
    }
    
    this.tasks.delete(task.id)
    this.clearNotificationsForTask(task.id)
  }
}
```

## Performance Characteristics

### Network
- Session creation: 1 API call per launch
- Polling: 1 API call every 2s while tasks running
- Progress tracking: 1 API call per poll per running task
- Result fetching: 1 API call per retrieval

### Memory
- ~500 bytes per task record
- Task history accumulates (cleanup on session.deleted)
- Polling timer runs only when tasks active

### CPU
- Minimal (polling, event handling)
- No heavy computation

## Cursed-Code Adaptation

### Keep
- Core architecture (manager + tools + hooks)
- Hybrid polling + events
- Todo completion check
- Agent mode respect in notifications
- Fire-and-forget abort
- Two-tier notifications

### Simplify
- Remove toast notifications (optional)
- Remove OS notifications (optional)
- Simpler progress tracking (just status, not full history)

### Enhance
- Add result caching (avoid re-fetching messages)
- Add task history limit (prevent unbounded growth)
- Add configurable poll interval
- Add max concurrent tasks limit

### Config Schema
```typescript
{
  enabled: true,
  pollInterval: 2000,           // ms between polls
  maxConcurrentTasks: 10,       // per session
  resultCacheTTL: 300000,       // 5 min
  enableToastNotifications: true,
  enableOSNotifications: false,
}
```

## Testing Scenarios

### Happy Path
1. Launch background task
2. Task runs, makes tool calls
3. Task completes
4. Parent session notified
5. Retrieve results with background_output

### Error Path
1. Launch with invalid agent
2. Error caught in promptAsync
3. Task marked error
4. Parent session notified with error
5. background_output shows error details

### Concurrent Tasks
1. Launch 3 tasks in parallel
2. Track progress for all 3
3. Tasks complete at different times
4. Each completion triggers notification
5. Retrieve results for each

### Cancellation
1. Launch task
2. Task running
3. Call background_cancel
4. Task aborted and marked cancelled
5. No notification sent

### Cleanup
1. Launch task
2. Delete parent session
3. Child session cleaned up
4. Task removed from manager
5. Polling stops if no tasks remain

## Value Proposition

**Why Extract This:**
1. Killer feature - parallel execution is game-changer
2. Well-architected - clean separation of concerns
3. Battle-tested - used in production by oh-my-opencode users
4. OpenCode native - uses platform APIs properly
5. Agent mode compatible - respects parent agent context

**Complexity Justified:**
- Multi-session management is inherently complex
- Implementation is well-structured despite size
- Value >> complexity for workflow efficiency

## Implementation Checklist

- [ ] Copy BackgroundManager class
- [ ] Create background_task tool
- [ ] Create background_output tool
- [ ] Create background_cancel tool
- [ ] Add event handlers (session.idle, message.part.updated, session.deleted)
- [ ] Add todo completion check
- [ ] Add polling mechanism
- [ ] Add notification system
- [ ] Test concurrent tasks
- [ ] Test error handling
- [ ] Test cancellation
- [ ] Add config schema
- [ ] Document usage patterns
- [ ] Create examples
