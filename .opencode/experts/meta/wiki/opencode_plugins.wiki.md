# OpenCode Plugin System

Comprehensive reference for extending OpenCode with plugins.

## Plugin Locations

Plugins are loaded from:
1. `.opencode/plugin/` (project-level)
2. `~/.config/opencode/plugin/` (global)

## Plugin Structure

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Hooks go here
  }
}
```

### Context Object
- `project` - Current project info
- `directory` - Working directory
- `worktree` - Git worktree path
- `client` - OpenCode SDK client
- `$` - Bun's shell API for commands

## Available Hooks

### `event` - Subscribe to Events
```typescript
event: async ({ event }) => {
  if (event.type === "session.idle") {
    // Session completed
  }
}
```

### `chat.params` - Modify LLM Parameters
```typescript
"chat.params": async (input, output) => {
  // input: { sessionID, agent, model, provider, message }
  // output: { temperature, topP, options }
  output.temperature = 0.3
}
```

### `tool.execute.before` - Pre-tool Hook
```typescript
"tool.execute.before": async (input, output) => {
  // input: { tool, sessionID, callID }
  // output: { args }
  if (input.tool === "read" && output.args.filePath.includes(".env")) {
    throw new Error("Access denied")
  }
}
```

### `tool.execute.after` - Post-tool Hook
```typescript
"tool.execute.after": async (input, output) => {
  // input: { tool, sessionID, callID }
  // output: { title, output, metadata }
  console.log(`Tool ${input.tool} completed`)
}
```

### `tool` - Custom Tools
```typescript
import { tool } from "@opencode-ai/plugin"

tool: {
  mytool: tool({
    description: "My custom tool",
    args: { foo: tool.schema.string() },
    async execute(args, ctx) {
      return `Hello ${args.foo}!`
    }
  })
}
```

### `permission.ask` - Permission Control
```typescript
"permission.ask": async (input, output) => {
  // input: Permission object
  // output: { status: "ask" | "deny" | "allow" }
}
```

### `config` - Modify Config
```typescript
config: async (input) => {
  // Modify configuration
}
```

## Available Events

### Session Events
- `session.created` - New session started
- `session.updated` - Session state changed (includes cost, tokens)
- `session.idle` - Session completed/waiting
- `session.status` - Status changed (working, retry, etc.)
- `session.compacted` - Context compacted
- `session.deleted` - Session removed
- `session.diff` - File diff updated
- `session.error` - Error occurred

### Message Events
- `message.updated` - Message changed
- `message.removed` - Message deleted
- `message.part.updated` - Part of message changed
- `message.part.removed` - Part removed

### Tool Events
- `tool.execute` - Tool being executed (via SDK events)
- `tool.result` - Tool completed (via SDK events)
- `tool.execute.before` - Pre-execution hook
- `tool.execute.after` - Post-execution hook

### File Events
- `file.edited` - File was modified
- `file.watcher.updated` - File system change detected

### Permission Events
- `permission.updated` - Permission requested
- `permission.replied` - Permission answered

### Other Events
- `command.executed` - Slash command run
- `installation.updated` - OpenCode updated
- `lsp.client.diagnostics` - LSP diagnostics
- `lsp.updated` - LSP state changed
- `server.connected` - Server connected
- `todo.updated` - Todo item changed
- `tui.prompt.append` - Text appended to prompt
- `tui.command.execute` - TUI command executed
- `tui.toast.show` - Toast notification

## Session Info (in session.updated)

```typescript
{
  id: string
  projectID: string
  directory: string
  parentID?: string  // For subagent sessions
  title: string
  version: string
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  summary?: {
    additions: number
    deletions: number
    files: number
    diffs?: FileDiff[]
  }
  share?: { url: string }
  cost: number       // Total cost in dollars
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}
```

## Message Info (with cost/tokens)

Assistant messages include per-step cost tracking:

```typescript
{
  id: string
  role: "assistant"
  modelID: string
  providerID: string
  mode: string  // Agent name
  parentID: string  // Parent message ID
  cost: number      // Cost for this message
  tokens: {
    input: number
    output: number
    reasoning: number
    cache: {
      read: number
      write: number
    }
  }
}
```

## Subagent Tracking

Subagent sessions have `parentID` pointing to parent session:

```typescript
// Create subagent session
Session.create({
  parentID: ctx.sessionID,  // Links to parent
  title: "Description (@agent subagent)"
})

// List child sessions
GET /session/:id/children
```

## SDK Event Subscription

```typescript
const events = client.event.subscribe()
for await (const event of events) {
  switch (event.type) {
    case "session.updated":
      console.log("Cost:", event.properties.info.cost)
      console.log("Tokens:", event.properties.info.tokens)
      break
    case "message.part.updated":
      if (event.properties.part.type === "text") {
        process.stdout.write(event.properties.part.text)
      }
      break
  }
}
```

## Usage Tracking Plugin Example

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const UsageTracker: Plugin = async ({ client }) => {
  const stats = {
    totalCost: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    sessions: new Map()
  }

  return {
    event: async ({ event }) => {
      if (event.type === "session.updated") {
        const { info } = event.properties
        stats.sessions.set(info.id, {
          cost: info.cost,
          tokens: info.tokens,
          parentID: info.parentID
        })
      }
      
      if (event.type === "session.idle") {
        // Aggregate including subagents
        let total = { cost: 0, input: 0, output: 0 }
        for (const [id, data] of stats.sessions) {
          total.cost += data.cost
          total.input += data.tokens.input
          total.output += data.tokens.output
        }
        console.log("Session complete:", total)
      }
    }
  }
}
```

## Key Limitations

1. **No `onRequest`/`onResponse` hooks** - Can't intercept raw LLM calls
2. **`chat.params` is pre-call only** - Modify params, not observe responses
3. **Token data via events** - Use `session.updated` for usage tracking
4. **Subagent costs separate** - Must aggregate manually via `parentID`

## Log
- 2025-12-16: Created from comprehensive research
