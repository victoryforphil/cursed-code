# Agentic Prompting Best Practices

Distilled rules for writing effective prompts for AI agents.

## Agentic Workflow Prompting

### System Prompt Structure

```
1. Role & Identity
   - Who the agent is
   - Domain expertise
   - Behavioral persona

2. Goals & Objectives  
   - Primary mission
   - Success criteria
   - What to optimize for

3. Available Tools
   - Tool descriptions with return formats
   - When to use each tool
   - Examples for complex tools

4. Rules & Constraints
   - MUST do (required behaviors)
   - NEVER do (prohibited actions)
   - Decision criteria

5. Output Format
   - Expected structure
   - Tags/delimiters
   - Error handling
```

### Tool Definition Rules

- **Name clearly:** Use descriptive, searchable names (`search_customer_orders` not `query_db`)
- **Describe fully:** 3-4 sentences minimum covering:
  - What the tool does
  - When to use it (and when not to)
  - What each parameter means
  - What it returns (with types and structure)
- **Provide examples:** For complex nested structures or many optional parameters
- **Document return format:** Include field names, types, and possible values

```json
{
  "name": "get_orders",
  "description": "Retrieve orders for a customer.
Returns:
    List of order objects, each containing:
    - id (str): Order identifier
    - total (float): Order total in USD
    - status (str): One of 'pending', 'shipped', 'delivered'
    - items (list): Array of {sku, quantity, price}
    - created_at (str): ISO 8601 timestamp"
}
```

### Multi-Step Workflows

1. Break complex operations into clear, sequential steps
2. Provide checklists for long workflows that agent can track
3. Use explicit handoff instructions between phases
4. Include verification steps (don't trust, verify)
5. Define rollback/error recovery procedures

### Agent Memory & State

- Track historical context for multi-turn interactions
- Use structured state objects between tool calls
- Implement "Learn Once, Apply Many" - don't rediscover patterns
- Compact context when approaching limits

## Efficient Prompting

### Token Optimization

- **Front-load important info:** Put critical context first
- **Use structured formats:** XML/JSON more parseable than prose
- **Eliminate redundancy:** Don't repeat instructions
- **Use references:** "As defined above" instead of repeating
- **Prefer examples over explanations:** One good example > paragraphs of description
- **Use progressive disclosure:** Load detailed info on-demand

### Clarity & Precision

- **Be explicit:** Don't assume the model knows what you want
- **State the obvious:** "Required vs optional", "Quality standards"
- **Use concrete examples:** Not abstract descriptions
- **Avoid ambiguity:** "Scale of 1-5" not "rate the priority"
- **Repeat key points:** Especially in long prompts
- **Use delimiters:** XML tags, triple backticks, dashes

### Reducing Ambiguity

- Specify output format explicitly
- Provide negative examples ("Don't do X")
- Use enums for constrained values
- Include edge case handling
- State assumptions explicitly

## Style Enforcement

### Structured Outputs

**For JSON:**
- Use JSON Schema with `strict: true`
- Define all required fields
- Use enums for constrained values
- Set `additionalProperties: false`

**For text:**
- Use XML tags: `<response>`, `<reasoning>`, `<answer>`
- Prefill assistant turn with opening tag
- Specify exact format in instructions

### Tone & Voice

- Define communication style explicitly
- Provide voice examples
- List prohibited phrases/patterns
- Specify emoji/formatting rules

**Example:**
```
COMMUNICATION STYLE:
- NO emojis under any circumstances
- NO progress messages like "Perfect!", "Now let me..."
- NO descriptions of what was built
- Only respond AFTER all tools complete
```

### Consistency Rules

- Use consistent terminology throughout
- Maintain single voice (don't switch personas)
- Follow established patterns in codebase
- Reference existing conventions

## Prompt Evaluation

### Quality Metrics

1. **Task Success Rate:** Does output meet requirements?
2. **Format Compliance:** Does output match expected structure?
3. **Consistency:** Same input -> similar outputs?
4. **Efficiency:** Token usage for task completion
5. **Error Handling:** Graceful failure modes

### Evaluation Methods

**Automated:**
- Regex matching for format compliance
- JSON Schema validation
- Unit tests for expected outputs
- A/B testing with metrics

**Manual:**
- Human scoring (relevance, helpfulness, accuracy)
- Side-by-side comparison
- Edge case testing
- Adversarial probing

### Iteration Process

1. Start with simple prompt
2. Add context/instructions iteratively
3. Test with diverse inputs
4. Identify failure modes
5. Add guardrails for failures
6. Document what works (and what doesn't)

### Red Flags

- Inconsistent output format
- Missing required information
- Hallucinated data
- Ignoring instructions
- Over-explaining or under-explaining
- Wrong tone/voice

## Quick Reference

### Prompt Checklist

- [ ] Clear role definition
- [ ] Explicit goals/success criteria
- [ ] Tool descriptions with return formats
- [ ] MUST/NEVER rules
- [ ] Output format specification
- [ ] Examples for complex patterns
- [ ] Error handling instructions
- [ ] Verification/validation steps

### Common Patterns

| Pattern | Use Case |
|---------|----------|
| Role prompting | Domain expertise |
| Zero-shot CoT | Reasoning tasks |
| Few-shot | Format learning |
| XML tags | Structured output |
| JSON Schema | Type-safe responses |
| Checklists | Multi-step workflows |
| Prefilling | Force format compliance |

# Log
- 2024-12-16: Created from research synthesis
