# OpenCode Commands Documentation

**Source:** https://opencode.ai/docs/commands

## Overview

Custom commands let you specify a prompt you want to run when that command is executed in the TUI.

```
/my-command
```

Custom commands are in addition to the built-in commands like `/init`, `/undo`, `/redo`, `/share`, `/help`.

## Creating Custom Commands

### Markdown Files
Create markdown files in the `command/` directory to define custom commands.

Create `.opencode/command/test.md`:

```yaml
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

The frontmatter defines command properties. The content becomes the template.

Use the command by typing `/` followed by the command name:
```
/test
```

## Configuring Commands

### JSON Configuration
Use the `command` option in your OpenCode config:

```jsonc
{
  "command": {
    // This becomes the name of the command
    "test": {
      // This is the prompt that will be sent to the LLM
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes.",
      // This is show as the description in the TUI
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

Run this command in the TUI with:
```
/test
```

### Markdown Configuration
Define commands using markdown files in:
- Global: `~/.config/opencode/command/`
- Per-project: `.opencode/command/`

Example: `~/.config/opencode/command/test.md`

```yaml
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---

Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

The markdown file name becomes the command name. For example, `test.md` lets you run:
```
/test
```

## Prompt Configuration

### Arguments
Pass arguments to commands using the `$ARGUMENTS` placeholder:

`.opencode/command/component.md`

```markdown
---
description: Create a new component
---

Create a new React component named $ARGUMENTS with TypeScript support.
Include proper typing and basic structure.
```

Run the command with arguments:
```
/component Button
```

And `$ARGUMENTS` will be replaced with `Button`.

Access individual arguments using positional parameters:
- `$1` - First argument
- `$2` - Second argument
- `$3` - Third argument
- And so on…

Example:

```markdown
---
description: Create a new file with content
---

Create a file named $1 in the directory $2 with the following content: $3
```

Run the command:
```
/create-file config.json src "{ \"key\": \"value\" }"
```

This replaces:
- `$1` with `config.json`
- `$2` with `src`
- `$3` with `{ "key": "value" }`

### Shell Output
Use *!`command`* to inject bash command output into your prompt:

Example command that analyzes test coverage:

```markdown
---
description: Analyze test coverage
---

Here are the current test results:
!`npm test`

Based on these results, suggest improvements to increase coverage.
```

Or to review recent changes:

```markdown
---
description: Review recent changes
---

Recent git commits:
!`git log --oneline -10`

Review these changes and suggest any improvements.
```

Commands run in your project's root directory and their output becomes part of the prompt.

### File References
Include files in your command using `@` followed by the filename:

```markdown
---
description: Review component
---

Review the component in @src/components/Button.tsx.
Check for performance issues and suggest improvements.
```

The file content gets included in the prompt automatically.

## Command Configuration Options

### Template (Required)
The `template` option defines the prompt that will be sent to the LLM when the command is executed:

```json
{
  "command": {
    "test": {
      "template": "Run the full test suite with coverage report and show any failures.\nFocus on the failing tests and suggest fixes."
    }
  }
}
```

### Description (Required)
Provide a brief description of what the command does:

```json
{
  "command": {
    "test": {
      "description": "Run tests with coverage"
    }
  }
}
```

This is shown as the description in the TUI when you type in the command.

### Agent
Optionally specify which agent should execute this command:

```json
{
  "command": {
    "review": {
      "agent": "plan"
    }
  }
}
```

If this is a subagent, the command will trigger a subagent invocation by default. To disable this behavior, set `subtask` to `false`.

### Subtask
Use the `subtask` boolean to force the command to trigger a subagent invocation:

```json
{
  "command": {
    "analyze": {
      "subtask": true
    }
  }
}
```

This is useful if you want the command to not pollute your primary context and will force the agent to act as a subagent, even if `mode` is set to `primary` on the agent configuration.

### Model
Override the default model for this command:

```json
{
  "command": {
    "analyze": {
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

## Built-in Commands

OpenCode includes several built-in commands:
- `/init` - Initialize OpenCode for the project
- `/undo` - Undo the last change
- `/redo` - Redo a change
- `/share` - Share the current session
- `/help` - Show help dialog

**Note:** Custom commands can override built-in commands. If you define a custom command with the same name, it will override the built-in command.

## Common Use Cases

### Run Tests with Coverage
```markdown
---
description: Run tests with coverage
agent: build
---

Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

### Create Component
```markdown
---
description: Create a new React component
---

Create a new React component named $ARGUMENTS with TypeScript support.
Include proper typing and PropTypes or TypeScript interfaces for props.
```

### Code Review
```markdown
---
description: Review code for best practices
agent: plan
---

Review the changes for this session and provide feedback on:
- Code quality and best practices
- Performance implications
- Security considerations
- Testing coverage
```

### Generate Documentation
```markdown
---
description: Generate API documentation
---

Generate comprehensive API documentation for the functions in this session.
Include JSDoc comments, parameter descriptions, and usage examples.
```

---

**Last Updated:** Dec 16, 2025
**Source URL:** https://opencode.ai/docs/commands
