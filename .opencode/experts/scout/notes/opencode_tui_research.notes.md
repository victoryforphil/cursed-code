# OpenCode TUI Plugin Capabilities Research

**Date:** 2024-12-16  
**Topic:** TUI events, sidebar, toasts, and persistent UI elements for plugins

---

## Executive Summary

OpenCode's TUI plugin system provides **limited but useful** UI integration options. There is **NO sidebar content API**, **NO custom panel/widget system**, and **NO persistent status bar** API for plugins. The primary mechanisms are:

1. **Toast notifications** - transient alerts
2. **TUI events** - receive notifications about TUI actions
3. **Tool output injection** - append text to tool results
4. **Session prompts** - inject messages into conversations

---

## 1. Toast Notification API

### Endpoint
```
POST /tui/show-toast
```

### SDK Usage
```typescript
await client.tui.showToast({
  body: {
    title: "Optional Title",      // optional
    message: "Required message",  // required
    variant: "success",           // "info" | "success" | "warning" | "error"
    duration: 5000,               // optional, milliseconds
  },
})
```

### From Plugin Context
```typescript
// In plugin:
await ctx.client.tui.showToast({
  body: {
    title: "Task Completed",
    message: "Background work finished",
    variant: "success",
    duration: 5000,
  },
}).catch(() => {})
```

### Gotcha
The client may need to be cast for TypeScript:
```typescript
const tuiClient = ctx.client as any
if (tuiClient.tui?.showToast) {
  tuiClient.tui.showToast({ ... })
}
```

---

## 2. TUI Events

### Available Events
Plugins can subscribe to these TUI events:

| Event | Description |
|-------|-------------|
| `tui.prompt.append` | Text appended to prompt |
| `tui.command.execute` | Command executed in TUI |
| `tui.toast.show` | Toast notification shown |

### Listening to Events
```typescript
export const MyPlugin: Plugin = async (ctx) => {
  return {
    event: async ({ event }) => {
      if (event.type === "tui.toast.show") {
        console.log("Toast was shown:", event.properties)
      }
    },
  }
}
```

---

## 3. Sidebar

### Reality Check
The sidebar **EXISTS** but has **NO plugin API** for custom content.

### What Sidebar Does
- Toggle via `<leader>b` (ctrl+x b)
- Shows session history/navigation
- Built-in to the TUI, not extensible

### Configuration
```json
{
  "keybinds": {
    "sidebar_toggle": "<leader>b"
  }
}
```

---

## 4. Persistent UI Workarounds

Since there's no native sidebar/panel API, oh-my-opencode uses these patterns:

### Pattern A: Tool Output Injection
Append status info to tool outputs:
```typescript
"tool.execute.after": async (input, output) => {
  const usage = await getContextUsage(ctx, input.sessionID)
  output.output += `\n\n[Context Status: ${usage.percent}% used]`
}
```

### Pattern B: Startup Toast
Show version/status on session start:
```typescript
event: async ({ event }) => {
  if (event.type === "session.created") {
    await ctx.client.tui.showToast({
      body: {
        title: "Plugin v1.0.0",
        message: "Loaded successfully",
        variant: "info",
      },
    })
  }
}
```

### Pattern C: Session Prompt Injection
Inject persistent context into conversations:
```typescript
await ctx.client.session.prompt({
  path: { id: sessionID },
  body: {
    noReply: true,  // Don't trigger AI response
    parts: [{ type: "text", text: "[Usage Stats: ...]" }],
  },
})
```

---

## 5. Full TUI API Reference

### Available TUI Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tui/append-prompt` | Append text to current prompt |
| `POST` | `/tui/clear-prompt` | Clear the prompt |
| `POST` | `/tui/submit-prompt` | Submit current prompt |
| `POST` | `/tui/execute-command` | Execute a slash command |
| `POST` | `/tui/show-toast` | Show toast notification |
| `POST` | `/tui/open-help` | Open help dialog |
| `POST` | `/tui/open-sessions` | Open session selector |
| `POST` | `/tui/open-themes` | Open theme selector |
| `POST` | `/tui/open-models` | Open model selector |
| `GET` | `/tui/control/next` | Wait for control request |
| `POST` | `/tui/control/response` | Respond to control request |

---

## 6. Displaying Usage Stats - Recommendations

### Option 1: Periodic Toast (Simple)
Show stats via toast on significant events:
```typescript
event: async ({ event }) => {
  if (event.type === "session.idle") {
    const stats = await calculateStats(ctx)
    await ctx.client.tui.showToast({
      body: {
        title: "Session Stats",
        message: `Tokens: ${stats.tokens} | Cost: $${stats.cost}`,
        variant: "info",
        duration: 3000,
      },
    })
  }
}
```

### Option 2: Tool Output Footer (Context-aware)
Add to every tool result for agent visibility:
```typescript
"tool.execute.after": async (input, output) => {
  const stats = await getStats(input.sessionID)
  output.output += `\n\n---\n[Session: ${stats.tokens} tokens, $${stats.cost}]`
}
```

### Option 3: Custom Command (On-demand)
Create a `/stats` command:
```typescript
// In opencode.json commands section + plugin tool
tool: {
  session_stats: {
    description: "Show current session statistics",
    args: {},
    execute: async (args, ctx) => {
      const stats = await calculateStats(ctx)
      return `Session Statistics:
- Tokens: ${stats.inputTokens} in / ${stats.outputTokens} out
- Cost: $${stats.cost}
- Duration: ${stats.duration}`
    },
  },
}
```

---

## 7. Limitations

- **No sidebar content API** - Cannot add custom panels
- **No status bar API** - Cannot show persistent indicators
- **No widget system** - No custom UI components
- **Toast is transient** - Disappears after duration
- **Events are informational** - Cannot modify TUI behavior

---

## 8. Future Possibilities

Based on the architecture, potential future features might include:
- Custom panel registration via plugin API
- Status bar widget slots
- Sidebar sections for plugins
- Persistent notification areas

These would require core OpenCode changes.

---

## Sources
- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/sdk/
- https://opencode.ai/docs/server/
- https://opencode.ai/docs/tui/
- oh-my-opencode source code analysis
- Context7 /sst/opencode documentation
