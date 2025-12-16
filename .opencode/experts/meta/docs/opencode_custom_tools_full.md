# Source: https://opencode.ai/docs/custom-tools
# Downloaded: 2025-12-16T09:47:00.985Z

Custom Tools | OpenCode
  
  [Skip to content](#_top)     [     OpenCode  ](/)    [Home](/)[Docs](/docs/)    [  ](https://github.com/sst/opencode)[  ](https://opencode.ai/discord)     Search  CtrlK       Cancel                                -  [ Intro  ](/docs/) 
-  [ Config  ](/docs/config/) 
-  [ Providers  ](/docs/providers/) 
-  [ Network  ](/docs/network/) 
-  [ Enterprise  ](/docs/enterprise/) 
-  [ Troubleshooting  ](/docs/troubleshooting/) 
-  [ Migrating to 1.0  ](/docs/1-0/) 
-      Usage       [ TUI  ](/docs/tui/) 
-  [ CLI  ](/docs/cli/) 
-  [ IDE  ](/docs/ide/) 
-  [ Zen  ](/docs/zen/) 
-  [ Share  ](/docs/share/) 
-  [ GitHub  ](/docs/github/) 
-  [ GitLab  ](/docs/gitlab/) 
    -      Configure       [ Tools  ](/docs/tools/) 
-  [ Rules  ](/docs/rules/) 
-  [ Agents  ](/docs/agents/) 
-  [ Models  ](/docs/models/) 
-  [ Themes  ](/docs/themes/) 
-  [ Keybinds  ](/docs/keybinds/) 
-  [ Commands  ](/docs/commands/) 
-  [ Formatters  ](/docs/formatters/) 
-  [ Permissions  ](/docs/permissions/) 
-  [ LSP Servers  ](/docs/lsp/) 
-  [ MCP servers  ](/docs/mcp-servers/) 
-  [ ACP Support  ](/docs/acp/) 
-  [ Custom Tools  ](/docs/custom-tools/) 
    -      Develop       [ SDK  ](/docs/sdk/) 
-  [ Server  ](/docs/server/) 
-  [ Plugins  ](/docs/plugins/) 
-  [ Ecosystem  ](/docs/ecosystem/) 
              [GitHub](https://github.com/sst/opencode)[Dscord](https://opencode.ai/discord)     Select theme   DarkLightAuto                      On this page -  [ Overview ](#_top)  
-  [ Creating a tool ](#creating-a-tool)   [ Location ](#location)  
-  [ Structure ](#structure)  
-  [ Arguments ](#arguments)  
-  [ Context ](#context)  
   -  [ Examples ](#examples)   [ Write a tool in Python ](#write-a-tool-in-python)  
     
## On this page
 -  [ Overview ](#_top)  
-  [ Creating a tool ](#creating-a-tool)   [ Location ](#location)  
-  [ Structure ](#structure)  
-  [ Arguments ](#arguments)  
-  [ Context ](#context)  
   -  [ Examples ](#examples)   [ Write a tool in Python ](#write-a-tool-in-python)  
                # Custom Tools
Create tools the LLM can call in opencode.

       Custom tools are functions you create that the LLM can call during conversations. They work alongside opencode’s [built-in tools](/docs/tools) like `read`, `write`, and `bash`.

## [Creating a tool](#creating-a-tool)

Tools are defined as **TypeScript** or **JavaScript** files. However, the tool definition can invoke scripts written in **any language** — TypeScript or JavaScript is only used for the tool definition itself.

### [Location](#location)

They can be defined:

- Locally by placing them in the `.opencode/tool/` directory of your project.

- Or globally, by placing them in `~/.config/opencode/tool/`.

### [Structure](#structure)

The easiest way to create tools is using the `tool()` helper which provides type-safety and validation.

.opencode/tool/database.ts```
import { tool } from "@opencode-ai/plugin"
export default tool({  description: "Query the project database",  args: {    query: tool.schema.string().describe("SQL query to execute"),  },  async execute(args) {    // Your database logic here    return `Executed query: ${args.query}`  },})
```

The **filename** becomes the **tool name**. The above creates a `database` tool.

#### [Multiple tools per file](#multiple-tools-per-file)

You can also export multiple tools from a single file. Each export becomes **a separate tool** with the name **`&#x3C;filename>_&#x3C;exportname>`**:

.opencode/tool/math.ts```
import { tool } from "@opencode-ai/plugin"
export const add = tool({  description: "Add two numbers",  args: {    a: tool.schema.number().describe("First number"),    b: tool.schema.number().describe("Second number"),  },  async execute(args) {    return args.a + args.b  },})
export const multiply = tool({  description: "Multiply two numbers",  args: {    a: tool.schema.number().describe("First number"),    b: tool.schema.number().describe("Second number"),  },  async execute(args) {    return args.a * args.b  },})
```

This creates two tools: `math_add` and `math_multiply`.

### [Arguments](#arguments)

You can use `tool.schema`, which is just [Zod](https://zod.dev), to define argument types.

```
args: {  query: tool.schema.string().describe("SQL query to execute")}
```

You can also import [Zod](https://zod.dev) directly and return a plain object:

```
import { z } from "zod"
export default {  description: "Tool description",  args: {    param: z.string().describe("Parameter description"),  },  async execute(args, context) {    // Tool implementation    return "result"  },}
```

### [Context](#context)

Tools receive context about the current session:

.opencode/tool/project.ts```
import { tool } from "@opencode-ai/plugin"
export default tool({  description: "Get project information",  args: {},  async execute(args, context) {    // Access context information    const { agent, sessionID, messageID } = context    return `Agent: ${agent}, Session: ${sessionID}, Message: ${messageID}`  },})
```

## [Examples](#examples)

### [Write a tool in Python](#write-a-tool-in-python)

You can write your tools in any language you want. Here’s an example that adds two numbers using Python.

First, create the tool as a Python script:

.opencode/tool/add.py```
import sys
a = int(sys.argv[1])b = int(sys.argv[2])print(a + b)
```

Then create the tool definition that invokes it:

.opencode/tool/python-add.ts```
import { tool } from "@opencode-ai/plugin"
export default tool({  description: "Add two numbers using Python",  args: {    a: tool.schema.number().describe("First number"),    b: tool.schema.number().describe("Second number"),  },  async execute(args) {    const result = await Bun.$`python3 .opencode/tool/add.py ${args.a} ${args.b}`.text()    return result.trim()  },})
```

Here we are using the [`Bun.$`](https://bun.com/docs/runtime/shell) utility to run the Python script.

  
Edit this page

Find a bug? Open an issue

Join our Discord community
&copy; [Anomaly](https://anoma.ly)

Dec 16, 2025
