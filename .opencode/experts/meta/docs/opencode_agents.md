# OpenCode Agents Documentation

**Source:** https://opencode.ai/docs/agents

## Overview

Agents are specialized AI assistants that can be configured for specific tasks and workflows. They allow you to create focused tools with custom prompts, models, and tool access.

## Types of Agents

### Primary Agents
Primary agents are the main assistants you interact with directly. You can cycle through them using the **Tab** key, or your configured `switch_agent` keybind. These agents handle your main conversation and can access all configured tools.

OpenCode comes with two built-in primary agents: **Build** and **Plan**.

### Subagents
Subagents are specialized assistants that primary agents can invoke for specific tasks. You can also manually invoke them by **@ mentioning** them in your messages.

OpenCode comes with two built-in subagents: **General** and **Explore**.

## Built-in Agents

### Build
- **Mode:** `primary`
- **Description:** The default primary agent with all tools enabled. Standard agent for development work where you need full access to file operations and system commands.

### Plan
- **Mode:** `primary`
- **Description:** A restricted agent designed for planning and analysis. By default, all of the following are set to `ask`:
  - File edits: All writes, patches, and edits
  - Bash: All bash commands
- **Use Case:** When you want the LLM to analyze code, suggest changes, or create plans without making modifications to your codebase.

### General
- **Mode:** `subagent`
- **Description:** A general-purpose agent for researching complex questions, searching for code, and executing multi-step tasks.
- **Use Case:** When searching for keywords or files and you're not confident you'll find the right match in the first few tries.

### Explore
- **Mode:** `subagent`
- **Description:** A fast agent specialized for exploring codebases.
- **Use Case:** When you need to quickly find files by patterns, search code for keywords, or answer questions about the codebase.

## Using Agents

1. For primary agents, use the **Tab** key to cycle through them during a session, or use your configured `switch_agent` keybind.

2. Subagents can be invoked:
   - **Automatically** by primary agents for specialized tasks based on their descriptions
   - Manually by **@ mentioning** them: `@general help me search for this function`

3. **Navigation between sessions:** When subagents create child sessions, navigate using:
   - **<Leader>+Right** (or configured `session_child_cycle`) to cycle forward
   - **<Leader>+Left** (or configured `session_child_cycle_reverse`) to cycle backward

## Configuring Agents

### JSON Configuration
Configure agents in your `opencode.json` config file:

```json
{
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514",
      "tools": {
        "write": false,
        "edit": false,
        "bash": false
      }
    },
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "tools": {
        "write": false,
        "edit": false
      }
    }
  }
}
```

### Markdown Configuration
Define agents using markdown files in:
- Global: `~/.config/opencode/agent/`
- Per-project: `.opencode/agent/`

Example: `~/.config/opencode/agent/review.md`

```yaml
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
---

You are in code review mode. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

The markdown file name becomes the agent name (e.g., `review.md` creates a `review` agent).

## Agent Configuration Options

### Description
Provide a brief description of what the agent does and when to use it. **Required** for custom agents.

```json
{
  "agent": {
    "review": {
      "description": "Reviews code for best practices and potential issues"
    }
  }
}
```

### Temperature
Control randomness and creativity of LLM responses:

```json
{
  "agent": {
    "plan": {
      "temperature": 0.1
    },
    "creative": {
      "temperature": 0.8
    }
  }
}
```

Typical ranges:
- **0.0-0.2:** Very focused and deterministic, ideal for code analysis and planning
- **0.3-0.5:** Balanced responses with some creativity, good for general development
- **0.6-1.0:** More creative and varied, useful for brainstorming

Default: Model-specific (typically 0 for most models, 0.55 for Qwen models)

### Max Steps
Control maximum number of agentic iterations before forced text-only response:

```json
{
  "agent": {
    "quick-thinker": {
      "description": "Fast reasoning with limited iterations",
      "prompt": "You are a quick thinker. Solve problems with minimal steps.",
      "maxSteps": 5
    }
  }
}
```

### Disable
Set to `true` to disable an agent:

```json
{
  "agent": {
    "review": {
      "disable": true
    }
  }
}
```

### Prompt
Specify a custom system prompt file:

```json
{
  "agent": {
    "review": {
      "prompt": "{file:./prompts/code-review.txt}"
    }
  }
}
```

Path is relative to config file location.

### Model
Override the model for this agent:

```json
{
  "agent": {
    "plan": {
      "model": "anthropic/claude-haiku-4-20250514"
    }
  }
}
```

**Note:** If not specified, primary agents use globally configured model, while subagents use the model of the invoking primary agent.

### Tools
Control which tools are available:

```json
{
  "tools": {
    "write": true,
    "bash": true
  },
  "agent": {
    "plan": {
      "tools": {
        "write": false,
        "bash": false
      }
    }
  }
}
```

Agent-specific config overrides global config. Supports wildcards: `mymcp_*`

### Permissions
Configure permissions to manage what actions an agent can take:

```json
{
  "permission": {
    "edit": "deny"
  },
  "agent": {
    "build": {
      "permission": {
        "edit": "ask"
      }
    }
  }
}
```

Options:
- `"ask"` — Prompt for approval before running
- `"allow"` — Allow without approval
- `"deny"` — Disable the tool

Supports glob patterns for bash commands:

```json
{
  "agent": {
    "build": {
      "permission": {
        "bash": {
          "git push": "ask",
          "git status": "allow",
          "*": "deny"
        }
      }
    }
  }
}
```

### Mode
Control how the agent can be used:

```json
{
  "agent": {
    "review": {
      "mode": "subagent"
    }
  }
}
```

Options: `primary`, `subagent`, or `all` (default: `all`)

### Additional Options
Any other options are passed directly to the provider as model options:

```json
{
  "agent": {
    "deep-thinker": {
      "description": "Agent that uses high reasoning effort for complex problems",
      "model": "openai/gpt-5",
      "reasoningEffort": "high",
      "textVerbosity": "low"
    }
  }
}
```

## Creating New Agents

Use the interactive command:

```bash
opencode agent create
```

This will:
1. Ask where to save the agent (global or project-specific)
2. Ask for a description
3. Generate an appropriate system prompt and identifier
4. Let you select which tools the agent can access
5. Create a markdown file with the agent configuration

## Use Cases

- **Build agent:** Full development work with all tools enabled
- **Plan agent:** Analysis and planning without making changes
- **Review agent:** Code review with read-only access plus documentation tools
- **Debug agent:** Investigation with bash and read tools enabled
- **Docs agent:** Documentation writing with file operations but no system commands

## Example Agents

### Documentation Agent

```markdown
---
description: Writes and maintains project documentation
mode: subagent
tools:
  bash: false
---

You are a technical writer. Create clear, comprehensive documentation.
Focus on:
- Clear explanations
- Proper structure
- Code examples
- User-friendly language
```

### Security Auditor

```markdown
---
description: Performs security audits and identifies vulnerabilities
mode: subagent
tools:
  write: false
  edit: false
---

You are a security expert. Focus on identifying potential security issues.
Look for:
- Input validation vulnerabilities
- Authentication and authorization flaws
- Data exposure risks
- Dependency vulnerabilities
- Configuration security issues
```

---

**Last Updated:** Dec 16, 2025
**Source URL:** https://opencode.ai/docs/agents
