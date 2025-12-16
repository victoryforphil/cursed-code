# Agentic Prompting Research Notes

**Date:** 2024-12-16
**Sources:** Anthropic, OpenAI, DAIR.AI Prompt Engineering Guide, GitHub patterns

## Key Insights

### Context Engineering > Prompt Engineering

The field is shifting from "prompt engineering" to "context engineering" - recognizing that effective agent prompts require:
- Designing prompt chains
- Managing dynamic elements (user inputs, date/time, state)
- Tool definitions and instructions
- Short-term memory (state/historical context)
- Long-term memory (retrieval from vector stores)
- Structured inputs/outputs

> **Note:** "Blind prompting" (just asking questions) is different from proper context engineering which requires thinking carefully about structure and context.

### Tool Definition Best Practices

From Anthropic's advanced tool use documentation:

**Good tool definition:**
```json
{
    "name": "search_customer_orders",
    "description": "Search for customer orders by date range, status, or total amount. Returns order details including items, shipping, and payment info."
}
```

**Bad tool definition:**
```json
{
    "name": "query_db_orders",
    "description": "Execute order query"
}
```

Key elements:
- Clear, searchable name
- Description of what it does AND what it returns
- Document return format in description
- Include input_examples for complex structures
- Aim for 3-4 sentences minimum per tool description

### Role Prompting

From Anthropic tutorial:
- Assigning specific roles (e.g., "logic bot") dramatically improves task performance
- Role prompting works for complex reasoning tasks
- Use system prompts to define persona and expertise

### Chain-of-Thought Patterns

**Zero-shot CoT:** Simply add "Let's think step by step" - activates reasoning without examples

**Few-shot CoT:** One example with detailed reasoning is often sufficient

**Tree of Thoughts:** Simulate multiple experts reasoning step-by-step, exiting when wrong

### Style Enforcement

From OpenAI structured outputs:
- Use JSON Schema with `strict: true` for guaranteed conformance
- Structured Outputs > JSON mode (ensures schema adherence, not just valid JSON)
- Benefits: Type-safety, explicit refusals, simpler prompting

From Anthropic:
- Use XML tags for structured output (`<haiku>`, `<response>`, etc.)
- Prefill assistant turn with opening tag to force format
- Custom tags make parsing programmatic

### Agent Evaluation

From DAIR.AI:
- Human annotation (honesty, helpfulness, engagement)
- Turing test (human vs agent comparison)
- Metrics: task success, human similarity, efficiency
- Protocols: real-world simulation, social evaluation, multi-task

### Real-World Patterns from GitHub

From examining AGENTS.md files across projects:

**Common patterns:**
1. Clear role definition at start
2. Explicit rules with MUST/NEVER
3. Module/directory structure documentation
4. Naming conventions
5. Build/test requirements
6. Communication style guidelines

**Example structure (from Coder):**
```
# Foundational rules
- Doing it right > doing it fast
- Tedious work is often correct
- Honesty is core value

# Our relationship
- Act as critical peer reviewer
- Speak up when you don't know
- Call out bad ideas
- Never be agreeable just to be nice
```

## Gotchas and Edge Cases

1. **Few-shot CoT can hurt performance** - For tasks not requiring expert knowledge, zero-shot often outperforms few-shot CoT

2. **Forcing templates can reduce performance** - In early GPT-3.5 testing, forcing strict templates lowered F1 scores (this behavior changed with GPT-4)

3. **Small modifications have outsized impact** - Even giving the model a human name and referring to it as such increased F1 by 0.6 points

4. **Tool choice complexity** - Use `tool_choice: auto` by default, `required` when you need guaranteed function calls, specific tool for forced invocation

## Questions for Follow-up

- [ ] How do multi-agent handoffs affect prompting?
- [ ] What's the optimal balance between instruction length and context efficiency?
- [ ] How to evaluate prompt quality without manual review?
- [ ] Best practices for prompt version control?

## Connections

- Relates to: SWE Workflow (planner/architect/coder pipeline)
- Relates to: Local Models (prompting differences for OSS models)
- Relates to: Meta (OpenCode agent configuration)

# Log
- 2024-12-16: Initial research from Anthropic, OpenAI, DAIR.AI sources
