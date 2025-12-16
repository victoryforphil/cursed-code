# @cursed/background-tasks

Background task orchestration for OpenCode - launch agents in parallel, monitor progress, and get notified on completion.

## Features

- **🚀 Launch agents in the background** - Continue working while tasks run in parallel
- **📊 Progress monitoring** - Automatic polling and event-driven status updates
- **🔔 Smart notifications** - TUI toasts + prompt injection (configurable fallback)
- **✅ Todo-aware completion** - Optional integration with todo-continuation-enforcer
- **⚙️ Full configuration** - Control concurrency, polling, notifications
- **🧹 Automatic cleanup** - Sessions cleaned up on deletion/compaction

## Installation

For local development in cursed-code:

`.opencode/opencode.json`:
```json
{
  "plugins": [
    "../plugins/background-tasks/dist/index.js"
  ]
}
```

For published package (future):
```bash
bun add @cursed/background-tasks
```

## Quick Start

### 1. Add to your OpenCode config

`.opencode/opencode.json`:
```json
{
  "plugins": [
    "@cursed/background-tasks"
  ]
}
```

### 2. Launch a background task

```typescript
// In your OpenCode session
await background_task({
  description: "Research React Server Components",
  agent: "scout",
  prompt: "Research React Server Components and create a comprehensive wiki page explaining the architecture, use cases, and best practices."
});
```

### 3. Check results when notified

```typescript
// When you get notification that task completed
await background_output("ses_abc123...");
```

## Tools

### `background_task`

Launch an agent in the background.

**Parameters:**
- `description` (string) - Short description for notifications
- `agent` (string) - Agent to run (e.g., "scout", "explore", "document-writer")
- `prompt` (string) - Detailed prompt for the agent

**Returns:** Task ID for tracking

**Example:**
```typescript
await background_task({
  description: "Document API endpoints",
  agent: "document-writer",
  prompt: "Analyze src/api/ and create comprehensive API documentation in docs/api.md"
});
```

### `background_output`

Retrieve results from a task or check its status.

**Parameters:**
- `task_id` (string) - Task ID from background_task
- `block` (boolean, optional) - Wait for completion (default: false)
- `timeout` (number, optional) - Max wait time in ms (default: 60000, max: 600000)

**Returns:** Task status, results, or progress info

**Example:**
```typescript
await background_output({ task_id: "bg_abc12345" });
```

### `background_cancel`

Cancel running background task(s).

**Parameters:**
- `taskId` (string, optional) - Task ID to cancel
- `all` (boolean, optional) - Cancel all running tasks (default: false)

**Example:**
```typescript
// Cancel specific task
await background_cancel({ taskId: "bg_abc12345" });

// Cancel all running tasks
await background_cancel({ all: true });
```

## Configuration

The plugin works out of the box with sensible defaults. Future versions will add configuration options.

## Use Cases

### 1. Parallel Research

```typescript
// Launch multiple scouts in parallel
await background_task({
  description: "Research GraphQL",
  agent: "scout",
  prompt: "Research GraphQL best practices and create wiki page"
});

await background_task({
  description: "Research REST APIs",
  agent: "scout",
  prompt: "Research REST API design patterns and create wiki page"
});

// Continue coding while both research tasks run
```

### 2. Async Documentation

```typescript
// Update docs while you work on features
await background_task({
  description: "Update README",
  agent: "document-writer",
  prompt: "Update README.md with new features from CHANGELOG.md"
});

// Keep coding, get notified when done
```

### 3. Multi-Agent Codebase Exploration

```typescript
// Fire 3 explore agents to search different areas
await background_task({
  description: "Find API endpoints",
  agent: "explore",
  prompt: "Find all API endpoint definitions in src/"
});

await background_task({
  description: "Find database models",
  agent: "explore",
  prompt: "Find all database model definitions"
});

await background_task({
  description: "Find React components",
  agent: "explore",
  prompt: "Find all React components in src/components/"
});
```

## How It Works

### Architecture

```
┌─────────────────────────────────────────────┐
│         BackgroundManager (Singleton)        │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Task Lifecycle Tracking              │  │
│  │  - running → completed/error/cancelled│  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Progress Monitoring                  │  │
│  │  - Event-driven (real-time)           │  │
│  │  - Polling (every 2s, fallback)       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Notification Queue                   │  │
│  │  - Per-session isolation              │  │
│  │  - Delivered on parent idle           │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
          ↓                      ↓
    ┌──────────┐          ┌──────────┐
    │  Tools   │          │  Hooks   │
    └──────────┘          └──────────┘
```

### Task Lifecycle

1. **Launch** - `background_task` creates child session with agent
2. **Track** - Manager monitors via events + polling
3. **Detect completion** - Idle state + optional todo check
4. **Notify** - Toast (if available) + prompt injection (fallback)
5. **Retrieve** - `background_output` fetches results
6. **Cleanup** - Session deletion triggers cleanup

### Dual-Mode Detection

The plugin uses **both** event-driven and polling approaches:

- **Events** - Immediate updates when available (faster)
- **Polling** - 2-second interval fallback (reliable)

Why both? Because todo-continuation-enforcer might add todos *after* the session.idle event fires, so we need polling to double-check.

### Notification Strategy

1. **Try TUI toast** (if enabled and API available)
2. **Fall back to prompt injection** (always works)
3. **Mark as delivered** to prevent duplicates

## Integration with Other Plugins

The background tasks plugin works well with other cursed-code plugins:

- **scout** - Research tasks that take time
- **explore** - Codebase exploration in parallel
- **wikify** - Documentation generation

Future versions may add explicit integration with todo-continuation-enforcer for todo-aware completion detection.

## Development

```bash
# Install dependencies
bun install

# Type check
bun run typecheck

# Build
bun run build

# Clean
bun run clean
```

## API

### BackgroundManager

The manager that orchestrates all background tasks.

```typescript
import { BackgroundManager } from '@cursed/background-tasks';

// Created automatically by the plugin
// Access via plugin context if needed

// Launch task
const task = await manager.launch({
  description: 'Task description',
  agent: 'scout',
  prompt: 'Detailed prompt...',
  parentSessionID: ctx.sessionID,
  parentMessageID: ctx.messageID,
});

// Get task status
const task = manager.getTask(taskId);

// Get all tasks for session
const tasks = manager.getTasksByParentSession(parentSessionId);
```

### BackgroundTask

Task object structure:

```typescript
interface BackgroundTask {
  id: string;                    // Task ID (e.g., "bg_abc12345")
  sessionID: string;             // Child session ID
  parentSessionID: string;       // Parent session ID
  parentMessageID: string;       // Parent message ID
  description: string;           // Task description
  prompt: string;                // Full prompt sent to agent
  agent: string;                 // Agent name
  status: 'running' | 'completed' | 'error' | 'cancelled';
  startedAt: Date;               // Start timestamp
  completedAt?: Date;            // Completion timestamp
  error?: string;                // Error message if failed
  progress?: TaskProgress;       // Progress tracking info
}

interface TaskProgress {
  toolCalls: number;             // Number of tool calls made
  lastTool?: string;             // Last tool used
  lastUpdate: Date;              // Last progress update
  lastMessage?: string;          // Last assistant message
  lastMessageAt?: Date;          // When last message was sent
}
```

## Troubleshooting

### Tasks not completing

- Check if agent is actually going idle (may be stuck in loop)
- Verify agent has proper exit conditions
- Use `background_output` to check status and tool call count
- Consider enabling `todoAware` if using todo-continuation-enforcer

### No notifications

- Check if `notifications` config is enabled
- Verify OpenCode toast API is available (falls back to prompt)
- Check console for errors

### Too many concurrent tasks

- Set `maxConcurrent` in config
- Use `background_cancel` to stop unnecessary tasks
- Consider queuing tasks instead of launching all at once

## License

MIT

## Credits

Adapted from [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)'s background task system with improvements for cursed-code's à la carte philosophy.
