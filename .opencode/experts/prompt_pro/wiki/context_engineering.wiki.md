# Context Engineering Guide

Modern approach to building reliable AI agents through careful context design.

## What is Context Engineering?

Context engineering is the process of designing, testing, and iterating on all contextual information provided to AI agents. It goes beyond simple prompts to include:

- System prompts and instructions
- Tool definitions and descriptions
- Few-shot examples
- Dynamic context (user inputs, date/time, state)
- Retrieved knowledge (RAG)
- Memory (short-term and long-term)
- Structured inputs/outputs

## Key Principles

### 1. Make Expectations Explicit

Don't assume the agent knows what you want. Be explicit about:

```
Required vs. optional actions
Quality standards
Output formats
Decision-making criteria
Priority levels (e.g., "scale of 1-5" not just "rate priority")
```

### 2. Structure Inputs and Outputs

Use delimiters and schemas to clarify data boundaries.

**Input structuring:**
```xml
<user_request>
{user's original request}
</user_request>

<available_data>
{context the agent can use}
</available_data>

<constraints>
{limitations to respect}
</constraints>
```

**Output structuring:**
```xml
<reasoning>
{thought process}
</reasoning>

<answer>
{final response}
</answer>
```

### 3. Layer Context Hierarchically

```
Level 1: Core identity and capabilities (static)
Level 2: Session context (semi-dynamic)  
Level 3: Task-specific context (dynamic)
Level 4: Turn-specific context (ephemeral)
```

### 4. Validate Context Design

Before deployment:
- Test with diverse inputs
- Verify edge case handling
- Check for instruction conflicts
- Measure token efficiency
- Evaluate output consistency

## Context Components

### System Prompt Layers

```
IDENTITY
- Who the agent is
- Core personality/voice
- Fundamental values

CAPABILITIES  
- What tools are available
- What actions are possible
- What limitations exist

INSTRUCTIONS
- How to approach tasks
- Decision frameworks
- Quality standards

FORMATTING
- Output structure
- Communication style
- Error handling
```

### Tool Context

Every tool needs:
1. Clear, searchable name
2. Description of purpose
3. When to use (and when NOT to)
4. Parameter explanations
5. Return format documentation
6. Usage examples (for complex tools)

### Dynamic Context Management

```python
# Pseudo-pattern for dynamic context
context = {
    "static": system_prompt,
    "session": {
        "user_id": user.id,
        "preferences": user.preferences,
        "history_summary": summarize(conversation_history)
    },
    "task": {
        "current_goal": extract_goal(user_message),
        "relevant_docs": retrieve(user_message),
        "available_actions": get_permitted_actions(user)
    },
    "turn": {
        "user_message": message,
        "timestamp": now(),
        "previous_action_result": last_result
    }
}
```

## State and History

### Short-Term Memory

Manage conversation state within a session:

```
## Current State
{structured representation of where we are}

## Recent Actions
1. {action 1} -> {result 1}
2. {action 2} -> {result 2}

## Pending Tasks
- {task still to complete}
```

### Long-Term Memory

Retrieve relevant knowledge from persistent storage:
- Vector store for semantic search
- Structured DB for facts
- Previous session summaries
- User preferences and history

### Context Compaction

When approaching context limits:
1. Summarize older conversation turns
2. Remove redundant information
3. Keep only relevant retrieved docs
4. Preserve critical state information

## Iteration Process

### 1. Start Simple
Begin with minimal prompt, add complexity as needed.

### 2. Test Systematically
- Happy path scenarios
- Edge cases
- Adversarial inputs
- Multi-turn conversations

### 3. Identify Failures
Document when and why the agent fails:
- Missing context
- Conflicting instructions
- Ambiguous guidance
- Tool misuse

### 4. Refine Iteratively
- Add guardrails for known failure modes
- Clarify ambiguous instructions
- Add examples for complex patterns
- Remove unused context

### 5. Measure and Monitor
- Task success rate
- Token efficiency
- User satisfaction
- Error frequency

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Vague instructions | Be explicit about expectations |
| Too much context | Use progressive disclosure |
| Conflicting rules | Review for contradictions |
| Missing edge cases | Test with diverse inputs |
| Stale context | Update dynamic elements |
| Over-engineering | Start simple, add complexity |

## Checklist

- [ ] Clear identity and role definition
- [ ] Explicit success criteria
- [ ] Well-documented tools with examples
- [ ] Structured input/output formats
- [ ] Hierarchical context organization
- [ ] State management strategy
- [ ] Error handling instructions
- [ ] Validation test suite
- [ ] Iteration documentation

# Log
- 2024-12-16: Created from DAIR.AI context engineering guide
