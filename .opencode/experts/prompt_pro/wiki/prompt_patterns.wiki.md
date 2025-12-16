# Prompt Patterns Reference

Quick reference for common prompting patterns and techniques.

## Reasoning Patterns

### Zero-Shot Chain-of-Thought

Add "Let's think step by step" to activate reasoning.

```
I went to the market and bought 10 apples. 
I gave 2 to the neighbor and 2 to the repairman. 
I bought 5 more and ate 1. How many do I have?

Let's think step by step.
```

### Tree of Thoughts

Simulate multiple experts reasoning collaboratively.

```
Imagine three different experts are answering this question.
All experts will write down 1 step of their thinking,
then share it with the group.
Then all experts will go on to the next step, etc.
If any expert realizes they're wrong at any point then they leave.
The question is...
```

### Role Prompting

Assign specific expertise to improve task performance.

```
You are a logic bot designed to answer complex logic problems.

Jack is looking at Anne. Anne is looking at George. 
Jack is married, George is not, and we don't know if Anne is married. 
Is a married person looking at an unmarried person?
```

## Output Formatting

### XML Tags

Use custom tags for structured, parseable output.

```
Write a haiku about {ANIMAL}. Put it in <haiku> tags.
```

With prefill to force format:
```
User: Write a haiku about cats. Put it in <haiku> tags.
Assistant: <haiku>
```

### Multiple Sections

Organize complex output with multiple tag types.

```
<summary>
Steps taken and reasoning
</summary>

<feedback>
Constructive feedback on tools
</feedback>

<response>
Final answer
</response>
```

### JSON Schema (OpenAI)

Force strict schema conformance.

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "response",
    "strict": true,
    "schema": {
      "type": "object",
      "properties": {
        "answer": {"type": "string"},
        "confidence": {"type": "number"}
      },
      "required": ["answer", "confidence"],
      "additionalProperties": false
    }
  }
}
```

## Tool Use Patterns

### Tool Choice Control

```json
// Let model decide
{"tool_choice": "auto"}

// Force tool use
{"tool_choice": "required"}

// Force specific tool
{
  "tool_choice": {
    "type": "function",
    "function": {"name": "get_weather"}
  }
}

// Disable tools
{"tool_choice": "none"}
```

### Tool Description Template

```json
{
  "name": "descriptive_action_name",
  "description": "What this tool does and when to use it. 
When NOT to use it.

Parameters:
- param1: Description and valid values
- param2: Description and format

Returns:
- field1 (type): Description
- field2 (type): Description

Example: Brief usage example",
  "parameters": {
    "type": "object",
    "properties": {...},
    "required": [...]
  }
}
```

### Agent Handoff

```json
{
  "name": "transferAgents",
  "description": "Transfer user to specialized agent.
Let the user know you're about to transfer them.

Available Agents:
- returns_agent
- product_specialist_agent",
  "parameters": {
    "rationale_for_transfer": "Why transfer is needed",
    "conversation_context": "Relevant context for recipient",
    "destination_agent": {
      "type": "string",
      "enum": ["returns_agent", "product_specialist_agent"]
    }
  }
}
```

## Agent System Prompts

### Minimal Structure

```
You are a {role} that {primary function}.

## Rules
- MUST: {required behaviors}
- NEVER: {prohibited actions}

## Tools
{tool descriptions}

## Output
{format requirements}
```

### Full Structure

```
# Identity
You are {name}, a {role} with expertise in {domain}.

# Context
{relevant background, date/time, environment}

# Goals
1. {primary objective}
2. {secondary objectives}

# Available Tools
{detailed tool descriptions}

# Rules
MUST:
- {required behavior 1}
- {required behavior 2}

NEVER:
- {prohibited action 1}
- {prohibited action 2}

# Workflow
1. {step 1}
2. {step 2}
3. {step 3}

# Output Format
{structure, tags, schema}

# Examples
{concrete examples of good output}
```

### Communication Style Block

```
<communication_style>
CRITICAL: Do NOT provide commentary between tool calls. Execute tools silently.
- NO emojis under any circumstances
- NO progress messages like "Perfect!", "Now let me...", "Excellent!"
- NO descriptions of what was built or how it works
- Only respond AFTER all tools are complete
- Response should only contain setup/usage information
</communication_style>
```

## Memory Patterns

### Context Memory Rules

```
## Context Memory Rules:
1. **Learn Once, Apply Many**: When you figure out how to do something, remember the exact steps
2. **Pattern Matching**: Recognize when new steps match patterns you've already learned
3. **Incremental Knowledge**: Each scenario adds to your understanding
4. **Don't Repeat Discovery**: If you learned X means Y, don't rediscover it
```

### State Management

```
## Current State
{JSON representation of current state}

## History
{Previous actions and their outcomes}

## Next Action
Based on state and history, determine next step.
```

# Log
- 2024-12-16: Created with patterns from research
