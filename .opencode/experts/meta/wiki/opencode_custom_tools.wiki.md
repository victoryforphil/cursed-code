# OpenCode Custom Tools

Create functions the LLM can call alongside built-in tools (read, write, bash).

## Locations

- **Local**: `.opencode/tool/` - project-specific tools
- **Global**: `~/.config/opencode/tool/` - available everywhere

## Tool Structure

Use `tool()` helper for type-safety. Filename becomes tool name.

```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

### Multiple Tools Per File

Named exports create `<filename>_<exportname>` tools:

```ts
export const add = tool({ ... })      // → math_add
export const multiply = tool({ ... }) // → math_multiply
```

## Parameters (Zod Schema)

`tool.schema` is Zod. Common types:

```ts
args: {
  query: tool.schema.string().describe("SQL query"),
  count: tool.schema.number().describe("Row limit"),
}
```

Alternative: import Zod directly, export plain object:

```ts
import { z } from "zod"

export default {
  description: "Tool description",
  args: { param: z.string().describe("Param description") },
  async execute(args, context) { return "result" },
}
```

## Context Object

Second argument to `execute()`:

```ts
async execute(args, context) {
  const { agent, sessionID, messageID } = context
  // ...
}
```

| Property | Description |
|----------|-------------|
| `agent` | Current agent name |
| `sessionID` | Active session ID |
| `messageID` | Current message ID |

## Calling External Scripts

Tool definitions are TS/JS, but can invoke any language via shell.

### Python Example

`.opencode/tool/add.py`:
```python
import sys
a = int(sys.argv[1])
b = int(sys.argv[2])
print(a + b)
```

`.opencode/tool/python-add.ts`:
```ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Add two numbers using Python",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    const result = await Bun.$`python3 .opencode/tool/add.py ${args.a} ${args.b}`.text()
    return result.trim()
  },
})
```

Uses `Bun.$` shell utility for subprocess execution.

---

*Source: [docs/opencode_custom_tools_full.md](../docs/opencode_custom_tools_full.md)*

# Log
- 2024-12-16: Created from full documentation
