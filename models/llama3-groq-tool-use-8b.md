# llama3-groq-tool-use:8b

## Overview
Best function calling model for M1 Max 32GB. Optimized for reliable tool use.

## Stats
- **Size**: 4.7 GB (Q4_K_M quantization)
- **Parameters**: 8B
- **Context**: 8K
- **Quantization**: Q4_K_M (default)
- **Architecture**: Llama 3 (Groq fine-tuned)

## Performance on M1 Max 32GB
- **Speed**: 20-28 tokens/sec
- **Memory Usage**: 4-5 GB
- **Quality**: 9.5/10 for tool use

## Benchmarks
- **BFCL Score**: 89.06% (ranks 3rd globally)
- **Function Calling**: Best-in-class
- **Reliability**: Exceptional

## Use Cases
- ✅ Agent systems
- ✅ Function/tool calling
- ✅ API interactions
- ✅ Structured output generation
- ✅ Multi-step workflows
- ✅ Command execution

## Strengths
- Extremely reliable function calls
- Fast inference speed
- Low memory footprint
- Accurate parameter extraction
- Handles complex tool schemas

## Example Prompts
```
Call the search_files function to find all TypeScript files
```

```
Use the git_commit tool to commit these changes with a proper message
```

```
Execute the database_query function with these parameters
```

## Usage Notes
- Perfect for OpenCode agents
- Minimal hallucination on function calls
- Great for structured tasks
- Can run alongside 32B models (only 4.7GB)
- Ideal for quick tool-based tasks

## Performance Tips
- Use for any task requiring function calling
- Combine with larger models for reasoning + execution
- Great for CLI tools and automation
- Fast enough for interactive use
- Keep prompts focused on the tool/action

## Workflow Integration
**Ideal pattern**:
1. Use deepseek-r1:32b or qwen2.5-coder:32b for planning
2. Use llama3-groq-tool-use:8b for execution
3. Fast, reliable, efficient

**Agent workflows**:
- Decision making: 32B models
- Tool execution: llama3-groq-tool-use:8b
- Best of both worlds

## OpenCode Integration
Perfect for custom agents that need to:
- Call multiple tools
- Parse structured data
- Execute commands reliably
- Handle API interactions

## Installed
- **Date**: 2024-12-16
- **ID**: 36211dad2b15
- **Active Use**: Function calling, agents, automation

# Log
- 2024-12-16: Downloaded and configured
